const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { once } = require('node:events');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-http-'));
const oldCwd = process.cwd();
process.env.PORTFOLIO_DB_PATH = path.join(root, 'test.db');
process.env.PORTFOLIO_UPLOAD_DIR = path.join(root, 'stored-files');
process.env.ADMIN_PASSWORD = 'test-only-password';
process.env.JWT_SECRET = 'test-only-secret-not-for-deployment';
process.chdir(root); // Import and upload must work outside backend/.
const app = require('../index.js');
const { db, initialize } = require('../src/db/database');
const { UPLOAD_DIR } = require('../src/paths');
let server, origin, token;
const run = (sql, params=[]) => new Promise((resolve,reject) => db.run(sql,params,error => error ? reject(error) : resolve()));

before(async () => {
  // Importing the app must not start a listener or terminate the process.
  assert.equal(process._getActiveHandles().filter(handle => handle.constructor.name === 'Server').length, 0);
  await initialize();
  fs.mkdirSync(UPLOAD_DIR, {recursive:true});
  for (const name of ['public.pdf','private.pdf','parent-private.pdf','orphan.pdf','profile.png']) {
    fs.writeFileSync(path.join(UPLOAD_DIR,name), '%PDF-test');
  }
  await run('INSERT INTO projects (id,name,is_public) VALUES (100,?,1),(101,?,0)', ['public','private']);
  for (const [name,visible,parent] of [['public.pdf',1,100],['private.pdf',0,100],['parent-private.pdf',1,101]]) {
    await run('INSERT INTO attachments (file_url,original_name,parent_type,parent_id,is_public) VALUES (?,?,?,?,?)',
      ['/uploads/'+name,name,'project',parent,visible]);
  }
  await run('UPDATE profile SET profile_image_url=? WHERE id=1',['/uploads/profile.png']);
  server = app.listen(0,'127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${server.address().port}`;
  const login = await fetch(origin+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:process.env.ADMIN_PASSWORD})});
  assert.equal(login.status,200);
  token = (await login.json()).token;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await new Promise((resolve,reject) => db.close(error => error ? reject(error) : resolve()));
  process.chdir(oldCwd);
  fs.rmSync(root,{recursive:true,force:true});
});

test('public files and profile images remain accessible', async () => {
  for (const file of ['public.pdf','profile.png']) {
    const response = await fetch(origin+'/uploads/'+file);
    assert.equal(response.status,200);
    assert.equal(await response.text(),'%PDF-test');
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.equal(response.headers.get('content-security-policy'),'sandbox');
  }
});
test('private, private-parent and unknown files are not publicly downloadable', async () => {
  for (const file of ['private.pdf','parent-private.pdf','orphan.pdf']) {
    for (const method of ['GET','HEAD']) {
      assert.equal((await fetch(origin+'/uploads/'+file,{method})).status,404);
    }
  }
});
test('admin downloads private files with bearer authorization', async () => {
  const response = await fetch(origin+'/uploads/private.pdf',{headers:{Authorization:'Bearer '+token}});
  assert.equal(response.status,200);
  assert.equal((await fetch(origin+'/uploads/private.pdf',{headers:{Authorization:'Bearer invalid'}})).status,403);
});
test('visibility changes take effect on subsequent raw-file requests', async () => {
  await run('UPDATE attachments SET is_public=0 WHERE file_url=?',['/uploads/public.pdf']);
  assert.equal((await fetch(origin+'/uploads/public.pdf')).status,404);
  await run('UPDATE attachments SET is_public=1 WHERE file_url=?',['/uploads/public.pdf']);
});
test('uploads use the same absolute storage directory as the file server', async () => {
  const body = new FormData();
  body.set('parent_id','100');body.set('parent_type','project');body.set('description','test');
  body.set('attachmentFile',new Blob(['%PDF-upload'],{type:'application/pdf'}),'paper.pdf');
  const response = await fetch(origin+'/api/attachments',{method:'POST',headers:{Authorization:'Bearer '+token},body});
  assert.equal(response.status,200);
  const attachment = (await response.json()).data;
  assert.equal(fs.readFileSync(path.join(UPLOAD_DIR,path.basename(attachment.file_url)),'utf8'),'%PDF-upload');
  assert.equal((await fetch(origin+attachment.file_url)).status,200);
});
