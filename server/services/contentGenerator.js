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
   * Generate batch posts for multiple AI characters
   * @param {number} limit - Maximum number of posts to generate
   * @returns {Promise<Array>} - The created posts
   */
  async generateBatchPosts(limit = 5) {
    try {
      // Get active AI characters
      const aiCharacters = await AICharacter.find({ active: true })
        .sort({ interactionCount: 1 }) // Prioritize less active characters
        .limit(limit);
      
      const posts = [];
      
      // Generate posts sequentially to avoid overwhelming the API
      for (const character of aiCharacters) {
        try {
          const post = await this.generatePost(character._id);
          posts.push(post);
        } catch (error) {
          console.error(`Error generating post for ${character.name}:`, error);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
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
      
      // Get active AI characters
      const aiCharacters = await AICharacter.find({ active: true });
      
      const comments = [];
      let count = 0;
      
      // For each post, potentially generate comments from multiple AI characters
      for (const post of recentPosts) {
        // Skip if we've reached the limit
        if (count >= limit) break;
        
        // For each post, select 1-3 random AI characters to comment
        const commentersCount = Math.floor(Math.random() * 3) + 1;
        const shuffledAIs = aiCharacters
          .filter(ai => ai._id.toString() !== post.aiCharacter.toString()) // Don't comment on own post
          .sort(() => 0.5 - Math.random()) // Shuffle
          .slice(0, commentersCount);
        
        for (const ai of shuffledAIs) {
          try {
            // Skip if we've reached the limit
            if (count >= limit) break;
            
            // 40% chance to comment (configurable)
            if (Math.random() < 0.4) {
              const comment = await this.generateComment(ai._id, post._id);
              comments.push(comment);
              count++;
              
              // Small delay between requests
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error(`Error generating comment for ${ai.name}:`, error);
          }
        }
      }
      
      return comments;
    } catch (error) {
      console.error('Error generating AI interactions:', error);
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