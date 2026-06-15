import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { licenseKey } = req.body || {};

  if (!licenseKey || typeof licenseKey !== 'string') {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  const normalizedKey = licenseKey.trim().toUpperCase();

  try {
    const data = await redis.get(`license:${normalizedKey}`);

    if (!data) {
      return res.status(200).json({ valid: false, error: 'Invalid license key' });
    }

    const license = typeof data === 'string' ? JSON.parse(data) : data;
    license.activationCount = (license.activationCount || 0) + 1;
    license.lastActivated = new Date().toISOString();

    await redis.set(`license:${normalizedKey}`, JSON.stringify(license));

    return res.status(200).json({
      valid: true,
      email: license.email,
      activationCount: license.activationCount,
    });
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ valid: false, error: 'Server error' });
  }
}
