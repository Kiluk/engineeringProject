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
import { GmailService } from '../services/gmailService';
import { PhishingDetector } from '../services/phishingDetector';
import EmailCard from '../components/EmailCard';

export default function HomeScreen({ onLogout }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);
  const [analysis, setAnalysis] = useState({});

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const emails = await GmailService.fetchRecentEmails(20);
      setEmails(emails);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch emails: ' + err.message);
    } finally {
      setLoading(false);
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
});
