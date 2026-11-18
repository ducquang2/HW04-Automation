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

### Bước 5 – Thêm assertion

- Thời gian: 2026-11-17 15:40
- Prompt: `Thêm assertion cho từng loại expected trong FR-xx.spec.js, dùng ít nhất 3 kiểu khác nhau (URL, hiển thị, nội dung, giá trị ô, dialog, dữ liệu qua API). Không dùng waitForTimeout. Không sửa expected để test xanh.`
- Output: thêm helper `getMe` (đọc hồ sơ qua `GET /api/users/me`) và assertion cho 5 nhánh `expected`:

| expected | Assertion | Kiểu |
| --- | --- | --- |
| `success` | alert chứa "thành công"; mỗi trường trong `input` đã lưu đúng trong database; D-04-08 tải lại trang rồi `toHaveValue` | Dialog, dữ liệu qua API, giá trị ô |
| `invalid-phone` | alert chứa "không hợp lệ"; `phone` trong database vẫn `null` | Dialog, dữ liệu qua API |
| `missing-name` | `validity.valueMissing` của ô Họ Tên là `true`; URL vẫn `/profile`; không có alert; tên trong database vẫn "Test User" | Trạng thái ô, URL, dữ liệu qua API |
| `email-locked` | `toBeDisabled()` và `toHaveValue('test@eshop.com')` | Thuộc tính, giá trị ô |
| `role-unchanged` | `role` trong database vẫn là `user` | Dữ liệu qua API |

Tổng cộng 6 kiểu assertion: dialog, dữ liệu qua API, giá trị ô, thuộc tính (`disabled`), URL, trạng thái validity. Không có `waitForTimeout`; riêng chờ alert dùng `waitForEvent` với timeout 3 giây để case thiếu Họ Tên (không có alert) không treo.

- Kết quả Chromium: 6 pass, 6 fail. Cả 6 fail đều do lỗi EShop, khớp dự đoán ở bước 1:

| Case | Thực tế |
| --- | --- |
| D-04-01, D-04-02 | Alert "Số điện thoại không hợp lệ. Vui lòng nhập đúng 9-10 chữ số." với SĐT đúng đặc tả |
| D-04-03 | Alert "Cập nhật thành công!" với SĐT không bắt đầu bằng 0 |
| D-04-08, B-04-08 | Không lưu được vì cùng lỗi SĐT của D-04-01 |
| D-04-10 | `role` trong database thành `admin` |

### Bước 6 – Chạy 3 browser, phân loại test đỏ

- Thời gian: 2026-11-17 15:46
- Prompt: `Chạy FR-xx.spec.js trên chromium, firefox, webkit. Với mỗi test đỏ, xác định lỗi script hay lỗi EShop (dẫn chứng bằng code hoặc ảnh). Sửa lỗi script; lỗi EShop thì giữ đỏ và liệt kê làm bug.`
- Kết quả: mỗi browser 6 pass, 6 fail (tổng 18 fail / 36). Cùng 6 case fail với cùng thông báo lỗi trên cả 3 browser, nên không có lỗi riêng của browser nào.
- Phân loại: cả 18 fail đều là lỗi EShop, không có lỗi script cần sửa ở bước này.

| Case đỏ | Thực tế | Dẫn chứng trong code | Bug (issue HW02) |
| --- | --- | --- | --- |
| D-04-01, D-04-02 | Alert "Số điện thoại không hợp lệ. Vui lòng nhập đúng 9-10 chữ số." với `0912345678`, `09123456789` | `Profile.jsx:43` regex `/^[1-9][0-9]{8,9}$/` cấm số 0 đầu và chỉ nhận 9–10 chữ số, trái đặc tả "bắt đầu bằng 0, 10–11 chữ số" | BUG-04-01 ([#2](https://github.com/kqanGit/eshop-sut/issues/2)) |
| D-04-08, B-04-08 | Không lưu được địa chỉ / tên 1 ký tự vì SĐT đúng đặc tả bị từ chối | Cùng `Profile.jsx:43` | BUG-04-01 ([#2](https://github.com/kqanGit/eshop-sut/issues/2)) |
| D-04-03 | Alert "Cập nhật thành công!" với `9123456789` | Cùng regex `Profile.jsx:43` cho phép số đầu 1–9 | BUG-04-02 ([#3](https://github.com/kqanGit/eshop-sut/issues/3)) |
| D-04-10 | `role` trong database thành `admin` | `backend/server.js:119-127` lấy `role` từ body và `UPDATE ... role = ?` nếu có | BUG-04-04 ([#5](https://github.com/kqanGit/eshop-sut/issues/5)) |

Ghi chú:
- Alert không xuất hiện trong ảnh chụp lúc fail (Playwright chụp sau khi dialog đã đóng), nên dẫn chứng chính là nội dung alert trong thông báo lỗi và annotation `alert` của từng test.
- BUG-04-03 (backend không kiểm tra SĐT) không lộ ra ở tầng UI vì regex frontend chặn trước, nên D-04-04, D-04-05, D-04-06 xanh. Đây là giới hạn của việc chạy các case này qua UI.
- Cả 3 bug đã có issue từ HW02; khi log bug HW04 sẽ mở issue mới nhãn `HW04`, dẫn link issue cũ.

### Bước 7 – Review

- Thời gian: 2026-11-18 10:33
- Prompt: `Review lại toàn bộ FR-04.spec.js và data, lập bảng "AI sai gì / thiếu gì / vì sao / đã sửa thế nào" dựa trên lỗi thật trong các bước trước, kèm commit tương ứng.`
- Output: đọc lại `tests/FR-04.spec.js` và `data/FR-04.json`, phát hiện thêm 1 lỗi assertion (dòng 3 dưới đây) và sửa ở commit `5fb63f7`. Bảng review:

| # | Bước | AI sai / thiếu gì | Vì sao | Đã sửa thế nào | Commit |
| --- | --- | --- | --- | --- | --- |
| 1 | 4 | Chờ `click()` xong mới `accept()` alert, 8/12 test treo 30 giây ở `locator.click` | AI không để ý alert "SĐT không hợp lệ" gọi đồng bộ ngay trong `onSubmit`, chặn `click()` cho tới khi dialog đóng | Accept dialog ngay trong `.then` của `page.waitForEvent('dialog')`, không phụ thuộc `click()` | `f5e2f0e` |
| 2 | 4 | Gọi `testInfo()` không tồn tại | Nhầm với tham số `testInfo` của hook; trong thân test phải dùng `test.info()` | Đổi thành `test.info()` | `f5e2f0e` |
| 3 | 5 | Assert câu chữ alert bằng `expect` thường, đặt trước kiểm tra database. Khi alert sai, test dừng luôn nên report không cho thấy dữ liệu đã bị lưu sai (D-04-03 lưu `9123456789` nhưng report không ghi) | Câu chữ alert AI lấy từ code app (hành vi hiện tại), trong khi đặc tả chỉ nói về việc lưu hay không; AI xếp assertion phụ lên trước assertion chính | Đổi assertion câu chữ thành `expect.soft`, database luôn được kiểm tra; D-04-03 giờ báo cả "alert sai" lẫn "phone đã lưu `9123456789`" | `5fb63f7` |
| 4 | 3 | Ghi chú lý do D-04-07/08 và B-04-08 kèm SĐT là "để lỗi chỉ đến từ trường đang test", ngược với thực tế (SĐT đúng đặc tả bị app từ chối nên test đỏ vì SĐT) | AI viết lý do theo ý định thiết kế, chưa đối chiếu với lỗi regex đã biết ở bước 1 | Sửa lại ghi chú trong audit trước khi commit: dự đoán D-04-08, B-04-08 đỏ do SĐT | `f5e2f0e` |
| 5 | 1 | Chọn chạy D-04-04/05/06 qua UI nên không bắt được BUG-04-03 (backend không kiểm tra SĐT); 3 test này xanh | Regex frontend chặn trước nên request không tới backend | Không sửa: giữ theo lựa chọn ở bước 1, ghi vào gap analysis của report | – |
| 6 | 2 | (Tránh được) `getByLabel('Họ Tên')` trả về 0 phần tử | Label không gắn `for`, input không có id | Đã chạy thử từng locator trước khi viết script, dùng `label:has-text(...) + input` và placeholder | – |

Những điểm đã kiểm tra và không cần sửa:
- Không còn `waitForTimeout`; timeout 3 giây của `waitForEvent('dialog')` chỉ dùng để xác nhận "không có alert" ở D-04-07.
- `beforeEach` và `afterEach` cùng gọi `resetProfile`, sau khi chạy hồ sơ về đúng seed kể cả `role`.
- `getMe` gọi sau khi đã nhận alert, mà alert thành công chỉ bật sau khi `PUT` xong, nên không bị đọc database quá sớm.
- `expected` trong data đều theo đặc tả FR-04, không có giá trị nào sửa cho khớp với app.

## Agent Skill

- Thời gian: 2026-11-18 10:36
- Prompt: `Viết skills/<tên>/SKILL.md từ 7 bước đã làm với FR-04: đầu vào, các bước, điểm dừng để mình review, định dạng đầu ra, và các bẫy của EShop đã gặp.`
- Output: `skills/eshop-playwright-feature/SKILL.md` gồm: bảng đầu vào; quy tắc chung (expected theo đặc tả, data JSON riêng, không `waitForTimeout`, ghi audit, format commit); 7 bước, mỗi bước kết thúc bằng một điểm dừng cho người review; bảng file đầu ra; 10 bẫy EShop gặp khi làm FR-04 (label không gắn input, alert đồng bộ làm `click()` treo, `PUT /api/users/me` ghi đè cột, backend nhận `role`, bong bóng HTML5, ảnh chụp không có alert...).

### Cập nhật sau FR-09

- Thời gian: 2026-11-18 11:25
- Công cụ: Claude Code subagent
- Prompt: `Cập nhật skills/eshop-playwright-feature/SKILL.md với các bẫy và bài học mới gặp khi làm FR-09.`
- Output: thêm 6 bẫy vào bảng "Bẫy của EShop đã gặp": giỏ hàng chỉ nằm trong React state (đi bằng `goToCheckout`), backend/frontend in số tiền khác nhau (so số đã bỏ ký tự, giữ dấu `-`; câu chữ `expect.soft`), `count()` không tự chờ, sửa ô Tổng tiền/ô mã xóa kết quả cũ, lượt dùng coupon không có API xóa (user tạm, xóa id > 2 bằng token admin, không bấm thanh toán bằng user test), sản phẩm rẻ nhất 4.000.000 ₫ (test biên sửa ô Tổng tiền, dựa vào lỗi FR-08). Bước 5: assertion phụ đặt trước assertion chính cũng dùng `expect.soft`; thêm ý bước chuẩn bị dữ liệu qua API phải assert response ok. Bước 6: chạy chính thức không thêm `--reporter=list`.

## FR-09 Mã giảm giá

### Bước 1 – Chọn test case

- Thời gian: 2026-11-18 10:42
- Công cụ: Claude Code subagent (dùng skill eshop-playwright-feature)
- Prompt: `Đọc đặc tả FR-09 trong README EShop và test case HW02 ở HW02-20120359/features/FR-09/. Chọn 12 case tự động hóa được bằng Playwright, bỏ case trùng dữ liệu, nêu lý do loại từng case còn lại. Ghi tầng chạy (UI/API) và dự đoán Pass/Fail. Sản phẩm rẻ nhất 4.000.000 ₫ nên test biên phải sửa ô Tổng tiền ở checkout; ghi rõ test dựa vào lỗi này của FR-08.`
- Ngữ cảnh AI tự đọc: `HW02/features/FR-09/domain.md`, `bva.md`, `bugs.md`, `gap-analysis.md`, đặc tả FR-08 và FR-09 trong README EShop, `frontend-web/src/pages/Checkout.jsx`, `frontend-web/src/App.jsx`, `backend/server.js` (route `/api/apply-coupon`, `/api/coupon-usage`, `/api/register`), `backend/database.js` (seed coupon, sản phẩm, user). Gọi thử `POST /api/apply-coupon` với SAVE10/VIP100/BIGBUY để biết user test chưa dùng mã nào.
- Output:

HW02 có 17 test case (11 Domain + 6 BVA). 5 case trùng dữ liệu nên bỏ, còn đúng 12 case:

| # | ID HW02 | Nội dung | Mã | Tổng đơn | Expected theo đặc tả | Tầng | Dự đoán |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | D-09-01 | Happy path percent | SAVE10 | 4.000.000 (giỏ thật, không sửa) | Áp được, giảm 400.000, thành tiền 3.600.000 | UI | Fail: `server.js:399-401` tính `total × (1 - 10)` nên giảm -36.000.000, thành tiền 40.000.000 |
| 2 | D-09-02 | C1 mã không tồn tại | FAKEMAC | 4.000.000 | Báo lỗi, không giảm | UI | Pass: `server.js:373-377` |
| 3 | D-09-03 | C2 mã hết hạn | EXPIRED | 4.000.000 | Báo hết hạn, không giảm | UI | Pass: `server.js:382-384` |
| 4 | D-09-04 | C3 dưới ngưỡng | SAVE10 | 299.999 (sửa ô) | Báo chưa đủ ngưỡng | UI | Pass: `server.js:379`, `435-437` |
| 5 | D-09-05 | C3 đúng ngưỡng | SAVE10 | 300.000 (sửa ô) | Áp được, giảm 30.000, thành tiền 270.000 | UI | Fail: `server.js:379` dùng `>` thay `>=` |
| 6 | D-09-06 | C4 chưa đăng nhập | SAVE10 | 300.001 | Bị từ chối | API (không gửi JWT, `user_id: null`) | Fail: `server.js:363` không có `authenticateToken`, nhánh `416-432` vẫn áp mã |
| 7 | D-09-07 | C5 SAVE10 đã dùng 1/1 | SAVE10 | 4.000.000 | Báo hết lượt | API | Pass: `server.js:391-395` |
| 8 | D-09-08 | C5 VIP100 đã dùng 1/2 | VIP100 | 4.000.000 | Áp được, giảm 100.000 | API | Pass: `server.js:391`, `403` |
| 9 | D-09-09 | C5 VIP100 đã dùng 2/2 | VIP100 | 4.000.000 | Báo hết lượt | API | Pass: `server.js:391-395` |
| 10 | D-09-11 | Công thức fixed | VIP100 | 4.000.000 (giỏ thật) | Giảm 100.000, thành tiền 3.900.000 | UI | Pass: `server.js:403`, `406` |
| 11 | B-09-04 | BIGBUY dưới ngưỡng | BIGBUY | 499.999 (sửa ô) | Báo chưa đủ ngưỡng | UI | Pass: `server.js:379`, `435-437` |
| 12 | B-09-05 | BIGBUY đúng ngưỡng | BIGBUY | 500.000 (sửa ô) | Áp được, giảm 50.000, thành tiền 450.000 | UI | Fail: `server.js:379` dùng `>` |

Case bị loại (trùng dữ liệu):
- D-09-10 (SAVE10, 300.001, kiểm tra công thức percent) = D-09-01: cùng mã, cùng mục tiêu kiểm số tiền giảm; D-09-01 đã assert số tiền.
- B-09-01 (SAVE10, 299.999) = D-09-04.
- B-09-02 (SAVE10, 300.000) = D-09-05.
- B-09-03 (SAVE10, 300.001) = D-09-01 / D-09-10 (ngưỡng trên đã có ở case 1 với 4.000.000).
- B-09-06 (VIP100 lượt 0→1→2→3) = D-09-08 + D-09-09 gộp lại.

Ghi chú:
- Case dựa vào lỗi FR-08: case 4, 5, 11, 12. Sản phẩm rẻ nhất là Keychron Q1 4.000.000 ₫ (`database.js`), lớn hơn mọi ngưỡng, nên muốn có tổng 299.999 / 300.000 / 499.999 / 500.000 phải sửa ô "Tổng tiền thanh toán" ở checkout. Ô này sửa được (`Checkout.jsx:93-102`, `type="number"` không khóa) là lỗi FR-08 (đặc tả: không cho sửa tổng tiền), và giá trị ô được gửi thẳng làm `total_amount` (`Checkout.jsx:30`). Nếu FR-08 được sửa thì 4 case này phải chuyển sang tầng API.
- Case 1, 2, 3, 10 dùng tổng thật 4.000.000 của giỏ, không cần sửa ô. D-09-01, D-09-03, D-09-11 đổi tổng so với HW02 (300.001 / 150.000) để không phụ thuộc FR-08.
- Case 6 chạy API vì UI luôn gửi `user_id` lấy từ user đang đăng nhập (`Checkout.jsx:31`), không gửi JWT; route `/checkout` không chặn người chưa đăng nhập (`App.jsx:58`) nhưng gọi API thẳng rõ ràng hơn.
- Case 7, 8, 9 (C5) khó tự động hóa: lượt dùng chỉ được ghi qua `POST /api/coupon-usage` (`server.js:444-449`) và không có API xóa `coupon_usage`, nên nếu dùng `test@eshop.com` thì chạy 1 lần là user test hết lượt SAVE10, các case 1, 4, 5 và lượt chạy browser sau sẽ đỏ sai. Cách làm đề xuất: mỗi test tạo user mới bằng `POST /api/register`, ghi sẵn lượt dùng bằng `POST /api/coupon-usage`, rồi gọi `apply-coupon`; `afterEach` xóa user bằng `DELETE /api/admin/users/:id` (dòng `coupon_usage` của user đã xóa vẫn còn trong DB nhưng không ảnh hưởng user khác).
- Các case UI chỉ bấm "Áp dụng", không bấm "Xác Nhận Thanh Toán", vì thanh toán xong sẽ ghi lượt dùng (`Checkout.jsx:54-59`) cho `test@eshop.com`. Hiện user test chưa dùng mã nào (đã gọi thử `apply-coupon` SAVE10/VIP100/BIGBUY đều `success`).
- Dự đoán: 4 Fail (case 1, 5, 6, 12), khớp BUG-09-01 (#15), BUG-09-02 (#16), BUG-09-03 (#17) của HW02.

### Bước 2 – Khảo sát giao diện, chọn locator

- Thời gian: 2026-11-18 10:46
- Công cụ: Claude Code subagent (dùng skill eshop-playwright-feature)
- Prompt: `Đọc file .jsx của trang FR-09, liệt kê locator cho từng phần tử cần dùng trong 12 case, kèm lý do chọn. Chạy thử từng locator trên app đang chạy, báo số phần tử khớp.`
- Quyết định của sinh viên sau Bước 1: (1) giữ case 7–9, mỗi test tạo user mới bằng `POST /api/register`, ghi lượt dùng bằng `POST /api/coupon-usage`, `afterEach` xóa user bằng `DELETE /api/admin/users/:id` (token admin); (2) case 4, 5, 11, 12 chạy UI, sửa ô "Tổng tiền thanh toán"; (3) case 1, 3, 10 dùng tổng thật 4.000.000; (4) case 6 chạy API.
- Ngữ cảnh AI tự đọc: `frontend-web/src/pages/Checkout.jsx`, `Cart.jsx`, `Home.jsx`, `App.jsx`, `context/CartContext.jsx`, `backend/server.js` (route `apply-coupon`, `coupon-usage`, `register`, `admin/users/:id`), `playwright.config.js` (locale `vi-VN`).
- Output (chạy thử bằng script tạm trên Chromium, đăng nhập `test@eshop.com`, thêm Keychron Q1 vào giỏ, vào checkout, bấm Áp dụng với FAKEMAC/SAVE10/BIGBUY/VIP100/EXPIRED, không bấm thanh toán; mỗi locator khớp đúng 1 phần tử):

| Phần tử | Locator | Khớp | Lý do chọn |
| --- | --- | --- | --- |
| Logo về trang chủ | `getByRole('link', { name: 'EShop', exact: true })` | 1 | Về Home bằng click để không mất giỏ |
| Thẻ sản phẩm Keychron Q1 | `locator('div.border').filter({ has: getByRole('heading', { name: 'Bàn phím cơ Keychron Q1' }) })` | 1 | Thẻ không có id; lọc theo tên sản phẩm trong `h2` |
| Nút Thêm vào giỏ | `<thẻ sản phẩm>.getByRole('button', { name: 'Thêm vào giỏ' })` | 1 | Cả trang có 5 nút cùng tên nên phải lấy trong thẻ |
| Link Giỏ hàng (Header) | `getByRole('link', { name: 'Giỏ hàng' })` | 1 | Link duy nhất trên Header |
| Tiêu đề trang giỏ | `getByRole('heading', { name: 'Giỏ Hàng' })` | 1 | Chờ trang giỏ tải xong |
| Nút Tiến hành thanh toán | `getByRole('button', { name: 'Tiến hành thanh toán' })` | 1 | Tên nút duy nhất |
| Tiêu đề trang checkout | `getByRole('heading', { name: 'Xác Nhận Đơn Hàng' })` | 1 | Chờ checkout tải xong |
| Ô Tổng tiền thanh toán | `label:has-text("Tổng tiền thanh toán") + input` | 1 | Label không gắn `for` (`getByLabel` = 0); giữ kiểu giống FR-04. `getByRole('spinbutton')` cũng khớp 1 |
| Ô Mã giảm giá | `getByPlaceholder('Nhập mã giảm giá...')` | 1 | Label "Mã Giảm Giá" không gắn input; placeholder duy nhất |
| Nút Áp dụng | `getByRole('button', { name: 'Áp dụng' })` | 1 | Tên nút duy nhất; bị `disabled` khi ô mã trống, lúc đang gọi API đổi chữ thành `...` |
| Dòng lỗi coupon | `locator('p.text-red-600')` | 1 | Chỉ hiện khi có lỗi; không có id/role nên dùng class |
| Khối áp mã thành công | `locator('div.text-green-700')` | 1 | Chỉ hiện khi áp được mã, chứa câu "✅ Áp dụng thành công! ..." |
| Số tiền giảm | `locator('p', { hasText: 'Tiết kiệm:' }).locator('strong')` | 1 | Lấy đúng số trong `strong`, không lẫn chữ |
| Thành tiền sau giảm | `locator('p', { hasText: 'Thành tiền:' }).locator('strong')` | 1 | Như trên |
| Dòng Tổng thanh toán | `getByText(/^Tổng thanh toán:/)` | 1 | Hiện tổng cuối (có mã thì là `final_amount`), dùng để assert thêm |
| Nút Xác Nhận Thanh Toán | `getByRole('button', { name: 'Xác Nhận Thanh Toán' })` | 1 | Chỉ dùng để assert có nút, không bấm |

Ghi chú:
- App báo kết quả bằng text trên trang, không có `alert()`, không chuyển trang. Lỗi hiện ở `p.text-red-600` (vd "Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa", "Mã giảm giá đã hết hạn", "Đơn hàng chưa đủ giá trị tối thiểu 300,000 ₫ để áp dụng mã này"). Thành công hiện khối xanh với "Tiết kiệm" và "Thành tiền".
- Số tiền do frontend in theo locale browser (`vi-VN` → `4.000.000 ₫`), còn câu thông báo do backend tạo nên dùng dấu phẩy (`300,000 ₫`, `Giảm 100,000 ₫`). Assert số tiền thì đọc trong `strong`; câu chữ thông báo để `expect.soft`.
- Kết quả chạy thử khớp dự đoán Bước 1: FAKEMAC/EXPIRED báo lỗi; SAVE10 299.999 báo chưa đủ; SAVE10 300.000 và BIGBUY 500.000 vẫn báo chưa đủ (lỗi `>`); VIP100 4.000.000 giảm 100.000, còn 3.900.000; SAVE10 4.000.000 ra "Tiết kiệm -36.000.000 ₫", "Thành tiền 40.000.000 ₫".
- Sửa ô Tổng tiền (`fill`) hoặc ô mã sẽ xóa kết quả/lỗi cũ (`Checkout.jsx:97-99`, `113`), nên mỗi case chỉ cần fill rồi bấm Áp dụng lại, không phải đi lại từ đầu.
- Đường đi giữ giỏ: `loginWeb` → click logo → thêm Keychron → click link "Giỏ hàng" → "Tiến hành thanh toán". `page.goto('/cart')` làm giỏ trống ("Giỏ hàng của bạn đang trống") vì giỏ chỉ nằm trong React state. Ô Tổng tiền lấy giá trị `cartTotal` lúc vào checkout (4000000).
- Phải chờ tiêu đề trang (hoặc dùng `expect` tự chờ) trước khi đếm/thao tác; gọi `count()` ngay sau click ra 0 vì trang chưa render.
- API cho case 6–9 (đã gọi thử): case 6 gửi `apply-coupon` không JWT, `user_id: null`, SAVE10 300.001 → 200 `success` (lỗi, đúng dự đoán). Case 7–9: `register` trả `id` → `login` lấy token → `coupon-usage` với `coupon_id` (SAVE10 = 1, VIP100 = 3, lấy từ `GET /api/coupons`) → `apply-coupon` với `user_id` mới: SAVE10 1/1 → 400 "đã đạt giới hạn", VIP100 1/2 → 200 giảm 100.000, VIP100 2/2 → 400. `DELETE /api/admin/users/:id` bằng token admin → 200, user mất khỏi `GET /api/admin/users`. Bảng `users` dùng `AUTOINCREMENT` nên id không bị tái dùng, dòng `coupon_usage` cũ không dính sang user mới.
- Sau khi chạy thử, `test@eshop.com` vẫn chưa dùng SAVE10 (gọi `apply-coupon` vẫn 200), user tạm đã xóa.

### Bước 3 – Thiết kế file dữ liệu

- Thời gian: 2026-11-18 10:56
- Công cụ: Claude Code subagent (dùng skill eshop-playwright-feature)
- Prompt: `Thiết kế data/FR-xx.json cho 12 case đã chọn: mỗi dòng có id (TC-FRxx-<ID HW02>), title, dữ liệu nhập và expected viết theo đặc tả, không theo hành vi hiện tại của app. Chỉ ra case nào cần trường riêng.`
- Quyết định của sinh viên sau Bước 2: (1) dòng lỗi giữ `p.text-red-600`, khối thành công tìm theo chữ "Tiết kiệm:", "Thành tiền:" thay cho `div.text-green-700`; (2) mỗi test tự đi lại đường giỏ hàng (logo → Thêm vào giỏ → Giỏ hàng → Tiến hành thanh toán); (3) 4 bẫy mới của Bước 2 thêm vào SKILL.md sau khi xong FR-09.
- Output: file `data/FR-09.json` (12 dòng). Cấu trúc chung: `id`, `title`, `layer` (`ui`/`api`), `code` (mã nhập), `total`, `expected`. Không gom vào `input` như FR-04 vì mỗi case chỉ có 2 dữ liệu nhập (mã, tổng). `total: null` nghĩa là dùng tổng thật của giỏ (4.000.000, không sửa ô); có số thì case UI fill ô "Tổng tiền thanh toán", case API gửi làm `total_amount`. Case `applied` có thêm `discount` và `final` (số nguyên, đơn vị đồng).

`expected` có 2 giá trị:

| expected | Ý nghĩa theo đặc tả | Case |
| --- | --- | --- |
| `applied` | Áp được mã, số tiền giảm = `discount`, thành tiền = `final` | D-09-01, D-09-05, D-09-08, D-09-11, B-09-05 |
| `error` | Không áp được mã (vi phạm 1 trong C1–C5), không có số tiền giảm | D-09-02, D-09-03, D-09-04, D-09-06, D-09-07, D-09-09, B-09-04 |

Số liệu expected (tính theo công thức đặc tả):

| Case | Mã | Tổng | discount | final |
| --- | --- | --- | --- | --- |
| D-09-01 | SAVE10 (10%) | 4.000.000 | 400.000 | 3.600.000 |
| D-09-05 | SAVE10 (10%) | 300.000 (đúng ngưỡng, `>=`) | 30.000 | 270.000 |
| D-09-08 | VIP100 (fixed) | 4.000.000 | 100.000 | 3.900.000 |
| D-09-11 | VIP100 (fixed) | 4.000.000 | 100.000 | 3.900.000 |
| B-09-05 | BIGBUY (fixed) | 500.000 (đúng ngưỡng) | 50.000 | 450.000 |

Case cần trường riêng:
- D-09-06: `noToken: true`, gọi `apply-coupon` không gửi JWT, `user_id: null`.
- D-09-07, D-09-08, D-09-09: `priorUses` (1, 1, 2) = số lần ghi `POST /api/coupon-usage` cho user mới trước khi áp mã.
- Case API (D-09-06..09) luôn có `total` cụ thể vì không đi qua giỏ hàng.

Ghi chú:
- Điều kiện coupon (loại, giá trị, ngưỡng, hạn, số lượt/người) của SAVE10, BIGBUY, VIP100, EXPIRED trong đặc tả khớp với seed `backend/database.js:107-110`, không có chỗ lệch.
- D-09-08 và D-09-11 cùng VIP100 trên 4.000.000 nhưng khác mục tiêu: D-09-08 kiểm C5 (còn lượt, qua API), D-09-11 kiểm công thức fixed trên UI.
- Không ghi câu thông báo lỗi vì đặc tả FR-09 không quy định câu chữ; script chỉ assert có dòng lỗi và không có khối "Tiết kiệm:" (UI), hoặc response không phải `success` (API).
- Đã kiểm tra bằng node: 12 dòng, `id` không trùng; `discount`/`final` tính lại theo công thức đều khớp.

### Bước 4 – Khung script

- Thời gian: 2026-11-18 11:05
- Công cụ: Claude Code subagent (dùng skill eshop-playwright-feature)
- Prompt: `Viết tests/FR-xx.spec.js đọc dữ liệu từ data/FR-xx.json, dùng helper trong helpers/common.js, có bước dọn dữ liệu bằng API (beforeEach/afterEach) để chạy lại trên browser khác không bị lỗi. Chưa cần assertion đầy đủ. Chạy thử trên Chromium.`
- Quyết định của sinh viên sau Bước 3: (1) thêm trường `reason` (`C1`–`C5`, điều kiện vi phạm theo đặc tả) cho mỗi case `error`, chỉ để report dễ đọc, assertion không đổi; (2) giữ cả D-09-08 và D-09-11; (3) case `error` qua API chỉ cần response không phải `success`, không kiểm mã HTTP.
- Output:
  - `data/FR-09.json`: thêm `reason` cho 7 case `error` (D-09-02 `C1`, D-09-03 `C2`, D-09-04 và B-09-04 `C3`, D-09-06 `C4`, D-09-07 và D-09-09 `C5`).
  - `helpers/common.js` (giữ nguyên helper cũ): thêm `ADMIN`, `goToCheckout` (logo → thẻ Keychron Q1 → Thêm vào giỏ → link Giỏ hàng → Tiến hành thanh toán, chờ heading "Xác Nhận Đơn Hàng"), `createTempUser` (`POST /api/register` email theo thời gian rồi lấy token), `cleanupUsers` (token admin, `GET /api/admin/users` rồi `DELETE` mọi user có id > 2).
  - `tests/FR-09.spec.js`: vòng lặp tạo 12 test từ data, `reason` ghi vào annotation. Nhánh `api`: case có `noToken` gửi `apply-coupon` không header, `user_id: null`; case 7–9 tạo user tạm, lấy `coupon_id` theo `code` từ `GET /api/coupons`, ghi `priorUses` lần `coupon-usage`, rồi gọi `apply-coupon`; ghi status và body vào annotation. Nhánh `ui`: `loginWeb` → `goToCheckout` → fill ô Tổng tiền nếu `total` khác `null` → nhập mã → Áp dụng, chờ `p.text-red-600` hoặc "Tiết kiệm:" hiện, ghi nội dung lỗi hoặc số tiền vào annotation. Không bấm "Xác Nhận Thanh Toán".
  - Dọn dữ liệu: `beforeEach` và `afterEach` đều gọi `cleanupUsers`; `afterEach` chạy cả khi test fail nên user tạm luôn bị xóa. Case UI chỉ áp mã nên không ghi gì vào database.
- Kết quả chạy Chromium:
  - Lần 1: 12/12 chạy hết trong 5,5 giây, không treo, không có lỗi script phải sửa (chưa có assertion nên đều xanh).
  - Chạy thêm 1 lần với reporter JSON để đọc annotation: khớp dự đoán Bước 1. D-09-01 ra "tiết kiệm -36.000.000 ₫, thành tiền 40.000.000 ₫"; D-09-05 và B-09-05 báo "chưa đủ giá trị tối thiểu"; D-09-06 không token vẫn 200 `success`; D-09-07, D-09-09 trả 400 "đã đạt giới hạn"; D-09-08 và D-09-11 giảm 100.000, còn 3.900.000.
  - Chạy lại FR-04 trên Chromium để kiểm helper cũ: 6 pass, 6 fail, đúng 6 case lỗi EShop đã phân loại ở Bước 6 của FR-04.
  - Sau khi chạy: `GET /api/admin/users` chỉ còn id 1, 2; `apply-coupon` SAVE10 4.000.000 với `user_id: 2` vẫn `success` (user test chưa bị tiêu lượt). Đã xóa `reports/FR-09-chromium`, `reports/FR-04-chromium`, `test-results/` của lần chạy thử.

### Bước 5 – Thêm assertion

- Thời gian: 2026-11-18 11:09
- Công cụ: Claude Code subagent (dùng skill eshop-playwright-feature)
- Prompt: `Thêm assertion cho từng loại expected trong FR-xx.spec.js, dùng ít nhất 3 kiểu khác nhau (URL, hiển thị, nội dung, giá trị ô, dialog, dữ liệu qua API). Không dùng waitForTimeout. Không sửa expected để test xanh.`
- Quyết định của sinh viên sau Bước 4: (1) D-09-06 (C4, không token) chỉ assert "không success", không assert số tiền giảm để không lẫn với lỗi công thức percent (BUG-09-02); (2) giữ email user tạm theo `Date.now()` (`workers: 1` nên không trùng).
- Output: chỉ sửa `tests/FR-09.spec.js`, thêm hàm `toNumber` (bỏ ký tự không phải số nhưng giữ dấu `-`, để "-36.000.000 ₫" thành -36000000) và bảng `ERROR_TEXT` (câu lỗi lấy từ `server.js`, chỉ dùng cho `expect.soft`). Số tiền so với `discount`/`final` trong data (theo đặc tả).

| expected / tầng | Assertion | Kiểu |
| --- | --- | --- |
| Mọi case UI (trước khi bấm) | nút "Áp dụng" `toBeEnabled()` sau khi nhập mã; case có `total` thì ô Tổng tiền `toHaveValue(total)` | Trạng thái phần tử, giá trị ô |
| `applied` / UI | dòng "Tiết kiệm:" hiển thị; số "Tiết kiệm" = `discount`, số "Thành tiền" = `final`; không có `p.text-red-600` | Hiển thị, nội dung |
| `error` / UI | `p.text-red-600` hiển thị; không có dòng "Tiết kiệm:"; `expect.soft` câu lỗi chứa chữ theo `reason` (C1 "không tồn tại", C2 "hết hạn", C3 "chưa đủ giá trị tối thiểu") | Hiển thị, nội dung (soft) |
| `applied` / API | body `success` = `true`, `discount_amount` = `discount`, `final_amount` = `final` | Dữ liệu qua API |
| `error` / API | body `success` khác `true` (không kiểm mã HTTP) | Dữ liệu qua API |

Tổng cộng 5 kiểu assertion: hiển thị, nội dung, giá trị ô, trạng thái phần tử (`enabled`), dữ liệu qua API. Không có `waitForTimeout`; số tiền đọc sau khi `expect(saving).toBeVisible()` đã chờ.

- Kết quả Chromium: 8 pass, 4 fail, khớp dự đoán Bước 1. Không có lỗi script phải sửa.

| Case | Thực tế |
| --- | --- |
| D-09-01 | "Tiết kiệm" ra -36.000.000 (expected 400.000), công thức `total × (1 - 10)` |
| D-09-05 | Không có khối thành công, báo "chưa đủ giá trị tối thiểu" với tổng đúng ngưỡng 300.000 (`>` thay `>=`) |
| D-09-06 | Không gửi JWT vẫn trả `success: true` |
| B-09-05 | Như D-09-05 với BIGBUY 500.000 |

- Sau khi chạy: `GET /api/admin/users` chỉ còn id 1, 2; `apply-coupon` SAVE10 với `user_id: 2` vẫn `success`. Đã xóa `reports/FR-09-chromium` và `test-results/`.

### Bước 6 – Chạy 3 browser, phân loại test đỏ

- Thời gian: 2026-11-18 11:18
- Công cụ: Claude Code subagent (dùng skill eshop-playwright-feature)
- Prompt: `Chạy FR-xx.spec.js trên chromium, firefox, webkit. Với mỗi test đỏ, xác định lỗi script hay lỗi EShop (dẫn chứng bằng code hoặc ảnh). Sửa lỗi script; lỗi EShop thì giữ đỏ và liệt kê làm bug.`
- Quyết định của sinh viên sau Bước 5: chưa sửa vị trí 2 assertion phụ (`toBeEnabled`, `toHaveValue`) đặt trước nút bấm, để lại cho Bước 7.
- Kết quả: mỗi browser 8 pass, 4 fail (tổng 12 fail / 36). Cùng 4 case fail với cùng thông báo lỗi trên cả 3 browser, khớp dự đoán Bước 1 và kết quả Chromium ở Bước 5.
- Phân loại: cả 12 fail đều là lỗi EShop, không có lỗi script cần sửa ở bước này. 2 assertion phụ `toBeEnabled`, `toHaveValue` không fail trên browser nào nên giữ nguyên.

| Case đỏ | Thực tế | Dẫn chứng trong code | Bug (issue HW02) |
| --- | --- | --- | --- |
| D-09-01 | SAVE10 trên 4.000.000: "Tiết kiệm -36.000.000 ₫", "Thành tiền 40.000.000 ₫" (expected 400.000 / 3.600.000) | `backend/server.js:399-401` (và `419-421`) tính `Math.floor(total_amount * (1 - coupon.discount_value))` với `discount_value = 10` | BUG-09-02 ([#16](https://github.com/kqanGit/eshop-sut/issues/16)) |
| D-09-05 | SAVE10 tổng 300.000: báo "Đơn hàng chưa đủ giá trị tối thiểu 300,000 ₫...", không có khối "Tiết kiệm:" | `backend/server.js:379` `if (total_amount > coupon.min_order_amount)`, đặc tả là `>=` | BUG-09-01 ([#15](https://github.com/kqanGit/eshop-sut/issues/15)) |
| B-09-05 | BIGBUY tổng 500.000: báo "chưa đủ giá trị tối thiểu 500,000 ₫" | Cùng `server.js:379` | BUG-09-01 ([#15](https://github.com/kqanGit/eshop-sut/issues/15)) |
| D-09-06 | `POST /api/apply-coupon` không JWT, `user_id: null` vẫn 200 `success: true` | `backend/server.js:363` route không có `authenticateToken`; nhánh `user_id` rỗng `416-432` vẫn trả `success` | BUG-09-03 ([#17](https://github.com/kqanGit/eshop-sut/issues/17)) |

- Ghi chú:
  - Đã kiểm tra format số tiền: frontend in bằng `toLocaleString()` (`Checkout.jsx:130-131`, `138`) theo locale `vi-VN` của config; snapshot lúc fail của D-09-01 trên cả 3 browser đều là `"-36.000.000 ₫"` / `40.000.000 ₫`, nên `toNumber` đọc ra cùng số (-36000000) trên mọi browser. D-09-11 (100.000 / 3.900.000) xanh trên cả 3 browser cũng cho thấy hàm đọc số đúng.
  - D-09-06 chạy API nên không phụ thuộc browser; vẫn chạy 3 lần (mỗi project 1 lần) và đỏ như nhau.
  - Kết quả báo bằng text trên trang (không phải alert) nên ảnh chụp và snapshot `error-context.md` lúc fail giữ được bằng chứng: D-09-05, B-09-05 có dòng lỗi "chưa đủ giá trị tối thiểu", D-09-01 có khối xanh với số âm.
  - Cả 3 bug đã có issue từ HW02; khi log bug HW04 sẽ mở issue mới nhãn `HW04`, dẫn link issue cũ.
  - Sau khi chạy: `GET /api/admin/users` chỉ còn id 1, 2; `apply-coupon` SAVE10 với `user_id: 2` vẫn `success`. Chạy với `--reporter=list` nên không sinh HTML report; đã xóa `test-results/`.

### Bước 7 – Review

- Thời gian: 2026-11-18 11:22
- Công cụ: Claude Code subagent (dùng skill eshop-playwright-feature)
- Prompt: `Review lại toàn bộ FR-xx.spec.js và data, lập bảng "AI sai gì / thiếu gì / vì sao / đã sửa thế nào" dựa trên lỗi thật trong các bước trước, kèm commit tương ứng.`
- Output: đọc lại `tests/FR-09.spec.js`, `data/FR-09.json`, `helpers/common.js`, sửa 3 chỗ trong `tests/FR-09.spec.js` ở commit `7f685ea` (dòng 3, 4, 5 dưới đây). Chạy lại Chromium: vẫn 8 pass, 4 fail (D-09-01, D-09-05, D-09-06, B-09-05), cùng thông báo lỗi như Bước 5–6; câu lỗi C5 mới thêm khớp ở D-09-07, D-09-09. Sau khi chạy `GET /api/admin/users` chỉ còn id 1, 2; đã xóa `reports/FR-09-chromium` và `test-results/`. Bảng review:

| # | Bước | AI sai / thiếu gì | Vì sao | Đã sửa thế nào | Commit |
| --- | --- | --- | --- | --- | --- |
| 1 | 2 | (Tránh được) Gọi `count()` ngay sau click ra 0 phần tử khi chạy thử locator | Trang chưa render xong, `count()` không tự chờ | Chờ tiêu đề trang hoặc dùng `expect` tự chờ trước khi đếm; trong spec chỉ dùng `expect(...).toBeVisible()` / `toHaveCount` | – |
| 2 | 2 | (Tránh được) Câu thông báo do backend tạo dùng dấu phẩy (`300,000 ₫`), khác số tiền frontend in theo `vi-VN` (`300.000 ₫`) | Backend gọi `toLocaleString()` trên Node (locale mặc định), frontend dùng locale browser | Số tiền đọc trong `strong` rồi đổi bằng `toNumber`; câu lỗi chỉ so phần chữ (không có số) và dùng `expect.soft` | `e25f960` |
| 3 | 5 | Đặt 2 assertion phụ (`toBeEnabled` nút Áp dụng, `toHaveValue` ô Tổng tiền) bằng `expect` thường trước khi bấm. Nếu fail thì test dừng, không tới assertion chính (số tiền giảm / dòng lỗi) | Lặp lại đúng lỗi đã sửa ở FR-04 (`5fb63f7`): AI xếp assertion phụ lên trước assertion chính. Bước 6 không fail trên browser nào nên chưa lộ ra | Đổi 2 assertion thành `expect.soft`. Hạn chế: nếu nút Áp dụng thật sự bị `disabled` thì `click()` vẫn chờ tới timeout, nhưng report vẫn ghi lý do là nút bị khóa | `7f685ea` |
| 4 | 4–5 | Không kiểm tra `POST /api/coupon-usage` khi ghi lượt dùng trước. Nếu ghi lỗi thì D-09-08 (còn 1/2 lượt) vẫn xanh vì user chưa dùng lượt nào, tức xanh vì lý do sai | AI coi bước chuẩn bị dữ liệu luôn thành công | Thêm `expect(usage.ok()).toBe(true)` sau mỗi lần ghi lượt | `7f685ea` |
| 5 | 5 | Khai báo `ERROR_TEXT.C5` nhưng nhánh API không dùng; case `error` qua API chỉ assert "không success" nên D-09-07, D-09-09 có thể xanh vì lỗi khác (vd sai mã, chưa đủ ngưỡng) | AI viết bảng câu lỗi chung nhưng chỉ gắn vào nhánh UI | Thêm `expect.soft(body.error).toContain(ERROR_TEXT[c.reason])` cho case API có câu lỗi (C5); C4 không có câu để so vì app đang trả `success` | `7f685ea` |
| 6 | 5 | Trong log Bước 5 ghi lỗi công thức percent là BUG-09-01, đúng phải là BUG-09-02 (#16) | Lỗi do prompt của người điều phối ghi nhầm ID, AI chép theo, không đối chiếu `bugs.md` của HW02 | Sửa ID trong audit khi ghi Bước 6 | `94adb04` |
| 7 | 1 | Case 4, 5, 11, 12 (test biên ngưỡng) phải sửa ô "Tổng tiền thanh toán", dựa vào lỗi FR-08 (ô này sửa được) | Sản phẩm rẻ nhất 4.000.000 ₫, lớn hơn mọi ngưỡng; không có cách khác tạo tổng 299.999 / 300.000 / 499.999 / 500.000 qua UI | Không sửa: ghi vào gap analysis. Nếu FR-08 được sửa thì 4 case này chuyển sang tầng API | – |
| 8 | 1 | Case C5 (D-09-07/08/09) không dùng được user test, vì không có API xóa `coupon_usage` | Dùng `test@eshop.com` thì chạy 1 lần là hết lượt SAVE10, các case 1, 4, 5 và browser sau đỏ sai | Mỗi test tạo user tạm, `afterEach` xóa user bằng token admin. Dòng `coupon_usage` của user đã xóa vẫn còn trong DB (không ảnh hưởng user khác vì id `AUTOINCREMENT`); ghi vào gap analysis | – |

Những điểm đã kiểm tra và không cần sửa:
- Không có `waitForTimeout`; mọi chỗ chờ đều dùng `expect` tự chờ. `error.isVisible()` chỉ gọi sau khi `expect(error.or(saving)).toBeVisible()` đã chờ xong nên không đọc sớm.
- Selector đều là role, placeholder, `label + input` hoặc chữ hiển thị; chỉ `p.text-red-600` dùng class vì dòng lỗi không có id/role (đã ghi ở Bước 2).
- `beforeEach` và `afterEach` cùng gọi `cleanupUsers`; case UI chỉ bấm Áp dụng, không bấm thanh toán nên `test@eshop.com` không bị ghi lượt dùng (SAVE10 với `user_id: 2` vẫn `success` sau khi chạy).
- `expected`, `discount`, `final` trong data đều theo công thức đặc tả, không có giá trị nào sửa cho khớp với app; dữ liệu nhập không viết cứng trong script.
- `toNumber` giữ dấu `-` nên số âm của D-09-01 không bị đọc thành số dương (test vẫn đỏ đúng chỗ).
- Helper cũ trong `helpers/common.js` không bị sửa ở bước này.

## FR-14 CRUD danh mục

### Bước 1 – Chọn test case

- Thời gian: 2026-11-18 11:28
- Công cụ: Claude Code subagent (dùng skill eshop-playwright-feature)
- Prompt: `Đọc đặc tả FR-14 trong README EShop và test case HW02 ở HW02-20120359/features/FR-14/. Chọn 12 case tự động hóa được bằng Playwright, bỏ case trùng dữ liệu, nêu lý do loại từng case còn lại. Ghi tầng chạy (UI/API) và dự đoán Pass/Fail. Admin ở cổng 5174; dọn danh mục id > 3, không đụng 3 danh mục seed.`
- Ngữ cảnh AI tự đọc: `HW02/features/FR-14/domain.md`, `bva.md`, `bugs.md`, `gap-analysis.md`, đặc tả FR-12 và FR-14 trong README EShop, `frontend-admin/src/App.jsx` (login, tab Danh mục), `backend/server.js` (`authenticateToken`, route `/api/categories`, `/api/products`), `backend/database.js` (bảng `categories`, `products`, seed). Không có route `/api/admin/categories`. Gọi thử bằng curl: `POST /api/categories` với `""`, `"   "`, body rỗng (token admin) và tên thường (token user) đều 200; `DELETE /api/categories/9999` bằng token user cũng 200. Đã xóa các danh mục tạo thử (id 4–7), còn đúng 3 danh mục seed.
- Output:

HW02 có 15 test case (10 Domain + 5 BVA). Bỏ 3 BVA trùng Domain và 2 BVA độ dài không có expected theo đặc tả, còn 10 case; thêm 2 case `AT-xx` cho thao tác Xóa, đủ 12 case:

| # | ID HW02 | Nội dung | Dữ liệu | Expected theo đặc tả | Tầng | Dự đoán |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | D-14-01 | V1 thêm tên hợp lệ | `Phu kien Test FR14` | Thêm được, hiện trong bảng | UI | Pass: `App.jsx:142-147`, `server.js:249-254` |
| 2 | D-14-02 | I1 tên rỗng | `""` | Từ chối, bảng không thêm dòng | UI | Fail: input không có `required` (`App.jsx:298-304`), backend không kiểm tra `name` (`server.js:250-251`) |
| 3 | D-14-03 | I2 chỉ khoảng trắng | `"   "` | Từ chối (coi như rỗng) | UI | Fail: như case 2 |
| 4 | D-14-04 | V2 tên 1 ký tự | `A` | Thêm được | UI | Pass: `server.js:249-254` |
| 5 | D-14-05 | I4 trùng tên | `Phu kien Test FR14` 2 lần | Từ chối lần 2 (bổ sung HW02, đặc tả không nêu) | UI | Fail: không kiểm tra trùng, cột `name` không `UNIQUE` (`database.js:25`) |
| 6 | D-14-06 | I5 chuỗi HTML/script | `<script>alert(1)</script>` | Tên hiện đúng dạng chữ, không chạy script (không bật dialog) | UI | Pass: React tự escape `{c.name}` (`App.jsx:320`) |
| 7 | D-14-07 | A1 thêm không có token | `UnauthTest` | 401 | API | Pass: `server.js:103` |
| 8 | D-14-08 | A2 user thường thêm danh mục | token `test@eshop.com`, `UserShouldNotCreate` | 403, không tạo | API | Fail: route chỉ có `authenticateToken`, không kiểm tra `role` (`server.js:100-110`, `249`) |
| 9 | AT-01 | User thường xóa danh mục | admin tạo DM test (id > 3), user xóa | 403, DM còn trong list | API | Fail: `server.js:269` cũng chỉ `authenticateToken` |
| 10 | AT-02 | Xóa danh mục qua UI | admin tạo DM test, bấm "Xóa" ở dòng đó | Dòng biến mất, `GET /api/categories` không còn id đó | UI | Pass: `App.jsx:153-157`, `323-326`, `server.js:269-276` |
| 11 | D-14-09 | Xem danh sách | 3 DM seed | Bảng hiện đủ Điện thoại, Laptop, Phụ kiện, khớp `GET /api/categories` | UI | Pass: `App.jsx:49-50`, `318-330`, `server.js:243-247` |
| 12 | D-14-10 | Xóa DM còn sản phẩm (đổi sang DM test) | tạo DM test + 1 SP có `category_id` = DM đó, rồi xóa DM | Từ chối xóa, hoặc không còn SP trỏ tới id đã xóa (bổ sung HW02) | API | Fail: `server.js:269-276` xóa thẳng, `products.category_id` không có khóa ngoại (`database.js:70`) |

Case thêm mới:
- AT-01: FR-12 yêu cầu `DELETE /api/categories` cũng phải là admin, HW02 chỉ thử `POST` bằng user (D-14-08).
- AT-02: HW02 không có case Xóa thành công (D-14-10 là xóa có sản phẩm), mà FR-14 có thao tác Xóa.

Case bị loại:
- B-14 rỗng `""` = D-14-02.
- B-14 khoảng trắng `"   "` = D-14-03.
- B-14 1 ký tự `A` = D-14-04.
- B-14 dài 255 và 256 ký tự: đặc tả FR-14 không có độ dài tối đa, HW02 chỉ ghi "không crash" (Pass*), không có expected theo đặc tả để assert; phía hợp lệ đã có D-14-01, D-14-04.

Ghi chú:
- D-14-10 trong HW02 xóa DM seed id 1: không tự động hóa được vì không có API khôi phục, tạo lại bằng `POST` sẽ ra id mới (cột `AUTOINCREMENT`), 5 SP seed vẫn trỏ `category_id` 1–3, các feature khác và browser sau sẽ hỏng. Đổi sang DM do test tạo (id > 3) và 1 SP test (id > 5, `POST /api/products`); `afterEach` xóa SP id > 5 rồi DM id > 3.
- D-14-08, AT-01 phải chạy API: admin UI chặn user thường ngay lúc login (`App.jsx:65-66`, chỉ chặn ở frontend) nên không thao tác được bằng UI.
- Case UI bị từ chối (2, 3, 5) nếu app sửa đúng có thể bật `alert("Lỗi thêm DM...")` (`App.jsx:149`); script phải bắt `dialog` trước khi bấm "Thêm mới" để `click()` không treo (bẫy đã gặp ở FR-04).
- D-14-06 HW02 ghi Fail vì DB lưu nguyên chuỗi; đặc tả không cấm lưu, nên Bước 1 chỉ kiểm tra không chạy script khi hiển thị, dự đoán Pass.
- Đặc tả FR-14 chỉ có Thêm/Xem/Xóa; route `PUT /api/categories/:id` có trong code (`server.js:257`) nhưng không test. `DELETE` id không tồn tại vẫn trả 200, đặc tả không nêu nên không thêm case.
- Dữ liệu dùng chung: chỉ tạo/xóa DM id > 3 và SP id > 5; `beforeEach`/`afterEach` dọn bằng token admin, sau khi chạy `GET /api/categories` phải còn đúng 3 DM seed.
- Dự đoán: 6 Fail (case 2, 3, 5, 8, 9, 12), khớp BUG-14-01 (#46), BUG-14-02 (#47), BUG-14-03 (#48, AT-01 cùng nguyên nhân), BUG-14-04 (#49) của HW02.

### Bước 2 – Khảo sát giao diện, chọn locator

- Thời gian: 2026-11-18 11:31
- Công cụ: Claude Code subagent (dùng skill eshop-playwright-feature)
- Prompt: `Đọc file .jsx của trang FR-14, liệt kê locator cho từng phần tử cần dùng trong 12 case, kèm lý do chọn. Chạy thử từng locator trên app đang chạy, báo số phần tử khớp.`
- Quyết định của sinh viên sau Bước 1: (1) thay case 5 (D-14-05 trùng tên) và case 12 (D-14-10 xóa DM còn SP) vì đặc tả FR-14 không quy định, thay bằng AT-03 (thêm DM, reload, DM vẫn còn) và AT-04 (DM mới có trong `select` danh mục ở tab "Sản phẩm"); D-14-05 (BUG-14-02, #47) và D-14-10 (BUG-14-04, #49) đưa vào mục "chưa tự động hóa" của report, lý do đặc tả không quy định; (2) giữ case 6 `<script>`, expected script không chạy khi hiển thị, dự đoán Pass; (3) case 7, 8, 9 chạy API, còn lại UI; (4) không tạo sản phẩm test.

| # | ID | Nội dung | Tầng | Dự đoán |
| --- | --- | --- | --- | --- |
| 1 | D-14-01 | Thêm tên hợp lệ | UI | Pass |
| 2 | D-14-02 | Tên rỗng | UI | Fail |
| 3 | D-14-03 | Tên chỉ khoảng trắng | UI | Fail |
| 4 | D-14-04 | Tên 1 ký tự | UI | Pass |
| 5 | AT-03 | Thêm DM, reload, DM vẫn còn trong bảng | UI | Pass: token ở `localStorage`, reload gọi lại `fetchData` (`App.jsx:7`, `34-50`), DM đã lưu DB |
| 6 | D-14-06 | Chuỗi `<script>` không chạy khi hiển thị | UI | Pass |
| 7 | D-14-07 | Thêm không có token → 401 | API | Pass |
| 8 | D-14-08 | User thường thêm → 403 | API | Fail |
| 9 | AT-01 | User thường xóa → 403 | API | Fail |
| 10 | AT-02 | Xóa DM qua UI | UI | Pass |
| 11 | D-14-09 | Xem danh sách 3 DM seed | UI | Pass |
| 12 | AT-04 | DM mới có trong `select` tab Sản phẩm | UI | Pass: `select` map từ `categories` (`App.jsx:538-542`), thêm DM xong `fetchData` cập nhật lại |

  Dự đoán còn 4 Fail (case 2, 3, 8, 9).
- Ngữ cảnh AI tự đọc: `frontend-admin/src/App.jsx` (login `188-215`, menu `226-272`, tab Danh mục `294-335`, form sản phẩm `483-543`, `handleCategorySubmit`/`deleteCategory` `142-160`), `backend/server.js` (`authenticateToken` `100-110`, route `/api/categories` `243-278`), `helpers/common.js`.
- Output (chạy thử bằng script tạm trên Chromium, đăng nhập admin, thêm `Phu kien Test FR14`, `<script>alert(1)</script>` và tên rỗng qua UI, reload, xem tab Sản phẩm, xóa DM test qua UI, gọi API case 7–9; mỗi locator khớp đúng 1 trừ chỗ ghi rõ):

| Phần tử | Locator | Khớp | Lý do chọn |
| --- | --- | --- | --- |
| Ô Email (login) | `getByPlaceholder('Email')` | 1 | Form login không có label, chỉ có placeholder |
| Ô Password | `getByPlaceholder('Password')` | 1 | Như trên |
| Nút Login | `getByRole('button', { name: 'Login' })` | 1 | Tên nút duy nhất |
| Tiêu đề sau đăng nhập | `getByRole('heading', { name: 'EShop Admin' })` | 1 | Chờ trang admin tải xong |
| Menu Danh mục | `getByText('Danh mục', { exact: true })` | 1 | Menu là `li` có `onClick`, không phải link/button; `getByRole('listitem', { name: 'Danh mục' })` = 0 vì `li` không lấy tên từ chữ. Cần `exact` để không khớp "Quản lý Danh mục" |
| Menu Sản phẩm | `getByText('Sản phẩm', { exact: true })` | 1 | Như trên, `exact` để không khớp "Thêm sản phẩm mới", "Quản lý Sản phẩm" |
| Tiêu đề tab Danh mục | `getByRole('heading', { name: 'Quản lý Danh mục' })` | 1 | Chờ tab render trước khi đếm dòng |
| Ô tên danh mục | `getByPlaceholder('Tên danh mục mới')` | 1 | Không có label; placeholder duy nhất |
| Nút Thêm mới | `getByRole('button', { name: 'Thêm mới' })` | 1 | Tên nút duy nhất |
| Các dòng bảng | `locator('tbody tr')` | 3 | Ở tab Danh mục chỉ có 1 bảng; dùng để đếm số dòng (case 2, 3 tên rỗng không lọc theo tên được) và case 11 |
| Dòng của 1 DM | `locator('tbody tr').filter({ has: getByRole('cell', { name: <tên>, exact: true }) })` | 1 | Lọc theo ô tên; đã thử 3 DM seed, `Phu kien Test FR14`, `<script>alert(1)</script>` đều khớp 1 |
| Nút Xóa của 1 DM | `<dòng>.getByRole('button', { name: 'Xóa' })` | 1 | Cả bảng có 3 nút "Xóa" trùng tên, phải khoanh theo dòng |
| Tiêu đề tab Sản phẩm | `getByRole('heading', { name: 'Quản lý Sản phẩm' })` | 1 | Chờ tab render |
| `select` danh mục | `getByRole('combobox')` | 1 | Tab Sản phẩm chỉ có 1 `select`, không có label/name |
| Option DM test | `getByRole('combobox').getByRole('option', { name: <tên>, exact: true })` | 1 | Case AT-04; option chỉ có chữ là tên DM |

Ghi chú:
- App báo kết quả bằng cách cập nhật bảng, không có câu thông báo thành công, không chuyển trang. Thêm thành công: ô tên được xóa về `""` và có dòng mới `#<id> | <tên>`. Thêm/xóa lỗi mới bật `alert("Lỗi thêm DM: ...")` / `alert("Lỗi xóa DM: ...")` (`App.jsx:149`, `158`). Lần chạy thử không có dialog nào (kể cả tên rỗng và `<script>`).
- Tên rỗng qua UI: không alert, bảng thêm 1 dòng tên trống (3 → 6 dòng sau 3 lần thêm), đúng dự đoán Fail case 2. Case 2, 3 assert theo số dòng `tbody tr` và `GET /api/categories`, không lọc theo tên.
- `<script>alert(1)</script>` hiện đúng dạng chữ trong ô (lọc `cell` theo đúng chuỗi khớp 1), không bật dialog.
- Vẫn phải đăng ký `page.on('dialog')`/`waitForEvent('dialog')` trước khi bấm "Thêm mới" ở case 2, 3: nếu app sửa đúng bằng `alert` thì `click()` sẽ treo (bẫy alert đồng bộ).
- Giữ đăng nhập: token lưu ở `localStorage` key `adminToken` (`App.jsx:70`). Reload không mất đăng nhập (không còn ô Email), nhưng `activeTab` là state nên reload quay về **Dashboard**, phải bấm lại menu "Danh mục" (case AT-03). DM test vẫn còn sau reload.
- Tab Sản phẩm: `select` có đủ option của mọi DM, kể cả DM test, `<script>` và option rỗng. Chỉ xem, không bấm "Lưu sản phẩm".
- Xóa qua UI: bấm "Xóa" ở dòng DM test → dòng biến mất, không có confirm.
- `fetchData` gọi `/admin/users` trước `/categories` (`App.jsx:41-50`); nếu 1 API lỗi thì bảng DM không tải. Không gặp khi chạy thử.
- API cho case 7–9 (đã gọi thử): `POST /api/categories` không token → 401 `Unauthorized`; token `test@eshop.com` → 200 tạo được (Fail); admin tạo DM rồi token user `DELETE` → 200 xóa được (Fail). Id dùng `AUTOINCREMENT` (DM thử ra `#8`, không tái dùng id 4–7), nên assert theo tên/id trả về, không đoán id.
- `helpers/common.js` có `ADMIN` nhưng chưa export, Bước 4 cần thêm vào `module.exports` (hoặc helper dọn DM id > 3).
- Sau khi chạy thử, đã xóa DM id 9–11 bằng token admin (id 8 đã xóa qua UI); `GET /api/categories` còn đúng 3 DM seed.
