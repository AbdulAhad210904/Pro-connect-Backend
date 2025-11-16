import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewerType: { type: String, enum: ['individual', 'craftsman'], required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  datePosted: { type: Date, default: Date.now }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;