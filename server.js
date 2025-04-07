// Steam Game Recommender with Claude AI
// This application combines the Steam API and Claude API to recommend games based on user preferences

// Required dependencies:
// npm install express axios cors dotenv @anthropic-ai/sdk

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Anthropic API key from environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Steam API key
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Routes
app.get('/api/steam/games', async (req, res) => {
  try {
    // Get popular and highly rated games from Steam
    const response = await axios.get(`https://api.steampowered.com/ISteamApps/GetAppList/v2/`);
    const games = response.data.applist.apps;
    
    // In a real application, you would also fetch details, ratings, etc.
    // This is simplified for demonstration purposes
    res.json({ success: true, games });
  } catch (error) {
    console.error('Error fetching Steam games:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch games from Steam API' });
  }
});

// Route to get game details
app.get('/api/steam/game/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
    res.json({ success: true, gameDetails: response.data[appId] });
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch game details' });
  }
});

// Claude AI conversation API
app.post('/api/claude/conversation', async (req, res) => {
  try {
    const { messages, userPreferences } = req.body;
    
    // Create system prompt that instructs Claude on how to recommend games
    const systemPrompt = `You are a helpful gaming assistant that recommends Steam games based on user preferences.
    
Current user preferences: ${JSON.stringify(userPreferences || {})}

Your task is to understand the user's gaming preferences by asking questions about:
1. Preferred genres (RPG, FPS, Strategy, etc.)
2. Previous games they've enjoyed
3. Platform preferences (PC specs if relevant)
4. Time commitment they're looking for (quick sessions vs. long campaigns)
5. Multiplayer or single-player preference
6. Budget constraints

Ask only ONE question at a time, and build on previous answers. Once you have enough information (after 3-5 questions), 
make specific Steam game recommendations with brief explanations of why they match the user's preferences.

If the user asks for recommendations before providing enough information, politely ask for more details to make better recommendations.`;

    // Direct API call to Anthropic using messages API
    const apiResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-5-haiku-20241022",
        system: systemPrompt,
        messages: messages,
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    res.json({ 
      success: true, 
      response: apiResponse.data.content[0].text,
      userPreferences // Echo back the current preferences
    });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    res.status(500).json({ success: false, error: 'Failed to get response from Claude API' });
  }
});

// Final recommendation route - combines user preferences with Steam data
app.post('/api/recommend', async (req, res) => {
  try {
    const { userPreferences } = req.body;
    
    // For this demo, we'll use Claude to generate recommendations
    const systemPrompt = `Based on these user preferences: ${JSON.stringify(userPreferences)},
    recommend 5 specific Steam games. Format your response as JSON with this structure:
    [
      {
        "title": "Game Title",
        "genre": "Game Genre",
        "reason": "Why this matches user preferences",
        "steamAppId": "12345" // Use a placeholder ID for demo
      }
    ]`;

    // Direct API call to Anthropic using messages API
    const apiResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-opus-20240229",
        system: systemPrompt,
        messages: [{ role: "user", content: "Please recommend games based on my preferences" }],
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    // Parse the JSON from Claude's response
    const responseText = apiResponse.data.content[0].text;
    const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
    
    if (jsonMatch) {
      try {
        const recommendations = JSON.parse(jsonMatch[0]);
        res.json({ success: true, recommendations });
      } catch (e) {
        res.status(500).json({ success: false, error: 'Failed to parse recommendations' });
      }
    } else {
      res.status(500).json({ success: false, error: 'Invalid response format' });
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});