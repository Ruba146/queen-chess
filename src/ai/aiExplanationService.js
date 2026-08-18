/**
 * AI Explanation Service
 *
 * Generates educational chess explanations using:
 * 1. OpenRouter API (if OPENROUTER_API_KEY is configured in .env)
 * 2. Smart rule-based engine (fallback) using Stockfish evaluation + chess data
 *
 * The prompt includes factual chess data so the LLM explains real information.
 */

const { Chess } = require('chess.js');

// ──────────────────────────────────────────────
// LLM API Configuration
// ──────────────────────────────────────────────

function getLLMProvider() {
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';
  return null;
}

/**
 * Maximum tokens budget for OpenRouter free tier.
 */
const PRIMARY_MAX_TOKENS = 300;
const RETRY_MAX_TOKENS = 150;

async function callLLM(systemPrompt, userPrompt, retryCount = 0) {
  const provider = getLLMProvider();

  if (provider === 'openrouter') {
    const model = 'google/gemini-2.5-flash';
    const maxTokens = retryCount > 0 ? RETRY_MAX_TOKENS : PRIMARY_MAX_TOKENS;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'Queen Chess'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: maxTokens
        })
      });

      if (response.status === 402 && retryCount === 0) {
        console.log("[AI] 402 insufficient credits, retrying with lower max_tokens...");
        return callLLM(systemPrompt, userPrompt, 1);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.error("[AI] OpenRouter Error:", error);
      return null;
    }
  }

  return null;
}

// ──────────────────────────────────────────────
// SYSTEM PROMPTS
// ──────────────────────────────────────────────

const OPENING_SYSTEM_PROMPT = `You are a world-class chess coach. Generate an educational analysis of a chess opening.

Given the opening name, ECO code, moves, Stockfish evaluations, and master database statistics, produce a JSON object with EXACTLY these fields:
{
  "explanation": "2-3 sentence beginner-friendly explanation of what this move/opening achieves",
  "beginnerExplanation": "Simple explanation for sub-1000 rated players focusing on basic principles",
  "intermediateExplanation": "Deeper strategic explanation for 1000-1600 rated players including plans and typical ideas",
  "advancedExplanation": "Complex explanation for 1600+ players covering nuances, transpositions, and modern theory",
  "mainIdea": "The primary strategic or tactical goal (1-2 sentences)",
  "strategicConcepts": ["3-5 bullet points of key strategic themes like development, center control, king safety"],
  "tacticalThemes": ["2-3 tactical motifs commonly seen from this opening"],
  "commonMistakes": ["2-3 typical errors players make in this opening"],
  "practicalAdvice": "One actionable tip to immediately improve results with this opening",
  "trainingRecommendations": ["2-3 specific study recommendations"]
}

IMPORTANT: Base all explanations on the ACTUAL chess data provided. Do not invent generic advice. Be specific about piece placements, pawn structures, and concrete variations from the data.`;

const TACTICS_SYSTEM_PROMPT = `You are a world-class chess tactics coach. Generate an educational analysis of a chess puzzle.

Given the puzzle FEN, solution, themes, rating, and Stockfish evaluations, produce a JSON object with EXACTLY these fields:
{
  "explanation": "2-3 sentence explanation of why the solution works",
  "beginnerExplanation": "Simple explanation focusing on basic tactical pattern recognition",
  "intermediateExplanation": "Deeper explanation including candidate move comparison and defensive resources",
  "advancedExplanation": "Complex analysis including sidelines, refutations, and prophylaxis",
  "mainIdea": "The primary tactical concept (1 sentence)",
  "strategicConcepts": ["2-3 strategic themes like piece activity, king safety, material balance"],
  "tacticalThemes": ["The key tactical motifs: forks, pins, skewers, discovered attacks, etc."],
  "commonMistakes": ["2-3 errors players typically make in similar positions"],
  "practicalAdvice": "How to spot similar tactical patterns in your own games",
  "trainingRecommendations": ["2-3 practice recommendations to improve this tactical skill"]
}

IMPORTANT: Base all analysis on the actual board position and Stockfish evaluations provided. Be concrete about piece coordinates and variations.`;

const ENDGAME_SYSTEM_PROMPT = `You are a world-class endgame coach. Generate a concise educational analysis.

Given the position data, produce a JSON object:
{
  "explanation": "The endgame technique required (1-2 sentences)",
  "mainIdea": "Key winning/drawing idea (1 sentence)",
  "position": "Summary of the position",
  "objective": "What the player must achieve",
  "winningMethod": "How to convert (1-2 sentences)",
  "keyIdeas": ["2-3 key endgame concepts"],
  "commonMistakes": ["2-3 typical errors"]
}

IMPORTANT: Be specific about key squares, technique, and concrete variations. Max 150 words.`;

const CHAT_SYSTEM_PROMPT = `You are a world-class chess coach. Answer questions concisely (150-300 words).

Rules:
- Use headings and bullet points. Never write walls of text.
- Refer to concrete squares, pieces, and variations.
- Do NOT repeat the user's question back to them.
- Do NOT mention that you are an AI.

If the user asks about an opening, ALWAYS use this exact format:

Opening: [name]
Main moves: [move list]
Main idea: [1-2 sentences]
Advantages:
- ...
Disadvantages:
- ...
Best for: [player type]
Common mistakes:
- ...

Only provide more detail if the user explicitly asks.`;

const OPENING_SEARCH_SYSTEM_PROMPT = `You are a world-class chess opening expert. Provide concise educational analysis (max 200 words).

Given an opening name and its data (ECO, moves, difficulty), RETURN A JSON OBJECT with these fields:
{
  "openingName": "Opening name",
  "eco": "ECO code",
  "mainMoves": "The main move order (e.g. 1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3)",
  "mainIdea": "1-2 sentences about the primary strategic goal",
  "plans": ["2-3 strategic plans for both sides"],
  "typicalContinuation": "The most common next moves after the main line (e.g. 6. Bg5 e6 7. Qd2 Be7 8. O-O-O)",
  "advantages": ["2-3 advantages of this opening"],
  "disadvantages": ["2-3 drawbacks or risks"],
  "commonMistakes": ["2-3 typical errors players make"]
}

ALWAYS include the full main move sequence with move numbers.
Never omit the move order.
Base explanations on standard chess knowledge for this opening.
Keep the response concise.`;

const IDENTIFY_OPENING_SYSTEM_PROMPT = `You are a world-class chess opening identifier and expert.

Given a sequence of chess moves in algebraic notation:
1. Identify the opening name and variation
2. Return concise info: identifiedOpening, eco, mainIdea, advantages, disadvantages, commonPlans, commonMistakes

Format:
{
  "identifiedOpening": "Opening name and variation",
  "eco": "ECO code or N/A",
  "mainIdea": "1 sentence primary goal",
  "advantages": ["2-3 advantages"],
  "disadvantages": ["2-3 disadvantages"],
  "commonPlans": ["2-3 strategic plans"],
  "commonMistakes": ["2-3 errors"]
}

Be accurate. Max 150 words. If unknown, say "Unknown Opening".`;

const COACH_SYSTEM_PROMPT = `You are a world-class chess coach. Generate a detailed personalized learning plan (180-250 words).

Given the player's statistics, produce a JSON object with these EXACT fields:
{
  "summary": "A comprehensive plan (180-250 words) using bullet points covering all sections below. Use bullet symbols (•). Do NOT write walls of text.",
  "todayGoal": "One specific, measurable goal for today's session",
  "focus": "The primary area the player should concentrate on",
  "strengths": ["2-3 bullet points of player strengths based on their stats"],
  "weaknesses": ["2-3 bullet points of areas needing improvement"],
  "recommendedOpening": "An opening recommendation based on play style and rating",
  "recommendedEndgame": "An endgame study recommendation",
  "trainingPriority": "What to train first (tactics, positional, endgames, or openings)",
  "ratingTarget": "A realistic rating target based on current performance"
}

IMPORTANT: Base ALL recommendations on actual statistics provided. The summary field MUST be 180-250 words with clear bullet points for each section. Do NOT use walls of text.`;

const LEARNING_PATH_SYSTEM_PROMPT = `You are a chess coach creating a concise learning path summary (100-150 words).

Given player stats, produce a JSON object:
{
  "summary": "Current Rating: ... Strengths: ... Weaknesses: ... Today's Focus: ... Weekly Goal: ... Next Rating Target: ..."
}

Keep it concise and direct. 100-150 words maximum.`;

const DAILY_TRAINING_SYSTEM_PROMPT = `You are a chess coach. Explain why today's training is recommended (max 80 words).

Given the training plan and player profile, explain the rationale briefly.

No essays. Just explain the focus.`;

// ──────────────────────────────────────────────
// MAIN EXPLANATION FUNCTIONS
// ──────────────────────────────────────────────

async function generateOpeningExplanation(data) {
  const systemPrompt = OPENING_SYSTEM_PROMPT;
  const userPrompt = `Generate a chess opening explanation for:

Opening Name: ${data.name || 'Unknown'}
ECO Code: ${data.eco || 'N/A'}
Category: ${data.category || 'N/A'}
Difficulty: ${data.difficulty || 'N/A'}
Moves: ${(data.moves || []).join(', ')}
Current FEN: ${data.fen || 'start'}
Stockfish Evaluation Before: ${data.evalBefore ? `${data.evalBefore.score !== undefined ? data.evalBefore.score : 0} (${data.evalBefore.mate ? 'mate in ' + data.evalBefore.mate : 'centipawns'})` : 'N/A'}
Stockfish Evaluation After: ${data.evalAfter ? `${data.evalAfter.score !== undefined ? data.evalAfter.score : 0} (${data.evalAfter.mate ? 'mate in ' + data.evalAfter.mate : 'centipawns'})` : 'N/A'}
Master Games in Database: ${data.metadata?.games !== null && data.metadata?.games !== undefined ? data.metadata.games : 'N/A'}
Average Rating: ${data.metadata?.averageRating || 'N/A'}

Provide a complete JSON object with the requested fields. Be specific about the actual moves and position.`;

  const llmResult = await callLLM(systemPrompt, userPrompt);
  if (llmResult) {
    const parsed = parseLLMJsonResponse(llmResult);
    if (parsed) return parsed;
  }
  return generateOpeningFallback(data);
}

async function generateTacticsExplanation(data) {
  const systemPrompt = TACTICS_SYSTEM_PROMPT;
  const userPrompt = `Generate a tactics puzzle analysis for:

Puzzle FEN: ${data.fen || 'start'}
Solution: ${(data.solution || []).join(', ')}
Themes: ${(data.themes || []).join(', ')}
Rating Level: ${data.rating || 'N/A'}
Goal: ${data.goal || 'N/A'}
Stockfish Evaluation Before: ${data.evalBefore ? `${data.evalBefore.score || 0}` : 'N/A'}
Stockfish Evaluation After: ${data.evalAfter ? `${data.evalAfter.score || 0}` : 'N/A'}
Material Balance Before: ${data.materialBefore || 'N/A'}
Material Balance After: ${data.materialAfter || 'N/A'}

Provide a complete JSON object with the requested fields. Be specific about the board position and tactical motifs.`;

  const llmResult = await callLLM(systemPrompt, userPrompt);
  if (llmResult) {
    const parsed = parseLLMJsonResponse(llmResult);
    if (parsed) return parsed;
  }
  return generateTacticsFallback(data);
}

async function generateEndgameExplanation(data) {
  const systemPrompt = ENDGAME_SYSTEM_PROMPT;
  const userPrompt = `Generate an endgame analysis for:

Position FEN: ${data.fen || 'start'}
Endgame Name: ${data.name || 'Unknown'}
Difficulty: ${data.difficulty || 'N/A'}
Themes: ${(data.themes || []).join(', ')}
Solution: ${(data.solution || []).join(', ')}
Stockfish Evaluation Before: ${data.evalBefore ? `${data.evalBefore.score || 0}` : 'N/A'}
Stockfish Evaluation After: ${data.evalAfter ? `${data.evalAfter.score || 0}` : 'N/A'}

Provide a complete JSON object with the requested fields. Be specific about the endgame technique and key squares.`;

  const llmResult = await callLLM(systemPrompt, userPrompt);
  if (llmResult) {
    const parsed = parseLLMJsonResponse(llmResult);
    if (parsed) return parsed;
  }
  return generateEndgameFallback(data);
}

async function generateCoachPlan(data) {
  const systemPrompt = COACH_SYSTEM_PROMPT;
  const userPrompt = `Generate a personalized learning plan for a chess player with:

Username: ${data.username || 'Player'}
Rating: ${data.rating || 1200}
Average Accuracy: ${data.avgAccuracy || 0}%
Consistency Score: ${data.consistencyScore || 50}%
Blunder Rate: ${data.blunderRate || 0}
Tactical Ability Score: ${data.tacticalAbilityScore || 50}%
Positional Play Score: ${data.positionalPlayScore || 50}%
Opening Score: ${data.openingScore || 50}%
Endgame Score: ${data.endgameQualityScore || 50}%
Games Played: ${data.gamesPlayed || 0}
Favorite Opening: ${data.favoriteOpening || 'Unknown'}
Decision Making Score: ${data.decisionMakingScore || 50}%

Provide a complete JSON object with the requested fields. All recommendations must be based on these actual statistics.`;

  const llmResult = await callLLM(systemPrompt, userPrompt);
  if (llmResult) {
    const parsed = parseLLMJsonResponse(llmResult);
    if (parsed) return parsed;
  }
  return generateCoachFallback(data);
}

// ──────────────────────────────────────────────
// MINIMAL FALLBACK ENGINES
// ──────────────────────────────────────────────

const UNAVAILABLE_MSG = 'AI explanation is temporarily unavailable.';

function generateOpeningFallback(data) {
  return {
    explanation: UNAVAILABLE_MSG + ' The opening ' + (data.name || '') + ' (ECO: ' + (data.eco || 'N/A') + ') has moves: ' + (data.moves || []).join(', ') + '.',
    beginnerExplanation: UNAVAILABLE_MSG,
    intermediateExplanation: UNAVAILABLE_MSG,
    advancedExplanation: UNAVAILABLE_MSG,
    mainIdea: UNAVAILABLE_MSG,
    strategicConcepts: [],
    tacticalThemes: [],
    commonMistakes: [],
    practicalAdvice: UNAVAILABLE_MSG,
    trainingRecommendations: []
  };
}

function generateTacticsFallback(data) {
  return {
    explanation: UNAVAILABLE_MSG + ' Puzzle FEN: ' + (data.fen || 'N/A') + ', themes: ' + (data.themes || []).join(', ') + ', solution: ' + (data.solution || []).join(', ') + '.',
    beginnerExplanation: UNAVAILABLE_MSG,
    intermediateExplanation: UNAVAILABLE_MSG,
    advancedExplanation: UNAVAILABLE_MSG,
    mainIdea: UNAVAILABLE_MSG,
    strategicConcepts: [],
    tacticalThemes: data.themes || [],
    commonMistakes: [],
    practicalAdvice: UNAVAILABLE_MSG,
    trainingRecommendations: []
  };
}

function generateEndgameFallback(data) {
  return {
    explanation: UNAVAILABLE_MSG + ' Endgame: ' + (data.name || 'N/A') + ', FEN: ' + (data.fen || 'N/A') + '.',
    beginnerExplanation: UNAVAILABLE_MSG,
    intermediateExplanation: UNAVAILABLE_MSG,
    advancedExplanation: UNAVAILABLE_MSG,
    mainIdea: UNAVAILABLE_MSG,
    position: UNAVAILABLE_MSG + ' Position: ' + (data.fen || 'N/A') + '.',
    objective: UNAVAILABLE_MSG,
    winningMethod: UNAVAILABLE_MSG,
    keyIdeas: [],
    strategicConcepts: [],
    tacticalThemes: [],
    commonMistakes: [],
    practicalAdvice: UNAVAILABLE_MSG,
    trainingRecommendations: []
  };
}

function generateCoachFallback(data) {
  return {
    summary: UNAVAILABLE_MSG,
    difficulty: 'N/A',
    studyTime: 0,
    openings: [],
    tactics: [],
    endgames: [],
    trainingRecommendations: [],
    strategicConcepts: []
  };
}

// ──────────────────────────────────────────────
// CHAT RESPONSE
// ──────────────────────────────────────────────

async function generateChatResponse(messages) {
  const provider = getLLMProvider();
  if (provider === 'openrouter') {
    const model = 'google/gemini-2.5-flash';
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'Queen Chess'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: CHAT_SYSTEM_PROMPT },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: PRIMARY_MAX_TOKENS
        })
      });

      if (response.status === 402) {
        const retryResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5000',
            'X-Title': 'Queen Chess'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: CHAT_SYSTEM_PROMPT },
              ...messages
            ],
            temperature: 0.7,
            max_tokens: RETRY_MAX_TOKENS
          })
        });
        const retryData = await retryResponse.json();
        return retryData.choices?.[0]?.message?.content || generateChatFallback(messages);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || generateChatFallback(messages);
    } catch (error) {
      console.error('[AI] Chat error:', error);
      return generateChatFallback(messages);
    }
  }
  return generateChatFallback(messages);
}

function generateChatFallback(messages) {
  return UNAVAILABLE_MSG;
}

// ──────────────────────────────────────────────
// OPENING SEARCH & IDENTIFY
// ──────────────────────────────────────────────

async function generateOpeningSearch(name) {
  const systemPrompt = OPENING_SEARCH_SYSTEM_PROMPT;
  const userPrompt = 'Analyze the chess opening: "' + name + '"\n\nProvide concise analysis with Opening, Main moves, Main idea, Advantages, Disadvantages, Best for, Common mistakes. Max 200 words.';

  const llmResult = await callLLM(systemPrompt, userPrompt);
  if (llmResult) {
    const parsed = parseLLMJsonResponse(llmResult);
    if (parsed) return parsed;
  }

  return {
    openingName: name || 'Unknown Opening',
    eco: 'N/A',
    mainMoves: UNAVAILABLE_MSG,
    mainIdea: UNAVAILABLE_MSG,
    advantages: [],
    disadvantages: [],
    commonPlans: [],
    commonMistakes: []
  };
}

async function identifyOpeningAndExplain(movesStr) {
  const systemPrompt = IDENTIFY_OPENING_SYSTEM_PROMPT;
  const userPrompt = 'Identify the opening from these moves:\n\nMoves: ' + movesStr + '\n\nReturn identifiedOpening, eco, mainIdea, advantages, disadvantages, commonMistakes. Max 150 words.';

  const llmResult = await callLLM(systemPrompt, userPrompt);
  if (llmResult) {
    const parsed = parseLLMJsonResponse(llmResult);
    if (parsed) return parsed;
  }

  return {
    identifiedOpening: 'Opening Position',
    eco: 'N/A',
    mainIdea: UNAVAILABLE_MSG,
    advantages: [],
    disadvantages: [],
    commonMistakes: [],
    commonPlans: []
  };
}

// ──────────────────────────────────────────────
// JSON PARSING HELPERS
// ──────────────────────────────────────────────

function parseLLMJsonResponse(text) {
  if (!text) return null;
  if (typeof text === 'object') return text;

  let jsonStr = text;
  const blockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (blockMatch) {
    jsonStr = blockMatch[1];
  }

  const jsonStart = jsonStr.indexOf('{');
  if (jsonStart === -1) return null;

  let braceCount = 0;
  let lastCompleteBrace = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = jsonStart; i < jsonStr.length; i++) {
    const ch = jsonStr[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === '\\' && inString) { escapeNext = true; continue; }
    if (ch === '"' && !escapeNext) { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') braceCount++;
    else if (ch === '}') { braceCount--; if (braceCount === 0) { lastCompleteBrace = i; break; } }
  }

  if (lastCompleteBrace !== -1) {
    const candidate = jsonStr.substring(jsonStart, lastCompleteBrace + 1);
    try { return JSON.parse(candidate); } catch { /* fall through */ }
  }

  let partial = jsonStr.substring(jsonStart);
  partial = partial.replace(/\s+$/, '');
  let openBraces = (partial.match(/\{/g) || []).length;
  let closeBraces = (partial.match(/\}/g) || []).length;
  while (closeBraces < openBraces) { partial += '}'; closeBraces++; }
  let openBrackets = (partial.match(/\[/g) || []).length;
  let closeBrackets = (partial.match(/\]/g) || []).length;
  while (closeBrackets < openBrackets) { partial += ']'; closeBrackets++; }
  partial = partial.replace(/,(\s*[}\]])/g, '$1');

  try { return JSON.parse(partial); } catch { return extractFieldsFromTruncated(text); }
}

function extractFieldsFromTruncated(text) {
  const result = {};
  const nameMatch = text.match(/"openingName"\s*:\s*"([^"]+)"/);
  if (nameMatch) result.openingName = nameMatch[1];
  const ecoMatch = text.match(/"eco"\s*:\s*"([^"]+)"/);
  if (ecoMatch) result.eco = ecoMatch[1];
  const idMatch = text.match(/"identifiedOpening"\s*:\s*"([^"]+)"/);
  if (idMatch) result.identifiedOpening = idMatch[1];
  const movesMatch = text.match(/"mainMoves"\s*:\s*"([^"]+)"/);
  if (movesMatch) result.mainMoves = movesMatch[1];
  const ideaMatch = text.match(/"mainIdea"\s*:\s*"([^"]+)"/);
  if (ideaMatch) result.mainIdea = ideaMatch[1];
  if (Object.keys(result).length === 0) return null;
  return result;
}

// ──────────────────────────────────────────────
// EXPLORER LIST GENERATORS
// ──────────────────────────────────────────────

const EXPLORER_OPENINGS_PROMPT = `You are a chess opening expert. Generate a list of 10 diverse chess openings covering different categories (open game, semi-open, closed, Indian defenses, flank openings).

Return a JSON array of 10 objects with EXACTLY these fields:
{
  "id": "unique-kebab-case-id",
  "name": "Opening Name",
  "eco": "ECO code",
  "category": "Open Game | Semi-Open Game | Closed Game | Indian Defense | Flank Opening",
  "difficulty": "Beginner | Intermediate | Advanced",
  "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4"]
}

Include a variety: Italian Game, Ruy Lopez, Sicilian Defense, French Defense, Caro-Kann, Queen's Gambit, King's Indian, Nimzo-Indian, English Opening, Dutch Defense.
Each must have actual moves. Provide accurate ECO codes.`;

async function generateOpeningExplorerList() {
  const systemPrompt = EXPLORER_OPENINGS_PROMPT;
  const userPrompt = 'Generate 10 diverse chess openings with their ECO codes, categories, difficulty levels, and move sequences. Return a JSON array of 10 opening objects.';

  const llmResult = await callLLM(systemPrompt, userPrompt);
  if (llmResult) {
    try {
      const jsonStart = llmResult.indexOf('[');
      const jsonEnd = llmResult.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(llmResult.substring(jsonStart, jsonEnd + 1));
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* fall through */ }
  }

  return [
    { id: 'italian-game', name: 'Italian Game', eco: 'C50', category: 'Open Game', difficulty: 'Beginner', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'] },
    { id: 'ruy-lopez', name: 'Ruy Lopez', eco: 'C60', category: 'Open Game', difficulty: 'Intermediate', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'] },
    { id: 'sicilian-defense', name: 'Sicilian Defense', eco: 'B20', category: 'Semi-Open Game', difficulty: 'Advanced', moves: ['e4', 'c5'] },
    { id: 'french-defense', name: 'French Defense', eco: 'C00', category: 'Semi-Open Game', difficulty: 'Intermediate', moves: ['e4', 'e6'] },
    { id: 'caro-kann', name: 'Caro-Kann Defense', eco: 'B10', category: 'Semi-Open Game', difficulty: 'Intermediate', moves: ['e4', 'c6'] },
    { id: 'queens-gambit', name: "Queen's Gambit", eco: 'D06', category: 'Closed Game', difficulty: 'Intermediate', moves: ['d4', 'd5', 'c4'] },
    { id: 'kings-indian', name: "King's Indian Defense", eco: 'E70', category: 'Indian Defense', difficulty: 'Advanced', moves: ['d4', 'Nf6', 'c4', 'g6'] },
    { id: 'nimzo-indian', name: 'Nimzo-Indian Defense', eco: 'E20', category: 'Indian Defense', difficulty: 'Advanced', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'] },
    { id: 'english-opening', name: 'English Opening', eco: 'A10', category: 'Flank Opening', difficulty: 'Intermediate', moves: ['c4'] },
    { id: 'dutch-defense', name: 'Dutch Defense', eco: 'A80', category: 'Flank Opening', difficulty: 'Intermediate', moves: ['d4', 'f5'] }
  ];
}

const EXPLORER_ENDGAMES_PROMPT = `You are a chess endgame expert. Generate a list of 10 diverse chess endgame positions for practice.

Return a JSON array of 10 objects with EXACTLY these fields:
{
  "id": "unique-kebab-case-id",
  "name": "Endgame Name — Description",
  "fen": "valid FEN string for the position",
  "solution": ["first-move"],
  "difficulty": "Beginner | Intermediate | Advanced",
  "themes": ["theme1", "theme2"]
}

Include variety: king and pawn, rook endgames, queen endgames, bishop vs knight, opposite-colored bishops, etc.
FENs must be valid. Solutions should be the correct first move in SAN format.`;

async function generateEndgameExplorerList() {
  const systemPrompt = EXPLORER_ENDGAMES_PROMPT;
  const userPrompt = 'Generate 10 diverse chess endgame positions with valid FENs, solutions, difficulty levels, and themes. Return a JSON array of 10 endgame objects.';

  const llmResult = await callLLM(systemPrompt, userPrompt);
  if (llmResult) {
    try {
      const jsonStart = llmResult.indexOf('[');
      const jsonEnd = llmResult.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(llmResult.substring(jsonStart, jsonEnd + 1));
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* fall through */ }
  }

  return [
    { id: 'kq-v-k', name: 'Queen vs King — Mating Pattern', fen: '8/8/8/8/8/8/5K2/3Q2k1 w - - 0 1', solution: ['Qd2'], difficulty: 'Beginner', themes: ['mate-net', 'king-support'] },
    { id: 'kr-v-k', name: 'Rook vs King — Box Method', fen: '8/8/8/8/8/8/5K2/4R1k1 w - - 0 1', solution: ['Re2'], difficulty: 'Intermediate', themes: ['box-method', 'king-cutoff'] },
    { id: 'pawn-race', name: 'Pawn Race — King Activity', fen: '8/4k3/8/3P4/8/8/4K3/8 w - - 0 1', solution: ['Kd3'], difficulty: 'Intermediate', themes: ['king-activity', 'promotion-race'] },
    { id: 'k-p-v-k', name: 'King and Pawn vs King — Opposition', fen: '8/8/8/3k4/8/2K5/4P3/8 w - - 0 1', solution: ['Kd3'], difficulty: 'Beginner', themes: ['opposition', 'pawn-promotion'] },
    { id: 'rook-endgame', name: 'Rook Endgame — Lucena Position', fen: '8/8/8/8/8/2R5/4K1k1/8 w - - 0 1', solution: ['Rc2'], difficulty: 'Advanced', themes: ['lucena', 'rook-activity'] },
    { id: 'bishop-v-knight', name: 'Bishop vs Knight — Opposite Color', fen: '8/8/8/3b4/8/5N2/5K2/7k w - - 0 1', solution: ['Ne1'], difficulty: 'Intermediate', themes: ['piece-activity', 'king-position'] },
    { id: 'queen-v-pawn', name: 'Queen vs Pawn — Promotion Defense', fen: '8/8/8/8/5K2/8/4k3/4Q3 w - - 0 1', solution: ['Qd2'], difficulty: 'Intermediate', themes: ['queen-activity', 'king-support'] },
    { id: 'two-bishops', name: 'Two Bishops — Mating Pattern', fen: '8/8/8/8/1B6/8/5K2/6k1 w - - 0 1', solution: ['Be4'], difficulty: 'Beginner', themes: ['bishop-pair', 'mate-net'] },
    { id: 'passed-pawn', name: 'Passed Pawn — Outside Passer', fen: '8/8/8/3Pk3/8/4K3/8/8 w - - 0 1', solution: ['Ke4'], difficulty: 'Beginner', themes: ['passed-pawn', 'king-activity'] },
    { id: 'triangulation', name: 'Triangulation — Zugzwang', fen: '8/8/8/8/3k4/8/3K4/8 w - - 0 1', solution: ['Kd1'], difficulty: 'Advanced', themes: ['triangulation', 'zugzwang'] }
  ];
}

async function generateLearningPathSummary(profile, path) {
  try {
    const userPrompt = 'Generate a concise learning path summary for:\nRating: ' + (profile.rating || 1200) + '\nStrengths: ' + (path.focusAreas?.filter(f => profile[f + 'Score'] > 60).join(', ') || 'N/A') + '\nWeaknesses: ' + (path.focusAreas?.join(', ') || 'N/A') + "\nToday's Focus: " + (path.focusAreas?.[0] || 'general improvement') + '\nWeekly Goal: reach ' + (path.nextMilestone || 1300) + ' rating\nNext Target: ' + (path.nextMilestone || 1300);
    const result = await callLLM(LEARNING_PATH_SYSTEM_PROMPT, userPrompt);
    if (result) {
      const parsed = parseLLMJsonResponse(result);
      if (parsed?.summary) return parsed.summary;
    }
  } catch { /* fall through */ }
  return null;
}

async function generateDailyTrainingExplanation(profile, training) {
  try {
    const userPrompt = 'Explain why this training is recommended:\nRating: ' + (profile.rating || 1200) + '\nTraining: ' + (training.sessionSummary || 'mixed exercises') + '\nFocus: ' + (training.tactical?.themes?.join(', ') || 'tactics') + '\nOpening: ' + (training.opening?.focus || 'general') + '\nEndgame: ' + (training.endgame?.focus?.join(', ') || 'endgames');
    const result = await callLLM(DAILY_TRAINING_SYSTEM_PROMPT, userPrompt);
    return result || null;
  } catch { return null; }
}

// ──────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────

module.exports = {
  generateOpeningExplanation,
  generateTacticsExplanation,
  generateEndgameExplanation,
  generateCoachPlan,
  generateChatResponse,
  generateOpeningSearch,
  identifyOpeningAndExplain,
  generateLearningPathSummary,
  generateDailyTrainingExplanation,
  generateOpeningExplorerList,
  generateEndgameExplorerList
};