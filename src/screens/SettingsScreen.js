import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { KeywordService } from "../services/api";

export default function SettingsScreen() {
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const ks = await KeywordService.getKeywords();
    setKeywords(ks || []);
  }

  async function add() {
    if (!keyword.trim()) return;
    await KeywordService.addKeyword(keyword.trim());
    setKeyword("");
    load();
  }

  async function remove(item) {
    await KeywordService.removeKeyword(item);
    load();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Blocked Keywords</Text>
      <View style={styles.row}>
        <TextInput
          placeholder="Add keyword"
          value={keyword}
          onChangeText={setKeyword}
          style={styles.input}
        />
        <Button title="Add" onPress={add} />
      </View>

      <FlatList
        data={keywords}
        keyExtractor={(i) => i}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text>{item}</Text>
            <TouchableOpacity onPress={() => remove(item)}>
              <Text style={styles.remove}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  row: { flexDirection: "row", marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ddd", padding: 8, marginRight: 8, borderRadius: 6 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#f0f0f0" },
  remove: { color: "#c00" },
});
