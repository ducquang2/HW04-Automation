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
- Quyết định của sinh viên sau Bước 4: (1) D-09-06 (C4, không token) chỉ assert "không success", không assert số tiền giảm để không lẫn với lỗi công thức percent (BUG-09-01); (2) giữ email user tạm theo `Date.now()` (`workers: 1` nên không trùng).
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
