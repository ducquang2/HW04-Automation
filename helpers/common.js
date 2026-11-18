const { expect } = require('@playwright/test');

const API = 'http://localhost:3000';
const USER = { email: 'test@eshop.com', password: 'Test1234!', name: 'Test User' };
const ADMIN = { email: 'admin@eshop.com', password: 'Admin123!' };

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

// Đọc hồ sơ đang lưu trong database để xác nhận dữ liệu
async function getMe(request) {
  const token = await apiToken(request);
  const res = await request.get(`${API}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

// Giỏ chỉ nằm trong React state nên phải đi bằng click (goto('/cart') làm mất giỏ)
async function goToCheckout(page) {
  await page.getByRole('link', { name: 'EShop', exact: true }).click();
  const card = page.locator('div.border').filter({ has: page.getByRole('heading', { name: 'Bàn phím cơ Keychron Q1' }) });
  await card.getByRole('button', { name: 'Thêm vào giỏ' }).click();
  await page.getByRole('link', { name: 'Giỏ hàng' }).click();
  await expect(page.getByRole('heading', { name: 'Giỏ Hàng' })).toBeVisible();
  await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
  await expect(page.getByRole('heading', { name: 'Xác Nhận Đơn Hàng' })).toBeVisible();
}

// Tạo user mới để ghi lượt dùng coupon mà không đụng user test
async function createTempUser(request) {
  const user = { name: 'Temp User', email: `temp-${Date.now()}@eshop.com`, password: 'Temp1234!' };
  const res = await request.post(`${API}/api/register`, { data: user });
  return { id: (await res.json()).id, token: await apiToken(request, user) };
}

// Xóa mọi user ngoài seed (id 1 admin, id 2 test) bằng token admin
async function cleanupUsers(request) {
  const headers = { Authorization: `Bearer ${await apiToken(request, ADMIN)}` };
  const users = await (await request.get(`${API}/api/admin/users`, { headers })).json();
  for (const u of users.filter((u) => u.id > 2)) await request.delete(`${API}/api/admin/users/${u.id}`, { headers });
}

module.exports = { API, USER, runBy, loginWeb, apiToken, resetProfile, getMe, goToCheckout, createTempUser, cleanupUsers };
