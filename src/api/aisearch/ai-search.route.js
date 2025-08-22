const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const Venue = require('../venue/venue.model');
const config = require('config');

module.exports = (openaiKey) => {
  const router = express.Router(); // ✅ Moved to top

  console.log('🟢 ai-search.route.js loaded');
  console.log('🧪 OpenAI Key:', openaiKey ? 'Loaded ✅' : 'Missing ❌');

  let openai;
  try {
    const configuration = new Configuration({ apiKey: openaiKey });
    openai = new OpenAIApi(configuration);
    console.log('🤖 OpenAI client initialized');
  } catch (err) {
    console.error('❌ Failed to init OpenAI:', err.message);
  }

  router.post('/', async (req, res) => {
    console.log('📩 /aisearch hit');

    const { prompt } = req.body;
    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    try {
      const venues = await Venue.find({}, 'name capacity location description capacity venueImage mobileNumber').limit(30);


    //   const formattedVenues = venues.map(v =>
    //     `Name: ${v.name}, Location: ${v.location}, About: ${v.description || 'N/A'}`
    //   ).join('\n');

//     const formattedVenues = venues.map(v =>
//   `Name: ${v.name}, Capacity: ${v.capacity}, About: ${(v.description || 'N/A').substring(0, 150)}, mobileNumber: ${v.mobileNumber || 'N/A'},Images: ${(v.venueImage?.map(img => img.venue_image_src).join(', ')) || 'No images'}` // ✅ Added mobileNumber
// ).join('\n');

const formattedVenues = venues.map(v => {
  const imageUrls = v.venueImage?.map(img =>
    `${config.get('frontEnd.picPath')}/uploads/${img.venue_image_src}`
  ).join(', ') || 'No images';

  return `Name: ${v.name}, Capacity: ${v.capacity}, Location: ${v.location}, About: ${(v.description || 'N/A').substring(0, 150)}, mobileNumber: ${v.mobileNumber || 'N/A'}, venueImage: ${imageUrls}`;
}).join('\n');

      // ✅ Log the venues to verify they’re fetched correctly
      console.log('📊 Venue data being sent to OpenAI:\n', formattedVenues);

//       const systemPrompt = `
// You are an AI assistant helping users find the best venue from this list:

// ${formattedVenues}

// Based on the user's request, suggest 1-3 best matches.
// Only use the given venues. Return the names and short reasons.
// `;
const systemPrompt = `
You are a strict assistant that ONLY returns a valid JSON array (max 4 entries) of venue suggestions **from the provided list below**.

You MUST follow these hard rules:

1. Only include venues located in or very near the user's specified location.
   - If no exact match is found, use nearby **but relevant** locations. Do not include venues from unrelated locations.
2. Match both location and relevant query keywords (like "wedding", "conference", etc.).
3. If fewer than 4 matches exist, return only the matching ones. Do NOT supplement with unrelated venues.

Output format:
Return a JSON array like this:
[
  {
    "name": "string",
    "capacity": number,
    "location": "string",
    "description": "string (max 250 characters, no emojis, no quotes inside)",
    "mobileNumber": number,
    "venueImage": ["url1", "url2", "url3"]
  },
  ...
]

Strict Output Rules:
- Output ONLY the JSON array. No extra text or comments.
- Use ONLY the data from the provided venue list — do NOT make up, infer, or guess anything.
- Escape all necessary characters correctly to maintain valid JSON.

Data Source:
Use ONLY this list of venues:
${formattedVenues}
`;






      const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
      });

      // const suggestion = response.data.choices[0].message.content;
      // res.json({ success: true, suggestion });
      // new
//       const suggestionText = response.data.choices[0].message.content;
// console.log('Raw suggestion:\n', suggestionText);
const suggestionText = response.data.choices[0].message.content;
console.log('🤖 Raw AI response:', suggestionText);

// Try to parse JSON
try {
  const venues = JSON.parse(suggestionText);
  if (!Array.isArray(venues)) {
    throw new Error('Expected an array of venues');
  }

  // Ensure all required fields are present
  const isValid = venues.every(v => 
    v.name && v.capacity && v.location && v.description && v.mobileNumber && Array.isArray(v.venueImage)
  );

  if (!isValid) {
    throw new Error('Some venue fields are missing or incorrect');
  }

  res.json({ success: true, venues });
} catch (err) {
  console.error('❌ Failed to parse or validate AI JSON:', err.message);
  res.status(500).json({ success: false, error: 'Invalid AI response format' });
}


// Extract venue names from the AI response
// Extract venue names from the AI response
// const matchedNames = suggestionText.match(/\*\*(.*?)\*\*/g)?.map(name => name.replace(/\*\*/g, '').trim()) || [];

// console.log('✅ Extracted venue names:', matchedNames);

// Filter original venue list to match those names
// const matchedVenues = venues.filter(v => matchedNames.includes(v.name));

// res.json({ success: true, venues: matchedVenues });



    } catch (err) {
      console.error('❌ AI Search error:', err.message);
      console.error('🔍 Full Error:', err.response?.data || err.stack || err);
      res.status(500).json({ success: false, error: 'AI search failed' });
    }
  });


  // GET venue by name (case-insensitive match)
router.get('/name/:name', async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const venue = await Venue.findOne({ name });
  if (!venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }
  res.json({ data: venue });
});







  return router;
};
