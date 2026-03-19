import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, TrendingUp, AlertCircle, Trophy, Play } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { addDoc, collection, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AviatorGameProps {
  user: UserProfile;
  onUpdateUser: (data: Partial<UserProfile>) => void;
}

export default function AviatorGame({ user, onUpdateUser }: AviatorGameProps) {
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState<'idle' | 'flying' | 'crashed'>('idle');
  const [betAmount, setBetAmount] = useState(10);
  const [hasBet, setHasBet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [crashPoint, setCrashPoint] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startFlight = useCallback(async () => {
    if (gameState === 'flying' || user.balance < betAmount) {
      if (user.balance < betAmount) setError('Insufficient balance');
      return;
    }

    setError(null);
    setWinMessage(null);
    setGameState('flying');
    setMultiplier(1.0);
    setHasBet(true);

    // Deduct bet
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { balance: increment(-betAmount) });
      onUpdateUser({ balance: user.balance - betAmount });

      // Determine crash point (random between 1.1 and 10.0)
      const randomCrash = 1.1 + Math.random() * 9;
      setCrashPoint(randomCrash);

      timerRef.current = setInterval(() => {
        setMultiplier((prev) => {
          const next = prev + 0.01 * (prev * 0.5);
          if (next >= randomCrash) {
            clearInterval(timerRef.current!);
            setGameState('crashed');
            setHasBet(false);
            return prev;
          }
          return next;
        });
      }, 100);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'bets');
      setGameState('idle');
    }
  }, [gameState, user, betAmount, onUpdateUser]);

  const cashOut = useCallback(async () => {
    if (gameState !== 'flying' || !hasBet) return;

    setHasBet(false);
    const winAmount = Math.floor(betAmount * multiplier);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { balance: increment(winAmount) });
      onUpdateUser({ balance: user.balance + winAmount });
      setWinMessage(`CASHED OUT ৳${winAmount}!`);

      // Log bet
      await addDoc(collection(db, 'bets'), {
        uid: user.uid,
        game: 'aviator',
        amount: betAmount,
        winAmount,
        status: 'win',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'bets');
    }
  }, [gameState, hasBet, betAmount, multiplier, user, onUpdateUser]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-8 py-8 px-4">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tighter text-red-500 uppercase flex items-center justify-center gap-3">
          <Plane className="animate-bounce" />
          Aviator
        </h2>
        <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Cash out before the plane flies away!</p>
      </div>

      <div className="relative h-80 bg-zinc-900 rounded-[40px] border-4 border-zinc-800 shadow-2xl overflow-hidden flex items-center justify-center">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 text-center">
          <motion.div
            key={multiplier}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`text-8xl font-black tracking-tighter ${gameState === 'crashed' ? 'text-red-500' : 'text-emerald-500'}`}
          >
            {multiplier.toFixed(2)}x
          </motion.div>
          {gameState === 'crashed' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-black text-red-600 uppercase tracking-widest">
              Flew Away!
            </motion.div>
          )}
        </div>

        {/* Plane Animation */}
        {gameState === 'flying' && (
          <motion.div
            animate={{
              x: [0, 100, 200, 300, 400],
              y: [0, -50, -100, -150, -200],
              rotate: [-10, -20, -10, 0, 10]
            }}
            transition={{ duration: 10, ease: 'linear' }}
            className="absolute bottom-10 left-10 text-red-500"
          >
            <Plane size={48} fill="currentColor" />
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4 bg-zinc-900 p-6 rounded-[32px] border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 font-bold uppercase text-xs">Bet Amount</span>
            <span className="text-emerald-500 font-black">৳{betAmount}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[10, 50, 100, 500].map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt)}
                className={`py-2 rounded-xl font-bold text-xs transition-all ${
                  betAmount === amt ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-white'
                }`}
              >
                ৳{amt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {gameState === 'idle' || gameState === 'crashed' ? (
            <button
              onClick={startFlight}
              className="h-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[32px] font-black text-2xl uppercase tracking-tighter shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Play fill="currentColor" />
              Bet Now
            </button>
          ) : (
            <button
              onClick={cashOut}
              disabled={!hasBet}
              className={`h-full py-6 rounded-[32px] font-black text-2xl uppercase tracking-tighter shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center ${
                hasBet ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <span className="text-sm opacity-80">Cash Out</span>
              <span>৳{Math.floor(betAmount * multiplier)}</span>
            </button>
          )}
        </div>
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
