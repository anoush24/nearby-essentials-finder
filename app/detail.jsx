import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Linking,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

function InfoRow({ icon, label, value, color }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function DetailScreen() {
  const router = useRouter();
  const { name, km, fare, lat, lon, catColor, catIcon, catLabel } =
    useLocalSearchParams();

  const kmNum = parseFloat(km);
  const fareNum = parseInt(fare, 10);

  // Walking time ~5 km/h, cab ~30 km/h (city)
  const walkMin = Math.round((kmNum / 5) * 60);
  const cabMin = Math.round((kmNum / 30) * 60);

  const openMaps = () => {
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lon}`,
      android: `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(name)})`,
    });
    Linking.canOpenURL(url)
      .then((can) => {
        if (can) Linking.openURL(url);
        else {
          // Fallback to Google Maps web
          Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
          );
        }
      })
      .catch(() => Alert.alert("Error", "Could not open maps."));
  };

  const fareBreakdown = () => {
    const base = 30;
    const perKm = 14;
    Alert.alert(
      "💰 Fare Breakdown",
      `Base fare: ₹${base}\nPer km (₹${perKm} × ${kmNum} km): ₹${Math.round(
        perKm * kmNum
      )}\n──────────────\nTotal Estimate: ₹${fareNum}\n\n* Actual fares may vary by operator, time, and surge pricing.`,
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={22} color="#FFF" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: catColor + "15" }]}>
          <View style={[styles.heroIcon, { backgroundColor: catColor + "25", borderColor: catColor + "55" }]}>
            <Ionicons name={catIcon} size={40} color={catColor} />
          </View>
          <View style={[styles.catPill, { backgroundColor: catColor + "22" }]}>
            <Text style={[styles.catPillText, { color: catColor }]}>
              {catLabel}
            </Text>
          </View>
          <Text style={styles.placeName}>{name}</Text>
          <Text style={styles.coords}>
            {parseFloat(lat).toFixed(5)}, {parseFloat(lon).toFixed(5)}
          </Text>
        </View>

        {/* Info cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Quick Info</Text>
          <View style={styles.card}>
            <InfoRow
              icon="map-outline"
              label="Distance"
              value={`${kmNum} km`}
              color={catColor}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="walk-outline"
              label="Walking Time"
              value={walkMin < 60 ? `~${walkMin} min` : `~${Math.round(walkMin / 60)}h ${walkMin % 60}m`}
              color="#8B8BFF"
            />
            <View style={styles.divider} />
            <InfoRow
              icon="car-outline"
              label="Cab Time"
              value={cabMin < 60 ? `~${cabMin} min` : `~${Math.round(cabMin / 60)}h ${cabMin % 60}m`}
              color="#FFAD3B"
            />
          </View>
        </View>

        {/* Fare card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Cab Fare Estimate</Text>
          <View style={[styles.fareCard, { borderColor: catColor + "44" }]}>
            <View>
              <Text style={styles.fareSmall}>Estimated total</Text>
              <Text style={[styles.fareAmount, { color: catColor }]}>
                ₹{fareNum}
              </Text>
              <Text style={styles.fareSub}>
                Base ₹30 + ₹14/km × {kmNum} km
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.breakdownBtn, { borderColor: catColor + "66" }]}
              onPress={fareBreakdown}
              activeOpacity={0.8}
            >
              <Ionicons name="information-circle-outline" size={16} color={catColor} />
              <Text style={[styles.breakdownText, { color: catColor }]}>
                Details
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cab apps row */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚖 Book a Ride</Text>
          <View style={styles.appsRow}>
            {[
              { name: "Ola", color: "#F5A623", icon: "car-sport-outline" },
              { name: "Uber", color: "#276EF1", icon: "car-outline" },
              { name: "Rapido", color: "#F9CB28", icon: "bicycle-outline" },
            ].map((app) => (
              <View key={app.name} style={styles.appCard}>
                <Ionicons name={app.icon} size={26} color={app.color} />
                <Text style={[styles.appName, { color: app.color }]}>
                  {app.name}
                </Text>
                <Text style={styles.appFare}>~₹{fareNum}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.appDisclaimer}>
            * Open respective apps to book. Fares are estimates only.
          </Text>
        </View>

        {/* Navigate button */}
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: catColor }]}
          onPress={openMaps}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={20} color="#000" />
          <Text style={styles.navBtnText}>Open in Maps</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0F0F1A",
    paddingTop: Platform.OS === "android" ? 36 : 0,
  },
  backBtn: {
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 4,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1A1A2E",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingBottom: 50,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 30,
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 8,
    marginTop: 10,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: 12,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  catPillText: {
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  placeName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  coords: {
    fontSize: 11,
    color: "#555",
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#1A1A2E",
    borderRadius: 18,
    padding: 6,
    borderWidth: 1,
    borderColor: "#2A2A3F",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: "#666" },
  infoValue: { fontSize: 17, fontWeight: "700", color: "#EEE", marginTop: 1 },
  divider: {
    height: 1,
    backgroundColor: "#23233A",
    marginHorizontal: 12,
  },
  fareCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
  },
  fareSmall: { fontSize: 12, color: "#666" },
  fareAmount: { fontSize: 36, fontWeight: "900", letterSpacing: -1 },
  fareSub: { fontSize: 11, color: "#555", marginTop: 2 },
  breakdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  breakdownText: { fontSize: 12, fontWeight: "700" },
  appsRow: {
    flexDirection: "row",
    gap: 10,
  },
  appCard: {
    flex: 1,
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "#2A2A3F",
  },
  appName: { fontSize: 13, fontWeight: "700" },
  appFare: { fontSize: 12, color: "#666" },
  appDisclaimer: {
    fontSize: 10,
    color: "#444",
    marginTop: 8,
    textAlign: "center",
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 18,
  },
  navBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
  },
});
