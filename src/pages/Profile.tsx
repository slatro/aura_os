import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Wallet, Crosshair, Sparkles as SparklesIcon, User, Repeat } from 'lucide-react';
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
    <div className="flex-1 overflow-y-auto bg-[#050505] p-6 lg:p-10 font-mono">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Master Profile Card */}
        <div className="bg-[#09090b] border border-[#27272a] cyber-button p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at 0% 0%, ${displayProfile.tierColor}, transparent 50%)` }}></div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
            
            {/* Left Column: Avatar & Identity */}
            <div className="flex flex-col items-center text-center md:items-start md:text-left w-full md:w-1/3 flex-shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 border-4 overflow-hidden rounded-full shadow-2xl mb-5" style={{ borderColor: displayProfile.tierColor, boxShadow: `0 0 40px ${displayProfile.tierColor}40` }}>
                <img src={displayProfile.avatar_url.replace('_normal', '')} alt="Avatar" className="w-full h-full object-cover bg-[#09090b]" />
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-widest uppercase mb-1">{displayProfile.name}</h1>
              <div className="text-[#a1a1aa] text-sm md:text-base mb-4 font-mono">@{displayProfile.screen_name}</div>
              
              <div className="flex flex-col gap-2 w-full max-w-[200px]">
                <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border text-center" style={{ backgroundColor: `${displayProfile.tierColor}15`, color: displayProfile.tierColor, borderColor: `${displayProfile.tierColor}50` }}>
                  {displayProfile.tierLevel} // {displayProfile.tierName}
                </span>
                <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-[#27272a] text-[#71717a] bg-[#18181b] text-center">
                  {targetAddress?.slice(0, 6)}...{targetAddress?.slice(-4)}
                </span>
              </div>
            </div>

            {/* Right Column: Stats & Actions */}
            <div className="flex-1 w-full space-y-5">
              
              {/* Aura & Network Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#050505] border border-[#18181b] p-3 rounded-lg flex flex-col justify-center">
                  <div className="text-[#71717a] text-[10px] uppercase mb-1 flex items-center"><Trophy className="w-3 h-3 mr-1" /> Aura Score</div>
                  <div className="text-white font-bold text-xl md:text-2xl" style={{ color: displayProfile.tierColor }}>{displayProfile.auraScore.toLocaleString()}</div>
                </div>
                <div className="bg-[#050505] border border-[#18181b] p-3 rounded-lg flex flex-col justify-center">
                  <div className="text-[#71717a] text-[10px] uppercase mb-1 flex items-center"><User className="w-3 h-3 mr-1" /> Network Status</div>
                  <div className="text-white font-bold text-sm md:text-base">VERIFIED ON-CHAIN</div>
                </div>
              </div>

              {/* Market Stats */}
              <div className="bg-[#050505] border border-[#18181b] rounded-lg p-4">
                <h2 className="text-[#836EF9] text-[10px] md:text-xs font-bold tracking-widest uppercase mb-3 flex items-center">
                  <Crosshair className="w-3 h-3 mr-2" /> {isOwnProfile ? 'Your Card Market' : `${displayProfile.screen_name}'s Market`}
                </h2>
                <div className="grid grid-cols-3 gap-2 text-center md:text-left">
                  <div>
                    <div className="text-[#71717a] text-[9px] md:text-[10px] uppercase mb-1">Total Supply</div>
                    <div className="text-white text-sm md:text-base font-bold">{Number((displayData as any)[1] || 0)}</div>
                  </div>
                  <div>
                    <div className="text-[#71717a] text-[9px] md:text-[10px] uppercase mb-1">Holders</div>
                    <div className="text-[#836EF9] text-sm md:text-base font-bold">{isOwnProfile ? holders.length : '?'}</div>
                  </div>
                  <div>
                    <div className="text-[#71717a] text-[9px] md:text-[10px] uppercase mb-1">You Own</div>
                    <div className="text-[#4ade80] text-sm md:text-base font-bold">{Number((displayData as any)[2] || 0)}</div>
                  </div>
                </div>
              </div>

              {/* Market Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => handleBuyKey(targetAddress as string, (displayData as any)[3])} 
                  disabled={isTrading || !walletAddress} 
                  className="w-full bg-[#836EF9]/10 border border-[#836EF9]/50 text-[#836EF9] hover:bg-[#836EF9] hover:text-white font-bold py-3 cyber-button text-xs md:text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  <div className="flex flex-col items-center">
                    <span>{isTrading ? 'Signing...' : (isOwnProfile ? 'BUY OWN CARD' : 'BUY CARD')}</span>
                    <span className="text-[9px] font-mono mt-1 opacity-80 text-white">
                      {Number(formatUnits((displayData as any)[3] || 0n, 18)).toFixed(5)} MON
                    </span>
                  </div>
                </button>
                <button 
                  onClick={() => handleSellKey(targetAddress as string)} 
                  disabled={isTrading || Number((displayData as any)[2]) === 0 || !walletAddress} 
                  className="w-full bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-[#050505] font-bold py-3 cyber-button text-xs md:text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  <div className="flex flex-col items-center">
                    <span>{isTrading ? 'Signing...' : (isOwnProfile ? 'SELL OWN CARD' : 'SELL CARD')}</span>
                    <span className="text-[9px] font-mono mt-1 opacity-80 text-white">
                      {Number(formatUnits((displayData as any)[4] || 0n, 18)).toFixed(5)} MON
                    </span>
                  </div>
                </button>
              </div>

              {/* Account Settings / Tip Buttons */}
              <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-[#27272a]">
                {isOwnProfile ? (
                  <>
                    <button onClick={logout} className="flex-1 bg-[#18181b] border border-[#27272a] text-[#71717a] font-bold py-2.5 cyber-button text-xs uppercase tracking-widest flex items-center justify-center group hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 transition-colors relative overflow-hidden">
                      <div className="flex items-center group-hover:opacity-0 transition-opacity"><Wallet className="w-3.5 h-3.5 mr-2" />Disconnect</div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Repeat className="w-3.5 h-3.5 mr-2" />Change Wallet</div>
                    </button>

                    {authenticated && user?.twitter ? (
                      <button onClick={() => { if (user?.twitter?.subject) unlinkTwitter(user.twitter.subject); }} className="flex-1 bg-[#1da1f2]/10 border border-[#1da1f2]/50 text-[#1da1f2] font-bold py-2.5 cyber-button text-xs uppercase tracking-widest flex items-center justify-center group hover:bg-red-500/20 hover:border-red-500 hover:text-red-500 transition-colors relative overflow-hidden">
                        <div className="flex items-center justify-center space-x-1.5 group-hover:opacity-0 transition-opacity w-full"><User className="w-3.5 h-3.5" /><span>@{user.twitter.username}</span></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Repeat className="w-3.5 h-3.5 mr-2" />Unlink X</div>
                      </button>
                    ) : (
                      <button onClick={() => linkTwitter()} className="flex-1 bg-[#18181b] border border-[#27272a] text-[#71717a] hover:text-[#1da1f2] hover:border-[#1da1f2] font-bold py-2.5 cyber-button text-xs uppercase tracking-widest flex items-center justify-center transition-colors">
                        <Crosshair className="w-3.5 h-3.5 mr-2" />Link X Account
                      </button>
                    )}
                  </>
                ) : (
                  <button onClick={() => handleTip(targetAddress as string)} disabled={isTipping} className="w-full bg-[#18181b] border border-[#27272a] text-[#71717a] hover:text-white hover:border-[#52525b] font-bold py-3 cyber-button text-xs uppercase tracking-widest flex items-center justify-center transition-all disabled:opacity-50">
                    <Trophy className="w-4 h-4 mr-2" />{isTipping ? 'Sending...' : 'SEND 0.1 $MON TIP'}
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
