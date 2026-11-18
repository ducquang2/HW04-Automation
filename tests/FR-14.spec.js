const { test, expect } = require('@playwright/test');
const { API, ADMIN, runBy, apiToken, loginAdmin, openAdminTab, cleanupCategories } = require('../helpers/common');
const cases = require('../data/FR-14.json');

// Bắt alert trước khi bấm. Accept ngay trong .then vì alert có thể bật đồng bộ lúc bấm,
// chờ click() xong mới xử lý thì click() treo (bẫy FR-04). Không có dialog thì trả null sau 3 giây.
async function clickAndCatchDialog(page, button) {
  const dialog = page.waitForEvent('dialog', { timeout: 3_000 })
    .then(async (d) => { const m = d.message(); await d.accept(); return m; })
    .catch(() => null);
  await button.click();
  const message = await dialog;
  test.info().annotations.push({ type: 'dialog', description: String(message) });
  return message;
}

// Admin tạo danh mục qua API cho case cần có sẵn danh mục (AT-01, AT-02)
async function createCategory(request, name) {
  const headers = { Authorization: `Bearer ${await apiToken(request, ADMIN)}` };
  const res = await request.post(`${API}/api/categories`, { headers, data: { name } });
  expect(res.ok()).toBe(true);
  return (await res.json()).id;
}

// Đọc danh mục đang lưu trong database để đối chiếu với bảng
async function getCategories(request) {
  const res = await request.get(`${API}/api/categories`);
  expect(res.ok()).toBe(true);
  return res.json();
}

test.describe('FR-14 CRUD danh mục', () => {
  test.beforeEach(async ({ request }, testInfo) => {
    runBy(testInfo);
    await cleanupCategories(request);
  });

  // Chạy cả khi test fail nên danh mục test (id > 3) luôn bị xóa, 3 danh mục seed không bị đụng
  test.afterEach(async ({ request }) => {
    await cleanupCategories(request);
  });

  for (const c of cases) {
    test(`${c.id} – ${c.title}`, async ({ page, request }) => {
      const id = c.createFirst ? await createCategory(request, c.name) : null;

      if (c.layer === 'api') {
        const headers = c.token === 'user' ? { Authorization: `Bearer ${await apiToken(request)}` } : {};
        const res = c.method === 'POST'
          ? await request.post(`${API}/api/categories`, { headers, data: { name: c.name } })
          : await request.delete(`${API}/api/categories/${id}`, { headers });
        test.info().annotations.push({ type: 'response', description: `${res.status()} ${await res.text()}` });
        // FR-12 không quy định mã HTTP nên chỉ cần không ok, rồi kiểm dữ liệu không đổi
        expect(res.ok()).toBe(false);
        const list = await getCategories(request);
        if (c.method === 'POST') expect(list.map((x) => x.name)).not.toContain(c.name);
        else expect(list.map((x) => x.id)).toContain(id);
        return;
      }

      await loginAdmin(page);
      await openAdminTab(page, 'Danh mục');
      const rows = page.locator('tbody tr');
      const rowOf = (name) => rows.filter({ has: page.getByRole('cell', { name, exact: true }) });

      const nameInput = page.getByPlaceholder('Tên danh mục mới');
      let message = null;
      if (c.expected === 'deleted') {
        message = await clickAndCatchDialog(page, rowOf(c.name).getByRole('button', { name: 'Xóa' }));
      } else if (c.expected !== 'listed') {
        await nameInput.fill(c.name);
        message = await clickAndCatchDialog(page, page.getByRole('button', { name: 'Thêm mới' }));
      }

      if (c.expected === 'created') {
        // Ô tên về rỗng là hành vi app, không có trong đặc tả nên dùng soft
        await expect.soft(nameInput).toHaveValue('');
        await expect(rowOf(c.name)).toBeVisible();
        expect((await getCategories(request)).map((x) => x.name)).toContain(c.name);
        if (c.noDialog) {
          // Script không chạy: không có dialog, ô tên hiện nguyên chuỗi dạng chữ
          expect(message).toBeNull();
          await expect(rowOf(c.name).locator('td:nth-child(2)')).toHaveText(c.name);
        }
      }

      if (c.expected === 'rejected-empty') {
        // clickAndCatchDialog đã chờ 3 giây (hoặc tới khi có dialog) nên thao tác thêm đã xong
        expect((await getCategories(request)).filter((x) => x.id > 3)).toEqual([]);
        await expect(rows).toHaveCount(3);
      }

      if (c.expected === 'persisted') {
        await page.reload();
        await openAdminTab(page, 'Danh mục');
        await expect(rowOf(c.name)).toBeVisible();
        expect((await getCategories(request)).map((x) => x.name)).toContain(c.name);
      }

      if (c.expected === 'in-product-select') {
        await openAdminTab(page, 'Sản phẩm');
        // option trong select không "visible" theo Playwright nên đếm số phần tử
        await expect(page.getByRole('combobox').getByRole('option', { name: c.name, exact: true })).toHaveCount(1);
      }

      if (c.expected === 'deleted') {
        await expect(rowOf(c.name)).toHaveCount(0);
        expect((await getCategories(request)).map((x) => x.id)).not.toContain(id);
      }

      if (c.expected === 'listed') {
        await expect(rows.locator('td:nth-child(2)')).toHaveText(c.expectedNames);
        expect((await getCategories(request)).map((x) => x.name)).toEqual(c.expectedNames);
      }
    });
  }
});
