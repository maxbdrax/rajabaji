import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { BetRecord, DepositRequest, WithdrawalRequest, UserProfile } from '../types';
import { History as HistoryIcon, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

interface HistoryProps {
  user: UserProfile;
}

export default function History({ user }: HistoryProps) {
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'bets' | 'transactions'>('bets');

  useEffect(() => {
    const bQuery = query(collection(db, 'bets'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(20));
    const dQuery = query(collection(db, 'deposits'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(20));
    const wQuery = query(collection(db, 'withdrawals'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(20));

    const unsubB = onSnapshot(bQuery, (snap) => setBets(snap.docs.map(d => d.data() as BetRecord)));
    const unsubD = onSnapshot(dQuery, (snap) => setDeposits(snap.docs.map(d => d.data() as DepositRequest)));
    const unsubW = onSnapshot(wQuery, (snap) => setWithdrawals(snap.docs.map(d => d.data() as WithdrawalRequest)));

    return () => { unsubB(); unsubD(); unsubW(); };
  }, [user.uid]);

  return (
    <div className="space-y-8 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tighter text-red-500 uppercase">History</h2>
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-xl border border-white/5">
          {['bets', 'transactions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all ${
                activeTab === tab ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'bets' ? (
        <div className="grid gap-4">
          {bets.map((bet, i) => (
            <div key={i} className="bg-zinc-900 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${bet.status === 'win' ? 'bg-emerald-600/20 text-emerald-500' : 'bg-red-600/20 text-red-500'}`}>
                  {bet.status === 'win' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-tighter text-lg">{bet.game}</h4>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase">{new Date(bet.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-black ${bet.status === 'win' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {bet.status === 'win' ? `+৳${bet.winAmount}` : `-৳${bet.amount}`}
                </div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase">Bet: ৳{bet.amount}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {[...deposits, ...withdrawals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((tx, i) => {
            const isDeposit = 'transactionId' in tx;
            return (
              <div key={i} className="bg-zinc-900 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isDeposit ? 'bg-emerald-600/20 text-emerald-500' : 'bg-red-600/20 text-red-500'}`}>
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-tighter text-lg">{isDeposit ? 'Deposit' : 'Withdrawal'}</h4>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase">{tx.method} · {new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-black ${isDeposit ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isDeposit ? `+৳${tx.amount}` : `-৳${tx.amount}`}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    tx.status === 'pending' ? 'bg-zinc-800 text-zinc-400' :
                    tx.status === 'success' ? 'bg-emerald-600/20 text-emerald-500' : 'bg-red-600/20 text-red-500'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
