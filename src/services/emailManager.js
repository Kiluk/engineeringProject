import AsyncStorage from '@react-native-async-storage/async-storage';
import { GmailService } from './gmailService';
import { PhishingDetector } from './phishingDetector';

const API_KEY_STORAGE = '@anthropic_api_key';
const ANALYSIS_STORAGE = '@email_analysis_results';

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

  loadSavedAnalysis: async () => {
    try {
      const stored = await AsyncStorage.getItem(ANALYSIS_STORAGE);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('EmailManager: failed to load saved analysis', error);
      return {};
    }
  },

  saveAnalysis: async (emailId, analysis) => {
    try {
      const stored = await EmailManager.loadSavedAnalysis();
      const updated = { ...stored, [emailId]: analysis };
      await AsyncStorage.setItem(ANALYSIS_STORAGE, JSON.stringify(updated));
    } catch (error) {
      console.warn('EmailManager: failed to save analysis', error);
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
    const effectiveKey = key && key.trim() ? key : await EmailManager.loadSavedApiKey();
    if (!effectiveKey || !effectiveKey.trim()) {
      throw new Error('Missing API key');
    }

    await EmailManager.saveApiKey(effectiveKey);
    PhishingDetector.setApiKey(effectiveKey);
    const result = await PhishingDetector.detectPhishing(email);
    await EmailManager.saveAnalysis(email.id, result);
    return result;
  },
};
