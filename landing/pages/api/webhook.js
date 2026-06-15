import crypto from 'crypto';
import Stripe from 'stripe';
import { Redis } from '@upstash/redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

function generateLicenseKey() {
  const segments = [];
  for (let i = 0; i < 4; i += 1) {
    segments.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return `SS-${segments.join('-')}`;
}

async function sendLicenseEmail(email, licenseKey, customerName) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: 'StreamSalvage', email: 'support@streamsalvage.com' },
      to: [{ email, name: customerName || 'Customer' }],
      subject: 'Your StreamSalvage License Key',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">StreamSalvage - Your License Key</h2>
          <p>Thank you for purchasing StreamSalvage! Here is your license key:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <code style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #111;">${licenseKey}</code>
          </div>
          <p><strong>How to activate:</strong></p>
          <ol>
            <li>Open StreamSalvage</li>
            <li>Repair your corrupted MP4 file</li>
            <li>On the Export screen, enter your license key above</li>
            <li>Click Validate - your full video will export instantly</li>
          </ol>
          <p>Keep this email safe. This is your permanent license key. It never expires.</p>
          <p>Need help? Reply to this email or contact <a href="mailto:support@streamsalvage.com">support@streamsalvage.com</a></p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">StreamSalvage - Local MP4 repair for streamers. streamsalvage.com</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Brevo error: ${error}`);
  }
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature error:', error.message);
    return res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    const sessionId = session.id;

    if (!customerEmail) {
      console.error('Checkout session is missing customer email:', sessionId);
      return res.status(200).json({ received: true });
    }

    const existing = await redis.get(`session:${sessionId}`);
    if (existing) {
      console.log('Duplicate webhook, skipping:', sessionId);
      return res.status(200).json({ received: true });
    }

    const licenseKey = generateLicenseKey();
    await redis.set(
      `license:${licenseKey}`,
      JSON.stringify({
        email: customerEmail,
        sessionId,
        createdAt: new Date().toISOString(),
        activationCount: 0,
      }),
    );

    await redis.set(`session:${sessionId}`, licenseKey, { ex: 86400 * 30 });

    try {
      await sendLicenseEmail(customerEmail, licenseKey, customerName);
      console.log('License email sent to:', customerEmail);
    } catch (emailError) {
      console.error('Email failed:', emailError);
    }
  }

  return res.status(200).json({ received: true });
}
