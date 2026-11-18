# HW04 – Automation Testing với Playwright

- MSSV: 20120359
- Họ tên: Nguyễn Đức Quang
- Email sinh viên: 20120359@student.hcmus.edu.vn
- Repo: https://github.com/ducquang2/HW04-Automation
- SUT: EShop (fork `kqanGit/eshop-sut`), chạy local
- Trang GitHub Issues: https://github.com/kqanGit/eshop-sut/issues (nhãn `HW04`, `Quang`)
- Feature: FR-04 Hồ sơ cá nhân, FR-09 Mã giảm giá, FR-14 CRUD danh mục (Admin)

## Test summary

Số liệu lấy từ 9 HTML report trong `reports/`, chạy chính thức ngày 2026-11-18 (04:48–04:51 UTC). Chi tiết ở [report/main-report.md](report/main-report.md) mục 5.

| Chỉ số | Giá trị |
| --- | --- |
| Số feature | 3 |
| Số test tự động hóa | 36 (12 / feature) |
| Số lượt browser | 9 (3 feature x Chromium / Firefox / WebKit) |
| Tổng lượt chạy test | 108 |
| Pass | 72 |
| Fail | 36 (đều do lỗi EShop, không phải lỗi script) |
| Số bug | 9 (issue #165–#173) |
| Video demo | `<link YouTube>` |
| Video Agent Skill | `<link YouTube>` |

Pass / fail theo feature và browser:

| Feature | Chromium | Firefox | WebKit | Tổng pass / fail |
| --- | --- | --- | --- | --- |
| FR-04 | 6 / 6 | 6 / 6 | 6 / 6 | 18 / 18 |
| FR-09 | 8 / 4 | 8 / 4 | 8 / 4 | 24 / 12 |
| FR-14 | 8 / 4 | 8 / 4 | 8 / 4 | 24 / 12 |
| Tổng | 22 / 14 | 22 / 14 | 22 / 14 | 72 / 36 |

## Bảng tự chấm điểm

| STT | Tiêu chí | Điểm | Tự chấm |
| --- | --- | --- | --- |
| 1 | Feature FR-04 | 25 | |
| 2 | Feature FR-09 | 25 | |
| 3 | Feature FR-14 | 25 | |
| 4 | Video demo | 15 | |
| 5 | Agent Skill | 10 | |
| | **Tổng** | **100** | |

## Cách chạy

Yêu cầu: Node.js, pnpm, EShop chạy local (API `:3000`, web `:5173`, admin `:5174`). Khởi động lại backend trước mỗi lần chạy để reset DB.

```bash
pnpm install
pnpm exec playwright install chromium firefox webkit

# chạy cả 9 lượt, report ra reports/FR-xx-<browser>
pnpm run-all

# chạy 1 feature
FEATURE=FR-04 pnpm exec playwright test tests/FR-04.spec.js

# xem report
pnpm exec playwright show-report reports/FR-04-chromium
```

## Cấu trúc thư mục

```text
tests/                 script Playwright (FR-04, FR-09, FR-14)
data/                  dữ liệu test JSON, mỗi feature 12 dòng
helpers/               helper dùng chung
reports/               9 HTML report (FR-xx-<browser>)
report/                main-report (.md + .pdf), bugs.md, bug-screenshots/, github-issues.png
ai/                    audit-report (.md + .pdf), critique (.md + .pdf)
skills/                Agent Skill eshop-playwright-feature
git-commit-log.txt     log commit
playwright.config.js   cấu hình Playwright
run-all.js             chạy 3 feature x 3 browser
```
