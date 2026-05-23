import { useEffect } from 'react';
import { Wallet, User } from 'lucide-react';
import { useAura } from '../context/AuraContext';

function getInitials(address: string): string {
  return address ? address.slice(2, 4).toUpperCase() : '??';
}

function getAvatarColor(address: string): string {
  const colors = ['#836EF9', '#00E5FF', '#FF3366', '#FFD700', '#4ade80', '#FF5E00'];
  const idx = parseInt(address?.slice(2, 4) || '00', 16) % colors.length;
  return colors[idx];
}

export default function Portfolio() {
  const {
    walletAddress,
    holdings,
    holders,
    isPortfolioLoading,
    portfolioValue,
    fetchPortfolio,
  } = useAura();

  useEffect(() => {
    if (walletAddress) {
      fetchPortfolio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#18181b] bg-[#050505]/90 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-[#836EF9]" />
          <span className="font-mono text-sm font-bold tracking-widest uppercase text-[#836EF9]">
            Portfolio
          </span>
          <span className="ml-auto font-mono text-xs text-[#52525b] tracking-wider">
            {walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : 'NOT CONNECTED'}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Portfolio Value Hero */}
        <div className="border border-[#836EF9]/30 bg-[#836EF908] rounded-lg p-6 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background:
                'radial-gradient(ellipse at center, #836EF9 0%, transparent 70%)',
            }}
          />
          <div className="relative">
            <p className="font-mono text-xs text-[#52525b] tracking-widest uppercase mb-2">
              Total Portfolio Value
            </p>
            {isPortfolioLoading ? (
              <div className="flex items-center justify-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-[#836EF9] border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-sm text-[#52525b]">Calculating...</span>
              </div>
            ) : (
              <p className="font-mono text-4xl font-bold text-[#836EF9]">
                {portfolioValue.toFixed(5)}
                <span className="text-lg text-[#836EF9]/60 ml-2">MON</span>
              </p>
            )}
            <p className="font-mono text-xs text-[#3f3f46] tracking-wider mt-2">
              {holdings.length} holdings · {holders.length} holders
            </p>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Your Holdings */}
          <div className="border border-[#18181b] bg-[#09090b] rounded-lg overflow-hidden">
            <div className="border-b border-[#18181b] px-4 py-3 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#836EF9]" />
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-[#836EF9]">
                Your Holdings
              </span>
              <span className="ml-auto font-mono text-xs text-[#52525b]">
                {holdings.length}
              </span>
            </div>

            <div className="divide-y divide-[#18181b]">
              {isPortfolioLoading ? (
                <div className="flex items-center justify-center py-10">
                  <span className="inline-block w-5 h-5 border-2 border-[#836EF9] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : holdings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Wallet className="w-8 h-8 text-[#27272a]" />
                  <p className="font-mono text-xs text-[#3f3f46] tracking-wider">
                    No cards held
                  </p>
                </div>
              ) : (
                holdings.map((h) => {
                  const color = getAvatarColor(h.address);
                  return (
                    <div
                      key={h.address}
                      className="px-4 py-3 flex items-center gap-3 hover:bg-[#18181b]/50 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
                        style={{
                          backgroundColor: `${color}22`,
                          border: `1px solid ${color}55`,
                          color,
                        }}
                      >
                        {getInitials(h.address)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs text-[#e4e4e7] truncate">
                          {h.address.slice(0, 6)}...{h.address.slice(-4)}
                        </div>
                        <div className="font-mono text-xs text-[#52525b] tracking-wider">
                          {h.amount} {h.amount === 1 ? 'card' : 'cards'}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono text-xs text-[#4ade80]">
                          {h.sellPrice.toFixed(5)}
                        </div>
                        <div className="font-mono text-xs text-[#3f3f46]">MON/card</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Your Holders */}
          <div className="border border-[#18181b] bg-[#09090b] rounded-lg overflow-hidden">
            <div className="border-b border-[#18181b] px-4 py-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#00E5FF]" />
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-[#00E5FF]">
                Your Holders
              </span>
              <span className="ml-auto font-mono text-xs text-[#52525b]">
                {holders.length}
              </span>
            </div>

            <div className="divide-y divide-[#18181b]">
              {isPortfolioLoading ? (
                <div className="flex items-center justify-center py-10">
                  <span className="inline-block w-5 h-5 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : holders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <User className="w-8 h-8 text-[#27272a]" />
                  <p className="font-mono text-xs text-[#3f3f46] tracking-wider">
                    No holders yet
                  </p>
                </div>
              ) : (
                holders.map((h) => {
                  const color = getAvatarColor(h.address);
                  return (
                    <div
                      key={h.address}
                      className="px-4 py-3 flex items-center gap-3 hover:bg-[#18181b]/50 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
                        style={{
                          backgroundColor: `${color}22`,
                          border: `1px solid ${color}55`,
                          color,
                        }}
                      >
                        {getInitials(h.address)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs text-[#e4e4e7] truncate">
                          {h.address.slice(0, 6)}...{h.address.slice(-4)}
                        </div>
                        <div className="font-mono text-xs text-[#52525b] tracking-wider">
                          holds {h.amount} {h.amount === 1 ? 'card' : 'cards'}
                        </div>
                      </div>
                      <div
                        className="font-mono text-sm font-bold flex-shrink-0"
                        style={{ color: '#00E5FF' }}
                      >
                        ×{h.amount}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <div className="flex justify-center">
          <button
            onClick={fetchPortfolio}
            disabled={isPortfolioLoading || !walletAddress}
            className="cyber-button px-6 py-2 text-xs font-mono tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPortfolioLoading ? (
              <>
                <span className="inline-block w-3 h-3 border border-[#836EF9] border-t-transparent rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Wallet className="w-3 h-3" />
                Refresh Portfolio
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
