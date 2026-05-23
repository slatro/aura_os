import { Trophy } from 'lucide-react';
import { useAura } from '../context/AuraContext';

function getInitials(address: string): string {
  return address ? address.slice(2, 4).toUpperCase() : '??';
}

const RANK_STYLES: Record<number, { border: string; bg: string; label: string; glow: string }> = {
  1: { border: '#FFD700', bg: '#FFD70011', label: '#FFD700', glow: '#FFD70033' },
  2: { border: '#C0C0C0', bg: '#C0C0C011', label: '#C0C0C0', glow: '#C0C0C022' },
  3: { border: '#CD7F32', bg: '#CD7F3211', label: '#CD7F32', glow: '#CD7F3222' },
};

export default function Radar() {
  const { radarProfiles, walletAddress, fullProfile, openPublicProfile } = useAura();

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#18181b] bg-[#050505]/90 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-[#836EF9]" />
          <span className="font-mono text-sm font-bold tracking-widest uppercase text-[#836EF9]">
            Aura Radar
          </span>
          <span className="ml-auto font-mono text-xs text-[#52525b] tracking-wider">
            {radarProfiles.length} identities
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-2">
        {radarProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="font-mono text-2xl text-[#27272a] animate-pulse">◈</div>
            <p className="font-mono text-sm text-[#3f3f46] tracking-wider">
              Scanning Grid...
            </p>
          </div>
        ) : (
          radarProfiles.map((profile, index) => {
            const rank = index + 1;
            const rankStyle = RANK_STYLES[rank];
            const isMe =
              walletAddress &&
              profile.address?.toLowerCase() === walletAddress.toLowerCase();
            const avatarColor = profile.tierColor || '#836EF9';

            return (
              <button
                key={profile.address}
                onClick={() => openPublicProfile(profile.address, profile)}
                className="w-full text-left border rounded-lg p-4 transition-all hover:scale-[1.01] active:scale-[0.99] group"
                style={{
                  borderColor: rankStyle
                    ? rankStyle.border
                    : isMe
                    ? '#836EF944'
                    : '#18181b',
                  backgroundColor: rankStyle
                    ? rankStyle.bg
                    : isMe
                    ? '#836EF908'
                    : '#09090b',
                  boxShadow: rankStyle
                    ? `0 0 20px ${rankStyle.glow}`
                    : 'none',
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div
                    className="w-8 text-center font-mono text-sm font-bold flex-shrink-0"
                    style={{
                      color: rankStyle ? rankStyle.label : '#52525b',
                    }}
                  >
                    #{rank}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-mono font-bold flex-shrink-0 overflow-hidden"
                    style={{
                      backgroundColor: `${avatarColor}22`,
                      border: `1.5px solid ${avatarColor}55`,
                      color: avatarColor,
                    }}
                  >
                    {isMe && fullProfile?.avatar_url ? (
                      <img
                        src={fullProfile.avatar_url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(profile.address)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-[#e4e4e7] group-hover:text-[#836EF9] transition-colors truncate">
                        @{profile.username || profile.address.slice(0, 8)}
                      </span>
                      {isMe && (
                        <span className="font-mono text-xs text-[#836EF9] tracking-wider">
                          [YOU]
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-[#52525b] tracking-wider mt-0.5">
                      {profile.address.slice(0, 6)}...{profile.address.slice(-4)}
                    </div>
                  </div>

                  {/* Tier + Score */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span
                      className="font-mono text-xs px-2 py-0.5 rounded border tracking-widest uppercase"
                      style={{
                        color: profile.tierColor,
                        borderColor: `${profile.tierColor}44`,
                        backgroundColor: `${profile.tierColor}11`,
                      }}
                    >
                      {profile.tierName}
                    </span>
                    <span
                      className="font-mono text-sm font-bold"
                      style={{ color: profile.tierColor }}
                    >
                      {profile.auraScore.toLocaleString()}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
