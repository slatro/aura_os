import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import { Terminal, MessageSquare, Repeat, Wallet, Bell, Crosshair, Trophy, PenTool, Sparkles as SparklesIcon, RefreshCw } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAura } from '../context/AuraContext';
import { formatUnits } from 'viem';

// =============================================
// 3D REVEAL COMPONENT
// =============================================
function GlowingMonad({ color, isRevealed }: { color: string; isRevealed: boolean }) {
  const groupRef = useRef<any>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (isRevealed ? 2.5 : 0.5);
      groupRef.current.rotation.x += delta * 0.2;
    }
  });
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <group ref={groupRef}>
        <mesh>
          <icosahedronGeometry args={[1.2, 0]} />
          <meshStandardMaterial color={isRevealed ? color : '#836EF9'} emissive={isRevealed ? color : '#836EF9'} emissiveIntensity={isRevealed ? 0.5 : 0.1} transparent opacity={0.6} roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.201, 0]} />
          <meshBasicMaterial color={isRevealed ? '#ffffff' : color} wireframe transparent opacity={isRevealed ? 0.6 : 0.3} />
        </mesh>
      </group>
      <Sparkles count={150} scale={4} size={isRevealed ? 4 : 2} speed={isRevealed ? 1 : 0.4} color={isRevealed ? color : '#836EF9'} />
    </Float>
  );
}

// =============================================
// NAVLINK COMPONENT
// =============================================
function SideNavLink({ icon, label, to, badge }: { icon: React.ReactNode; label: string; to: string; badge?: boolean }) {
  const location = useLocation();
  const active = location.pathname === to || (to === '/stream' && location.pathname === '/');
  return (
    <div className={`flex items-center space-x-4 p-3 hover:bg-[#09090b] w-fit cursor-pointer transition-all group ml-2 rounded-lg relative ${active ? 'text-white' : 'text-[#a1a1aa] hover:text-[#e2e8f0]'}`}>
      <div className={`${active ? 'text-[#836EF9]' : 'group-hover:text-[#836EF9] transition-colors'}`}>{icon}</div>
      <span className={`text-[13px] tracking-widest uppercase ${active ? 'font-bold' : 'font-semibold'}`}>{label}</span>
      {badge && (
        <span className="absolute -right-2 top-2 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
      )}
    </div>
  );
}

// =============================================
// SIDEBAR
// =============================================
export function Sidebar() {
  const navigate = useNavigate();
  const { authenticated, user, walletAddress, login, logout, linkTwitter, unlinkTwitter, linkWallet, unlinkWallet, wallets, fullProfile, showRevealModal, onChainProfile, unreadRoomsCount, unreadAlertsCount } = useAura();

  const isWalletConnectedInSession = wallets.length > 0;

  const handleWalletClick = () => {
    if (walletAddress && isWalletConnectedInSession) {
      if (user?.twitter) {
        unlinkWallet(walletAddress);
      } else {
        logout();
      }
    } else {
      if (authenticated) {
        linkWallet();
      } else {
        login();
      }
    }
  };

  const renderWalletButton = () => {
    if (walletAddress && isWalletConnectedInSession) {
      return (
        <button onClick={handleWalletClick} className="w-full bg-transparent text-[#71717a] hover:text-red-500 font-mono text-xs uppercase tracking-widest py-3 relative group transition-colors cursor-pointer overflow-hidden flex items-center justify-center">
          {/* Bottom gradient border */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#27272a] to-transparent group-hover:via-red-500 transition-all duration-500"></div>
          
          <div className="flex items-center group-hover:opacity-0 transition-opacity duration-300">
            <Wallet className="w-4 h-4 mr-2" />{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Repeat className="w-4 h-4 mr-2" />{user?.twitter ? 'Disconnect' : 'Change_Wallet'}
          </div>
        </button>
      );
    } else if (walletAddress && !isWalletConnectedInSession) {
      return (
        <button onClick={handleWalletClick} className="w-full bg-transparent text-[#4ade80] hover:text-white font-mono text-xs uppercase tracking-widest py-3 relative group transition-colors cursor-pointer overflow-hidden flex items-center justify-center animate-pulse">
          {/* Bottom gradient border */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#4ade80]/40 to-transparent group-hover:via-[#4ade80] transition-all duration-500"></div>
          
          <Wallet className="w-4 h-4 mr-2 text-[#4ade80]" />
          Connect Wallet ({walletAddress.slice(0, 6)}...)
        </button>
      );
    } else {
      return (
        <button onClick={handleWalletClick} className="w-full bg-transparent text-[#836EF9] hover:text-white font-mono text-xs uppercase tracking-widest py-3 relative group transition-colors cursor-pointer overflow-hidden flex items-center justify-center">
          {/* Bottom gradient border */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#836EF9]/30 to-transparent group-hover:via-[#836EF9] transition-all duration-500"></div>
          
          <Wallet className="w-4 h-4 mr-2" />
          Link_Wallet
        </button>
      );
    }
  };

  const renderTwitterButton = () => {
    if (authenticated && user?.twitter) {
      return (
        <button onClick={() => { if (walletAddress && user?.twitter?.subject) { unlinkTwitter(user.twitter.subject); } else { logout(); } }} className="w-full bg-transparent text-white hover:text-red-500 font-mono text-xs uppercase tracking-widest py-3 relative group transition-colors cursor-pointer overflow-hidden flex items-center justify-center">
          {/* Bottom gradient border */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#1da1f2]/30 to-transparent group-hover:via-red-500 transition-all duration-500"></div>
          
          <div className="flex items-center group-hover:opacity-0 transition-opacity duration-300">
            <img src={user.twitter.profilePictureUrl || ''} alt="Avatar" className="w-4 h-4 rounded-full mr-2 border border-[#1da1f2]" />
            <span className="truncate max-w-[150px]">@{user.twitter.username}</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Repeat className="w-4 h-4 mr-2" />{walletAddress ? 'Change_X_Account' : 'Logout_X_Account'}
          </div>
        </button>
      );
    } else {
      return (
        <button onClick={() => authenticated ? linkTwitter() : login()} className="w-full bg-transparent text-[#71717a] hover:text-[#1da1f2] font-mono text-xs uppercase tracking-widest py-3 relative group transition-colors cursor-pointer overflow-hidden flex items-center justify-center">
          {/* Bottom gradient border */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#27272a] to-transparent group-hover:via-[#1da1f2] transition-all duration-500"></div>
          
          <Crosshair className="w-4 h-4 mr-2" />
          Link_X_Account
        </button>
      );
    }
  };

  return (
    <>
      <div className="w-[280px] flex-shrink-0" />
      <div className="w-[280px] h-screen fixed top-0 left-[calc(50%-600px)] flex flex-col py-4 pr-6 z-50">
        <div className="space-y-1">
          <div className="flex items-center space-x-3 mb-8 ml-2">
            <div className="w-10 h-10 overflow-hidden flex-shrink-0">
              <img src="/logo.svg" alt="AURA_OS Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold tracking-widest uppercase text-sm">AURA_OS</span>
              <span className="text-[#836EF9] text-[10px] tracking-widest font-mono">V.3.0_TESTNET</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 flex-1 mt-6">
          <NavLink to="/stream"><SideNavLink icon={<Terminal className="w-5 h-5" />} label="STREAM" to="/stream" /></NavLink>
          <NavLink to="/radar"><SideNavLink icon={<Crosshair className="w-5 h-5" />} label="RADAR" to="/radar" /></NavLink>
          <NavLink to="/alerts"><SideNavLink icon={<Bell className="w-5 h-5" />} label="ALERTS" to="/alerts" badge={unreadAlertsCount > 0} /></NavLink>
          <NavLink to="/portfolio"><SideNavLink icon={<Wallet className="w-5 h-5" />} label="PORTFOLIO" to="/portfolio" /></NavLink>
          <NavLink to="/rooms"><SideNavLink icon={<MessageSquare className="w-5 h-5" />} label="ROOMS" to="/rooms" badge={unreadRoomsCount > 0} /></NavLink>
          <NavLink to="/new-cards"><SideNavLink icon={<SparklesIcon className="w-5 h-5" />} label="NEW CARDS" to="/new-cards" /></NavLink>

          <button
            onClick={() => navigate('/stream')}
            disabled={!fullProfile || ((onChainProfile as any)?.[4] !== true)}
            className="w-full mt-6 bg-transparent text-[#836EF9] hover:text-white font-mono uppercase tracking-[0.3em] text-[10px] py-3 relative group disabled:opacity-30 disabled:cursor-not-allowed flex justify-center items-center transition-colors"
          >
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#836EF9]/60 to-transparent group-hover:via-[#836EF9] transition-all duration-500"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#836EF9]/30 to-transparent group-hover:via-[#836EF9]/80 transition-all duration-500"></div>
            <PenTool className="w-3.5 h-3.5 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(131,110,249,0.5)]">Execute_Sequence</span>
          </button>
        </div>

        <div className="mt-auto mb-4 ml-2 space-y-3">
          {renderWalletButton()}
          {fullProfile && !showRevealModal ? (
            <div onClick={() => navigate('/profile')} className="bg-[#09090b] border border-[#27272a] hover:border-[#52525b] cyber-button p-3 flex items-center justify-between cursor-pointer group transition-all relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, transparent, ${fullProfile.tierColor})` }}></div>
              <div className="flex items-center space-x-3 relative z-10">
                <div className="w-10 h-10 border-2 overflow-hidden rounded-full shadow-lg bg-[#09090b]" style={{ borderColor: fullProfile.tierColor }}>
                  <img src={fullProfile.avatar_url.replace('_normal', '')} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[13px] text-white truncate max-w-[100px]">{fullProfile.name}</span>
                    {fullProfile.tierLevel !== 'ON-CHAIN' && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border" style={{ backgroundColor: `${fullProfile.tierColor}15`, color: fullProfile.tierColor, borderColor: `${fullProfile.tierColor}50` }}>{fullProfile.tierLevel}</span>
                    )}
                  </div>
                  <span className="text-[#a1a1aa] text-[11px] font-mono">@{fullProfile.screen_name}</span>
                </div>
              </div>
            </div>
          ) : walletAddress && authenticated && !showRevealModal && !fullProfile ? (
            <div onClick={() => navigate('/profile')} className="text-center p-4 border border-dashed border-[#836EF9]/50 bg-[#836EF9]/5 hover:bg-[#836EF9]/10 cyber-button cursor-pointer transition-all">
              <span className="text-[#836EF9] font-mono text-xs animate-pulse font-bold tracking-widest">INITIALIZE PROFILE</span>
            </div>
          ) : (
            renderTwitterButton()
          )}
        </div>
      </div>
    </>
  );
}

// =============================================
// RIGHT SIDEBAR
// =============================================
export function RightSidebar() {
  const { fullProfile, radarProfiles, handleUpdateProfile, isMinting } = useAura();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const cleanSearchQuery = searchQuery.trim().replace('@', '').toLowerCase();
  const searchResults = cleanSearchQuery ? radarProfiles.filter(p => 
    p.username?.toLowerCase().includes(cleanSearchQuery) || 
    p.address?.toLowerCase().includes(cleanSearchQuery)
  ).slice(0, 5) : [];

  return (
    <div className="w-[320px] pl-6 py-4 h-screen sticky top-0 flex flex-col space-y-6">
      <div className="relative">
        <div className="bg-[#09090b] border border-[#27272a] flex items-center p-2 cyber-button focus-within:border-[#836EF9]/50">
          <Crosshair className="w-4 h-4 text-[#71717a] ml-2 mr-3" />
          <input 
            type="text" 
            placeholder="SEARCH_AURA" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent focus:outline-none text-[13px] w-full text-white placeholder-[#52525b] font-mono tracking-wide" 
          />
        </div>
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 bg-[#09090b] border border-[#27272a] cyber-card z-50 shadow-2xl flex flex-col overflow-hidden">
            {searchResults.map((p) => (
              <button 
                key={p.address}
                onClick={() => {
                  setSearchQuery('');
                  navigate(`/profile/${p.address}`);
                }}
                className="flex items-center space-x-3 p-3 hover:bg-[#18181b] border-b border-[#18181b] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full border flex-shrink-0 flex items-center justify-center font-mono text-[9px] font-bold" style={{ borderColor: p.tierColor, backgroundColor: `${p.tierColor}20`, color: p.tierColor }}>
                  {p.username ? (
                    <img src={`https://unavatar.io/twitter/${p.username}`} className="w-full h-full rounded-full object-cover" alt="" />
                  ) : p.address.slice(2,4).toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <div className="font-mono text-xs font-bold text-white truncate">@{p.username || p.address.slice(0,8)}</div>
                  <div className="font-mono text-[9px] truncate" style={{ color: p.tierColor }}>{p.tierName}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#09090b] border border-[#18181b] cyber-button min-h-[150px] flex flex-col">
        <div className="px-4 py-3 border-b border-[#18181b]">
          <h2 className="text-[11px] font-bold text-[#836EF9] tracking-[0.15em] uppercase flex items-center font-mono">
            <Crosshair className="w-3.5 h-3.5 mr-2" /> Tier_Thresholds
          </h2>
        </div>
        <div className="p-4 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center"><span className="text-[#836EF9]">T0 // AURA GOD</span><span className="text-[#71717a]">150K+</span></div>
          <div className="flex justify-between items-center"><span className="text-[#00E5FF]">T1 // WHALE</span><span className="text-[#71717a]">50K+</span></div>
          <div className="flex justify-between items-center"><span className="text-[#FF5E00]">T2 // SHARK</span><span className="text-[#71717a]">15K+</span></div>
          <div className="flex justify-between items-center"><span className="text-[#FFD700]">T3 // NODE</span><span className="text-[#71717a]">5K+</span></div>
          <div className="flex justify-between items-center"><span className="text-[#4ade80]">T4 // OPERATOR</span><span className="text-[#71717a]">1K+</span></div>
          <div className="flex justify-between items-center"><span className="text-[#a1a1aa]">T5 // INITIATE</span><span className="text-[#71717a]">&lt;1K</span></div>
          <div className="mt-3 pt-3 border-t border-[#18181b] text-[#52525b] text-[10px] leading-relaxed">
            <div>1 tx = 5 pts</div><div>1 MON = 0.01 pts</div><div>1 X follower = 1 pt</div>
          </div>
        </div>
      </div>

      {fullProfile && (
        <div className="bg-[#09090b] border border-[#18181b] cyber-button p-4 flex flex-col space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-bold text-[#836EF9] tracking-[0.15em] uppercase flex items-center font-mono"><Trophy className="w-3.5 h-3.5 mr-2" /> Your_Stats</h2>
            {fullProfile.tierLevel === 'ON-CHAIN' && (
              <button 
                onClick={() => handleUpdateProfile(fullProfile.tierName, fullProfile.tierColor, fullProfile.auraScore)} 
                disabled={isMinting} 
                title="Sync live stats to blockchain"
                className="flex items-center gap-1.5 text-[9px] font-mono text-[#836EF9] hover:text-white transition-colors border border-[#836EF9]/30 hover:border-[#836EF9] px-2 py-1 bg-[#836EF9]/10 disabled:opacity-50"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isMinting ? 'animate-spin' : ''}`} />
                SYNC
              </button>
            )}
          </div>
          <div className="flex justify-between text-xs font-mono"><span className="text-[#71717a]">Aura Score</span><span className="text-white font-bold">{fullProfile.auraScore.toLocaleString()}</span></div>
          <div className="flex justify-between text-xs font-mono"><span className="text-[#71717a]">Tier</span><span style={{ color: fullProfile.tierColor }}>{fullProfile.tierName}</span></div>
          <div className="flex justify-between text-xs font-mono"><span className="text-[#71717a]">MON Balance</span><span className="text-white">{fullProfile.realData.balance.toFixed(4)}</span></div>
          <div className="flex justify-between text-xs font-mono"><span className="text-[#71717a]">Mainnet Txs</span><span className="text-white">{fullProfile.realData.txCount.toLocaleString()}</span></div>
          <div className="flex justify-between text-xs font-mono"><span className="text-[#71717a]">X Followers</span><span className="text-white">{fullProfile.followers.toLocaleString()}</span></div>
        </div>
      )}
    </div>
  );
}

// =============================================
// PUBLIC PROFILE MODAL
// =============================================
export function PublicProfileModal() {
  const { publicProfile, setPublicProfile, profileModalData, handleBuyKey, handleSellKey, handleTip, walletAddress, isTrading, isTipping } = useAura();
  const [tipAmount, setTipAmount] = useState('1');

  if (!publicProfile) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 backdrop-blur-md p-4 animate-fade-in" onClick={() => setPublicProfile(null)}>
      <div className="w-full max-w-[480px] bg-[#0a0a14]/60 backdrop-blur-2xl border border-white/10 shadow-2xl cyber-card p-6 relative overflow-hidden transition-all duration-500" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">{publicProfile.username ? `@${publicProfile.username}` : publicProfile.address?.slice(0,10)}</h3>
          <button onClick={() => setPublicProfile(null)} className="text-[#71717a] hover:text-white">✕</button>
        </div>
        <div className="text-[10px] font-mono text-[#71717a] mb-4">{publicProfile.address}</div>
        {profileModalData && (
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-mono"><span className="text-[#71717a]">Aura Score</span><span className="text-white">{Number((profileModalData as any)[0]?.auraScore || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-xs font-mono"><span className="text-[#71717a]">Cards Supply</span><span className="text-white">{Number((profileModalData as any)[1] || 0)}</span></div>
            <div className="flex justify-between text-xs font-mono"><span className="text-[#71717a]">You Own</span><span className="text-white">{Number((profileModalData as any)[2] || 0)} cards</span></div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button 
                onClick={() => handleBuyKey(publicProfile.address, (profileModalData as any)[3])} 
                disabled={isTrading} 
                className="relative bg-white/[0.02] border border-white/[0.05] border-t-[#4ade80]/30 rounded-2xl hover:bg-[#4ade80]/[0.05] hover:border-t-[#4ade80] transition-all duration-500 overflow-hidden py-3 disabled:opacity-30 disabled:cursor-not-allowed group/btn hover:shadow-[0_0_30px_rgba(74,222,128,0.15)]"
              >
                <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at center, rgba(74,222,128,0.1) 0%, transparent 70%)' }}></div>
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-[#4ade80] text-[10px] font-bold tracking-[0.3em] uppercase mb-1 transition-colors duration-500 group-hover/btn:drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">
                    {isTrading ? 'SIGNING...' : 'BUY CARD'}
                  </span>
                  <span className="text-[#4ade80]/70 font-mono text-[9px] tracking-widest uppercase font-bold group-hover/btn:text-[#4ade80] transition-colors duration-500">
                    {Number(formatUnits((profileModalData as any)[3] || 0n, 18)).toFixed(5)} MON
                  </span>
                </div>
              </button>

              <button 
                onClick={() => handleSellKey(publicProfile.address)} 
                disabled={isTrading || Number((profileModalData as any)[2]) === 0} 
                className="relative bg-white/[0.02] border border-white/[0.05] border-t-red-500/30 rounded-2xl hover:bg-red-500/[0.05] hover:border-t-red-500 transition-all duration-500 overflow-hidden py-3 disabled:opacity-30 disabled:cursor-not-allowed group/btn hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]"
              >
                <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at center, rgba(239,68,68,0.1) 0%, transparent 70%)' }}></div>
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-red-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-1 transition-colors duration-500 group-hover/btn:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                    {isTrading ? 'SIGNING...' : 'SELL CARD'}
                  </span>
                  <span className="text-red-500/70 font-mono text-[9px] tracking-widest uppercase font-bold group-hover/btn:text-red-500 transition-colors duration-500">
                    {Number(formatUnits((profileModalData as any)[4] || 0n, 18)).toFixed(5)} MON
                  </span>
                </div>
              </button>
            </div>
            {walletAddress && publicProfile.address?.toLowerCase() !== walletAddress.toLowerCase() && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 mt-4 pb-2 px-1 bg-transparent relative overflow-hidden group/input">
                  <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-wider">Tip Amount:</span>
                  <input 
                    type="number" 
                    min="0.0001" 
                    step="0.1"
                    placeholder="0.00"
                    value={tipAmount} 
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="bg-transparent focus:outline-none text-xs w-full text-white text-right font-mono pr-2 placeholder-white/20" 
                  />
                  <span className="text-[10px] font-mono text-[#836EF9] font-bold pr-2">MON</span>
                  {/* Cyberpunk gradient underline */}
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-focus-within/input:via-[#836EF9] transition-all duration-500"></div>
                </div>

                <button
                  onClick={() => handleTip(publicProfile.address, tipAmount)}
                  disabled={isTipping || !tipAmount || parseFloat(tipAmount) <= 0}
                  className="w-full bg-transparent text-[#836EF9] hover:text-white font-mono uppercase tracking-widest text-xs py-3 relative group/tip disabled:opacity-50 flex items-center justify-center transition-colors overflow-hidden"
                >
                  {/* Top gradient border */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#836EF9]/40 to-transparent group-hover/tip:via-[#836EF9] transition-all duration-500"></div>
                  
                  {/* Bottom gradient border */}
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#836EF9]/20 to-transparent group-hover/tip:via-[#836EF9]/80 transition-all duration-500"></div>

                  <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2 text-[#836EF9] group-hover/tip:text-white drop-shadow-[0_0_5px_rgba(131,110,249,0.5)] group-hover/tip:animate-pulse transition-all duration-300">
                    <rect x="3" y="3" width="18" height="18" rx="4" transform="rotate(45 12 12)" fill="currentColor" stroke="none" />
                    <rect x="8" y="8" width="8" height="8" rx="2" transform="rotate(45 12 12)" fill="#0a0a14" stroke="none" className="group-hover/tip:fill-[#050505] transition-all duration-300" />
                  </svg>
                  
                  <span className="opacity-80 group-hover/tip:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(131,110,249,0.5)]">
                    {isTipping ? 'Sending...' : `SEND ${tipAmount || '0'} $MON TIP`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// REVEAL MODAL
// =============================================
export function RevealModal() {
  const { showRevealModal, setShowRevealModal, fullProfile, isRevealed, isMinting, isMining, handleMintProfile } = useAura();
  if (!showRevealModal) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md">
      <button onClick={() => setShowRevealModal(false)} className="absolute top-8 right-8 text-[#52525b] hover:text-white transition-colors z-[70]">✕</button>
      <div className="w-full h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
        <div className="text-center animate-pulse mb-4 h-[60px] flex-shrink-0">
          <div className="text-[#836EF9] font-mono text-sm tracking-[0.3em] uppercase mb-2">Analyzing Live Network...</div>
          <div className="text-[#a1a1aa] text-xs font-mono">Extracting REAL On-Chain Balances</div>
        </div>
        <div className="w-[200px] h-[200px] md:w-[300px] md:h-[300px] flex-shrink-0">
          <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={2} />
            <GlowingMonad color={fullProfile?.tierColor || '#836EF9'} isRevealed={isRevealed} />
          </Canvas>
        </div>
        <div className={`text-center mt-6 transition-opacity duration-700 ${isRevealed && fullProfile ? 'opacity-100' : 'opacity-0'} flex flex-col items-center`}>
          <div className="text-white text-3xl md:text-4xl font-bold uppercase tracking-[0.2em] mb-2" style={{ textShadow: `0 0 30px ${fullProfile?.tierColor}` }}>{fullProfile?.tierName}</div>
          <div className="text-lg md:text-xl font-mono mb-6" style={{ color: fullProfile?.tierColor }}>Aura: {fullProfile?.auraScore?.toLocaleString()}</div>
          <button 
            onClick={handleMintProfile}
            disabled={isMinting || isMining}
            className="text-[#836EF9] disabled:hover:text-[#836EF9] disabled:hover:bg-[#836EF9]/10 hover:bg-[#836EF9] hover:text-[#050505] font-bold font-mono text-xs uppercase tracking-widest border border-[#836EF9]/50 bg-[#836EF9]/10 py-3 px-8 cyber-button transition-all disabled:opacity-50"
          >
            {isMinting ? 'AWAITING WALLET SIGNATURE...' : isMining ? 'MINTING...' : 'EXECUTE_SEQUENCE (MINT)'}
          </button>
        </div>
      </div>
    </div>
  );
}
