const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");

router.get("/", protect, chatController.listChats);
router.post("/", protect, chatController.createChat);
router.put("/:id", protect, chatController.updateChat);
router.delete("/:id", protect, chatController.deleteChat);
router.get("/search", protect, chatController.searchChats);
router.get("/:id/messages", protect, chatController.getMessages);
router.post("/:id/messages", protect, chatController.sendMessage);

module.exports = router;