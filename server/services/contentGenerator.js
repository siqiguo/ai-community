const claudeService = require('./claude');
const { AICharacter, Post, Comment, Interaction } = require('../models');

class ContentGeneratorService {
  /**
   * Generate a post for an AI character
   * @param {string} aiCharacterId - The ID of the AI character
   * @returns {Promise<object>} - The created post
   */
  async generatePost(aiCharacterId) {
    try {
      // Get AI character
      const aiCharacter = await AICharacter.findById(aiCharacterId);
      if (!aiCharacter) {
        throw new Error('AI character not found');
      }
      
      // Get recent posts for context
      const recentPosts = await Post.find()
        .populate('aiCharacter', 'name personality profession')
        .sort({ createdAt: -1 })
        .limit(5);
      
      // Get recent human interactions with this AI
      const recentHumanInteractions = await Interaction.find({
        targetAI: aiCharacterId,
        isHumanSource: true
      })
        .sort({ timestamp: -1 })
        .limit(3);
      
      // Generate content
      const content = await claudeService.generatePost(aiCharacter, {
        recentPosts,
        humanInteractions: recentHumanInteractions
      });
      
      // Create post
      const post = new Post({
        aiCharacter: aiCharacterId,
        content,
        humanInspired: recentHumanInteractions.length > 0
      });
      
      await post.save();
      
      // Create interaction record
      const interaction = new Interaction({
        type: 'POST',
        sourceAI: aiCharacterId,
        post: post._id,
        content
      });
      
      await interaction.save();
      
      // Update AI character's interaction count
      aiCharacter.interactionCount++;
      await aiCharacter.save();
      
      return post;
    } catch (error) {
      console.error('Error generating post:', error);
      throw error;
    }
  }
  
  /**
   * Generate a comment from an AI character on a post
   * @param {string} aiCharacterId - The ID of the AI character
   * @param {string} postId - The ID of the post
   * @returns {Promise<object>} - The created comment
   */
  async generateComment(aiCharacterId, postId) {
    try {
      // Get AI character
      const aiCharacter = await AICharacter.findById(aiCharacterId);
      if (!aiCharacter) {
        throw new Error('AI character not found');
      }
      
      // Get post
      const post = await Post.findById(postId).populate('aiCharacter', 'name personality profession');
      if (!post) {
        throw new Error('Post not found');
      }
      
      // Get existing comments
      const existingComments = await Comment.find({ post: postId, parentComment: null })
        .populate('aiCharacter', 'name')
        .sort({ createdAt: -1 })
        .limit(5);
      
      // Generate content
      const content = await claudeService.generateComment(aiCharacter, post, {
        existingComments
      });
      
      // Create comment
      const comment = new Comment({
        post: postId,
        content,
        isHuman: false,
        aiCharacter: aiCharacterId
      });
      
      await comment.save();
      
      // Create interaction record
      const interaction = new Interaction({
        type: 'COMMENT',
        sourceAI: aiCharacterId,
        targetAI: post.aiCharacter,
        post: postId,
        comment: comment._id,
        content
      });
      
      await interaction.save();
      
      // Update AI character's interaction count
      aiCharacter.interactionCount++;
      await aiCharacter.save();
      
      return comment;
    } catch (error) {
      console.error('Error generating comment:', error);
      throw error;
    }
  }
  
  /**
   * Generate a reply from an AI character to a comment
   * @param {string} aiCharacterId - The ID of the AI character
   * @param {string} commentId - The ID of the comment to reply to
   * @returns {Promise<object>} - The created reply comment
   */
  async generateReply(aiCharacterId, commentId) {
    try {
      // Get AI character
      const aiCharacter = await AICharacter.findById(aiCharacterId);
      if (!aiCharacter) {
        throw new Error('AI character not found');
      }
      
      // Get comment
      const comment = await Comment.findById(commentId).populate('aiCharacter', 'name');
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      // Get post
      const post = await Post.findById(comment.post).populate('aiCharacter', 'name personality profession');
      if (!post) {
        throw new Error('Post not found');
      }
      
      // Generate content
      const content = await claudeService.generateReply(aiCharacter, comment, post);
      
      // Create reply comment
      const reply = new Comment({
        post: comment.post,
        content,
        isHuman: false,
        aiCharacter: aiCharacterId,
        parentComment: commentId
      });
      
      await reply.save();
      
      // Create interaction record
      const interaction = new Interaction({
        type: 'REPLY',
        sourceAI: aiCharacterId,
        targetAI: comment.isHuman ? post.aiCharacter : comment.aiCharacter,
        post: comment.post,
        comment: reply._id,
        content
      });
      
      await interaction.save();
      
      // Update AI character's interaction count
      aiCharacter.interactionCount++;
      await aiCharacter.save();
      
      return reply;
    } catch (error) {
      console.error('Error generating reply:', error);
      throw error;
    }
  }
  
  /**
   * Generate posts for AI characters based on their individual schedules
   * @returns {Promise<Array>} - The created posts
   */
  async generateScheduledPosts() {
    try {
      const now = Date.now();
      const posts = [];
      
      // Find AIs that are ready to post (based on their last post time and interval)
      const aiCharacters = await AICharacter.find({
        active: true,
        $or: [
          { lastPosted: null }, // Never posted before
          { lastPosted: { $lt: new Date(now - 180000) } } // At least 3 min since last post as a safety measure
        ]
      }).sort({ lastPosted: 1 }); // Prioritize AIs that haven't posted in the longest time
      
      if (aiCharacters.length === 0) {
        console.log('No AI characters are ready to post yet');
        return [];
      }
      
      // Only process the first AI to avoid overwhelming the API
      const character = aiCharacters[0];
      
      console.log(`Generating post for ${character.name} (last posted: ${character.lastPosted || 'never'})`);
      
      try {
        // Generate the post
        const post = await this.generatePost(character._id);
        posts.push(post);
        
        // Update the lastPosted time for this AI
        character.lastPosted = new Date();
        await character.save();
        
        console.log(`Post generated for ${character.name}, next post in ${character.postInterval/60000} minutes`);
      } catch (error) {
        console.error(`Error generating post for ${character.name}:`, error);
      }
      
      return posts;
    } catch (error) {
      console.error('Error generating scheduled posts:', error);
      throw error;
    }
  }
  
  /**
   * Generate batch posts for multiple AI characters (used for manual triggers)
   * @param {number} limit - Maximum number of posts to generate
   * @returns {Promise<Array>} - The created posts
   */
  async generateBatchPosts(limit = 5) {
    try {
      // Get active AI characters that haven't posted recently (at least 1 minute ago)
      const aiCharacters = await AICharacter.find({ 
        active: true,
        $or: [
          { lastPosted: null },
          { lastPosted: { $lt: new Date(Date.now() - 60000) } }
        ]
      })
      .sort({ interactionCount: 1 }) // Prioritize less active characters
      .limit(limit);
      
      const posts = [];
      
      // Generate posts sequentially to avoid overwhelming the API
      for (const character of aiCharacters) {
        try {
          const post = await this.generatePost(character._id);
          posts.push(post);
          
          // Update the lastPosted time
          character.lastPosted = new Date();
          await character.save();
        } catch (error) {
          console.error(`Error generating post for ${character.name}:`, error);
        }
        
        // Longer delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return posts;
    } catch (error) {
      console.error('Error generating batch posts:', error);
      throw error;
    }
  }
  
  /**
   * Generate AI interactions on recent posts
   * @param {number} limit - Maximum number of interactions to generate
   * @returns {Promise<Array>} - The created comments
   */
  async generateAIInteractions(limit = 10) {
    try {
      // Get recent posts
      const recentPosts = await Post.find()
        .sort({ createdAt: -1 })
        .limit(10);
      
      if (recentPosts.length === 0) {
        console.log('No posts found for AI interactions');
        return [];
      }
      
      // For scheduled interactions, just pick one random post to have interactions
      const randomPost = limit === 1 ? 
        recentPosts[Math.floor(Math.random() * recentPosts.length)] : 
        recentPosts[0]; // Otherwise use the most recent post
      
      // Get active AI characters
      const aiCharacters = await AICharacter.find({
        active: true,
        _id: { $ne: randomPost.aiCharacter } // Don't include the post author
      });
      
      if (aiCharacters.length === 0) {
        console.log('No eligible AI characters for interactions');
        return [];
      }
      
      // Pick just one AI to comment to avoid overwhelming the API
      const randomAI = aiCharacters[Math.floor(Math.random() * aiCharacters.length)];
      
      console.log(`Generating comment from ${randomAI.name} on post by AI #${randomPost.aiCharacter}`);
      
      const comments = [];
      
      try {
        // 70% chance to comment (configurable)
        if (Math.random() < 0.7) {
          const comment = await this.generateComment(randomAI._id, randomPost._id);
          comments.push(comment);
          console.log(`Comment generated by ${randomAI.name}`);
        } else {
          console.log(`${randomAI.name} decided not to comment this time`);
        }
      } catch (error) {
        console.error(`Error generating comment for ${randomAI.name}:`, error);
      }
      
      return comments;
    } catch (error) {
      console.error('Error generating AI interactions:', error);
      throw error;
    }
  }
  
  /**
   * Generate multiple AI interactions (for manual triggers)
   * @param {number} limit - Maximum number of interactions to generate
   * @returns {Promise<Array>} - The created comments
   */
  async generateMultipleInteractions(limit = 3) {
    try {
      // Get recent posts
      const recentPosts = await Post.find()
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 5));
      
      // Get active AI characters
      const aiCharacters = await AICharacter.find({ active: true });
      
      const comments = [];
      let count = 0;
      
      // Limited version of the original function
      for (const post of recentPosts) {
        // Skip if we've reached the limit
        if (count >= limit) break;
        
        // For each post, just select one AI to comment
        const shuffledAIs = aiCharacters
          .filter(ai => ai._id.toString() !== post.aiCharacter.toString()) // Don't comment on own post
          .sort(() => 0.5 - Math.random()); // Shuffle
        
        if (shuffledAIs.length > 0) {
          const ai = shuffledAIs[0];
          
          try {
            const comment = await this.generateComment(ai._id, post._id);
            comments.push(comment);
            count++;
            
            // Longer delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Error generating comment for ${ai.name}:`, error);
          }
        }
      }
      
      return comments;
    } catch (error) {
      console.error('Error generating multiple interactions:', error);
      throw error;
    }
  }
  
  /**
   * Process human interactions and generate AI responses
   * @returns {Promise<Array>} - The created responses
   */
  async processHumanInteractions() {
    try {
      // Find recent human interactions without responses
      const recentHumanInteractions = await Interaction.find({
        isHumanSource: true,
        type: { $in: ['COMMENT', 'REPLY'] },
        processed: { $ne: true }
      })
        .sort({ timestamp: -1 })
        .limit(5);
      
      const responses = [];
      
      for (const interaction of recentHumanInteractions) {
        try {
          let response;
          
          // If it's a comment on a post, the post author should respond
          if (interaction.type === 'COMMENT' && interaction.post) {
            const post = await Post.findById(interaction.post);
            if (post) {
              // 80% chance to respond to human comments (configurable)
              if (Math.random() < 0.8) {
                response = await this.generateReply(post.aiCharacter, interaction.comment);
                responses.push(response);
              }
            }
          }
          
          // Mark as processed
          interaction.processed = true;
          await interaction.save();
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error processing human interaction:`, error);
        }
      }
      
      return responses;
    } catch (error) {
      console.error('Error processing human interactions:', error);
      throw error;
    }
  }
}

// Export singleton instance
const contentGenerator = new ContentGeneratorService();
module.exports = contentGenerator;