# BÁO CÁO THUYẾT MINH ĐỀ TÀI NGHIÊN CỨU KHOA HỌC & DỰ ÁN CÔNG NGHỆ (AISC 2026)

# 🥗 EATVIBING
## HỆ THỐNG TRỢ LÝ AI ĂN UỐNG CÁ NHÂN HÓA VÀ HỖ TRỢ RA QUYẾT ĐỊNH ẨM THỰC TỰ ĐỘNG THEO VÒNG LẶP PANTRY-TO-PLATE
*(EatVibing – Personalized AI Food Coach & Culinary Decision System)*

---

## 🧭 PHƯƠNG HƯỚNG SẢN PHẨM CHỐT CHO AISC'26

### North Star
EatVibing được phát triển như một **Personalized AI Food Coach & Trust-Grounded Culinary Decision System**, không phải kho công thức, chatbot hỏi–đáp hay ứng dụng ép người dùng theo một thực đơn cứng. North Star của sản phẩm là: **mỗi ngày giúp người dùng đi từ bối cảnh thật trong bếp đến một quyết định bữa ăn có thể thực hiện, có căn cứ và ngày càng phù hợp hơn nhờ dữ liệu kết quả thực tế**.

### Beachhead user và job-to-be-done
- **Primary user:** người 18–35 tuổi sống một mình hoặc theo cặp, là sinh viên/nhân viên trẻ, đã có động lực tự nấu nhưng thiếu thời gian và “mental bandwidth” để quyết định, quản lý pantry và phối hợp các mục tiêu ăn uống.
- **Primary job:** “Với những gì tôi đang có, thời gian/ngân sách/ràng buộc của tôi hôm nay, hãy giúp tôi chọn và nấu một bữa phù hợp mà tôi có thể tin cậy.”
- Phân khúc mở rộng gồm hộ gia đình, người theo mục tiêu thể chất, creator/chuyên gia ẩm thực và đối tác grocery/wellness/campus. Phạm vi được xác định theo nhu cầu, không giới hạn theo quốc gia; hệ thống dùng language/market packs để bản địa hóa.

### Bốn trụ cột sản phẩm
1. **Persistent Personal Food Model:** hồ sơ bền vững kết hợp profile, pantry, khẩu vị, ràng buộc và chuỗi hành vi `View → Save → Pick → Cook → Skip → Repeat → Swap → Leftover/Waste`.
2. **Adaptive Guidance, not rigid planning:** Personalized Guideline cung cấp lựa chọn theo bữa/ngày/tuần và giải thích “Why this meal?”; Trending Guideline dùng qualified engagement nhưng không bao giờ vượt hard constraints.
3. **AI–Tool Separation:** AI Coach xử lý hội thoại Text/Voice, ambiguity, retrieval/adaptation và giải thích; calculator, constraint engine, pantry diff và policy engine xử lý các phép tính hoặc quyết định cần tính xác định.
4. **Culinary Trust Layer:** sáu cổng Identity & Quantity, Constraint, Nutrition, Food Safety, Feasibility & Waste, Evidence & Disclosure; đầu ra chỉ ở ba trạng thái `SAFE / REVIEW / BLOCK` và fail-closed khi thiếu dữ liệu quan trọng.

### Nguyên tắc claim và đánh giá
- Không tuyên bố “an toàn tuyệt đối” hay thay thế bác sĩ/chuyên gia dinh dưỡng. Mọi claim quan trọng phải có nguồn, phiên bản dữ liệu, assumptions, confidence và giới hạn sử dụng.
- Mục tiêu dị ứng được đo bằng **zero critical false negative trên bộ acceptance test có kiểm soát**, sau đó tiếp tục red-team và expert review; không suy diễn thành bảo đảm tuyệt đối ngoài đời thực.
- Số liệu dinh dưỡng hiển thị phải truy được về bản ghi nguồn và có thể tái tính; LLM không tự tạo con số dinh dưỡng hoặc nới hard constraints.
- Tác động giảm food waste, mức chấp nhận guideline và khả năng giữ chân được trình bày như mục tiêu pilot có baseline, không phải kết quả đã chứng minh.

---

## 📌 TÓM TẮT DỰ ÁN (EXECUTIVE SUMMARY)

> **Định vị sản phẩm cốt lõi (One-Sentence Pitch):**  
> **EatVibing là trợ lý AI ăn uống cá nhân hóa, học từ nguyên liệu sẵn có, hồ sơ, khẩu vị và hành vi nấu thực tế để tạo hướng dẫn bữa ăn đáng tin cậy theo vòng lặp Pantry → Plan → Trust → Cook → Learn.**  
> *(EatVibing is a personalized AI food coach that learns what users have, like and actually cook, then turns that context into trustworthy meal guidance through a Pantry → Plan → Trust → Cook → Learn loop).*

**EatVibing** là nền tảng công nghệ ẩm thực (AI-powered FoodTech SaaS) giúp giải quyết bài toán lặp lại **"Hôm nay ăn gì?"**, giảm lãng phí thực phẩm trong hộ gia đình và đồng hành cùng người dùng xây dựng thói quen ăn uống phù hợp, bền vững hơn.

Không dừng lại ở vai trò một chatbot công thức thông thường hay một ứng dụng đếm calo thụ động, EatVibing định vị là một **Personalized AI Food Coach (EatVibing AI Coach)** xuyên suốt toàn bộ hành trình ăn uống. Hệ thống kết hợp Mô hình Ngôn ngữ Lớn (LLM) để hiểu ngôn ngữ tự nhiên (Text & Voice) với một **Lớp ủy thác ẩm thực (Culinary Trust Layer)** mang tính xác định (*Deterministic Policy Engine*). Những gợi ý chưa đủ bằng chứng hoặc có xung đột quan trọng được yêu cầu xác nhận hay bị chặn trước khi đến tay người dùng.

Trải nghiệm được thiết kế theo hướng **Web/PWA mobile-first**, có khả năng mở rộng sang **Native Mobile App**, household mode và các tích hợp đối tác mà không thay đổi các nguyên tắc dữ liệu và Trust Layer cốt lõi.

---

## CHƯƠNG 1: BỐI CẢNH, VẤN ĐỀ VÀ TÍNH CẤP THIẾT CỦA ĐỀ TÀI

### 1.1. Bối cảnh thực tiễn & Điểm nghẽn thị trường (Problem Statement)
Trong nhịp sống hiện đại, việc duy trì một chế độ ăn uống lành mạnh, tiết kiệm và phù hợp với thể trạng cá nhân đang đối mặt với các rào cản nghiêm trọng:
1. **Sự mệt mỏi vì phải ra quyết định (*Decision Fatigue*):** Người dùng phải lặp lại việc chọn món, cân đối thời gian, ngân sách và mục tiêu ăn uống mỗi ngày; quá trình phân mảnh này dễ dẫn đến lựa chọn vội vàng hoặc từ bỏ việc tự nấu.
2. **Lãng phí thực phẩm tại hộ gia đình (*Household Food Waste*):** UNEP ước tính hộ gia đình chiếm khoảng 60% lượng food waste ở cấp bán lẻ, dịch vụ ăn uống và hộ gia đình trong năm 2022. Một nguyên nhân có thể can thiệp ở cấp sản phẩm là pantry không được nhìn thấy, theo dõi và ưu tiên theo hạn dùng.
3. **Sự đứt gãy giữa Công thức - Dinh dưỡng - Thực tế nấu:** Các ứng dụng hiện nay hoặc chỉ là kho công thức tĩnh (không biết trong tủ lạnh người dùng có gì), hoặc là ứng dụng đếm calo khô khan (bắt người dùng nhập liệu thủ công), hoặc chatbot AI tự do dễ bị "ảo giác" (*hallucination*), tự bịa số liệu dinh dưỡng và nguyên liệu không an toàn.
4. **Thiếu tính cá nhân hóa thích ứng dài hạn:** Đa phần các ứng dụng gợi ý món dựa trên lượt click/view ngẫu nhiên mà không hề ghi nhớ người dùng thích gì, ghét gì, đã nấu món nào, bỏ thừa nguyên liệu nào để ngày càng phục vụ thông minh hơn.

### 1.2. Mục tiêu nghiên cứu & Chỉ số thành công (Objectives & Success Metrics)

#### A. Mục tiêu tổng quát & Cụ thể
- **Adaptive Personalization & AI Coach:** Xây dựng mô hình *EatVibing AI Coach* đồng hành liên tục, tiếp nhận đầu vào đa phương thức (Text, Voice) và duy trì *Persistent Personal Food Model* qua nhiều phiên tương tác.
- **Constraint-Aware Planning & Culinary Trust Layer:** Thiết lập cơ chế kiểm duyệt độc lập (*Deterministic Verification*) phân loại rõ ràng trạng thái **SAFE / REVIEW / BLOCK**; đặt mục tiêu không có critical allergen false negative trong bộ acceptance test và không hiển thị số liệu dinh dưỡng không truy được về nguồn.
- **Pantry-to-Plate Automation:** Tự động hóa toàn diện quy trình: Quản lý tủ lạnh thông minh (*Smart Pantry*) ➔ Lập thực đơn cá nhân hóa (*Personalized Meal Guideline*) ➔ Hướng dẫn nấu ăn rảnh tay (*Guided Cooking*) ➔ Học từ phản hồi thực tế (*Outcome-based Learning Loop*).

#### B. Chỉ số đo lường thành công (Success Metrics)
| Nhóm chỉ số | Chỉ số cụ thể | Mục tiêu kỳ vọng |
| :--- | :--- | :--- |
| **Mức độ tương tác & Chuyển đổi** | **Guideline Acceptance Rate** | > 65% gợi ý trong ngày được người dùng chấp thuận |
| | **Pick-to-Cook Conversion** | > 50% món được chọn chuyển thành hành động nấu thực tế |
| | **Repeat-Cook Rate** | Tăng trưởng 30% tỷ lệ nấu lại các món hợp khẩu vị |
| | **Voice Task Completion** | > 85% tác vụ rảnh tay hoàn thành chính xác bằng giọng nói |
| **Độ tin cậy & An toàn** | **Critical Allergen False-Negative** | 0 trường hợp trên bộ acceptance test có kiểm soát; mọi unknown critical ingredient chuyển REVIEW/BLOCK |
| | **Nutrition Provenance Coverage** | 100% số liệu calo/macro hiển thị truy được về source record và serving assumptions |
| | **Recommendation Diversity** | Đảm bảo phân bổ đa dạng trường phái ẩm thực, không bão hòa món viral |
| **Hiệu quả Xã hội & Cá nhân hóa** | **Food Waste Reduction** | Giảm 35% lượng thực phẩm bị bỏ quên quá hạn trong tủ lạnh |
| | **Cold-start to Personalized Quality** | Đạt độ khớp khẩu vị > 80% chỉ sau 3 lần nấu đầu tiên |

---

## CHƯƠNG 2: TÍNH MỚI, ĐIỂM ĐỘT PHÁ VÀ SO SÁNH GIẢI PHÁP

### 2.1. Tính mới và Điểm đột phá (Novelty & Key Differentiators)

```
[Khảo sát Onboarding + Smart Pantry] ──► [EatVibing AI Coach] ──► [Personalized Meal Guideline]
                                                  │
                                                  ▼
[Học từ Outcome: Nấu/Bỏ/Đánh giá] ◄── [Guided Cooking] ◄── [Culinary Trust Layer (SAFE/REVIEW/BLOCK)]
```

1. **Persistent Personal Food Model (Mô hình ẩm thực cá nhân bền vững):**  
   Khác với các chatbot khởi tạo lại ngữ cảnh từ con số 0 trong mỗi phiên trò chuyện, EatVibing lưu trữ trạng thái sở hữu nguyên liệu, lịch sử nấu, khẩu vị chi tiết và các phản hồi sau bữa ăn vào một hồ sơ học tập liên tục.
2. **Kiến trúc Tách biệt Trách nhiệm (LLM Reasoning vs. Deterministic Trust Layer):**  
   LLM đóng vai trò tương tác tự nhiên, thấu hiểu ngữ cảnh và sáng tạo gợi ý, trong khi toàn bộ việc tính toán dinh dưỡng, quy đổi đơn vị, trừ kho thực phẩm và kiểm soát an toàn do dịch vụ toán học và chính sách xác định (*Deterministic Services*) chịu trách nhiệm.
3. **Qualified Engagement Ranking cho Trending Guideline:**  
   Các món ăn xu hướng cộng đồng (*Trending*) không được xếp hạng bằng lượt click ảo, mà dựa trên điểm số tương tác chất lượng (*Qualified Engagement Score*: Nấu thực tế, nấu lại, đánh giá cao, tỷ lệ bỏ qua thấp). Quan trọng nhất, **Trending không bao giờ được phép vượt qua các ràng buộc dị ứng và an toàn của cá nhân**.

### 2.2. Bảng so sánh với các giải pháp hiện hữu (Gap Analysis)

| Tiêu chí so sánh | Ứng dụng Recipe truyền thống (Cookpad, Tasty) | Ứng dụng Calorie/Macro (MyFitnessPal, YAZIO) | Chatbot AI chung (ChatGPT, Claude) | **EatVibing (Personalized AI Food Coach)** |
| :--- | :--- | :--- | :--- | :--- |
| **Nhận diện nguyên liệu tủ lạnh** | Thủ công theo từ khóa | Không hỗ trợ | Nhập text tự do | **Smart Pantry (Text/Voice, tự động trừ kho)** |
| **Cá nhân hóa thực đơn** | Tĩnh, danh mục cố định | Thực đơn mẫu khô khan | Sinh text mỗi lần mỗi khác | **Personalized Meal Guideline thích ứng** |
| **Độ chính xác dữ liệu dinh dưỡng** | Thường không có | Database chuẩn nhưng nhập khó | Dễ bịa đặt số calo (Ảo giác) | **Deterministic Calculation + USDA Grounding** |
| **Kiểm soát An toàn & Dị ứng** | Người dùng tự đọc | Cảnh báo cơ bản | Không có lớp chặn bắt buộc | **Culinary Trust Layer (SAFE / REVIEW / BLOCK)** |
| **Học từ hành vi thực tế** | Chỉ ghi nhận lượt xem | Không học thói quen nấu | Không có trạng thái lưu bền vững | **Học từ hành động: Pick, Cook, Repeat, Swap, Waste** |
| **Hỗ trợ nấu ăn rảnh tay** | Text từng bước | Không có | Phải bấm điện thoại đọc | **Voice-assisted Guided Cooking** |

---

## CHƯƠNG 3: KIẾN TRÚC HỆ THỐNG VÀ NGUYÊN TẮC CÔNG NGHỆ

### 3.1. Mô hình Phân tầng Kiến trúc (System Architecture)

Hệ thống được thiết kế theo kiến trúc 3 tầng phân tách độc lập (*3-Tier Decoupled Architecture*), tích hợp các dịch vụ thông minh:

```
┌────────────────────────────────────────────────────────────────────────┐
│             PRESENTATION LAYER (Web/PWA - React 19 / Mobile Roadmap)   │
│  - Onboarding Profile   - Smart Pantry UI   - Personalized Guideline   │
│  - AI Coach Chat/Voice  - Recipe Discovery  - Guided Cooking Timeline  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS / RESTful API / WebSocket
┌──────────────────────────────────▼─────────────────────────────────────┐
│                    APPLICATION & BUSINESS LOGIC LAYER                  │
│  ┌─────────────────────────┐           ┌────────────────────────────┐  │
│  │   EatVibing AI Coach    │           │    Culinary Trust Layer    │  │
│  │  - Context Understanding│           │  - Deterministic Nutrition │  │
│  │  - Prompt Orchestrator  │           │  - Allergen Hard Filter    │  │
│  │  - Voice/NLP Adapter    │           │  - SAFE/REVIEW/BLOCK Engine│  │
│  │  - Explain-Why Generator│           │  - Pantry Diff Calculator  │  │
│  └────────────┬────────────┘           └─────────────▲──────────────┘  │
│               │ OpenAI Protocol                      │                 │
│               ▼                                      │                 │
│  ┌─────────────────────────┐                         │                 │
│  │  LLM Engine (LLM7/OAI)  │─────────────────────────┘                 │
│  └─────────────────────────┘                                           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ SQL / Row Level Security (RLS)
┌──────────────────────────────────▼─────────────────────────────────────┐
│                 PERSISTENCE & DATA LAYER (Supabase PostgreSQL)         │
│  - User Profiles (Context)   - Smart Pantry Inventory - Meals & Recipes │
│  - Interaction Learning Logs - Saved Meal Passports   - Audit Messages │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Phân định rõ ràng: AI Coach vs. Deterministic Tool

| Thành phần | Công nghệ đảm nhiệm | Phạm vi trách nhiệm (Scope of Responsibility) |
| :--- | :--- | :--- |
| **EatVibing AI Coach** | LLM Engine + System Prompt Framework + Voice NLP | - Tiếp nhận hội thoại tự nhiên, hiểu ý định người dùng (Intent recognition).<br>- Trích xuất danh sách nguyên liệu từ câu nói tự nhiên.<br>- Sáng tạo và đề xuất danh sách ứng viên món ăn (*Candidate generation*).<br>- Tạo lời giải thích minh bạch: *"Tại sao món này được đề xuất?" (Explain-Why)*.<br>- Điều chỉnh công thức linh hoạt theo yêu cầu thay thế nguyên liệu. |
| **Deterministic Services (Policy & Tools)** | Backend TypeScript/Node.js + Supabase SQL | - Tính toán chỉ số BMI ngữ cảnh từ chiều cao/cân nặng.<br>- Tính toán chính xác Calo, Protein, Carb, Fat theo trọng lượng nguyên liệu.<br>- Quy đổi đơn vị đo lường (gram, ml, muỗng, quả).<br>- Khấu trừ tự động nguyên liệu trong *Smart Pantry* sau khi nấu.<br>- **Thực thi bộ lọc dị ứng và cấp nhãn Trust Status (SAFE / REVIEW / BLOCK)**. |

---

## CHƯƠNG 4: MÔ TẢ CHI TIẾT CÁC PHÂN HỆ CHỨC NĂNG

### 4.1. Hồ sơ cá nhân hóa ban đầu (Lightweight Onboarding Profile)
- **Mục đích:** Thu thập dữ liệu nền tảng ngay khi tạo tài khoản để AI Coach có căn cứ tạo gợi ý cá nhân hóa ngay từ phiên đầu tiên mà không làm người dùng nản lòng vì khảo sát quá dài.
- **Cấu trúc dữ liệu thu thập:**
  1. *Chỉ số thể trạng cơ bản (Contextual Body Metrics):* Tuổi/Nhóm tuổi, Giới tính (tự nguyện), Chiều cao, Cân nặng, Hệ thống tự động tính chỉ số BMI như một **chỉ báo ngữ cảnh (Contextual Indicator)**, Mức độ vận động (*Sedentary, Moderate, Active*). *(Lưu ý: Không dùng BMI làm chẩn đoán y tế)*.
  2. *Mục tiêu ăn uống (Eating Goals):* Ăn uống cân bằng, Quản lý cân nặng, Tăng cường Protein thể hình, Tiết kiệm chi phí sinh hoạt, Giảm rác thải thực phẩm, Nấu ăn nhanh gọn < 20 phút, Meal prep cho cả tuần, Chế độ Vegetarian/Vegan.
  3. *Hồ sơ khẩu vị (Taste Profile):* Trường phái ẩm thực yêu thích (Việt, Á, Âu, Địa Trung Hải), Mức độ ăn cay (0–5), Thói quen ăn mặn/ngọt, Thực phẩm không thích (*Disliked foods*), Kỹ năng nấu bếp (Mới bắt đầu, Trung bình, Nâng cao).
  4. *Ràng buộc cứng (Hard Constraints):* Danh sách dị ứng thực phẩm (*Peanuts, Seafood, Dairy, Gluten...*), Kiêng khem tôn giáo, Thiết bị bếp sẵn có (Nồi chiên không dầu, Lò nướng, Bếp từ), Thời gian nấu tối đa cho phép, Số khẩu phần ăn mặc định (*Servings*).
- **Quyền riêng tư:** Người dùng toàn quyền chỉnh sửa, cài đặt lại (Reset), xuất dữ liệu (Export), xóa hồ sơ (Delete) hoặc bật/tắt chế độ học tập cá nhân hóa (*Opt-out Personalization Learning*).

### 4.2. Trợ lý AI Ăn uống Cá nhân hóa (EatVibing AI Coach)
- **Mục đích:** Đóng vai trò chuyên gia tư vấn dinh dưỡng và đầu bếp riêng xuyên suốt hành trình ẩm thực.
- **Khả năng tương tác:**
  - **Đa phương thức (Text & Voice):** Người dùng có thể gõ phím hoặc bấm mic nói tự nhiên: *"Tối nay tôi đi làm về muộn, trong tủ còn ức gà và nấm, hãy gợi ý món nấu dưới 20 phút."*
  - **Tính năng Explain-Why (Minh bạch lý do):** AI Coach luôn hiển thị rõ: (1) Món này giúp tận dụng nguyên liệu nào sắp hết hạn trong tủ; (2) Món này phù hợp với mục tiêu tăng đạm ra sao; (3) Món này đã loại bỏ hoàn toàn các gia vị gây dị ứng của bạn.
  - **Lắng nghe và Thích ứng:** Ghi nhận mọi phản hồi: *"Món này ngon nhưng hơi cay"*, *"Lần sau bớt ngọt lại"* để điều chỉnh các đề xuất trong tương lai.

### 4.3. Không gian gợi ý thực đơn thích ứng (Personalized Meal Guideline)
- **Mục đích:** Cung cấp không gian gợi ý linh hoạt, chia theo các bữa trong ngày (Sáng, Trưa, Tối, Bữa phụ/Snack).
- **Cơ chế hoạt động:**
  - Đây không phải một thực đơn ép buộc cứng nhắc (*Rigid Diet Plan*), mà là tập hợp các gợi ý tối ưu được AI Coach sàng lọc dựa trên: *Profile + Smart Pantry + Thời gian rảnh + Ngân sách + Điểm ưu tiên chống lãng phí*.
  - Người dùng bấm chọn món (*Pick*) để chuyển sang chế độ nấu hoặc thêm vào kế hoạch tuần.
  - **Học sâu từ hành vi thực tế:** Mỗi tương tác *View, Save, Pick, Cook, Skip, Repeat-cook, Rate, Swap, Leftover* đều cập nhật trọng số vào mô hình sở thích cá nhân.

### 4.4. Khám phá Món thịnh hành có kiểm duyệt (Trending / Community Guideline)
- **Mục đích:** Giúp người dùng khám phá các món ăn được cộng đồng yêu thích nhất theo Tuần, Tháng, Năm.
- **Nguyên tắc xếp hạng Qualified Engagement Score:**
  $$\text{Score} = w_1 \cdot \text{Cooked} + w_2 \cdot \text{RepeatCook} + w_3 \cdot \text{Rating} + w_4 \cdot \text{Save} - w_5 \cdot \text{SkipRate}$$
  *(Lượt click/view chỉ là tín hiệu phụ; trọng số chính nằm ở hành vi nấu thực tế và sự hài lòng).*
- **Nguyên tắc an toàn tối thượng:**
  - Mọi món trending phải vượt qua kiểm duyệt xuất xứ (*Provenance & Moderation*) và đạt chuẩn **SAFE** từ *Culinary Trust Layer*.
  - **Trending KHÔNG BAO GIỜ được phép vượt qua Hard Constraints của người dùng.** Nếu một món cực kỳ viral nhưng chứa đậu phộng, hệ thống sẽ tự động gán nhãn **BLOCK** và ẩn khỏi Guideline của người dùng bị dị ứng đậu phộng.
  - Áp dụng thuật toán Đa dạng hóa (*Diversity Mechanism*) ngăn chặn việc thực đơn chỉ toàn một loại ẩm thực viral.

### 4.5. Lớp ủy thác ẩm thực (Culinary Trust Layer)
- **Mục đích:** Bảo vệ người dùng khỏi ảo giác của AI và các rủi ro sức khỏe với 3 trạng thái kiểm định rõ ràng:
  - 🟢 **SAFE:** Các hard gates đạt trong phạm vi dữ liệu đã biết; phép tính calo/macro có bản ghi nguồn; không phát hiện xung đột dị ứng theo policy hiện hành. SAFE không phải chứng nhận y khoa hay bảo đảm tuyệt đối.
  - 🟡 **REVIEW:** Công thức từ nguồn cộng đồng thiếu định lượng chi tiết hoặc chứa nguyên liệu cần người dùng xác nhận lại khẩu phần/đơn vị đo.
  - 🔴 **BLOCK:** Phát hiện chất gây dị ứng đã khai báo trong hồ sơ, nguyên liệu kỵ nhau hoặc không đảm bảo an toàn vệ sinh thực phẩm. Món ăn bị chặn lập tức khỏi thực đơn gợi ý.

### 4.6. Quản lý kho nguyên liệu thông minh (Smart Pantry)
- **Mục đích:** Theo dõi tồn kho thực phẩm thực tế trong gian bếp gia đình.
- **Tính năng:**
  - Nhập liệu bằng Text, Voice hoặc Quét hóa đơn/Barcode (Roadmap).
  - Gắn nhãn hạn sử dụng và tự động phát cảnh báo nguyên liệu sắp hỏng (*Near-expiry Alerts*).
  - Tự động trừ tồn kho (*Pantry Auto-subtraction*) sau khi người dùng xác nhận đã hoàn thành nấu món ăn.

### 4.7. Hướng dẫn nấu ăn rảnh tay từng bước (Voice-Assisted Guided Cooking)
- **Mục đích:** Hỗ trợ người nấu tập trung tối đa trong bếp mà không phải chạm tay ướt/bẩn vào màn hình điện thoại.
- **Tính năng:**
  - Hiển thị Timeline các bước nấu kèm định lượng thành phần rõ ràng.
  - Nhận diện giọng nói điều khiển: *"Next step"* (Bước tiếp theo), *"Set timer 10 minutes"* (Hẹn giờ 10 phút), *"Repeat instruction"* (Đọc lại hướng dẫn bước này).
  - Nếu độ tin cậy nhận diện giọng nói thấp (*Low Confidence*) ở các thông tin nhạy cảm (số lượng gia vị cay, thời gian tắt bếp), hệ thống sẽ phát âm thanh yêu cầu người dùng xác nhận lại.

### 4.8. Tạo danh sách mua sắm thông minh (Smart Shopping List & Diff Engine)
- **Mục đích:** Giúp việc đi chợ nhanh chóng và tiết kiệm tối đa chi phí.
- **Cơ chế Diff Engine:**
  $$\text{Danh sách cần mua} = \text{Tổng nguyên liệu công thức cần} - \text{Nguyên liệu sẵn có trong Smart Pantry}$$
  *(Hệ thống tự động gộp định lượng nguyên liệu cùng loại và phân chia theo từng quầy siêu thị).*

### 4.9. Hộ chiếu món ăn & Bộ sưu tập (Meal Passport & Recipe Gallery)
- **Mục đích:** Ghi nhận hành trình ẩm thực của người dùng dưới dạng một "hộ chiếu" dinh dưỡng sinh động.
- **Tính năng:** Lưu trữ các món đã nấu thành công, huy hiệu thành tích ẩm thực (VD: *Master Chef món Việt, 7 ngày ăn sạch liên tiếp*), và lưu lại các biến tấu gia vị riêng của người dùng.

### 4.10. Bảng điều khiển Quản trị viên (Admin Dashboard & Content Management)
- **Mục đích:** Cho phép ban quản trị duyệt công thức, kiểm duyệt bài đăng cộng đồng và quản lý kho dữ liệu dinh dưỡng gốc.
- **Tính năng:** Thêm/Sửa/Xóa món ăn, kiểm tra độ tin cậy của công thức, phân quyền truy cập và giám sát các chỉ số an toàn hệ thống.

---

## CHƯƠNG 5: MÔ HÌNH DỮ LIỆU VÀ CƠ SỞ DỮ LIỆU QUAN HỆ

Hệ thống sử dụng cơ sở dữ liệu **Supabase PostgreSQL** với chính sách bảo mật cấp hàng (*Row Level Security - RLS*).

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────────┐
│  user_profiles  │ 1   * │  smart_pantry   │       │     interactions     │
│─────────────────│───────│─────────────────│       │──────────────────────│
│ id (UUID, PK)   │       │ id (BIGINT, PK) │       │ id (BIGINT, PK)      │
│ body_metrics    │       │ user_id (FK)    │       │ user_id (FK)         │
│ eating_goals    │       │ ingredient_name │       │ meal_id (FK)         │
│ taste_profile   │       │ quantity / unit │       │ event_type (ENUM)    │
│ constraints     │       │ expiry_date     │       │ context_snapshot     │
└────────┬────────┘       └─────────────────┘       └──────────────────────┘
         │ 1
         │ *
┌────────▼────────┐ 1   * ┌─────────────────┐ 1   * ┌──────────────────────┐
│    messages     │       │      meals      │       │     ingredients      │
│─────────────────│       │─────────────────│───────│──────────────────────│
│ id (UUID, PK)   │       │ id (BIGINT, PK) │       │ id (BIGINT, PK)      │
│ user_id (FK)    │       │ name / origin   │       │ meal_id (FK)         │
│ role / content  │       │ category        │       │ name / amount / unit │
│ created_at      │       │ trust_status    │       └──────────────────────┘
└─────────────────┘       │ qualified_score │ 1   * ┌──────────────────────┐
                          │ is_trending     │───────│       recipes        │
                          └─────────────────┘       │──────────────────────│
                                                    │ id (BIGINT, PK)      │
                                                    │ meal_id (FK)         │
                                                    │ step_number, content │
                                                    └──────────────────────┘
```

### Chi tiết các thực thể dữ liệu chính:
1. **`user_profiles`:** Lưu trữ thông tin cá nhân hóa (*height, weight, calculated_bmi, activity_level, taste_preferences, allergen_hard_constraints, opt_out_learning*).
2. **`smart_pantry`:** Danh mục nguyên liệu trong tủ lạnh (*user_id, ingredient_name, quantity, unit, expiry_date, is_near_expiry*).
3. **`meals`:** Món ăn hệ thống (*id, name, origin, category, trust_status ['SAFE','REVIEW','BLOCK'], qualified_score, is_trending*).
4. **`ingredients` & `recipes`:** Cấu trúc 1-N lưu trữ định lượng nguyên liệu chi tiết và các bước nấu có đánh số thứ tự.
5. **`interactions` (Learning Log):** Lưu trữ sự kiện học tập (*user_id, meal_id, event_type ['IMPRESSION','CLICK','PICK','COOK','REPEAT','SKIP','RATE','SWAP','WASTE'], feedback_notes*).
6. **`messages`:** Lịch sử hội thoại trò chuyện cùng EatVibing AI Coach.

---

## CHƯƠNG 6: BẢO VỆ DỮ LIỆU CÁ NHÂN, ĐẠO ĐỨC AI & AN TOÀN SỨC KHỎE

1. **Nguyên tắc phi y tế hóa (Non-Medical Disclaimer):**  
   EatVibing được định vị là công cụ hỗ trợ lối sống ẩm thực và gợi ý bữa ăn lành mạnh. **Hệ thống tuyệt đối không đưa ra chẩn đoán y khoa, không chỉ định thực đơn điều trị bệnh lý (Medical Nutrition Therapy)** và không dùng chỉ số BMI đơn lẻ để đánh giá sức khỏe toàn diện.
2. **Thu thập tối thiểu và Đồng thuận rõ ràng (Explicit Consent & Data Minimization):**  
   Mọi dữ liệu thể trạng và thói quen chỉ được thu thập khi có sự đồng ý của người dùng. Dữ liệu nhạy cảm được mã hóa và không chia sẻ cho bên thứ ba.
3. **Quyền làm chủ dữ liệu của người dùng (User Data Sovereignty):**  
   Cung cấp tính năng tải về toàn bộ dữ liệu cá nhân (*Export*), xóa vĩnh viễn tài khoản (*Delete/Right to be forgotten*) và tùy chọn tắt chức năng theo dõi thói quen (*Opt-out Personalization*).

---

## CHƯƠNG 7: CHIẾN LƯỢC KINH DOANH SẢN PHẨM SỐ (DIGITAL SAAS BUSINESS MODEL)

EatVibing áp dụng mô hình kinh doanh **Freemium SaaS** với các gói dịch vụ linh hoạt, đáp ứng từ cá nhân đến hộ gia đình và đối tác doanh nghiệp:

| Gói dịch vụ | Mức giá tham chiếu | Giá trị cốt lõi cung cấp | Đối tượng mục tiêu |
| :--- | :---: | :--- | :--- |
| **Free Tier** | **$0** | - Quản lý Smart Pantry cơ bản (tối đa 20 mục).<br>- EatVibing AI Coach cơ bản (Text chat).<br>- Gợi ý thực đơn giới hạn 3 ngày.<br>- Kiểm định an toàn ẩm thực cơ bản (*Culinary Trust Status*). | Người dùng mới muốn trải nghiệm vòng lặp cốt lõi trước khi trả phí. |
| **Plus** | **$4.99 / tháng** | - **Lập kế hoạch bữa ăn cá nhân hóa với AI Coach**.<br>- Lưu trữ lịch sử pantry & thực đơn không giới hạn.<br>- Personalized Meal Guideline trọn vẹn theo tuần.<br>- Cảnh báo thực phẩm gần hết hạn & Thông kê chống lãng phí (*Waste Insights*).<br>- Hỗ trợ điều khiển bằng giọng nói cơ bản (*Voice Support*). | Cá nhân bận rộn muốn tối ưu hóa thời gian đi chợ và nấu ăn hàng ngày. |
| **Pro** | **$9.99 / tháng** | - **AI Coach cá nhân hóa nâng cao dựa trên profile và hành vi thực tế**.<br>- Phân tích chỉ số dinh dưỡng chuyên sâu.<br>- Hạn ngạch nhận diện Voice & Vision cao cấp.<br>- Guideline thích ứng liên tục theo thói quen nấu.<br>- Hồ sơ Meal Passport chi tiết và mục tiêu thể hình nâng cao. | Người theo đuổi chế độ ăn chuyên sâu (Eat Clean, Gym/Fitness, Keto). |
| **Family** | **$14.99 / tháng** | - **Nhiều hồ sơ AI cá nhân hóa trong cùng một hộ gia đình (Household)**.<br>- Dùng chung Smart Pantry, Meal Plan và Smart Shopping List.<br>- Phân quyền thành viên gia đình và Báo cáo dinh dưỡng tổng thể tổ ấm. | Hộ gia đình có nhiều thành viên với khẩu vị và nhu cầu ăn uống khác nhau. |
| **Creator** | **Freemium / RevShare** | - Bộ công cụ CMS sáng tạo công thức chuẩn quốc tế.<br>- Xác thực bản quyền công thức (*Provenance*).<br>- Chia sẻ doanh thu từ lượt nấu của cộng đồng. | Đầu bếp chuyên nghiệp, Food Blogger, Chuyên gia ẩm thực. |
| **Business / API** | **Theo hợp đồng B2B** | - API tích hợp hệ thống siêu thị online (WinMart, GrabMart...).<br>- White-label solution cho chuỗi căn hộ, trường học, trung tâm thể hình.<br>- Bảng điều khiển chiến dịch & SLA/SSO chuyên biệt. | Doanh nghiệp bán lẻ thực phẩm, Chuỗi phòng gym, Tập đoàn chăm sóc sức khỏe. |

---

## CHƯƠNG 8: KỊCH BẢN TRÌNH DIỄN SẢN PHẨM (3-MINUTE DEMO SCENARIO)

- **0:00 – 0:25 (Onboarding & Profile Setup):**  
  Người dùng thiết lập nhanh: Dị ứng đậu phộng (*Peanut allergy*), mục tiêu tăng đạm (*High-protein*), thời gian nấu < 30 phút. Hệ thống tạo hồ sơ cá nhân hóa và thiết lập bộ lọc an toàn.
- **0:25 – 0:45 (Voice Interaction với EatVibing AI Coach):**  
  Người dùng bấm nút Voice nói: *"Tối nay tôi có trứng, cà chua và ít cơm nguội, muốn nấu món gì nhanh dưới 30 phút."* AI Coach phân tích giọng nói, trích xuất nguyên liệu và đối chiếu kho Smart Pantry.
- **0:45 – 1:10 (Sinh Personalized Guideline & Explain-Why):**  
  AI Coach sinh danh sách 3 ứng viên món ăn, kèm bảng minh bạch giải thích: Món nào tận dụng được cơm nguội, hàm lượng protein đạt chuẩn bao nhiêu gam.
- **1:10 – 1:35 (Trực quan hóa Culinary Trust Layer):**  
  Hệ thống phát hiện một món trending cộng đồng có nước sốt chứa đậu phộng ➔ Gán nhãn **BLOCK** (Chặn hiển thị). Một món thiếu dữ liệu nguồn ➔ Gán nhãn **REVIEW**. Món *Cơm rang trứng cà chua kiểu Pháp* đạt chuẩn ➔ Gán nhãn **SAFE**.
- **1:35 – 2:00 (Pick món & Tạo Shopping List Diff):**  
  Người dùng bấm *Pick* món SAFE. Hệ thống tự động kiểm tra kho: Đã có trứng, cà chua, cơm; chỉ thiếu hành lá ➔ Shopping List chỉ hiển thị mua duy nhất 1 bó hành lá.
- **2:00 – 2:30 (Voice-Assisted Guided Cooking):**  
  Chuyển sang màn hình nấu. Người dùng nấu rảnh tay, ra lệnh giọng nói: *"Next step"* để chuyển bước nấu và *"Set timer 5 minutes"* để canh giờ xào cà chua.
- **2:30 – 3:00 (Hoàn thành, Đánh giá & Cập nhật Vòng lặp học tập):**  
  Người dùng ấn *"Đã nấu thành công"*, chấm 5 sao kèm nhận xét: *"Rất ngon nhưng lần sau cho ít tiêu hơn"*. AI Coach phản hồi: *"Đã ghi nhận, tôi sẽ giảm độ cay trong các thực đơn tiếp theo của bạn."* ➔ Hoàn tất vòng lặp Pantry → Plan → Trust → Cook → Learn.

---

## CHƯƠNG 9: LỘ TRÌNH PHÁT TRIỂN DỰ ÁN (PROJECT ROADMAP)

```
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│     GIAI ĐOẠN 1 (MVP)     │      │   GIAI ĐOẠN 2 (TIẾP THEO) │      │   GIAI ĐOẠN 3 (MỞ RỘNG)   │
│       CORE EXPERIENCE     │      │   ADAPTIVE EXPERIENCE     │      │     EXPANSION & SCALE     │
├───────────────────────────┤      ├───────────────────────────┤      ├───────────────────────────┤
│ • Onboarding Profile      │ ───► │ • Advanced Voice NLP      │ ───► │ • Native Mobile App       │
│ • Smart Pantry cơ bản     │      │ • Computer Vision (Quét)  │      │ • Creator / Community CMS │
│ • EatVibing AI Coach Text │      │ • Long-term Adaptive Model│      │ • B2B Grocery API         │
│ • Culinary Trust Layer    │      │ • Waste Analytics Engine  │      │ • Voice Cooking Assistant │
│ • Personalized Guideline  │      │ • Gói thuê bao Family     │      │ • Marketplace Integration │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

1. **Giai đoạn 1 (Core MVP Prototype - Đang triển khai):**
   - Hoàn thiện Web/PWA, Profile khảo sát ban đầu, Quản lý Smart Pantry, Chatbot EatVibing AI Coach, Lớp ủy thác Culinary Trust Layer (SAFE/REVIEW/BLOCK), và Trình tạo danh sách mua sắm bù trừ.
2. **Giai đoạn 2 (Enhanced Interaction & Intelligence - Quý 3/2026):**
   - Tích hợp Voice Interaction hai chiều, Nâng cấp Thị giác máy tính (Quét ảnh ngăn tủ lạnh và hóa đơn mua hàng), Hoàn thiện thuật toán học tập hành vi thích ứng dài hạn, Triển khai gói thuê bao Family.
3. **Giai đoạn 3 (Ecosystem & Multi-platform Expansion - Quý 4/2026 - 2027):**
   - Đóng gói ứng dụng di động Native Mobile App (React Native), Mở rộng cổng Creator/B2B, Tích hợp API đặt hàng trực tiếp qua các hệ thống siêu thị đối tác.

---

## KẾT LUẬN

Dự án **EatVibing** không chỉ dừng lại ở một ý tưởng công nghệ tiềm năng mà đã được hiện thực hóa với kiến trúc kỹ thuật vững chắc, giải quyết đồng thời bài toán kinh tế gia đình và sức khỏe cộng đồng. Bằng việc kết hợp hài hòa giữa **sự sáng tạo của Trí tuệ Nhân tạo (AI Coach)** và **tính kỷ luật, chính xác của Lớp ủy thác ẩm thực (Culinary Trust Layer)**, EatVibing tự tin khẳng định vị thế tiên phong trong làn sóng chuyển đổi số ngành FoodTech tại cuộc thi **AISC 2026**.

---

## 📝 CHANGELOG CẬP NHẬT TÀI LIỆU (SAU HỌP NHÓM)

| Hạng mục | Chi tiết cập nhật | Ghi chú & Rationale |
| :--- | :--- | :--- |
| **Đổi định vị & Tên gọi (Terminology)** | Đổi từ `AI Culinary Assistant` thành **EatVibing AI Coach** (*Personalized AI Food Coach*). | Thể hiện đúng vai trò đồng hành xuyên suốt hành trình ăn uống, không chỉ là bot trả lời công thức. |
| **Cập nhật Vòng lặp cốt lõi** | Chuẩn hóa quy trình: **Pantry → Plan → Trust → Cook → Learn**. | Tạo sự liền mạch từ nguyên liệu sẵn có đến hành động nấu và học từ kết quả thực tế. |
| **Bổ sung Onboarding Profile** | Thêm cấu trúc khảo sát: Body Metrics (BMI ngữ cảnh), Eating Goals, Taste Profile, Allergen Hard Constraints. | Cung cấp dữ liệu để AI Coach cá nhân hóa ngay từ phiên đầu tiên (không dùng BMI để chẩn đoán y tế). |
| **Nâng cấp Personalized Guideline** | Bổ sung không gian gợi ý thích ứng theo ngày/tuần, tính năng *Explain-Why*, học từ *Pick/Cook/Repeat/Waste*. | Giảm quyết định mệt mỏi (*Decision Fatigue*), học từ hành vi thực tế thay vì chỉ đếm click. |
| **Chuẩn hóa Trending Guideline** | Xếp hạng bằng *Qualified Engagement Score*; bắt buộc qua Trust Layer; **Trending không được vượt qua Allergen Constraint**. | Ngăn chặn rủi ro dị ứng và thiên vị món viral thiếu an toàn. |
| **Bổ sung Voice Interaction Layer** | Hỗ trợ điều khiển giọng nói khi nấu ăn rảnh tay và nhập pantry; thêm cơ chế xác nhận lại khi confidence thấp. | Giữ nguyên nguyên tắc: Voice chỉ là giao diện tương tác, không thay thế Trust Layer. |
| **Định vị Nền tảng & Thiết bị** | Web/PWA mobile-first là bề mặt trải nghiệm chính; Native Mobile App là hướng mở rộng khi cần tích hợp sâu Voice/Vision và thiết bị. | Giữ một lõi AI–tool–Trust thống nhất trên nhiều bề mặt sản phẩm. |
| **Cập nhật Bảng giá SaaS (Pricing)** | Cập nhật 6 gói: Free ($0), Plus ($4.99), Pro ($9.99), Family ($14.99), Creator, Business/API. | Khắc họa rõ giá trị gia tăng của AI Coach, Shared Family Pantry và Voice/Vision Quota. |
| **Kịch bản Demo 3 phút** | Xây dựng kịch bản 3 phút thể hiện trọn vẹn: Voice ➔ Smart Pantry ➔ Trust Layer (Block dị ứng) ➔ Guided Cooking ➔ Learning Update. | Phục vụ trực tiếp cho buổi thuyết trình và pitching tại AISC 2026. |
