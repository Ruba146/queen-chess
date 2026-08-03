const prisma = require("../config/prisma");
const { withLegacyId } = require("../utils/serializers");

async function listChatsByUser(userId) {
  const chats = await prisma.chat.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return chats.map(withLegacyId);
}

async function searchChatsByUser(userId, query) {
  const chats = await prisma.chat.findMany({
    where: {
      userId,
      ...(query.trim()
        ? { title: { contains: query, mode: "insensitive" } }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return chats.map(withLegacyId);
}

async function getChatById(chatId) {
  return prisma.chat.findUnique({ where: { id: chatId } });
}

async function getChatForUser(chatId, userId) {
  return prisma.chat.findFirst({
    where: { id: chatId, userId },
  });
}

async function createChat(userId, title) {
  const chat = await prisma.chat.create({
    data: { userId, title: title || "New Chat" },
  });
  return withLegacyId(chat);
}

async function updateChat(chatId, data) {
  const chat = await prisma.chat.update({
    where: { id: chatId },
    data,
  });
  return withLegacyId(chat);
}

async function deleteChat(chatId) {
  await prisma.chat.delete({ where: { id: chatId } });
}

async function getMessagesByChat(chatId) {
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, createdAt: true },
  });
  return messages.map(withLegacyId);
}

async function createMessage(chatId, role, content) {
  const message = await prisma.message.create({
    data: { chatId, role, content },
  });
  return withLegacyId(message);
}

async function getRecentMessages(chatId, limit = 20) {
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  messages.reverse();
  return messages;
}

async function findChatsByTitlePrefix(userId, prefix) {
  return prisma.chat.findMany({
    where: {
      userId,
      title: { startsWith: prefix },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
    include: {
      _count: { select: { messages: true } },
    },
  });
}

async function getChatMessageCount(chatId) {
  return prisma.message.count({ where: { chatId } });
}

module.exports = {
  listChatsByUser,
  searchChatsByUser,
  getChatById,
  getChatForUser,
  createChat,
  updateChat,
  deleteChat,
  getMessagesByChat,
  createMessage,
  getRecentMessages,
  findChatsByTitlePrefix,
  getChatMessageCount,
};