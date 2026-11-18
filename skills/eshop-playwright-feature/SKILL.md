---
name: eshop-playwright-feature
description: Tự động hóa một feature web của EShop bằng Playwright theo 7 bước data-driven (chọn test case HW02, locator, data JSON, khung script, assertion, chạy 3 browser, review), có điểm dừng để người review sau mỗi bước. Dùng khi cần viết test tự động cho một FR của EShop trong HW04.
---

# Tự động hóa một feature EShop bằng Playwright

## Đầu vào

| Cần có | Ví dụ |
| --- | --- |
| Mã feature | `FR-04` |
| Test case HW02 của feature | `HW02-20120359/features/FR-xx/` (domain.md, bva.md) |
| Đặc tả feature | Mục FR-xx trong `eshop-sut/README.md` |
| Mã nguồn trang | `frontend-web/src/pages/*.jsx` hoặc `frontend-admin/src/...` |
| Repo HW04 đã setup | `playwright.config.js`, `helpers/common.js` (`runBy`, `loginWeb`, `apiToken`) |
| EShop đang chạy | backend `:3000`, web `:5173`, admin `:5174` |

Nếu thiếu một mục, hỏi người dùng trước khi làm.

## Quy tắc chung

- `expected` luôn viết theo **đặc tả**, không theo hành vi hiện tại của app. Test đỏ vì lỗi EShop là kết quả đúng; không sửa expected cho test xanh.
- Dữ liệu test nằm trong `data/FR-xx.json`, không viết mảng dữ liệu trong file spec.
- Không dùng `waitForTimeout`; dùng `expect(...)` tự chờ hoặc `waitForEvent`.
- Sau mỗi bước, ghi vào `ai/audit-report.md`: thời gian, prompt nguyên văn, output tóm tắt. Chỉ ghi các bước tạo ra nội dung bài làm.
- Commit theo dạng `type(FR-xx): mô tả ngắn` (`test`, `fix`, `docs`).

## Các bước

Mỗi bước kết thúc bằng một **điểm dừng**: trình bày kết quả, chờ người dùng duyệt hoặc sửa rồi mới sang bước sau.

### Bước 1 – Chọn 12 test case

1. Đọc test case HW02 và đặc tả của feature.
2. Bỏ case trùng dữ liệu (thường BVA trùng Domain); chọn 12 case tự động hóa được.
3. Với mỗi case ghi: ID HW02, nội dung, dữ liệu, expected theo đặc tả, tầng chạy (UI/API), dự đoán Pass/Fail kèm lý do từ code. Thiếu case thì thêm ID `AT-xx` và ghi rõ.
4. Liệt kê case bị loại và lý do.

**Điểm dừng:** người dùng chốt 12 case và tầng chạy của từng case.

### Bước 2 – Locator

1. Đọc file `.jsx` của trang, liệt kê locator cho từng phần tử, kèm lý do chọn.
2. Chạy thử từng locator trên app đang chạy (script tạm ngoài repo), báo số phần tử khớp; mỗi locator phải khớp đúng 1.
3. Ghi lại cách app báo kết quả (alert, text trên trang, chuyển trang) và cách giữ đăng nhập.

**Điểm dừng:** người dùng duyệt bảng locator.

### Bước 3 – File dữ liệu

1. Viết `data/FR-xx.json`: mỗi dòng có `id` (`TC-FRxx-<ID HW02>`), `title`, `layer`, dữ liệu nhập, `expected`.
2. `expected` là một tập nhỏ giá trị (ví dụ `success`, `invalid-phone`), mỗi giá trị là một nhánh assert.
3. Chỉ ra case nào cần trường riêng (ví dụ `checkAfterReload`, `body` cho case API).
4. Kiểm tra: đủ 12 dòng, `id` không trùng.

**Điểm dừng:** người dùng rà từng giá trị `expected` so với đặc tả.

### Bước 4 – Khung script

1. Viết `tests/FR-xx.spec.js`: `require` file data, vòng lặp tạo 1 test cho mỗi dòng, dùng helper trong `helpers/common.js`.
2. `beforeEach`: `runBy(testInfo)` và dọn dữ liệu bằng API; `afterEach`: dọn lại để feature khác và browser khác chạy từ trạng thái seed.
3. Chưa cần assertion đầy đủ. Chạy trên Chromium: `FEATURE=FR-xx BROWSER=chromium pnpm exec playwright test tests/FR-xx.spec.js --project=chromium`.
4. Sau khi chạy, gọi API xác nhận dữ liệu đã về seed.
5. Commit `test(FR-xx): khung spec ...`.

**Điểm dừng:** script chạy hết không treo, dữ liệu về seed.

### Bước 5 – Assertion

1. Thêm assertion cho từng giá trị `expected`, ít nhất 3 kiểu: URL, hiển thị, nội dung, giá trị ô, thuộc tính, dialog, dữ liệu qua API.
2. Assertion chính là assertion theo đặc tả (thường là dữ liệu đã lưu). Câu chữ thông báo lấy từ code app thì dùng `expect.soft` để test vẫn chạy tới assertion chính. Assertion phụ (trạng thái nút, giá trị ô) đặt trước assertion chính cũng phải dùng `expect.soft` (lỗi lặp lại ở cả FR-04 và FR-09).
3. Mọi bước chuẩn bị dữ liệu qua API (ghi lượt dùng, tạo user) phải assert response ok, nếu không test có thể xanh vì lý do sai.
4. Chạy Chromium, so số test đỏ với dự đoán ở bước 1.
5. Commit `test(FR-xx): thêm assertion ...`.

**Điểm dừng:** người dùng xem bảng assertion theo `expected` và danh sách test đỏ.

### Bước 6 – Chạy 3 browser, phân loại test đỏ

1. Chạy `FEATURE=FR-xx pnpm exec playwright test tests/FR-xx.spec.js` (cả 3 project). Khi chạy chính thức không thêm `--reporter=list` (sẽ không ra HTML report).
2. Với mỗi test đỏ: lỗi script hay lỗi EShop? Dẫn chứng bằng dòng code của app (file:dòng) hoặc nội dung lỗi/ảnh.
3. Lỗi script: sửa và commit `fix(FR-xx): ...`. Lỗi EShop: giữ đỏ, gom thành bug, đối chiếu với issue HW02 nếu có.
4. Ghi rõ case nào fail chỉ trên một browser.

**Điểm dừng:** người dùng duyệt bảng phân loại và danh sách bug.

### Bước 7 – Review

1. Đọc lại toàn bộ spec và data, tìm: selector dễ vỡ, chờ không ổn định, assertion yếu hoặc theo hành vi app, thiếu dọn dữ liệu, dữ liệu viết trong script.
2. Sửa lỗi tìm được, chạy lại, commit `fix(FR-xx): ...`.
3. Lập bảng "Bước / AI sai gì / Vì sao / Đã sửa thế nào / Commit" từ lỗi thật của các bước trước, kể cả lỗi không sửa (đưa vào gap analysis).

**Điểm dừng:** người dùng duyệt bảng review trước khi đưa vào report.

## Định dạng đầu ra

| File | Nội dung |
| --- | --- |
| `data/FR-xx.json` | 12 dòng dữ liệu |
| `tests/FR-xx.spec.js` | Script data-driven, có `runBy` và dọn dữ liệu |
| `helpers/common.js` | Helper mới nếu cần (giữ helper cũ) |
| `ai/audit-report.md` | Mỗi bước một mục: thời gian, prompt, output |
| Commit | Ít nhất 3 commit có sửa `.spec.js` cho mỗi feature |

Thư mục `reports/` chỉ chứa report của lượt chạy chính thức (`pnpm run-all`); xóa report và `test-results/` của các lần chạy thử.

## Bẫy của EShop đã gặp

| Bẫy | Biểu hiện | Cách xử lý |
| --- | --- | --- |
| Label không gắn với input | `getByLabel('Họ Tên')` trả về 0 phần tử | `label:has-text("Họ Tên") + input`; `textarea` thì dùng placeholder |
| Trang đăng nhập web có nhãn lạ | Nhãn "Username", nút "Sign In", tiêu đề "Đăng Ký" | Locator theo chữ đang hiển thị (đã có trong `loginWeb`) |
| Kết quả báo bằng `alert()` | Không đọc được thông báo trên trang | `page.waitForEvent('dialog')` đăng ký trước khi bấm |
| Alert bật đồng bộ khi submit | `click()` treo tới timeout 30 giây | Accept dialog ngay trong `.then` của `waitForEvent`, không chờ `click()` xong |
| Ô `required` để trống | Không có alert, chỉ có bong bóng HTML5 khác nhau giữa browser | Assert `el.validity.valueMissing` và URL không đổi; không assert chữ trong bong bóng |
| `PUT /api/users/me` ghi đè mọi cột | Cột không gửi bị thành `null` | Khi dọn dữ liệu gửi đủ mọi cột của seed |
| Backend nhận `role` từ body | Test leo quyền làm user thành `admin` cho các test sau | Dọn dữ liệu phải gửi lại `role: "user"` |
| Đăng nhập lưu trong `localStorage` | – | Sau khi đăng nhập có thể `goto` và `reload` mà không mất đăng nhập |
| Frontend chặn trước backend | Lỗi validate của backend không lộ ra khi test qua UI | Chọn tầng API cho case muốn kiểm tra backend; nếu giữ UI thì ghi vào gap analysis |
| Ảnh chụp khi fail không có alert | Playwright chụp sau khi dialog đã đóng | Ghi nội dung alert vào annotation của test làm bằng chứng |
| Giỏ hàng chỉ nằm trong React state | `goto('/cart')` hoặc `reload` làm giỏ trống | Đi bằng click: logo → Thêm vào giỏ → Giỏ hàng → Tiến hành thanh toán (helper `goToCheckout`) |
| Backend và frontend in số tiền khác nhau | Câu thông báo backend có dấu phẩy (`300,000 ₫`), frontend in theo `vi-VN` (`4.000.000 ₫`) | So số tiền sau khi bỏ ký tự không phải số nhưng giữ dấu `-`; câu chữ dùng `expect.soft` |
| `count()` không tự chờ | Gọi ngay sau click ra 0 phần tử vì trang chưa render | Chờ heading của trang hoặc dùng `expect` tự chờ |
| Sửa ô Tổng tiền / ô mã xóa kết quả cũ | Dòng lỗi / khối giảm giá của lần trước biến mất | Mỗi case fill lại rồi bấm Áp dụng; không assert kết quả cũ sau khi sửa ô |
| Lượt dùng coupon không có API xóa | Dùng `test@eshop.com` một lần là hết lượt, các case và browser sau đỏ sai | Case hết lượt tạo user tạm, ghi lượt qua `POST /api/coupon-usage`, xóa user (id > 2) bằng token admin ở `beforeEach`/`afterEach`; không bấm "Xác Nhận Thanh Toán" bằng user test |
| Sản phẩm rẻ nhất 4.000.000 ₫ | Không tạo được tổng dưới ngưỡng coupon qua giỏ hàng | Test biên sửa ô "Tổng tiền thanh toán" (dựa vào lỗi FR-08), ghi rõ trong report |

Khi làm feature mới, bẫy mới gặp được thêm vào bảng này.
