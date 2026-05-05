import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Linking, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

function InfoRow({ icon, label, value, color }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function DetailScreen() {
  const router = useRouter();
  const { name, km, fare, lat, lon, catColor, catIcon, catLabel } = useLocalSearchParams();
  const kmNum = parseFloat(km);

  const openMaps = () => {
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lon}`,
      android: `geo:${lat},${lon}?q=${lat},${lon}`,
    });
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#FFF" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.hero, { backgroundColor: catColor + "10" }]}>
          <Ionicons name={catIcon} size={40} color={catColor} />
          <Text style={styles.placeName}>{name}</Text>
          <Text style={styles.catLabel}>{catLabel}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart-outline" size={16} color="#666" />
            <Text style={styles.sectionTitle}>Route Information</Text>
          </View>
          <View style={styles.card}>
            <InfoRow icon="navigate-outline" label="Distance" value={`${km} km`} color={catColor} />
            <View style={styles.divider} />
            <InfoRow icon="walk-outline" label="Walking Est." value={`${Math.round((kmNum / 5) * 60)} mins`} color="#8B8BFF" />
            <View style={styles.divider} />
            <InfoRow icon="car-outline" label="Driving Est." value={`${Math.round((kmNum / 30) * 60)} mins`} color="#FFAD3B" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet-outline" size={16} color="#666" />
            <Text style={styles.sectionTitle}>Fare Estimate</Text>
          </View>
          <View style={[styles.fareCard, { borderColor: catColor + "30" }]}>
            <Text style={styles.fareLabel}>Estimated Cab Fare</Text>
            <Text style={[styles.fareAmount, { color: catColor }]}>₹{fare}</Text>
            <Text style={styles.fareSub}>Based on ₹30 Base + ₹14/km</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.navBtn, { backgroundColor: catColor }]} onPress={openMaps}>
          <Ionicons name="map" size={20} color="#000" />
          <Text style={styles.navBtnText}>Start Navigation</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F0F1A", paddingTop: Platform.OS === "android" ? 40 : 0 },
  backBtn: { marginLeft: 20, width: 40, height: 40, borderRadius: 12, backgroundColor: "#1A1A2E", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  hero: { alignItems: 'center', paddingVertical: 40, marginHorizontal: 20, borderRadius: 24, marginBottom: 20 },
  placeName: { fontSize: 22, fontWeight: "800", color: "#FFF", marginTop: 15, textAlign: 'center', paddingHorizontal: 20 },
  catLabel: { fontSize: 12, color: "#888", textTransform: 'uppercase', letterSpacing: 1, marginTop: 5 },
  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#666", textTransform: "uppercase" },
  card: { backgroundColor: "#1A1A2E", borderRadius: 20, padding: 5, borderWidth: 1, borderColor: "#2A2A3F" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 15, padding: 15 },
  infoIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 12, color: "#666" },
  infoValue: { fontSize: 16, fontWeight: "700", color: "#EEE" },
  divider: { height: 1, backgroundColor: "#23233A", marginHorizontal: 15 },
  fareCard: { backgroundColor: "#1A1A2E", borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1 },
  fareLabel: { color: "#888", fontSize: 13 },
  fareAmount: { fontSize: 42, fontWeight: "900", marginVertical: 5 },
  fareSub: { color: "#555", fontSize: 11 },
  navBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginHorizontal: 20, marginTop: 30, paddingVertical: 18, borderRadius: 20 },
  navBtnText: { fontSize: 16, fontWeight: "800", color: "#000" },
});