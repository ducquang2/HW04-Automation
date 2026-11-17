const { test, expect } = require('@playwright/test');
const { API, USER, runBy, loginWeb, apiToken, resetProfile, getMe } = require('../helpers/common');
const cases = require('../data/FR-04.json');

// Tên trường trong file data -> tên cột trong database
const DB_COLUMN = { name: 'name', phone: 'phone', address: 'shipping_address' };

test.describe('FR-04 Hồ sơ cá nhân', () => {
  test.beforeEach(async ({ request }, testInfo) => {
    runBy(testInfo);
    await resetProfile(request);
  });

  test.afterEach(async ({ request }) => {
    await resetProfile(request);
  });

  for (const c of cases) {
    test(`${c.id} – ${c.title}`, async ({ page, request }) => {
      if (c.layer === 'api') {
        const token = await apiToken(request);
        const res = await request.put(`${API}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
          data: c.body,
        });
        expect(res.ok()).toBe(true);
        // role-unchanged: role trong database không đổi
        expect((await getMe(request)).role).toBe(c.expectedRole);
        return;
      }

      await loginWeb(page);
      await page.getByRole('link', { name: /^Chào, / }).click();
      await expect(page.getByRole('heading', { name: 'Hồ sơ của bạn' })).toBeVisible();

      const fields = {
        email: page.locator('label:has-text("Email") + input'),
        name: page.locator('label:has-text("Họ Tên") + input'),
        phone: page.locator('label:has-text("Số điện thoại") + input'),
        address: page.getByPlaceholder('Nhập địa chỉ của bạn'),
      };

      if (c.expected === 'email-locked') {
        await expect(fields.email).toBeDisabled();
        await expect(fields.email).toHaveValue(c.expectedEmail);
        return;
      }

      for (const [key, value] of Object.entries(c.input)) await fields[key].fill(value);

      // App báo kết quả bằng alert(). Phải accept ngay khi dialog xuất hiện: alert SĐT sai
      // bật đồng bộ lúc bấm nên click() sẽ treo nếu chờ click xong mới xử lý dialog.
      // Case thiếu Họ Tên không có alert nên trả về null sau 3 giây.
      const alertMessage = page.waitForEvent('dialog', { timeout: 3_000 })
        .then(async (d) => { const m = d.message(); await d.accept(); return m; })
        .catch(() => null);
      await page.getByRole('button', { name: 'Cập nhật' }).click();
      const message = await alertMessage;
      test.info().annotations.push({ type: 'alert', description: String(message) });

      const saved = await getMe(request);

      if (c.expected === 'success') {
        expect(message).toContain('thành công');
        for (const [key, value] of Object.entries(c.input)) expect(saved[DB_COLUMN[key]]).toBe(value);
        if (c.checkAfterReload) {
          await page.reload();
          for (const [key, value] of Object.entries(c.input)) await expect(fields[key]).toHaveValue(value);
        }
      }

      if (c.expected === 'invalid-phone') {
        expect(message).toContain('không hợp lệ');
        expect(saved.phone).toBeNull();
      }

      if (c.expected === 'missing-name') {
        // Trình duyệt chặn submit bằng bong bóng HTML5, nội dung bong bóng mỗi browser một kiểu nên không assert chữ
        expect(await fields.name.evaluate((el) => el.validity.valueMissing)).toBe(true);
        await expect(page).toHaveURL(/\/profile$/);
        expect(message).toBeNull();
        expect(saved.name).toBe(USER.name);
      }
    });
  }
});
