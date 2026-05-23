import { Activity, ArrowUpRight, TrendingUp, Wallet } from 'lucide-react';

export function TradePanel() {
  return (
    <div className="glass-panel p-6 flex flex-col h-full font-sans relative overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-6">
        <div>
          <h3 className="text-[10px] text-white/50 font-mono tracking-[0.2em] uppercase">Current Price</h3>
          <div className="text-4xl font-bold text-white mt-1 flex items-end tracking-tight">
            4.20 <span className="text-sm text-[#836EF9] ml-2 mb-1 tracking-widest font-mono">MONAD</span>
          </div>
        </div>
        <div className="flex items-center text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/20 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(74,222,128,0.1)]">
          <TrendingUp className="w-4 h-4 mr-2" />
          <span className="text-sm font-bold">+12.4%</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Aesthetic Mock Chart Area */}
        <div className="h-48 w-full mb-8 relative flex items-end">
          <div className="absolute inset-0 bg-gradient-to-t from-[#836EF9]/10 to-transparent rounded-t-2xl"></div>
          <div className="w-full flex justify-between items-end h-full px-2 pb-1 space-x-[2px] opacity-80">
            {[40, 50, 30, 60, 45, 70, 85, 60, 95, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-[#836EF9] to-[#B4A1FF] rounded-t-sm transition-all hover:brightness-150" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>

        {/* Trade Controls */}
        <div className="space-y-5 mt-auto">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/50 tracking-wide">Available Balance</span>
            <span className="font-mono text-white tracking-wider">128.50 <span className="text-[#836EF9]">MONAD</span></span>
          </div>
          
          <div className="relative group">
            <input 
              type="number" 
              placeholder="0.0" 
              className="w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl py-4 px-5 text-xl font-mono text-white placeholder-white/20 focus:outline-none focus:border-[#836EF9]/50 focus:bg-white/5 transition-all shadow-inner"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 font-mono tracking-widest text-sm">AURA</span>
          </div>
          
          <div className="flex space-x-4 pt-2">
            <button className="flex-1 bg-[#836EF9] hover:bg-[#B4A1FF] text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(131,110,249,0.3)] hover:shadow-[0_0_30px_rgba(131,110,249,0.6)] transition-all flex items-center justify-center tracking-widest text-sm">
              <Activity className="w-4 h-4 mr-2" /> BUY
            </button>
            <button className="flex-1 bg-white/5 border border-white/10 text-white/80 font-bold py-4 rounded-xl hover:bg-white/10 transition-colors tracking-widest text-sm">
              SELL
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10">
        <h4 className="text-[10px] text-white/30 font-mono mb-4 tracking-[0.2em] uppercase">Recent Activity</h4>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mr-3">
                  <Wallet className="w-3 h-3 text-white/50" />
                </div>
                <span className="font-mono text-white/70 tracking-wider">0x{(Math.random()*1000).toFixed(0)}...</span>
              </div>
              <span className="text-[#4ade80] flex items-center font-mono bg-[#4ade80]/10 px-2 py-1 rounded">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {(Math.random() * 2).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
