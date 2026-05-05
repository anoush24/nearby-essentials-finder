# 📍 NearbyFinder — Expo Go App

Find ATMs, Hospitals, and Cafés near you with cab fare estimates.

## 🚀 Quick Setup

```bash
# 1. Extract / open the folder
cd NearbyFinder

# 2. Install dependencies
npm install

# 3. Start Expo
npx expo start

# 4. Scan QR code with Expo Go (SDK 53+)
```

## 📦 Tech Stack
- **Expo SDK 53** (compatible with latest Expo Go)
- **expo-router** for file-based navigation
- **expo-location** for GPS
- **Overpass API** (OpenStreetMap) — FREE, no API key needed
- **@expo/vector-icons** for icons

## 🗺 Features
- 🔍 Find nearby ATMs, Hospitals, Cafés within 3 km
- 📍 Real GPS location
- 💰 Estimated cab fare (₹30 base + ₹14/km)
- 🗺 "Open in Maps" to get directions
- ⏱ Walking & cab time estimates

## 📱 Screens
1. **Home** — Category picker + list of nearby places
2. **Detail** — Distance, fare, travel time, map link

## ⚠️ Notes
- Requires internet for Overpass API calls
- Fare estimates are approximate
- Real cab fares depend on surge pricing, operator, etc.
