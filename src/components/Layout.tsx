import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import { Terminal, MessageSquare, Repeat, Wallet, Bell, Crosshair, Trophy, PenTool, Sparkles as SparklesIcon } from 'lucide-react';
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
function SideNavLink({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  const location = useLocation();
  const active = location.pathname === to || (to === '/stream' && location.pathname === '/');
  return (
    <div className={`flex items-center space-x-4 p-3 hover:bg-[#09090b] w-fit cursor-pointer transition-all group ml-2 rounded-lg ${active ? 'text-white' : 'text-[#a1a1aa] hover:text-[#e2e8f0]'}`}>
      <div className={`${active ? 'text-[#836EF9]' : 'group-hover:text-[#836EF9] transition-colors'}`}>{icon}</div>
      <span className={`text-[13px] tracking-widest uppercase ${active ? 'font-bold' : 'font-semibold'}`}>{label}</span>
    </div>
  );
}

// =============================================
// SIDEBAR
// =============================================
export function Sidebar() {
  const navigate = useNavigate();
  const { authenticated, user, walletAddress, login, logout, linkTwitter, unlinkTwitter, linkWallet, fullProfile, showRevealModal, onChainProfile } = useAura();

  const renderConnectionButtons = () => (
    <div className="space-y-3">
      {walletAddress ? (
        <button onClick={logout} className="w-full bg-[#18181b] border border-[#27272a] text-[#71717a] font-bold py-2.5 cyber-button text-xs uppercase tracking-widest flex items-center justify-center group hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 transition-colors relative overflow-hidden">
          <div className="flex items-center group-hover:opacity-0 transition-opacity"><Wallet className="w-4 h-4 mr-2" />{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Repeat className="w-4 h-4 mr-2" />Change_Wallet</div>
        </button>
      ) : (
        <button onClick={authenticated ? linkWallet : login} className="w-full bg-[#836EF9]/10 border border-[#836EF9]/50 text-[#836EF9] hover:bg-[#836EF9] hover:text-white font-bold py-2.5 cyber-button text-xs uppercase tracking-widest transition-all flex items-center justify-center shadow-[0_0_10px_rgba(131,110,249,0.2)]">
          <Wallet className="w-4 h-4 mr-2" />Link_Wallet
        </button>
      )}
      {authenticated && user?.twitter ? (
        <button onClick={() => { if (user?.twitter?.subject) unlinkTwitter(user.twitter.subject); }} className="w-full bg-[#1da1f2]/20 border border-[#1da1f2] text-white font-bold py-2.5 cyber-button text-xs uppercase tracking-widest flex items-center justify-center group hover:bg-red-500/20 hover:border-red-500 hover:text-red-500 transition-colors relative overflow-hidden">
          <div className="flex items-center group-hover:opacity-0 transition-opacity"><img src={user.twitter.profilePictureUrl || ''} alt="Avatar" className="w-5 h-5 rounded-full mr-2 border border-[#1da1f2]" /><span className="truncate max-w-[150px]">@{user.twitter.username}</span></div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Repeat className="w-4 h-4 mr-2" />Change_X_Account</div>
        </button>
      ) : (
        <button onClick={() => linkTwitter()} disabled={!walletAddress} className="w-full bg-[#18181b] border border-[#27272a] text-[#71717a] hover:text-[#1da1f2] hover:border-[#1da1f2] font-bold py-2.5 cyber-button text-xs uppercase tracking-widest flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Crosshair className="w-4 h-4 mr-2" />Link_X_Account
        </button>
      )}
    </div>
  );

  return (
    <div className="w-[280px] h-screen sticky top-0 flex flex-col py-4 pr-6">
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

        <div className="space-y-2 flex-1 mt-6">
          <NavLink to="/stream"><SideNavLink icon={<Terminal className="w-5 h-5" />} label="STREAM" to="/stream" /></NavLink>
          <NavLink to="/radar"><SideNavLink icon={<Crosshair className="w-5 h-5" />} label="RADAR" to="/radar" /></NavLink>
          <NavLink to="/alerts"><SideNavLink icon={<Bell className="w-5 h-5" />} label="ALERTS" to="/alerts" /></NavLink>
          <NavLink to="/portfolio"><SideNavLink icon={<Wallet className="w-5 h-5" />} label="PORTFOLIO" to="/portfolio" /></NavLink>
          <NavLink to="/rooms"><SideNavLink icon={<MessageSquare className="w-5 h-5" />} label="ROOMS" to="/rooms" /></NavLink>
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
      </div>

      <div className="mt-auto mb-8 ml-2">
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
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border" style={{ backgroundColor: `${fullProfile.tierColor}15`, color: fullProfile.tierColor, borderColor: `${fullProfile.tierColor}50` }}>{fullProfile.tierLevel}</span>
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
          renderConnectionButtons()
        )}
      </div>
    </div>
  );
}

// =============================================
// RIGHT SIDEBAR
// =============================================
export function RightSidebar() {
  const { publicProfile, setPublicProfile, profileModalData, handleBuyKey, handleSellKey, handleTip, walletAddress, isTrading, isTipping, fullProfile } = useAura();

  return (
    <div className="w-[320px] pl-6 py-4 h-screen sticky top-0 flex flex-col space-y-6">
      <div className="bg-[#09090b] border border-[#27272a] flex items-center p-2 cyber-button focus-within:border-[#836EF9]/50">
        <Crosshair className="w-4 h-4 text-[#71717a] ml-2 mr-3" />
        <input type="text" placeholder="SEARCH_AURA" className="bg-transparent focus:outline-none text-[13px] w-full text-white placeholder-[#52525b] font-mono tracking-wide" />
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
          <h2 className="text-[11px] font-bold text-[#836EF9] tracking-[0.15em] uppercase flex items-center font-mono mb-2"><Trophy className="w-3.5 h-3.5 mr-2" /> Your_Stats</h2>
          <div className="flex justify-between text-xs font-mono"><span className="text-[#71717a]">Aura Score</span><span className="text-white font-bold">{fullProfile.auraScore.toLocaleString()}</span></div>
          <div className="flex justify-between text-xs font-mono"><span className="text-[#71717a]">Tier</span><span style={{ color: fullProfile.tierColor }}>{fullProfile.tierName}</span></div>
          <div className="flex justify-between text-xs font-mono"><span className="text-[#71717a]">MON Balance</span><span className="text-white">{fullProfile.realData.balance.toFixed(4)}</span></div>
          <div className="flex justify-between text-xs font-mono"><span className="text-[#71717a]">Mainnet Txs</span><span className="text-white">{fullProfile.realData.txCount.toLocaleString()}</span></div>
          <div className="flex justify-between text-xs font-mono"><span className="text-[#71717a]">X Followers</span><span className="text-white">{fullProfile.followers.toLocaleString()}</span></div>
        </div>
      )}

      {/* Public Profile Modal */}
      {publicProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setPublicProfile(null)}>
          <div className="w-full max-w-[480px] bg-[#050505] border border-white/10 shadow-xl cyber-card p-6" onClick={e => e.stopPropagation()}>
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
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={() => handleBuyKey(publicProfile.address, (profileModalData as any)[3])} disabled={isTrading} className="bg-[#836EF9]/10 border border-[#836EF9]/50 text-[#836EF9] hover:bg-[#836EF9] hover:text-white font-bold py-2.5 cyber-button text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                    <div className="flex flex-col items-center"><span>{isTrading ? 'Signing...' : 'BUY CARD'}</span><span className="text-[10px] font-mono mt-1 opacity-80">{Number(formatUnits((profileModalData as any)[3] || 0n, 18)).toFixed(5)} MON</span></div>
                  </button>
                  <button onClick={() => handleSellKey(publicProfile.address)} disabled={isTrading || Number((profileModalData as any)[2]) === 0} className="flex-1 bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-[#050505] font-bold py-2.5 cyber-button text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                    <div className="flex flex-col items-center"><span>{isTrading ? 'Signing...' : 'SELL CARD'}</span><span className="text-[10px] font-mono mt-1 opacity-80">{Number(formatUnits((profileModalData as any)[4] || 0n, 18)).toFixed(5)} MON</span></div>
                  </button>
                </div>
                {walletAddress && publicProfile.address?.toLowerCase() !== walletAddress.toLowerCase() && (
                  <button onClick={() => handleTip(publicProfile.address)} disabled={isTipping} className="w-full bg-[#18181b] border border-[#27272a] text-[#71717a] hover:text-white hover:border-[#52525b] font-bold py-2.5 cyber-button text-xs uppercase tracking-widest flex items-center justify-center transition-all disabled:opacity-50">
                    <Trophy className="w-4 h-4 mr-2" />{isTipping ? 'Sending...' : 'SEND 0.1 $MON TIP'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// REVEAL MODAL
// =============================================
export function RevealModal() {
  const { showRevealModal, setShowRevealModal, fullProfile, isRevealed, isMinting, handleMintProfile } = useAura();
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
            disabled={isMinting}
            className="text-[#836EF9] hover:bg-[#836EF9] hover:text-[#050505] font-bold font-mono text-xs uppercase tracking-widest border border-[#836EF9]/50 bg-[#836EF9]/10 py-3 px-8 cyber-button transition-all disabled:opacity-50"
          >
            {isMinting ? 'AWAITING WALLET SIGNATURE...' : 'EXECUTE_SEQUENCE (MINT)'}
          </button>
        </div>
      </div>
    </div>
  );
}
