const contentGenerator = require('./contentGenerator');
const { AutomationSetting } = require('../models');

class AutomationService {
  constructor() {
    this.postIntervalId = null;
    this.interactionIntervalId = null;
    this.humanInteractionIntervalId = null;
    this.settings = null;
    this.initialized = false;
  }
  
  /**
   * Initialize the automation service
   */
  async initialize() {
    try {
      // Get settings from database or create defaults
      let settings = await AutomationSetting.findOne();
      
      if (!settings) {
        settings = new AutomationSetting();
        await settings.save();
      }
      
      this.settings = settings;
      this.initialized = true;
      
      // Start automation if enabled
      if (this.settings.autoPublishEnabled) {
        this.startPostGeneration();
      }
      
      if (this.settings.aiInteractionEnabled) {
        this.startInteractionGeneration();
      }
      
      // Always process human interactions
      this.startHumanInteractionProcessing();
      
      console.log('Automation service initialized');
    } catch (error) {
      console.error('Error initializing automation service:', error);
      throw error;
    }
  }
  
  /**
   * Update settings
   * @param {object} updatedSettings - The updated settings
   */
  async updateSettings(updatedSettings) {
    try {
      // Initialize if not already
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Update settings
      const prevSettings = { ...this.settings.toObject() };
      
      // Update fields
      Object.keys(updatedSettings).forEach(key => {
        if (key in this.settings) {
          this.settings[key] = updatedSettings[key];
        }
      });
      
      this.settings.lastUpdated = Date.now();
      await this.settings.save();
      
      // Handle state changes
      
      // Auto-publish toggle
      if (prevSettings.autoPublishEnabled !== this.settings.autoPublishEnabled) {
        if (this.settings.autoPublishEnabled) {
          this.startPostGeneration();
        } else {
          this.stopPostGeneration();
        }
      }
      
      // AI interaction toggle
      if (prevSettings.aiInteractionEnabled !== this.settings.aiInteractionEnabled) {
        if (this.settings.aiInteractionEnabled) {
          this.startInteractionGeneration();
        } else {
          this.stopInteractionGeneration();
        }
      }
      
      // Update interval timing if changed
      if (prevSettings.publishInterval !== this.settings.publishInterval && this.settings.autoPublishEnabled) {
        this.restartPostGeneration();
      }
      
      return this.settings;
    } catch (error) {
      console.error('Error updating automation settings:', error);
      throw error;
    }
  }
  
  /**
   * Start post generation automation
   */
  startPostGeneration() {
    // Clear any existing intervals
    if (this.postIntervalId) {
      clearInterval(this.postIntervalId);
    }
    
    // Check for posts every minute
    const checkIntervalMs = 60000; // Check every minute
    
    this.postIntervalId = setInterval(async () => {
      try {
        // Only proceed if auto-publish is enabled
        if (this.settings.autoPublishEnabled) {
          console.log('Checking for scheduled AI posts...');
          // This will only generate posts for AIs that are ready to post based on their individual schedules
          await contentGenerator.generateScheduledPosts();
        }
      } catch (error) {
        console.error('Error in automated post generation:', error);
      }
    }, checkIntervalMs);
    
    console.log(`Post scheduler active, checking for posts every ${checkIntervalMs / 1000} seconds`);
  }
  
  /**
   * Stop post generation automation
   */
  stopPostGeneration() {
    if (this.postIntervalId) {
      clearInterval(this.postIntervalId);
      this.postIntervalId = null;
      console.log('Post generation stopped');
    }
  }
  
  /**
   * Restart post generation with updated settings
   */
  restartPostGeneration() {
    this.stopPostGeneration();
    this.startPostGeneration();
  }
  
  /**
   * Start interaction generation automation
   */
  startInteractionGeneration() {
    // Clear any existing interval
    if (this.interactionIntervalId) {
      clearInterval(this.interactionIntervalId);
    }
    
    // Set new interval - check every 2 minutes
    const intervalMs = 120000; // 2 minutes
    
    this.interactionIntervalId = setInterval(async () => {
      try {
        if (this.settings.aiInteractionEnabled) {
          console.log('Checking for AI interaction opportunities');
          // Only generate one interaction at a time to avoid overwhelming the API
          await contentGenerator.generateAIInteractions(1);
        }
      } catch (error) {
        console.error('Error in automated interaction generation:', error);
      }
    }, intervalMs);
    
    console.log(`AI interaction checks scheduled every ${intervalMs / 60000} minutes`);
  }
  
  /**
   * Stop interaction generation automation
   */
  stopInteractionGeneration() {
    if (this.interactionIntervalId) {
      clearInterval(this.interactionIntervalId);
      this.interactionIntervalId = null;
      console.log('Interaction generation stopped');
    }
  }
  
  /**
   * Start processing human interactions
   */
  startHumanInteractionProcessing() {
    // Clear any existing interval
    if (this.humanInteractionIntervalId) {
      clearInterval(this.humanInteractionIntervalId);
    }
    
    // Check for human interactions more frequently
    const intervalMs = 60000; // Every minute
    
    this.humanInteractionIntervalId = setInterval(async () => {
      try {
        await contentGenerator.processHumanInteractions();
      } catch (error) {
        console.error('Error processing human interactions:', error);
      }
    }, intervalMs);
    
    console.log(`Human interaction processing scheduled every ${intervalMs / 60000} minutes`);
  }
  
  /**
   * Manually trigger content generation
   * @param {string} action - The action to trigger ('generate-posts', 'generate-interactions', or 'all')
   */
  async triggerContentGeneration(action) {
    try {
      let result = { success: true, details: {} };
      
      switch (action) {
        case 'generate-posts':
          // For manual triggers, we still use the batch method but with a limit of 3
          // to avoid overwhelming the system
          result.details.posts = await contentGenerator.generateBatchPosts(3);
          break;
          
        case 'generate-interactions':
          result.details.interactions = await contentGenerator.generateMultipleInteractions(3);
          break;
          
        case 'all':
          // Generate just one post and a few interactions for manual triggers
          result.details.posts = await contentGenerator.generateBatchPosts(1);
          result.details.interactions = await contentGenerator.generateMultipleInteractions(2);
          break;
          
        default:
          throw new Error('Invalid action');
      }
      
      return result;
    } catch (error) {
      console.error('Error triggering content generation:', error);
      throw error;
    }
  }
}

// Export singleton instance
const automationService = new AutomationService();
module.exports = automationService;