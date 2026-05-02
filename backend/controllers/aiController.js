const OpenAI = require("openai");
const { supabase } = require("../config/supabase");

const client = new OpenAI({
  baseURL: process.env.LLM7_BASE_URL,
  apiKey: process.env.LLM7_API_KEY,
});

const askAI = async (req, res) => {
  try {
    const { prompt, userId } = req.body;
    const response = await client.chat.completions.create({
      model: "default",
      messages: [
        {
          role: "system",
          content: `Bạn là đầu bếp và chuyên gia dinh dưỡng cấp cao của EatVibing.
          
          NGUYÊN TẮC KIẾN THỨC:
          - Chỉ trả lời dựa trên kiến thức ẩm thực thực tế (VD: Gordon Ramsay, Michelin Guide, BBC Good Food).
          - Tuyệt đối KHÔNG tự bịa đặt nguyên liệu hoặc các loại nước sốt không có thật.
          - Nếu không biết rõ công thức, hãy trả lời: "Xin lỗi Chef, tôi chưa tìm thấy công thức chuẩn cho món này từ nguồn uy tín."

          QUY TẮC CHỐNG LẶP (ANTI-LOOP):
          - Không liệt kê quá 10 nguyên liệu cho một món đơn giản.
          - Mỗi dòng nguyên liệu phải khác biệt hoàn toàn về bản chất (không được liệt kê nhiều loại sốt kem tương tự nhau).
          
          CẤU TRÚC PHẢN HỒI (MARKDOWN):
          1. CÁCH NẤU: 
             - ### [Tên món ăn]
             - **Nguyên liệu**: Danh sách (*) kèm định lượng.
             - "Trên đây là các nguyên liệu cần thiết, sau đây là cách thực hiện."
             - **Cách nấu**: Danh sách số (1, 2, 3...).
             - > **Mẹo**: Blockquote ngắn gọn.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      frequency_penalty: 0.8,
      presence_penalty: 0.5,
    });
    const answer = response.choices[0].message.content;
    //luu vao supabase
    //chi thuc hien luu neu co userId gui len (login user)
    if (userId) {
      const { error } = await supabase.from("messages").insert([
        { user_id: userId, role: "user", content: prompt },
        { user_id: userId, role: "assistant", content: answer },
      ]);
      if (error) {
        console.error("Error Saving chat history", error.message);
      }
    }
    res.status(200).json({ answer });
  } catch (error) {
    console.error("AI error", error);
    res.status(500).json({ error: "AI is taking a rest, please wait!" });
  }
};
const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("History error:", error.message);
    res.status(500).json({ error: "Could not fetch chat history" });
  }
};
module.exports = { askAI, getChatHistory };
