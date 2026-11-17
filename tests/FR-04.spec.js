const { test, expect } = require('@playwright/test');
const { API, runBy, loginWeb, apiToken, resetProfile } = require('../helpers/common');
const cases = require('../data/FR-04.json');

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
        return;
      }

      await loginWeb(page);
      await page.getByRole('link', { name: /^Chào, / }).click();
      await expect(page.getByRole('heading', { name: 'Hồ sơ của bạn' })).toBeVisible();

      if (!c.input) return; // D-04-09 chỉ kiểm tra ô Email

      const fields = {
        name: page.locator('label:has-text("Họ Tên") + input'),
        phone: page.locator('label:has-text("Số điện thoại") + input'),
        address: page.getByPlaceholder('Nhập địa chỉ của bạn'),
      };
      for (const [key, value] of Object.entries(c.input)) await fields[key].fill(value);

      // App báo kết quả bằng alert(). Phải accept ngay khi dialog xuất hiện: alert SĐT sai
      // bật đồng bộ lúc bấm nên click() sẽ treo nếu chờ click xong mới xử lý dialog.
      // Case thiếu Họ Tên không có alert nên trả về null sau 3 giây.
      const alertMessage = page.waitForEvent('dialog', { timeout: 3_000 })
        .then(async (d) => { const m = d.message(); await d.accept(); return m; })
        .catch(() => null);
      await page.getByRole('button', { name: 'Cập nhật' }).click();
      test.info().annotations.push({ type: 'alert', description: String(await alertMessage) });
    });
  }
});
