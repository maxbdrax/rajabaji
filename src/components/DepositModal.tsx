import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { PaymentConfig, UserProfile } from '../types';
import { Copy, Check, CreditCard, AlertCircle, X } from 'lucide-react';

interface DepositModalProps {
  user: UserProfile;
  onClose: () => void;
}

export default function DepositModal({ user, onClose }: DepositModalProps) {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [amount, setAmount] = useState(500);
  const [txid, setTxid] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const snap = await getDoc(doc(db, 'config', 'payments'));
      if (snap.exists()) setConfig(snap.data() as PaymentConfig);
    };
    fetchConfig();
  }, []);

  // Get the active number from config
  const getDisplayNumber = () => {
    if (!config || !config[method] || config[method].length === 0) return 'No numbers available';
    const numbers = config[method];
    const indexKey = `${method}Index` as keyof PaymentConfig;
    const index = (config[indexKey] as number) ?? 0;
    return numbers[index] || numbers[0];
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getDisplayNumber());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!txid || amount < 100) {
      setError(amount < 100 ? 'Minimum deposit ৳100' : 'Transaction ID required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'deposits'), {
        uid: user.uid,
        amount,
        method,
        transactionId: txid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'deposits');
      setError('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 w-full max-w-lg rounded-[40px] border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-red-500">Deposit Funds</h3>
            <button onClick={onClose} className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors">
              <X size={20} />
            </button>
          </div>

          {!success ? (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {(['bkash', 'nagad', 'rocket'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`py-4 rounded-2xl font-black uppercase tracking-tighter text-xs transition-all border-2 ${
                      method === m ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/20' : 'bg-zinc-800 border-transparent text-zinc-500 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="bg-zinc-950 p-6 rounded-[32px] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Send Money to</span>
                  <span className="px-2 py-0.5 bg-red-600/20 text-red-500 text-[10px] font-black rounded uppercase">Personal</span>
                </div>
                <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-white/5">
                  <span className="text-2xl font-black tracking-tighter font-mono">{getDisplayNumber()}</span>
                  <button onClick={handleCopy} className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white">
                    {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                  </button>
                </div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase text-center">Numbers rotate every 10 minutes for security</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest px-2">Deposit Amount (৳)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest px-2">Transaction ID</label>
                  <input
                    type="text"
                    value={txid}
                    onChange={(e) => setTxid(e.target.value)}
                    placeholder="Enter TXID..."
                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black focus:outline-none focus:border-red-500 uppercase"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                  <AlertCircle size={20} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full py-6 rounded-[32px] font-black text-2xl uppercase tracking-tighter transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl ${
                  loading ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-600/20'
                }`}
              >
                {loading ? 'Submitting...' : 'Confirm Deposit'}
              </button>
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="w-24 h-24 bg-emerald-600/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-600/30">
                <Check size={48} />
              </div>
              <h4 className="text-3xl font-black uppercase tracking-tighter">Request Sent!</h4>
              <p className="text-zinc-500 font-bold">Admin will verify your deposit within 5-10 minutes.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
