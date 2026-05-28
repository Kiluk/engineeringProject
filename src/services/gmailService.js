import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLIENT_ID = '61778544637-gatfjnsak44b54oahg5qd7gsuojkndut.apps.googleusercontent.com';
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_KEY = '@gmail_access_token';

let accessToken = null;

const decodeBase64 = (input) => {
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(Array.prototype.map.call(atob(normalized), (c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (err) {
    return input;
  }
};

// Handle OAuth redirect in popup window
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const token = params.get('access_token');

  if (token && window.opener) {
    window.opener.postMessage({ type: 'oauth_token', token }, '*');
    window.document.body.innerHTML = '<p style="font-family: sans-serif; text-align: center; padding: 40px; color: #666;">✓ Authentication successful!<br>You can close this window.</p>';
    setTimeout(() => window.close(), 1500);
  }
}

export const GmailService = {
  /**
   * Check if we have a saved access token
   */
  hasToken: async () => {
    if (accessToken) return true;

    try {
      const saved = await AsyncStorage.getItem(TOKEN_KEY);
      if (saved) {
        accessToken = saved;
        return true;
      }
    } catch (err) {
      console.error('Error checking token:', err);
    }
    return false;
  },

  /**
   * Initiate Gmail OAuth login
   */
  connect: async () => {
    if (Platform.OS !== 'web') {
      throw new Error('OAuth only supported on web for now');
    }

    // Use exact redirect URI without trailing slash - MUST match Google Cloud config exactly
    const redirectUri = window.location.origin;
    console.log('📍 OAuth Redirect URI:', redirectUri);

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${CLIENT_ID}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return new Promise((resolve) => {
      const popup = window.open(authUrl, 'Gmail Login', 'width=500,height=700');

      if (!popup) {
        resolve(false);
        return;
      }

      const checkPopup = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkPopup);
            resolve(!!accessToken);
          }
        } catch (e) {
          // Ignore
        }
      }, 500);

      const messageHandler = async (e) => {
        if (e.data?.type === 'oauth_token') {
          accessToken = e.data.token;
          // Save token to persistent storage
          try {
            await AsyncStorage.setItem(TOKEN_KEY, accessToken);
          } catch (err) {
            console.error('Error saving token:', err);
          }
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          popup?.close();
          resolve(true);
        }
      };

      window.addEventListener('message', messageHandler);
    });
  },

  /**
   * Logout and clear token
   */
  logout: async () => {
    accessToken = null;
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (err) {
      console.error('Error clearing token:', err);
    }
  },

  /**
   * Fetch recent emails from Gmail
   */
  fetchRecentEmails: async (max = 20) => {
    if (!accessToken) {
      // Try to load from storage
      const saved = await AsyncStorage.getItem(TOKEN_KEY);
      if (saved) {
        accessToken = saved;
      } else {
        throw new Error('Not authenticated');
      }
    }

    try {
      // List messages
      const listResp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!listResp.ok) {
        throw new Error(`Gmail API error: ${listResp.status}`);
      }

      const listData = await listResp.json();

      if (!listData.messages || listData.messages.length === 0) {
        return [];
      }

      const emails = [];
      for (const msg of listData.messages) {
        try {
          const msgResp = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (!msgResp.ok) continue;

          const msgData = await msgResp.json();
          const headers = msgData.payload?.headers || [];
          const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
          const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';

          const bodyPart = msgData.payload?.parts?.find(part => part.mimeType === 'text/plain')?.body?.data;
          const body = bodyPart ? decodeBase64(bodyPart) : msgData.snippet || '';

          emails.push({
            id: msg.id,
            from,
            subject,
            snippet: msgData.snippet || '',
            body,
            timestamp: new Date(parseInt(msgData.internalDate, 10)).toISOString(),
          });
        } catch (err) {
          console.error(`Error fetching email ${msg.id}:`, err);
        }
      }

      return emails;
    } catch (error) {
      console.error('fetchRecentEmails error:', error);
      throw error;
    }
  },
};
