const chatRepository = require("../repositories/chatRepository");
const memoryRepository = require("../repositories/memoryRepository");
const { generateChatResponse } = require("../ai/aiExplanationService");

function withLegacyId(record) {
  return record ? { ...record, _id: record.id } : record;
}

async function listChats(userId) {
  const chats = await chatRepository.listChatsByUser(userId);
  return { success: true, data: chats };
}

async function createChat(userId, title) {
  const chat = await chatRepository.createChat(userId, title);
  return { success: true, data: withLegacyId(chat) };
}

async function updateChatTitle(userId, chatId, title) {
  const existing = await chatRepository.getChatForUser(chatId, userId);
  if (!existing) {
    throw { status: 404, message: "Chat not found" };
  }
  const chat = await chatRepository.updateChat(chatId, { title, updatedAt: new Date() });
  return { success: true, data: withLegacyId(chat) };
}

async function deleteChat(userId, chatId) {
  const existing = await chatRepository.getChatForUser(chatId, userId);
  if (!existing) {
    throw { status: 404, message: "Chat not found" };
  }
  await chatRepository.deleteChat(chatId);
  return { success: true, message: "Chat deleted" };
}

async function searchChats(userId, query) {
  const chats = await chatRepository.searchChatsByUser(userId, query);
  return { success: true, data: chats };
}

async function getMessages(userId, chatId) {
  const chat = await chatRepository.getChatForUser(chatId, userId);
  if (!chat) {
    throw { status: 404, message: "Chat not found" };
  }
  const messages = await chatRepository.getMessagesByChat(chatId);
  return { success: true, data: messages };
}

async function sendMessage(userId, chatId, content) {
  if (!content || !content.trim()) {
    throw { status: 400, message: "Message content is required" };
  }

  const chat = await chatRepository.getChatForUser(chatId, userId);
  if (!chat) {
    throw { status: 404, message: "Chat not found" };
  }

  const userMessage = await chatRepository.createMessage(chatId, "user", content.trim());

  const history = await chatRepository.getRecentMessages(chatId, 20);

  const messagesForAI = history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  try {
    const memory = await memoryRepository.getAIMemory(userId);
    if (memory && memory.memories && memory.memories.length > 0) {
      const memoryStr = memory.memories
        .slice(0, 8)
        .map((m) => `${m.key}: ${m.value}`)
        .join("\n");

      if (memoryStr) {
        messagesForAI.unshift({
          role: "assistant",
          content: `[Context from previous conversations: ${memoryStr}]`,
        });
      }
    }
  } catch {
    // Non-critical.
  }

  const aiResponse = await generateChatResponse(messagesForAI);

  const assistantMessage = await chatRepository.createMessage(
    chatId,
    "assistant",
    aiResponse || "AI explanation is temporarily unavailable."
  );

  const shouldRename = chat.title === "New Chat" && history.length <= 1;
  const autoTitle = content.trim().substring(0, 60) + (content.trim().length > 60 ? "..." : "");
  await chatRepository.updateChat(chatId, {
    title: shouldRename ? autoTitle : chat.title,
    updatedAt: new Date(),
  });

  return {
    success: true,
    data: {
      user: {
        _id: userMessage.id,
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.createdAt,
      },
      assistant: {
        _id: assistantMessage.id,
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
      },
    },
  };
}

module.exports = {
  listChats,
  createChat,
  updateChatTitle,
  deleteChat,
  searchChats,
  getMessages,
  sendMessage,
};