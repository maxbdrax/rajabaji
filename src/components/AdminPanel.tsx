import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { DepositRequest, WithdrawalRequest, PaymentConfig, UserProfile, Notice, Reward } from '../types';
import { CheckCircle, XCircle, Users, Wallet, CreditCard, Settings, Plus, Trash2, Megaphone, Gift } from 'lucide-react';

export default function AdminPanel() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'payments' | 'notices' | 'rewards'>('deposits');
  const [newNumber, setNewNumber] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  
  // Notice state
  const [newNotice, setNewNotice] = useState('');
  
  // Reward state
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardAmount, setRewardAmount] = useState(0);
  const [rewardCode, setRewardCode] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    const dQuery = query(collection(db, 'deposits'));
    const wQuery = query(collection(db, 'withdrawals'));
    const pDoc = doc(db, 'config', 'payments');
    const nQuery = query(collection(db, 'notices'));
    const rQuery = query(collection(db, 'rewards'));

    const unsubD = onSnapshot(dQuery, (snap) => setDeposits(snap.docs.map(d => ({ id: d.id, ...d.data() } as DepositRequest))));
    const unsubW = onSnapshot(wQuery, (snap) => setWithdrawals(snap.docs.map(w => ({ id: w.id, ...w.data() } as WithdrawalRequest))));
    const unsubP = onSnapshot(pDoc, (snap) => setPaymentConfig(snap.data() as PaymentConfig));
    const unsubN = onSnapshot(nQuery, (snap) => setNotices(snap.docs.map(n => ({ id: n.id, ...n.data() } as Notice))));
    const unsubR = onSnapshot(rQuery, (snap) => setRewards(snap.docs.map(r => ({ id: r.id, ...r.data() } as Reward))));

    return () => { unsubD(); unsubW(); unsubP(); unsubN(); unsubR(); };
  }, []);

  const handleDepositAction = async (deposit: DepositRequest, action: 'success' | 'rejected') => {
    try {
      const dRef = doc(db, 'deposits', deposit.id!);
      const uRef = doc(db, 'users', deposit.uid);
      
      await updateDoc(dRef, { status: action });
      if (action === 'success') {
        await updateDoc(uRef, { balance: increment(deposit.amount) });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'deposits');
    }
  };

  const handleWithdrawalAction = async (withdrawal: WithdrawalRequest, action: 'success' | 'rejected') => {
    try {
      const wRef = doc(db, 'withdrawals', withdrawal.id!);
      const uRef = doc(db, 'users', withdrawal.uid);
      
      await updateDoc(wRef, { status: action });
      if (action === 'rejected') {
        await updateDoc(uRef, { balance: increment(withdrawal.amount) });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'withdrawals');
    }
  };

  const addNumber = async () => {
    if (!newNumber) {
      setStatus({ type: 'error', message: 'Please enter a number.' });
      return;
    }
    try {
      const pRef = doc(db, 'config', 'payments');
      const currentConfig = paymentConfig || {
        bkash: [],
        nagad: [],
        rocket: [],
        bkashIndex: 0,
        nagadIndex: 0,
        rocketIndex: 0,
        lastRotation: new Date().toISOString()
      };

      const updated = { 
        ...currentConfig, 
        [method]: [...(currentConfig[method] || []), newNumber]
      };
      await setDoc(pRef, updated);
      setNewNumber('');
      setStatus({ type: 'success', message: 'Number added successfully!' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'config/payments');
      setStatus({ type: 'error', message: 'Failed to add number.' });
    }
  };

  const removeNumber = async (m: 'bkash' | 'nagad' | 'rocket', num: string) => {
    if (!paymentConfig) return;
    try {
      const pRef = doc(db, 'config', 'payments');
      const newNumbers = (paymentConfig[m] || []).filter(n => n !== num);
      const indexKey = `${m}Index` as keyof PaymentConfig;
      let newIndex = (paymentConfig[indexKey] as number) ?? 0;
      
      if (newIndex >= newNumbers.length) {
        newIndex = Math.max(0, newNumbers.length - 1);
      }

      const updated = { 
        ...paymentConfig, 
        [m]: newNumbers,
        [indexKey]: newIndex
      };
      await setDoc(pRef, updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'config/payments');
    }
  };

  const addNotice = async () => {
    if (!newNotice) {
      setStatus({ type: 'error', message: 'Please enter notice text.' });
      return;
    }
    try {
      const nRef = doc(collection(db, 'notices'));
      await setDoc(nRef, {
        text: newNotice,
        active: true,
        createdAt: new Date().toISOString()
      });
      setNewNotice('');
      setStatus({ type: 'success', message: 'Notice added successfully!' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'notices');
      setStatus({ type: 'error', message: 'Failed to add notice.' });
    }
  };

  const deleteNotice = async (id: string) => {
    try {
      // For simplicity using setDoc with delete logic or just updateDoc active: false
      // But let's just use a simple delete if we had deleteDoc
      // Since we don't have deleteDoc in imports, let's add it or use updateDoc
      const nRef = doc(db, 'notices', id);
      await updateDoc(nRef, { active: false });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'notices');
    }
  };

  const addReward = async () => {
    if (!rewardTitle || !rewardCode) {
      setStatus({ type: 'error', message: 'Title and Code are required.' });
      return;
    }
    try {
      const rRef = doc(collection(db, 'rewards'));
      await setDoc(rRef, {
        title: rewardTitle,
        description: rewardDesc,
        amount: rewardAmount,
        code: rewardCode,
        active: true,
        createdAt: new Date().toISOString()
      });
      setRewardTitle('');
      setRewardDesc('');
      setRewardAmount(0);
      setRewardCode('');
      setStatus({ type: 'success', message: 'Reward added successfully!' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'rewards');
      setStatus({ type: 'error', message: 'Failed to add reward.' });
    }
  };

  const deleteReward = async (id: string) => {
    try {
      const rRef = doc(db, 'rewards', id);
      await updateDoc(rRef, { active: false });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'rewards');
    }
  };

  return (
    <div className="space-y-8 py-8 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-[100] px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl border ${
              status.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-red-600 border-red-400 text-white'
            }`}
          >
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tighter text-red-500 uppercase">Admin Dashboard</h2>
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-xl border border-white/5 overflow-x-auto">
          {['deposits', 'withdrawals', 'payments', 'notices', 'rewards'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all whitespace-nowrap ${
                activeTab === tab ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'deposits' && (
        <div className="grid gap-4">
          {deposits.map((d) => (
            <div key={d.id} className="bg-zinc-900 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-black text-xl">৳{d.amount}</span>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded uppercase">{d.method}</span>
                </div>
                <p className="text-zinc-500 text-xs font-mono">TXID: {d.transactionId}</p>
                <p className="text-zinc-500 text-xs">UID: {d.uid}</p>
              </div>
              {d.status === 'pending' ? (
                <div className="flex gap-2">
                  <button onClick={() => handleDepositAction(d, 'success')} className="p-3 bg-emerald-600/20 text-emerald-500 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all">
                    <CheckCircle size={24} />
                  </button>
                  <button onClick={() => handleDepositAction(d, 'rejected')} className="p-3 bg-red-600/20 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                    <XCircle size={24} />
                  </button>
                </div>
              ) : (
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${d.status === 'success' ? 'bg-emerald-600/20 text-emerald-500' : 'bg-red-600/20 text-red-500'}`}>
                  {d.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="grid gap-4">
          {withdrawals.map((w) => (
            <div key={w.id} className="bg-zinc-900 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-red-500 font-black text-xl">৳{w.amount}</span>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded uppercase">{w.method}</span>
                </div>
                <p className="text-zinc-500 text-xs font-mono">Account: {w.accountNumber}</p>
                <p className="text-zinc-500 text-xs">UID: {w.uid}</p>
              </div>
              {w.status === 'pending' ? (
                <div className="flex gap-2">
                  <button onClick={() => handleWithdrawalAction(w, 'success')} className="p-3 bg-emerald-600/20 text-emerald-500 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all">
                    <CheckCircle size={24} />
                  </button>
                  <button onClick={() => handleWithdrawalAction(w, 'rejected')} className="p-3 bg-red-600/20 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                    <XCircle size={24} />
                  </button>
                </div>
              ) : (
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${w.status === 'success' ? 'bg-emerald-600/20 text-emerald-500' : 'bg-red-600/20 text-red-500'}`}>
                  {w.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-8">
          <div className="bg-zinc-900 p-8 rounded-[40px] border border-white/5 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter">Add Payment Number</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-500"
              >
                <option value="bkash">Bkash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
              </select>
              <input
                type="text"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="Enter number..."
                className="flex-1 bg-zinc-950 border border-white/10 rounded-2xl px-6 py-3 text-sm font-bold focus:outline-none focus:border-red-500"
              />
              <button onClick={addNumber} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-tighter flex items-center justify-center gap-2">
                <Plus size={20} />
                Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {(['bkash', 'nagad', 'rocket'] as const).map((m) => (
              <div key={m} className="bg-zinc-900 p-6 rounded-[32px] border border-white/5 space-y-4">
                <h4 className="text-lg font-black uppercase tracking-tighter text-zinc-400">{m} Numbers</h4>
                <div className="space-y-2">
                  {paymentConfig?.[m]?.map((num, idx) => (
                    <div key={num} className={`flex items-center justify-between p-3 rounded-xl border ${
                      paymentConfig[`${m}Index` as keyof PaymentConfig] === idx 
                        ? 'bg-emerald-600/10 border-emerald-500/30' 
                        : 'bg-zinc-950 border-white/5'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{num}</span>
                        {paymentConfig[`${m}Index` as keyof PaymentConfig] === idx && (
                          <span className="text-[8px] font-black uppercase bg-emerald-500 text-white px-1 rounded">Active</span>
                        )}
                      </div>
                      <button onClick={() => removeNumber(m, num)} className="text-red-500 hover:text-red-400 p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notices' && (
        <div className="space-y-8">
          <div className="bg-zinc-900 p-8 rounded-[40px] border border-white/5 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter">Add Notice</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={newNotice}
                onChange={(e) => setNewNotice(e.target.value)}
                placeholder="Enter notice text..."
                className="flex-1 bg-zinc-950 border border-white/10 rounded-2xl px-6 py-3 text-sm font-bold focus:outline-none focus:border-red-500"
              />
              <button onClick={addNotice} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-tighter flex items-center justify-center gap-2">
                <Plus size={20} />
                Add
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {notices.map((n) => (
              <div key={n.id} className={`bg-zinc-900 p-6 rounded-3xl border border-white/5 flex items-center justify-between ${!n.active && 'opacity-50'}`}>
                <div className="flex items-center gap-4">
                  <Megaphone className="text-ck-accent" />
                  <p className="text-white font-bold">{n.text}</p>
                </div>
                {n.active && (
                  <button onClick={() => deleteNotice(n.id!)} className="p-3 bg-red-600/20 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                    <Trash2 size={24} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="space-y-8">
          <div className="bg-zinc-900 p-8 rounded-[40px] border border-white/5 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter">Add Reward</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                value={rewardTitle}
                onChange={(e) => setRewardTitle(e.target.value)}
                placeholder="Title..."
                className="bg-zinc-950 border border-white/10 rounded-2xl px-6 py-3 text-sm font-bold focus:outline-none focus:border-red-500"
              />
              <input
                type="text"
                value={rewardCode}
                onChange={(e) => setRewardCode(e.target.value)}
                placeholder="Promo Code..."
                className="bg-zinc-950 border border-white/10 rounded-2xl px-6 py-3 text-sm font-bold focus:outline-none focus:border-red-500"
              />
              <input
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(Number(e.target.value))}
                placeholder="Amount..."
                className="bg-zinc-950 border border-white/10 rounded-2xl px-6 py-3 text-sm font-bold focus:outline-none focus:border-red-500"
              />
              <input
                type="text"
                value={rewardDesc}
                onChange={(e) => setRewardDesc(e.target.value)}
                placeholder="Description..."
                className="bg-zinc-950 border border-white/10 rounded-2xl px-6 py-3 text-sm font-bold focus:outline-none focus:border-red-500"
              />
            </div>
            <button onClick={addReward} className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl font-black uppercase tracking-tighter flex items-center justify-center gap-2">
              <Plus size={20} />
              Add Reward
            </button>
          </div>

          <div className="grid gap-4">
            {rewards.map((r) => (
              <div key={r.id} className={`bg-zinc-900 p-6 rounded-3xl border border-white/5 flex items-center justify-between ${!r.active && 'opacity-50'}`}>
                <div className="flex items-center gap-4">
                  <Gift className="text-ck-accent" />
                  <div>
                    <p className="text-white font-black uppercase tracking-tighter">{r.title}</p>
                    <p className="text-zinc-500 text-xs font-bold">{r.description}</p>
                    <p className="text-emerald-500 font-black">৳{r.amount} | Code: {r.code}</p>
                  </div>
                </div>
                {r.active && (
                  <button onClick={() => deleteReward(r.id!)} className="p-3 bg-red-600/20 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                    <Trash2 size={24} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
