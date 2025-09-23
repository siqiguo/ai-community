const express = require('express');
const router = express.Router();
const { AutomationSetting } = require('../models');
const automationService = require('../services/automation');

/**
 * @route   GET /api/automation/settings
 * @desc    Get automation settings
 * @access  Public
 */
router.get('/settings', async (req, res) => {
  try {
    // Find settings or create default
    let settings = await AutomationSetting.findOne();
    
    if (!settings) {
      settings = new AutomationSetting();
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching automation settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/automation/settings
 * @desc    Update automation settings
 * @access  Public
 */
router.put('/settings', async (req, res) => {
  try {
    const {
      autoPublishEnabled,
      aiInteractionEnabled,
      publishInterval,
      interactionProbability,
      humanInteractionProbability,
      maxPostsPerInterval,
      maxCommentsPerInterval
    } = req.body;
    
    // Find settings or create default
    let settings = await AutomationSetting.findOne();
    
    if (!settings) {
      settings = new AutomationSetting();
    }
    
    // Update fields
    if (autoPublishEnabled !== undefined) settings.autoPublishEnabled = autoPublishEnabled;
    if (aiInteractionEnabled !== undefined) settings.aiInteractionEnabled = aiInteractionEnabled;
    if (publishInterval) settings.publishInterval = publishInterval;
    if (interactionProbability !== undefined) settings.interactionProbability = interactionProbability;
    if (humanInteractionProbability !== undefined) settings.humanInteractionProbability = humanInteractionProbability;
    if (maxPostsPerInterval) settings.maxPostsPerInterval = maxPostsPerInterval;
    if (maxCommentsPerInterval) settings.maxCommentsPerInterval = maxCommentsPerInterval;
    
    settings.lastUpdated = Date.now();
    
    await settings.save();
    
    // Update automation service settings
    await automationService.updateSettings(settings);
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating automation settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/automation/reset-settings
 * @desc    Reset automation settings to defaults
 * @access  Public
 */
router.post('/reset-settings', async (req, res) => {
  try {
    // Delete any existing settings
    await AutomationSetting.deleteMany({});
    
    // Create new default settings
    const newSettings = new AutomationSetting();
    await newSettings.save();
    
    // Update automation service with new settings
    await automationService.updateSettings(newSettings);
    
    res.json({ 
      success: true, 
      message: 'Automation settings reset to defaults',
      settings: newSettings 
    });
  } catch (error) {
    console.error('Error resetting automation settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/automation/trigger
 * @desc    Trigger automation processes manually
 * @access  Public
 */
router.post('/trigger', async (req, res) => {
  try {
    const { action } = req.body;
    
    if (!action || !['generate-posts', 'generate-interactions', 'all'].includes(action)) {
      return res.status(400).json({ message: 'Valid action required' });
    }
    
    // Trigger the appropriate action
    const result = await automationService.triggerContentGeneration(action);
    
    res.json({ 
      success: true,
      message: `Triggered automation: ${action}`,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error triggering automation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/automation/reset
 * @desc    Reset the community
 * @access  Public
 */
router.post('/reset', async (req, res) => {
  try {
    const { target } = req.body;
    
    // This would normally delete data based on target
    // For now, just return success message
    res.json({
      success: true,
      message: `Reset request received for target: ${target || 'all'}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error resetting community:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;