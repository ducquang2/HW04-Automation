const { test, expect } = require('@playwright/test');
const { API, runBy, loginWeb, goToCheckout, createTempUser, cleanupUsers } = require('../helpers/common');
const cases = require('../data/FR-09.json');

// Câu lỗi lấy từ backend/server.js (đặc tả không quy định câu chữ) nên chỉ dùng cho expect.soft
const ERROR_TEXT = { C1: 'không tồn tại', C2: 'hết hạn', C3: 'chưa đủ giá trị tối thiểu', C5: 'đã đạt giới hạn' };

// "-36.000.000 ₫" -> -36000000 (giữ dấu trừ để số âm không thành số dương)
const toNumber = (text) => Number(text.replace(/[^\d-]/g, ''));

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
        const body = await res.json();
        test.info().annotations.push({ type: 'response', description: `${res.status()} ${JSON.stringify(body)}` });
        if (c.expected === 'applied') {
          expect(body.success).toBe(true);
          expect(body.discount_amount).toBe(c.discount);
          expect(body.final_amount).toBe(c.final);
        }
        // error: chỉ cần không success, không kiểm mã HTTP
        if (c.expected === 'error') expect(body.success).not.toBe(true);
        return;
      }

      // Chỉ bấm Áp dụng, không bấm "Xác Nhận Thanh Toán" để không ghi lượt dùng cho user test
      await loginWeb(page);
      await goToCheckout(page);
      const totalInput = page.locator('label:has-text("Tổng tiền thanh toán") + input');
      if (c.total !== null) {
        await totalInput.fill(String(c.total));
        await expect(totalInput).toHaveValue(String(c.total));
      }
      await page.getByPlaceholder('Nhập mã giảm giá...').fill(c.code);
      const applyButton = page.getByRole('button', { name: 'Áp dụng' });
      await expect(applyButton).toBeEnabled();
      await applyButton.click();

      const error = page.locator('p.text-red-600');
      const saving = page.locator('p', { hasText: 'Tiết kiệm:' }).locator('strong');
      const final = page.locator('p', { hasText: 'Thành tiền:' }).locator('strong');
      await expect(error.or(saving)).toBeVisible();

      const result = (await error.isVisible())
        ? `lỗi: ${await error.textContent()}`
        : `tiết kiệm ${await saving.textContent()}, thành tiền ${await final.textContent()}`;
      test.info().annotations.push({ type: 'result', description: result });

      if (c.expected === 'applied') {
        await expect(saving).toBeVisible();
        expect(toNumber(await saving.textContent())).toBe(c.discount);
        expect(toNumber(await final.textContent())).toBe(c.final);
        await expect(error).toHaveCount(0);
      }

      if (c.expected === 'error') {
        await expect(error).toBeVisible();
        await expect(saving).toHaveCount(0);
        expect.soft(await error.textContent()).toContain(ERROR_TEXT[c.reason]);
      }
    });
  }
});
