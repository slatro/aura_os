import { useState, useRef } from 'react';
import { Terminal, MessageSquare, Repeat, Zap } from 'lucide-react';
import { useAura } from '../context/AuraContext';

function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getInitials(address: string): string {
  return address ? address.slice(2, 4).toUpperCase() : '??';
}

function getAvatarColor(address: string): string {
  const colors = ['#836EF9', '#00E5FF', '#FF3366', '#FFD700', '#4ade80', '#FF5E00'];
  const idx = parseInt(address?.slice(2, 4) || '00', 16) % colors.length;
  return colors[idx];
}

export default function Stream() {
  const {
    posts,
    walletAddress,
    fullProfile,
    onChainProfile,
    handleExecutePost,
    handleLikePost,
    likingPostId,
    openPublicProfile,
    radarProfiles,
  } = useAura();

  const [composeText, setComposeText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isRegistered = (onChainProfile as any)?.[4] === true;

  const handlePost = async () => {
    if (!composeText.trim() || isPosting || !isRegistered) return;
    setIsPosting(true);
    try {
      await handleExecutePost(composeText.trim());
      setComposeText('');
    } finally {
      setIsPosting(false);
    }
  };

  const getProfileForAddress = (address: string) => {
    return radarProfiles.find((p) => p.address?.toLowerCase() === address?.toLowerCase());
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#18181b] bg-[#050505]/90 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-[#836EF9]" />
          <span className="font-mono text-sm font-bold tracking-widest uppercase text-[#836EF9]">
            Signal Stream
          </span>
          <span className="ml-auto font-mono text-xs text-[#52525b] tracking-wider">
            {posts.length} signals
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Compose Area */}
        <div className="border border-[#18181b] bg-[#09090b] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
              style={{
                backgroundColor: fullProfile?.tierColor
                  ? `${fullProfile.tierColor}22`
                  : '#836EF922',
                border: `1px solid ${fullProfile?.tierColor || '#836EF9'}55`,
                color: fullProfile?.tierColor || '#836EF9',
              }}
            >
              {fullProfile?.avatar_url ? (
                <img
                  src={fullProfile.avatar_url}
                  alt="avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(walletAddress || '0x0000')
              )}
            </div>
            <span className="font-mono text-xs text-[#52525b] tracking-wider">
              {walletAddress
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : 'NOT CONNECTED'}
            </span>
            {!isRegistered && (
              <span className="ml-auto font-mono text-xs text-[#FF3366] tracking-wider uppercase">
                ⚠ Register to Post
              </span>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            disabled={!isRegistered || isPosting}
            placeholder={
              isRegistered
                ? 'Broadcast your signal to the grid...'
                : 'Register your identity to broadcast...'
            }
            maxLength={1000}
            rows={3}
            className="w-full bg-transparent border border-[#18181b] rounded px-3 py-2 font-mono text-sm text-[#e4e4e7] placeholder-[#3f3f46] resize-none focus:outline-none focus:border-[#836EF9]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          />

          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#3f3f46]">
              {composeText.length}/1000
            </span>
            <button
              onClick={handlePost}
              disabled={!composeText.trim() || isPosting || !isRegistered}
              className="cyber-button px-4 py-1.5 text-xs font-mono tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPosting ? (
                <>
                  <span className="inline-block w-3 h-3 border border-[#836EF9] border-t-transparent rounded-full animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Terminal className="w-3 h-3" />
                  Execute
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feed */}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <MessageSquare className="w-10 h-10 text-[#27272a]" />
            <p className="font-mono text-sm text-[#3f3f46] tracking-wider">
              No signals in the stream yet...
            </p>
          </div>
        ) : (
          [...posts].reverse().map((post) => {
            const profile = getProfileForAddress(post.authorAddr);
            const avatarColor = getAvatarColor(post.authorAddr);
            const isLiking = likingPostId === post.id;

            return (
              <div
                key={post.id}
                className="border border-[#18181b] bg-[#09090b] rounded-lg p-4 space-y-3 hover:border-[#836EF9]/20 transition-colors group"
              >
                {/* Post Header */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openPublicProfile(post.authorAddr, profile)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 hover:opacity-80 transition-opacity overflow-hidden"
                    style={{
                      backgroundColor: `${avatarColor}22`,
                      border: `1px solid ${avatarColor}55`,
                      color: avatarColor,
                    }}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(post.authorAddr)
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => openPublicProfile(post.authorAddr, profile)}
                        className="font-mono text-sm font-bold text-[#e4e4e7] hover:text-[#836EF9] transition-colors truncate"
                      >
                        {profile?.username
                          ? `@${profile.username}`
                          : `${post.authorAddr.slice(0, 6)}...${post.authorAddr.slice(-4)}`}
                      </button>
                      {profile?.tierName && (
                        <span
                          className="font-mono text-xs px-1.5 py-0.5 rounded border tracking-wider uppercase"
                          style={{
                            color: profile.tierColor,
                            borderColor: `${profile.tierColor}44`,
                            backgroundColor: `${profile.tierColor}11`,
                          }}
                        >
                          {profile.tierName}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-[#52525b] tracking-wider">
                      {timeAgo(post.timestamp)}
                    </div>
                  </div>

                  <span className="font-mono text-xs text-[#3f3f46] tracking-wider">
                    #{post.id}
                  </span>
                </div>

                {/* Content */}
                <p className="font-mono text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-wrap break-words">
                  {post.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-1">
                  <button
                    onClick={() => handleLikePost(post.id)}
                    disabled={isLiking}
                    className="flex items-center gap-1.5 font-mono text-xs text-[#52525b] hover:text-[#836EF9] transition-colors disabled:opacity-40 group/like"
                  >
                    {isLiking ? (
                      <span className="inline-block w-3 h-3 border border-[#836EF9] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 group-hover/like:fill-[#836EF9]/20 transition-all" />
                    )}
                    <span>{post.likes}</span>
                  </button>

                  <button className="flex items-center gap-1.5 font-mono text-xs text-[#52525b] hover:text-[#00E5FF] transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  <button className="flex items-center gap-1.5 font-mono text-xs text-[#52525b] hover:text-[#4ade80] transition-colors">
                    <Repeat className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => openPublicProfile(post.authorAddr, profile)}
                    className="ml-auto font-mono text-xs text-[#3f3f46] hover:text-[#836EF9] transition-colors tracking-wider uppercase"
                  >
                    View Card →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
