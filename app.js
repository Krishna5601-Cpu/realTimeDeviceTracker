const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Latest known location of every connected user, stored by socket id
const userLocations = {};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  // Give the new user everyone's current location
  socket.emit("existing-locations", userLocations);

  socket.on("send-location", (data) => {
    // Keep only latitude and longitude, ignore anything else a client sends
    const { latitude, longitude } = data;
    userLocations[socket.id] = { latitude, longitude };

    io.emit("receive-location", { id: socket.id, latitude, longitude });
  });

  socket.on("disconnect", () => {
    delete userLocations[socket.id];
    io.emit("user-disconnected", socket.id);
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

// Use the port given by the host, or 3000 on your own computer
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`The server is running on http://localhost:${PORT}`);
});
