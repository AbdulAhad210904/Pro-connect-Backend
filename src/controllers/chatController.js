import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

export const initializeChat = async (req, res) => {
  try {
    const { projectId, applicantId } = req.params;
    console.log("Request Params:", req.params);
    const userId = req.userId.toString();
    console.log("Request User ID:", userId);

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectOwner = await User.findById(userId);
    if (!projectOwner) {
      console.log("Project owner not found. User ID:", userId);
      return res.status(404).json({ message: 'Project owner not found' });
    }

    const applicant = await User.findById(applicantId);
    if (!applicant) {
      console.log("Applicant not found. Applicant ID:", applicantId);
      return res.status(404).json({ message: 'Applicant not found' });
    }

    let chat = await Chat.findOne({
      projectId,
      participants: { $all: [userId, applicantId] }
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, applicantId],
        projectId
      });
      await chat.save();
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error initializing chat:", error.message);
    res.status(500).json({ message: 'Error initializing chat', error: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId).populate('messages.senderId', 'name');
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.status(200).json(chat.messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    chat.messages.forEach(message => {
      if (message.senderId.toString() !== userId) {
        message.isRead = true;
      }
    });

    await chat.save();
    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
};

export const addMessageToChat = async (chatId, message) => {
  try {
    console.log('Adding message to chat:', message);
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    chat.messages.push(message);
    chat.lastMessageDate = message.timestamp;
    await chat.save();

    return message;
  } catch (error) {
    console.error('Error adding message to chat:', error);
    throw error;
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const senderId = req.userId;

    const newMessage = {
      senderId,
      content,
      timestamp: new Date(),
      isRead: false
    };

    const savedMessage = await addMessageToChat(chatId, newMessage);
    
    // Get the io instance
    const io = req.app.get('io');
    
    if (io) {
      // Emit the new message to all clients in the chat room, except the sender
      io.to(chatId).except(req.headers['socket-id']).emit('new message', savedMessage);
      console.log(`Message emitted to chat ${chatId}:`, savedMessage);
    } else {
      console.warn('Socket.io instance not available');
    }

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

