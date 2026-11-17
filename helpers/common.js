const { expect } = require('@playwright/test');

const API = 'http://localhost:3000';
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

async function apiToken(request, user = USER) {
  const res = await request.post(`${API}/api/login`, { data: { email: user.email, password: user.password } });
  return (await res.json()).token;
}

// Trả hồ sơ user test về đúng seed (PUT ghi đè mọi cột nên phải gửi đủ, kể cả role)
async function resetProfile(request) {
  const token = await apiToken(request);
  await request.put(`${API}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: USER.name, phone: null, shipping_address: null, role: 'user' },
  });
}

module.exports = { API, USER, runBy, loginWeb, apiToken, resetProfile };
