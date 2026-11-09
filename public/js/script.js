const socket = io();

// Map setup

// Start zoomed out until we know where the user is
const map = L.map("map").setView([0, 0], 2);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  subdomains: "abcd",
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
}).addTo(map);

// State

const markersByUserId = {}; // one map marker per connected user
let hasCenteredMap = false; // so we only center the map once

// Helper functions

// Move a user's marker, or create it if this is their first update
function showUserOnMap(userId, latitude, longitude) {
  if (markersByUserId[userId]) {
    markersByUserId[userId].setLatLng([latitude, longitude]);
  } else {
    markersByUserId[userId] = L.marker([latitude, longitude]).addTo(map);
  }
}

// Remove a user's marker when they leave
function removeUserFromMap(userId) {
  if (!markersByUserId[userId]) return;

  map.removeLayer(markersByUserId[userId]);
  delete markersByUserId[userId];
}

// Center the map on me, but only the first time
function centerMapOnMe(latitude, longitude) {
  if (hasCenteredMap) return;

  map.setView([latitude, longitude], 16);
  hasCenteredMap = true;
}

// Send my location to the server

function sendMyLocation(position) {
  const { latitude, longitude } = position.coords;
  socket.emit("send-location", { latitude, longitude });
}

function handleLocationError(error) {
  console.log("Could not get location:", error.message);
}

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(sendMyLocation, handleLocationError, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 5000,
  });
}

// Listen for updates from the server

socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;

  showUserOnMap(id, latitude, longitude);

  if (id === socket.id) {
    centerMapOnMe(latitude, longitude);
  }
});

socket.on("user-disconnected", removeUserFromMap);

// When I join, draw everyone who is already online
socket.on("existing-locations", (locations) => {
  for (const userId in locations) {
    const { latitude, longitude } = locations[userId];
    showUserOnMap(userId, latitude, longitude);
  }
});
