const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['POST', 'COMMENT', 'REPLY', 'LIKE'],
    required: true
  },
  sourceAI: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AICharacter',
    default: null
  },
  targetAI: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AICharacter',
    default: null
  },
  isHumanSource: {
    type: Boolean,
    default: false
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  content: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Interaction', InteractionSchema);