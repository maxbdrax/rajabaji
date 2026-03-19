export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  balance: number;
  role: 'admin' | 'user';
  phone?: string;
  createdAt: string;
}

export interface DepositRequest {
  id?: string;
  uid: string;
  amount: number;
  method: 'bkash' | 'nagad' | 'rocket';
  transactionId: string;
  status: 'pending' | 'success' | 'rejected';
  createdAt: string;
}

export interface WithdrawalRequest {
  id?: string;
  uid: string;
  amount: number;
  method: 'bkash' | 'nagad' | 'rocket';
  accountNumber: string;
  status: 'pending' | 'success' | 'rejected';
  createdAt: string;
}

export interface PaymentConfig {
  bkash: string[];
  nagad: string[];
  rocket: string[];
  bkashIndex: number;
  nagadIndex: number;
  rocketIndex: number;
  lastRotation: string;
}

export interface BetRecord {
  id?: string;
  uid: string;
  game: 'slots' | 'aviator';
  amount: number;
  winAmount: number;
  status: 'win' | 'loss';
  createdAt: string;
}

export interface Notice {
  id?: string;
  text: string;
  active: boolean;
  createdAt: string;
}

export interface Reward {
  id?: string;
  title: string;
  description: string;
  amount: number;
  code: string;
  active: boolean;
  createdAt: string;
}
