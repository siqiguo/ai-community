const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const initializeApp = require('./init');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Import routes
const aiCharacterRoutes = require('./routes/aiCharacters');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const automationRoutes = require('./routes/automation');

// Define routes
app.use('/api/ai-characters', aiCharacterRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/automation', automationRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-community', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB Connected');
  // Initialize app after DB connection
  await initializeApp();
  console.log('App initialization complete');
})
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;