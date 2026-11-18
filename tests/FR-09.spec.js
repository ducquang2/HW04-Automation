const { test, expect } = require('@playwright/test');
const { API, runBy, loginWeb, goToCheckout, createTempUser, cleanupUsers } = require('../helpers/common');
const cases = require('../data/FR-09.json');

test.describe('FR-09 Mã giảm giá', () => {
  test.beforeEach(async ({ request }, testInfo) => {
    runBy(testInfo);
    await cleanupUsers(request);
  });

  // Chạy cả khi test fail nên user tạm của case 7–9 luôn bị xóa
  test.afterEach(async ({ request }) => {
    await cleanupUsers(request);
  });

  for (const c of cases) {
    test(`${c.id} – ${c.title}`, async ({ page, request }) => {
      if (c.reason) test.info().annotations.push({ type: 'reason', description: c.reason });

      if (c.layer === 'api') {
        let headers = {};
        let userId = null;
        if (!c.noToken) {
          const user = await createTempUser(request);
          headers = { Authorization: `Bearer ${user.token}` };
          userId = user.id;
          const coupons = await (await request.get(`${API}/api/coupons`, { headers })).json();
          const couponId = coupons.find((x) => x.code === c.code).id;
          for (let i = 0; i < c.priorUses; i++) {
            await request.post(`${API}/api/coupon-usage`, { headers, data: { coupon_id: couponId } });
          }
        }
        const res = await request.post(`${API}/api/apply-coupon`, {
          headers,
          data: { code: c.code, total_amount: c.total, user_id: userId },
        });
        test.info().annotations.push({ type: 'response', description: `${res.status()} ${JSON.stringify(await res.json())}` });
        return;
      }

      // Chỉ bấm Áp dụng, không bấm "Xác Nhận Thanh Toán" để không ghi lượt dùng cho user test
      await loginWeb(page);
      await goToCheckout(page);
      if (c.total !== null) await page.locator('label:has-text("Tổng tiền thanh toán") + input').fill(String(c.total));
      await page.getByPlaceholder('Nhập mã giảm giá...').fill(c.code);
      await page.getByRole('button', { name: 'Áp dụng' }).click();

      const error = page.locator('p.text-red-600');
      const saving = page.locator('p', { hasText: 'Tiết kiệm:' }).locator('strong');
      const final = page.locator('p', { hasText: 'Thành tiền:' }).locator('strong');
      await expect(error.or(saving)).toBeVisible();

      const result = (await error.isVisible())
        ? `lỗi: ${await error.textContent()}`
        : `tiết kiệm ${await saving.textContent()}, thành tiền ${await final.textContent()}`;
      test.info().annotations.push({ type: 'result', description: result });
    });
  }
});
