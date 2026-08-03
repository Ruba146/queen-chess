const chatService = require("../services/chatService");

async function listChats(req, res) {
  try {
    const result = await chatService.listChats(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createChat(req, res) {
  try {
    const { title } = req.body;
    const result = await chatService.createChat(req.user.id, title);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateChat(req, res) {
  try {
    const result = await chatService.updateChatTitle(req.user.id, req.params.id, req.body.title);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function deleteChat(req, res) {
  try {
    const result = await chatService.deleteChat(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function searchChats(req, res) {
  try {
    const query = req.query.q || "";
    const result = await chatService.searchChats(req.user.id, query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMessages(req, res) {
  try {
    const result = await chatService.getMessages(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function sendMessage(req, res) {
  try {
    const { content } = req.body;
    const result = await chatService.sendMessage(req.user.id, req.params.id, content);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  listChats,
  createChat,
  updateChat,
  deleteChat,
  searchChats,
  getMessages,
  sendMessage,
};