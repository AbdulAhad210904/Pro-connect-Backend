import mongoose from 'mongoose';

const forumCommentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  datePosted: { type: Date, default: Date.now },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] 
}, { timestamps: true });

const ForumComment = mongoose.model('ForumComment', forumCommentSchema);

export default ForumComment;