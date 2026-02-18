import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';

const CLIENT_ID = '61778544637-gatfjnsak44b54oahg5qd7gsuojkndut.apps.googleusercontent.com';
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

let accessToken = null;

export const GmailService = {
  connect: async () => {
    const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${CLIENT_ID}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    const result = await AuthSession.startAsync({ authUrl, returnUrl: redirectUri });

    if (result.type === 'success' && result.params?.access_token) {
      accessToken = result.params.access_token;
      return { success: true };
    } else if (result.type === 'dismiss' || result.type === 'cancel') {
      return { success: false, error: 'User cancelled' };
    } else {
      return { success: false, error: 'Authentication failed' };
    }
  },

  fetchRecentEmails: async (max = 10) => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    // list messages
    const listResp = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const listData = await listResp.json();
    if (!listData.messages) {
      return [];
    }

    const emails = [];
    for (const msg of listData.messages) {
      const msgResp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msgData = await msgResp.json();
      const headers = msgData.payload?.headers || [];
      const from = headers.find(h => h.name === 'From')?.value || '';
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      emails.push({
        id: msg.id,
        from,
        subject,
        snippet: msgData.snippet || '',
        timestamp: new Date(parseInt(msgData.internalDate, 10)).toISOString(),
      });
    }

    return emails;
  },
};
