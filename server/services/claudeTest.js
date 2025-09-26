const axios = require('axios');
require('dotenv').config();

/**
 * Test Claude API connection
 * This script can be run directly to test the API connection
 */
async function testClaudeAPI() {
  console.log('Testing Claude API connection...');
  
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: No API key found in environment variables');
    console.error('Please check your .env file and make sure CLAUDE_API_KEY is set correctly');
    return;
  }
  
  if (!apiKey.startsWith('sk-')) {
    console.warn('⚠️ Warning: API key does not start with "sk-". Anthropic API keys typically start with this prefix.');
  }
  
  console.log(`API key found. First 4 characters: ${apiKey.substring(0, 4)}...`);
  
  // Create axios instance with authentication
  const client = axios.create({
    baseURL: 'https://api.anthropic.com/v1',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey
    }
  });
  
  try {
    // Send a simple test request
    console.log('Sending test request to Claude API...');
    const response = await client.post('/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 30,
      messages: [
        { role: 'user', content: 'Say "API test successful" if you can read this message.' }
      ]
    });
    
    console.log('✅ API connection successful!');
    console.log('Response:', response.data.content[0].text);
    
    return {
      success: true,
      message: 'API connection test successful',
      response: response.data
    };
  } catch (error) {
    console.error('❌ API connection test failed');
    
    if (error.response) {
      // The server responded with an error
      console.error(`Status code: ${error.response.status}`);
      
      if (error.response.status === 401) {
        console.error('Authentication error. Your API key may be invalid or expired.');
        console.error('Make sure you\'re using a valid API key from https://console.anthropic.com/');
      } else {
        console.error('Error details:', error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from the API server. Check your network connection.');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    
    return {
      success: false,
      message: 'API connection test failed',
      error: error.message,
      details: error.response ? error.response.data : null
    };
  }
}

// If this script is run directly
if (require.main === module) {
  testClaudeAPI().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}

module.exports = { testClaudeAPI };