import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SenderAnalyzer } from '../services/senderAnalyzer';

export default function EmailCard({ email, analysis, onFlag, flagged, onAnalyze, onSelect }) {
  const senderAnalysis = SenderAnalyzer.analyzeSender(email.from);
  const handleFlag = () => {
    Alert.alert(
      flagged ? 'Unflag Email' : 'Flag Email',
      `Are you sure?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Confirm',
          onPress: () => onFlag(email.id),
          style: 'destructive',
        },
      ]
    );
  };

  const isPhishing = analysis?.isPhishing;
  const confidence = analysis?.confidence;

  return (
    <View
      style={[
        styles.card,
        isPhishing && styles.phishingCard,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.senderInfo}>
          <Text style={styles.from} numberOfLines={1}>
            {email.from}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(email.timestamp).toLocaleDateString()} • Trust: {senderAnalysis.trustScore}%
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.flagButton, flagged && styles.flagged]}
          onPress={handleFlag}
        >
          <Text style={styles.flagIcon}>{flagged ? '🚩' : '📌'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subject} numberOfLines={2}>
        {email.subject}
      </Text>

      <Text style={styles.snippet} numberOfLines={2}>
        {email.snippet}
      </Text>

      {senderAnalysis.riskLevel !== 'low' && (
        <View style={[styles.senderWarning, styles[`risk${senderAnalysis.riskLevel}`]]}>
          <Text style={styles.warningTitle}>
            {senderAnalysis.riskLevel === 'high' ? '⚠️ HIGH RISK SENDER' : '⚡ MEDIUM RISK SENDER'}
          </Text>
          {senderAnalysis.warnings.map((warning, idx) => (
            <Text key={idx} style={styles.warningText}>
              • {warning}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onAnalyze?.(email)}>
          <Text style={styles.actionText}>
            {analysis ? 'Re-run Analysis' : 'Analyze email'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.detailsButton} onPress={() => onSelect?.(email)}>
          <Text style={styles.detailsText}>View details</Text>
        </TouchableOpacity>
      </View>
      {analysis && (
        <View
          style={[
            styles.analysisBox,
            isPhishing ? styles.phishingBox : styles.legitBox,
          ]}
        >
          <Text
            style={[
              styles.verdict,
              isPhishing ? styles.phishingText : styles.legitText,
            ]}
          >
            {isPhishing ? '⚠️ Likely Phishing' : '✅ Likely Legitimate'}
          </Text>
          <Text style={styles.confidence}>
            Confidence: {(confidence * 100).toFixed(0)}%
          </Text>
          {analysis.reason && (
            <Text style={styles.reason}>{analysis.reason}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  phishingCard: {
    borderLeftColor: '#ff6b35',
    backgroundColor: '#fff8f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  senderInfo: {
    flex: 1,
    marginRight: 10,
  },
  from: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  flagButton: {
    padding: 4,
  },
  flagged: {
    backgroundColor: '#ffe6e6',
    borderRadius: 4,
    padding: 6,
  },
  flagIcon: {
    fontSize: 18,
  },
  subject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  snippet: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 10,
  },
  analysisBox: {
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
  },
  phishingBox: {
    backgroundColor: '#ffeae1',
    borderColor: '#ff6b35',
  },
  legitBox: {
    backgroundColor: '#e6ffe6',
    borderColor: '#10b981',
  },
  verdict: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  phishingText: {
    color: '#d97706',
  },
  legitText: {
    color: '#059669',
  },
  confidence: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  reason: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  senderWarning: {
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  riskhigh: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#dc2626',
  },
  riskmedium: {
    backgroundColor: '#fff7ed',
    borderLeftColor: '#f97316',
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    color: '#1a1a1a',
  },
  warningText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  detailsText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
  },
});
