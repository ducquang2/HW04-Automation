const { spawnSync } = require('child_process');
const features = ['FR-04', 'FR-09', 'FR-14'];
const browsers = ['chromium', 'firefox', 'webkit'];

for (const f of features) {
  for (const b of browsers) {
    spawnSync('npx', ['playwright', 'test', `tests/${f}.spec.js`, `--project=${b}`], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, FEATURE: f, BROWSER: b },
    });
  }
}
