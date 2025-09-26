const express = require('express');
const router = express.Router();
const { testClaudeAPI } = require('../services/claudeTest');

/**
 * @route   GET /api/test/claude
 * @desc    Test Claude API connection
 * @access  Public
 */
router.get('/claude', async (req, res) => {
  try {
    const result = await testClaudeAPI();
    res.json(result);
  } catch (error) {
    console.error('Error testing Claude API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error testing Claude API',
      error: error.message 
    });
  }
});

module.exports = router;