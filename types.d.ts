declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

interface Window {
  location: Location;
}

export interface Withdrawal {
  id: string;
  seller_id: string;
  amount: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  processed_at?: string;
  seller?: {
    name: string;
    email: string;
  };
} 