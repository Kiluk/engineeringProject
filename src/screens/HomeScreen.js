import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { PhishingDetector } from '../services/phishingDetector';
import { GmailService } from '../services/gmailService';
import EmailCard from '../components/EmailCard';

const MOCK_EMAILS = [
  {
    id: '1',
    from: 'support@paypal.com',
    subject: 'Verify Your PayPal Account Immediately',
    snippet: 'Click here to confirm your account details to avoid suspension...',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    from: 'notifications@amazon.com',
    subject: 'Your Amazon Package Delivery Code',
    snippet: 'Your package has arrived. Use code 12345 to claim it.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    from: 'noreply@apple.com',
    subject: 'Apple ID Locked - Update Required',
    snippet: 'Your Apple ID has been locked due to suspicious activity. Click immediately...',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: '4',
    from: 'hr@company.com',
    subject: 'Team Lunch Tomorrow at 12 PM',
    snippet: 'Join us for our monthly team lunch. RSVP by end of day.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function HomeScreen() {
  const [emails, setEmails] = useState(MOCK_EMAILS);
  const [analyzing, setAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);
  const [analysis, setAnalysis] = useState({}); // { emailId: { isPhishing, confidence, reason } }
  const [gmailConnected, setGmailConnected] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);

  const handleConnectGmail = async () => {
    try {
      const res = await GmailService.connect();
      if (res.success) {
        setGmailConnected(true);
        fetchGmailEmails();
      } else {
        Alert.alert('Connection failed', res.error || 'Unknown error');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const fetchGmailEmails = async () => {
    setLoadingEmails(true);
    try {
      const realEmails = await GmailService.fetchRecentEmails(20);
      setEmails(realEmails);
    } catch (err) {
      Alert.alert('Fetch failed', err.message);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleAnalyzeAll = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Missing API Key', 'Please enter your Anthropic API key');
      return;
    }

    setAnalyzing(true);
    try {
      PhishingDetector.setApiKey(apiKey);
      const results = await PhishingDetector.analyzeMultiple(emails);
      setAnalysis(results);
      setShowApiInput(false);
      
      // Count phishing emails
      const phishingCount = Object.values(results).filter(r => r.isPhishing).length;
      Alert.alert(
        'Analysis Complete',
        `Analyzed ${emails.length} emails\n${phishingCount} potential phishing detected`
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to analyze emails');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFlagEmail = (emailId) => {
    setEmails(emails.map(email => 
      email.id === emailId 
        ? { ...email, flagged: !email.flagged }
        : email
    ));
  };

  const handleReset = () => {
    setAnalysis({});
    setShowApiInput(true);
    setApiKey('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Phishing Detector</Text>
        <Text style={styles.subtitle}>AI-powered email security</Text>
      </View>

      {!gmailConnected && (
        <TouchableOpacity style={styles.connectButton} onPress={handleConnectGmail} disabled={loadingEmails}>
          <Text style={styles.connectText}>{loadingEmails ? 'Connecting...' : 'Connect Gmail'}</Text>
        </TouchableOpacity>
      )}

      {showApiInput && (
        <View style={styles.apiSection}>
          <Text style={styles.sectionTitle}>Anthropic API Key</Text>
          <TextInput
            style={styles.input}
            placeholder="sk-ant-..."
            secureTextEntry
            value={apiKey}
            onChangeText={setApiKey}
            editable={!analyzing}
          />
          <TouchableOpacity
            style={[styles.button, analyzing && styles.buttonDisabled]}
            onPress={handleAnalyzeAll}
            disabled={analyzing}
          >
            {analyzing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Analyze All Emails</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {Object.keys(analysis).length > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>Analysis Results</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetLink}>Analyze Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {loadingEmails ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          scrollEnabled={false}
          data={emails}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EmailCard
              email={item}
              analysis={analysis[item.id]}
              onFlag={handleFlagEmail}
              flagged={item.flagged}
            />
          )}
          style={styles.emailList}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#bbb',
  },
  apiSection: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#bbb',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 15,
    marginBottom: 0,
  },
  resetLink: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '500',
  },
  emailList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
});
