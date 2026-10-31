import { analyzeBlob } from './youcam.js';
import { CONCERN_LABELS, scoreProduct } from './ingredients.js';
import { SAMPLE_PRODUCTS } from './products.js';

const $ = s => document.querySelector(s);
const LS_SCANS = 'byb.scans.v1', LS_KEY = 'byb.key', LS_SHORT = 'byb.shortlist.v1';
let current = null;          // scan shown in "My skin"
let selectedFile = null;

// ---------- storage ----------
const loadScans = () => { try { return JSON.parse(localStorage.getItem(LS_SCANS)) || []; } catch { return []; } };
const saveScans = s => localStorage.setItem(LS_SCANS, JSON.stringify(s));
const loadShort = () => { try { return JSON.parse(localStorage.getItem(LS_SHORT)) || []; } catch { return []; } };
const saveShort = s => localStorage.setItem(LS_SHORT, JSON.stringify(s));

function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}

// ---------- YouCam result -> scan ----------
export function normalize(results) {
  const scores = {}, masks = {};
  (results.output || []).forEach(o => {
    const k = o.type; if (!CONCERN_LABELS[k]) return;
    const isWhole = !o.region || o.region === 'whole' || o.region === 'all';
    if (scores[k] === undefined || isWhole) {
      const v = o.ui_score ?? Math.round(o.score ?? o.raw_score);
      if (typeof v === 'number') scores[k] = v;
      if (o.mask_urls && o.mask_urls[0]) masks[k] = o.mask_urls[0];
    }
  });
  return { scores, masks };
}

function concernsOf(scan) {
  return Object.entries(scan.scores)
    .map(([key, v]) => ({ key, label: CONCERN_LABELS[key], score: v, severity: 100 - v }))
    .sort((a, b) => b.severity - a.severity);
}
const colorFor = v => v >= 80 ? 'var(--good)' : v >= 60 ? 'var(--mid)' : 'var(--bad)';

// ---------- My skin ----------
function showProfile(scan) {
  current = scan;
  const cs = concernsOf(scan);
  const overall = Math.round(cs.reduce((s, c) => s + c.score, 0) / cs.length);
  $('#profileBody').classList.remove('empty');
  $('#profileSub').textContent = `${scan.label} · ${new Date(scan.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}${scan.demo ? ' · demo' : ''}`;
  $('#overallRing').style.setProperty('--v', overall);
  $('#overallNum').textContent = overall;
  $('#topLine').textContent = 'Top concerns: ' + cs.slice(0, 3).map(c => c.label).join(', ') + '.';
  $('#bars').innerHTML = cs.map((c, i) => `<li class="${i < 3 ? 'top' : ''}"><span class="lbl">${c.label}</span><span class="track"><span class="fill" style="width:${c.score}%;background:${colorFor(c.score)}"></span></span><span class="num">${c.score}</span></li>`).join('');
  $('#viewerImg').src = scan.photo;
  const chips = [`<button class="chip active" data-mask="">Photo</button>`]
    .concat(cs.filter(c => scan.masks[c.key]).map(c => `<button class="chip" data-mask="${c.key}">${c.label}</button>`));
  $('#maskChips').innerHTML = chips.join('');
  $('#viewerNote').textContent = Object.keys(scan.masks).length ? 'Tap a concern to see where YouCam found it.' : 'Mask images from live scans expire after a few hours; scores are kept.';
  // re-score the open product against the new profile
  if ($('#ingredients').value.trim()) runCheck(false);
  renderShortlist();
}
$('#maskChips').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b || !current) return;
  document.querySelectorAll('#maskChips .chip').forEach(c => c.classList.toggle('active', c === b));
  const k = b.dataset.mask;
  $('#viewerImg').src = k ? current.masks[k] : current.photo;
  $('#viewerImg').onerror = () => { $('#viewerImg').src = current.photo; toast('That mask image has expired. Scores are still saved.'); };
});

// ---------- Demo ----------
async function loadDemo(id) {
  const [w0, w8] = await Promise.all(['week0', 'week8'].map(async d => (await fetch(`demo/${d}.json`)).json()));
  const scan = id === 'week8' ? w8 : w0;
  document.querySelectorAll('.demo-btn').forEach(b => b.classList.toggle('active', b.dataset.demo === id));
  const all = loadScans();
  [w0, w8].forEach(s => { if (!all.find(x => x.id === s.id)) all.push(s); });
  all.sort((a, b) => a.date.localeCompare(b.date)); saveScans(all);
  $('#cmpA').value = ''; $('#cmpB').value = '';
  renderProgress();
  showProfile(scan);
  return scan;
}
document.querySelectorAll('.demo-btn').forEach(b => b.addEventListener('click', async () => { await loadDemo(b.dataset.demo); location.hash = '#profile'; }));
$('#tryDemo').addEventListener('click', async () => {
  await loadDemo('week0');
  pickSample(0);
  location.hash = '#profile';
});

// ---------- Own scan ----------
const keyInput = $('#apiKey');
keyInput.value = localStorage.getItem(LS_KEY) || '';
$('#rememberKey').checked = !!keyInput.value;
function updateAnalyzeBtn() { $('#analyze').disabled = !(keyInput.value.trim() && selectedFile); }
keyInput.addEventListener('input', updateAnalyzeBtn);
$('#file').addEventListener('change', e => setFile(e.target.files[0]));
const drop = $('#drop');
drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('has'); });
drop.addEventListener('drop', e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); });
function setFile(f) {
  if (!f) return;
  selectedFile = f; drop.classList.add('has'); $('#dropText').textContent = f.name + ' · ready';
  updateAnalyzeBtn();
}

async function prepareImage(file) {
  // Re-encode as JPEG, long side ≤ 2048 px; reject images smaller than YouCam's 480 px minimum.
  const bmp = await createImageBitmap(file);
  const short = Math.min(bmp.width, bmp.height);
  if (short < 480) throw new Error(`Photo is ${bmp.width}×${bmp.height}. YouCam needs at least 480 px on the short side.`);
  const scale = Math.min(1, 2048 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92));
  const t = document.createElement('canvas'); const ts = 240 / Math.max(c.width, c.height);
  t.width = Math.round(c.width * ts); t.height = Math.round(c.height * ts);
  t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
  return { blob, thumb: t.toDataURL('image/jpeg', 0.8) };
}

$('#analyze').addEventListener('click', async () => {
  const key = keyInput.value.trim(); const st = $('#status');
  st.classList.remove('err');
  if ($('#rememberKey').checked) localStorage.setItem(LS_KEY, key); else localStorage.removeItem(LS_KEY);
  $('#analyze').disabled = true;
  try {
    st.textContent = 'Preparing photo…';
    const { blob, thumb } = await prepareImage(selectedFile);
    const { taskId, results } = await analyzeBlob(key, blob, m => st.textContent = m);
    const { scores, masks } = normalize(results);
    if (!Object.keys(scores).length) throw new Error('YouCam returned no scores for this photo.');
    const scan = { id: 'scan-' + Date.now(), label: 'My scan', date: new Date().toISOString(), photo: thumb, scores, masks, task_id: taskId };
    const all = loadScans(); all.push(scan); saveScans(all); renderProgress();
    st.textContent = 'Done. Saved to your progress.';
    showProfile(scan); location.hash = '#profile';
  } catch (e) {
    st.classList.add('err');
    const m = e.message || String(e);
    st.textContent = /401|InvalidAccessToken/.test(m) ? 'YouCam rejected the key. Check it in your YouCam API console.'
      : /face|Face/.test(m) ? 'No clear face found. Try a front-facing photo in even light.' : m;
  } finally { updateAnalyzeBtn(); }
});

// ---------- Product check ----------
$('#sampleChips').innerHTML = '<span class="muted" style="width:100%;margin:0">Try a sample:</span>' +
  SAMPLE_PRODUCTS.map((p, i) => `<button class="chip" data-i="${i}">${p.name}</button>`).join('');
function pickSample(i) {
  const p = SAMPLE_PRODUCTS[i];
  $('#prodName').value = p.name; $('#ingredients').value = p.ingredients;
  document.querySelectorAll('#sampleChips .chip').forEach(c => c.classList.toggle('active', +c.dataset.i === i));
}
$('#sampleChips').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return; pickSample(+b.dataset.i); runCheck(true);
});
$('#checkBtn').addEventListener('click', () => runCheck(true));

function runCheck(addToShortlist) {
  const st = $('#checkStatus'); st.classList.remove('err'); st.textContent = '';
  const text = $('#ingredients').value.trim();
  if (!current) { st.classList.add('err'); st.textContent = 'Run a scan first (or tap "Try the free demo").'; return; }
  if (!text) { st.classList.add('err'); st.textContent = 'Paste an ingredient list first.'; return; }
  const name = $('#prodName').value.trim() || 'This product';
  const r = scoreProduct(text, concernsOf(current));
  const rows = r.perConcern.map(c => {
    const helps = c.by.length ? `<span class="ok">✓ ${c.by.join(', ')}</span>` : `<span class="no">✗ nothing targets this</span>`;
    const hurts = c.hurt.length ? `<small>⚠ works against it: ${c.hurt.join(', ')}</small>` : '';
    return `<li><b>${c.label}</b> <span class="muted">(${c.score}/100)</span><br>${helps}${hurts}</li>`;
  }).join('');
  $('#result').classList.remove('empty');
  $('#result').innerHTML = `
    <div class="match"><div class="ring" style="--v:${r.score}"><span>${r.score}</span></div>
      <div><p class="headline">${escapeHtml(name)}</p><span class="verdict ${r.verdict.tone}">${r.verdict.label}</span>
      <p class="muted" style="margin-top:6px">${r.verdict.text}</p></div></div>
    <h4>Your top concerns</h4><ul class="cover">${rows}</ul>
    <h4>Actives found (${r.actives.length} of ${r.count} ingredients)</h4>
    <div class="found">${r.actives.map(a => `<span>${a.name}</span>`).join('') || '<span class="warn">No targeted actives</span>'}</div>
    ${r.cautions.length ? `<h4>Watch-outs</h4><div class="found">${r.cautions.map(c => `<span class="warn" title="${c.why}">${c.name}</span>`).join('')}</div>` : ''}`;
  if (addToShortlist) {
    const list = loadShort().filter(p => p.name !== name);
    list.push({ name, ingredients: text }); saveShort(list.slice(-8));
  }
  renderShortlist();
}
function renderShortlist() {
  const list = loadShort();
  if (!list.length || !current) { $('#shortlistCard').hidden = true; return; }
  const cs = concernsOf(current);
  const ranked = list.map(p => ({ ...p, s: scoreProduct(p.ingredients, cs) })).sort((a, b) => b.s.score - a.s.score);
  $('#shortlistCard').hidden = false;
  $('#shortlist').innerHTML = ranked.map(p => `<li>${escapeHtml(p.name)} <span style="color:var(--${p.s.verdict.tone === 'good' ? 'good' : p.s.verdict.tone === 'mid' ? 'mid' : 'bad'})">${p.s.score} · ${p.s.verdict.label}</span></li>`).join('');
}
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Progress ----------
function renderProgress() {
  const scans = loadScans();
  const fmt = s => `${s.label} · ${new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  $('#scanList').innerHTML = scans.length ? scans.map(s => `<li><img src="${s.photo}" alt=""><span><b>${s.label}</b><br><span class="muted">${new Date(s.date).toLocaleDateString()}</span></span><span class="acts"><button class="del" data-open="${s.id}">Open</button><button class="del" data-del="${s.id}">Delete</button></span></li>`).join('')
    : '<li class="muted">No scans yet.</li>';
  const opts = scans.map(s => `<option value="${s.id}">${fmt(s)}</option>`).join('');
  const a = $('#cmpA'), b = $('#cmpB'); const va = a.value, vb = b.value;
  a.innerHTML = opts; b.innerHTML = opts;
  if (scans.length >= 2) {
    a.value = scans.find(s => s.id === va) ? va : scans[0].id;
    b.value = scans.find(s => s.id === vb) && vb !== a.value ? vb : scans[scans.length - 1].id;
    if (a.value === b.value) { a.value = scans[0].id; b.value = scans[scans.length - 1].id; }
  }
  renderCompare();
}
$('#scanList').addEventListener('click', e => {
  const del = e.target.dataset.del, open = e.target.dataset.open;
  if (del) { saveScans(loadScans().filter(s => s.id !== del)); renderProgress(); }
  if (open) { showProfile(loadScans().find(s => s.id === open)); location.hash = '#profile'; }
});
$('#cmpA').addEventListener('change', renderCompare); $('#cmpB').addEventListener('change', renderCompare);
function renderCompare() {
  const scans = loadScans(); const A = scans.find(s => s.id === $('#cmpA').value), B = scans.find(s => s.id === $('#cmpB').value);
  if (!A || !B || A === B) { $('#compare').innerHTML = '<p class="muted">Save two scans to compare them.</p>'; return; }
  const keys = Object.keys(CONCERN_LABELS).filter(k => A.scores[k] !== undefined && B.scores[k] !== undefined);
  const d = keys.map(k => ({ k, a: A.scores[k], b: B.scores[k], diff: B.scores[k] - A.scores[k] })).sort((x, y) => y.diff - x.diff);
  const best = d[0];
  const avg = arr => Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
  const oa = avg(keys.map(k => A.scores[k])), ob = avg(keys.map(k => B.scores[k]));
  $('#compare').innerHTML = `
    <div class="pair"><figure style="margin:0"><img src="${A.photo}" alt=""><figcaption>${A.label} · ${oa}</figcaption></figure>
    <figure style="margin:0"><img src="${B.photo}" alt=""><figcaption>${B.label} · ${ob}</figcaption></figure></div>
    <p class="headline">Overall ${ob >= oa ? 'up' : 'down'} ${Math.abs(ob - oa)} points${best && best.diff > 0 ? `. Biggest win: ${CONCERN_LABELS[best.k]} (+${best.diff})` : ''}.</p>
    <ul class="delta">${d.map(x => `<li><span>${CONCERN_LABELS[x.k]}</span><span class="track"><span class="fill" style="width:${x.b}%;background:${colorFor(x.b)}"></span></span><span class="${x.diff > 0 ? 'up' : x.diff < 0 ? 'down' : 'same'}">${x.diff > 0 ? '+' : ''}${x.diff}</span></li>`).join('')}</ul>`;
}

renderProgress();
const params = new URLSearchParams(location.search);
if (params.has('demo')) { loadDemo(params.get('demo') || 'week0').then(() => { pickSample(0); runCheck(true); }); }
