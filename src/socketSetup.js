import { Server } from 'socket.io';
import Chat from './models/Chat.js';

export default function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join chat', (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    socket.on('leave chat', (chatId) => {
      socket.leave(chatId);
      console.log(`User left chat: ${chatId}`);
    });

    socket.on('send message', async ({ chatId, senderId, content }) => {
      try {
        const newMessage = {
          senderId,
          content,
          timestamp: new Date(),
          isRead: false
        };

        const updatedChat = await Chat.findByIdAndUpdate(
          chatId,
          {
            $push: { messages: newMessage },
            $set: { lastMessageDate: new Date() }
          },
          { new: true }
        );

        io.to(chatId).emit('new message', newMessage);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });

  return io;
}