import FeatureRequest from '../models/featureRequest.js';
import User from '../models/User.js';

export const createRequest = async (req, res) => {
    try {
        const { title, description } = req.body;
        const requestBy = req.userId

        const user = await User.findById(requestBy);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const request = new FeatureRequest({ title, description,requestBy });
        await request.save();

        res.status(201).json({ message: 'Request created successfully!', request });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create request', error: error.message });
    }
};

// Get all feedbacks
export const getAllRequests = async (req, res) => {
    try {
        const requests = await FeatureRequest.find().populate('requestBy', 'firstName lastName email'); // Assuming `User` schema has `name` and `email` fields
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
    }
};


// Upvote a request
export const upvoteRequest = async (req, res) => {
    const { requestId } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    try {
        const request = await FeatureRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.upvotes.includes(userId)) {
            // Remove upvote if already upvoted
            request.upvotes.pull(userId);
        } else {
            // Add upvote and remove from downvotes if necessary
            request.upvotes.push(userId);
            request.downvotes.pull(userId);
        }

        await request.save();

        return res.status(200).json({ message: 'Upvote updated', request });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update upvote', error });
    }
};

// Downvote a request
export const downvoteRequest = async (req, res) => {
    const { requestId } = req.params;
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    try {
        const request = await FeatureRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.downvotes.includes(userId)) {
            // Remove downvote if already downvoted
            request.downvotes.pull(userId);
        } else {
            // Add downvote and remove from upvotes if necessary
            request.downvotes.push(userId);
            request.upvotes.pull(userId);
        }

        await request.save();

        return res.status(200).json({ message: 'Downvote updated', request });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update downvote', error });
    }
};
