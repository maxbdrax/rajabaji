import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Flame, Trophy, Gamepad2, ChevronRight, ChevronLeft, Heart, Plane } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, limit } from 'firebase/firestore';
import { Notice } from '../types';

interface GameCardProps {
  title: string;
  provider: string;
  image: string;
  isHot?: boolean;
  onClick?: () => void;
  [key: string]: any;
}

const GameCard = ({ title, provider, image, isHot, onClick }: GameCardProps) => (
  <motion.div
    whileHover={{ y: -5 }}
    onClick={onClick}
    className="relative group cursor-pointer"
  >
    <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-ck-card shadow-lg">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      
      {/* Heart Icon */}
      <button className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:text-red-500 transition-colors">
        <Heart size={16} />
      </button>

      {/* Game Info */}
      <div className="absolute bottom-3 left-3 right-3">
        <h4 className="text-sm font-black uppercase tracking-tighter leading-tight">{title}</h4>
        <p className="text-[10px] font-bold text-ck-accent uppercase tracking-widest opacity-80">{provider}</p>
      </div>
    </div>
  </motion.div>
);

export default function Home({ onNavigate }: { onNavigate: (page: string) => void }) {
  const categories = [
    { id: 'hot', label: 'গরম খেলা', icon: Flame },
    { id: 'sports', label: 'স্পোর্টস', icon: Trophy },
    { id: 'casino', label: 'ক্যাসিনো', icon: Gamepad2 },
  ];

  const hotGames = [
    { title: 'AVIATOR', provider: 'SPRIBE', image: 'https://picsum.photos/seed/aviator/400/600', onClick: () => onNavigate('aviator') },
    { title: '7 UP 7 DOWN', provider: 'KINGMIDAS', image: 'https://picsum.photos/seed/7up/400/600', onClick: () => onNavigate('slots') },
    { title: 'Sugar Ace', provider: 'JILI', image: 'https://picsum.photos/seed/sugar/400/600', onClick: () => onNavigate('slots') },
    { title: 'Card Matka', provider: 'KINGMIDAS', image: 'https://picsum.photos/seed/matka/400/600', onClick: () => onNavigate('slots') },
    { title: 'Showdown', provider: 'PG SOFT', image: 'https://picsum.photos/seed/showdown/400/600', onClick: () => onNavigate('slots') },
    { title: 'Fortune Ji', provider: 'JILI', image: 'https://picsum.photos/seed/fortune/400/600', onClick: () => onNavigate('slots') },
  ];

  return (
    <div className="space-y-6 px-4">
      {/* Categories */}
      <div className="grid grid-cols-3 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              className="flex items-center justify-center gap-2 bg-[#004d40] py-3 rounded-xl border border-white/5 hover:bg-[#00695c] transition-colors"
            >
              <Icon size={18} className="text-ck-accent" />
              <span className="text-xs font-bold">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Hot Games Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black italic tracking-tighter text-ck-accent uppercase">HOT GAMES</h2>
            <button className="bg-[#004d40] px-3 py-1 rounded-md text-[10px] font-bold text-ck-accent uppercase border border-ck-accent/20">
              See All
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 bg-[#004d40] rounded-md text-white/60 hover:text-white border border-white/5">
              <ChevronLeft size={18} />
            </button>
            <button className="p-1.5 bg-[#004d40] rounded-md text-white/60 hover:text-white border border-white/5">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {hotGames.map((game, idx) => (
            <GameCard key={idx} {...game} />
          ))}
        </div>
      </div>

      {/* Banner / Promotion */}
      <div className="relative rounded-2xl overflow-hidden aspect-[16/7] shadow-2xl">
        <img
          src="https://picsum.photos/seed/casino-banner/1200/500"
          alt="Promotion"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center p-6">
          <span className="text-ck-accent font-black text-xs uppercase tracking-widest mb-1">New Member Offer</span>
          <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-4">Get +৳100<br/>Bonus Now</h3>
          <button onClick={() => onNavigate('promotion')} className="w-fit px-6 py-2 bg-ck-accent text-[#003d33] font-black rounded-full text-xs uppercase tracking-tighter shadow-lg">
            Claim Now
          </button>
        </div>
      </div>
    </div>
  );
}
