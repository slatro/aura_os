import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Status = 'idle' | 'calculating' | 'resolved';

const TIER_COLORS = {
  1: { primary: '#836EF9', secondary: '#B4A1FF', glow: 'rgba(131,110,249,0.5)' }, 
  2: { primary: '#FF4DB8', secondary: '#FF9EE0', glow: 'rgba(255,77,184,0.5)' }, 
  3: { primary: '#FFD700', secondary: '#FFF4A3', glow: 'rgba(255,215,0,0.5)' },  
};

export function AuraVisualizer() {
  const [status, setStatus] = useState<Status>('idle');
  const [level, setLevel] = useState<1 | 2 | 3>(1);

  const startCalculation = () => {
    setStatus('calculating');
    setTimeout(() => {
      const randomTier = Math.floor(Math.random() * 3) + 1 as 1 | 2 | 3;
      setLevel(randomTier);
      setStatus('resolved');
    }, 3000);
  };

  const colors = status === 'resolved' ? TIER_COLORS[level] : TIER_COLORS[1];

  return (
    <div className="glass-panel flex flex-col items-center justify-center p-8 h-full relative overflow-hidden">
      
      {/* Background ambient pulse for the visualizer */}
      <motion.div 
        animate={{ 
          backgroundColor: status === 'calculating' ? 'transparent' : colors.glow,
          scale: status === 'calculating' ? 0.8 : [1, 1.1, 1]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 opacity-[0.15] blur-[120px] pointer-events-none rounded-full"
      />

      <div className="relative w-80 h-80 flex items-center justify-center mt-[-40px]">
        
        <AnimatePresence>
          {status === 'idle' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center z-30"
            >
              <button 
                onClick={startCalculation}
                className="bg-[#836EF9] hover:bg-[#B4A1FF] text-white px-8 py-4 rounded-xl font-bold tracking-widest transition-all shadow-[0_0_20px_rgba(131,110,249,0.5)] hover:shadow-[0_0_40px_rgba(180,161,255,0.8)] hover:scale-105 active:scale-95"
              >
                CONNECT & ANALYZE
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* High-tech outer dash ring */}
        <motion.div
          animate={{ rotate: status === 'calculating' ? 720 : 360 }}
          transition={{ duration: status === 'calculating' ? 2 : 20, repeat: Infinity, ease: "linear" }}
          style={{ borderColor: colors.primary }}
          className={`absolute inset-0 rounded-full border-[2px] border-dashed opacity-60 ${status === 'idle' ? 'border-white/20' : ''}`}
        />

        {/* Middle Solid Ring */}
        <motion.div
          animate={{ 
            rotate: status === 'calculating' ? -720 : -360,
            scale: status === 'calculating' ? [1, 1.05, 1] : 1
          }}
          transition={{ duration: status === 'calculating' ? 1.5 : 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-8 rounded-full border border-transparent"
          style={{ 
            borderTopColor: status === 'idle' ? 'rgba(255,255,255,0.2)' : colors.secondary,
            borderBottomColor: status === 'idle' ? 'rgba(255,255,255,0.1)' : colors.primary,
          }}
        />
        
        {/* The Core Element - Geometric and vibrant */}
        <motion.div
          animate={{ 
            scale: status === 'calculating' ? [1, 1.2, 1] : [1, 1.05, 1],
            rotate: status === 'calculating' ? 360 : 0
          }}
          transition={{ duration: status === 'calculating' ? 0.5 : 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-32 h-32 rounded-3xl flex items-center justify-center relative"
          style={{
            background: status === 'idle' ? 'rgba(255,255,255,0.02)' : `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}90)`,
            boxShadow: status === 'idle' ? 'none' : `0 0 50px ${colors.glow}, inset 0 0 20px rgba(255,255,255,0.5)`,
            border: `1px solid ${status === 'idle' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)'}`
          }}
        >
          {/* Inner energetic diamond */}
          <motion.div 
            animate={{ rotate: 45, scale: status === 'calculating' ? [0.8, 1.2, 0.8] : [1, 0.9, 1] }}
            transition={{ duration: status === 'calculating' ? 0.3 : 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-12 h-12 bg-white rounded-md"
            style={{ 
              opacity: status === 'idle' ? 0.1 : 0.9,
              boxShadow: status === 'idle' ? 'none' : `0 0 40px white`
            }}
          />
        </motion.div>
      </div>

      {/* Profile Text */}
      <div className={`mt-12 text-center z-10 transition-all duration-500 ${status === 'resolved' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <h2 className="text-3xl font-black tracking-tight text-white mb-3" style={{ textShadow: `0 0 15px ${colors.glow}` }}>
          @emreoktem
        </h2>
        <div className="inline-block px-5 py-1.5 rounded-full font-bold uppercase tracking-[0.2em] text-xs bg-white text-black"
             style={{ boxShadow: `0 0 20px ${colors.glow}` }}>
          TIER {level} AURA
        </div>
      </div>
      
      {/* Stats */}
      <div className={`absolute bottom-8 left-8 right-8 flex justify-center space-x-12 transition-all duration-700 delay-300 ${status === 'resolved' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex flex-col items-center bg-white/5 px-6 py-4 rounded-2xl border border-white/10 shadow-inner">
          <span className="text-white/50 text-[10px] font-mono tracking-[0.2em] uppercase mb-1">X Engagement</span>
          <span className="text-white font-bold text-2xl" style={{ textShadow: `0 0 10px ${colors.glow}` }}>
            {level === 3 ? '99.8%' : level === 2 ? '85.4%' : '62.1%'}
          </span>
        </div>
        <div className="flex flex-col items-center bg-white/5 px-6 py-4 rounded-2xl border border-white/10 shadow-inner">
          <span className="text-white/50 text-[10px] font-mono tracking-[0.2em] uppercase mb-1">Onchain Score</span>
          <span className="text-white font-bold text-2xl" style={{ textShadow: `0 0 10px ${colors.glow}` }}>
            {level === 3 ? '12,450' : level === 2 ? '4,210' : '840'}
          </span>
        </div>
      </div>
    </div>
  );
}
