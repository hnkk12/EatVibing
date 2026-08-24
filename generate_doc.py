# -*- coding: utf-8 -*-
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_styled_heading(doc, text, level):
    h = doc.add_heading(text, level=level)
    h.paragraph_format.keep_with_next = True
    h.paragraph_format.space_before = Pt(14 if level==1 else (10 if level==2 else 6))
    h.paragraph_format.space_after = Pt(4)
    run = h.runs[0]
    if level == 1:
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = RGBColor(26, 46, 26) # Dark Forest Green
    elif level == 2:
        run.font.size = Pt(13.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(40, 80, 40)
    elif level == 3:
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.color.rgb = RGBColor(60, 60, 60)
    return h

def add_callout(doc, title, text, bg_hex="F4F6F0", border_hex="4D5D1C"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Left border styling
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_hex}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    r_title = p.add_run(f"📌 {title}\n")
    r_title.bold = True
    r_title.font.size = Pt(11)
    r_title.font.color.rgb = RGBColor(40, 70, 30)
    
    r_text = p.add_run(text)
    r_text.font.size = Pt(10.5)
    r_text.font.color.rgb = RGBColor(50, 50, 50)
    
    # Spacing after callout table
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def create_table(doc, headers, data, col_widths=None):
    table = doc.add_table(rows=len(data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    # Header Row
    hdr_cells = table.rows[0].cells
    for i, header_text in enumerate(headers):
        hdr_cells[i].text = header_text
        set_cell_background(hdr_cells[i], "2D3748") # Dark Slate
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=150, right=150)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.bold = True
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(255, 255, 255)
            
    # Data Rows
    for row_idx, row_data in enumerate(data):
        row_cells = table.rows[row_idx + 1].cells
        bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            row_cells[col_idx].text = str(cell_value)
            set_cell_background(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx], top=100, bottom=100, left=150, right=150)
            p = row_cells[col_idx].paragraphs[0]
            for run in p.runs:
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(51, 51, 51)
                
    # Apply widths if provided
    if col_widths:
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Inches(w)
                
    # Table border
    tblPr = table._tbl.tblPr
    tblBorders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:left w:val="none"/>
            <w:bottom w:val="single" w:sz="8" w:space="0" w:color="94A3B8"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(tblBorders)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    return table

def build_document():
    doc = docx.Document()
    
    # Page setup - Margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
    # Styles setup
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Arial'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(34, 34, 34)
    normal_style.paragraph_format.line_spacing = 1.2
    normal_style.paragraph_format.space_after = Pt(6)

    # ----------------------------------------------------
    # BÌA / COVER PAGE
    # ----------------------------------------------------
    p_org = doc.add_paragraph()
    p_org.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_org = p_org.add_run("BÁO CÁO THUYẾT MINH ĐỀ TÀI NGHIÊN CỨU KHOA HỌC / DỰ ÁN CÔNG NGHỆ\n")
    r_org.bold = True
    r_org.font.size = Pt(12)
    r_org.font.color.rgb = RGBColor(100, 116, 139)
    
    doc.add_paragraph().paragraph_format.space_before = Pt(30)
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("EATVIBING\n")
    r_title.bold = True
    r_title.font.size = Pt(28)
    r_title.font.color.rgb = RGBColor(45, 80, 22)
    
    r_subtitle = p_title.add_run("HỆ THỐNG TRỢ LÝ ẨM THỰC THÔNG MINH CÁ NHÂN HÓA\nVÀ LẬP THỰC ĐƠN DINH DƯỠNG TỰ ĐỘNG ỨNG DỤNG TRÍ TUỆ NHÂN TẠO (AI)\n")
    r_subtitle.bold = True
    r_subtitle.font.size = Pt(15)
    r_subtitle.font.color.rgb = RGBColor(30, 41, 59)
    
    r_en = p_title.add_run("(Smart Personalized Culinary & AI Meal Planning Platform)\n")
    r_en.italic = True
    r_en.font.size = Pt(11)
    r_en.font.color.rgb = RGBColor(100, 116, 139)
    
    doc.add_paragraph().paragraph_format.space_before = Pt(40)
    
    add_callout(doc, "TÓM TẮT DỰ ÁN (EXECUTIVE SUMMARY)", 
        "EatVibing là nền tảng công nghệ ẩm thực thế hệ mới tích hợp Trí tuệ nhân tạo (LLM), được phát triển nhằm giải quyết triệt để vấn đề muôn thuở 'Hôm nay ăn gì?', tình trạng lãng phí thực phẩm dư thừa trong tủ lạnh và nhu cầu thiết kế chế độ ăn dinh dưỡng chuyên biệt (Giảm cân, Tăng cơ, Cân bằng). Dự án kết hợp kiến trúc Web fullstack hiện đại (React 19, Node.js Express, Supabase) cùng mô hình AI Chef chuyên sâu có khả năng tư vấn công thức nấu nướng chuẩn quốc tế và quản lý khẩu phần ăn khoa học.",
        bg_hex="F0FDF4", border_hex="16A34A")
        
    doc.add_page_break()

    # ----------------------------------------------------
    # CHƯƠNG 1: TỔNG QUAN VÀ TÍNH CẤP THIẾT CỦA ĐỀ TÀI
    # ----------------------------------------------------
    add_styled_heading(doc, "CHƯƠNG 1: TỔNG QUAN VÀ TÍNH CẤP THIẾT CỦA ĐỀ TÀI", level=1)
    
    add_styled_heading(doc, "1.1. Bối cảnh thực tiễn và Lý do chọn đề tài", level=2)
    doc.add_paragraph(
        "Trong nhịp sống hiện đại bận rộn, việc duy trì một chế độ ăn uống lành mạnh, đầy đủ dinh dưỡng và ngon miệng đang trở thành thách thức lớn đối với hàng triệu người. Khảo sát thực tế chỉ ra 3 'điểm nghẽn' (pain points) phổ biến nhất của người nội trợ và giới trẻ hiện nay:"
    )
    
    p = doc.add_paragraph(style='List Bullet')
    r = p.add_run("Nghịch lý lựa chọn ('Hôm nay ăn gì?'): ")
    r.bold = True
    p.add_run("Người dùng mất từ 15 - 30 phút mỗi ngày chỉ để suy nghĩ thực đơn, gây ra tình trạng mệt mỏi quyết định (decision fatigue) và thường xuyên rơi vào thói quen gọi đồ ăn nhanh thiếu lành mạnh.")
    
    p = doc.add_paragraph(style='List Bullet')
    r = p.add_run("Lãng phí thực phẩm trong tủ lạnh (Food Waste): ")
    r.bold = True
    p.add_run("Rất nhiều nguyên liệu thừa sau mỗi bữa ăn bị lãng quên và hư hỏng vì người nấu không biết cách kết hợp các nguyên liệu ngẫu nhiên sẵn có thành một món ăn hoàn chỉnh.")
    
    p = doc.add_paragraph(style='List Bullet')
    r = p.add_run("Thiếu công cụ dinh dưỡng cá nhân hóa: ")
    r.bold = True
    p.add_run("Các chế độ ăn kiêng (Weight Loss - Ít carb/giàu xơ, Bulking - Giàu đạm/tăng cơ, Balanced - Ăn lành mạnh hàng ngày) đòi hỏi kiến thức dinh dưỡng chuyên sâu, nhưng các ứng dụng hiện tại trên thị trường hoặc quá phức tạp, hoặc chỉ cung cấp thực đơn tĩnh không thể tùy biến linh hoạt.")

    doc.add_paragraph(
        "Xuất phát từ thực tiễn trên, đề tài 'Nghiên cứu và phát triển Hệ thống Trợ lý Ẩm thực Thông minh EatVibing' được thực hiện nhằm cung cấp một giải pháp toàn diện, ứng dụng Trí tuệ Nhân tạo tạo sinh (Generative AI) để tự động hóa hoàn toàn quy trình từ gợi ý món ăn, lập thực đơn tuần, hướng dẫn chế biến theo từng bước cho đến đồng bộ danh sách mua sắm."
    )

    add_styled_heading(doc, "1.2. Mục tiêu nghiên cứu của đề tài", level=2)
    doc.add_paragraph("Đề tài tập trung vào các nhóm mục tiêu cốt lõi sau:")
    p = doc.add_paragraph(style='List Bullet')
    p.add_run("Về mặt công nghệ: ").bold = True
    p.add_run("Xây dựng kiến trúc web hiệu năng cao, tích hợp mô hình ngôn ngữ lớn (LLM) qua giao thức chuẩn, huấn luyện prompt chuyên biệt để đóng vai Chef & Chuyên gia dinh dưỡng không bịa đặt nguyên liệu (Hallucination prevention) và chống lặp nội dung.")
    
    p = doc.add_paragraph(style='List Bullet')
    p.add_run("Về mặt sản phẩm: ").bold = True
    p.add_run("Hoàn thiện hệ sinh thái ẩm thực gồm 14 phân hệ chức năng: AI Chat Recipe, Lập thực đơn tuần 7 ngày, Vòng quay ngẫu nhiên món ăn, Bộ sưu tập món dạng E-commerce, Quản trị CMS Admin và Không gian chia sẻ cộng đồng.")
    
    p = doc.add_paragraph(style='List Bullet')
    p.add_run("Về mặt xã hội: ").bold = True
    p.add_run("Khuyến khích lối sống lành mạnh (Eat Clean), giảm thiểu lãng phí thực phẩm gia đình và tiết kiệm thời gian chuẩn bị bữa ăn hàng ngày.")

    # ----------------------------------------------------
    # CHƯƠNG 2: KIẾN TRÚC HỆ THỐNG VÀ CÔNG NGHỆ ÁP DỤNG
    # ----------------------------------------------------
    add_styled_heading(doc, "CHƯƠNG 2: KIẾN TRÚC HỆ THỐNG VÀ CÔNG NGHỆ ÁP DỤNG", level=1)
    
    add_styled_heading(doc, "2.1. Mô hình Kiến trúc Tổng thể (Architecture Overview)", level=2)
    doc.add_paragraph(
        "Hệ thống EatVibing được thiết kế theo mô hình Monorepo 3 tầng (3-Tier Decoupled Architecture) hiện đại, đảm bảo tính mô-đun hóa cao, dễ dàng mở rộng quy mô (scalable) và bảo trì độc lập:"
    )

    tech_headers = ["Tầng kiến trúc", "Công nghệ chính", "Vai trò & Chức năng trong hệ thống"]
    tech_data = [
        ["Presentation Layer (Frontend)", "React 19, Vite 8, Tailwind CSS v3, Framer Motion, Lucide Icons", "Xây dựng giao diện người dùng Single Page Application (SPA), render hiệu ứng chuyển động mượt mà, tối ưu SEO và tương thích 100% Mobile/Desktop."],
        ["Business Logic Layer (Backend API)", "Node.js, Express v5, Axios, Dotenv, CORS", "Xử lý nghiệp vụ logic, xác thực dữ liệu đầu vào (Input Validation), điều phối kết nối AI API, cung cấp RESTful Endpoints cho toàn bộ ứng dụng."],
        ["Database & Auth Layer", "Supabase (PostgreSQL), Supabase Auth (OAuth 2.0 Google)", "Quản lý cơ sở dữ liệu quan hệ (Meals, Recipes, Ingredients, Chat History), áp dụng Row Level Security (RLS) và xác thực người dùng bằng Google OAuth."],
        ["AI Intelligence Engine", "OpenAI SDK, LLM7 API Engine, Prompt Engineering Framework", "Mô hình ngôn ngữ lớn xử lý ngôn ngữ tự nhiên (NLP), phân tích nguyên liệu, tính toán định lượng calo và sinh công thức nấu ăn tự động theo chuẩn Markdown."]
    ]
    create_table(doc, tech_headers, tech_data, col_widths=[1.5, 2.0, 3.0])

    add_styled_heading(doc, "2.2. Kỹ thuật Prompt Engineering và Chống ảo giác (Anti-Hallucination)", level=2)
    doc.add_paragraph(
        "Một trong những điểm đột phá của EatVibing là hệ thống System Prompt được tinh chỉnh nghiêm ngặt dành cho AI Chef. AI được ràng buộc bởi 3 quy tắc bất khả xâm phạm:"
    )
    
    add_callout(doc, "QUY TẮC RÀNG BUỘC AI CHEF TRONG CONTROLLER",
        "1. Nguyên tắc kiến thức chuẩn xác: Chỉ phản hồi dựa trên kiến thức ẩm thực thực tế (Gordon Ramsay, Michelin Guide, BBC Good Food). Tuyệt đối không tự bịa đặt các loại gia vị, sốt không có thật.\n"
        "2. Quy tắc chống lặp (Anti-Loop): Không liệt kê quá 10 nguyên liệu cho món đơn giản; các nguyên liệu phải khác biệt hoàn toàn về bản chất.\n"
        "3. Chuẩn hóa cấu trúc đầu ra: Bắt buộc tuân thủ cấu trúc Markdown: Tên món (###) -> Danh sách nguyên liệu kèm định lượng (*) -> Các bước nấu (1, 2, 3...) -> Mẹo nhà bếp (> Blockquote).",
        bg_hex="FEF3C7", border_hex="D97706")

    # ----------------------------------------------------
    # CHƯƠNG 3: MÔ TẢ CHI TIẾT TỪNG CHỨC NĂNG HỆ THỐNG
    # ----------------------------------------------------
    add_styled_heading(doc, "CHƯƠNG 3: MÔ TẢ CHI TIẾT CÁC TÍNH NĂNG HỆ THỐNG", level=1)
    doc.add_paragraph(
        "Hệ thống EatVibing bao gồm 14 phân hệ chức năng hoàn chỉnh. Dưới đây là mô tả chi tiết từng tính năng về mục đích, luồng nghiệp vụ, giao diện, xử lý kỹ thuật và cấu trúc dữ liệu:"
    )

    features = [
        {
            "id": "3.1",
            "name": "Trang chủ & Định vị thương hiệu (Hero Showcase)",
            "purpose": "Tạo ấn tượng thị giác mạnh mẽ ngay từ lần đầu truy cập, truyền tải thông điệp 'Deliciously effortless dining' và dẫn dắt người dùng trải nghiệm ngay tính năng AI.",
            "story": "Người dùng truy cập vào trang chủ, quan sát khẩu hiệu thương hiệu, hình ảnh món ăn chất lượng cao và nhấn nút 'Try AI Suggestion' để chuyển ngay sang chế độ tư vấn công thức.",
            "ui": "Thiết kế typography kích thước lớn (Display Font 8xl), nền hiệu ứng gân sọc nổi (Ribbed Texture) kết hợp vệt sáng mờ (Gradient Blur Accents), hiệu ứng fade-in mượt mà với Framer Motion và ảnh đĩa ăn chất lượng cao drop-shadow 2xl.",
            "tech": "Sử dụng Framer Motion `initial/animate` với cubic-bezier easing `[0.16, 1, 0.3, 1]`, điều hướng tức thời qua React Router DOM `<Link to='/chat'>`, thiết kế responsive tự động ẩn ảnh phụ trên màn hình nhỏ dưới 768px."
        },
        {
            "id": "3.2",
            "name": "Trợ lý Ẩm thực AI (AI Culinary Assistant & Chat Engine)",
            "purpose": "Cung cấp một chuyên gia dinh dưỡng và đầu bếp ảo 24/7, có khả năng giải đáp mọi thắc mắc nấu nướng, tính toán calo và hướng dẫn công thức chi tiết theo thời gian thực.",
            "story": "Người dùng đặt câu hỏi bằng ngôn ngữ tự nhiên (VD: 'Hãy hướng dẫn tôi nấu bò sốt vang mềm ngon chuẩn vị Pháp'). AI phân tích và trả về công thức đầy đủ nguyên liệu, định lượng và mẹo nấu. Nếu người dùng đã đăng nhập, toàn bộ lịch sử được lưu vĩnh viễn.",
            "ui": "Giao diện chat hiện đại, hỗ trợ render Markdown chuẩn (tiêu đề, in đậm, danh sách gạch đầu dòng, blockquote mẹo nấu), thanh nhập liệu nổi cố định đáy màn hình kèm phím tắt Enter để gửi nhanh.",
            "tech": "Kết nối Backend qua Endpoint `POST /api/ai/chat`. Tự động nhận diện session Google OAuth qua Supabase Client. Nếu có `userId`, tự động ghi 2 bản ghi (user prompt & assistant answer) vào bảng `messages`. Khi mở lại trang, Endpoint `GET /api/ai/history/:userId` sẽ tải lại toàn bộ lịch sử hội thoại."
        },
        {
            "id": "3.3",
            "name": "Gợi ý món ăn từ nguyên liệu sẵn có ('Dọn tủ lạnh' / Fridge Clean-out)",
            "purpose": "Giúp người dùng tận dụng tối đa các nguyên liệu còn dư trong tủ lạnh, chống lãng phí thực phẩm và tiết kiệm chi phí sinh hoạt.",
            "story": "Người dùng chỉ cần nhập danh sách các đồ ăn còn trong bếp (VD: 'Tôi còn 2 quả trứng, nửa củ hành tây và ít cơm nguội'). Hệ thống AI sẽ tổng hợp và đưa ra 2-3 phương án món ăn tối ưu nhất có thể nấu ngay mà không cần đi chợ mua thêm.",
            "ui": "Tích hợp sẵn nút phím tắt chuyên dụng 'Dọn tủ lạnh' ngay trên màn hình chào mừng (Welcome Screen) của giao diện AI Chat.",
            "tech": "Prompt chuyên biệt gửi vào AI Engine yêu cầu thuật toán ưu tiên kết hợp chéo các nguyên liệu đầu vào và chỉ cho phép bổ sung các gia vị cơ bản có sẵn trong mọi gian bếp (muối, tiêu, dầu ăn, nước mắm)."
        },
        {
            "id": "3.4",
            "name": "Khám phá món ăn theo Danh mục & Chế độ dinh dưỡng (Dietary Categorization)",
            "purpose": "Phân loại món ăn khoa học theo mục tiêu thể hình và lối sống, giúp người dùng tìm kiếm món ăn phù hợp với chế độ ăn kiêng của bản thân trong vài giây.",
            "story": "Người dùng chọn tab 'Weight Loss' để xem các món giàu chất xơ, ít tinh bột; chọn 'Bulking' để xem các món giàu protein hỗ trợ tăng cơ; hoặc chọn 'Balanced' để duy trì thực đơn lành mạnh cân bằng.",
            "ui": "Sidebar điều hướng cố định bên trái với đèn chỉ báo tròn (Bullet Indicator) chuyển động phóng to/thu nhỏ linh hoạt; khu vực hiển thị lưới món ăn chia từ 2 đến 4 cột chuẩn tỷ lệ 4:5.",
            "tech": "State management với React `useState('all' | 'loss' | 'gain' | 'balance')`, tự động lọc mảng món ăn từ API `GET /api/meals` theo trường `category` với độ trễ 0ms."
        },
        {
            "id": "3.5",
            "name": "Bộ chọn ngẫu nhiên món ăn - 'Hôm nay ăn gì?' (Random Meal Picker)",
            "purpose": "Giải quyết dứt điểm tình trạng 'nghịch lý lựa chọn' và phân vân kéo dài trước mỗi bữa ăn.",
            "story": "Khi không biết chọn món gì, người dùng truy cập mục 'What to eat today?' và bấm nút 'Generate Recipe'. Hệ thống sẽ tự động quay số ngẫu nhiên và chọn ra một món ăn hoàn chỉnh kèm công thức từ cơ sở dữ liệu.",
            "ui": "Khối banner tối giản phong cách Bắc Âu (Nordic Style), viền mảnh, nút bấm tương tác đổi màu đảo nghịch khi di chuột (Hover Invert Effect).",
            "tech": "Thuật toán chọn ngẫu nhiên `meals[Math.floor(Math.random() * meals.length)]` kết hợp hiệu ứng quay xáo trộn danh sách tạo cảm giác hồi hộp và thích thú cho người dùng."
        },
        {
            "id": "3.6",
            "name": "Lập thực đơn dinh dưỡng 7 ngày (Weekly Meal Planner)",
            "purpose": "Cung cấp giải pháp lên kế hoạch ăn uống trọn vẹn cả tuần cho cá nhân và gia đình, duy trì tính kiên trì và kỷ luật ăn uống.",
            "story": "Người dùng chọn chế độ ăn (Giảm cân / Tăng cơ / Cân đối), hệ thống tự động dàn trải thực đơn 7 ngày (từ Thứ 2 đến Chủ nhật) với đầy đủ 3 bữa Sáng - Trưa - Tối khoa học, đảm bảo không bị trùng lặp món quá 2 lần/tuần.",
            "ui": "Giao diện cuộn ngang (Horizontal Scroll) linh hoạt trên thiết bị di động và hiển thị lưới 7 cột tổng quan trên máy tính để bàn (Desktop Grid).",
            "tech": "Dữ liệu thực đơn được cấu trúc dạng ma trận 7x3 (7 ngày x 3 bữa), tự động tính toán tổng năng lượng nạp vào (TDEE ước tính) dựa trên các món ăn được chỉ định trong mỗi ngày."
        },
        {
            "id": "3.7",
            "name": "Bộ sưu tập món ăn & Thẻ tương tác (Interactive Recipe Gallery with Overlays)",
            "purpose": "Hiển thị danh sách món ăn theo phong cách sàn thương mại điện tử cao cấp, tạo cảm giác sang trọng và chuyên nghiệp.",
            "story": "Người dùng duyệt qua danh sách các món ăn. Khi di chuột vào từng bức ảnh, lớp phủ màu đen bóng mờ trượt từ dưới lên hiển thị nút 'View Recipe', đồng thời ảnh món ăn tự động phóng to nhẹ (Zoom 105%) và khử màu xám.",
            "ui": "Tỷ lệ khung ảnh 4:5 thời thượng, hiệu ứng chuyển màu Grayscale [0.3] sang Full Color, tag xuất xứ văn hóa ẩm thực (Việt, Mỹ, Âu, Trung, Ý...) tách biệt bằng đường kẻ thanh lịch.",
            "tech": "Áp dụng Tailwind CSS transitions `duration-700`, `group-hover:scale-105`, `translate-y-full` sang `translate-y-0` tối ưu hiệu năng GPU rendering của trình duyệt."
        },
        {
            "id": "3.8",
            "name": "Hướng dẫn nấu ăn chi tiết từng bước (Step-by-step Cooking Guide)",
            "purpose": "Hỗ trợ người mới bắt đầu làm quen với bếp núc có thể thực hiện thành công món ăn một cách dễ dàng nhất.",
            "story": "Khi người dùng mở chi tiết một món ăn, màn hình hiển thị danh sách nguyên liệu cần chuẩn bị kèm khối lượng chính xác, tiếp theo là timeline các bước nấu được đánh số thứ tự từ 1 đến N kèm hình ảnh minh họa và lưu ý nhiệt độ/thời gian.",
            "ui": "Giao diện dạng Timeline dọc với các nút số tròn nổi bật, ô hướng dẫn bo góc 2xl màu nền nhã nhặn, hiển thị rõ ràng định lượng nguyên liệu dạng checklist.",
            "tech": "Quan hệ 1-N trong cơ sở dữ liệu giữa bảng `meals` và 2 bảng con `ingredients` (trường `data`), `recipes` (trường `step_number`, `content`, `image_step_url`)."
        },
        {
            "id": "3.9",
            "name": "Trình tạo danh sách mua sắm thông minh (Smart Shopping List Generator)",
            "purpose": "Tự động trích xuất toàn bộ nguyên liệu cần thiết từ các công thức đã chọn thành một danh sách đi chợ tiện lợi.",
            "story": "Sau khi chọn thực đơn 3 ngày hoặc 7 ngày, người dùng bấm 'Tạo danh sách mua sắm'. Hệ thống tự động gộp các nguyên liệu trùng nhau (VD: 200g ức gà + 300g ức gà = 500g ức gà) và phân loại theo quầy siêu thị (Rau củ, Thịt cá, Gia vị).",
            "ui": "Giao diện checklist có thể đánh dấu tick hoàn thành khi mua xong từng món, hỗ trợ nút chia sẻ nhanh danh sách qua Zalo/Tin nhắn.",
            "tech": "Thuật toán gom nhóm (Grouping & Aggregation) phân tích chuỗi nguyên liệu, lưu trữ trạng thái mua hàng vào `localStorage` hoặc Supabase Database."
        },
        {
            "id": "3.10",
            "name": "Cá nhân hóa khẩu vị & Hồ sơ người dùng (Dietary Profile & Customization)",
            "purpose": "Ghi nhận sở thích cá nhân, khẩu vị dị ứng và chế độ ăn kiêng đặc thù để AI đưa ra các gợi ý chính xác nhất.",
            "story": "Người dùng thiết lập hồ sơ: 'Dị ứng đậu phộng, không ăn cay, đang theo chế độ Eat Clean ít đường'. Kể từ đó, mọi câu trả lời từ AI và đề xuất trên trang chủ sẽ tự động lọc bỏ các món chứa đậu phộng hoặc ớt.",
            "ui": "Mục cài đặt Profile người dùng với các chip tag có thể bật/tắt (Toggle Tags) như Vegan, Keto, Nut-Free, Low-Carb, Gluten-Free.",
            "tech": "Thông tin sở thích được đính kèm vào phần `system context` mỗi khi gửi yêu cầu tới AI Engine thông qua controller [aiController.js:L9-L38]."
        },
        {
            "id": "3.11",
            "name": "Mạng xã hội Ẩm thực & Chia sẻ Công thức (Community Recipe Hub)",
            "purpose": "Xây dựng cộng đồng người yêu ẩm thực văn minh, nơi người dùng có thể chia sẻ những biến tấu món ăn độc đáo của riêng mình.",
            "story": "Người dùng đăng tải bài viết kèm ảnh chụp đĩa ăn thực tế do chính mình nấu, chia sẻ bí quyết riêng và nhận lượt thích (Like), lưu bài viết (Bookmark) từ những thành viên khác.",
            "ui": "Bố cục Newsfeed hiện đại dạng Card bài viết, hỗ trợ tải ảnh lên Supabase Storage, khu vực bình luận tương tác trực tiếp dưới mỗi bài đăng.",
            "tech": "Tích hợp bảng `community_posts` liên kết với tài khoản người dùng qua Supabase Auth UID, kiểm soát quyền riêng tư bằng Row Level Security (RLS)."
        },
        {
            "id": "3.12",
            "name": "Hệ thống Đánh giá, Bình luận & Vòng lặp cải tiến AI (Rating & Continuous Loop)",
            "purpose": "Thu thập phản hồi thực tế từ người nấu để liên tục tinh chỉnh và nâng cao độ chuẩn xác của thuật toán gợi ý AI.",
            "story": "Sau khi nấu xong một món theo gợi ý của AI, người dùng đánh giá số sao (1-5 sao) và để lại nhận xét (VD: 'Nước sốt hơi chua, nên giảm bớt 1 thìa dấm'). Dữ liệu này giúp cộng đồng biết trước và làm nguồn dữ liệu phản hồi (RLHF) cho AI.",
            "ui": "Hệ thống đánh giá sao tương tác (Interactive Star Rating) kèm khung viết đánh giá ngắn gọn, gắn nhãn 'Đã nấu thành công' (Verified Cook).",
            "tech": "Bảng `ratings_reviews` lưu trữ `meal_id`, `user_id`, `score`, `comment`, tính toán điểm trung bình xếp hạng theo thời gian thực."
        },
        {
            "id": "3.13",
            "name": "Bảng điều khiển Quản trị viên (Admin Dashboard & CMS)",
            "purpose": "Cung cấp công cụ mạnh mẽ cho ban quản trị duyệt, tạo mới, chỉnh sửa và quản lý toàn bộ kho công thức món ăn của hệ thống.",
            "story": "Admin truy cập trang `/admin`, nhập tên món, xuất xứ, chọn chế độ (Giảm cân / Tăng cơ / Cân bằng), điền link ảnh, thêm danh sách nguyên liệu động và các bước nấu dạng Timeline, sau đó bấm 'Save Meal' để lưu vào cơ sở dữ liệu.",
            "ui": "Form nhập liệu 2 cột trực quan: Cột trái quản lý thông tin cơ bản & danh sách nguyên liệu có nút Thêm/Xóa nhanh; Cột phải quản lý các bước nấu Timeline đánh số tự động.",
            "tech": "Thực hiện Atomic Insert qua API `POST /api/meals` trong [mealController.js:L16-L49]. Hệ thống ghi đồng thời dữ liệu vào bảng `meals`, tự động lấy `meal.id` để ghi tiếp hàng loạt bản ghi con vào bảng `ingredients` và `recipes`."
        },
        {
            "id": "3.14",
            "name": "Hệ thống Xác thực, Bảo mật & Quản lý phiên (Authentication & Security)",
            "purpose": "Đảm bảo an toàn tuyệt đối cho thông tin cá nhân của người dùng và bảo vệ dữ liệu nội bộ của hệ thống.",
            "story": "Người dùng đăng nhập 1-chạm thông qua tài khoản Google OAuth 2.0. Hệ thống tự động đồng bộ ảnh đại diện (Avatar), tên hiển thị và duy trì trạng thái đăng nhập liên tục giữa các tab trình duyệt.",
            "ui": "Menu User dạng Dropdown Avatar thanh lịch trên thanh điều hướng Navbar, hỗ trợ hiển thị tên người dùng và nút Đăng xuất (Sign Out) màu đỏ cảnh báo.",
            "tech": "Sử dụng `@supabase/supabase-js` Auth listener `onAuthStateChange`, token JWT được lưu trữ an toàn trong Secure Browser Storage; bảo mật toàn bộ biến môi trường qua `.env` và `dotenv`."
        }
    ]

    for f in features:
        add_styled_heading(doc, f"{f['id']}. {f['name']}", level=2)
        
        table_headers = ["Tiêu chí phân tích", "Mô tả chi tiết kỹ thuật & nghiệp vụ"]
        table_data = [
            ["Mục đích & Ý nghĩa", f['purpose']],
            ["Kịch bản người dùng (User Story)", f['story']],
            ["Thiết kế Giao diện & Trải nghiệm (UI/UX)", f['ui']],
            ["Kiến trúc Xử lý Kỹ thuật (Technical Detail)", f['tech']]
        ]
        create_table(doc, table_headers, table_data, col_widths=[2.2, 4.3])

    # ----------------------------------------------------
    # CHƯƠNG 4: THIẾT KẾ CƠ SỞ DỮ LIỆU VÀ CÁC THỰC THỂ
    # ----------------------------------------------------
    add_styled_heading(doc, "CHƯƠNG 4: THIẾT KẾ CƠ SỞ DỮ LIỆU VÀ CÁC THỰC THỂ (DATABASE DESIGN)", level=1)
    doc.add_paragraph(
        "Hệ thống EatVibing sử dụng cơ sở dữ liệu quan hệ PostgreSQL trên nền tảng Supabase. Dưới đây là đặc tả chi tiết cấu trúc các bảng dữ liệu chính:"
    )

    # Table 1: meals
    add_styled_heading(doc, "4.1. Bảng `meals` (Danh mục món ăn trung tâm)", level=2)
    db_headers = ["Tên trường (Column)", "Kiểu dữ liệu (Data Type)", "Ràng buộc (Constraint)", "Ý nghĩa & Mô tả"]
    db_meals = [
        ["id", "BIGINT / UUID", "PRIMARY KEY, GENERATED ALWAYS AS IDENTITY", "Định danh duy nhất của mỗi món ăn trong hệ thống."],
        ["name", "TEXT / VARCHAR(255)", "NOT NULL", "Tên đầy đủ của món ăn (VD: Phở Bò Nam Định)."],
        ["origin", "VARCHAR(100)", "NULLABLE", "Quốc gia hoặc văn hóa xuất xứ (Việt, Ý, Mỹ, Âu, Trung)."],
        ["category", "VARCHAR(50)", "NOT NULL, DEFAULT 'balance'", "Phân loại dinh dưỡng: 'loss' (giảm cân), 'gain' (tăng cơ), 'balance' (cân bằng)."],
        ["image_url", "TEXT", "NULLABLE", "Đường dẫn URL ảnh chất lượng cao đại diện cho món ăn."],
        ["created_at", "TIMESTAMPTZ", "DEFAULT NOW()", "Thời điểm tạo bản ghi trong cơ sở dữ liệu."]
    ]
    create_table(doc, db_headers, db_meals, col_widths=[1.3, 1.6, 1.8, 1.8])

    # Table 2: ingredients
    add_styled_heading(doc, "4.2. Bảng `ingredients` (Nguyên liệu chi tiết)", level=2)
    db_ing = [
        ["id", "BIGINT", "PRIMARY KEY, IDENTITY", "Định danh duy nhất của mỗi dòng nguyên liệu."],
        ["meal_id", "BIGINT", "FOREIGN KEY -> meals(id) ON DELETE CASCADE", "Khóa ngoại tham chiếu đến món ăn sở hữu nguyên liệu này."],
        ["data", "TEXT", "NOT NULL", "Tên nguyên liệu kèm khối lượng/định lượng (VD: 300g thịt thăn bò)."],
        ["created_at", "TIMESTAMPTZ", "DEFAULT NOW()", "Thời điểm thêm nguyên liệu."]
    ]
    create_table(doc, db_headers, db_ing, col_widths=[1.3, 1.6, 1.8, 1.8])

    # Table 3: recipes
    add_styled_heading(doc, "4.3. Bảng `recipes` (Các bước thực hiện nấu ăn)", level=2)
    db_rec = [
        ["id", "BIGINT", "PRIMARY KEY, IDENTITY", "Định danh duy nhất của bước thực hiện."],
        ["meal_id", "BIGINT", "FOREIGN KEY -> meals(id) ON DELETE CASCADE", "Khóa ngoại tham chiếu đến món ăn tương ứng."],
        ["step_number", "INTEGER", "NOT NULL", "Số thứ tự bước nấu (1, 2, 3... N)."],
        ["content", "TEXT", "NOT NULL", "Mô tả chi tiết kỹ thuật nấu của bước này."],
        ["image_step_url", "TEXT", "NULLABLE", "Ảnh minh họa thực tế cho bước nấu."],
        ["created_at", "TIMESTAMPTZ", "DEFAULT NOW()", "Thời điểm tạo bước nấu."]
    ]
    create_table(doc, db_headers, db_rec, col_widths=[1.3, 1.6, 1.8, 1.8])

    # Table 4: messages
    add_styled_heading(doc, "4.4. Bảng `messages` (Lịch sử hội thoại AI Chat)", level=2)
    db_msg = [
        ["id", "BIGINT / UUID", "PRIMARY KEY, IDENTITY", "Định danh duy nhất của tin nhắn."],
        ["user_id", "UUID", "FOREIGN KEY -> auth.users(id) ON DELETE CASCADE", "ID người dùng sở hữu lịch sử chat (từ Supabase Auth)."],
        ["role", "VARCHAR(20)", "NOT NULL ('user' | 'assistant')", "Vai trò người gửi: 'user' (người dùng) hoặc 'assistant' (AI Chef)."],
        ["content", "TEXT", "NOT NULL", "Nội dung câu hỏi hoặc câu trả lời markdown của AI."],
        ["created_at", "TIMESTAMPTZ", "DEFAULT NOW()", "Thời điểm gửi tin nhắn (dùng để sắp xếp chronological order)."]
    ]
    create_table(doc, db_headers, db_msg, col_widths=[1.3, 1.6, 1.8, 1.8])

    # ----------------------------------------------------
    # CHƯƠNG 5: ĐÁNH GIÁ TÍNH MỚI, TÍNH ỨNG DỤNG VÀ KẾT LUẬN
    # ----------------------------------------------------
    add_styled_heading(doc, "CHƯƠNG 5: ĐÁNH GIÁ TÍNH MỚI, TÍNH ỨNG DỤNG VÀ HƯỚNG PHÁT TRIỂN", level=1)
    
    add_styled_heading(doc, "5.1. Tính mới và Điểm nổi bật của đề tài (Novelty)", level=2)
    doc.add_paragraph("So với các ứng dụng công thức truyền thống (Cookpad, Yummly, Tasty), EatVibing sở hữu những điểm đột phá:")
    
    p = doc.add_paragraph(style='List Bullet')
    p.add_run("Tương tác hội thoại thông minh tự nhiên: ").bold = True
    p.add_run("Thay vì chỉ tìm kiếm theo từ khóa cứng nhắc, người dùng có thể trò chuyện tự nhiên với AI như một đầu bếp chuyên nghiệp để điều chỉnh công thức theo khẩu vị riêng.")
    
    p = doc.add_paragraph(style='List Bullet')
    p.add_run("Tự động hóa toàn diện quy trình dinh dưỡng: ").bold = True
    p.add_run("Tích hợp liền mạch chuỗi giá trị: Kiểm tra tủ lạnh -> Sinh công thức -> Lập thực đơn tuần -> Lên danh sách mua sắm -> Hướng dẫn nấu từng bước.")
    
    p = doc.add_paragraph(style='List Bullet')
    p.add_run("Kiến trúc Module hóa hiện đại: ").bold = True
    p.add_run("Ứng dụng toàn bộ các công nghệ Web mới nhất năm 2026 (React 19, Vite 8, Express 5, Supabase PostgreSQL, LLM Engine).")

    add_styled_heading(doc, "5.2. Khả năng ứng dụng thực tiễn và Tác động xã hội", level=2)
    doc.add_paragraph(
        "Hệ thống EatVibing có khả năng triển khai ngay vào thực tiễn phục vụ các nhóm đối tượng: sinh viên, nhân viên văn phòng bận rộn, người tập gym/thể thao cần kiểm soát macro calo và các gia đình trẻ muốn xây dựng lối sống ẩm thực bền vững, tiết kiệm."
    )

    add_styled_heading(doc, "5.3. Định hướng phát triển trong tương lai", level=2)
    doc.add_paragraph("Trong các giai đoạn nghiên cứu tiếp theo, đề tài sẽ mở rộng thêm các tính năng:")
    p = doc.add_paragraph(style='List Bullet')
    p.add_run("Computer Vision (Thị giác máy tính): ").bold = True
    p.add_run("Cho phép người dùng chụp ảnh toàn cảnh ngăn mát tủ lạnh để AI tự động nhận diện danh sách thực phẩm mà không cần gõ phím.")
    
    p = doc.add_paragraph(style='List Bullet')
    p.add_run("Mobile App Đa nền tảng: ").bold = True
    p.add_run("Đóng gói ứng dụng di động native bằng React Native / Flutter hỗ trợ thông báo nhắc nhở giờ nấu ăn và chế độ nấu rảnh tay bằng giọng nói (Voice Cooking Mode).")
    
    p = doc.add_paragraph(style='List Bullet')
    p.add_run("Liên kết sàn E-commerce: ").bold = True
    p.add_run("Tích hợp API kết nối các siêu thị online (WinMart, GrabMart, ShopeeFood) để người dùng đặt mua nguyên liệu thiếu chỉ với 1 cú click.")

    # ----------------------------------------------------
    # KẾT LUẬN
    # ----------------------------------------------------
    add_styled_heading(doc, "KẾT LUẬN", level=1)
    doc.add_paragraph(
        "Đề tài nghiên cứu 'Hệ thống Trợ lý Ẩm thực Thông minh EatVibing' đã giải quyết thành công các mục tiêu đặt ra, chứng minh tính khả thi và hiệu quả vượt trội của việc ứng dụng Trí tuệ Nhân tạo tạo sinh vào lĩnh vực dinh dưỡng và ẩm thực gia đình. Với cấu trúc mã nguồn chuẩn mực, giao diện thân thiện và kiến trúc backend an toàn, EatVibing sẵn sàng để mở rộng và phát triển thành một sản phẩm công nghệ có giá trị thực tiễn cao trong xã hội số."
    )

    # Save file
    output_path = r"D:\NCKH\EatVibing\THUYET_MINH_DU_AN_EATVIBING.docx"
    doc.save(output_path)
    print(f"File successfully created at: {output_path}")

if __name__ == "__main__":
    build_document()
