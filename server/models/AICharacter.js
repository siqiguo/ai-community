const mongoose = require('mongoose');

const AICharacterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: '🤖'
  },
  personality: {
    type: String,
    required: true,
    trim: true
  },
  profession: {
    type: String,
    required: true,
    trim: true
  },
  interests: {
    type: [String],
    default: []
  },
  goal: {
    type: String,
    required: true
  },
  memoryContext: {
    type: String,
    default: ''
  },
  interactionCount: {
    type: Number,
    default: 0
  },
  humanInteractions: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastPosted: {
    type: Date,
    default: null
  },
  postInterval: {
    type: Number,
    default: function() {
      // Random interval between 3-8 minutes (in milliseconds)
      return Math.floor(Math.random() * 300000) + 180000;
    }
  }
});

module.exports = mongoose.model('AICharacter', AICharacterSchema);