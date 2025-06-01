const FLIP_API_KEY = process.env.FLIP_API_KEY_SANDBOX || "";
const FLIP_API_BASE_URL = process.env.FLIP_API_BASE_URL_SANDBOX || "https://sandbox.flip.id/api/v2";
const FLIP_AUTH_HEADER = `Basic ${Buffer.from(FLIP_API_KEY + ":").toString("base64")}`;

export async function createFlipDisbursement({
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
  const res = await fetch(`${FLIP_API_BASE_URL}/disbursement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': FLIP_AUTH_HEADER,
    },
    body: JSON.stringify({
      amount,
      bank_code,
      account_number,
      account_holder_name,
      remark,
    }),
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(`Flip API error: ${res.status} ${res.statusText} - ${text}`);
  }
  if (!res.ok) {
    throw new Error(`Flip API error: ${res.status} ${res.statusText} - ${JSON.stringify(data)}`);
  }
  console.log('Flip API response:', data);
  return data;
}

export async function createFlipPayment({
  order_id,
  amount,
  customer_name,
  customer_email,
  customer_phone,
  item_name,
  item_id,
  seller_id,
  seller_name,
  seller_email,
  seller_phone,
}: {
  order_id: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  item_name: string;
  item_id: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  seller_phone: string;
}) {
  const res = await fetch(`${FLIP_API_BASE_URL}/pwf/bill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': FLIP_AUTH_HEADER,
    },
    body: new URLSearchParams({
      order_id: String(order_id),
      amount: String(amount),
      customer_name,
      customer_email,
      customer_phone,
      item_name,
      item_id,
      seller_id,
      seller_name,
      seller_email,
      seller_phone,
    }).toString(),
  });
  const data = await res.json();
  console.log('Flip API response:', data);
  return data;
} 