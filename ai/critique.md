# AI Critique

AI làm nhanh phần khung script, chạy 3 browser và gom dẫn chứng. Nhưng qua 3 feature, nó sai lặp lại theo một kiểu: tin vào code app và tin rằng bước chuẩn bị luôn chạy đúng.

**Sai.** Ở FR-04, AI chờ `click()` xong mới `accept()` alert, trong khi alert SĐT bật đồng bộ ngay lúc bấm, nên 8/12 test treo 30 giây.

**Thiên lệch.** AI lấy câu chữ alert từ code app rồi đặt assertion câu chữ trước assertion database. D-04-03 dừng ở câu chữ nên report không cho thấy SĐT sai đã bị lưu. Sửa ở FR-04 rồi, sang FR-09 AI vẫn lặp lại. Ở FR-14, AI lấy expected từ HW02: chọn case trùng tên, xóa danh mục còn sản phẩm, và ghi mã 401/403, đều là điều đặc tả không quy định.

**Thiếu.** D-09-08 có thể xanh dù ghi lượt dùng lỗi, vì AI không assert response. Skill đã thêm quy tắc này sau FR-09, nhưng ở FR-14 AI vẫn không kiểm token user, D-14-08 và AT-01 có thể xanh vì gửi `Bearer undefined`. `toEqual` danh sách danh mục phụ thuộc thứ tự, chỉ xanh vì SQLite đang trả theo id.

**Nguyên nhân.** Code app là nguồn dễ đọc nhất nên AI coi hành vi hiện tại là đúng, dù đặc tả mới là chuẩn. Test xanh không làm AI nghi ngờ, nên lỗi "xanh vì lý do sai" chỉ lộ khi tôi bắt nó review lại từng dòng.

**Nguyên tắc.** Expected chỉ lấy từ đặc tả. Assertion chính kiểm dữ liệu, phần phụ dùng `expect.soft`. Bước chuẩn bị qua API phải assert ok. Test xanh cũng phải review như test đỏ. Viết bài học vào skill chưa đủ, vẫn phải kiểm lại ở feature sau.
