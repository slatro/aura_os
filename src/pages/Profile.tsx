import { useEffect } from 'react';
import { Trophy, Wallet, Crosshair, Sparkles as SparklesIcon, User, Repeat } from 'lucide-react';
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
    setPublicProfile,
    logout,
    user,
    linkTwitter,
    unlinkTwitter,
    authenticated
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
        <div className="bg-[#09090b] border border-[#27272a] cyber-button p-8 relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, transparent, ${fullProfile.tierColor})` }}></div>
          
          <div className="w-32 h-32 md:w-40 md:h-40 border-4 overflow-hidden rounded-full shadow-2xl relative z-10 flex-shrink-0 mb-6" style={{ borderColor: fullProfile.tierColor, boxShadow: `0 0 40px ${fullProfile.tierColor}40` }}>
            <img src={fullProfile.avatar_url.replace('_normal', '')} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          
          <div className="space-y-6 relative z-10 w-full max-w-xl mx-auto">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-widest uppercase mb-2">{fullProfile.name}</h1>
              <div className="text-[#a1a1aa] text-lg">@{fullProfile.screen_name}</div>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center">
              <span className="px-4 py-1.5 text-sm font-bold uppercase tracking-wider border" style={{ backgroundColor: `${fullProfile.tierColor}15`, color: fullProfile.tierColor, borderColor: `${fullProfile.tierColor}50` }}>
                {fullProfile.tierLevel} // {fullProfile.tierName}
              </span>
              <span className="px-4 py-1.5 text-sm font-bold uppercase tracking-wider border border-[#27272a] text-[#71717a] bg-[#18181b]">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-2 mt-8 pt-6 border-t border-[#27272a]">
              <div className="bg-[#050505] border border-[#18181b] p-3 rounded-lg">
                <div className="text-[#71717a] text-[10px] uppercase mb-1 flex items-center justify-center"><Trophy className="w-3 h-3 mr-1" /> Aura</div>
                <div className="text-white font-bold" style={{ color: fullProfile.tierColor }}>{fullProfile.auraScore.toLocaleString()}</div>
              </div>
              <div className="bg-[#050505] border border-[#18181b] p-3 rounded-lg">
                <div className="text-[#71717a] text-[10px] uppercase mb-1 flex items-center justify-center"><Wallet className="w-3 h-3 mr-1" /> Monad</div>
                <div className="text-white font-bold">{fullProfile.realData.balance.toFixed(4)}</div>
              </div>
              <div className="bg-[#050505] border border-[#18181b] p-3 rounded-lg">
                <div className="text-[#71717a] text-[10px] uppercase mb-1 flex items-center justify-center"><Crosshair className="w-3 h-3 mr-1" /> Txs</div>
                <div className="text-white font-bold">{fullProfile.realData.txCount.toLocaleString()}</div>
              </div>
              <div className="bg-[#050505] border border-[#18181b] p-3 rounded-lg">
                <div className="text-[#71717a] text-[10px] uppercase mb-1 flex items-center justify-center">X Followers</div>
                <div className="text-white font-bold">{fullProfile.followers.toLocaleString()}</div>
              </div>
            </div>

            {/* Privy Connection Management */}
            <div className="flex flex-col md:flex-row gap-4 mt-6 pt-6 border-t border-[#27272a]">
              <button onClick={logout} className="flex-1 bg-[#18181b] border border-[#27272a] text-[#71717a] font-bold py-3 cyber-button text-xs uppercase tracking-widest flex items-center justify-center group hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 transition-colors relative overflow-hidden">
                <div className="flex items-center group-hover:opacity-0 transition-opacity"><Wallet className="w-4 h-4 mr-2" />Disconnect</div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Repeat className="w-4 h-4 mr-2" />Change Wallet</div>
              </button>

              {authenticated && user?.twitter ? (
                <button onClick={() => { if (user?.twitter?.subject) unlinkTwitter(user.twitter.subject); }} className="flex-1 bg-[#1da1f2]/10 border border-[#1da1f2]/50 text-[#1da1f2] font-bold py-3 cyber-button text-xs uppercase tracking-widest flex items-center justify-center group hover:bg-red-500/20 hover:border-red-500 hover:text-red-500 transition-colors relative overflow-hidden">
                  <div className="flex items-center group-hover:opacity-0 transition-opacity"><User className="w-4 h-4 mr-2" />Linked: @{user.twitter.username}</div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Repeat className="w-4 h-4 mr-2" />Unlink X</div>
                </button>
              ) : (
                <button onClick={() => linkTwitter()} className="flex-1 bg-[#18181b] border border-[#27272a] text-[#71717a] hover:text-[#1da1f2] hover:border-[#1da1f2] font-bold py-3 cyber-button text-xs uppercase tracking-widest flex items-center justify-center transition-colors">
                  <Crosshair className="w-4 h-4 mr-2" />Link X Account
                </button>
              )}
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
