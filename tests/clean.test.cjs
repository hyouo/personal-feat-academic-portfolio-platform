const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { clean } = require('../scripts/clean.cjs');

test('clean removes dependencies but preserves the entire user portfolio', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-clean-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const retained = ['package-lock.json', 'frontend/package-lock.json', 'backend/package-lock.json',
    'backend/src/db/portfolio.db', 'backend/src/db/portfolio.db-wal', 'backend/.env',
    'backend/uploads/paper.pdf'];
  for (const file of [...retained, 'node_modules/a.js', 'frontend/node_modules/b.js', 'backend/node_modules/c.js']) {
    fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
    fs.writeFileSync(path.join(root, file), file);
  }
  clean(root);
  clean(root); // Running clean twice must be safe.
  for (const file of retained) assert.equal(fs.readFileSync(path.join(root,file),'utf8'),file);
  for (const folder of ['node_modules','frontend/node_modules','backend/node_modules']) {
    assert.equal(fs.existsSync(path.join(root,folder)),false);
  }
});
