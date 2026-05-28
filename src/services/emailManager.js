import AsyncStorage from '@react-native-async-storage/async-storage';
import { GmailService } from './gmailService';
import { PhishingDetector } from './phishingDetector';

const API_KEY_STORAGE = '@anthropic_api_key';

export const EmailManager = {
  loadSavedApiKey: async () => {
    try {
      const stored = await AsyncStorage.getItem(API_KEY_STORAGE);
      return stored || '';
    } catch (error) {
      console.warn('EmailManager: failed to load saved API key', error);
      return '';
    }
  },

  saveApiKey: async (key) => {
    try {
      await AsyncStorage.setItem(API_KEY_STORAGE, key);
    } catch (error) {
      console.warn('EmailManager: failed to save API key', error);
    }
  },

  clearSavedApiKey: async () => {
    try {
      await AsyncStorage.removeItem(API_KEY_STORAGE);
    } catch (error) {
      console.warn('EmailManager: failed to clear saved API key', error);
    }
  },

  fetchEmails: async (max = 20) => {
    return GmailService.fetchRecentEmails(max);
  },

  analyzeEmail: async (email, key) => {
    if (!key || !key.trim()) {
      throw new Error('Missing API key');
    }

    await EmailManager.saveApiKey(key);
    PhishingDetector.setApiKey(key);
    return PhishingDetector.detectPhishing(email);
  },
};
