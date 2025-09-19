const express = require('express');
const router = express.Router();
const { Comment, Post, AICharacter, Interaction } = require('../models');

/**
 * @route   GET /api/comments
 * @desc    Get all comments
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { postId } = req.query;
    
    // If postId is provided, filter by post
    const filter = postId ? { post: postId } : {};
    
    const comments = await Comment.find(filter)
      .populate('aiCharacter', 'name avatar profession')
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/comments/:id
 * @desc    Get comment by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('aiCharacter', 'name avatar profession')
      .populate({
        path: 'replies',
        populate: {
          path: 'aiCharacter',
          select: 'name avatar profession'
        }
      });
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    res.json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/comments
 * @desc    Create a new comment
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { postId, aiCharacterId, content, isHuman, parentCommentId } = req.body;
    
    // Basic validation
    if (!postId || !content) {
      return res.status(400).json({ message: 'Please provide post ID and content' });
    }
    
    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // If it's an AI comment, verify AI character exists
    if (!isHuman && !aiCharacterId) {
      return res.status(400).json({ message: 'AI character ID is required for AI comments' });
    }
    
    // If parentCommentId is provided, check if it exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }
    
    const newComment = new Comment({
      post: postId,
      content,
      isHuman,
      aiCharacter: isHuman ? null : aiCharacterId,
      parentComment: parentCommentId || null
    });
    
    await newComment.save();
    
    // If this is an AI comment, update the AI character's interaction count
    if (!isHuman && aiCharacterId) {
      const aiCharacter = await AICharacter.findById(aiCharacterId);
      if (aiCharacter) {
        aiCharacter.interactionCount++;
        await aiCharacter.save();
      }
    }
    
    // Create interaction record
    const interaction = new Interaction({
      type: parentCommentId ? 'REPLY' : 'COMMENT',
      sourceAI: isHuman ? null : aiCharacterId,
      targetAI: post.aiCharacter,
      post: postId,
      comment: newComment._id,
      content,
      isHumanSource: isHuman
    });
    
    await interaction.save();
    
    // If this is a human comment on an AI post, update the human interaction count
    if (isHuman) {
      const aiCharacter = await AICharacter.findById(post.aiCharacter);
      if (aiCharacter) {
        aiCharacter.humanInteractions++;
        await aiCharacter.save();
      }
    }
    
    // Return the comment with populated fields
    const populatedComment = await Comment.findById(newComment._id)
      .populate('aiCharacter', 'name avatar profession');
    
    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/comments/:id/like
 * @desc    Like a comment
 * @access  Public
 */
router.put('/:id/like', async (req, res) => {
  try {
    const { isHuman } = req.body;
    
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Increment likes
    comment.likes = comment.likes + 1;
    await comment.save();
    
    // If this is a human like on an AI comment, update the AI character's human interaction count
    if (isHuman && comment.aiCharacter) {
      const aiCharacter = await AICharacter.findById(comment.aiCharacter);
      if (aiCharacter) {
        aiCharacter.humanInteractions++;
        await aiCharacter.save();
      }
      
      // Create interaction record
      const interaction = new Interaction({
        type: 'LIKE',
        targetAI: comment.aiCharacter,
        comment: comment._id,
        isHumanSource: true
      });
      
      await interaction.save();
    }
    
    res.json(comment);
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete a comment
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    await comment.remove();
    
    res.json({ message: 'Comment removed' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;