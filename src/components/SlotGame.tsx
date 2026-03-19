import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Coins, Trophy, AlertCircle } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { addDoc, collection, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍉', '🍇', '🔔', '💎', '7️⃣'];
const REEL_COUNT = 3;

interface SlotGameProps {
  user: UserProfile;
  onUpdateUser: (data: Partial<UserProfile>) => void;
}

export default function SlotGame({ user, onUpdateUser }: SlotGameProps) {
  const [reels, setReels] = useState<string[]>(['7️⃣', '7️⃣', '7️⃣']);
  const [spinning, setSpinning] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const spin = useCallback(async () => {
    if (spinning || user.balance < betAmount) {
      if (user.balance < betAmount) setError('Insufficient balance');
      return;
    }

    setSpinning(true);
    setError(null);
    setWinMessage(null);

    try {
      // Deduct bet
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { balance: increment(-betAmount) });
      onUpdateUser({ balance: user.balance - betAmount });

      // Simulate spinning
      const spinDuration = 2000;
      const interval = setInterval(() => {
        setReels(SYMBOLS.sort(() => Math.random() - 0.5).slice(0, REEL_COUNT));
      }, 100);

      setTimeout(async () => {
        clearInterval(interval);
        const finalReels = Array.from({ length: REEL_COUNT }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
        setReels(finalReels);
        setSpinning(false);

        // Check win
        const isWin = finalReels.every((val) => val === finalReels[0]);
        let winAmount = 0;
        if (isWin) {
          winAmount = betAmount * 10;
          await updateDoc(userRef, { balance: increment(winAmount) });
          onUpdateUser({ balance: user.balance - betAmount + winAmount });
          setWinMessage(`YOU WON ৳${winAmount}!`);
        }

        // Log bet
        await addDoc(collection(db, 'bets'), {
          uid: user.uid,
          game: 'slots',
          amount: betAmount,
          winAmount,
          status: isWin ? 'win' : 'loss',
          createdAt: new Date().toISOString()
        });
      }, spinDuration);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'bets');
      setSpinning(false);
    }
  }, [spinning, user, betAmount, onUpdateUser]);

  return (
    <div className="max-w-md mx-auto space-y-8 py-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tighter text-red-500 uppercase">Super Slots</h2>
        <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Match 3 to win 10x!</p>
      </div>

      <div className="relative p-8 bg-zinc-900 rounded-[40px] border-4 border-zinc-800 shadow-2xl shadow-red-500/10 overflow-hidden">
        {/* Lights */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse" />
        </div>

        <div className="flex justify-center gap-4">
          {reels.map((symbol, i) => (
            <motion.div
              key={i}
              animate={spinning ? { y: [0, -20, 20, 0], scale: [1, 1.1, 0.9, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.2 }}
              className="w-24 h-32 bg-zinc-950 rounded-2xl border-2 border-white/5 flex items-center justify-center text-5xl shadow-inner"
            >
              {symbol}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-center gap-4">
          {[10, 50, 100, 500].map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                betAmount === amount ? 'bg-red-600 text-white scale-110 shadow-lg shadow-red-600/20' : 'bg-zinc-800 text-zinc-500 hover:text-white'
              }`}
            >
              ৳{amount}
            </button>
          ))}
        </div>

        <button
          onClick={spin}
          disabled={spinning}
          className={`w-full py-6 rounded-[32px] font-black text-2xl uppercase tracking-tighter transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl ${
            spinning ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-600/20'
          }`}
        >
          {spinning ? 'Spinning...' : (
            <>
              <Play fill="currentColor" size={24} />
              Spin Now
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {winMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-emerald-600 text-white px-12 py-8 rounded-[40px] shadow-2xl shadow-emerald-600/40 text-center space-y-2 border-4 border-emerald-400">
              <Trophy size={64} className="mx-auto animate-bounce" />
              <h3 className="text-5xl font-black tracking-tighter uppercase">Big Win!</h3>
              <p className="text-2xl font-bold">{winMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-center gap-2 justify-center text-red-500 font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
