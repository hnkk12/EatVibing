# EatVibing — Bảng chức năng, công việc đã làm và kế hoạch hệ thống

Cập nhật: **04/10/2026**, múi giờ **Asia/Bangkok**.

Tài liệu này là bảng theo dõi công việc của dự án. Nội dung được đối chiếu với mã hiện tại, lịch sử Git, `README.local.md`, `README.assistant.md`, `frontend/README.community.md` và yêu cầu ban đầu trong `function.md`. Trạng thái triển khai bên ngoài repo chỉ được ghi hoàn tất khi có bằng chứng tương ứng.

## 1. Cách đọc trạng thái

| Trạng thái | Ý nghĩa |
| --- | --- |
| Đã có — local | Mã và luồng sử dụng đã có cho môi trường local/demo. |
| Đã có — cần cấu hình | Mã đã có; sử dụng dịch vụ thật cần cấu hình, quyền truy cập và kiểm tra tích hợp. |
| Đã có — có cổng kiểm soát | Mã đã có nhưng một số kết quả chỉ bật khi dữ liệu/chính sách được duyệt. |
| Bản nháp | Có thiết kế hoặc migration để xem xét; chưa xác nhận áp dụng lên hệ thống thật. |
| Chưa hoàn tất | Còn việc triển khai hoặc nghiệm thu. |
| Đã sửa và kiểm tra | Lỗi đã được sửa trong working tree và có kiểm tra tự động cho tình huống liên quan. |

“Đã có” mô tả tình trạng mã hiện tại. Các hạng mục dịch vụ thật, dữ liệu chuyên môn và vận hành được theo dõi riêng ở mục 4.

## 2. Bảng chức năng hiện có

Đường dẫn mã trong bảng tính từ thư mục gốc `EatVibing-https`.

| ID | Chức năng | Những gì đã làm | Trạng thái | Màn hình / mã chính | Giới hạn hoặc việc tiếp theo |
| --- | --- | --- | --- | --- | --- |
| F01 | Trang chủ và điều hướng | Home, Navbar, liên kết tới Today, AI Assistant, Guideline, Community, Pricing và Profile. | Đã có — local | `/`; `frontend/src/App.jsx`, `_components/navbar.jsx`, `_components/hero.jsx` | Nghiệm thu trải nghiệm tổng thể khi tích hợp staging. |
| F02 | Thư viện công thức | Đọc catalog, kết hợp snapshot Supabase và dữ liệu TheMealDB; hiển thị ảnh và nguồn công thức. | Đã có — local | `/guide`; `backend/local-server.js`, `backend/assistant/catalog.js` | Catalog đóng gói hiện có 58 công thức; dữ liệu local hoặc server có thể bổ sung thêm. |
| F03 | Tìm kiếm món | Tìm theo tên, nguyên liệu, quốc gia và hướng dẫn; hỗ trợ tìm tiếng Việt không dấu. | Đã có — local | `frontend/src/_components/pages/Guide.jsx` | Chưa có bộ lọc độ khó/thời gian đầy đủ cho toàn bộ catalog. |
| F04 | Lọc vùng và quốc gia | Nhóm cuisine theo vùng; lấy lựa chọn và số lượng từ catalog; lưu bộ lọc trên URL. | Đã có — local | `frontend/src/cuisines.js`, `_components/pages/Guide.jsx` | Cuisine là thông tin từ nguồn công thức. |
| F05 | Phân trang và bố cục thư viện | 12 công thức/trang, số trang và khoảng kết quả; sidebar sticky; bố cục mobile. | Đã có — local | `/guide`, `/saved`; `frontend/src/guide.css` | Tiếp tục nghiệm thu trên thiết bị thật. |
| F06 | Trang chi tiết công thức | Nguyên liệu, các bước, ảnh, liên kết nguồn và ghi chú ảnh minh họa. | Đã có — local | `/recipes/:id`; `frontend/src/PremiumFeatures.jsx` | Thời gian nấu, số phần và dinh dưỡng chỉ có khi nguồn/metadata cung cấp. |
| F07 | Giao diện tiếng Anh | Tên cuisine, menu; bản dịch cho 30 công thức Supabase gốc; giữ dữ liệu gốc để tìm kiếm. | Đã có — local | `backend/english-recipes.js`, `backend/data/recipe-english.json` | Nội dung do người dùng nhập giữ ngôn ngữ đã nhập. |
| F08 | Gợi ý công thức từ catalog | Chọn theo nhóm món, cuisine, nguyên liệu cần tránh; ưu tiên nguyên liệu trong pantry. | Đã có — local | `/guide`; `/api/suggestions`; `backend/premium-service.js` | Đây là xếp hạng catalog; gợi ý hội thoại tự do cần provider AI. |
| F09 | Món yêu thích | Basic tối đa 10 món; Pro local lưu không giới hạn; giữ dữ liệu khi hạ gói. | Đã có — local | `/saved`; `/api/favorites` | Chưa chuyển dữ liệu visitor cũ sang tài khoản hosted. |
| F10 | Bộ sưu tập cá nhân | Tạo, đổi tên, xóa bộ sưu tập; thêm/bỏ món trong bộ sưu tập. | Đã có — local | `frontend/src/RecipeTools.jsx`; `/api/collections` | Luồng hiện tại thuộc Pro local. |
| F11 | Pricing Basic/Pro | Basic $0/tháng, Pro $10/tháng; bảng tính năng, FAQ và kích hoạt gói local. | Đã có — local | `/pricing`; `frontend/src/PremiumFeatures.jsx` | Chưa tích hợp thanh toán hoặc thuê bao thật. |
| F12 | Planner Basic | Bữa sáng, trưa, tối của ngày hiện tại theo Bangkok. | Đã có — local | `/planner`; `backend/premium-service.js` | Hosted dùng family planner; endpoint legacy trả 410. |
| F13 | Planner Pro theo tuần | 21 ô bữa ăn, nhiều tuần có ngày, chọn tay, tự tạo, khóa bữa và đổi một ô. | Đã có — local | `frontend/src/WeeklyPlanner.jsx`; `/api/planner/*` | Định danh legacy là visitor local; giới hạn nhóm món không phải mục tiêu dinh dưỡng đã duyệt. |
| F14 | Mẫu kế hoạch dùng lại | Đặt tên, lưu, áp dụng hoặc xóa kế hoạch; lưu sở thích đi kèm. | Đã có — local | `/api/templates`; `frontend/src/WeeklyPlanner.jsx` | Chưa có migration dữ liệu lên tài khoản thật. |
| F15 | Pantry và groceries legacy | Phân tích lượng nguyên liệu, cộng theo số lần ăn, trừ pantry, checklist và xuất văn bản. | Đã có — local | `backend/ingredients.js`, `backend/premium-service.js` | Đơn vị không tương thích hoặc lượng mơ hồ có cảnh báo để kiểm tra thủ công. |
| F16 | Điều chỉnh số phần và ghi chú | Xác nhận số phần gốc, nhãn loại bữa, ghi chú công thức và hiển thị lượng theo phần. | Đã có — local | `frontend/src/RecipeTools.jsx`; `/api/recipe-metadata`, `/api/notes` | Metadata số phần dùng chung trong catalog local; ghi chú thuộc visitor. |
| F17 | Quản trị catalog local | Tạo công thức local và ghi đè URL ảnh. | Đã có — local | `/admin`; `frontend/src/_components/pages/AdminDashboard.jsx` | Môi trường loopback/demo; chưa phải admin CMS hosted. |
| F18 | Danh tính và đăng nhập trợ lý | Supabase bearer token được kiểm tra bằng `getUser`; demo dùng cookie HttpOnly ngẫu nhiên có hạn. | Đã có — cần cấu hình | `backend/assistant/auth.js`, `backend/assistant-server.js`, `frontend/src/assistant/shared.jsx` | Đăng nhập thật, token hết hạn/thu hồi cần kiểm tra với staging. |
| F19 | Hồ sơ cá nhân | Tên, ngày sinh, múi giờ, mục tiêu, dị ứng, khẩu vị, cuisine, thiết bị bếp, lịch sinh hoạt và quyền chia sẻ. | Đã có — local | `/profile`; `frontend/src/assistant/Profile.jsx` | Người lớn tự quản lý; hồ sơ trẻ thuộc người giám hộ. |
| F20 | Đo lường và lịch sử | Metric/imperial, chiều cao/cân nặng/vòng eo, lịch sử theo ngày, sửa bản ghi và biểu đồ cân nặng. | Đã có — local | `/measurements`; `frontend/src/assistant/Profile.jsx`, `shared.jsx` | Chưa có quy trình retention/export/deletion hoàn chỉnh. |
| F21 | BMI và ước tính năng lượng | Tính BMI; phân loại người lớn 20+; công thức nghỉ Mifflin–St Jeor khi đủ điều kiện. | Đã có — có cổng kiểm soát | `backend/assistant/nutrition.js` | Mục tiêu năng lượng, hệ số hoạt động và điều chỉnh mục tiêu cần chính sách chuyên gia duyệt. |
| F22 | BMI theo tuổi trẻ em | Loader dữ liệu CDC, xác minh hash/version, cổng bật diễn giải theo tuổi và giới. | Đã có — có cổng kiểm soát | `backend/assistant/pediatric.js`, `load-policy.js` | Reference CDC và phê duyệt chuyên môn chưa hoàn tất; diễn giải vẫn tắt theo cấu hình mặc định. |
| F23 | Hộ gia đình | Tạo hộ, lời mời người lớn dùng một lần, chấp nhận, chuyển quyền sở hữu và rời hộ. | Đã có — local | `/family`; `backend/assistant/service.js` | Lời mời thật cần đăng nhập; chưa có luồng gửi email tự động. |
| F24 | Trẻ do người giám hộ quản lý | Tạo hồ sơ 2–17 tuổi, kiểm soát quyền ghi; chặn mục tiêu giảm/tăng cân trẻ; giữ hồ sơ khi giám hộ rời hộ. | Đã có — có cổng kiểm soát | `/members`, `/profile`; `backend/assistant/service.js` | Chuyển sang tài khoản người lớn ở tuổi 18 đang bị chặn để chờ quy trình riêng. |
| F25 | Check-in hằng ngày | Hoạt động cả ngày, dự định/đã hoàn thành, thời gian nấu, bữa tại nhà/ngoài/không rõ. | Đã có — local | `/today`; `/api/v1/check-ins` | Không tự chuyển vận động dự định thành hoàn thành. |
| F26 | Nhật ký bữa ăn và Today | Ghi món/số phần thực ăn; bữa không biết/skipped; tổng intake chỉ khi đủ bữa và dinh dưỡng đã duyệt. | Đã có — có cổng kiểm soát | `/today`; `/meal-logs`; `todayView` | Nhật ký thiếu thông tin không tạo tổng hoặc phép tính calo còn lại. |
| F27 | Planner gia đình nhiều món | Chọn nhiều món/bữa, chọn người tham gia và phần ăn thủ công; xem trước ngày trước khi lưu. | Đã có — local | `/family-planner`; `/api/v1/plan-proposals` | Phần ăn là số phần của công thức cần người dùng xác nhận. |
| F28 | Planner gia đình theo tuần | Xem trước 7 ngày, xác nhận nguyên tử, dùng lại tuần trước, khóa và đổi món. | Đã có — local | `/api/v1/weekly-proposals`, `/plans/lock` | Thay đổi hồ sơ/quyền/kế hoạch làm đề xuất cũ hết hiệu lực. |
| F29 | Pantry và groceries gia đình | Cộng phần ăn theo người tham gia được phép, trừ pantry, checklist theo chữ ký lượng, tải văn bản. | Đã có — local | `/api/v1/pantry`, `/groceries`; `backend/ingredients.js` | Quyền hiện tại được lọc lại; dị ứng còn hiệu lực vẫn được xác thực. |
| F30 | Nhập kế hoạch demo có xác nhận | Đọc JSON đã chọn, chỉ nhập công thức/ngày/phần ăn; preview trước lưu cả tuần. | Đã có — local | `/api/v1/demo-imports`; `frontend/src/assistant/Planner.jsx` | Không nhập danh tính, hồ sơ riêng tư hoặc visitor/account ID. |
| F31 | AI Assistant hội thoại | Ngôn ngữ Việt/Anh, chọn thành viên, trạng thái kết nối, lịch sử, fallback khi provider lỗi. | Đã có — cần cấu hình | `/chat`; `backend/assistant/provider.js`, `service.js` | Cần provider được duyệt, pilot access và đồng ý của người được chọn. |
| F32 | Hành động từ chat | Nhận diện yêu cầu ngày/ngày mai/ngày cụ thể; preview kế hoạch/đổi món; yêu cầu xác nhận trước ghi. | Đã có — local | `backend/assistant/intents.js`, `service.js` | Yêu cầu tuần hoặc thứ chưa rõ ngày chuyển sang chọn ngày/tuần. |
| F33 | Giới hạn câu trả lời AI | Lọc văn bản dinh dưỡng có số và lời khẳng định đã lưu/thay đổi; dùng dữ liệu/thẻ server. | Đã có — có cổng kiểm soát | `backend/assistant/safety.js`, `service.js` | Bộ lọc hiện tại cần được đánh giá bằng provider thật và chuyên gia. |
| F34 | Duyệt dinh dưỡng và nguồn món | Reviewer allowlist; nhập công thức có nguồn; nhập dinh dưỡng/phần, allergens/diet metadata; đếm readiness. | Đã có — cần cấu hình | `/nutrition-review`; `/api/v1/nutrition/*`, `/recipe-imports` | Catalog đóng gói có 0 món verified; hàng chờ có 60 ứng viên, mục tiêu 30 Việt + 30 quốc tế. |
| F35 | Tra USDA FoodData Central | Tìm thực phẩm qua API cho reviewer được phép. | Đã có — cần cấu hình | `backend/assistant/fdc.js`; `/nutrition/foods` | Cần USDA key; kết quả tìm kiếm không tự chứng nhận công thức. |
| F36 | Feedback và tổng kết tuần | Like/dislike kèm lý do; recap số bữa/check-in; sử dụng feedback khi xếp hạng món. | Đã có — local | `/api/v1/feedback`, `/summary`; `frontend/src/assistant/Planner.jsx` | Chưa phải hệ thống rating công khai cho toàn bộ website. |
| F37 | Telemetry pilot | Tổng trạng thái provider, p95, tokens, xác nhận kế hoạch và lý do feedback; quyền reviewer. | Đã có — local | `/api/v1/pilot/metrics` | Giới hạn 1.000 sự kiện vận hành; chưa có audit log bền vững hoặc tính tiền token. |
| F38 | Lưu trữ và migration | SQLite local; Supabase store CAS cùng contract; migration trợ lý với RLS và quyền service-only. | Đã có — cần cấu hình | `backend/assistant/store.js`; `supabase/migrations/202610030001_family_assistant.sql` | Chưa xác nhận áp dụng migration thật; adapter pilot dùng một document chung. |
| F39 | Schema Premium hosted | Bản nháp bảng profile/subscription/favorites/planner/pantry/collections. | Bản nháp | `supabase/migrations/202610020001_premium.sql`, `202610020002_planning_draft.sql` | Cần endpoint giao dịch, quyền ghi và migration dữ liệu trước release. |
| F40 | Community feed | Feed một cột, avatar/tác giả, story, ảnh, topics, search, newest/popular, mobile navigation. | Đã có — local | `/community`; `frontend/src/_components/pages/Community.jsx`, `community.css` | Dữ liệu mẫu và localStorage; chưa có social backend. |
| F41 | Tương tác Community | Đăng story với title tùy chọn, reply, like, save, repost, copy link, nhóm/challenge, reset dữ liệu. | Đã có — local | `Community.jsx`, `communityData.js`; `frontend/README.community.md` | Bài tự đăng/repost chỉ trong browser; link không xuất bản nội dung sang thiết bị khác. |
| F42 | Kiểm tra hồi quy | Bộ kiểm tra backend, eval offline Việt/Anh, ESLint chọn lọc và Vite build. | Đã có — local | `backend/tests`, `backend/assistant/evaluate.js`, scripts trong `package.json` | Kiểm tra local không thay thế nghiệm thu dịch vụ thật. |

## 3. Những lỗi đã sửa trong đợt 04/10/2026

| ID | Mức ưu tiên | Lỗi trước khi sửa | Cách xử lý đã làm | Điều kiện nghiệm thu |
| --- | --- | --- | --- | --- |
| FIX01 | P1 | Một người đồng ý AI có thể làm kế hoạch/phần ăn của người khác bị gửi provider. | Tạo ngữ cảnh riêng cho người được chọn; bỏ định danh hộ, phần ăn và tổng dinh dưỡng của người khác; món chỉ dành cho người khác không được gửi. | Provider mock chỉ nhận món/phần và tổng của người được chọn; người chưa đồng ý không gọi provider. |
| FIX02 | P1 | Dị ứng hoặc hồ sơ đổi khi chờ provider nhưng phản hồi cũ vẫn trả về. | Gắn dấu ngữ cảnh/hồ sơ, đọc catalog hiện tại trước khi ghi, so sánh lại trong thao tác CAS; dữ liệu đổi trả 409 để gửi lại. | Các thay đổi allergies, avoid, diet, specialCare, consent, check-in, plan và catalog đều loại bỏ phản hồi đang chờ; không ghi phản hồi cũ vào lịch sử. |
| FIX03 | P1 | Lịch sử từ hồ sơ cũ có thể được dùng lại cho AI sau khi đổi dị ứng. | Chỉ dùng lịch sử cùng người, quyền và dấu ngữ cảnh hiện tại; bản ghi cũ thiếu dấu không đưa sang provider. | Hội thoại cùng ngữ cảnh tái dùng lịch sử; hồ sơ đổi hoặc lịch sử legacy làm history provider rỗng. |
| FIX04 | P2 | Thành viên rút chia sẻ/rời hộ khiến groceries hoặc bữa khóa bị kẹt. | Dùng cùng hàm lọc kế hoạch cho reads, groceries, proposal, xác nhận và reuse; bỏ món không còn người được phép; cho mở khóa để sửa. | Người rút quyền/rời hộ không còn trong kết quả; lượng mua và checklist cập nhật; vẫn tạo/xác nhận ngày/tuần được. |
| FIX05 | P2 | Phản hồi xác nhận một bữa có thể giữ khẩu phần cũ ở bữa khác chưa sửa. | Chiếu quyền lại trên toàn kế hoạch trả về sau xác nhận. | Xác nhận breakfast không trả phần của người đã rút quyền trong dinner cũ. |

Mã sửa: [backend/assistant/service.js](../backend/assistant/service.js). Kiểm tra hồi quy: [backend/tests/assistant.test.js](../backend/tests/assistant.test.js). Các sửa đổi đang ở working tree.

## 4. Bảng kế hoạch công việc tiếp theo

Ưu tiên dưới đây dựa trên tình trạng mã và tài liệu hiện tại. Chưa ấn định thời hạn hoặc người phụ trách khi chưa có nguồn lực được xác nhận.

| ID | Ưu tiên | Công việc | Trạng thái | Phụ thuộc | Tiêu chí hoàn tất |
| --- | --- | --- | --- | --- | --- |
| P01 | P1 | Nghiệm thu auth/database trên staging | Chưa hoàn tất | Supabase staging, cấu hình server, migration | Đăng nhập thật; token hết hạn/thu hồi; hai hộ độc lập; lời mời và CAS hoạt động đúng. |
| P02 | P1 | Duyệt chính sách dinh dưỡng | Chưa hoàn tất | Chuyên gia đủ điều kiện, `docs/nutrition-policy-review.md` | Có người duyệt, phiên bản, ngày, phạm vi áp dụng và cấu hình tương ứng; chỉ bật mục tiêu sau duyệt. |
| P03 | P1 | Hoàn thiện dữ liệu 30 món Việt + 30 món quốc tế | Chưa hoàn tất | Nguồn, lượng nguyên liệu, yield/phần ăn, reviewer | Từng món verified có dinh dưỡng/phần, nguồn, allergen/diet metadata và người duyệt; readiness đạt 30/30. |
| P04 | P1 | Duyệt xử lý dữ liệu và nghiệm thu provider AI thật | Chưa hoàn tất | Provider/key, đồng ý xử lý dữ liệu, bộ tình huống độc lập | Ít nhất 100 ca Việt/Anh được chấm; quyền, dị ứng, trẻ, sai dữ liệu và provider lỗi đạt yêu cầu trước pilot. |
| P05 | P1 | Quy trình đồng ý, retention, export và deletion | Chưa hoàn tất | Chính sách sản phẩm và mô hình dữ liệu | Người dùng hiểu và quản lý đồng ý; xuất/xóa dữ liệu có kiểm tra quyền và dấu vết vận hành. |
| P06 | P1 | Chuyển hồ sơ trẻ sang người lớn ở tuổi 18 | Chưa hoàn tất | Danh tính, đồng ý và xử lý dữ liệu guardian | Có luồng xác nhận rõ ràng; không tự chuyển quyền hoặc mở dữ liệu riêng tư. |
| P07 | P2 | Tách document pilot thành dữ liệu theo thực thể | Chưa hoàn tất | Thiết kế bảng household/member/profile/plan | Có index, RLS theo thực thể, migration/backfill, kiểm tra tải và tranh chấp ghi. |
| P08 | P2 | Thanh toán và entitlement hosted | Chưa hoàn tất | Nhà cung cấp thanh toán, backend tin cậy | Billing thật, webhook idempotent, quyền được kiểm tra server; nâng/hạ gói có kiểm tra giữ dữ liệu. |
| P09 | P2 | Chuyển dữ liệu legacy sang tài khoản | Chưa hoàn tất | P01, mô hình hosted favorites/collections/planner | Người dùng xem trước và đồng ý nhập; không nhận account/visitor ID từ file làm quyền sở hữu. |
| P10 | P2 | Backend Community và tài khoản thật | Chưa hoàn tất | Auth, schema posts/comments/likes/groups, quyền và moderation | Bài đăng/tương tác hoạt động giữa thiết bị; permalink mở bài thật; quyền sửa/xóa được kiểm tra. |
| P11 | P2 | Tối ưu menu cả ngày/nhiều món theo dinh dưỡng | Chưa hoàn tất | P02, P03 | Dùng dữ liệu duyệt và ràng buộc cả ngày; xử lý bữa không rõ; kiểm tra tổng dinh dưỡng nhiều món. |
| P12 | P2 | Bổ sung bộ lọc thời gian/độ khó và thông tin công thức | Chưa hoàn tất | Metadata có nguồn/được xác nhận | Chỉ hiển thị giá trị có căn cứ; bộ lọc, trạng thái thiếu dữ liệu và phân trang nhất quán. |
| P13 | P2 | Log vận hành, rate limit và đo tải | Chưa hoàn tất | Staging/pilot, chính sách logging | Audit bền vững; quota provider; đo p95, tải đồng thời và chi phí theo mức giá đã xác nhận. |
| P14 | P3 | Tối ưu bundle và dữ liệu trình duyệt | Chưa hoàn tất | Kiểm tra đường dẫn lazy loading và dependency | Giảm chunk JS chính, cập nhật Browserslist và kiểm tra build sau thay đổi. |
| P15 | P2 | Nghiệm thu UI và pilot 10–20 gia đình | Chưa hoàn tất | P01–P06, dữ liệu và provider đã duyệt | Desktop/mobile và luồng thực tế được kiểm tra; đo check-in, phản hồi, lỗi và chất lượng gợi ý. |

## 5. Nhật ký công việc

| Ngày | Công việc ghi nhận | Bằng chứng | Trạng thái |
| --- | --- | --- | --- |
| 02/10/2026 | Bổ sung Free/Pro local, planner, favorites, groceries và các chức năng premium. | Commit `74d23bd`; `README.local.md`; `backend/premium-service.js` | Đã có trong Git. |
| 03/10/2026 | Bổ sung trợ lý dinh dưỡng gia đình, Today/Profile/Family/Chat/Planner, reviewer và migration; cập nhật UI thư viện/Pricing. | Commit `c1fb019`; `README.assistant.md` | Đã có trong Git; dịch vụ thật và chuyên môn còn việc ở mục 4. |
| 04/10/2026 | Rà soát diff Community và các luồng auth, consent, hồ sơ, kế hoạch, dinh dưỡng, migration. | Kết quả rà soát trong cuộc trao đổi; các lỗi ở mục 3 | Đã rà soát mã. |
| 04/10/2026 | Sửa quyền dữ liệu provider, loại phản hồi/lịch sử cũ, khôi phục luồng planner khi quyền tham gia thay đổi. | `backend/assistant/service.js`; `backend/tests/assistant.test.js` | Đã sửa trong working tree. |
| 04/10/2026 | Ghi nhận Community feed và tương tác đang có; đối chiếu ảnh desktop/mobile. | `frontend/README.community.md`; `artifacts/community/` | Thay đổi Community có sẵn trong working tree. |
| 04/10/2026 | Tạo bảng chức năng, kế hoạch, nhật ký và kết quả kiểm tra này. | `docs/ke-hoach-he-thong.md` | Hoàn tất tài liệu. |

## 6. Kết quả kiểm tra đợt này

| Kiểm tra | Phạm vi | Kết quả |
| --- | --- | --- |
| `npm test` trong backend | Trợ lý và Premium; SQLite riêng; HTTP server tạm; provider/auth mock | 43/43 kiểm tra đạt (gồm subtest); 0 lỗi, 0 bỏ qua. |
| `npm run eval:assistant` | Bộ deterministic offline về dinh dưỡng, quyền và phản hồi Việt/Anh | 107 ca đạt; provider thật chưa được đánh giá. |
| ESLint chọn lọc frontend | `src/assistant`, App, LocalProvider, API clients, Navbar, Community và communityData | Đạt; không có lỗi. |
| `npm run build` trong frontend | Build production Vite | Đạt; JS chính khoảng 683 kB trước gzip, có cảnh báo chunk lớn và Browserslist cũ. |
| Catalog đóng gói / review queue | Đọc dữ liệu đi kèm repo | 58 công thức; 0 verified trong catalog đóng gói; 60 ứng viên đang chờ duyệt, mục tiêu 30 Việt + 30 quốc tế. |
| `git diff --check` | Thay đổi tracked trong working tree | Đạt; có cảnh báo Git chuyển LF sang CRLF. |
| Supabase/provider thật, migration thật, nghiệm thu browser mới | Môi trường bên ngoài bộ kiểm tra local | Chưa chạy trong đợt sửa này. |

## 7. Quy tắc cập nhật bảng

1. Khi thêm hoặc sửa một chức năng, cập nhật dòng F tương ứng: hành vi, phạm vi chạy và giới hạn.
2. Khi hoàn tất công việc P, bổ sung bằng chứng kiểm tra rồi đổi trạng thái; giữ ID để truy vết.
3. Khi sửa lỗi, thêm dòng FIX với tình huống trước/sau và kiểm tra hồi quy.
4. Thêm một dòng nhật ký theo ngày; kết quả test/build chỉ ghi theo lần thực sự đã chạy.
5. Có mã hoặc migration chưa áp dụng thì tiếp tục ghi trạng thái local/cần cấu hình/bản nháp; deployment phải có bằng chứng riêng.

Tài liệu liên quan: [hướng dẫn local](../README.local.md), [trợ lý gia đình](../README.assistant.md), [Community](../frontend/README.community.md), [yêu cầu ban đầu](../function.md), [việc chuyên gia cần duyệt](nutrition-policy-review.md).
