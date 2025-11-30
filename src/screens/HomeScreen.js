import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Button, ActivityIndicator, Alert } from "react-native";
import EmialCard from "../components/EmialCard";
import { GmailService, KeywordService } from "../services/api";

export default function HomeScreen({ navigation }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [authStatus, setAuthStatus] = useState("unknown"); // 'connected' | 'not_connected' | 'unknown'
  const [flaggingIds, setFlaggingIds] = useState([]);
  const [batchFlagging, setBatchFlagging] = useState(false);
  const [keywords, setKeywords] = useState([]);

  useEffect(() => {
    loadKeywords();
    fetchEmails();
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const ok = await GmailService.isAuthenticated();
      setAuthStatus(ok ? "connected" : "not_connected");
    } catch (e) {
      setAuthStatus("not_connected");
    }
  }

  async function loadKeywords() {
    const ks = await KeywordService.getKeywords();
    setKeywords(ks || []);
  }

  async function fetchEmails() {
    setLoading(true);
    try {
      const list = await GmailService.fetchRecentEmails();
      setEmails(list || []);
    } catch (e) {
      console.warn("Failed to fetch emails:", e);
    }
    setLoading(false);
  }

  async function flagBlocked() {
    setBatchFlagging(true);
    const blockedEmails = emails.filter(matchesKeyword);
    for (const e of blockedEmails) {
      try {
        setFlaggingIds((s) => [...s, e.id]);
        await GmailService.flagMessage(e.id);
      } catch (err) {
        console.warn("Failed to flag message", e.id, err);
      } finally {
        setFlaggingIds((s) => s.filter((id) => id !== e.id));
      }
    }
    await fetchEmails();
    setBatchFlagging(false);
  }

  async function flagSingle(email) {
    setFlaggingIds((s) => [...s, email.id]);
    try {
      await GmailService.flagMessage(email.id);
      Alert.alert("Flagged", "Message flagged successfully.");
    } catch (e) {
      console.warn("Failed to flag message", e);
      Alert.alert("Error", "Could not flag message.");
    } finally {
      setFlaggingIds((s) => s.filter((id) => id !== email.id));
    }
    await fetchEmails();
  }

  function matchesKeyword(email) {
    const text = ((email.subject || "") + " " + (email.snippet || "")).toLowerCase();
    return keywords.some((k) => k && text.includes(k.toLowerCase()));
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Podejrzane wiadomości e-mail</Text>
          <Text style={[styles.status, authStatus === "connected" ? styles.statusConnected : styles.statusDisconnected]}>
            {authStatus === "connected" ? "Connected" : authStatus === "unknown" ? "Checking..." : "Not connected"}
          </Text>
        </View>
        <Button title="Settings" onPress={() => navigation.navigate("Settings")} />
      </View>

      <View style={{ marginVertical: 10 }}>
        <Button
          title={authStatus === "connected" ? "Refresh" : "Connect Gmail"}
          onPress={async () => {
            const res = await GmailService.connect();
            await checkAuth();
            if (res && res.mode === "prototype") {
              Alert.alert("Note", "Running in prototype mode — no real Gmail connection.");
            }
            await fetchEmails();
          }}
        />
      </View>

      <View style={{ marginBottom: 12 }}>
        <Button title={batchFlagging ? "Flagging..." : "Flag Blocked"} onPress={flagBlocked} disabled={batchFlagging} />
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={emails}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <EmialCard email={item} blocked={matchesKeyword(item)} onFlag={flagSingle} loading={flaggingIds.includes(item.id)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  status: { fontSize: 12, marginTop: 4 },
  statusConnected: { color: "green" },
  statusDisconnected: { color: "#888" },
});
