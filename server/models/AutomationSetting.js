const mongoose = require('mongoose');

const AutomationSettingSchema = new mongoose.Schema({
  autoPublishEnabled: {
    type: Boolean,
    default: false
  },
  aiInteractionEnabled: {
    type: Boolean,
    default: false
  },
  publishInterval: {
    type: Number,
    default: 3600000 // Default to 1 hour in milliseconds
  },
  interactionProbability: {
    type: Number,
    default: 0.4 // 40% chance for AI to interact with a post
  },
  humanInteractionProbability: {
    type: Number,
    default: 0.8 // 80% chance for AI to respond to human interaction
  },
  maxPostsPerInterval: {
    type: Number,
    default: 5
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