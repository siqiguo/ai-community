const mongoose = require('mongoose');
const { AutomationSetting } = require('./models');
const automationService = require('./services/automation');

/**
 * Initialize the database and services
 */
const initializeApp = async () => {
  try {
    console.log('Initializing application...');
    
    // Check if automation settings exist, create default if not
    let settings = await AutomationSetting.findOne();
    
    if (!settings) {
      console.log('Creating default automation settings...');
      settings = new AutomationSetting();
      await settings.save();
      console.log('Default automation settings created.');
    } else {
      // Always reset settings to latest defaults on server start
      console.log('Updating automation settings to latest defaults...');
      
      // Set new default values
      settings.publishInterval = 180000; // 3 minutes in milliseconds
      settings.interactionProbability = 0.5; // 50% chance
      settings.autoPublishEnabled = true;
      settings.aiInteractionEnabled = true;
      settings.maxPostsPerInterval = 10;
      settings.lastUpdated = Date.now();
      
      await settings.save();
      console.log('Automation settings updated.');
    }
    
    // Initialize automation service
    await automationService.initialize();
    
    console.log('Application initialization complete.');
  } catch (error) {
    console.error('Error during application initialization:', error);
    throw error;
  }
};

module.exports = initializeApp;