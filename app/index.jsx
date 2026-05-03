import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

// ─── OVERPASS API (free, no key needed) ───────────────────────────────────────
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const CATEGORIES = [
  {
    id: "atm",
    label: "ATM",
    icon: "card-outline",
    color: "#00E5BE",
    query: (lat, lon, r) =>
      `[out:json][timeout:20];(node["amenity"="atm"](around:${r},${lat},${lon});node["amenity"="bank"](around:${r},${lat},${lon}););out body 20;`,
  },
  {
    id: "hospital",
    label: "Hospital",
    icon: "medical-outline",
    color: "#FF5C7A",
    query: (lat, lon, r) =>
      `[out:json][timeout:20];(node["amenity"="hospital"](around:${r},${lat},${lon});node["amenity"="clinic"](around:${r},${lat},${lon});node["amenity"="doctors"](around:${r},${lat},${lon}););out body 20;`,
  },
  {
    id: "cafe",
    label: "Café",
    icon: "cafe-outline",
    color: "#FFAD3B",
    query: (lat, lon, r) =>
      `[out:json][timeout:20];(node["amenity"="cafe"](around:${r},${lat},${lon});node["amenity"="restaurant"](around:${r},${lat},${lon}););out body 20;`,
  },
];

const RADIUS = 3000; // metres

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateFare(km) {
  const BASE = 30;
  const PER_KM = 14;
  return Math.round(BASE + km * PER_KM);
}

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(true);
  const [locError, setLocError] = useState(null);

  // ── Get GPS location on mount ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocError("Location permission denied.");
          setLocLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(loc.coords);
      } catch (e) {
        setLocError("Could not get location. Make sure GPS is enabled.");
      } finally {
        setLocLoading(false);
      }
    })();
  }, []);

  // ── Fetch places from Overpass ─────────────────────────────────────────────
  const fetchPlaces = useCallback(
    async (cat) => {
      if (!location) return;
      setLoading(true);
      setPlaces([]);
      try {
        const query = cat.query(location.latitude, location.longitude, RADIUS);
        const resp = await fetch(OVERPASS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(query)}`,
        });
        const json = await resp.json();
        const elements = (json.elements || [])
          .filter((el) => el.lat && el.lon)
          .map((el) => {
            const name =
              el.tags?.name ||
              el.tags?.["name:en"] ||
              el.tags?.operator ||
              cat.label;
            const km = haversineKm(
              location.latitude,
              location.longitude,
              el.lat,
              el.lon
            );
            return {
              id: String(el.id),
              name,
              lat: el.lat,
              lon: el.lon,
              km,
              fare: estimateFare(km),
              tags: el.tags || {},
            };
          })
          .sort((a, b) => a.km - b.km)
          .slice(0, 15);

        if (elements.length === 0) {
          Alert.alert(
            "No Results",
            `No ${cat.label} found within ${RADIUS / 1000} km.`
          );
        }
        setPlaces(elements);
      } catch (e) {
        Alert.alert("Error", "Failed to fetch places. Check internet.");
      } finally {
        setLoading(false);
      }
    },
    [location]
  );

  const handleCatPress = (cat) => {
    setSelectedCat(cat);
    fetchPlaces(cat);
  };

  const handlePlacePress = (place) => {
    router.push({
      pathname: "/detail",
      params: {
        name: place.name,
        km: place.km.toFixed(2),
        fare: place.fare,
        lat: place.lat,
        lon: place.lon,
        catColor: selectedCat.color,
        catIcon: selectedCat.icon,
        catLabel: selectedCat.label,
      },
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 NearbyFinder</Text>
        {location ? (
          <View style={styles.locBadge}>
            <Ionicons name="navigate-circle" size={13} color="#00E5BE" />
            <Text style={styles.locText}>
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          </View>
        ) : locLoading ? (
          <View style={styles.locBadge}>
            <ActivityIndicator size={12} color="#00E5BE" />
            <Text style={styles.locText}>Getting location…</Text>
          </View>
        ) : (
          <Text style={styles.locError}>{locError}</Text>
        )}
      </View>

      {/* Category Tabs */}
      <View style={styles.catRow}>
        {CATEGORIES.map((cat) => {
          const active = selectedCat?.id === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catBtn,
                active && { backgroundColor: cat.color + "22", borderColor: cat.color },
              ]}
              onPress={() => handleCatPress(cat)}
              disabled={!location || locLoading}
              activeOpacity={0.75}
            >
              <Ionicons
                name={cat.icon}
                size={22}
                color={active ? cat.color : "#888"}
              />
              <Text
                style={[styles.catLabel, active && { color: cat.color }]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Body */}
      {!location && !locLoading && (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={52} color="#FF5C7A" />
          <Text style={styles.emptyTitle}>Location Unavailable</Text>
          <Text style={styles.emptyBody}>{locError}</Text>
        </View>
      )}

      {location && !selectedCat && (
        <View style={styles.center}>
          <Ionicons name="search-circle-outline" size={64} color="#2A2A3F" />
          <Text style={styles.emptyTitle}>Choose a Category</Text>
          <Text style={styles.emptyBody}>
            Tap ATM, Hospital, or Café above to discover nearby places.
          </Text>
        </View>
      )}

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={selectedCat?.color || "#00E5BE"} />
          <Text style={[styles.emptyBody, { marginTop: 12 }]}>
            Searching nearby {selectedCat?.label}s…
          </Text>
        </View>
      )}

      {!loading && places.length > 0 && (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handlePlacePress(item)}
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft}>
                <View
                  style={[
                    styles.rankBadge,
                    { backgroundColor: selectedCat.color + "22" },
                  ]}
                >
                  <Text
                    style={[styles.rankText, { color: selectedCat.color }]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.cardMeta}>
                    <Ionicons name="walk-outline" size={12} color="#888" />
                    <Text style={styles.metaText}>{item.km.toFixed(2)} km away</Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.fareText, { color: selectedCat.color }]}>
                  ₹{item.fare}
                </Text>
                <Text style={styles.fareLabel}>cab est.</Text>
                <Ionicons name="chevron-forward" size={16} color="#444" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0F0F1A",
    paddingTop: Platform.OS === "android" ? 36 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  locBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locText: {
    fontSize: 11,
    color: "#888",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  locError: {
    fontSize: 12,
    color: "#FF5C7A",
    marginTop: 4,
  },
  catRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  catBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#1A1A2E",
    borderWidth: 1.5,
    borderColor: "#2A2A3F",
  },
  catLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#DDD",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A2A3F",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontWeight: "800",
    fontSize: 15,
  },
  placeName: {
    color: "#EEE",
    fontSize: 15,
    fontWeight: "600",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  metaText: {
    fontSize: 11,
    color: "#666",
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 1,
  },
  fareText: {
    fontSize: 16,
    fontWeight: "800",
  },
  fareLabel: {
    fontSize: 10,
    color: "#555",
    marginBottom: 4,
  },
});
