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
        return;
      }

      await loginAdmin(page);
      await openAdminTab(page, 'Danh mục');
      const rows = page.locator('tbody tr');
      const rowOf = (name) => rows.filter({ has: page.getByRole('cell', { name, exact: true }) });

      if (c.expected === 'deleted') {
        await clickAndCatchDialog(page, rowOf(c.name).getByRole('button', { name: 'Xóa' }));
      } else if (c.expected !== 'listed') {
        await page.getByPlaceholder('Tên danh mục mới').fill(c.name);
        await clickAndCatchDialog(page, page.getByRole('button', { name: 'Thêm mới' }));
      }

      if (c.expected === 'persisted') {
        await page.reload();
        await openAdminTab(page, 'Danh mục');
      }

      if (c.expected === 'in-product-select') {
        await openAdminTab(page, 'Sản phẩm');
        const options = await page.getByRole('combobox').getByRole('option').allTextContents();
        test.info().annotations.push({ type: 'options', description: JSON.stringify(options) });
        return;
      }

      const shown = await rows.locator('td:nth-child(2)').allTextContents();
      test.info().annotations.push({ type: 'rows', description: JSON.stringify(shown) });
    });
  }
});
