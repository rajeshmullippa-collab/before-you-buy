// Minimal browser client for the YouCam AI Skin Analysis API (v2.1).
// The API sends `Access-Control-Allow-Origin: *`, so a static page can call it
// directly with the user's own key. The key never leaves the user's browser
// except in the Authorization header sent to YouCam.
export const API_BASE = 'https://yce-api-01.makeupar.com';

export const SD_ACTIONS = [
  'acne', 'redness', 'oiliness', 'pore', 'texture', 'wrinkle', 'age_spot',
  'radiance', 'moisture', 'dark_circle_v2', 'eye_bag', 'firmness'
];

async function call(key, path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: {
      'Authorization': 'Bearer ' + key,
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers || {})
    }
  });
  let body = null;
  try { body = await res.json(); } catch (_) { /* non-JSON */ }
  if (!res.ok) {
    const msg = body && (body.error_code || body.error || body.message);
    const err = new Error(`YouCam ${res.status}${msg ? ': ' + msg : ''}`);
    err.status = res.status; err.body = body;
    throw err;
  }
  return body;
}

export async function getCredit(key) {
  return call(key, '/s2s/v1.0/client/credit');
}

// Step 1+2: register the file, then PUT the bytes to the pre-signed URL.
export async function uploadImage(key, blob, fileName = 'selfie.jpg') {
  const type = blob.type || 'image/jpeg';
  const meta = await call(key, '/s2s/v2.0/file', {
    method: 'POST',
    body: JSON.stringify({ files: [{ content_type: type, file_name: fileName, file_size: blob.size }] })
  });
  const f = meta.data.files[0];
  const req = f.requests[0];
  const headers = { ...(req.headers || {}) };
  delete headers['Content-Length']; delete headers['content-length']; // browser sets it
  const put = await fetch(req.url, { method: req.method || 'PUT', headers, body: blob });
  if (!put.ok) throw new Error('Upload to storage failed (' + put.status + ')');
  return f.file_id;
}

// Step 3: start the task. `src` is {src_file_id} or {src_file_url}.
export async function startSkinAnalysis(key, src, actions = SD_ACTIONS) {
  const body = {
    ...src,
    dst_actions: actions,
    miniserver_args: { enable_mask_overlay: true },
    format: 'json'
  };
  const r = await call(key, '/s2s/v2.1/task/skin-analysis', { method: 'POST', body: JSON.stringify(body) });
  return r.data.task_id;
}

// Step 4: poll until success / error.
export async function pollSkinAnalysis(key, taskId, onTick = () => {}, { intervalMs = 3000, timeoutMs = 180000 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const r = await call(key, '/s2s/v2.1/task/skin-analysis/' + encodeURIComponent(taskId));
    const d = r.data || {};
    onTick(d.task_status, Date.now() - t0);
    if (d.task_status === 'success') return d.results;
    if (d.task_status === 'error') throw new Error('Analysis failed: ' + (d.error || '') + ' ' + (d.error_message || ''));
    await new Promise(res => setTimeout(res, intervalMs));
  }
  throw new Error('Timed out waiting for the analysis');
}

// Convenience: full pipeline from a Blob.
export async function analyzeBlob(key, blob, onStatus = () => {}) {
  onStatus('Uploading photo to YouCam…');
  const fileId = await uploadImage(key, blob);
  onStatus('Running YouCam AI Skin Analysis…');
  const taskId = await startSkinAnalysis(key, { src_file_id: fileId });
  const results = await pollSkinAnalysis(key, taskId, s => onStatus('YouCam AI Skin Analysis: ' + s + '…'));
  return { taskId, results };
}
