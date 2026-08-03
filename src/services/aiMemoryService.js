const memoryRepository = require("../repositories/memoryRepository");

async function getMemory(userId) {
  const memory = await memoryRepository.getOrCreateAIMemory(userId);
  return { success: true, data: memory };
}

async function upsertMemory(userId, { key, value, category, confidence }) {
  if (!key || !value) {
    throw { status: 400, message: "Key and value are required" };
  }
  const memory = await memoryRepository.upsertAIMemoryEntry(userId, {
    key,
    value,
    category: category || "general",
    confidence: confidence !== undefined ? confidence : 0.5,
  });
  return { success: true, data: memory };
}

async function deleteMemory(userId, key) {
  const existing = await memoryRepository.getAIMemory(userId);
  if (!existing) {
    throw { status: 404, message: "No memory found" };
  }
  const memory = await memoryRepository.deleteAIMemoryEntry(userId, key);
  return { success: true, data: memory };
}

module.exports = {
  getMemory,
  upsertMemory,
  deleteMemory,
};