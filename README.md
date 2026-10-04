# EatVibing

EatVibing là ứng dụng khám phá công thức món ăn và lập kế hoạch bữa ăn, có thêm các luồng hỗ trợ hồ sơ dinh dưỡng cá nhân và gia đình. Giao diện hiện chủ yếu bằng tiếng Anh; một số luồng trợ lý xử lý được cả tiếng Việt và tiếng Anh.

> **Trạng thái:** Dự án hiện có thể chạy để xem xét trên máy local. Cổng máy chủ có xác thực và trợ lý gia đình đã có mã nguồn nhưng cần cấu hình Supabase, dịch vụ liên quan và đánh giá trước khi dùng với người thật. Sản phẩm chưa được triển khai như một dịch vụ production; thanh toán chưa được tích hợp.

## Chạy bản local

Yêu cầu Node.js 24 trở lên. Từ thư mục gốc repo, mở hai cửa sổ terminal.

Terminal 1 — API và dữ liệu local:

```powershell
cd backend
npm ci
npm run start:local
```

Terminal 2 — giao diện web:

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Mở [http://127.0.0.1:5173](http://127.0.0.1:5173). Frontend dùng API local tại `http://127.0.0.1:5000`. Máy chủ local chỉ lắng nghe loopback; không đưa API này ra Internet.

## Các trang hiện có

| Đường dẫn | Trang | Chức năng hiện tại |
| --- | --- | --- |
| `/` | Home | Trang giới thiệu, điều hướng nhanh và lối vào gợi ý món ăn bằng trợ lý. |
| `/today` | Today | Check-in trong ngày: hoạt động, thời gian nấu, bữa ăn ở nhà/ngoài nhà/chưa rõ, nhật ký món đã ăn và hành động theo ngữ cảnh. Thông tin chưa biết được giữ là chưa biết. |
| `/chat` | AI Assistant | Hỏi đáp về món ăn và nấu nướng; có thể xem trước đề xuất bữa ăn/đổi món rồi xác nhận. Phần hội thoại dùng nhà cung cấp AI chỉ hoạt động khi được cấu hình, được bật và có sự đồng ý phù hợp. |
| `/profile` | Profile & BMI | Hồ sơ, mục tiêu, dị ứng và sở thích ăn uống, lịch sinh hoạt, thiết bị nấu, múi giờ, đơn vị đo, lịch sử số đo, chỉnh sửa bản ghi và biểu đồ cân nặng. BMI được tính từ số đo. |
| `/family` | Family | Tạo hộ gia đình, lời mời người lớn, hồ sơ từng thành viên, quyền chia sẻ riêng và hồ sơ trẻ do người giám hộ quản lý. |
| `/family-planner` | Family planner | Lên kế hoạch ngày/tuần cho nhiều thành viên, chọn nhiều món và khẩu phần, xem trước rồi xác nhận, khóa/đổi món, dùng lại tuần trước, quản lý pantry và danh sách đi chợ. |
| `/nutrition-review` | Nutrition review | Công cụ dành cho người đánh giá để nhập công thức có nguồn, kiểm tra thông tin dinh dưỡng, dị ứng/chế độ ăn, tra cứu USDA FoodData Central và theo dõi mức độ sẵn sàng của dữ liệu. Cần máy chủ và quyền phù hợp. |
| `/guide` | Guideline / Recipe library | Duyệt thư viện công thức; tìm theo tên món, nguyên liệu, quốc gia, hướng dẫn nấu; lọc loại món, khu vực và quốc gia; phân trang 12 món; gợi ý danh mục và chọn món ngẫu nhiên. |
| `/saved` | Saved recipes | Xem công thức đã lưu, lọc và phân trang; Pro local có thể sắp xếp bộ sưu tập có tên. |
| `/recipes/:id` | Recipe detail | Xem ảnh, nguyên liệu, hướng dẫn và nguồn công thức; đánh dấu nguyên liệu/các bước, lưu món, thêm món vào kế hoạch và điều chỉnh số phần khi đã xác nhận số phần gốc. |
| `/planner` | Meal planner | Ở local, Basic lập bữa sáng/trưa/tối cho hôm nay; Pro dùng kế hoạch tuần. Trong chế độ assistant đã xác thực, đường dẫn này chuyển sang family planner. |
| `/pricing` | Basic / Pro | So sánh quyền lợi hai gói và xem thông tin kích hoạt Pro local. Đây là giao diện demo; chưa thu tiền hay tạo đăng ký thanh toán thật. |
| `/community` | Community | Bảng tin mẫu chạy trong trình duyệt: bài viết, nhóm, chủ đề, tìm kiếm, sắp xếp, thích, lưu, trả lời, repost, chia sẻ liên kết và tạo bài. Nội dung và tương tác mới chỉ lưu trên trình duyệt hiện tại. |
| `/admin` | Local catalog admin | Tạo công thức local và ghi đè URL ảnh trong catalog local. Đây không phải hệ thống quản trị CMS đã triển khai. |

## Nhóm tính năng

### Thư viện công thức

- Tìm kiếm theo tên món, nguyên liệu, hướng dẫn nấu và tên quốc gia; truy vấn tiếng Việt không dấu được hỗ trợ.
- Lọc theo nhóm Balanced, Weight Loss, Bulking; nhóm ẩm thực theo khu vực/châu lục và quốc gia.
- Kết quả thư viện và Saved được chia trang, giữ bộ lọc trong URL để có thể tải lại hoặc chia sẻ đường dẫn.
- Công thức có thể lưu vào Favorites. Giới hạn Basic local là 10 món; Pro local không giới hạn và có collections.
- Trang chi tiết hỗ trợ đánh dấu nguyên liệu/các bước, ghi chú công thức và điều chỉnh lượng theo số phần khi có thông tin số phần gốc.
- Danh mục kết hợp dữ liệu catalog hiện có, bản chụp local và các công thức bổ sung có nguồn. Ảnh minh họa có thể không phải ảnh chính xác của món trong một số bản ghi.

### Meal planner Basic và Pro (local demo)

- Basic: lập bữa sáng, trưa và tối cho ngày hiện tại theo múi giờ Bangkok.
- Pro: kế hoạch 7 ngày với 21 ô bữa ăn, nhiều tuần theo ngày, kế hoạch mẫu có tên, khóa bữa và đổi từng ô.
- Chọn danh mục công thức, quốc gia/ẩm thực, số người và nguyên liệu cần tránh; tạo kế hoạch tự động có xét độ lặp lại, pantry và các ô đã khóa, hoặc chọn món thủ công.
- Tạo tuần được kiểm tra đủ 21 ô trước khi lưu; bộ lọc không thể đáp ứng sẽ không ghi đè tuần đang có.
- Pantry lưu lượng nguyên liệu; danh sách mua sắm cộng nguyên liệu tương thích qua các bữa, trừ pantry, hỗ trợ đánh dấu đã mua và xuất văn bản.
- Có ghi chú công thức, collections, nhãn loại bữa và điều chỉnh khẩu phần. Lượng đo không tương thích hoặc không rõ được giữ riêng và có cảnh báo thay vì tự suy đoán.
- Nâng/hạ gói chỉ đổi quyền local; dữ liệu hiện có được giữ lại khi hạ gói. Không có cổng thanh toán.

### Trợ lý gia đình

- Hồ sơ người lớn và hộ gia đình có quyền chia sẻ thông tin theo từng nhóm dữ liệu; người lớn có thể tham gia bằng lời mời.
- Người giám hộ quản lý hồ sơ trẻ từ 2–17 tuổi. Dữ liệu của trẻ không tự chuyển thành tài khoản người lớn khi đủ 18 tuổi.
- Check-in và nhật ký Today phân biệt kế hoạch với hoạt động đã hoàn thành, bữa đã biết với bữa chưa rõ; nhật ký thiếu không được xem như tổng lượng ăn đầy đủ.
- Kế hoạch ngày/tuần cho gia đình hỗ trợ nhiều món, người tham gia, khẩu phần thủ công, xem trước, xác nhận, khóa/đổi món, pantry, groceries và phản hồi tuần.
- Đề xuất của trợ lý là bản xem trước; thao tác lưu cần xác nhận và được kiểm tra lại theo hồ sơ, quyền chia sẻ, thực đơn và pantry hiện tại.
- BMI chỉ là chỉ số sàng lọc. Phân loại người lớn áp dụng từ 20 tuổi; diễn giải BMI trẻ em và mục tiêu năng lượng cần dữ liệu/chính sách đã được chuyên gia duyệt. Các cổng chuyên môn hiện mặc định tắt khi chưa đủ điều kiện.

### Community

Community hiện là demo localStorage với dữ liệu mẫu. Bài mới, lượt thích, lưu, trả lời và repost chỉ tồn tại trên trình duyệt đó; chúng không được gửi lên máy chủ hay chia sẻ giữa thiết bị. Số lượng thành viên, thời gian hoạt động và nhóm trong dữ liệu mẫu chỉ có tính minh họa.

## Chế độ dữ liệu và giới hạn

- **Local recipe app:** API đọc catalog Supabase hiện có và dùng snapshot để hỗ trợ chạy offline; API local không ghi ngược vào Supabase. SQLite lưu catalog cache và dữ liệu demo planner/admin. Danh tính planner legacy là visitor ID trên trình duyệt, không phải xác thực production.
- **Family assistant:** có máy chủ local demo và điểm vào server xác thực. Dùng triển khai xác thực cần cấu hình Supabase, migration, origin, tài khoản pilot và các khóa dịch vụ ở phía server; xem [README.assistant.md](README.assistant.md). Migration chỉ là bản nháp để xem xét nếu chưa được áp dụng rõ ràng.
- **AI:** kế hoạch, hồ sơ và nhật ký có luồng không cần nhà cung cấp AI. Hội thoại định tính cần cấu hình, quyền truy cập, sự đồng ý và phê duyệt nhà cung cấp.
- **Dinh dưỡng:** không tự bịa khẩu phần, calo, thời gian nấu hoặc xác nhận dị ứng từ văn bản nguyên liệu. Nhãn danh mục công thức không phải mục tiêu dinh dưỡng đã kiểm chứng; dò chuỗi nguyên liệu không đảm bảo phát hiện mọi dị ứng.
- **Thanh toán và triển khai:** trang giá chỉ là giao diện demo. Chưa có thanh toán, thuê bao thật, migration đầy đủ dữ liệu favorites/collections hay xác nhận vận hành production.

## Cấu trúc chính

```text
frontend/                 React, Vite, các trang và giao diện
backend/                  API local, assistant server và logic dịch vụ
backend/data/             Snapshot catalog và dữ liệu nguồn
supabase/migrations/      Migration SQL để xem xét
docs/                     Kế hoạch, kiểm kê và tài liệu rà soát
README.local.md           Hướng dẫn local và chi tiết planner legacy
README.assistant.md       Thiết lập, dữ liệu và giới hạn assistant
frontend/README.community.md  Hành vi demo Community
```

## Lệnh dự án

```powershell
# Backend
cd backend
npm run start:local       # API demo local
npm run start:assistant   # API assistant có xác thực/cần cấu hình
npm test                  # Kiểm tra backend
npm run eval:assistant    # Bộ đánh giá offline cho assistant

# Frontend (mở terminal riêng từ thư mục repo)
cd frontend
npm run dev -- --host 127.0.0.1
npm run build
```

Đọc thêm: [hướng dẫn local](README.local.md), [trợ lý gia đình](README.assistant.md), [Community](frontend/README.community.md) và [bảng chức năng/kế hoạch hệ thống](docs/ke-hoach-he-thong.md).
