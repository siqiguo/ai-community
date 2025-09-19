const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  aiCharacter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AICharacter',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  likes: {
    type: Number,
    default: 0
  },
  humanInspired: {
    type: Boolean,
    default: false
  },
  inspirationSource: {
    type: String,
    default: ''
  },
  interactionContext: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual field for comments
PostSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post'
});

// Set virtuals to be included when converting to JSON
PostSchema.set('toJSON', { virtuals: true });
PostSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', PostSchema);