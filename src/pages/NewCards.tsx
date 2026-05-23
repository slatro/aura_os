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
  const { publicClient, openPublicProfile } = useAura();
  const [newCards, setNewCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!publicClient) return;

    const fetchNewCards = async () => {
      setIsLoading(true);
      try {
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock > 50000n ? latestBlock - 50000n : 0n;

        const eventAbi = (AuraNetworkABI as any[]).find(
          (a) => a.type === 'event' && a.name === 'ProfileRegistered'
        );

        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS as `0x${string}`,
          event: eventAbi,
          fromBlock,
          toBlock: 'latest',
        });

        // Fetch buy prices for each profile
        const cardsWithPrices = await Promise.all(
          logs.map(async (log: any) => {
            const { user, username, score } = log.args;
            let buyPrice = 0n;
            try {
              buyPrice = (await publicClient.readContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: AuraNetworkABI,
                functionName: 'getBuyPrice',
                args: [user, 1n],
              })) as bigint;
            } catch {
              // ignore price fetch errors
            }
            return {
              address: user,
              username: username || '',
              score: Number(score),
              blockNumber: Number(log.blockNumber),
              buyPrice,
            };
          })
        );

        // Sort by block number descending (newest first)
        cardsWithPrices.sort((a, b) => b.blockNumber - a.blockNumber);
        setNewCards(cardsWithPrices);
      } catch (err) {
        console.error('Error fetching new cards:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewCards();
  }, [publicClient]);

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
                key={`${card.address}-${card.blockNumber}`}
                className="border rounded-lg p-4 transition-all hover:scale-[1.01] group relative overflow-hidden"
                style={{
                  borderColor: isNewest ? `${color}66` : '#18181b',
                  backgroundColor: isNewest ? `${color}08` : '#09090b',
                  boxShadow: isNewest ? `0 0 24px ${color}22` : 'none',
                }}
              >
                {/* Newest badge */}
                {isNewest && (
                  <div
                    className="absolute top-0 right-0 font-mono text-xs px-3 py-1 rounded-bl-lg tracking-widest uppercase font-bold"
                    style={{
                      backgroundColor: `${color}22`,
                      color,
                      borderLeft: `1px solid ${color}44`,
                      borderBottom: `1px solid ${color}44`,
                    }}
                  >
                    ◆ NEWEST
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-mono font-bold flex-shrink-0"
                    style={{
                      backgroundColor: `${color}22`,
                      border: `1.5px solid ${color}66`,
                      color,
                    }}
                  >
                    {getInitials(card.address)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-[#e4e4e7] group-hover:text-[#836EF9] transition-colors">
                        {card.username ? `@${card.username}` : 'Unknown'}
                      </span>
                      <span
                        className="font-mono text-xs px-1.5 py-0.5 rounded border tracking-wider"
                        style={{
                          color,
                          borderColor: `${color}44`,
                          backgroundColor: `${color}11`,
                        }}
                      >
                        AURA {card.score.toLocaleString()}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-[#52525b] tracking-wider mt-0.5">
                      {card.address.slice(0, 6)}...{card.address.slice(-4)}
                    </div>
                    <div className="font-mono text-xs text-[#3f3f46] tracking-wider mt-0.5">
                      Block #{card.blockNumber.toLocaleString()}
                    </div>
                  </div>

                  {/* Price + Snipe */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-[#4ade80]">
                        {priceFormatted}
                      </div>
                      <div className="font-mono text-xs text-[#3f3f46]">MON</div>
                    </div>
                    <button
                      onClick={() => openPublicProfile(card.address, card)}
                      className="font-mono text-xs px-3 py-1.5 rounded border tracking-widest uppercase font-bold transition-all hover:scale-105 active:scale-95"
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
