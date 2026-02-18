import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

export default function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await onLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>🛡️</Text>
        <Text style={styles.appName}>Phishing Detector</Text>
        <Text style={styles.tagline}>AI-Powered Email Security</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.welcome}>Welcome!</Text>
        <Text style={styles.description}>
          Protect your inbox from phishing emails with AI-powered detection. Simply log in with your Gmail account to get started.
        </Text>

        <View style={styles.features}>
          <Text style={styles.featureTitle}>Features:</Text>
          <Text style={styles.feature}>✓ Connect your Gmail account</Text>
          <Text style={styles.feature}>✓ AI phishing detection</Text>
          <Text style={styles.feature}>✓ Flag suspicious emails</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginButtonText}>Log in with Gmail</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footer}>
        Your data is secure. We only access your emails to analyze them for phishing threats.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 20,
  },
  features: {
    marginTop: 16,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  feature: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#bbb',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
});
