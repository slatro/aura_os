import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useBalance, usePublicClient, useWriteContract, useReadContract, useWatchContractEvent, useSendTransaction, useSwitchChain, useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { formatUnits, parseEther, createPublicClient, http } from 'viem';
import { monadTestnet } from 'viem/chains';
import AuraNetworkABI from '../config/AuraNetworkABI.json';

export const CONTRACT_ADDRESS = '0x1b95c26d7e01a215f57ce3f5f5ce512430bc4139' as `0x${string}`;

// =============================================
// SECURITY HELPERS
// =============================================
export function sanitizeText(input: string, maxLen = 1000): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLen);
}

export function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

// =============================================
// MAINNET CONFIG (FOR SCORING)
// =============================================
const monadMainnet = {
  id: 143,
  name: 'Monad Mainnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.monad.xyz'] } },
} as const;

export const mainnetClient = createPublicClient({
  chain: monadMainnet,
  transport: http()
});

// =============================================
// TYPES
// =============================================
export interface FullProfile {
  name: string;
  screen_name: string;
  avatar_url: string;
  followers: number;
  following: number;
  realData: { balance: number; symbol: string; txCount: number };
  auraScore: number;
  tierName: string;
  tierLevel: string;
  tierColor: string;
}

interface AuraContextType {
  // Auth
  ready: boolean;
  authenticated: boolean;
  user: any;
  login: () => void;
  logout: () => void;
  linkTwitter: () => void;
  unlinkTwitter: (subject: string) => void;
  linkWallet: () => void;

  // Wallet
  walletAddress: `0x${string}` | undefined;
  balanceData: any;
  mainnetTxCount: number;
  mainnetBalance: number;

  // Contract
  publicClient: any;
  writeContractAsync: any;
  sendTransactionAsync: any;
  onChainProfile: any;
  onChainPosts: any;
  allProfilesData: any;
  refetchProfile: () => void;
  refetchPosts: () => void;
  refetchRadar: () => void;
  ownProfileData: any;
  refetchOwnProfileData: () => void;

  // Profile State
  fullProfile: FullProfile | null;
  setFullProfile: (p: FullProfile | null) => void;
  showRevealModal: boolean;
  setShowRevealModal: (v: boolean) => void;
  isRevealed: boolean;
  showProfileModal: boolean;
  setShowProfileModal: (v: boolean) => void;
  publicProfile: any;
  setPublicProfile: (p: any) => void;
  isMinting: boolean;
  isTrading: boolean;
  isTipping: boolean;

  // Social
  xFollowers: number;
  xFollowing: number;

  // Alerts
  alerts: any[];

  // Portfolio
  holdings: any[];
  holders: any[];
  isPortfolioLoading: boolean;
  portfolioValue: number;
  fetchPortfolio: () => void;

  // Actions
  handleMintProfile: () => Promise<void>;
  handleExecutePost: (text: string) => Promise<void>;
  handleLikePost: (postId: number) => Promise<void>;
  handleBuyKey: (address: string, price: bigint) => Promise<void>;
  handleSellKey: (address: string) => Promise<void>;
  handleTip: (toAddress: string) => Promise<void>;
  openPublicProfile: (address: string, profileData: any) => void;

  // Derived
  posts: any[];
  radarProfiles: any[];
  profileModalData: any;
  refetchProfileModal: () => void;
  likingPostId: number | null;
  isMining: boolean;
}

const AuraContext = createContext<AuraContextType | null>(null);

export function useAura() {
  const ctx = useContext(AuraContext);
  if (!ctx) throw new Error('useAura must be used inside AuraProvider');
  return ctx;
}

export function AuraProvider({ children }: { children: ReactNode }) {
  const publicClient = usePublicClient({ chainId: monadTestnet.id });
  const { ready, authenticated, user, login, logout, linkTwitter, unlinkTwitter, linkWallet } = usePrivy();
  const walletAddress = user?.wallet?.address as `0x${string}` | undefined;
  const { data: balanceData } = useBalance({ address: walletAddress });

  const [mainnetTxCount, setMainnetTxCount] = useState<number>(0);
  const [mainnetBalance, setMainnetBalance] = useState<number>(0);

  useEffect(() => {
    if (walletAddress) {
      Promise.all([
        mainnetClient.getTransactionCount({ address: walletAddress }),
        mainnetClient.getBalance({ address: walletAddress })
      ]).then(([nonce, bal]) => {
        setMainnetTxCount(nonce);
        setMainnetBalance(Number(formatUnits(bal, 18)));
      }).catch(err => console.error("Error fetching mainnet data", err));
    }
  }, [walletAddress]);

  // Contract hooks
  const { data: onChainProfile, refetch: refetchProfile, isLoading: isProfileLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AuraNetworkABI,
    functionName: 'profiles',
    args: walletAddress ? [walletAddress] : undefined,
    chainId: monadTestnet.id,
    query: { enabled: !!walletAddress }
  });

  const { data: onChainPosts, refetch: refetchPosts } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AuraNetworkABI,
    functionName: 'getRecentPosts',
    chainId: monadTestnet.id,
    args: [50n],
  });

  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const { chain } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();

  const { data: allProfilesData, refetch: refetchRadar } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AuraNetworkABI,
    functionName: 'getAllProfiles',
    chainId: monadTestnet.id,
  });

  // Alerts
  const [alerts, setAlerts] = useState<any[]>([]);
  const addAlert = (type: string, message: string, color: string) => {
    setAlerts(prev => [{ id: Date.now() + Math.random(), type, message, color, time: new Date() }, ...prev].slice(0, 50));
  };

  useWatchContractEvent({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, eventName: 'ProfileRegistered',
    onLogs(logs) { logs.forEach((log: any) => { const { username, score } = log.args; addAlert('NEW_IDENTITY', `@${username} joined the grid (Aura: ${score})`, '#4ade80'); }); },
  });
  useWatchContractEvent({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, eventName: 'PostCreated',
    onLogs(logs) { logs.forEach((log: any) => { const { author } = log.args; addAlert('BROADCAST', `New signal detected from ${author.slice(0,6)}...`, '#00E5FF'); }); },
  });
  useWatchContractEvent({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, eventName: 'PostLiked',
    onLogs(logs) { logs.forEach((log: any) => { const { id, user } = log.args; addAlert('RESONANCE', `Signal #${id} resonated with ${user.slice(0,6)}...`, '#FF3366'); }); },
  });
  useWatchContractEvent({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, eventName: 'Trade',
    onLogs(logs) { logs.forEach((log: any) => { const { trader, subject, isBuy, ethAmount } = log.args; const amt = Number(formatUnits(ethAmount, 18)).toFixed(5); addAlert('MARKET_TRADE', `${trader.slice(0,6)} ${isBuy ? 'BOUGHT' : 'SOLD'} a Card from ${subject.slice(0,6)} for ${amt} MON`, '#FFD700'); }); },
  });

  // Profile state
  const [fullProfile, setFullProfile] = useState<FullProfile | null>(null);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [publicProfile, setPublicProfile] = useState<any>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [isTrading, setIsTrading] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [likingPostId, setLikingPostId] = useState<number | null>(null);
  const [xFollowers, setXFollowers] = useState<number>(0);
  const [xFollowing, setXFollowing] = useState<number>(0);
  const [hasFetchedTwitter, setHasFetchedTwitter] = useState(false);

  // Portfolio state
  const [holdings, setHoldings] = useState<any[]>([]);
  const [holders, setHolders] = useState<any[]>([]);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);

  const fetchPortfolio = async () => {
    if (!walletAddress || !publicClient) return;
    try {
      setIsPortfolioLoading(true);
      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: AuraNetworkABI.find((a: any) => a.name === 'Trade') as any,
        fromBlock: 0n, toBlock: 'latest'
      });
      const myHoldings: Record<string, { amount: number }> = {};
      const myHolders: Record<string, number> = {};
      logs.forEach((log: any) => {
        const { trader, subject, isBuy, shareAmount } = log.args;
        if (!trader || !subject) return;
        const t = trader.toLowerCase(), s = subject.toLowerCase(), me = walletAddress.toLowerCase();
        const amount = Number(shareAmount);
        if (t === me) { if (!myHoldings[s]) myHoldings[s] = { amount: 0 }; isBuy ? (myHoldings[s].amount += amount) : (myHoldings[s].amount -= amount); }
        if (s === me) { if (!myHolders[t]) myHolders[t] = 0; isBuy ? (myHolders[t] += amount) : (myHolders[t] -= amount); }
      });
      const holdingsArr = [];
      let totalVal = 0;
      for (const [subj, data] of Object.entries(myHoldings)) {
        if (data.amount > 0) {
          try {
            const priceData = await publicClient.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: AuraNetworkABI, functionName: 'getSellPrice', args: [subj, 1n] });
            const priceInMon = Number(formatUnits(priceData as bigint, 18));
            totalVal += priceInMon * data.amount;
            holdingsArr.push({ address: subj, amount: data.amount, sellPrice: priceInMon });
          } catch(e) {}
        }
      }
      setHoldings(holdingsArr.sort((a,b) => b.sellPrice * b.amount - a.sellPrice * a.amount));
      setPortfolioValue(totalVal);
      
      const holdersArr = [];
      for (const [holder, amt] of Object.entries(myHolders)) {
        if (amt > 0) holdersArr.push({ address: holder, amount: amt });
      }
      setHolders(holdersArr.sort((a,b) => b.amount - a.amount));
    } catch (err) { console.error(err); } finally { setIsPortfolioLoading(false); }
  };
  useEffect(() => { fetchPortfolio(); }, [walletAddress, isTrading]);

  // Twitter followers
  useEffect(() => {
    if (authenticated && user?.twitter?.username) {
      fetch(`https://api.fxtwitter.com/${user.twitter.username}`)
        .then(r => r.json()).then(data => { if (data.code === 200) { setXFollowers(data.user.followers || 0); setXFollowing(data.user.following || 0); } else setXFollowers(0); setHasFetchedTwitter(true); })
        .catch(() => { setXFollowers(0); setHasFetchedTwitter(true); });
    }
  }, [authenticated, user]);

  // Load on-chain profile or trigger reveal
  useEffect(() => {
    if (!authenticated || !walletAddress) { setFullProfile(null); setXFollowers(0); return; }
    if (isProfileLoading) return;
    const profileData = onChainProfile as any;
    if (profileData && profileData[4] === true) {
      const dbTierName = profileData[1];
      const dbTierColor = dbTierName === 'Shark' ? '#FF5E00' : profileData[2];
      setFullProfile({ name: profileData[0], screen_name: profileData[0], avatar_url: user?.twitter?.profilePictureUrl || `https://unavatar.io/twitter/${profileData[0]}`, followers: xFollowers || 0, following: xFollowing, realData: { balance: mainnetBalance, symbol: 'MON', txCount: mainnetTxCount }, auraScore: Number(profileData[3]), tierName: dbTierName, tierLevel: 'ON-CHAIN', tierColor: dbTierColor });
      setShowRevealModal(false);
    } else if (user?.twitter && hasFetchedTwitter && !showRevealModal && !fullProfile) {
      calculateAndReveal();
    }
  }, [authenticated, user, xFollowers, hasFetchedTwitter, mainnetTxCount, onChainProfile, isProfileLoading]);

  const calculateAndReveal = () => {
    const score = Math.floor(((xFollowers || 0) * 1) + (mainnetBalance * 0.01) + (mainnetTxCount * 5));
    let tierName = 'Initiate', tierLevel = 'T5', tierColor = '#a1a1aa';
    if (score >= 150000) { tierName = 'Aura God'; tierLevel = 'T0'; tierColor = '#836EF9'; }
    else if (score >= 50000) { tierName = 'Whale'; tierLevel = 'T1'; tierColor = '#00E5FF'; }
    else if (score >= 15000) { tierName = 'Shark'; tierLevel = 'T2'; tierColor = '#FF5E00'; }
    else if (score >= 5000)  { tierName = 'Node'; tierLevel = 'T3'; tierColor = '#FFD700'; }
    else if (score >= 1000)  { tierName = 'Operator'; tierLevel = 'T4'; tierColor = '#4ade80'; }
    setFullProfile({ name: user?.twitter?.name || user?.twitter?.username || 'Unknown', screen_name: user?.twitter?.username || 'Unknown', avatar_url: user?.twitter?.profilePictureUrl || '', followers: xFollowers || 0, following: xFollowing, realData: { balance: mainnetBalance, symbol: 'MON', txCount: mainnetTxCount }, auraScore: score, tierName, tierLevel, tierColor });
    setShowRevealModal(true); setIsRevealed(false);
    setTimeout(() => setIsRevealed(true), 3000);
  };

  // Manual minting is now required
  const ensureMonadNetwork = async () => {
    if (chain?.id !== monadTestnet.id && switchChainAsync) {
      await switchChainAsync({ chainId: monadTestnet.id });
    }
  };

  // Actions
  const handleMintProfile = async () => {
    if (!fullProfile) return;
    try {
      setIsMinting(true);
      await ensureMonadNetwork();
      const tx = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, functionName: 'registerProfile', chainId: monadTestnet.id, args: [fullProfile.screen_name, fullProfile.tierName, fullProfile.tierColor, BigInt(Math.floor(fullProfile.auraScore))] });
      
      setIsMinting(false);
      setIsMining(true);
      
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
      if (receipt?.status === 'reverted') throw new Error("Transaction reverted on-chain (Username may be taken or gas failed).");
      
      await refetchProfile(); await refetchRadar(); await refetchOwnProfileData();
      setShowRevealModal(false); setShowProfileModal(true);
    } catch (e: any) { 
      console.error(e); 
      alert("Mint failed: " + (e.shortMessage || e.message));
    } finally { 
      setIsMinting(false); 
      setIsMining(false);
    }
  };

  const handleExecutePost = async (text: string) => {
    const safeContent = sanitizeText(text, 1000);
    if (!safeContent) return;
    try {
      await ensureMonadNetwork();
      const tx = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, functionName: 'executePost', chainId: monadTestnet.id, args: [safeContent] });
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
      if (receipt?.status === 'reverted') throw new Error("Transaction reverted.");
      await refetchPosts();
    } catch (e) { console.error(e); alert("Post execution failed."); }
  };

  const handleLikePost = async (postId: number) => {
    try {
      setLikingPostId(postId);
      await ensureMonadNetwork();
      const tx = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, functionName: 'likePost', chainId: monadTestnet.id, args: [postId] });
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
      if (receipt?.status === 'reverted') throw new Error("Transaction reverted.");
      await refetchPosts();
    } catch (e) { console.error("Like failed", e); } finally { setLikingPostId(null); }
  };

  const handleBuyKey = async (address: string, price: bigint) => {
    try {
      setIsTrading(true);
      await ensureMonadNetwork();
      const tx = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, functionName: 'buyKey', chainId: monadTestnet.id, args: [address], value: price });
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
      if (receipt?.status === 'reverted') throw new Error("Transaction reverted.");
      await refetchProfileModal();
    } catch (e) { console.error(e); alert("Trade failed"); } finally { setIsTrading(false); }
  };

  const handleSellKey = async (address: string) => {
    try {
      setIsTrading(true);
      await ensureMonadNetwork();
      const tx = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, functionName: 'sellKey', chainId: monadTestnet.id, args: [address] });
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
      if (receipt?.status === 'reverted') throw new Error("Transaction reverted.");
      await refetchProfileModal();
    } catch (e) { console.error(e); alert("Trade failed"); } finally { setIsTrading(false); }
  };

  const handleTip = async (toAddress: string) => {
    if (!toAddress || toAddress.toLowerCase() === walletAddress?.toLowerCase()) return;
    try {
      setIsTipping(true);
      await ensureMonadNetwork();
      const tx = await sendTransactionAsync({
        to: toAddress as `0x${string}`, value: parseEther('0.1') });
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
      if (receipt?.status === 'reverted') throw new Error("Transaction reverted.");
      alert("Tip successful!");
    } catch (e) { console.error("Tip failed", e); } finally { setIsTipping(false); }
  };

  const openPublicProfile = (address: string, profileData: any) => {
    setPublicProfile({ address, ...profileData });
  };

  // Profile modal data
  const { data: profileModalData, refetch: refetchProfileModal } = useReadContract({
    address: CONTRACT_ADDRESS, abi: AuraNetworkABI, functionName: 'getProfileData',
    args: publicProfile ? [publicProfile.address, walletAddress || '0x0000000000000000000000000000000000000000'] : undefined,
    query: { enabled: !!publicProfile && !!walletAddress },
  });

  const { data: ownProfileData, refetch: refetchOwnProfileData } = useReadContract({
    address: CONTRACT_ADDRESS, abi: AuraNetworkABI, functionName: 'getProfileData',
    args: walletAddress ? [walletAddress, walletAddress] : undefined,
    query: { enabled: !!walletAddress },
  });

  // Derived data
  const posts = ((onChainPosts as any[]) || []).filter(p => p.content).map(p => ({ id: Number(p.id), authorAddr: p.author, content: p.content, timestamp: Number(p.timestamp), likes: Number(p.likes) }));

  let radarProfiles: any[] = [];
  if (allProfilesData && (allProfilesData as any[])[0] && (allProfilesData as any[])[1]) {
    const addresses = (allProfilesData as any[])[0];
    const profilesList = (allProfilesData as any[])[1];
    radarProfiles = addresses.map((addr: string, idx: number) => {
      const dbTierName = profilesList[idx].tierName;
      return { address: addr, username: profilesList[idx].username, tierName: dbTierName, tierColor: dbTierName === 'Shark' ? '#FF5E00' : profilesList[idx].tierColor, auraScore: Number(profilesList[idx].auraScore) };
    }).sort((a: any, b: any) => b.auraScore - a.auraScore);
  }

  return (
    <AuraContext.Provider value={{
      ready, authenticated, user, login, logout, linkTwitter, unlinkTwitter, linkWallet,
      walletAddress, balanceData, mainnetTxCount, mainnetBalance,
      publicClient, writeContractAsync, sendTransactionAsync,
      onChainProfile, onChainPosts, allProfilesData, refetchProfile, refetchPosts, refetchRadar,
      fullProfile, setFullProfile, showRevealModal, setShowRevealModal, isRevealed,
      showProfileModal, setShowProfileModal, publicProfile, setPublicProfile,
      isMinting, isTrading, isTipping, likingPostId,
      xFollowers, xFollowing,
      alerts,
      holdings, holders, isPortfolioLoading, portfolioValue, fetchPortfolio,
      handleMintProfile, handleExecutePost, handleLikePost, handleBuyKey, handleSellKey, handleTip, openPublicProfile,
      posts, radarProfiles, profileModalData, refetchProfileModal, ownProfileData, refetchOwnProfileData,
      isMining
    }}>
      {children}
    </AuraContext.Provider>
  );
}
