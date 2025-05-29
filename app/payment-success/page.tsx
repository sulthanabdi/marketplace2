import Link from 'next/link';

export default function PaymentSuccessPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const orderId = typeof searchParams.orderId === 'string' ? searchParams.orderId : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-green-700 mb-4">Pembayaran Berhasil!</h1>
        <p className="mb-4 text-gray-700">Terima kasih, pembayaran Anda telah diterima.</p>
        {orderId && (
          <>
            <p className="mb-2 text-gray-600">Order ID: <span className="font-mono">{orderId}</span></p>
            <Link
              href={`/transactions/${orderId}`}
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Lihat Detail Transaksi
            </Link>
          </>
        )}
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-block px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
          >
            Kembali ke Dashboard
          </Link>
        </div>
        <div className="mt-6 text-sm text-gray-500">
          Silakan hubungi penjual untuk pengambilan barang secara langsung.
        </div>
      </div>
    </div>
  );
} 