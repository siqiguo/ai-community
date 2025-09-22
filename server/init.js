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
    const settings = await AutomationSetting.findOne();
    
    if (!settings) {
      console.log('Creating default automation settings...');
      const defaultSettings = new AutomationSetting();
      await defaultSettings.save();
      console.log('Default automation settings created.');
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