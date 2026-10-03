// Deprecated endpoints never trust a caller-supplied user ID or expose health chat history.
const retired = (req, res) => res.status(410).json({ error: "Use the authenticated /api/v1/assistant/messages endpoint." });
module.exports = { askAI: retired, getChatHistory: retired };
