const express = require('express');
const router = express.Router();
const { AICharacter } = require('../models');

/**
 * @route   GET /api/ai-characters
 * @desc    Get all AI characters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const aiCharacters = await AICharacter.find().sort({ createdAt: -1 });
    res.json(aiCharacters);
  } catch (error) {
    console.error('Error fetching AI characters:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/ai-characters/:id
 * @desc    Get AI character by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const aiCharacter = await AICharacter.findById(req.params.id);
    
    if (!aiCharacter) {
      return res.status(404).json({ message: 'AI character not found' });
    }
    
    res.json(aiCharacter);
  } catch (error) {
    console.error('Error fetching AI character:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/ai-characters
 * @desc    Create a new AI character
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { name, personality, profession, interests, goal } = req.body;
    
    // Basic validation
    if (!name || !personality || !profession || !goal) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Create emoji avatar based on personality and profession
    const emojis = {
      friendly: ['😊', '🤗', '😄'],
      analytical: ['🤔', '🧐', '🔍'],
      creative: ['🎨', '✨', '🌈'],
      humorous: ['😂', '🤣', '😜'],
      philosophical: ['🧠', '💭', '🌌']
    };
    
    // Select random emoji based on personality, or default to robot
    const avatar = personality && emojis[personality.toLowerCase()] 
      ? emojis[personality.toLowerCase()][Math.floor(Math.random() * emojis[personality.toLowerCase()].length)]
      : '🤖';
    
    const newAICharacter = new AICharacter({
      name,
      avatar,
      personality,
      profession,
      interests: interests || [],
      goal,
      memoryContext: `${name} is a ${personality} ${profession} who is interested in ${interests ? interests.join(' and ') : 'various topics'}. ${name}'s goal is ${goal}.`
    });
    
    await newAICharacter.save();
    
    res.status(201).json(newAICharacter);
  } catch (error) {
    console.error('Error creating AI character:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/ai-characters/:id
 * @desc    Update an AI character
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, avatar, personality, profession, interests, goal, active } = req.body;
    
    // Find AI character
    const aiCharacter = await AICharacter.findById(req.params.id);
    
    if (!aiCharacter) {
      return res.status(404).json({ message: 'AI character not found' });
    }
    
    // Update fields
    if (name) aiCharacter.name = name;
    if (avatar) aiCharacter.avatar = avatar;
    if (personality) aiCharacter.personality = personality;
    if (profession) aiCharacter.profession = profession;
    if (interests) aiCharacter.interests = interests;
    if (goal) aiCharacter.goal = goal;
    if (active !== undefined) aiCharacter.active = active;
    
    // Update memory context if core attributes changed
    if (name || personality || profession || interests || goal) {
      aiCharacter.memoryContext = `${aiCharacter.name} is a ${aiCharacter.personality} ${aiCharacter.profession} who is interested in ${aiCharacter.interests.join(' and ')}. ${aiCharacter.name}'s goal is ${aiCharacter.goal}.`;
    }
    
    await aiCharacter.save();
    
    res.json(aiCharacter);
  } catch (error) {
    console.error('Error updating AI character:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/ai-characters/:id
 * @desc    Delete an AI character
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const aiCharacter = await AICharacter.findById(req.params.id);
    
    if (!aiCharacter) {
      return res.status(404).json({ message: 'AI character not found' });
    }
    
    await aiCharacter.remove();
    
    res.json({ message: 'AI character removed' });
  } catch (error) {
    console.error('Error deleting AI character:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/ai-characters/:id/memory
 * @desc    Update AI character's memory context
 * @access  Public
 */
router.put('/:id/memory', async (req, res) => {
  try {
    const { memoryContext } = req.body;
    
    if (!memoryContext) {
      return res.status(400).json({ message: 'Memory context is required' });
    }
    
    const aiCharacter = await AICharacter.findById(req.params.id);
    
    if (!aiCharacter) {
      return res.status(404).json({ message: 'AI character not found' });
    }
    
    aiCharacter.memoryContext = memoryContext;
    await aiCharacter.save();
    
    res.json(aiCharacter);
  } catch (error) {
    console.error('Error updating AI character memory:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;