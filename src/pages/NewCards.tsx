import { useState, useEffect } from 'react';
import { Sparkles as SparklesIcon } from 'lucide-react';
import { formatUnits } from 'viem';
import { useAura, CONTRACT_ADDRESS } from '../context/AuraContext';
import AuraNetworkABI from '../config/AuraNetworkABI.json';

function getAvatarColor(address: string): string {
  const colors = ['#836EF9', '#00E5FF', '#FF3366', '#FFD700', '#4ade80', '#FF5E00', '#a78bfa', '#34d399'];
  const idx = parseInt(address?.slice(2, 4) || '00', 16) % colors.length;
  return colors[idx];
}

function getInitials(address: string): string {
  return address ? address.slice(2, 4).toUpperCase() : '??';
}

export default function NewCards() {
  const { publicClient, openPublicProfile, radarProfiles } = useAura();
  const [newCards, setNewCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!publicClient || !radarProfiles || radarProfiles.length === 0) return;

    const fetchNewCards = async () => {
      setIsLoading(true);
      try {
        // Since registeredAddresses in the contract is append-only, the newest are at the end.
        const newestProfiles = [...radarProfiles].reverse().slice(0, 50);

        // Fetch buy prices for each profile
        const cardsWithPrices = await Promise.all(
          newestProfiles.map(async (profile: any) => {
            let buyPrice = 0n;
            try {
              buyPrice = (await publicClient.readContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: AuraNetworkABI,
                functionName: 'getBuyPrice',
                args: [profile.address, 1n],
              })) as bigint;
            } catch {
              // ignore price fetch errors
            }
            return {
              address: profile.address,
              username: profile.username || '',
              score: Number(profile.score || profile.auraScore || 0),
              buyPrice,
            };
          })
        );

        setNewCards(cardsWithPrices);
      } catch (err) {
        console.error('Error fetching new cards:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewCards();
  }, [publicClient, radarProfiles]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#18181b] bg-[#050505]/90 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-5 h-5 text-[#836EF9]" />
          <span className="font-mono text-sm font-bold tracking-widest uppercase text-[#836EF9]">
            Sniper Mode
          </span>
          <span className="ml-2 font-mono text-xs text-[#52525b] tracking-wider">
            New Card Listings
          </span>
          {isLoading && (
            <span className="ml-2 inline-block w-3 h-3 border border-[#836EF9] border-t-transparent rounded-full animate-spin" />
          )}
          <span className="ml-auto font-mono text-xs text-[#52525b] tracking-wider">
            {newCards.length} cards found
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-2">
        {isLoading && newCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <SparklesIcon className="w-10 h-10 text-[#27272a] animate-pulse" />
            <p className="font-mono text-sm text-[#3f3f46] tracking-wider animate-pulse">
              Scanning last 50,000 blocks...
            </p>
          </div>
        ) : newCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <SparklesIcon className="w-10 h-10 text-[#27272a]" />
            <p className="font-mono text-sm text-[#3f3f46] tracking-wider">
              No new cards found in range
            </p>
          </div>
        ) : (
          newCards.map((card, index) => {
            const color = getAvatarColor(card.address);
            const isNewest = index === 0;
            const priceFormatted = Number(formatUnits(card.buyPrice, 18)).toFixed(5);

            return (
              <div
                key={`${card.address}`}
                className="border rounded-lg p-3 transition-all hover:scale-[1.01] group relative overflow-hidden"
                style={{
                  borderColor: '#18181b',
                  backgroundColor: '#09090b',
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-mono font-bold flex-shrink-0 overflow-hidden"
                    style={{
                      backgroundColor: `${color}22`,
                      border: `1.5px solid ${color}66`,
                      color,
                    }}
                  >
                    {card.username && card.username !== 'Unknown' ? (
                      <img 
                        src={`https://unavatar.io/twitter/${card.username}`} 
                        alt={card.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerText = getInitials(card.address);
                        }}
                      />
                    ) : (
                      getInitials(card.address)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-[#e4e4e7] group-hover:text-[#836EF9] transition-colors">
                        {card.username ? `@${card.username}` : 'Unknown'}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-[#52525b] tracking-wider mt-0.5">
                      {card.address.slice(0, 6)}...{card.address.slice(-4)}
                    </div>
                    <div className="font-mono text-[11px] text-[#3f3f46] tracking-wider mt-0.5">
                      {isNewest ? 'Latest Arrival' : 'Recently Joined'}
                    </div>
                  </div>

                  {/* Right Side: Price, Aura, Snipe */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0 w-[140px]">
                    <div className="flex items-center justify-end gap-2 w-full">
                      <span
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded border tracking-wider"
                        style={{
                          color,
                          borderColor: `${color}44`,
                          backgroundColor: `${color}11`,
                        }}
                      >
                        AURA {card.score.toLocaleString()}
                      </span>
                      <div className="text-right flex items-baseline gap-1">
                        <div className="font-mono text-sm font-bold text-[#4ade80]">
                          {priceFormatted}
                        </div>
                        <div className="font-mono text-[10px] text-[#3f3f46]">MON</div>
                      </div>
                    </div>
                    <button
                      onClick={() => openPublicProfile(card.address, card)}
                      className="font-mono text-[10px] px-3 py-1 rounded border tracking-widest uppercase font-bold transition-all hover:scale-105 active:scale-95 w-full"
                      style={{
                        color,
                        borderColor: `${color}66`,
                        backgroundColor: `${color}11`,
                      }}
                    >
                      SNIPE
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
