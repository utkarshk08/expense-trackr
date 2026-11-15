const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {performance} = require('node:perf_hooks');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'expense-trackr.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(source);
assert(!/<script[^>]+src=/.test(html), 'No external JavaScript');
assert(!/localStorage|sessionStorage|setInterval|appendRow|Values\.update/.test(source), 'No polling, expense caching, or write API');

function makeEnvironment({mobile = true, reduce = false, api = true} = {}) {
  const elements = new Map();
  let animations = 0;
  function element(id) {
    const listeners = {}, attrs = {}, classes = new Set();
    return {
      id, value: '', textContent: '', innerHTML: '', hidden: false, disabled: false,
      open: false, dataset: {}, style: {}, scrollLeft: 0, scrollTop: 0, scrollWidth: 1000,
      classList: {toggle(name, value) { value ? classes.add(name) : classes.delete(name); }},
      setAttribute(name, value) { attrs[name] = value; },
      getAttribute(name) { return attrs[name]; },
      addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
      dispatch(name, event = {}) { for (const fn of listeners[name] || []) fn({...event, target: event.target || this}); },
      showModal() { this.open = true; },
      close() { this.open = false; this.dispatch('close'); },
      focus() {}, animate() { animations++; }
    };
  }
  for (const [, id] of html.matchAll(/id="([^"]+)"/g)) elements.set(id, element(id));
  const presets = ['today', 'week', 'month', 'all'].map(name => {
    const e = element('preset-' + name); e.dataset.preset = name; return e;
  });
  const mq = {matches: mobile, addEventListener(name, fn) { this.change = fn; }};
  const reduced = {matches: reduce};
  const queue = [];
  const state = {calls: 0};
  const bridge = {
    withSuccessHandler(fn) { this.success = fn; return this; },
    withFailureHandler(fn) { this.failure = fn; return this; },
    getDashboardData() { state.calls++; queue.push({success: this.success, failure: this.failure}); }
  };
  const window = {
    matchMedia(query) { return query.includes('max-width') ? mq : reduced; },
    google: api ? {script: {run: bridge}} : undefined
  };
  const context = vm.createContext({window, document: {
    getElementById(id) { assert(elements.has(id), 'Unknown element ' + id); return elements.get(id); },
    querySelectorAll(selector) { assert.equal(selector, '[data-preset]'); return presets; },
    body: {style: {}}
  }, Intl, Date, Map, Set, console});
  vm.runInContext(source, context);
  return {
    context, state, mq, presets, el: id => elements.get(id), animations: () => animations,
    run: code => vm.runInContext(code, context),
    resolve(data) { assert(queue.length); queue.shift().success(data); },
    reject() { assert(queue.length); queue.shift().failure(new Error('Offline')); }
  };
}
function row(date, amount, extra = {}) {
  return {isoDate: date, amount, time: '12:30:00', category: 'Food', payment: 'UPI', device: 'iPhone', remarks: 'Lunch', ...extra};
}
function range(env, from, to) {
  env.el('from').value = from; env.el('to').value = to;
  env.el('to').dispatch('change');
}
const data = {expenses: [row('2026-11-01', 600), row('2026-11-01', 300), row('2026-11-03', 300, {category: 'Travel', remarks: 'Train'})]};
let checks = 0;
function check(name, fn) { fn(); checks++; }

check('initial fetch; duplicate refresh ignored; one call only', () => {
  const env = makeEnvironment();
  assert.equal(env.state.calls, 1);
  assert.equal(env.el('refresh').disabled, true);
  assert.equal(env.el('total').textContent, '—');
  env.el('refresh').dispatch('click');
  assert.equal(env.state.calls, 1);
  env.resolve(data);
  assert.equal(env.el('total').textContent, '₹1,200');
  assert.equal(env.el('avg').textContent, '₹400');
  assert.match(env.el('avgDays').textContent, /3 calendar days/);
  assert.equal(env.el('refresh').disabled, false);
  assert.match(env.el('syncStatus').textContent, /^Last updated/);
  assert.equal(env.el('rows').innerHTML, '');
  assert.match(env.el('transactionList').innerHTML, /data-entry/);
});
check('calendar-day average regression cases', () => {
  const env = makeEnvironment(); env.resolve(data);
  range(env, '2026-11-01', '2026-11-01');
  assert.equal(env.el('avg').textContent, '₹900');
  range(env, '2026-11-02', '2026-11-02');
  assert.equal(env.el('avg').textContent, '₹0');
  range(env, '2026-11-01', '2026-11-30');
  assert.equal(env.el('avg').textContent, '₹40');
  range(env, '2024-02-01', '2024-02-29'); assert.equal(env.run('selectedDayCount()'), 29);
  range(env, '2026-02-01', '2026-02-28'); assert.equal(env.run('selectedDayCount()'), 28);
  range(env, '2026-03-07', '2026-03-09'); assert.equal(env.run('selectedDayCount()'), 3);
  range(env, '2026-12-31', '2027-01-01'); assert.equal(env.run('selectedDayCount()'), 2);
  range(env, '', ''); assert.equal(env.run('selectedDayCount()'), 3);
  range(env, '2026-11-05', '2026-11-01'); assert.equal(env.el('avg').textContent, '—');
  assert.equal(env.el('dateError').hidden, false);
  assert.equal(env.el('to').getAttribute('aria-invalid'), 'true');
  assert(Number.isNaN(env.run("parseDay('2026-02-30')")));
});
check('presets cover inclusive calendar days and local date', () => {
  const env = makeEnvironment(); env.resolve(data);
  assert.equal(JSON.stringify(env.run("presetBounds('week',new Date(2026,0,3,0,30))")), '["2025-12-28","2026-01-03"]');
  assert.equal(JSON.stringify(env.run("presetBounds('month',new Date(2026,0,3,0,30))")), '["2026-01-01","2026-01-03"]');
  assert.equal(JSON.stringify(env.run("presetBounds('today',new Date(2026,0,3,0,30))")), '["2026-01-03","2026-01-03"]');
  env.presets.find(x => x.dataset.preset === 'week').dispatch('click');
  assert.equal(env.run('selectedDayCount()'), 7);
  assert.equal(env.el('activeFilters').hidden, false);
  assert.equal(env.state.calls, 1);
});
check('filters and reset use loaded data only', () => {
  const env = makeEnvironment(); env.resolve(data);
  env.el('cat').value = 'Food'; env.el('cat').dispatch('change');
  assert.equal(env.el('avg').textContent, '₹300');
  assert.match(env.el('avgDays').textContent, /3 calendar days/);
  env.el('search').value = 'unknown'; env.el('search').dispatch('input');
  assert.equal(env.el('total').textContent, '₹0');
  env.el('resetFilters').dispatch('click');
  assert.equal(env.el('total').textContent, '₹1,200');
  assert.equal(env.el('activeFilters').hidden, true);
  assert.equal(env.el('from').value, '2026-11-01');
  assert.equal(env.state.calls, 1);
});
check('day drill-down, expense details, back, close and escaping', () => {
  const env = makeEnvironment();
  env.resolve({expenses: [row('2026-11-01', 600, {remarks: '<img src=x onerror=alert(1)>', category: '__proto__'}), row('2026-11-01', 300)]});
  env.run("showDay('2026-11-01')");
  assert.equal(env.el('detailDialog').open, true);
  assert.match(env.el('detailBody').innerHTML, /₹900/);
  assert(!env.el('detailBody').innerHTML.includes('<img'));
  env.run('showExpense(0,true)');
  assert.equal(env.el('detailBack').hidden, false);
  assert.match(env.el('detailBody').innerHTML, /&lt;img/);
  env.el('detailBack').dispatch('click');
  assert.match(env.el('detailBody').innerHTML, /2 expenses/);
  env.el('detailClose').dispatch('click');
  assert.equal(env.el('detailDialog').open, false);
  assert.equal(env.run('document.body.style.overflow'), '');
  assert.equal(env.state.calls, 1);
});
check('refresh preserves filters, date range, view and extends all time', () => {
  const env = makeEnvironment(); env.resolve(data);
  range(env, '2026-11-01', '2026-11-02');
  env.el('cat').value = 'Food'; env.el('cat').dispatch('change');
  env.el('rankBtn').dispatch('click');
  env.el('refresh').dispatch('click');
  env.resolve({expenses: data.expenses.concat(row('2026-11-04', 200))});
  assert.equal(env.el('to').value, '2026-11-02');
  assert.equal(env.el('cat').value, 'Food');
  assert.equal(env.run('mode'), 'rank');
  assert.equal(env.el('avg').textContent, '₹450');
  env.el('resetFilters').dispatch('click');
  env.el('refresh').dispatch('click');
  env.resolve({expenses: data.expenses.concat(row('2026-11-05', 300))});
  assert.equal(env.el('to').value, '2026-11-05');
  assert.equal(env.el('avg').textContent, '₹300');
  assert.equal(env.state.calls, 3);
});
check('failed refresh retains prior data; invalid response is rejected; retry works', () => {
  const env = makeEnvironment(); env.resolve(data);
  env.el('refresh').dispatch('click'); env.reject();
  assert.equal(env.el('total').textContent, '₹1,200');
  assert.match(env.el('syncStatus').textContent, /Couldn’t refresh/);
  assert.equal(env.el('refresh').disabled, false);
  env.el('refresh').dispatch('click'); env.resolve({expenses: [row('bad-date', 1)]});
  assert.equal(env.el('total').textContent, '₹1,200');
  env.el('refresh').dispatch('click'); env.resolve(data);
  assert.match(env.el('syncStatus').textContent, /^Last updated/);
});
check('first-load failure, no-data state and local-only preview', () => {
  const env = makeEnvironment(); env.reject();
  assert.equal(env.el('total').textContent, '—');
  assert.match(env.el('syncStatus').textContent, /Couldn’t load/);
  env.el('refresh').dispatch('click'); env.resolve({expenses: []});
  assert.equal(env.el('total').textContent, '₹0');
  assert.equal(env.el('avg').textContent, '—');
  range(env, '2026-11-01', '2026-11-03');
  assert.equal(env.el('avg').textContent, '₹0');
  const local = makeEnvironment({api: false});
  assert.match(local.el('syncStatus').textContent, /Local preview/);
  assert.equal(local.state.calls, 0);
});
check('ledger batches and responsive layout do not fetch more data', () => {
  const env = makeEnvironment(); env.resolve({expenses: Array.from({length: 75}, (_, i) => row('2026-11-01', i + 1))});
  assert.equal((env.el('transactionList').innerHTML.match(/data-entry=/g) || []).length, 30);
  env.el('showMore').dispatch('click');
  assert.equal((env.el('transactionList').innerHTML.match(/data-entry=/g) || []).length, 60);
  env.mq.matches = false; env.mq.change();
  assert.equal(env.el('transactionList').innerHTML, '');
  assert.equal((env.el('rows').innerHTML.match(/data-entry=/g) || []).length, 60);
  env.el('showMore').dispatch('click');
  assert.equal(env.el('showMore').hidden, true);
  assert.equal(env.state.calls, 1);
});
check('chart switch respects reduced motion', () => {
  const env = makeEnvironment({reduce: true}); env.resolve(data);
  env.el('rankBtn').dispatch('click');
  assert.equal(env.animations(), 0);
  assert.equal(env.el('rankBtn').getAttribute('aria-pressed'), 'true');
  assert(!env.el('category').innerHTML.includes('conic-gradient'));
  env.el('donutBtn').dispatch('click');
  assert.match(env.el('category').innerHTML, /conic-gradient/);
});
check('all timeline dates stay reachable beyond the old 21-day limit', () => {
  const env = makeEnvironment();
  env.resolve({expenses: Array.from({length: 31}, (_, i) => row('2026-10-' + String(i + 1).padStart(2, '0'), 50))});
  assert.equal((env.el('timeline').innerHTML.match(/data-day=/g) || []).length, 31);
  env.run("showDay('2026-10-01')");
  assert.match(env.el('detailBody').innerHTML, /₹50/);
});

const bench = makeEnvironment();
const large = {expenses: Array.from({length: 5000}, (_, i) => row('2026-11-' + String(i % 28 + 1).padStart(2, '0'), i % 700, {category: ['Food', 'Travel', 'Bills'][i % 3]}))};
const start = performance.now(); bench.resolve(large); const elapsed = performance.now() - start;
console.log(`${checks} scenario groups passed; TZ=${process.env.TZ || 'system'}. 5,000-row JS/render preparation: ${elapsed.toFixed(1)}ms (mock DOM; not browser load time).`);
