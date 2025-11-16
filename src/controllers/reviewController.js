import Review from '../models/Review.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

export const createReview = async (req, res) => {
  try {
    const { projectId, revieweeId, rating, comment } = req.body;
    const reviewerId = req.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot review an incomplete project' });
    }

    const reviewer = await User.findById(reviewerId);
    const reviewerType = reviewer.userType;

    if (reviewerType === 'individual' && !project.postedBy.equals(reviewerId)) {
      return res.status(403).json({ message: 'You are not authorized to review this project as an individual' });
    }
    if (reviewerType === 'craftsman' && !project.assignedTo.equals(reviewerId)) {
      return res.status(403).json({ message: 'You are not authorized to review this project as a craftsman' });
    }

    // Use findOneAndUpdate with upsert to handle both creation and update
    const review = await Review.findOneAndUpdate(
      { projectId, reviewerType },
      { reviewerId, revieweeId, rating, comment },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(review);
  } catch (error) {
    console.error('Error in createReview:', error);
    res.status(500).json({ message: 'Error creating/updating review', error: error.message });
  }
};

export const getReviewsForProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    const reviews = await Review.find({ projectId })
      .populate('reviewerId', 'firstName lastName userType')
      .populate('revieweeId', 'firstName lastName userType');

    const individualReview = reviews.find(review => review.reviewerType === 'individual');
    const craftsmanReview = reviews.find(review => review.reviewerType === 'craftsman');

    const userReview = reviews.find(review => review.reviewerId._id.toString() === userId);

    res.status(200).json({
      individualReview,
      craftsmanReview,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

export const getReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ revieweeId: userId })
      .populate('projectId', 'title')
      .populate('reviewerId', 'firstName lastName userType');
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

export const getReviewsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ reviewerId: userId })
      .populate('projectId', 'title')
      .populate('revieweeId', 'firstName lastName userType');
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { rating, comment },
      { new: true }
    );
    if (!updatedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(200).json(updatedReview);
  } catch (error) {
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const deletedReview = await Review.findByIdAndDelete(reviewId);
    if (!deletedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};