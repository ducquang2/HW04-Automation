# AI Audit Report – HW04

I use AI tools for the following tasks.

Công cụ: Claude Code (model Claude Opus 5.5), chạy trong VS Code.

## FR-04 Hồ sơ cá nhân

### Bước 1 – Chọn test case

- Thời gian: 2026-11-17 15:07
- Prompt: `choosing 12 test cases from HW02 features/FR-04/`
- Ngữ cảnh AI tự đọc: `HW02/features/FR-04/domain.md`, `bva.md`, `gap-analysis.md`, đặc tả FR-04 trong README EShop, `frontend-web/src/pages/Profile.jsx`.
- Output:

HW02 có 18 test case (10 Domain + 8 BVA). 6 case BVA trùng dữ liệu với case Domain nên bỏ, còn đúng 12 case không trùng:

| # | ID HW02 | Nội dung | Dữ liệu | Expected theo đặc tả | Tầng | Dự đoán |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | D-04-01 | SĐT 10 số bắt đầu 0 | `0912345678` | Cập nhật thành công | UI | Fail |
| 2 | D-04-02 | SĐT 11 số bắt đầu 0 | `09123456789` | Cập nhật thành công | UI | Fail |
| 3 | D-04-03 | SĐT không bắt đầu bằng 0 | `9123456789` | Báo không hợp lệ | UI | Fail |
| 4 | D-04-04 | SĐT 9 số | `091234567` | Báo không hợp lệ | UI | Pass |
| 5 | D-04-05 | SĐT 12 số | `091234567890` | Báo không hợp lệ | UI | Pass |
| 6 | D-04-06 | SĐT có chữ | `09ab345678` | Báo không hợp lệ | UI | Pass |
| 7 | D-04-07 | Họ Tên rỗng | `""` | Không gửi form, ô báo thiếu | UI | Pass |
| 8 | D-04-08 | Cập nhật địa chỉ | `123 Nguyen Trai` + SĐT `0912345678` | Thành công, tải lại vẫn còn | UI | Fail |
| 9 | D-04-09 | Ô Email bị khóa | – | Ô bị disabled, giá trị `test@eshop.com` | UI | Pass |
| 10 | D-04-10 | Gửi `role: "admin"` | API `PUT /api/users/me` | Role vẫn là `user` | API | Fail |
| 11 | B-04-06 | SĐT rỗng | `""` | Báo không hợp lệ | UI | Pass |
| 12 | B-04-08 | Họ Tên 1 ký tự | `A` + SĐT `0912345678` | Cập nhật thành công | UI | Fail |

Case bị loại (trùng dữ liệu với case Domain): B-04-01 = D-04-04, B-04-02 = D-04-01, B-04-03 = D-04-02, B-04-04 = D-04-05, B-04-05 = D-04-03, B-04-07 = D-04-07.

Ghi chú:
- Case 4–6 ở HW02 chạy qua API (backend không kiểm tra SĐT nên Fail). HW04 chạy qua UI nên regex của frontend chặn trước, dự đoán Pass. Lỗi backend đã có bug ở HW02.
- Case 8 và 12 dùng SĐT đúng đặc tả nên sẽ đỏ do lỗi regex của case 1, không phải do địa chỉ hay họ tên.
- Case 10 không có ô `role` trên giao diện nên chỉ test được qua API.

### Bước 2 – Khảo sát giao diện, chọn locator

- Thời gian: 2026-11-17 15:14
- Prompt: `finding locators on the Profile page`
- Ngữ cảnh AI tự đọc: `frontend-web/src/pages/Profile.jsx`, `App.jsx` (link trên Header), `context/AuthContext.jsx`.
- Output (đã chạy thử từng locator trên Chromium, mỗi locator khớp đúng 1 phần tử):

| Phần tử | Locator | Lý do chọn |
| --- | --- | --- |
| Link vào Hồ sơ trên Header | `getByRole('link', { name: /^Chào, / })` | Link không có id; tên hiển thị đổi theo tên user nên dùng regex phần đầu |
| Tiêu đề trang | `getByRole('heading', { name: 'Hồ sơ của bạn' })` | Dùng để chờ trang tải xong |
| Ô Email | `label:has-text("Email") + input` | `label` không gắn `for`, input không có id/name, nên lấy input ngay sau label |
| Ô Họ Tên | `label:has-text("Họ Tên") + input` | Như trên |
| Ô Số điện thoại | `label:has-text("Số điện thoại") + input` | Như trên; không dùng placeholder `VD: 0912345678` vì placeholder có thể đổi |
| Ô Địa chỉ | `getByPlaceholder('Nhập địa chỉ của bạn')` | Là `textarea` nên `label + input` không khớp; placeholder là duy nhất |
| Nút Cập nhật | `getByRole('button', { name: 'Cập nhật' })` | Tên nút duy nhất trên trang |
| Chưa đăng nhập | `getByText('Vui lòng đăng nhập')` | Trang chỉ hiện dòng này khi chưa có user |

Ghi chú:
- `getByLabel('Họ Tên')` trả về 0 phần tử vì label không liên kết với input.
- Kết quả cập nhật hiện bằng `alert()` ("Cập nhật thành công!" / "Số điện thoại không hợp lệ..."), nên phải bắt `page.on('dialog')` trước khi bấm nút.
- Token lưu trong `localStorage` và user được tải lại từ `GET /api/users/me`, nên sau khi đăng nhập có thể `goto('/profile')` và `reload()` mà không mất đăng nhập.

### Bước 3 – Thiết kế file dữ liệu

- Thời gian: 2026-11-17 15:16
- Prompt: `Thiết kế data/FR-xx.json cho 12 case đã chọn: mỗi dòng có id (TC-FRxx-<ID HW02>), title, dữ liệu nhập và expected viết theo đặc tả, không theo hành vi hiện tại của app. Chỉ ra case nào cần trường riêng.`
- Output: file `data/FR-04.json` (12 dòng). Cấu trúc chung: `id`, `title`, `layer` (`ui`/`api`), `input` (chỉ các ô cần đổi: `name`, `phone`, `address`), `expected`.

`expected` có 5 giá trị, mỗi giá trị là một nhánh assert trong script:

| expected | Ý nghĩa theo đặc tả | Case |
| --- | --- | --- |
| `success` | Hồ sơ được lưu với giá trị mới | D-04-01, D-04-02, D-04-08, B-04-08 |
| `invalid-phone` | Báo SĐT không hợp lệ, không lưu | D-04-03, D-04-04, D-04-05, D-04-06, B-04-06 |
| `missing-name` | Form không gửi được vì thiếu Họ Tên | D-04-07 |
| `email-locked` | Ô Email bị khóa, hiện đúng email | D-04-09 |
| `role-unchanged` | Gửi `role` qua API nhưng role không đổi | D-04-10 |

Case cần trường riêng:
- D-04-08: `checkAfterReload: true`, tải lại trang rồi kiểm tra địa chỉ còn đó.
- D-04-09: không có `input`; thêm `expectedEmail`.
- D-04-10: chạy tầng API nên dùng `body` (thân request gửi `PUT /api/users/me`) thay cho `input`; thêm `expectedRole`.
- D-04-07, D-04-08, B-04-08: `input` có kèm `phone: "0912345678"`. SĐT của user test ban đầu trống, mà form bắt buộc SĐT hợp lệ mới lưu, nên phải điền một SĐT đúng đặc tả. Vì app từ chối SĐT bắt đầu bằng 0 (lỗi của D-04-01), D-04-08 và B-04-08 dự đoán sẽ đỏ do SĐT chứ không do địa chỉ hay họ tên.

Expected không ghi nguyên văn câu thông báo vì đặc tả FR-04 không quy định câu chữ; script sẽ kiểm tra kết quả lưu qua `GET /api/users/me`.

### Bước 4 – Khung script

- Thời gian: 2026-11-17 15:31
- Prompt: `Viết tests/FR-xx.spec.js đọc dữ liệu từ data/FR-xx.json, dùng helper trong helpers/common.js, có bước dọn dữ liệu bằng API (beforeEach/afterEach) để chạy lại trên browser khác không bị lỗi. Chưa cần assertion đầy đủ. Chạy thử trên Chromium.`
- Output:
  - `helpers/common.js`: thêm `apiToken` (đăng nhập qua `POST /api/login`) và `resetProfile` (gọi `PUT /api/users/me` trả hồ sơ về seed: tên "Test User", SĐT và địa chỉ `null`, `role: "user"`). Phải gửi đủ mọi cột vì backend ghi đè cả cột không gửi thành `null`, và phải gửi `role` để gỡ hậu quả của D-04-10.
  - `tests/FR-04.spec.js`: vòng lặp tạo 12 test từ `data/FR-04.json`; `beforeEach` và `afterEach` đều gọi `resetProfile`; nhánh `api` gửi `c.body`, nhánh `ui` đăng nhập, vào Hồ sơ qua link Header, điền `c.input`, bấm Cập nhật và ghi nội dung alert vào annotation.
- Kết quả chạy Chromium:
  - Lần 1: 8/12 test treo 30 giây rồi fail ở `locator.click`. Nguyên nhân: AI viết code chờ `click()` xong rồi mới `accept()` dialog, trong khi alert "SĐT không hợp lệ" bật đồng bộ ngay lúc bấm nên `click()` không bao giờ xong. AI cũng viết nhầm `testInfo()` (không tồn tại, đúng là `test.info()`).
  - Sửa: accept dialog ngay trong `.then` của `page.waitForEvent('dialog')`, độc lập với `click()`.
  - Lần 2: 12/12 chạy hết trong 8,2 giây (chưa có assertion nên đều xanh). Sau khi chạy, `GET /api/users/me` trả về đúng seed, kể cả `role: "user"`.
