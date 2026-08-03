const memoryRepository = require("../repositories/memoryRepository");
const { generateChatResponse } = require("../ai/aiExplanationService");

const pageContexts = {
  home: "You're on your dashboard. Ask me about your stats, today's goals, or recommendations to improve.",
  play: "You're about to play a game. I can give you opening tips, time management advice, or help you prepare.",
  "my-games": "You're reviewing your games. I can help you analyze specific positions or explain common patterns in your play.",
  learning: "You're in the learning hub. Ask me about openings, tactics, endgames, or any chess concept.",
  quiz: "You're about to take a quiz. I can help you review chess rules and prepare.",
  profile: "You're on your profile. I can suggest improvements based on your stats and game history.",
  premium: "You're on the premium page. I can tell you about premium features.",
  analysis: "You're analyzing a game. I can explain every move, highlight critical positions, and point out tactical patterns.",
  "opening-explorer": "You're exploring openings. I can explain plans, traps, common mistakes, and typical middlegame positions for any opening.",
  default: "I'm your AI Chess Coach. Ask me anything about chess!",
};

const chatPageContexts = {
  home: "The user is on their dashboard.",
  play: "The user is about to play a chess game.",
  "my-games": "The user is reviewing their game history.",
  learning: "The user is in the chess learning section.",
  quiz: "The user is taking a chess quiz.",
  profile: "The user is viewing their profile.",
  premium: "The user is on the premium features page.",
};

async function getContext(userId, user, page) {
  const contextMessage = pageContexts[page] || pageContexts.default;
  let personalNote = "";

  try {
    const memory = await memoryRepository.getAIMemory(userId);
    if (memory && memory.memories && memory.memories.length > 0) {
      const name = user.displayName || user.username;
      const recentGoal = memory.memories.find((m) => m.category === "goal");
      const recentOpening = memory.memories.find((m) => m.key === "favorite_opening");

      if (recentGoal) {
        personalNote = ` ${name}, I remember you wanted to focus on: ${recentGoal.value}. `;
      }
      if (recentOpening && !personalNote) {
        personalNote = ` I see you enjoy playing ${recentOpening.value}. `;
      }
    }
  } catch {
    // Non-critical.
  }

  return {
    success: true,
    data: {
      welcome: contextMessage + personalNote,
      page,
    },
  };
}

async function chat(userId, message, page) {
  if (!message || !message.trim()) {
    throw { status: 400, message: "Message is required" };
  }

  let contextStr = chatPageContexts[page] || "The user is on the Queen Chess platform.";

  try {
    const memory = await memoryRepository.getAIMemory(userId);
    if (memory && memory.memories && memory.memories.length > 0) {
      const relevantMemories = memory.memories
        .filter((m) => {
          if (page === "learning" && ["opening", "skill", "weakness"].includes(m.category)) return true;
          if (page === "play" && ["opening", "preference"].includes(m.category)) return true;
          if (page === "my-games" && ["weakness", "training", "goal"].includes(m.category)) return true;
          return ["opening", "skill", "preference", "goal"].includes(m.category);
        })
        .slice(0, 5);

      if (relevantMemories.length > 0) {
        contextStr += "\nRelevant user context:";
        relevantMemories.forEach((m) => {
          contextStr += `\n- ${m.key}: ${m.value}`;
        });
      }
    }
  } catch {
    // Non-critical.
  }

  const messagesForAI = [
    { role: "assistant", content: `[Context: ${contextStr}]` },
    { role: "user", content: message },
  ];

  const aiResponse = await generateChatResponse(messagesForAI);

  try {
    await extractMemoryFromChat(userId, message);
  } catch {
    // Non-critical.
  }

  return {
    success: true,
    data: {
      response: aiResponse || "AI explanation is temporarily unavailable.",
    },
  };
}

async function extractMemoryFromChat(userId, userMessage) {
  const lowerMessage = userMessage.toLowerCase();

  const openingPatterns = [
    /(?:i\s+(?:love|like|enjoy|play|use)\s+(?:the\s+)?)?(\w+\s+\w+\s*(?:defense|gambit|opening|attack|variation|system)?)/i,
    /(?:my\s+favorite\s+opening\s+(?:is\s+|:))?\s*(\w+(?:\s+\w+)*)\s*(?:defense|gambit|opening|attack|variation|system)/i,
  ];

  for (const pattern of openingPatterns) {
    const match = lowerMessage.match(pattern);
    if (match && match[1]) {
      const opening = match[1].trim();
      if (opening.length > 3 && !["game", "chess", "play", "like"].includes(opening)) {
        await memoryRepository.upsertAIMemoryEntry(userId, {
          key: "favorite_opening",
          value: opening,
          category: "opening",
          confidence: 0.7,
        });
        break;
      }
    }
  }

  const skillPatterns = [
    /(?:i'?m?\s+(?:a\s+)?)(beginner|intermediate|advanced|expert|master)/i,
    /(?:my\s+(?:rating|level)\s+(?:is\s+)?)(\d{3,4})/i,
  ];

  for (const pattern of skillPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      await memoryRepository.upsertAIMemoryEntry(userId, {
        key: "skill_level",
        value: match[1],
        category: "skill",
        confidence: 0.6,
      });
      break;
    }
  }

  const goalPatterns = [
    /(?:i\s+(?:want|need|would\s+like)\s+to\s+)?(improve|learn|master|get\s+better\s+at)\s+(\w+(?:\s+\w+)*)/i,
    /(?:my\s+(?:goal|target|aim)\s+(?:is\s+)?)(\w+(?:\s+\w+)*)/i,
  ];

  for (const pattern of goalPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const goal = match[match.length - 1].trim();
      if (goal.length > 3) {
        await memoryRepository.upsertAIMemoryEntry(userId, {
          key: "current_goal",
          value: goal,
          category: "goal",
          confidence: 0.8,
        });
        break;
      }
    }
  }
}

module.exports = {
  getContext,
  chat,
};