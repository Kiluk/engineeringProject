// Gmail + keyword service with optional real OAuth (PKCE via react-native-app-auth)
// Best practice: use PKCE flow for mobile apps (no client secret) and request the
// `https://www.googleapis.com/auth/gmail.modify` scope to allow moving messages to trash.

const AsyncStorage = (() => {
  try {
    return require("@react-native-async-storage/async-storage").default;
  } catch (e) {
    return null;
  }
})();

let inMemoryKeywords = [];
let tokenStore = null; // { accessToken, accessTokenExpirationDate, refreshToken }

const STORAGE_KEYS = {
  KEYWORDS: "blocked_keywords",
  TOKEN: "gmail_token",
};

const KeywordService = {
  async getKeywords() {
    if (AsyncStorage) {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.KEYWORDS);
        if (raw) {
          inMemoryKeywords = JSON.parse(raw);
        }
      } catch (e) {
        // ignore and fallback to in-memory
      }
    }
    return inMemoryKeywords || [];
  },
  async addKeyword(k) {
    inMemoryKeywords = Array.from(new Set([...(inMemoryKeywords || []), k]));
    if (AsyncStorage) {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.KEYWORDS, JSON.stringify(inMemoryKeywords));
      } catch (e) {
        // ignore
      }
    }
  },
  async removeKeyword(k) {
    inMemoryKeywords = (inMemoryKeywords || []).filter((x) => x !== k);
    if (AsyncStorage) {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.KEYWORDS, JSON.stringify(inMemoryKeywords));
      } catch (e) {
        // ignore
      }
    }
  },
};

// GmailService implements two modes:
// - Real mode: if `react-native-app-auth` is installed and `GMAIL_OAUTH_CONFIG` is filled.
// - Prototype mode: fallback mocked data so UI and keyword logic can be tested without OAuth.

const GmailService = {
  async _loadToken() {
    if (tokenStore) return tokenStore;
    if (!AsyncStorage) return null;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (raw) {
        tokenStore = JSON.parse(raw);
        return tokenStore;
      }
    } catch (e) {
      return null;
    }
    return null;
  },
  async _saveToken(t) {
    tokenStore = t;
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, JSON.stringify(t));
    } catch (e) {
      // ignore
    }
  },
  async isAuthenticated() {
    const t = await this._loadToken();
    return !!(t && t.accessToken);
  },
  async connect() {
    // Try to use react-native-app-auth for OAuth PKCE. If not available or config missing,
    // fall back to prototype token so UI works.
    let AppAuth;
    try {
      AppAuth = require("react-native-app-auth");
    } catch (e) {
      // library not installed; set prototype token
      tokenStore = { accessToken: "prototype-token" };
      await this._saveToken(tokenStore);
      return { ok: true, mode: "prototype" };
    }

    // Configuration: the app must provide a config object with clientId and redirectUrl.
    // Add your OAuth client configuration below or provide via environment/config file.
    const GMAIL_OAUTH_CONFIG = global.GMAIL_OAUTH_CONFIG || {
      issuer: "https://accounts.google.com",
      clientId: "YOUR_CLIENT_ID.apps.googleusercontent.com",
      redirectUrl: "com.your.app:/oauthredirect", // replace with your app's redirect URI
      scopes: ["openid", "profile", "email", "https://www.googleapis.com/auth/gmail.modify"],
      additionalParameters: { access_type: "offline" },
    };

    if (!GMAIL_OAUTH_CONFIG.clientId || GMAIL_OAUTH_CONFIG.clientId.includes("YOUR_CLIENT_ID")) {
      // config not set up; fallback to prototype token
      tokenStore = { accessToken: "prototype-token" };
      await this._saveToken(tokenStore);
      return { ok: false, reason: "missing_config", mode: "prototype" };
    }

    try {
      const authState = await AppAuth.authorize(GMAIL_OAUTH_CONFIG);
      // authState includes accessToken, accessTokenExpirationDate, refreshToken, idToken
      await this._saveToken(authState);
      return { ok: true, mode: "real" };
    } catch (e) {
      console.warn("Gmail OAuth failed:", e);
      // fallback
      tokenStore = { accessToken: "prototype-token" };
      await this._saveToken(tokenStore);
      return { ok: false, reason: e.message, mode: "prototype" };
    }
  },
  async _ensureTokenValid() {
    // Basic refresh handling: use AppAuth.refresh if refreshToken exists and token expired.
    try {
      const t = await this._loadToken();
      if (!t) return null;
      // If token seems expired or near expiry, try refresh
      if (t.refreshToken && t.accessTokenExpirationDate) {
        const expire = new Date(t.accessTokenExpirationDate).getTime();
        const now = Date.now();
        // refresh if less than 60s remaining
        if (expire - now < 60000) {
          try {
            const AppAuth = require("react-native-app-auth");
            const cfg = global.GMAIL_OAUTH_CONFIG;
            const newState = await AppAuth.refresh(cfg, { refreshToken: t.refreshToken });
            // merge tokens
            const merged = { ...t, ...newState };
            await this._saveToken(merged);
            return merged;
          } catch (e) {
            console.warn("Token refresh failed:", e);
            return t;
          }
        }
      }
      return t;
    } catch (e) {
      return null;
    }
  },
  async fetchRecentEmails(maxResults = 20) {
    const t = await this._loadToken();
    if (!t || !t.accessToken || t.accessToken === "prototype-token") {
      // Prototype mock data
      return [
        { id: "1", subject: "Super okazja!!!", snippet: "Kup taniej niż kiedykolwiek" },
        { id: "2", subject: "Ciepły obiad u mamy", snippet: "Wpadaj na 12:00" },
        { id: "3", subject: "Wygrales nagrode", snippet: "Kliknij tu aby odebrac" },
      ];
    }

    // Ensure token is valid/refresh if needed
    const valid = await this._ensureTokenValid();
    if (!valid || !valid.accessToken) throw new Error("No access token available");

    const headers = { Authorization: `Bearer ${valid.accessToken}` };
    // 1) list messages
    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, { headers });
    if (!listRes.ok) {
      const text = await listRes.text();
      throw new Error(`Gmail list failed: ${listRes.status} ${text}`);
    }
    const listJson = await listRes.json();
    const messages = listJson.messages || [];

    // 2) fetch each message details (format=full gives headers and snippet)
    const detailed = await Promise.all(
      messages.map(async (m) => {
        try {
          const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`, { headers });
          if (!msgRes.ok) return { id: m.id, subject: "(failed)", snippet: "" };
          const msgJson = await msgRes.json();
          const headersArr = msgJson.payload && msgJson.payload.headers ? msgJson.payload.headers : [];
          const subjectHeader = headersArr.find((h) => h.name.toLowerCase() === "subject");
          const subject = subjectHeader ? subjectHeader.value : "(no subject)";
          const snippet = msgJson.snippet || "";
          return { id: m.id, subject, snippet };
        } catch (e) {
          return { id: m.id, subject: "(error)", snippet: "" };
        }
      })
    );

    return detailed;
  },
  async moveToTrash(messageId) {
    const t = await this._loadToken();
    if (!t || !t.accessToken || t.accessToken === "prototype-token") {
      console.log("(prototype) moveToTrash", messageId);
      return true;
    }

    const headers = { Authorization: `Bearer ${t.accessToken}`, "Content-Type": "application/json" };
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
      method: "POST",
      headers,
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to move to trash: ${res.status} ${txt}`);
    }
    return true;
  },
  async flagMessage(messageId) {
    const t = await this._loadToken();
    if (!t || !t.accessToken || t.accessToken === "prototype-token") {
      console.log("(prototype) flagMessage", messageId);
      return true;
    }

    const headers = { Authorization: `Bearer ${t.accessToken}`, "Content-Type": "application/json" };
    const body = JSON.stringify({ addLabelIds: ["STARRED"] });
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
      method: "POST",
      headers,
      body,
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to flag message: ${res.status} ${txt}`);
    }
    return true;
  },
};

module.exports = { GmailService, KeywordService };
