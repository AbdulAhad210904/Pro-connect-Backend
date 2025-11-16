import express from 'express';
import { 
  createPost, 
  createPostComment, 
  upvotePost, 
  downvotePost,
  getPosts, 
  getCommentsByPostId,
  getPostsWithComments,
  upvoteComment,
  downvoteComment
} from '../controllers/forumController.js';
import { authenticate } from '../middlewares/authentication.js'; // Authentication middleware

const router = express.Router();

// Create a new post
router.post('/posts', authenticate, createPost);

// Add a comment to a post
router.post('/posts/:postId/comments', authenticate, createPostComment);

// Upvote a post
router.post('/posts/:postId/upvote', authenticate, upvotePost);

// Downvote a post
router.post('/posts/:postId/downvote', authenticate, downvotePost);

router.post('/posts/:postId/upvoteComment', authenticate, upvoteComment);

router.post('/posts/:postId/downvoteComment', authenticate, downvoteComment);

router.get('/posts', getPosts); // Fetch all posts

router.get('/posts/:postId/comments', getCommentsByPostId); // Fetch all comments for a specific post

router.get('/posts-with-comments', getPostsWithComments);

export default router;