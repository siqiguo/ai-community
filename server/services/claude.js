const axios = require('axios');

class ClaudeService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    
    // Rate limiting
    this.requestQueue = [];
    this.processingRequest = false;
    this.lastRequestTime = 0;
    this.minRequestInterval = 3000; // 3 seconds between requests
    this.requestsThisMinute = 0;
    this.maxRequestsPerMinute = 20; // Max 20 requests per minute
    this.minuteTimer = setInterval(() => this.resetMinuteCounter(), 60000);
  }
  
  /**
   * Generate content using Claude API
   * @param {string} prompt - The prompt to send to Claude
   * @param {object} options - Additional options
   * @returns {Promise<string>} - The generated content
   */
  async generateContent(prompt, options = {}) {
    const defaultOptions = {
      model: 'claude-3-sonnet-20240229', // Default to Claude 3 Sonnet
      max_tokens: 300,
      temperature: 0.7,
      system: ''
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    try {
      // Add to queue and process
      return await this.queueRequest(prompt, requestOptions);
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Claude API error: ${error.message}`);
    }
  }
  
  /**
   * Queue a request to respect rate limits
   */
  queueRequest(prompt, options) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ prompt, options, resolve, reject });
      this.processQueue();
    });
  }
  
  /**
   * Reset the per-minute request counter
   */
  resetMinuteCounter() {
    this.requestsThisMinute = 0;
    console.log('Claude API rate limit counter reset');
  }
  
  /**
   * Process the request queue with improved rate limiting
   */
  async processQueue() {
    if (this.processingRequest || this.requestQueue.length === 0) {
      return;
    }
    
    // Check if we've hit the per-minute rate limit
    if (this.requestsThisMinute >= this.maxRequestsPerMinute) {
      console.log('Rate limit reached. Waiting before processing more requests...');
      setTimeout(() => this.processQueue(), 5000); // Try again in 5 seconds
      return;
    }
    
    this.processingRequest = true;
    
    // Ensure minimum interval between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }
    
    const { prompt, options, resolve, reject } = this.requestQueue.shift();
    
    try {
      console.log('Sending request to Claude API...');
      this.requestsThisMinute++;
      
      const response = await this.client.post('/messages', {
        model: options.model,
        max_tokens: options.max_tokens,
        messages: [
          { role: 'user', content: prompt }
        ],
        system: options.system || undefined,
        temperature: options.temperature
      });
      
      this.lastRequestTime = Date.now();
      console.log(`Claude API request successful. Requests this minute: ${this.requestsThisMinute}/${this.maxRequestsPerMinute}`);
      resolve(response.data.content[0].text);
    } catch (error) {
      console.error('Claude API error:', error.message);
      reject(error);
    } finally {
      this.processingRequest = false;
      
      // Add a slight delay before processing the next request
      setTimeout(() => {
        this.processQueue(); // Process next request if any
      }, 500);
    }
  }
  
  /**
   * Generate a post for an AI character
   * @param {object} character - The AI character
   * @param {object} context - Additional context information
   * @returns {Promise<string>} - The generated post content
   */
  async generatePost(character, context = {}) {
    const { recentPosts = [], communityTrends = [], humanInteractions = [] } = context;
    
    // Build memory context
    const memoryContext = character.memoryContext || `${character.name} is a ${character.personality} ${character.profession} who is interested in ${character.interests.join(', ')}. ${character.name}'s goal is ${character.goal}.`;
    
    // Build recent posts context
    let recentPostsContext = '';
    if (recentPosts.length > 0) {
      recentPostsContext = 'Recent posts in the community:\n' + 
        recentPosts.map(p => `- ${p.aiCharacter.name}: "${p.content}"`).join('\n');
    }
    
    // Build human interactions context
    let humanInteractionsContext = '';
    if (humanInteractions.length > 0) {
      humanInteractionsContext = 'Recent human interactions:\n' +
        humanInteractions.map(i => `- Human user ${i.type === 'COMMENT' ? 'commented' : 'liked'} on your post: "${i.content || ''}"`).join('\n');
    }
    
    // Build system prompt
    const systemPrompt = `You are roleplaying as ${character.name}, an AI character in an AI community platform. Generate a social media post that reflects your personality and interests.

Character Details:
- Name: ${character.name}
- Personality: ${character.personality}
- Profession: ${character.profession}
- Interests: ${character.interests.join(', ')}
- Goal: ${character.goal}

${memoryContext}

${recentPostsContext}

${humanInteractionsContext}

Guidelines:
- Write in first person as ${character.name}
- Keep the post between 40-60 words
- Make it sound natural and conversational
- Reflect your defined personality and interests
- You can mention your profession, goals, or current projects
- If there are human interactions, consider responding to them in your post`;

    const userPrompt = `Please write a social media post as ${character.name}. Make it authentic to the character's personality.`;
    
    try {
      const content = await this.generateContent(userPrompt, {
        system: systemPrompt,
        max_tokens: 150,
        temperature: 0.8
      });
      
      return content.trim();
    } catch (error) {
      console.error('Error generating post:', error);
      return `Just thinking about ${character.interests[0] || 'my interests'} today. #AI #Thoughts`;
    }
  }
  
  /**
   * Generate a comment for an AI character
   * @param {object} character - The AI character
   * @param {object} post - The post to comment on
   * @param {object} context - Additional context information
   * @returns {Promise<string>} - The generated comment content
   */
  async generateComment(character, post, context = {}) {
    const { existingComments = [] } = context;
    
    // Build comment context
    let commentsContext = '';
    if (existingComments.length > 0) {
      commentsContext = 'Existing comments on this post:\n' +
        existingComments.map(c => {
          const author = c.isHuman ? 'Human user' : (c.aiCharacter ? c.aiCharacter.name : 'Another AI');
          return `- ${author}: "${c.content}"`;
        }).join('\n');
    }
    
    // Build system prompt
    const systemPrompt = `You are roleplaying as ${character.name}, an AI character in an AI community platform. Generate a comment on a post by ${post.aiCharacter.name} that reflects your personality and interests.

Character Details:
- Name: ${character.name}
- Personality: ${character.personality}
- Profession: ${character.profession}
- Interests: ${character.interests.join(', ')}
- Goal: ${character.goal}

Post you're commenting on:
"${post.content}" - ${post.aiCharacter.name} (${post.aiCharacter.profession})

${commentsContext}

Guidelines:
- Write in first person as ${character.name}
- Keep the comment between 20-40 words
- Make it sound natural and conversational
- Reflect your defined personality and interests
- Respond directly to the content of the post
- If human users have commented, consider acknowledging or responding to their comments`;

    const userPrompt = `Please write a comment as ${character.name} responding to the post: "${post.content}"`;
    
    try {
      const content = await this.generateContent(userPrompt, {
        system: systemPrompt,
        max_tokens: 100,
        temperature: 0.8
      });
      
      return content.trim();
    } catch (error) {
      console.error('Error generating comment:', error);
      return `Interesting thoughts, ${post.aiCharacter.name}! I'd love to hear more about this.`;
    }
  }
  
  /**
   * Generate a reply to a comment
   * @param {object} character - The AI character
   * @param {object} comment - The comment to reply to
   * @param {object} post - The original post
   * @returns {Promise<string>} - The generated reply content
   */
  async generateReply(character, comment, post) {
    // Build system prompt
    const commentAuthor = comment.isHuman ? 'Human user' : (comment.aiCharacter ? comment.aiCharacter.name : 'Another AI');
    
    const systemPrompt = `You are roleplaying as ${character.name}, an AI character in an AI community platform. Generate a reply to a comment on a post.

Character Details:
- Name: ${character.name}
- Personality: ${character.personality}
- Profession: ${character.profession}
- Interests: ${character.interests.join(', ')}
- Goal: ${character.goal}

Original Post:
"${post.content}" - ${post.aiCharacter.name} (${post.aiCharacter.profession})

Comment you're replying to:
"${comment.content}" - ${commentAuthor}

Guidelines:
- Write in first person as ${character.name}
- Keep the reply between 15-30 words
- Make it sound natural and conversational
- Directly respond to the specific comment
- If replying to a human, be more engaging and thoughtful
- Reflect your defined personality in your reply style`;

    const userPrompt = `Please write a reply as ${character.name} responding to the comment: "${comment.content}"`;
    
    try {
      const content = await this.generateContent(userPrompt, {
        system: systemPrompt,
        max_tokens: 80,
        temperature: 0.8
      });
      
      return content.trim();
    } catch (error) {
      console.error('Error generating reply:', error);
      return `Thanks for your thoughts, ${commentAuthor}! I appreciate your perspective.`;
    }
  }
}

// Export singleton instance
const claudeService = new ClaudeService();
module.exports = claudeService;