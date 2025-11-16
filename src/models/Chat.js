// import mongoose from 'mongoose';

// const chatSchema = new mongoose.Schema({
//   projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
//   individualId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   craftsmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   messages: [{
//     senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     content: { type: String, required: true },
//     timestamp: { type: Date, default: Date.now },
//     isRead: { type: Boolean, default: false }
//   }],
//   lastMessageDate: { type: Date, default: Date.now }
// }, { timestamps: true });

// const Chat = mongoose.model('Chat', chatSchema);

// export default Chat;

import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
  }],
  lastMessageDate: { type: Date, default: Date.now }
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;