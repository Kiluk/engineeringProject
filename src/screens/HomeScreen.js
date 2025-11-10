import React from "react";

const emails = [
  {
    id: "1",
    subcject: "Super okazja!!!",
    snippet: "Kup taniej niż kiedykolwiek",
  },
  { id: "1", subcject: "Ciepły obiad u mamy", snippet: "Wpadaj na 12:00" },
];

export default function HomeScreen() {
  return (
    <View style={StyleSheet.container}>
      <Text style={style.title}>Podejrzane wiadomości e-mail:</Text>
      <FlatList
        data={emails}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={style.subcject}>{item.subcject}</Text>
            <Text>{item.snippet}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 10,
    marginBottom: 8,
    borderRadius: 10,
  },
  subject: { fontWeight: "600", fontSize: 16 },
});
