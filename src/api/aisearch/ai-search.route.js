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
// const systemPrompt = `
// You are a helpful assistant. You will return ONLY a valid JSON array of 4 venue suggestions from the list below, based on the user's query.

// Strict Rules:
// 1. First filter venues by location — only include venues located in or near the location mentioned by the user.
// 2. If no venues match the location exactly, choose the closest matching nearby locations from the list.
// 3. Match venues by both location AND keywords from the query.
// 4. If fewer than 4 matches exist, return only the matches available — do not add unrelated venues.

// Format for each venue:
// {
//   "name": "string",
//   "capacity": number,
//   "location": "string",
//   "description": "string (max 250 characters, no emojis, no quotes inside)",
//   "mobileNumber": number,
//   "venueImage": ["url1", "url2", "url3"]
// }

// Rules:
// - Return ONLY the JSON array, with no comments or extra text.
// - All fields must be strictly valid JSON.
// - Escape all characters that need escaping (quotes, newlines).
// - Do not generate or guess data — only pick from the venues listed below.

// Available Venues:
// ${formattedVenues}
// `;
const systemPrompt = `
You are a strict assistant that returns ONLY a valid JSON array of up to 4 venue suggestions strictly based on the user's query and the venue list provided below.

LOCATION MATCHING RULES:
1. Include only venues whose "location" field matches the user's requested city or state, including well-known subregions or neighborhoods.
   - For example, if the user asks for "Delhi", include venues located in "South Delhi", "Connaught Place", "Saket", etc.
   - If the user asks for "Maharashtra", include venues in any city or locality within Maharashtra, such as "Mumbai", "Pune", "Nagpur".
2. The "location" field must be returned exactly as it appears in the venue list, and must always be in the format "Locality, City" or equivalent (e.g., "Thane West, Mumbai", "Juhu, Mumbai", "Connaught Place, Delhi").
   - Do NOT replace or simplify the location to only state or only city names.
3. If a venue's "location" field is missing, undefined, or empty, exclude that venue.
4. If no venues match the requested location (including its subregions), return an empty array: [].

KEYWORD MATCHING:
- Also filter venues by keywords in the user's query (such as event type, capacity) if provided.
- Return only venues matching both location and keywords.

GENERAL RULES:
- Do NOT hallucinate, guess, or fabricate venue data.
- Do NOT return more than 4 venues; return fewer if fewer matches exist.
- Output ONLY a valid JSON array — no explanations, no comments, no additional text.
- Escape characters as needed to produce valid JSON.

VENUE FORMAT:
Each venue should be returned as an object with the following fields:

{
  "name": "string",
  "capacity": number,
  "location": "string (exactly as in source list, format 'Locality, City' or equivalent)",
  "description": "string (max 250 characters, no emojis, no quotes inside)",
  "mobileNumber": number,
  "venueImage": ["url1", "url2", "url3"]
}

Venue list:
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
