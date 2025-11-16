import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  content: { type: String, required: true },
  relatedId: mongoose.Schema.Types.ObjectId,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;