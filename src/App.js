import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import { GmailService } from './services/gmailService';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we already have a token saved
    const checkToken = async () => {
      const hasToken = await GmailService.hasToken();
      setIsLoggedIn(hasToken);
      setIsLoading(false);
    };
    checkToken();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await GmailService.connect();
      setIsLoggedIn(success);
    } catch (err) {
      console.error('Login error:', err);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await GmailService.logout();
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return isLoggedIn ? (
    <HomeScreen onLogout={handleLogout} />
  ) : (
    <LoginScreen onLogin={handleLogin} />
  );
}
