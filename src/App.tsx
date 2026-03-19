import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider, signInWithPopup, onAuthStateChanged, handleFirestoreError, OperationType, signOut } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, query, where, limit } from 'firebase/firestore';
import { UserProfile, Reward } from './types';
import Layout from './components/Layout';
import SlotGame from './components/SlotGame';
import AviatorGame from './components/AviatorGame';
import AdminPanel from './components/AdminPanel';
import DepositModal from './components/DepositModal';
import WithdrawalModal from './components/WithdrawalModal';
import Home from './components/Home';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, AlertCircle, Wallet, User, History as HistoryIcon, ShieldCheck, LogOut, Gift, Users, Trophy } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Real-time listener for user profile
        const unsubUser = onSnapshot(userRef, async (snap) => {
          if (snap.exists()) {
            const userData = snap.data() as UserProfile;
            const isAdminEmail = firebaseUser.email === 'rakibakonsdrax@gmail.com';
            
            // Force admin role if email matches but role is not admin
            if (isAdminEmail && userData.role !== 'admin') {
              await updateDoc(userRef, { role: 'admin' });
              userData.role = 'admin';
            }
            
            setUser(userData);
          } else {
            // Create new user profile
            const isAdminEmail = firebaseUser.email === 'rakibakonsdrax@gmail.com';
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Player',
              balance: 0,
              role: isAdminEmail ? 'admin' : 'user',
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newUser);
            setUser(newUser);
          }
          setLoading(false);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'users');
          setLoading(false);
        });

        return () => unsubUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  const renderPage = () => {
    if (!user && currentPage !== 'home') return <LoginView onLogin={handleLogin} error={error} />;

    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'promotion':
        return <PromotionView />;
      case 'invitation':
        return <InvitationView />;
      case 'rewards':
        return <RewardsView />;
      case 'member':
        return <MemberView user={user!} onDeposit={() => setShowDeposit(true)} onWithdraw={() => setShowWithdrawal(true)} onLogout={() => signOut(auth)} />;
      case 'admin':
        return user?.role === 'admin' ? <AdminPanel /> : <Home onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout user={user} onNavigate={setCurrentPage} currentPage={currentPage}>
      {renderPage()}
      <AnimatePresence>
        {showDeposit && user && <DepositModal user={user} onClose={() => setShowDeposit(false)} />}
        {showWithdrawal && user && <WithdrawalModal user={user} onUpdateUser={(data) => setUser(prev => prev ? { ...prev, ...data } : null)} onClose={() => setShowWithdrawal(false)} />}
      </AnimatePresence>
    </Layout>
  );
}

function MemberView({ user, onDeposit, onWithdraw, onLogout }: { user: UserProfile, onDeposit: () => void, onWithdraw: () => void, onLogout: () => void }) {
  return (
    <div className="space-y-6 px-4 py-4">
      <div className="bg-[#003d33] p-6 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-ck-accent rounded-full flex items-center justify-center text-[#003d33]">
            <User size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter">{user.displayName}</h3>
            <p className="text-white/60 text-xs font-bold">{user.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#002d26] p-4 rounded-2xl border border-white/5">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">ব্যালেন্স</p>
            <p className="text-2xl font-black text-ck-accent">৳{user.balance.toFixed(2)}</p>
          </div>
          <div className="bg-[#002d26] p-4 rounded-2xl border border-white/5">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">রোল</p>
            <p className="text-2xl font-black uppercase tracking-tighter">{user.role}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onDeposit}
          className="py-4 bg-ck-accent text-[#003d33] rounded-2xl font-black uppercase tracking-tighter shadow-lg shadow-ck-accent/20 active:scale-95 transition-all"
        >
          ডিপোজিট
        </button>
        <button
          onClick={onWithdraw}
          className="py-4 bg-[#004d40] text-white rounded-2xl font-black uppercase tracking-tighter border border-white/10 active:scale-95 transition-all"
        >
          উইথড্র
        </button>
      </div>

      <div className="bg-[#003d33] rounded-3xl border border-white/10 overflow-hidden">
        <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5">
          <div className="flex items-center gap-3">
            <HistoryIcon size={20} className="text-ck-accent" />
            <span className="font-bold text-sm">বেটিং ইতিহাস</span>
          </div>
          <ShieldCheck size={18} className="text-white/20" />
        </button>
        <button onClick={onLogout} className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-500/10 transition-colors text-red-400">
          <div className="flex items-center gap-3">
            <LogOut size={20} />
            <span className="font-bold text-sm">লগ আউট</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function PromotionView() {
  return (
    <div className="px-4 py-8 text-center space-y-4">
      <Gift size={48} className="mx-auto text-ck-accent" />
      <h2 className="text-2xl font-black uppercase tracking-tighter">প্রমোশন</h2>
      <p className="text-white/60 font-medium">বর্তমানে কোনো প্রমোশন উপলব্ধ নেই।</p>
    </div>
  );
}

function InvitationView() {
  return (
    <div className="px-4 py-8 text-center space-y-4">
      <Users size={48} className="mx-auto text-ck-accent" />
      <h2 className="text-2xl font-black uppercase tracking-tighter">আমন্ত্রণ</h2>
      <p className="text-white/60 font-medium">আপনার বন্ধুদের আমন্ত্রণ জানান এবং বোনাস জিতুন!</p>
    </div>
  );
}

function RewardsView() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'rewards'),
      where('active', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rewardsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reward[];
      setRewards(rewardsList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'rewards');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-ck-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <Trophy size={48} className="mx-auto text-ck-accent" />
        <h2 className="text-2xl font-black uppercase tracking-tighter">পুরস্কার ও বোনাস</h2>
        <p className="text-white/60 text-sm font-medium">আপনার জন্য বিশেষ অফার এবং পুরস্কারসমূহ</p>
      </div>

      <div className="grid gap-4">
        {rewards.length > 0 ? (
          rewards.map((reward) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#003d33] p-5 rounded-2xl border border-white/10 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-ck-accent/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
              
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black uppercase tracking-tighter text-ck-accent">{reward.title}</h3>
                  <div className="bg-ck-accent/10 px-3 py-1 rounded-full border border-ck-accent/20">
                    <span className="text-ck-accent font-black text-xs">৳{reward.amount}</span>
                  </div>
                </div>
                
                <p className="text-white/70 text-sm font-medium leading-relaxed">{reward.description}</p>
                
                <div className="pt-2 flex items-center justify-between gap-4">
                  <div className="flex-1 bg-[#002d26] px-4 py-2 rounded-xl border border-white/5 font-mono text-sm font-bold text-center tracking-widest">
                    {reward.code}
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(reward.code);
                      alert('প্রোমো কোড কপি করা হয়েছে!');
                    }}
                    className="px-4 py-2 bg-ck-accent text-[#003d33] rounded-xl font-black text-xs uppercase tracking-tighter shadow-lg active:scale-95 transition-all"
                  >
                    কপি করুন
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 bg-[#003d33] rounded-3xl border border-dashed border-white/10">
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">বর্তমানে কোনো পুরস্কার উপলব্ধ নেই</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginView({ onLogin, error }: { onLogin: () => void, error: string | null }) {
  return (
    <div className="max-w-md mx-auto px-4 py-24 space-y-8 text-center">
      <div className="w-24 h-24 bg-ck-accent rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-ck-accent/20">
        <span className="text-4xl font-black italic tracking-tighter text-[#003d33]">CK33</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-4xl font-black tracking-tighter uppercase">স্বাগতম CK33 এ</h2>
        <p className="text-white/60 font-bold">খেলতে এবং জিততে গুগল দিয়ে লগইন করুন।</p>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 justify-center text-red-500 font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={onLogin}
        className="w-full py-6 bg-white text-black rounded-[32px] font-black text-xl uppercase tracking-tighter flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-95 shadow-xl"
      >
        <LogIn size={24} />
        গুগল দিয়ে লগইন করুন
      </button>
    </div>
  );
}
