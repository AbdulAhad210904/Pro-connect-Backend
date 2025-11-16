import ForumPost from '../models/ForumPost.js';
import ForumComment from '../models/ForumComment.js';

// Get all posts along with their comments
export const getPostsWithComments = async (req, res) => { 
  try {
    // Fetch all posts
    const posts = await ForumPost.find()
      .populate('author', 'firstName lastName profilePicture') // Populate author details
      .sort({ datePosted: -1 }); // Sort posts by most recent

    // Map through posts to fetch associated comments
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const comments = await ForumComment.find({ postId: post._id })
          .populate('author', 'firstName lastName profilePicture') // Populate comment author details
          .sort({ datePosted: 1 }); // Sort comments by oldest first

        return {
          id: post._id,
          author: {
            id: post.author._id,
            name: `${post.author.firstName} ${post.author.lastName}`,
            avatar: post.author.profilePicture,
          },
          content: post.content,
          timestamp: post.datePosted.toISOString(),
          likes: post.upvotes,
          dislikes: post.downvotes,
          replies: comments.map((comment) => ({
            id: comment._id,
            author: {
              id: comment.author._id,
              name: `${comment.author.firstName} ${comment.author.lastName}`,
              avatar: comment.author.profilePicture,
            },
            content: comment.content,
            timestamp: comment.datePosted.toISOString(),
            likes: comment.upvotes,
            dislikes: comment.downvotes,
          })),
        };
      })
    );

    return res.status(200).json(postsWithComments);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch posts and comments', error });
  }
};


// Get all posts
export const getPosts = async (req, res) => {
    try {
      const posts = await ForumPost.find()
      .populate('author', 'firstName lastName profilePicture')// Populate author details (e.g., username)
        .sort({ datePosted: -1 }); // Sort by most recent posts
      return res.status(200).json( posts );
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch posts', error });
    }
  };

  // Get all comments for a specific post
export const getCommentsByPostId = async (req, res) => {
    const { postId } = req.params;
  
    try {
      const comments = await ForumComment.find({ postId })
      .populate('author', 'firstName lastName profilePicture')// Populate author details (e.g., username)
        .sort({ datePosted: 1 }); // Sort by oldest first
  
      return res.status(200).json({ comments });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch comments', error });
    }
  };

// Create a new post
export const createPost = async (req, res) => {
  const { content } = req.body;
  const userId = req.userId; // Assuming userId is extracted from middleware
  // console.log(req.userId)
  try {
    const newPost = new ForumPost({
      content,
      author: userId,
    });

    await newPost.save();
    const posts = await ForumPost.find()
    .populate('author', 'firstName lastName profilePicture') // Populate author details
    .sort({ datePosted: -1 }); // Sort posts by most recent

  // Map through posts to fetch associated comments
  const postsWithComments = await Promise.all(
    posts.map(async (post) => {
      const comments = await ForumComment.find({ postId: post._id })
        .populate('author', 'firstName lastName profilePicture') // Populate comment author details
        .sort({ datePosted: 1 }); // Sort comments by oldest first

      return {
        id: post._id,
        author: {
          id: post.author._id,
          name: `${post.author.firstName} ${post.author.lastName}`,
          avatar: post.author.profilePicture,
        },
        content: post.content,
        timestamp: post.datePosted.toISOString(),
        likes: post.upvotes,
        dislikes: post.downvotes,
        replies: comments.map((comment) => ({
          id: comment._id,
          author: {
            id: comment.author._id,
            name: `${comment.author.firstName} ${comment.author.lastName}`,
            avatar: comment.author.profilePicture,
          },
          content: comment.content,
          timestamp: comment.datePosted.toISOString(),
          likes: comment.upvotes,
          dislikes: comment.downvotes,
        })),
      };
    })
  );
    return res.status(201).json({ message: 'Post created successfully', posts: postsWithComments });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create post', error });
  }
};

// Create a new comment on a post
export const createPostComment = async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.userId;
  // console.log(userId)
  //   const userId = req.user._id; // Assuming userId is extracted from middleware

  try {
    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = new ForumComment({
      postId,
      author: userId,
      content,
    });

    await newComment.save();
    const posts = await ForumPost.find()
    .populate('author', 'firstName lastName profilePicture') // Populate author details
    .sort({ datePosted: -1 }); // Sort posts by most recent

  // Map through posts to fetch associated comments
  const postsWithComments = await Promise.all(
    posts.map(async (post) => {
      const comments = await ForumComment.find({ postId: post._id })
        .populate('author', 'firstName lastName profilePicture') // Populate comment author details
        .sort({ datePosted: 1 }); // Sort comments by oldest first

      return {
        id: post._id,
        author: {
          id: post.author._id,
          name: `${post.author.firstName} ${post.author.lastName}`,
          avatar: post.author.profilePicture,
        },
        content: post.content,
        timestamp: post.datePosted.toISOString(),
        likes: post.upvotes,
        dislikes: post.downvotes,
        replies: comments.map((comment) => ({
          id: comment._id,
          author: {
            id: comment.author._id,
            name: `${comment.author.firstName} ${comment.author.lastName}`,
            avatar: comment.author.profilePicture,
          },
          content: comment.content,
          timestamp: comment.datePosted.toISOString(),
          likes: comment.upvotes,
          dislikes: comment.downvotes,
        })),
      };
    })
  );
    return res.status(201).json({ message: 'Comment added successfully', posts: postsWithComments });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add comment', error });
  }
};

// Upvote a post
export const upvotePost = async (req, res) => {
  const { postId} = req.params;
  const userId = req.userId;
  // console.log("UPVOTE")
  // console.log(req.body);
//   const userId = req.user._id; // Assuming userId is extracted from middleware

  try {
    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.upvotes.includes(userId)) {
      // Remove upvote if already upvoted
      post.upvotes.pull(userId);
    } else {
      // Add upvote and remove from downvotes if necessary
      post.upvotes.push(userId);
      post.downvotes.pull(userId);
    }

    await post.save();

    return res.status(200).json({ message: 'Upvote updated', post });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update upvote', error });
  }
};

// Downvote a post
export const downvotePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.userId;
  // console.log("DOWNVOTE")
  //   const userId = req.user._id; // Assuming userId is extracted from middleware

  try {
    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.downvotes.includes(userId)) {
      // Remove downvote if already downvoted
      post.downvotes.pull(userId);
    } else {
      // Add downvote and remove from upvotes if necessary
      post.downvotes.push(userId);
      post.upvotes.pull(userId);
    }

    await post.save();

    return res.status(200).json({ message: 'Downvote updated', post });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update downvote', error });
  }
};

export const upvoteComment = async (req, res) => {
  const  commentId  = req.params.postId;
  const userId = req.userId; // Assuming userId is extracted from middleware
  try {
    const comment = await ForumComment
      .findById(commentId)
      .populate('postId');
      if (!comment) {
        return res.status(304).json({ message: 'Comment not found' });
      }
      if (comment.upvotes.includes(userId)) {
        // Remove upvote if already upvoted
        comment.upvotes.pull(userId);
      } else {
        // Add upvote and remove from downvotes if necessary
        comment.upvotes.push(userId);
        comment.downvotes.pull(userId);
      }
      await comment.save();
      return res.status(200).json({ message: 'Upvote updated', comment });
    }
    catch (error) {
      return res.status(500).json({ message: 'Failed to update upvote', error });
    }
  }

// Downvote a comment
export const downvoteComment = async (req, res) => {
  const  commentId  = req.params.postId;
  const userId = req.userId; // Assuming userId is extracted from middleware
  try {
    const comment = await ForumComment
      .findById(commentId)
      .populate('postId');
      if (!comment) {
        return res.status(304).json({ message: 'Comment not found' });
      }
      if (comment.downvotes.includes(userId)) {
        // Remove downvote if already downvoted
        comment.downvotes.pull(userId);
      } else {
        // Add downvote and remove from upvotes if necessary
        comment.downvotes.push(userId);
        comment.upvotes.pull(userId);
      }
      await comment.save();
      return res.status(200).json({ message: 'Downvote updated', comment });
    }
    catch (error) {
      return res.status(500).json({ message: 'Failed to update downvote', error });
    }
  }