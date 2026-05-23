import { Compass, Flame, Hash, User, Settings, AtSign } from 'lucide-react';

export function Sidebar() {
  return (
    <div className="glass-panel w-72 h-full flex flex-col p-6 relative overflow-hidden">
      {/* Logo */}
      <div className="flex items-center space-x-4 mb-12 mt-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#836EF9] to-[#B4A1FF] flex items-center justify-center shadow-[0_0_20px_rgba(131,110,249,0.5)]">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <span className="font-black text-2xl tracking-[0.2em] text-white">AURA</span>
      </div>

      {/* Navigation */}
      <div className="space-y-2 flex-1">
        <NavItem icon={<Flame />} label="Trending Auras" active />
        <NavItem icon={<Hash />} label="Market Overview" />
        <NavItem icon={<User />} label="My Portfolio" />
        <NavItem icon={<Settings />} label="Settings" />
      </div>

      {/* User Connection Status */}
      <div className="mt-auto bg-white/[0.02] p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-white/50 tracking-[0.2em] uppercase font-mono">Identity</span>
          <div className="w-2 h-2 rounded-full bg-[#4ade80] shadow-[0_0_10px_#4ade80] animate-pulse"></div>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#836EF9]/20 to-[#B4A1FF]/20 flex items-center justify-center border border-white/10 shadow-lg">
            <AtSign className="w-5 h-5 text-[#B4A1FF]" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide">@emreoktem</div>
            <div className="text-xs text-[#836EF9] font-mono mt-1 flex items-center">
              <span className="w-1 h-1 bg-[#836EF9] rounded-full mr-2"></span>
              Oracle Verified
            </div>
          </div>
        </div>

        <button className="w-full text-xs font-mono py-3 bg-[#836EF9]/10 hover:bg-[#836EF9]/20 border border-[#836EF9]/30 rounded-xl text-[#B4A1FF] transition-all flex justify-between items-center px-4">
          <span>0x7A2...F9b1</span>
          <span className="text-white/30 text-[10px]">CONNECTED</span>
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all ${
      active 
        ? 'bg-gradient-to-r from-white/10 to-transparent border-l-2 border-[#836EF9] text-white shadow-lg' 
        : 'text-white/50 hover:text-white hover:bg-white/5'
    }`}>
      <div className={`${active ? 'text-[#B4A1FF]' : ''}`}>
        {icon}
      </div>
      <span className="font-medium text-sm tracking-wide">{label}</span>
    </button>
  );
}
