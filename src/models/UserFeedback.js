import mongoose from 'mongoose';

const userFeedbackSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    recordAs: { type: String, enum: ['Company', 'Freelancer', 'Job Seeker', 'Employee'], required: true },
    feedbackBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const UserFeedback = mongoose.model('UserFeedback', userFeedbackSchema);
export default UserFeedback;