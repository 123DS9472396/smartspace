// polls /api/health on localhost:3000 then POSTs a recommendation request
import process from 'process';

const healthUrl = 'http://localhost:3000/api/health';
const recommendUrl = 'http://localhost:3000/api/recommend';

async function waitForHealth(timeoutSec = 20) {
  const start = Date.now();
  while ((Date.now() - start) / 1000 < timeoutSec) {
    try {
      const r = await fetch(healthUrl, { method: 'GET' });
      if (r.ok) return true;
    } catch (e) {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function run() {
  const ok = await waitForHealth(25);
  if (!ok) {
    console.error('Server health endpoint did not become ready');
    process.exit(2);
  }

  const body = {
    preferences: {
      district: 'Thane',
      targetPrice: 5.5,
      minAreaSqft: 500,
    },
    limit: 10,
  };

  try {
    const res = await fetch(recommendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    console.log('HTTP', res.status, 'X-Recommendation-Algorithm=', res.headers.get('x-recommendation-algorithm'));
    console.log(JSON.stringify(json, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Request failed', err);
    process.exit(3);
  }
}

run();
