import fetch from 'node-fetch';

const XENDIT_API_KEY = process.env.XENDIT_API_KEY || '';
const XENDIT_API_BASE_URL = 'https://api.xendit.co/disbursements';
const XENDIT_AUTH_HEADER = `Basic ${Buffer.from(XENDIT_API_KEY + ':').toString('base64')}`;

export async function createXenditDisbursement({
  amount,
  bank_code,
  account_number,
  account_holder_name,
  remark,
}: {
  amount: number;
  bank_code: string;
  account_number: string;
  account_holder_name: string;
  remark?: string;
}) {
  const res = await fetch(XENDIT_API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': XENDIT_AUTH_HEADER,
    },
    body: JSON.stringify({
      external_id: 'wd-' + Date.now(),
      amount,
      bank_code,
      account_holder_name,
      account_number,
      description: remark,
    }),
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(`Xendit API error: ${res.status} ${res.statusText} - ${text}`);
  }
  if (!res.ok) {
    throw new Error(`Xendit API error: ${res.status} ${res.statusText} - ${JSON.stringify(data)}`);
  }
  return data;
} 