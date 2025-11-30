import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";

export default function EmialCard({ email, blocked, onFlag, loading }) {
  function confirmFlag() {
    Alert.alert(
      "Flag message",
      `Flag this message: "${email.subject || "(no subject)"}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Flag", style: "destructive", onPress: () => onFlag && onFlag(email) },
      ]
    );
  }

  return (
    <View style={[styles.card, blocked ? styles.blocked : null]}>
      <Text style={styles.subject}>{email.subject}</Text>
      <Text style={styles.snippet}>{email.snippet}</Text>
      {blocked ? <Text style={styles.blockedLabel}>Blocked by keyword</Text> : null}

      <View style={styles.actionsRow}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" />
          </View>
        ) : (
          <TouchableOpacity onPress={confirmFlag} style={styles.flagButton}>
            <Text style={styles.flagText}>Flag</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#f9f9f9", padding: 14, marginBottom: 12, borderRadius: 10 },
  subject: { fontWeight: "700", marginBottom: 6, fontSize: 16 },
  snippet: { color: "#444", marginBottom: 6 },
  blocked: { borderLeftWidth: 4, borderLeftColor: "#d00" },
  blockedLabel: { marginTop: 6, color: "#d00", fontWeight: "600" },
  actionsRow: { marginTop: 8, flexDirection: "row", justifyContent: "flex-end" },
  flagButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#007bff", borderRadius: 6 },
  flagText: { color: "#fff", fontWeight: "600" },
  loadingWrap: { paddingVertical: 6, paddingHorizontal: 12 },
});
