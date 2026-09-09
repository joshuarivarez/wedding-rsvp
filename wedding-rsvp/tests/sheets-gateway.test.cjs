const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function gateway(fetch) {
  const context = vm.createContext({ exports: {}, fetch, AbortSignal, setTimeout: fn => fn() });
  const source = ts.transpileModule(fs.readFileSync('src/rsvp/sheets.gateway.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInContext(source, context);
  return new context.exports.SheetsRsvpGateway('https://script.google.com/test/exec');
}

test('lookup retries a network failure once and reads the confirmed result', async () => {
  let calls = 0;
  const g = gateway(async () => {
    if (++calls === 1) throw new TypeError('Failed to fetch');
    return { ok: true, json: async () => ({ ok: true, data: [] }) };
  });
  assert.equal((await g.findInvitations('Juan')).length, 0);
  assert.equal(calls, 2);
});

test('submissions never retry after an ambiguous network failure', async () => {
  let calls = 0;
  const g = gateway(async () => { calls++; throw new TypeError('Failed to fetch'); });
  await assert.rejects(g.submit({}), /could not confirm/);
  assert.equal(calls, 1);
});

test('lookup does not retry application errors', async () => {
  let calls = 0;
  const g = gateway(async () => {
    calls++;
    return { ok: true, json: async () => ({ ok: false, error: 'Missing Guests tab' }) };
  });
  await assert.rejects(g.findInvitations('Juan'), /Missing Guests tab/);
  assert.equal(calls, 1);
});
