import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogOut, User, Wallet, ShieldCheck, Home, Gift, Users, Trophy, Menu, ChevronRight, Bell } from 'lucide-react';
import { auth, signOut, db } from '../firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { UserProfile, Notice } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Layout({ children, user, onNavigate, currentPage }: LayoutProps) {
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'notices'),
      where('active', '==', true),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActiveNotice({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Notice);
      } else {
        setActiveNotice(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => signOut(auth);

  const navItems = [
    { id: 'home', label: 'হোম', icon: Home },
    { id: 'promotion', label: 'প্রমোশন', icon: Gift },
    { id: 'invitation', label: 'আমন্ত্রণ', icon: Users },
    { id: 'rewards', label: 'পুরস্কার', icon: Trophy },
    { id: 'member', label: 'সদস্য', icon: User },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin', icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen bg-ck-bg text-white font-sans selection:bg-ck-accent/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#003d33] px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button className="p-1 text-white/80 hover:text-white">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => onNavigate('home')}>
            <span className="text-2xl font-black italic tracking-tighter text-ck-accent">CK33</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="bg-[#004d40] px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <span className="text-ck-accent font-black text-xs">৳{user.balance.toFixed(2)}</span>
                <div className="w-5 h-5 bg-ck-accent rounded-full flex items-center justify-center text-[#003d33] font-black text-[10px]">
                  +
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-white/60 hover:text-white"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-1.5 bg-[#004d40] text-white font-bold rounded-md text-sm border border-white/5"
              >
                লগইন
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-1.5 bg-ck-accent text-[#003d33] font-bold rounded-md text-sm shadow-lg shadow-ck-accent/20"
              >
                রেজিস্টার
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Announcement Bar */}
      <div className="bg-[#002d26] px-4 py-2 flex items-center gap-3 border-b border-white/5 overflow-hidden">
        <div className="text-ck-accent flex-shrink-0">
          <Bell size={18} />
        </div>
        <div className="flex-1 whitespace-nowrap overflow-hidden">
          <p className="text-xs font-medium text-white/80 animate-marquee">
            {activeNotice ? activeNotice.text : 'CK33-এ আপনাকে স্বাগতম! আমাদের নতুন গেমগুলো খেলুন এবং জিতে নিন আকর্ষণীয় পুরস্কার।'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-24 pt-2 max-w-7xl mx-auto">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#003d33] border-t border-white/10 px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 transition-all flex-1 py-1 ${
                  isActive ? 'text-ck-accent' : 'text-white/60'
                }`}
              >
                <div className={`${isActive ? 'bg-ck-accent/10 p-1 rounded-full' : ''}`}>
                  <Icon size={22} />
                </div>
                <span className="text-[11px] font-bold">{item.label}</span>
                {isActive && <div className="w-1 h-1 bg-ck-accent rounded-full mt-0.5" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Custom Styles for Marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
