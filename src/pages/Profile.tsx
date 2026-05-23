import { useEffect } from 'react';
import { Trophy, Wallet, Crosshair, Sparkles as SparklesIcon } from 'lucide-react';
import { useAura } from '../context/AuraContext';
import { formatUnits } from 'viem';

export default function Profile() {
  const { 
    fullProfile, 
    walletAddress, 
    profileModalData, 
    refetchProfileModal,
    handleBuyKey, 
    handleSellKey, 
    isTrading,
    publicProfile,
    setPublicProfile
  } = useAura();

  useEffect(() => {
    if (walletAddress && fullProfile) {
      setPublicProfile({ address: walletAddress, ...fullProfile });
    }
  }, [walletAddress, fullProfile, setPublicProfile]);

  useEffect(() => {
    if (publicProfile) {
      refetchProfileModal();
    }
  }, [publicProfile, refetchProfileModal]);

  if (!fullProfile) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-[#71717a] font-mono text-sm uppercase tracking-widest animate-pulse">
        <SparklesIcon className="w-5 h-5 mr-3" /> Awaiting On-Chain Profile...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] p-6 lg:p-10 font-mono">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Profile Section */}
        <div className="bg-[#09090b] border border-[#27272a] cyber-button p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, transparent, ${fullProfile.tierColor})` }}></div>
          
          <div className="w-32 h-32 border-2 overflow-hidden rounded-full shadow-2xl relative z-10 flex-shrink-0" style={{ borderColor: fullProfile.tierColor }}>
            <img src={fullProfile.avatar_url.replace('_normal', '')} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1 space-y-4 relative z-10 w-full text-center md:text-left">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-widest uppercase mb-1">{fullProfile.name}</h1>
              <div className="text-[#a1a1aa] text-sm">@{fullProfile.screen_name}</div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider border" style={{ backgroundColor: `${fullProfile.tierColor}15`, color: fullProfile.tierColor, borderColor: `${fullProfile.tierColor}50` }}>
                {fullProfile.tierLevel} // {fullProfile.tierName}
              </span>
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider border border-[#27272a] text-[#71717a] bg-[#18181b]">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#27272a]">
              <div>
                <div className="text-[#71717a] text-[10px] uppercase mb-1 flex items-center justify-center md:justify-start"><Trophy className="w-3 h-3 mr-1" /> Aura</div>
                <div className="text-white font-bold" style={{ color: fullProfile.tierColor }}>{fullProfile.auraScore.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[#71717a] text-[10px] uppercase mb-1 flex items-center justify-center md:justify-start"><Wallet className="w-3 h-3 mr-1" /> Monad</div>
                <div className="text-white font-bold">{fullProfile.realData.balance.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-[#71717a] text-[10px] uppercase mb-1 flex items-center justify-center md:justify-start"><Crosshair className="w-3 h-3 mr-1" /> Txs</div>
                <div className="text-white font-bold">{fullProfile.realData.txCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[#71717a] text-[10px] uppercase mb-1 flex items-center justify-center md:justify-start">X Followers</div>
                <div className="text-white font-bold">{fullProfile.followers.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bonding Curve Section */}
        {profileModalData && walletAddress && (
          <div className="bg-[#09090b] border border-[#27272a] cyber-button p-6 relative">
            <h2 className="text-[#836EF9] text-sm font-bold tracking-widest uppercase mb-6 flex items-center">
              <Crosshair className="w-4 h-4 mr-2" /> Your_Card_Market
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-[#18181b]">
                  <span className="text-[#71717a] text-xs">Total Cards Supply</span>
                  <span className="text-white text-sm font-bold">{Number((profileModalData as any)[1] || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#18181b]">
                  <span className="text-[#71717a] text-xs">Cards You Own</span>
                  <span className="text-[#4ade80] text-sm font-bold">{Number((profileModalData as any)[2] || 0)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => handleBuyKey(walletAddress, (profileModalData as any)[3])} 
                  disabled={isTrading} 
                  className="w-full bg-[#836EF9]/10 border border-[#836EF9]/50 text-[#836EF9] hover:bg-[#836EF9] hover:text-white font-bold py-3 cyber-button text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  <div className="flex flex-col items-center">
                    <span>{isTrading ? 'Signing...' : 'BUY OWN CARD'}</span>
                    <span className="text-[10px] font-mono mt-1 opacity-80 text-white">
                      {Number(formatUnits((profileModalData as any)[3] || 0n, 18)).toFixed(5)} MON
                    </span>
                  </div>
                </button>
                <button 
                  onClick={() => handleSellKey(walletAddress)} 
                  disabled={isTrading || Number((profileModalData as any)[2]) === 0} 
                  className="w-full bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-[#050505] font-bold py-3 cyber-button text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  <div className="flex flex-col items-center">
                    <span>{isTrading ? 'Signing...' : 'SELL OWN CARD'}</span>
                    <span className="text-[10px] font-mono mt-1 opacity-80 text-white">
                      {Number(formatUnits((profileModalData as any)[4] || 0n, 18)).toFixed(5)} MON
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
