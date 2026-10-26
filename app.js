const { publicDecrypt } = require("crypto");
const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");

const app = express();

const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");
app.set(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("Hello Krishna Jii");
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`The server is running on http://localhost:${PORT}`);
});
