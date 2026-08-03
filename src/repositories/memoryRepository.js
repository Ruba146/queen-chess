const prisma = require("../config/prisma");
const { serializeAIMemory } = require("../utils/serializers");

async function getOrCreateAIMemory(userId) {
  const memory = await prisma.aIMemory.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: { entries: { orderBy: { createdAt: "asc" } } },
  });
  return serializeAIMemory(memory);
}

async function getAIMemory(userId) {
  const memory = await prisma.aIMemory.findUnique({
    where: { userId },
    include: { entries: { orderBy: { createdAt: "asc" } } },
  });
  return serializeAIMemory(memory);
}

async function upsertAIMemoryEntry(userId, data) {
  const memory = await getOrCreateAIMemory(userId);
  const existing = memory.memories.find((entry) => entry.key === data.key);

  if (existing) {
    await prisma.aIMemoryEntry.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.aIMemoryEntry.create({
      data: {
        memoryId: memory.id,
        key: data.key,
        value: data.value,
        category: data.category || "general",
        confidence: data.confidence ?? 0.5,
      },
    });
  }

  return getOrCreateAIMemory(userId);
}

async function deleteAIMemoryEntry(userId, key) {
  const memory = await getAIMemory(userId);
  if (!memory) return null;
  await prisma.aIMemoryEntry.deleteMany({
    where: { memoryId: memory.id, key },
  });
  return getAIMemory(userId);
}

module.exports = {
  getOrCreateAIMemory,
  getAIMemory,
  upsertAIMemoryEntry,
  deleteAIMemoryEntry,
};