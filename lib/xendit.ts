import fetch from 'node-fetch';

const XENDIT_API_KEY_DISBURSE = process.env.XENDIT_API_KEY_DISBURSE || '';
const XENDIT_API_KEY_EWALLET = process.env.XENDIT_API_KEY_EWALLET || '';
const XENDIT_API_BASE_URL = 'https://api.xendit.co/disbursements';

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
  const XENDIT_AUTH_HEADER = `Basic ${Buffer.from(XENDIT_API_KEY_DISBURSE + ':').toString('base64')}`;
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

export async function createXenditEwalletDisbursement({
  amount,
  ewallet_type,
  mobile_number,
  reference_id,
  success_redirect_url = 'https://marketplace2-seven.vercel.app/',
}: {
  amount: number;
  ewallet_type: 'DANA' | 'OVO' | 'SHOPEEPAY' | 'LINKAJA' | 'PAYTREN' | 'GOPAY';
  mobile_number: string;
  reference_id?: string;
  success_redirect_url?: string;
}) {
  const XENDIT_AUTH_HEADER = `Basic ${Buffer.from(XENDIT_API_KEY_EWALLET + ':').toString('base64')}`;
  const res = await fetch('https://api.xendit.co/ewallets/charges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': XENDIT_AUTH_HEADER,
    },
    body: JSON.stringify({
      reference_id: reference_id || 'ewd-' + Date.now(),
      currency: 'IDR',
      amount,
      ewallet_type,
      channel_properties: {
        mobile_number,
        success_redirect_url,
      },
    }),
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(`Xendit Ewallet API error: ${res.status} ${res.statusText} - ${text}`);
  }
  if (!res.ok) {
    throw new Error(`Xendit Ewallet API error: ${res.status} ${res.statusText} - ${JSON.stringify(data)}`);
  }
  return data;
} 