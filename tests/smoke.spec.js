const { test, expect } = require('@playwright/test');
const { runBy, loginWeb } = require('../helpers/common');

test.beforeEach(async ({}, testInfo) => runBy(testInfo));

test('SMOKE – đăng nhập web bằng tài khoản test', async ({ page }) => {
  await loginWeb(page);
  await expect(page).not.toHaveURL(/\/login$/);
});
