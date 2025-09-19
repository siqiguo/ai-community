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
    // Clear any existing interval
    if (this.postIntervalId) {
      clearInterval(this.postIntervalId);
    }
    
    // Set new interval
    const intervalMs = this.settings.publishInterval || 3600000; // Default 1 hour
    
    this.postIntervalId = setInterval(async () => {
      try {
        console.log('Auto-generating posts');
        const limit = this.settings.maxPostsPerInterval || 5;
        await contentGenerator.generateBatchPosts(limit);
      } catch (error) {
        console.error('Error in automated post generation:', error);
      }
    }, intervalMs);
    
    console.log(`Post generation scheduled every ${intervalMs / 60000} minutes`);
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
    
    // Set new interval
    const intervalMs = Math.floor((this.settings.publishInterval || 3600000) / 2); // Half of post interval
    
    this.interactionIntervalId = setInterval(async () => {
      try {
        console.log('Auto-generating AI interactions');
        const limit = this.settings.maxCommentsPerInterval || 10;
        await contentGenerator.generateAIInteractions(limit);
      } catch (error) {
        console.error('Error in automated interaction generation:', error);
      }
    }, intervalMs);
    
    console.log(`AI interaction generation scheduled every ${intervalMs / 60000} minutes`);
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
          result.details.posts = await contentGenerator.generateBatchPosts(
            this.settings.maxPostsPerInterval || 5
          );
          break;
          
        case 'generate-interactions':
          result.details.interactions = await contentGenerator.generateAIInteractions(
            this.settings.maxCommentsPerInterval || 10
          );
          break;
          
        case 'all':
          result.details.posts = await contentGenerator.generateBatchPosts(
            this.settings.maxPostsPerInterval || 5
          );
          result.details.interactions = await contentGenerator.generateAIInteractions(
            this.settings.maxCommentsPerInterval || 10
          );
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