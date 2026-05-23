import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Wallet, Crosshair, Sparkles as SparklesIcon, User } from 'lucide-react';
import { useAura, CONTRACT_ADDRESS } from '../context/AuraContext';
import { formatUnits } from 'viem';
import { useReadContract } from 'wagmi';
import AuraNetworkABI from '../config/AuraNetworkABI.json';

export default function Profile() {
  const { address } = useParams();

  const { 
    fullProfile, 
    walletAddress, 
    ownProfileData, 
    refetchOwnProfileData,
    handleBuyKey, 
    handleSellKey, 
    handleTip,
    isTrading,
    isTipping,
    logout,
    user,
    linkTwitter,
    unlinkTwitter,
    authenticated,
    holders
  } = useAura();

  const isOwnProfile = !address || (walletAddress && address.toLowerCase() === walletAddress.toLowerCase());
  const targetAddress = address || walletAddress;

  const { data: targetProfileData, refetch: refetchTargetProfile } = useReadContract({
    address: CONTRACT_ADDRESS, abi: AuraNetworkABI, functionName: 'getProfileData',
    args: targetAddress ? [targetAddress, walletAddress || '0x0000000000000000000000000000000000000000'] : undefined,
    query: { enabled: !!targetAddress },
  });

  useEffect(() => {
    if (targetAddress) {
      refetchTargetProfile();
      if (isOwnProfile) refetchOwnProfileData();
    }
  }, [targetAddress, refetchTargetProfile, isOwnProfile, refetchOwnProfileData]);

  const displayData = isOwnProfile ? ownProfileData : targetProfileData;
  const onChainStruct = displayData ? (displayData as any)[0] : null;

  const displayProfile = isOwnProfile ? fullProfile : (onChainStruct && onChainStruct.exists ? {
    name: onChainStruct.username,
    screen_name: onChainStruct.username,
    avatar_url: `https://unavatar.io/twitter/${onChainStruct.username}`,
    auraScore: Number(onChainStruct.auraScore),
    tierName: onChainStruct.tierName,
    tierColor: onChainStruct.tierName === 'Shark' ? '#FF5E00' : onChainStruct.tierColor,
    tierLevel: 'ON-CHAIN',
  } : null);

  if (!displayProfile || !displayData) {
    if (isOwnProfile && authenticated && !user?.twitter) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center h-full space-y-6">
          <div className="text-[#71717a] font-mono text-sm uppercase tracking-widest text-center max-w-md px-4">
            Aura OS requires your X (Twitter) identity to calculate your social score.
          </div>
          <button onClick={() => linkTwitter()} className="bg-[#1da1f2]/10 border border-[#1da1f2]/50 text-[#1da1f2] hover:bg-[#1da1f2] hover:text-white font-bold py-4 px-8 cyber-button text-sm uppercase tracking-widest flex items-center justify-center transition-all shadow-[0_0_15px_rgba(29,161,242,0.3)]">
            <Crosshair className="w-5 h-5 mr-3" /> INITIALIZE X IDENTITY
          </button>
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center h-full text-[#71717a] font-mono text-sm uppercase tracking-widest animate-pulse">
        <SparklesIcon className="w-5 h-5 mr-3" /> Awaiting On-Chain Profile...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-hidden bg-[#020202] relative min-h-screen font-mono flex items-center justify-center">
      {/* Abstract Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, ${displayProfile.tierColor} 0%, transparent 70%)`, filter: 'blur(100px)' }}></div>

      <div className="max-w-5xl mx-auto px-6 w-full relative z-10 flex flex-col items-center">
        
        {/* Identity Section */}
        <div className="relative mb-6">
          {/* Outer Halo */}
          <div className="absolute inset-0 rounded-full animate-pulse opacity-40" style={{ boxShadow: `0 0 80px ${displayProfile.tierColor}` }}></div>
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden relative z-10 border border-white/10 bg-[#050505]">
            <img src={displayProfile.avatar_url.replace('_normal', '')} alt="Avatar" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-700 mix-blend-luminosity hover:mix-blend-normal" />
          </div>
          {/* Tier Badge Floating */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/80 border px-6 py-1.5 rounded-full backdrop-blur-xl whitespace-nowrap z-20 shadow-2xl" style={{ borderColor: `${displayProfile.tierColor}40` }}>
            <span className="text-[9px] md:text-[10px] font-mono tracking-[0.4em] uppercase" style={{ color: displayProfile.tierColor, textShadow: `0 0 20px ${displayProfile.tierColor}` }}>
              {displayProfile.tierLevel} // {displayProfile.tierName}
            </span>
          </div>
        </div>

        {/* Name and Handle */}
        <div className="text-center mb-8 space-y-3 w-full px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-[0.15em] uppercase break-words leading-tight" style={{ textShadow: `0 0 40px ${displayProfile.tierColor}60` }}>
            {displayProfile.name}
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-[#a1a1aa] text-xs md:text-sm font-mono tracking-widest">
            <span className="text-white/80">@{displayProfile.screen_name}</span>
            <span className="hidden md:inline text-white/20">|</span>
            <span className="opacity-50 text-[10px] md:text-xs bg-white/5 px-2 py-1 rounded-md border border-white/5">
              {targetAddress?.slice(0, 8)}...{targetAddress?.slice(-6)}
            </span>
            <span className="hidden md:inline text-white/20">|</span>
            <span className="opacity-50 text-[10px] md:text-xs flex items-center"><SparklesIcon className="w-3 h-3 mr-1.5" /> VERIFIED ON-CHAIN</span>
          </div>
        </div>

        {/* Core Stats / The "Surreal" Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4 mb-8">
          <div className="flex flex-col items-center justify-center p-6 md:p-8 border-y border-white/5 bg-gradient-to-b from-transparent to-white/[0.02] hover:bg-white/[0.04] transition-colors duration-500">
            <div className="text-white/40 text-[9px] uppercase tracking-[0.3em] mb-3 flex items-center"><Trophy className="w-3 h-3 mr-2"/> Resonance</div>
            <div className="text-3xl md:text-5xl font-light tracking-tighter" style={{ color: displayProfile.tierColor, textShadow: `0 0 30px ${displayProfile.tierColor}50` }}>
              {displayProfile.auraScore.toLocaleString()}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-6 md:p-8 border-y border-white/5 bg-gradient-to-b from-transparent to-white/[0.02] hover:bg-white/[0.04] transition-colors duration-500">
            <div className="text-white/40 text-[9px] uppercase tracking-[0.3em] mb-3 flex items-center"><Crosshair className="w-3 h-3 mr-2"/> Circulating Cards</div>
            <div className="text-3xl md:text-4xl font-light text-white tracking-tighter">{Number((displayData as any)[1] || 0)}</div>
            <div className="text-white/30 text-[8px] uppercase tracking-widest mt-3 pt-3 border-t border-white/5 w-1/2 text-center">
              {isOwnProfile ? holders.length : '?'} Holders
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-6 md:p-8 border-y border-white/5 bg-gradient-to-b from-transparent to-white/[0.02] hover:bg-white/[0.04] transition-colors duration-500">
            <div className="text-white/40 text-[9px] uppercase tracking-[0.3em] mb-3 flex items-center"><User className="w-3 h-3 mr-2"/> Cards You Own</div>
            <div className="text-3xl md:text-4xl font-light text-[#4ade80] tracking-tighter drop-shadow-[0_0_20px_rgba(74,222,128,0.3)]">
              {Number((displayData as any)[2] || 0)}
            </div>
          </div>
        </div>

        {/* Market Action / Trading Terminal */}
        <div className="w-full max-w-2xl bg-black/40 backdrop-blur-xl border border-white/5 p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] opacity-50 group-hover:opacity-100 transition-opacity duration-1000" style={{ background: `linear-gradient(90deg, transparent, ${displayProfile.tierColor}, transparent)` }}></div>
          <div className="absolute bottom-0 left-0 w-full h-[1px] opacity-10 group-hover:opacity-30 transition-opacity duration-1000" style={{ background: `linear-gradient(90deg, transparent, ${displayProfile.tierColor}, transparent)` }}></div>
          
          <div className="text-center mb-6">
            <div className="text-white/30 text-[9px] font-mono tracking-[0.5em] uppercase mb-2">Market Interface</div>
            <div className="text-white/60 text-[10px] md:text-xs font-mono tracking-widest uppercase">Execute sequences on {isOwnProfile ? 'your' : `${displayProfile.screen_name}'s`} curve</div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button 
              onClick={() => handleBuyKey(targetAddress as string, (displayData as any)[3])} 
              disabled={isTrading || !walletAddress} 
              className="relative flex-1 bg-white/[0.03] hover:bg-[#836EF9]/10 border border-white/10 hover:border-[#836EF9]/50 transition-all duration-500 overflow-hidden py-5 disabled:opacity-30 disabled:cursor-not-allowed group/btn"
            >
              <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at center, rgba(131,110,249,0.2) 0%, transparent 70%)' }}></div>
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-[#836EF9] text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase mb-2 group-hover/btn:text-white transition-colors duration-500">
                  {isTrading ? 'SIGNING...' : (isOwnProfile ? 'BUY OWN CARD' : 'ACQUIRE CARD')}
                </span>
                <span className="text-white/50 font-mono text-[9px] tracking-widest uppercase">
                  {Number(formatUnits((displayData as any)[3] || 0n, 18)).toFixed(5)} MON
                </span>
              </div>
            </button>

            <button 
              onClick={() => handleSellKey(targetAddress as string)} 
              disabled={isTrading || Number((displayData as any)[2]) === 0 || !walletAddress} 
              className="relative flex-1 bg-white/[0.03] hover:bg-red-500/10 border border-white/10 hover:border-red-500/50 transition-all duration-500 overflow-hidden py-5 disabled:opacity-30 disabled:cursor-not-allowed group/btn"
            >
              <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at center, rgba(239,68,68,0.15) 0%, transparent 70%)' }}></div>
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-red-500/80 text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase mb-2 group-hover/btn:text-red-400 transition-colors duration-500">
                  {isTrading ? 'SIGNING...' : (isOwnProfile ? 'SELL OWN CARD' : 'LIQUIDATE CARD')}
                </span>
                <span className="text-white/50 font-mono text-[9px] tracking-widest uppercase">
                  {Number(formatUnits((displayData as any)[4] || 0n, 18)).toFixed(5)} MON
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer / Utilities */}
        <div className="w-full max-w-2xl flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8 mt-12 mb-4 opacity-60 hover:opacity-100 transition-opacity duration-500">
          {isOwnProfile ? (
            <>
              <button onClick={logout} className="text-white/40 hover:text-white transition-colors text-[9px] font-mono tracking-[0.3em] uppercase flex items-center justify-center">
                <Wallet className="w-3 h-3 mr-2" /> Disconnect
              </button>
              <span className="hidden md:inline text-white/10">|</span>
              {authenticated && user?.twitter ? (
                <button onClick={() => { if (user?.twitter?.subject) unlinkTwitter(user.twitter.subject); }} className="text-[#1da1f2]/60 hover:text-[#1da1f2] transition-colors text-[9px] font-mono tracking-[0.3em] uppercase flex items-center justify-center">
                  <User className="w-3 h-3 mr-2" /> X: @{user.twitter.username} <span className="opacity-50 ml-2">(Unlink)</span>
                </button>
              ) : (
                <button onClick={() => linkTwitter()} className="text-white/40 hover:text-[#1da1f2] transition-colors text-[9px] font-mono tracking-[0.3em] uppercase flex items-center justify-center">
                  <Crosshair className="w-3 h-3 mr-2" /> Link X Account
                </button>
              )}
            </>
          ) : (
            <button onClick={() => handleTip(targetAddress as string)} disabled={isTipping} className="text-white/40 hover:text-[#836EF9] transition-colors text-[9px] font-mono tracking-[0.3em] uppercase flex items-center justify-center disabled:opacity-50">
              <Trophy className="w-3 h-3 mr-2" /> {isTipping ? 'Sending...' : 'SEND 0.1 MON TIP'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
