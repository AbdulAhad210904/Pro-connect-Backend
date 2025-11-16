import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './src/config/db.js';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './src/routes/userRoute.js';
import projectRoutes from './src/routes/projectRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import { addMessageToChat } from './src/controllers/chatController.js';
import craftsmanProfileRoutes from './src/routes/craftsmanProfileRoutes.js';
import forumRoutes from './src/routes/forumRoutes.js';
import bugReportRoutes from './src/routes/bugReportRoutes.js';
import feedbackRoutes from './src/routes/feedbackRoute.js';
import FeatureRequestRoutes from './src/routes/featureRequestRoutes.js';
import NewsRoutes from './src/routes/newsRoutes.js';
import ReviewRoutes from './src/routes/reviewRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import SessionRoutes from './src/routes/sessionRoutes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000', // Local development URL
      'https://proconnect-front.vercel.app' // Production URL from .env
    ], // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', // Local development URL
    'https://proconnect-front.vercel.app' // Production URL from .env
  ], // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// Make io accessible to our router
app.set('io', io);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/craftsmanProfile', craftsmanProfileRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api', bugReportRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', FeatureRequestRoutes);
app.use('/api', NewsRoutes);
app.use('/api', ReviewRoutes);
app.use('/api', paymentRoutes);
app.use('/api', SessionRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('ProConnect API is running');
});

// Socket.IO logic
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
        isRead: false,
      };
  
      // Save message to database
      const savedMessage = await addMessageToChat(chatId, newMessage);
  
      // Emit message to all clients in the room, except the sender
      socket.to(chatId).emit('new message', savedMessage);
      console.log(`Message sent to chat ${chatId}:`, savedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Error sending message', error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
