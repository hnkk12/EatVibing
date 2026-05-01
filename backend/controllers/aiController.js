const OpenAI = require("openai");

const client = new OpenAI({
  baseURL: process.env.LLM7_BASE_URL,
  apiKey: process.env.LLM7_API_KEY,
});

const askAI = async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await client.chat.completions.create({
      model: "default",
      messages: [
        {
          role: "system",
          content: `Bạn là đầu bếp và chuyên gia dinh dưỡng của EatVibing.
          
          PHẠM VI TRẢ LỜI:
          - CHỈ trả lời về ẩm thực, nấu ăn, dinh dưỡng, và lộ trình ăn uống (meal plan).
          - Nếu câu hỏi lạc đề, hãy trả lời lịch sự dựa trên ngôn ngữ người dùng: 
            + Tiếng Việt: "Xin lỗi Chef, tôi chỉ hỗ trợ các vấn đề về bếp núc và dinh dưỡng. Vui lòng đặt câu hỏi liên quan nhé! 🍳"
            + Tiếng Anh: "Sorry Chef, I only support cooking and nutrition-related questions. Please ask something related! 🍳"

          CẤU TRÚC PHẢN HỒI (MARKDOWN):
          1. CÁCH NẤU: 
             - ### [Tên món ăn]
             - **Nguyên liệu**: Dùng danh sách dấu chấm tròn (*) kèm định lượng.
             - *Sau khi liệt kê xong nguyên liệu, bạn PHẢI viết dòng sau: "Trên đây là các nguyên liệu cần thiết, sau đây là cách thực hiện."*
             - **Cách nấu**: Dùng danh sách số thứ tự (1, 2, 3...).
             - > **Mẹo**: Dùng blockquote.
          
          2. GỢI Ý MÓN/LỘ TRÌNH: 
             - Sử dụng Bảng (Table) hoặc danh sách rõ ràng.
             - Giải thích ngắn gọn lý do gợi ý.
          
          YÊU CẦU NGHIÊM NGẶT: 
          - KHÔNG lặp lại thông tin. Mỗi nguyên liệu chỉ xuất hiện MỘT LẦN.
          - Tuyệt đối không để xảy ra hiện tượng lặp lại (looping) từ ngữ.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      frequency_penalty: 0.8,
      presence_penalty: 0.5,
    });
    const answer = response.choices[0].message.content;
    res.status(200).json({ answer });
  } catch (error) {
    console.error("AI error", error);
    res.status(500).json({ error: "AI is taking a rest, please wait!" });
  }
};
module.exports = { askAI };
