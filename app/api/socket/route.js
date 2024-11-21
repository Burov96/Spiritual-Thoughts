import { Server } from "socket.io";

let io; // Declare a global variable for Socket.IO instance

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for WebSocket connections
  },
};

export async function GET(req, res) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO...");

    // Attach Socket.IO to the server
    io = new Server(res.socket.server, {
      path: "/api/socket", // Ensure correct path for Socket.IO
      cors: {
        origin: "*", // Allow all origins (adjust this for production)
        methods: ["GET", "POST"],
      },
    });

    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Handle new messages
      socket.on("newMessage", ({ roomId, message }) => {
        socket.to(roomId).emit("receiveMessage", message);
      });

      // Handle typing indicator
      socket.on("typing", ({ roomId, user }) => {
        socket.to(roomId).emit("userTyping", user);
      });

      // Join a specific room
      socket.on("joinRoom", ({ roomId }) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  res.end(); // End the response for GET requests
}
