const mongoose = require('mongoose');
const { AutomationSetting, AICharacter } = require('./models');
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
      settings = new AutomationSetting({
        autoPublishEnabled: true,
        aiInteractionEnabled: true,
        publishInterval: 60000, // Check for scheduled posts every minute
        maxPostsPerInterval: 2 // Only attempt 2 posts per scheduled check
      });
      await settings.save();
      console.log('Default automation settings created.');
    } else {
      // Update settings for staggered posts system
      console.log('Updating automation settings for staggered post system...');
      
      // Set new default values
      settings.publishInterval = 60000; // 1 minute check interval
      settings.interactionProbability = 0.7; // 70% chance
      settings.autoPublishEnabled = true;
      settings.aiInteractionEnabled = true;
      settings.maxPostsPerInterval = 2;
      settings.lastUpdated = Date.now();
      
      await settings.save();
      console.log('Automation settings updated.');
    }
    
    // Set up staggered posting for AI characters
    const aiCharacters = await AICharacter.find();
    if (aiCharacters.length > 0) {
      console.log(`Setting up staggered posting schedules for ${aiCharacters.length} AI characters...`);
      
      // Update each AI with a randomized post interval
      for (const character of aiCharacters) {
        // Random interval between 3-8 minutes (in milliseconds)
        character.postInterval = Math.floor(Math.random() * 300000) + 180000;
        
        // Randomize the last posted time to stagger initial posts
        const randomMinutesAgo = Math.floor(Math.random() * 10) * 60000; // 0-10 minutes ago
        character.lastPosted = randomMinutesAgo === 0 ? 
          null : // Some AIs have never posted
          new Date(Date.now() - randomMinutesAgo);
          
        await character.save();
      }
      
      console.log('Staggered posting schedules created.');
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