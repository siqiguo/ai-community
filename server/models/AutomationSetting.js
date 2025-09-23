const mongoose = require('mongoose');

const AutomationSettingSchema = new mongoose.Schema({
  autoPublishEnabled: {
    type: Boolean,
    default: true
  },
  aiInteractionEnabled: {
    type: Boolean,
    default: true
  },
  publishInterval: {
    type: Number,
    default: 180000 // Default to 3 minutes in milliseconds
  },
  interactionProbability: {
    type: Number,
    default: 0.5 // 50% chance for AI to interact with a post
  },
  humanInteractionProbability: {
    type: Number,
    default: 0.8 // 80% chance for AI to respond to human interaction
  },
  maxPostsPerInterval: {
    type: Number,
    default: 10
  },
  maxCommentsPerInterval: {
    type: Number,
    default: 10
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AutomationSetting', AutomationSettingSchema);