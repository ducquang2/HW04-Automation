const { expect } = require('@playwright/test');

const USER = { email: 'test@eshop.com', password: 'Test1234!', name: 'Test User' };

// Ghi "Run by" vào từng test trong HTML report
function runBy(testInfo) {
  testInfo.annotations.push({ type: 'Run by', description: `20120359 @ ${new Date().toISOString()}` });
}

// Trang đăng nhập web dùng nhãn "Username" và nút "Sign In" (khác đặc tả)
async function loginWeb(page, user = USER) {
  await page.goto('/login');
  await page.locator('label:has-text("Username") + input').fill(user.email);
  await page.locator('label:has-text("Mật khẩu") + input').fill(user.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText(`Chào, ${user.name}`)).toBeVisible();
}

module.exports = { USER, runBy, loginWeb };
