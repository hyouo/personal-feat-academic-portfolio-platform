// Remove dependencies only. Never remove portfolio data, uploads, env or lockfiles.
const fs = require('node:fs');
const path = require('node:path');
function clean(root = path.resolve(__dirname, '..')) {
  for (const directory of ['node_modules', 'frontend/node_modules', 'backend/node_modules']) {
    fs.rmSync(path.join(root, directory), { recursive: true, force: true });
  }
}
if (require.main === module) clean();
module.exports = { clean };
