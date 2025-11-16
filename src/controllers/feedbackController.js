import UserFeedback from '../models/UserFeedback.js';
import User from '../models/User.js';
// Create a new feedback
export const createFeedback = async (req, res) => {
    try {
        const { title, description, recordAs } = req.body;
        const feedbackBy = req.userId

        const user = await User.findById(feedbackBy);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const feedback = new UserFeedback({ title, description, recordAs, feedbackBy });
        await feedback.save();

        res.status(201).json({ message: 'Feedback created successfully!', feedback });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create feedback', error: error.message });
    }
};

// Get all feedbacks
export const getAllFeedbacks = async (req, res) => {
    try {
        const feedbacks = await UserFeedback.find().populate('feedbackBy', 'firstName lastName email profilePicture'); // Assuming `User` schema has `name` and `email` fields
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch feedbacks', error: error.message });
    }
};
