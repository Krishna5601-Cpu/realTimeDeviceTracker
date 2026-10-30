const socket = io();

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (postion) => {
      const { latitude, longitude } = postion.coords;
      socket.emit("send-location", { latitude, longitude });
    },
    (error) => {
      console.log(error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    },
  );
}

const map = L.map("map").setView([0, 0], 16);

// Load map pictures (tiles) from OpenStreetMap
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const markers = {};

socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;
  map.setView([latitude, longitude]);

  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }
});

socket.on("user-disconnected", function (id) {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});
