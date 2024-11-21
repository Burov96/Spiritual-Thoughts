import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    path: "/api/socket", // Ensure this matches the client-side path
    cors: {
      origin: "*", // Allow all origins (adjust for production)
      methods: ["GET", "POST"],
    },
  });

  // Handle WebSocket connections
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Handle joining a room
    socket.on("joinRoom", ({ roomId }) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    // Handle new messages
    socket.on("newMessage", ({ roomId, message }) => {
      socket.to(roomId).emit("receiveMessage", message);
    });

    // Handle typing indicator
    socket.on("typing", ({ roomId, user }) => {
      socket.to(roomId).emit("userTyping", user);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Start the server
  server.listen(3000, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:3000");
  });
});
