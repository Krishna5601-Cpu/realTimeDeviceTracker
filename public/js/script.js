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
