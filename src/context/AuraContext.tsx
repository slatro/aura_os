import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useBalance, usePublicClient, useReadContract, useWatchContractEvent, useDisconnect, useAccount } from 'wagmi';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { formatUnits, parseEther, createPublicClient, http, getAddress, createWalletClient, custom } from 'viem';
import { monadTestnet } from 'viem/chains';
import AuraNetworkABI from '../config/AuraNetworkABI.json';

export const CONTRACT_ADDRESS = '0x78c3a7B0cb1b454Ac329402a372A4E049D3f15fD' as `0x${string}`;

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
  unlinkWallet: (address: string) => void;
  wallets: any[];

  // Wallet
  walletAddress: `0x${string}` | undefined;
  balanceData: any;
  mainnetTxCount: number;
  mainnetBalance: number;

  // Contract
  publicClient: any;
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
  addAlert: (type: string, message: string, color: string) => void;
  addGlobalNotification: (targetAddress: string, type: string, message: string, color: string) => Promise<void>;
  unreadRoomsCount: number;
  clearUnreadRooms: () => void;
  unreadAlertsCount: number;
  clearUnreadAlerts: () => void;

  // Portfolio
  holdings: any[];
  holders: any[];
  isPortfolioLoading: boolean;
  portfolioValue: number;
  fetchPortfolio: () => void;

  // Actions
  handleMintProfile: () => Promise<void>;
  handleUpdateProfile: (tierName: string, tierColor: string, score: number) => Promise<void>;
  handleExecutePost: (text: string) => Promise<void>;
  handleLikePost: (postId: number) => Promise<void>;
  handleBuyKey: (address: string, price: bigint) => Promise<void>;
  handleSellKey: (address: string) => Promise<void>;
  handleTip: (toAddress: string, amount?: string) => Promise<void>;
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
  const { ready, authenticated, user, login, logout: privyLogout, linkTwitter, unlinkTwitter, linkWallet, unlinkWallet } = usePrivy();
  const { wallets } = useWallets();
  const { disconnect } = useDisconnect();
  const { address: wagmiAddress } = useAccount();

  const getWalletClient = async () => {
    const activeWallet = wallets.find(w => w.address.toLowerCase() === walletAddress?.toLowerCase()) || wallets[0];
    if (!activeWallet) {
      throw new Error("No active wallet connected. Please click the pulsing 'Connect Wallet' button in the sidebar first!");
    }
    if (activeWallet.chainId !== `eip155:${monadTestnet.id}`) {
      try {
        await activeWallet.switchChain(monadTestnet.id);
      } catch (err) {
        console.error("Failed to switch chain via Privy wallet:", err);
      }
    }
    const provider = await activeWallet.getEthereumProvider();
    return createWalletClient({
      account: activeWallet.address as `0x${string}`,
      chain: monadTestnet,
      transport: custom(provider)
    });
  };

  const logout = () => {
    try { privyLogout(); } catch (e) { console.error(e); }
    try { disconnect(); } catch (e) { console.error(e); }
  };
  const walletAddress = (wagmiAddress || user?.wallet?.address) as `0x${string}` | undefined;
  const { data: balanceData } = useBalance({ address: walletAddress });

  const [mainnetTxCount, setMainnetTxCount] = useState<number>(0);
  const [mainnetBalance, setMainnetBalance] = useState<number>(0);
  const [hasFetchedMainnet, setHasFetchedMainnet] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      Promise.all([
        mainnetClient.getTransactionCount({ address: walletAddress }),
        mainnetClient.getBalance({ address: walletAddress })
      ]).then(([nonce, bal]) => {
        setMainnetTxCount(nonce);
        setMainnetBalance(Number(formatUnits(bal, 18)));
        setHasFetchedMainnet(true);
      }).catch(err => {
        console.error("Error fetching mainnet data", err);
        setHasFetchedMainnet(true);
      });
    } else {
      setHasFetchedMainnet(false);
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



  const { data: allProfilesData, refetch: refetchRadar } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AuraNetworkABI,
    functionName: 'getAllProfiles',
    chainId: monadTestnet.id,
  });

  // Alerts
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const clearUnreadAlerts = () => setUnreadAlertsCount(0);
  // Track seen event tx hashes to avoid duplicate alerts across historical + real-time
  const seenEventHashes = new Set<string>();

  const addAlert = (type: string, message: string, color: string, dedupKey?: string) => {
    if (dedupKey) {
      if (seenEventHashes.has(dedupKey)) return;
      seenEventHashes.add(dedupKey);
    }
    setAlerts(prev => [{ id: Date.now() + Math.random(), type, message, color, time: new Date() }, ...prev].slice(0, 100));
    if (window.location.pathname !== '/alerts') {
      setUnreadAlertsCount(prev => prev + 1);
    }
  };

  // KVdb Global Storage for Off-chain Alerts
  const KVDB_BUCKET = 'EaBHLmVQufVZNeR2UbgSjr';
  const KVDB_BASE = `https://kvdb.io/${KVDB_BUCKET}`;

  async function kvdbGet(key: string): Promise<any> {
    try {
      const res = await fetch(`${KVDB_BASE}/${key}`);
      if (!res.ok) return null;
      const text = await res.text();
      return JSON.parse(text);
    } catch { return null; }
  }

  async function kvdbSet(key: string, value: any): Promise<void> {
    try {
      await fetch(`${KVDB_BASE}/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      });
    } catch { /* silently fail */ }
  }

  const addGlobalNotification = async (targetAddress: string, type: string, message: string, color: string) => {
    if (!targetAddress) return;
    try {
      const key = `notifications_${targetAddress.toLowerCase()}`;
      const existing = await kvdbGet(key);
      const notifs = Array.isArray(existing) ? existing : [];
      
      const newNotif = {
        id: `notif_${Date.now()}_${Math.random()}`,
        type,
        message,
        timestamp: Math.floor(Date.now() / 1000),
        color,
      };
      
      const updated = [newNotif, ...notifs].slice(0, 50);
      await kvdbSet(key, updated);
    } catch (err) {
      console.error('Failed to send global notification:', err);
    }
  };

  // Poll for global off-chain notifications from KVdb
  useEffect(() => {
    if (!walletAddress) return;
    
    let cancelled = false;
    const loadKVdbNotifications = async () => {
      try {
        const notifs = await kvdbGet(`notifications_${walletAddress.toLowerCase()}`);
        if (cancelled) return;
        if (Array.isArray(notifs)) {
          setAlerts(prev => {
            // Find notifications we haven't seen yet
            const newNotifs = notifs.filter(n => !prev.some(p => p.id === n.id));
            if (newNotifs.length === 0) return prev;
            
            // Map timestamps to Date objects
            const formattedNewNotifs = newNotifs.map(n => ({
              ...n,
              time: new Date(n.timestamp * 1000)
            }));
            
            // Increment unread count if not on alerts page
            if (typeof window !== 'undefined' && window.location.pathname !== '/alerts') {
              setUnreadAlertsCount(c => c + formattedNewNotifs.length);
            }
            
            // Merge and sort
            const merged = [...formattedNewNotifs, ...prev].sort((a, b) => {
              const tA = a.time instanceof Date ? a.time.getTime() : new Date(a.time).getTime();
              const tB = b.time instanceof Date ? b.time.getTime() : new Date(b.time).getTime();
              return tB - tA;
            });
            return merged.slice(0, 100);
          });
        }
      } catch (err) {
        console.error('Failed to load KVdb notifications:', err);
      }
    };
    
    // Load immediately
    loadKVdbNotifications();
    
    // Poll every 10 seconds for instant notification sync!
    const interval = setInterval(loadKVdbNotifications, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [walletAddress]);

  // ── HISTORICAL ALERT LOADER ──────────────────────────────────────────────
  // Runs whenever wallet connects. Fetches recent past events so the user
  // sees notifications for things that happened before they opened the app.
  useEffect(() => {
    if (!walletAddress || !publicClient) return;
    let cancelled = false;

    const loadHistory = async () => {
      try {
        // Get current block then look back ~100k blocks (testnet is fast)
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock > 100000n ? latestBlock - 100000n : 0n;

        // ── 1. Trade events where YOUR card was bought/sold ─────────────
        const tradeLogs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: {
            type: 'event', name: 'Trade',
            inputs: [
              { name: 'trader',      type: 'address', indexed: true },
              { name: 'subject',     type: 'address', indexed: true },
              { name: 'isBuy',       type: 'bool',    indexed: false },
              { name: 'shareAmount', type: 'uint256', indexed: false },
              { name: 'ethAmount',   type: 'uint256', indexed: false },
              { name: 'supply',      type: 'uint256', indexed: false },
            ]
          },
          args: { subject: walletAddress as `0x${string}` },
          fromBlock,
        });

        if (!cancelled) {
          // Sort oldest first so newest end up at top of alerts array
          [...tradeLogs].reverse().forEach((log: any) => {
            const { trader, isBuy, ethAmount } = log.args;
            if (trader?.toLowerCase() === walletAddress.toLowerCase()) return; // own action
            const amt = Number(formatUnits(ethAmount, 18)).toFixed(5);
            const traderProfile = radarProfiles.find(p => p.address?.toLowerCase() === trader?.toLowerCase());
            const traderName = traderProfile?.username ? `@${traderProfile.username}` : `${trader.slice(0,6)}...`;
            const key = log.transactionHash + log.logIndex;
            addAlert('MARKET_TRADE', `${traderName} ${isBuy ? 'BOUGHT' : 'SOLD'} your Card for ${amt} MON`, '#FFD700', key);
          });
        }

        // ── 2. PostLiked events on YOUR posts ───────────────────────────
        // First figure out which post IDs belong to this wallet
        const myPostIds = new Set(
          ((onChainPosts as any[]) || [])
            .filter(p => p.author?.toLowerCase() === walletAddress.toLowerCase())
            .map(p => Number(p.id))
        );

        if (myPostIds.size > 0) {
          const likeLogs = await publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: {
              type: 'event', name: 'PostLiked',
              inputs: [
                { name: 'id',   type: 'uint256', indexed: true },
                { name: 'user', type: 'address', indexed: true },
              ]
            },
            fromBlock,
          });

          if (!cancelled) {
            [...likeLogs].reverse().forEach((log: any) => {
              const { id, user: liker } = log.args;
              if (liker?.toLowerCase() === walletAddress.toLowerCase()) return;
              if (!myPostIds.has(Number(id))) return;
              const likerProfile = radarProfiles.find(p => p.address?.toLowerCase() === liker?.toLowerCase());
              const likerName = likerProfile?.username ? `@${likerProfile.username}` : `${liker.slice(0,6)}...`;
              const key = log.transactionHash + log.logIndex;
              addAlert('RESONANCE', `${likerName} resonated with your signal #${id}!`, '#FF3366', key);
            });
          }
        }

      } catch (err) {
        console.error('Failed to load historical alerts:', err);
      }
    };

    // Small delay so posts/radarProfiles state has time to populate first
    const timer = setTimeout(loadHistory, 2000);
    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  // ── REAL-TIME WATCHERS ───────────────────────────────────────────────────
  useWatchContractEvent({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, eventName: 'ProfileRegistered',
    onLogs(logs) {
      logs.forEach((log: any) => {
        const { user: eventUser, username, score } = log.args;
        if (eventUser && walletAddress && eventUser.toLowerCase() === walletAddress.toLowerCase()) return;
        const key = (log as any).transactionHash + (log as any).logIndex;
        addAlert('NEW_IDENTITY', `@${username} joined the grid (Aura: ${score})`, '#4ade80', key);
      });
    },
  });

  useWatchContractEvent({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, eventName: 'PostCreated',
    onLogs(logs) {
      logs.forEach((log: any) => {
        const { author } = log.args;
        if (author && walletAddress && author.toLowerCase() === walletAddress.toLowerCase()) return;
        const key = (log as any).transactionHash + (log as any).logIndex;
        const authorProfile = radarProfiles.find(p => p.address?.toLowerCase() === author?.toLowerCase());
        const authorName = authorProfile?.username ? `@${authorProfile.username}` : `${author.slice(0,6)}...`;
        addAlert('BROADCAST', `New signal from ${authorName}.`, '#00E5FF', key);
      });
    },
  });

  useWatchContractEvent({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, eventName: 'PostLiked',
    onLogs(logs) {
      logs.forEach((log: any) => {
        const { id, user: liker } = log.args;
        if (liker && walletAddress && liker.toLowerCase() === walletAddress.toLowerCase()) return;
        const post = posts.find(p => p.id === Number(id));
        const isMyPost = post && walletAddress && post.authorAddr?.toLowerCase() === walletAddress.toLowerCase();
        if (isMyPost) {
          const key = (log as any).transactionHash + (log as any).logIndex;
          const likerProfile = radarProfiles.find(p => p.address?.toLowerCase() === liker?.toLowerCase());
          const likerName = likerProfile?.username ? `@${likerProfile.username}` : `${liker.slice(0,6)}...`;
          addAlert('RESONANCE', `${likerName} resonated with your signal #${id}!`, '#FF3366', key);
        }
      });
    },
  });

  useWatchContractEvent({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, eventName: 'Trade',
    onLogs(logs) {
      logs.forEach((log: any) => {
        const { trader, subject, isBuy, ethAmount } = log.args;
        if (trader && walletAddress && trader.toLowerCase() === walletAddress.toLowerCase()) return;
        if (subject && walletAddress && subject.toLowerCase() === walletAddress.toLowerCase()) {
          const key = (log as any).transactionHash + (log as any).logIndex;
          const amt = Number(formatUnits(ethAmount, 18)).toFixed(5);
          const traderProfile = radarProfiles.find(p => p.address?.toLowerCase() === trader?.toLowerCase());
          const traderName = traderProfile?.username ? `@${traderProfile.username}` : `${trader.slice(0,6)}...`;
          addAlert('MARKET_TRADE', `${traderName} ${isBuy ? 'BOUGHT' : 'SOLD'} your Card for ${amt} MON`, '#FFD700', key);
        }
      });
    },
  });

  const [unreadRoomsCount, setUnreadRoomsCount] = useState(0);
  const clearUnreadRooms = () => setUnreadRoomsCount(0);

  useWatchContractEvent({ address: CONTRACT_ADDRESS, abi: AuraNetworkABI, eventName: 'RoomMessage',
    onLogs(logs) {
      logs.forEach((log: any) => {
        const { room, sender } = log.args;
        if (sender && walletAddress && sender.toLowerCase() !== walletAddress.toLowerCase()) {
          const key = (log as any).transactionHash + (log as any).logIndex;
          setUnreadRoomsCount(prev => prev + 1);
          addAlert('ROOM', `New signal in Room ${room.slice(0,6)}...`, '#836EF9', key);
        }
      });
    },
  });

  // Profile state
  const [fullProfile, setFullProfile] = useState<FullProfile | null>(null);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [publicProfile, setPublicProfile] = useState<any>(null);

  // Clear cached profile when wallet changes
  useEffect(() => {
    setFullProfile(null);
    setShowRevealModal(false);
    setIsRevealed(false);
  }, [walletAddress]);

  // Synchronize Wagmi address with Privy session to prevent account/profile mismatches
  useEffect(() => {
    if (ready && authenticated && user && wagmiAddress) {
      const linkedWallets = user.linkedAccounts?.filter((a: any) => a.type === 'wallet') || [];
      const hasActiveWallet = linkedWallets.some(
        (w: any) => w.address.toLowerCase() === wagmiAddress.toLowerCase()
      );
      if (!hasActiveWallet) {
        console.warn("Wagmi address mismatch with Privy session. Logging out to prevent profile mismatch.");
        logout();
      }
    }
  }, [wagmiAddress, authenticated, user, ready]);

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

      const myHoldings: Record<string, { amount: number }> = {};
      const myHolders: Record<string, number> = {};

      // 1. Fetch all registered addresses on-chain to know whose cards exist
      let addresses: string[] = [];
      try {
        const profilesResult = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: AuraNetworkABI,
          functionName: 'getAllProfiles',
        }) as any;
        if (profilesResult && profilesResult[0]) {
          addresses = profilesResult[0] as string[];
        }
      } catch (err) {
        console.error("Failed to fetch all profiles in fetchPortfolio", err);
      }

      // Ensure own address is always checked
      const uniqueAddresses = Array.from(
        new Set([
          walletAddress.toLowerCase(),
          ...addresses.map((a) => a.toLowerCase()),
        ])
      );

      // 2. Query keysBalance for all addresses using a SINGLE multicall call to avoid rate limits
      const contracts = [];
      for (const addr of uniqueAddresses) {
        try {
          const checksummedSubject = getAddress(addr);
          const checksummedWallet = getAddress(walletAddress);

          // Query our balance of their card
          contracts.push({
            address: CONTRACT_ADDRESS,
            abi: AuraNetworkABI as any,
            functionName: 'keysBalance',
            args: [checksummedSubject, checksummedWallet],
          });

          // Query their balance of our card
          contracts.push({
            address: CONTRACT_ADDRESS,
            abi: AuraNetworkABI as any,
            functionName: 'keysBalance',
            args: [checksummedWallet, checksummedSubject],
          });
        } catch (e) {
          console.error("Error creating address checks in fetchPortfolio", e);
        }
      }

      if (contracts.length > 0) {
        const results = await publicClient.multicall({
          contracts: contracts as any,
        });

        for (let i = 0; i < uniqueAddresses.length; i++) {
          const addr = uniqueAddresses[i];
          const balResult = results[i * 2];
          const holderBalResult = results[i * 2 + 1];

          if (balResult && balResult.status === 'success') {
            const amount = Number(balResult.result);
            if (amount > 0) {
              myHoldings[addr] = { amount };
            }
          }

          if (holderBalResult && holderBalResult.status === 'success') {
            const holderAmount = Number(holderBalResult.result);
            if (holderAmount > 0) {
              myHolders[addr] = holderAmount;
            }
          }
        }
      }

      // 3. Batch query getSellPrice for holdings using a SINGLE multicall call
      const holdingsArr = [];
      let totalVal = 0;

      const priceContracts = [];
      const holdingsSubjs = Object.keys(myHoldings);
      for (const subj of holdingsSubjs) {
        try {
          priceContracts.push({
            address: CONTRACT_ADDRESS,
            abi: AuraNetworkABI as any,
            functionName: 'getSellPrice',
            args: [getAddress(subj), 1n],
          });
        } catch (e) {
          console.error("Error creating price check contract", e);
        }
      }

      if (priceContracts.length > 0) {
        const priceResults = await publicClient.multicall({
          contracts: priceContracts as any,
        });

        for (let i = 0; i < holdingsSubjs.length; i++) {
          const subj = holdingsSubjs[i];
          const amount = myHoldings[subj].amount;
          const priceResult = priceResults[i];
          if (priceResult && priceResult.status === 'success') {
            const priceInMon = Number(formatUnits(priceResult.result as bigint, 18));
            totalVal += priceInMon * amount;
            holdingsArr.push({
              address: getAddress(subj),
              amount,
              sellPrice: priceInMon,
            });
          }
        }
      }

      setHoldings(holdingsArr.sort((a, b) => b.sellPrice * b.amount - a.sellPrice * a.amount));
      setPortfolioValue(totalVal);

      const holdersArr = [];
      for (const [holder, amt] of Object.entries(myHolders)) {
        if (amt > 0) {
          try {
            holdersArr.push({ address: getAddress(holder), amount: amt });
          } catch (e) {}
        }
      }
      setHolders(holdersArr.sort((a, b) => b.amount - a.amount));
    } catch (err) {
      console.error("fetchPortfolio error", err);
    } finally {
      setIsPortfolioLoading(false);
    }
  };
  useEffect(() => {
    fetchPortfolio();
  }, [walletAddress, isTrading]);

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
    } else if (user?.twitter && hasFetchedTwitter && hasFetchedMainnet && !showRevealModal && !fullProfile) {
      calculateAndReveal();
    }
  }, [authenticated, user, xFollowers, hasFetchedTwitter, hasFetchedMainnet, mainnetTxCount, onChainProfile, isProfileLoading]);

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



  // Actions
  const handleMintProfile = async () => {
    if (!fullProfile) return;
    try {
      setIsMinting(true);
      const walletClient = await getWalletClient();
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: AuraNetworkABI,
        functionName: 'registerProfile',
        args: [fullProfile.screen_name, fullProfile.tierName, fullProfile.tierColor, BigInt(Math.floor(fullProfile.auraScore))]
      });
      
      setIsMinting(false);
      setIsMining(true);
      
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
      if (receipt?.status === 'reverted') throw new Error("Transaction reverted on-chain (Username may be taken or gas failed).");
      
      addAlert('NEW_IDENTITY', `You joined the grid as @${fullProfile.screen_name} (Aura: ${fullProfile.auraScore})`, '#4ade80');
      
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

  const handleUpdateProfile = async () => {
    if (!fullProfile) return;
    try {
      setIsMinting(true);
      const score = Math.floor(((xFollowers || 0) * 1) + (mainnetBalance * 0.01) + (mainnetTxCount * 5));
      let tierName = 'Initiate', tierColor = '#a1a1aa';
      if (score >= 150000) { tierName = 'Aura God'; tierColor = '#836EF9'; }
      else if (score >= 50000) { tierName = 'Whale'; tierColor = '#00E5FF'; }
      else if (score >= 15000) { tierName = 'Shark'; tierColor = '#FF5E00'; }
      else if (score >= 5000)  { tierName = 'Node'; tierColor = '#FFD700'; }
      else if (score >= 1000)  { tierName = 'Operator'; tierColor = '#4ade80'; }

      const walletClient = await getWalletClient();
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: AuraNetworkABI,
        functionName: 'registerProfile',
        args: [fullProfile.screen_name, tierName, tierColor, BigInt(score)]
      });
      
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
      if (receipt?.status === 'reverted') throw new Error("Transaction reverted on-chain.");
      
      addAlert('NEW_IDENTITY', `Your identity was synced. New Aura: ${score}`, '#4ade80');
      await refetchProfile(); await refetchRadar(); await refetchOwnProfileData();
    } catch (e: any) { 
      console.error(e); 
      alert("Update failed: " + (e.shortMessage || e.message));
    } finally { 
      setIsMinting(false); 
    }
  };

  const handleExecutePost = async (text: string) => {
    const safeContent = sanitizeText(text, 1000);
    if (!safeContent) return;
    const walletClient = await getWalletClient();
    const tx = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: AuraNetworkABI,
      functionName: 'executePost',
      args: [safeContent]
    });
    const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
    if (receipt?.status === 'reverted') throw new Error('Transaction reverted on-chain.');
    await refetchPosts();
  };

  const handleLikePost = async (postId: number) => {
    try {
      setLikingPostId(postId);
      const walletClient = await getWalletClient();
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: AuraNetworkABI,
        functionName: 'likePost',
        args: [postId]
      });
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
      if (receipt?.status === 'reverted') throw new Error("Transaction reverted.");
      await refetchPosts();
    } catch (e) { console.error("Like failed", e); } finally { setLikingPostId(null); }
  };

  const handleBuyKey = async (address: string, price: bigint) => {
    try {
      setIsTrading(true);
      const walletClient = await getWalletClient();
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: AuraNetworkABI,
        functionName: 'buyKey',
        args: [address],
        value: price
      });
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
      if (receipt?.status === 'reverted') throw new Error("Transaction reverted.");
      const amt = Number(formatUnits(price, 18)).toFixed(5);
      

      
      setHoldings(prev => {
        const exists = prev.find(h => h.address.toLowerCase() === address.toLowerCase());
        if (exists) {
          return prev.map(h => h.address.toLowerCase() === address.toLowerCase() ? { ...h, amount: h.amount + 1 } : h);
        } else {
          return [...prev, { address, amount: 1, sellPrice: Number(amt) }];
        }
      });

      await refetchProfileModal();
      await refetchOwnProfileData();
      await fetchPortfolio();
      
      setTimeout(() => { refetchProfileModal(); refetchOwnProfileData(); fetchPortfolio(); }, 1500);
      setTimeout(() => { refetchProfileModal(); refetchOwnProfileData(); fetchPortfolio(); }, 4000);
    } catch (e) { console.error(e); alert("Trade failed"); } finally { setIsTrading(false); }
  };

  const handleSellKey = async (address: string) => {
    try {
      setIsTrading(true);
      const walletClient = await getWalletClient();
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: AuraNetworkABI,
        functionName: 'sellKey',
        args: [address]
      });
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
      if (receipt?.status === 'reverted') throw new Error("Transaction reverted.");
      

      
      setHoldings(prev => {
        return prev.map(h => h.address.toLowerCase() === address.toLowerCase() ? { ...h, amount: h.amount - 1 } : h).filter(h => h.amount > 0);
      });

      await refetchProfileModal();
      await refetchOwnProfileData();
      await fetchPortfolio();
      
      setTimeout(() => { refetchProfileModal(); refetchOwnProfileData(); fetchPortfolio(); }, 1500);
      setTimeout(() => { refetchProfileModal(); refetchOwnProfileData(); fetchPortfolio(); }, 4000);
    } catch (e) { console.error(e); alert("Trade failed"); } finally { setIsTrading(false); }
  };

  const handleTip = async (toAddress: string, amount: string = '1') => {
    if (!toAddress || toAddress.toLowerCase() === walletAddress?.toLowerCase()) return;
    try {
      setIsTipping(true);
      const walletClient = await getWalletClient();
      const tx = await walletClient.sendTransaction({
        to: toAddress as `0x${string}`,
        value: parseEther(amount),
        account: walletClient.account
      });
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
      if (receipt?.status === 'reverted') throw new Error("Transaction reverted.");
      

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
      ready, authenticated, user, login, logout, linkTwitter, unlinkTwitter, linkWallet, unlinkWallet, wallets,
      walletAddress, balanceData, mainnetTxCount, mainnetBalance,
      publicClient,
      onChainProfile, onChainPosts, allProfilesData, refetchProfile, refetchPosts, refetchRadar,
      fullProfile, setFullProfile, showRevealModal, setShowRevealModal, isRevealed,
      showProfileModal, setShowProfileModal, publicProfile, setPublicProfile,
      isMinting, isTrading, isTipping, likingPostId,
      xFollowers, xFollowing,
      alerts, addAlert, addGlobalNotification, unreadRoomsCount, clearUnreadRooms, unreadAlertsCount, clearUnreadAlerts,
      holdings, holders, isPortfolioLoading, portfolioValue, fetchPortfolio,
      handleMintProfile, handleUpdateProfile, handleExecutePost, handleLikePost, handleBuyKey, handleSellKey, handleTip, openPublicProfile,
      posts, radarProfiles, profileModalData, refetchProfileModal, ownProfileData, refetchOwnProfileData,
      isMining
    }}>
      {children}
    </AuraContext.Provider>
  );
}
