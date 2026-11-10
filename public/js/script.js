const socket = io();

// Map setup

// Start zoomed out until we know where the user is
const map = L.map("map").setView([0, 0], 2);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  subdomains: "abcd",
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
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

// ---------- Send my location to the server ----------

function sendMyLocation(position) {
  const { latitude, longitude } = position.coords;

  hideStatus(); // location works, so clear any old warning
  socket.emit("send-location", { latitude, longitude });
}

// Turn the browser's error code into a message a person can understand
function handleLocationError(error) {
  console.log("Could not get location:", error.message);

  if (error.code === error.PERMISSION_DENIED) {
    showStatus(
      "Location is blocked. Allow it in your browser's site settings, then reload.",
    );
  } else if (error.code === error.POSITION_UNAVAILABLE) {
    showStatus(
      "Your location is unavailable. Check that GPS or Location is turned on.",
    );
  } else if (error.code === error.TIMEOUT) {
    showStatus("Finding your location is taking a while. Still trying...");
  }
}

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(sendMyLocation, handleLocationError, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 10000, // phones can take a few seconds to get a GPS fix
  });
} else {
  showStatus("This browser does not support location.");
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

const statusMessage = document.getElementById("status-message");

// Show a message to the user at the top of the screen
function showStatus(text) {
  statusMessage.textContent = text;
  statusMessage.hidden = false;
}

// Hide the message once everything works again
function hideStatus() {
  statusMessage.hidden = true;
}
