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
import { EmailManager } from '../services/emailManager';
import EmailCard from '../components/EmailCard';

export default function HomeScreen({ onLogout }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);
  const [analysis, setAnalysis] = useState({});
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    fetchEmails();

    const loadKey = async () => {
      try {
        const stored = await EmailManager.loadSavedApiKey();
        if (stored) {
          setApiKey(stored);
          setShowApiInput(false);
        }
      } catch (e) {
        console.warn('Failed to load API key', e);
      }
    };
    loadKey();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const inbox = await EmailManager.fetchEmails(20);
      setEmails(inbox);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch emails: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeEmail = async (email) => {
    if (!apiKey.trim()) {
      Alert.alert('Missing API Key', 'Please enter your Anthropic API key');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await EmailManager.analyzeEmail(email, apiKey);
      setAnalysis((prev) => ({ ...prev, [email.id]: result }));
      setSelectedEmail(email);
      setShowApiInput(false);
      Alert.alert('Analysis Complete', `Email analysis finished for: ${email.subject}`);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to analyze email');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Missing API Key', 'Please enter your Anthropic API key');
      return;
    }

    try {
      await EmailManager.saveApiKey(apiKey);
      setShowApiInput(false);
      Alert.alert('Ready', 'API key saved. Select a message to analyze.');
    } catch (error) {
      Alert.alert('Error', 'Unable to save API key');
    }
  };

  const handleFlagEmail = (emailId) => {
    setEmails(emails.map(email =>
      email.id === emailId
        ? { ...email, flagged: !email.flagged }
        : email
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>🛡️ Phishing Detector</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Your Gmail emails</Text>
      </View>

      {showApiInput && (
        <View style={styles.apiSection}>
          <Text style={styles.sectionTitle}>Analyze with AI</Text>
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
            onPress={handleSaveApiKey}
            disabled={analyzing}
          >
            {analyzing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save API Key</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {!showApiInput && (
        <View style={styles.changeKeySection}>
          <TouchableOpacity
            onPress={async () => {
              await EmailManager.clearSavedApiKey();
              setApiKey('');
              setShowApiInput(true);
              setAnalysis({});
              setSelectedEmail(null);
            }}
          >
            <Text style={styles.resetLink}>Change API Key</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedEmail && (
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Selected Email</Text>
          <Text style={styles.detailLabel}>From</Text>
          <Text style={styles.detailText}>{selectedEmail.from}</Text>
          <Text style={styles.detailLabel}>Subject</Text>
          <Text style={styles.detailText}>{selectedEmail.subject}</Text>
          <Text style={styles.detailLabel}>Message preview</Text>
          <Text style={styles.bodyText}>{selectedEmail.body || selectedEmail.snippet || 'No message body available'}</Text>
          {analysis[selectedEmail.id] ? (
            <View style={styles.detailsAnalysisBox}>
              <Text style={styles.detailLabel}>AI Analysis Result</Text>
              <Text style={styles.analysisDetailText}>{analysis[selectedEmail.id].reason}</Text>
              <Text style={styles.analysisDetailText}>
                Verdict: {analysis[selectedEmail.id].isPhishing ? 'Phishing' : 'Safe'}
              </Text>
              <Text style={styles.analysisDetailText}>
                Confidence: {(analysis[selectedEmail.id].confidence * 100).toFixed(0)}%
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, analyzing && styles.buttonDisabled]}
              onPress={() => handleAnalyzeEmail(selectedEmail)}
              disabled={analyzing}
            >
              {analyzing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Analyze Selected Email</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : emails.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No emails found</Text>
        </View>
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
              onAnalyze={handleAnalyzeEmail}
              onSelect={handleSelectEmail}
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  changeKeySection: {
    marginTop: 10,
    alignItems: 'center',
  },
  emailList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  emptyBox: {
    margin: 15,
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  detailsSection: {
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 10,
  },
  detailText: {
    fontSize: 13,
    color: '#444',
    marginTop: 4,
    lineHeight: 18,
  },
  bodyText: {
    fontSize: 13,
    color: '#444',
    marginTop: 4,
    lineHeight: 20,
  },
  detailsAnalysisBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  analysisDetailText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
    lineHeight: 18,
  },
});
