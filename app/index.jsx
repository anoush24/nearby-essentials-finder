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
  Share,
  Linking,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const CATEGORIES = [
  {
    id: "atm", label: "ATM", icon: "card", color: "#00E5BE",
    query: (lat, lon, r) => `[out:json][timeout:20];(node["amenity"="atm"](around:${r},${lat},${lon});node["amenity"="bank"](around:${r},${lat},${lon}););out body 15;`
  },
  {
    id: "hospital", label: "Medical", icon: "medical", color: "#FF5C7A",
    query: (lat, lon, r) => `[out:json][timeout:20];(node["amenity"="hospital"](around:${r},${lat},${lon});node["amenity"="clinic"](around:${r},${lat},${lon}););out body 15;`
  },
  {
    id: "cafe", label: "Food", icon: "restaurant", color: "#FFAD3B",
    query: (lat, lon, r) => `[out:json][timeout:20];(node["amenity"="cafe"](around:${r},${lat},${lon});node["amenity"="restaurant"](around:${r},${lat},${lon}););out body 15;`
  },
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [radius, setRadius] = useState(2000); // Feature 4: Default 2km
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission Denied"); return; }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setLocLoading(false);
    })();
  }, []);

  const fetchPlaces = useCallback(async (cat, currentRadius) => {
    if (!location) return;
    setLoading(true);
    try {
      const query = cat.query(location.latitude, location.longitude, currentRadius);
      const resp = await fetch(OVERPASS_URL, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
      });
      const json = await resp.json();
      const elements = (json.elements || []).map(el => ({
        id: String(el.id),
        name: el.tags?.name || cat.label,
        lat: el.lat, lon: el.lon,
        km: haversineKm(location.latitude, location.longitude, el.lat, el.lon),
        fare: Math.round(30 + haversineKm(location.latitude, location.longitude, el.lat, el.lon) * 14)
      })).sort((a, b) => a.km - b.km);
      setPlaces(elements);
    } catch (e) { Alert.alert("Error", "Network issue"); }
    finally { setLoading(false); }
  }, [location]);

  // Feature 1: Share Location
  const shareMyLocation = async () => {
    if (!location) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    await Share.share({ message: `I am currently here: ${url}` });
  };

  // Feature 3: Emergency Call
  const callEmergency = () => {
    Alert.alert("Emergency Call", "Do you want to call Emergency Services (112)?", [
      { text: "Cancel", style: "cancel" },
      { text: "Call", onPress: () => Linking.openURL('tel:112'), style: 'destructive' }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Utility Bar (Features 1 & 3) */}
      <View style={styles.utilBar}>
        <TouchableOpacity style={styles.emergencyBtn} onPress={callEmergency}>
          <Ionicons name="alert-circle" size={20} color="#FFF" />
          <Text style={styles.utilBtnText}>SOS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={shareMyLocation}>
          <Ionicons name="share-social" size={20} color="#FFF" />
          <Text style={styles.utilBtnText}>Share Location</Text>
        </TouchableOpacity>
      </View>
      {/* <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>
            RAD<Text style={{ color: '#00E5BE' }}>II</Text>
          </Text>
          <View style={styles.liveIndicator}>
            <View style={styles.dot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.locText}>
          {location ? `${location.latitude.toFixed(3)}° N, ${location.longitude.toFixed(3)}° E` : "Locating..."}
        </Text>
      </View> */}

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.brandContainer}>
            <Ionicons name="compass-outline" size={32} color="#00E5BE" />
            <Text style={styles.headerTitle}>
              RAD<Text style={{ color: '#00E5BE' }}>II</Text>
            </Text>
          </View>
          
          <View style={styles.liveIndicator}>
            <View style={styles.dot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        
        <View style={styles.locBadge}>
          <Ionicons name="navigate" size={12} color="#666" />
          <Text style={styles.locText}>
            {location 
              ? `${location.latitude.toFixed(4)}° N, ${location.longitude.toFixed(4)}° E` 
              : "Fetching GPS..."}
          </Text>
        </View>
      </View>

      {/* Radius Selector (Feature 4) */}
      <View style={styles.radiusContainer}>
        <Text style={styles.sectionLabel}>Search Radius</Text>
        <View style={styles.radiusRow}>
          {[1000, 2000, 5000].map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
              onPress={() => { setRadius(r); if (selectedCat) fetchPlaces(selectedCat, r); }}
            >
              <Text style={[styles.radiusText, radius === r && styles.radiusTextActive]}>{r / 1000}km</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.catRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catBtn, selectedCat?.id === cat.id && { borderColor: cat.color, backgroundColor: cat.color + "10" }]}
            onPress={() => { setSelectedCat(cat); fetchPlaces(cat, radius); }}
          >
            <Ionicons name={cat.icon} size={22} color={selectedCat?.id === cat.id ? cat.color : "#666"} />
            <Text style={[styles.catLabel, selectedCat?.id === cat.id && { color: cat.color }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator size="large" color="#00E5BE" style={{ marginTop: 50 }} /> : (
        <FlatList
          data={places}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: "/detail", params: { ...item, catColor: selectedCat.color, catIcon: selectedCat.icon, catLabel: selectedCat.label } })}>
              <View style={styles.cardLeft}>
                <View style={[styles.rankBadge, { backgroundColor: selectedCat.color + "15" }]}>
                  <Text style={{ color: selectedCat.color, fontWeight: '800' }}>{index + 1}</Text>
                </View>
                <View>
                  <Text style={styles.placeName}>{item.name}</Text>
                  <Text style={styles.metaText}>{item.km.toFixed(2)} km</Text>
                </View>
              </View>
              <Text style={[styles.fareText, { color: selectedCat.color }]}>₹{item.fare}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F0F1A", paddingTop: Platform.OS === "android" ? 40 : 0 },
  utilBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 },
  emergencyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF5C7A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 5 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 5, borderWidth: 1, borderColor: '#2A2A3F' },
  utilBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  header: { paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#FFF" },
  locText: { color: '#666', fontSize: 12 },
  radiusContainer: { paddingHorizontal: 20, marginBottom: 15 },
  sectionLabel: { color: '#444', fontSize: 10, textTransform: 'uppercase', fontWeight: '800', marginBottom: 8 },
  radiusRow: { flexDirection: 'row', gap: 10 },
  radiusBtn: { flex: 1, backgroundColor: '#1A1A2E', paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A3F' },
  radiusBtnActive: { borderColor: '#00E5BE', backgroundColor: '#00E5BE10' },
  radiusText: { color: '#666', fontWeight: '700', fontSize: 12 },
  radiusTextActive: { color: '#00E5BE' },
  catRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  catBtn: { flex: 1, alignItems: "center", paddingVertical: 15, borderRadius: 16, backgroundColor: "#1A1A2E", borderWidth: 1, borderColor: "#2A2A3F" },
  catLabel: { fontSize: 12, fontWeight: "700", color: "#666", marginTop: 5 },
  card: { flexDirection: "row", alignItems: "center", justifyContent: 'space-between', backgroundColor: "#1A1A2E", borderRadius: 16, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: "#2A2A3F" },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rankBadge: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  placeName: { color: "#EEE", fontSize: 14, fontWeight: "600", maxWidth: 150 },
  metaText: { fontSize: 12, color: "#666" },
  fareText: { fontSize: 16, fontWeight: "800" },
  header: {
    paddingHorizontal: 20,
    marginBottom: 25,
    marginTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1.5,
    // Using a more modern font feel
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-black',
  },
  locBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.8,
  },
  locText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A3F',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5BE',
    // Gives it a slight "glow" effect
    shadowColor: '#00E5BE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  liveText: {
    color: '#00E5BE',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
