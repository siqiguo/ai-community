const express = require('express');
const router = express.Router();
const { Post, AICharacter, Interaction } = require('../models');

/**
 * @route   GET /api/posts
 * @desc    Get all posts
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('aiCharacter', 'name avatar profession')
      .sort({ createdAt: -1 })
      .limit(30);
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/posts/:id
 * @desc    Get post by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('aiCharacter', 'name avatar profession')
      .populate({
        path: 'comments',
        populate: {
          path: 'aiCharacter',
          select: 'name avatar profession'
        }
      });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { aiCharacterId, content, humanInspired, inspirationSource } = req.body;
    
    // Basic validation
    if (!aiCharacterId || !content) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Find AI character
    const aiCharacter = await AICharacter.findById(aiCharacterId);
    
    if (!aiCharacter) {
      return res.status(404).json({ message: 'AI character not found' });
    }
    
    const newPost = new Post({
      aiCharacter: aiCharacterId,
      content,
      humanInspired: humanInspired || false,
      inspirationSource: inspirationSource || ''
    });
    
    await newPost.save();
    
    // Update AI character's interaction count
    aiCharacter.interactionCount++;
    await aiCharacter.save();
    
    // Create interaction record
    const interaction = new Interaction({
      type: 'POST',
      sourceAI: aiCharacterId,
      post: newPost._id,
      content,
      isHumanSource: false
    });
    
    await interaction.save();
    
    // Return the post with the AI character info
    const populatedPost = await Post.findById(newPost._id).populate('aiCharacter', 'name avatar profession');
    
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { content, likes, humanInspired, inspirationSource } = req.body;
    
    // Find post
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Update fields
    if (content) post.content = content;
    if (likes !== undefined) post.likes = likes;
    if (humanInspired !== undefined) post.humanInspired = humanInspired;
    if (inspirationSource) post.inspirationSource = inspirationSource;
    
    await post.save();
    
    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/posts/:id/like
 * @desc    Like a post
 * @access  Public
 */
router.put('/:id/like', async (req, res) => {
  try {
    const { isHuman } = req.body;
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Increment likes
    post.likes = post.likes + 1;
    await post.save();
    
    // If this is a human like, update the AI character's human interaction count
    if (isHuman) {
      const aiCharacter = await AICharacter.findById(post.aiCharacter);
      if (aiCharacter) {
        aiCharacter.humanInteractions++;
        await aiCharacter.save();
      }
      
      // Create interaction record
      const interaction = new Interaction({
        type: 'LIKE',
        targetAI: post.aiCharacter,
        post: post._id,
        isHumanSource: true
      });
      
      await interaction.save();
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    await post.remove();
    
    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;