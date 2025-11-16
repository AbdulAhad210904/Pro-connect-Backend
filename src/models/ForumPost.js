import mongoose from 'mongoose';

const forumPostSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  datePosted: { type: Date, default: Date.now },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] 
}, { timestamps: true });

const ForumPost = mongoose.model('ForumPost', forumPostSchema);

export default ForumPost;