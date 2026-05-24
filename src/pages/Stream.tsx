import { useState, useRef, useEffect } from 'react';
import { Terminal, MessageSquare, Repeat, Zap, Trash2, X } from 'lucide-react';
import { useAura } from '../context/AuraContext';

// =============================================
// HELPERS
// =============================================
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

// =============================================
// KVDB GLOBAL STORAGE (shared across all users)
// =============================================
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

// =============================================
// LOCAL STORAGE HELPERS (cache layer)
// =============================================
const REPOSTS_KEY = 'aura_reposts';
const HIDDEN_POSTS_KEY = 'aura_hidden';
const LIKES_KEY = 'aura_likes'; // Set<postId> — posts the current user has liked locally

function loadReposts(): any[] {
  try { return JSON.parse(localStorage.getItem(REPOSTS_KEY) || '[]'); } catch { return []; }
}
function saveReposts(r: any[]) { localStorage.setItem(REPOSTS_KEY, JSON.stringify(r)); }

function loadHiddenPosts(): number[] {
  try { return JSON.parse(localStorage.getItem(HIDDEN_POSTS_KEY) || '[]'); } catch { return []; }
}
function saveHiddenPosts(ids: number[]) { localStorage.setItem(HIDDEN_POSTS_KEY, JSON.stringify(ids)); }

function loadLikedPosts(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(LIKES_KEY) || '[]')); } catch { return new Set(); }
}
function saveLikedPosts(s: Set<number>) { localStorage.setItem(LIKES_KEY, JSON.stringify([...s])); }

function loadComments(postId: number | string): any[] {
  try { return JSON.parse(localStorage.getItem(`comments_${postId}`) || '[]'); } catch { return []; }
}
function saveCommentsLocal(postId: number | string, comments: any[]) {
  localStorage.setItem(`comments_${postId}`, JSON.stringify(comments));
}

// =============================================
// TYPES
// =============================================
interface RepostEntry {
  repostId: string;
  originalPostId: number | string;  // on-chain id OR 'rp_...' for off-chain reposts
  originalAuthorAddr: string;
  originalUsername: string;
  originalContent: string;
  originalTimestamp: number;
  repostedByAddr: string;
  repostedByUsername: string;
  repostedAt: number;
}

// =============================================
// MAIN COMPONENT
// =============================================
export default function Stream() {
  const {
    posts,
    walletAddress,
    fullProfile,
    onChainProfile,
    handleExecutePost,
    openPublicProfile,
    radarProfiles,
    addGlobalNotification,
  } = useAura();

  const [composeText, setComposeText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Comments
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<number | string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [commentsRefresh, setCommentsRefresh] = useState(0); // force re-render

  // Reposts (off-chain, global via KVdb)
  const [reposts, setReposts] = useState<RepostEntry[]>(() => loadReposts());
  const [repostingId, setRepostingId] = useState<number | string | null>(null);

  // Load global reposts from KVdb on mount (merge with local)
  useEffect(() => {
    kvdbGet('reposts').then((data: any) => {
      if (Array.isArray(data) && data.length > 0) {
        setReposts(prev => {
          const localOnly = prev.filter(r => !data.find((d: any) => d.repostId === r.repostId));
          const merged = [...data, ...localOnly];
          saveReposts(merged);
          return merged;
        });
      }
    });
  }, []);

  // Hidden on-chain posts (local delete)
  const [hiddenPosts, setHiddenPosts] = useState<number[]>(() => loadHiddenPosts());

  // Likes (off-chain)
  const [likedPosts, setLikedPosts] = useState<Set<number>>(() => loadLikedPosts());

  const isRegistered = (onChainProfile as any)?.[4] === true;

  const getProfileForAddress = (address: string) =>
    radarProfiles.find((p) => p.address?.toLowerCase() === address?.toLowerCase());

  // =============================================
  // LIKE (off-chain toggle)
  // =============================================
  const handleLocalLike = (postId: number) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) { next.delete(postId); } else { next.add(postId); }
      saveLikedPosts(next);
      return next;
    });
  };

  // =============================================
  // POST (on-chain)
  // =============================================
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

  // =============================================
  // DELETE (hide locally)
  // =============================================
  const handleDeletePost = (postId: number) => {
    const updated = [...hiddenPosts, postId];
    saveHiddenPosts(updated);
    setHiddenPosts(updated);
  };

  // =============================================
  // REPOST (off-chain, global via KVdb)
  // =============================================
  const handleRepost = async (post: any, username: string) => {
    if (!walletAddress || !fullProfile) return;
    setRepostingId(post.id);

    // Check if already reposted
    const existing = reposts.find(
      r => r.originalPostId === post.id && r.repostedByAddr.toLowerCase() === walletAddress.toLowerCase()
    );
    if (existing) {
      // Unrepost
      const updated = reposts.filter(r => r.repostId !== existing.repostId);
      saveReposts(updated);
      setReposts(updated);
      setRepostingId(null);
      kvdbSet('reposts', updated); // async, no await needed
      return;
    }

    const entry: RepostEntry = {
      repostId: `rp_${Date.now()}_${Math.random()}`,
      originalPostId: post.id,
      originalAuthorAddr: post.authorAddr,
      originalUsername: username,
      originalContent: post.content,
      originalTimestamp: post.timestamp,
      repostedByAddr: walletAddress,
      repostedByUsername: fullProfile.screen_name,
      repostedAt: Math.floor(Date.now() / 1000),
    };

    const updated = [entry, ...reposts];
    saveReposts(updated);
    setReposts(updated);
    setRepostingId(null);
    kvdbSet('reposts', updated); // persist globally

    // Send global notification to original author
    if (post.authorAddr && post.authorAddr.toLowerCase() !== walletAddress.toLowerCase()) {
      addGlobalNotification(
        post.authorAddr,
        'REPOST',
        `@${fullProfile.screen_name} reposted your signal #${post.id}`,
        '#4ade80'
      );
    }
  };

  const hasReposted = (postId: number | string) =>
    reposts.some(r => r.originalPostId === postId && r.repostedByAddr.toLowerCase() === (walletAddress || '').toLowerCase());

  const repostCount = (postId: number | string) =>
    reposts.filter(r => r.originalPostId === postId).length;

  // =============================================
  // COMMENTS (off-chain, global via KVdb)
  // =============================================
  const handleAddComment = async (postId: number | string) => {
    if (!commentInput.trim() || !walletAddress || !fullProfile) return;

    const newComment = {
      id: `${Date.now()}-${Math.random()}`,
      author: walletAddress,
      username: fullProfile.screen_name || walletAddress.slice(0, 6),
      avatarUrl: fullProfile.avatar_url || '',
      content: commentInput.trim(),
      timestamp: Math.floor(Date.now() / 1000),
    };

    // Fetch latest from KVdb to avoid overwriting concurrent comments
    let existing: any[] = [];
    try {
      const kvdbData = await kvdbGet(`comments_${postId}`);
      existing = Array.isArray(kvdbData) ? kvdbData : loadComments(postId);
    } catch {
      existing = loadComments(postId);
    }

    const updated = [...existing, newComment];
    saveCommentsLocal(postId, updated);
    await kvdbSet(`comments_${postId}`, updated); // persist globally
    setCommentsRefresh(c => c + 1);
    setCommentInput('');

    // Send global notification to post/repost author
    try {
      let postAuthorAddr = '';
      const onChainPost = posts.find(p => p.id === Number(postId));
      if (onChainPost) {
        postAuthorAddr = onChainPost.authorAddr;
      } else {
        const rp = reposts.find(r => r.repostId === postId);
        if (rp) {
          postAuthorAddr = rp.repostedByAddr;
        }
      }
      
      if (postAuthorAddr && postAuthorAddr.toLowerCase() !== walletAddress.toLowerCase()) {
        addGlobalNotification(
          postAuthorAddr,
          'COMMENT',
          `@${fullProfile.screen_name} commented on your signal #${postId}: "${commentInput.trim().slice(0, 40)}${commentInput.trim().length > 40 ? '...' : ''}"`,
          '#00E5FF'
        );
      }
    } catch (e) {
      console.error('Failed to notify post author:', e);
    }
  };

  const handleDeleteComment = async (postId: number | string, commentId: string) => {
    let existing: any[] = [];
    try {
      const kvdbData = await kvdbGet(`comments_${postId}`);
      existing = Array.isArray(kvdbData) ? kvdbData : loadComments(postId);
    } catch {
      existing = loadComments(postId);
    }
    const updated = existing.filter((c: any) => c.id !== commentId);
    saveCommentsLocal(postId, updated);
    await kvdbSet(`comments_${postId}`, updated);
    setCommentsRefresh(c => c + 1);
  };

  const getCommentCount = (postId: number | string) => loadComments(postId).length;

  // =============================================
  // FEED: merge on-chain posts + off-chain reposts, sorted by time
  // =============================================
  const visibleOnChainPosts = posts.filter(p => !hiddenPosts.includes(p.id));

  // Build a unified feed item list
  type FeedItem =
    | { kind: 'post'; data: typeof posts[number] }
    | { kind: 'repost'; data: RepostEntry };

  const feedItems: FeedItem[] = [
    ...visibleOnChainPosts.map(p => ({ kind: 'post' as const, data: p })),
    ...reposts.map(r => ({ kind: 'repost' as const, data: r })),
  ].sort((a, b) => {
    const tA = a.kind === 'post' ? a.data.timestamp : (a.data as RepostEntry).repostedAt;
    const tB = b.kind === 'post' ? b.data.timestamp : (b.data as RepostEntry).repostedAt;
    return tB - tA;
  });

  // =============================================
  // RENDER
  // =============================================
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
            {feedItems.length} signals
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Compose */}
        <div className="border border-[#18181b] bg-[#09090b] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
              style={{
                backgroundColor: fullProfile?.tierColor ? `${fullProfile.tierColor}22` : '#836EF922',
                border: `1px solid ${fullProfile?.tierColor || '#836EF9'}55`,
                color: fullProfile?.tierColor || '#836EF9',
              }}
            >
              {fullProfile?.avatar_url ? (
                <img src={fullProfile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(walletAddress || '0x0000')
              )}
            </div>
            <span className="font-mono text-xs text-[#52525b] tracking-wider">
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'NOT CONNECTED'}
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
            placeholder={isRegistered ? 'Broadcast your signal to the grid...' : 'Register your identity to broadcast...'}
            maxLength={1000}
            rows={3}
            className="w-full bg-transparent border border-[#18181b] rounded px-3 py-2 font-mono text-sm text-[#e4e4e7] placeholder-[#3f3f46] resize-none focus:outline-none focus:border-[#836EF9]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          />

          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#3f3f46]">{composeText.length}/1000</span>
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
        {feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <MessageSquare className="w-10 h-10 text-[#27272a]" />
            <p className="font-mono text-sm text-[#3f3f46] tracking-wider">No signals in the stream yet...</p>
          </div>
        ) : (
          feedItems.map((item) => {
            if (item.kind === 'repost') {
              return <RepostCard
                key={item.data.repostId}
                repost={item.data}
                walletAddress={walletAddress}
                fullProfile={fullProfile}
                getProfileForAddress={getProfileForAddress}
                expandedCommentsPostId={expandedCommentsPostId}
                setExpandedCommentsPostId={setExpandedCommentsPostId}
                commentInput={commentInput}
                setCommentInput={setCommentInput}
                handleAddComment={handleAddComment}
                handleDeleteComment={handleDeleteComment}
                getCommentCount={getCommentCount}
                commentsRefresh={commentsRefresh}
                // Unrepost
                onUnrepost={() => {
                  const updated = reposts.filter(r => r.repostId !== item.data.repostId);
                  saveReposts(updated);
                  setReposts(updated);
                }}
                openPublicProfile={openPublicProfile}
              />;
            }

            // On-chain post
            const post = item.data;
            const profile = getProfileForAddress(post.authorAddr);
            const avatarColor = profile?.tierColor || getAvatarColor(post.authorAddr);
            const isMyPost = walletAddress && post.authorAddr.toLowerCase() === walletAddress.toLowerCase();
            const alreadyReposted = hasReposted(post.id);
            const rpCount = repostCount(post.id);
            const postCommentCount = getCommentCount(post.id);
            const alreadyLiked = likedPosts.has(post.id);
            const localLikeCount = post.likes + (alreadyLiked ? 1 : 0);

            return (
              <div
                key={post.id}
                className="border border-[#18181b] bg-[#09090b] rounded-lg p-4 space-y-3 hover:border-[#836EF9]/20 transition-colors group"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openPublicProfile(post.authorAddr, profile)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 hover:opacity-80 transition-opacity overflow-hidden"
                    style={{ backgroundColor: `${avatarColor}22`, border: `1px solid ${avatarColor}55`, color: avatarColor }}
                  >
                    {profile?.username ? (
                      <img src={`https://unavatar.io/twitter/${profile.username}`} alt="avatar" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity mix-blend-luminosity hover:mix-blend-normal" />
                    ) : getInitials(post.authorAddr)}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => openPublicProfile(post.authorAddr, profile)}
                        className="font-mono text-sm font-bold text-[#e4e4e7] hover:text-[#836EF9] transition-colors truncate"
                      >
                        {profile?.username ? `@${profile.username}` : `${post.authorAddr.slice(0, 6)}...${post.authorAddr.slice(-4)}`}
                      </button>
                      {profile?.tierName && (
                        <span
                          className="font-mono text-xs px-1.5 py-0.5 rounded border tracking-wider uppercase"
                          style={{ color: profile.tierColor, borderColor: `${profile.tierColor}44`, backgroundColor: `${profile.tierColor}11` }}
                        >
                          {profile.tierName}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-[#52525b] tracking-wider">{timeAgo(post.timestamp)}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#3f3f46] tracking-wider">#{post.id}</span>
                    {/* Delete own post */}
                    {isMyPost && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        title="Hide this post"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#3f3f46] hover:text-[#FF3366] p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="font-mono text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-wrap break-words">
                  {post.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-1">
                  {/* Like */}
                  <button
                    onClick={() => handleLocalLike(post.id)}
                    className={`flex items-center gap-1.5 font-mono text-xs transition-all active:scale-90 group/like ${
                      alreadyLiked ? 'text-[#836EF9]' : 'text-[#52525b] hover:text-[#836EF9]'
                    }`}
                  >
                    <Zap className={`w-3.5 h-3.5 transition-all ${alreadyLiked ? 'fill-[#836EF9]/30' : 'group-hover/like:fill-[#836EF9]/20'}`} />
                    <span>{localLikeCount}</span>
                  </button>

                  {/* Comment */}
                  <button
                    onClick={() => setExpandedCommentsPostId(expandedCommentsPostId === post.id ? null : post.id)}
                    className={`flex items-center gap-1.5 font-mono text-xs transition-all ${expandedCommentsPostId === post.id ? 'text-[#00E5FF]' : 'text-[#52525b] hover:text-[#00E5FF]'} active:scale-90`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{postCommentCount}</span>
                  </button>

                  {/* Repost */}
                  <button
                    onClick={() => handleRepost(post, profile?.username || '')}
                    disabled={repostingId === post.id || !walletAddress || !fullProfile}
                    title={alreadyReposted ? 'Undo repost' : 'Repost to the grid'}
                    className={`flex items-center gap-1.5 font-mono text-xs transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed ${alreadyReposted ? 'text-[#4ade80]' : 'text-[#52525b] hover:text-[#4ade80]'}`}
                  >
                    {repostingId === post.id ? (
                      <span className="inline-block w-3 h-3 border border-[#4ade80] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Repeat className="w-3.5 h-3.5" />
                    )}
                    {rpCount > 0 && <span>{rpCount}</span>}
                  </button>

                  <button
                    onClick={() => openPublicProfile(post.authorAddr, profile)}
                    className="ml-auto font-mono text-xs text-[#3f3f46] hover:text-[#836EF9] transition-colors tracking-wider uppercase"
                  >
                    View Card →
                  </button>
                </div>

                {/* Comments Panel */}
                {expandedCommentsPostId === post.id && (
                  <CommentsPanel
                    postId={post.id}
                    walletAddress={walletAddress}
                    fullProfile={fullProfile}
                    commentInput={commentInput}
                    setCommentInput={setCommentInput}
                    onAddComment={() => handleAddComment(post.id)}
                    onDeleteComment={(cid: string) => handleDeleteComment(post.id, cid)}
                    getProfileForAddress={getProfileForAddress}
                    commentsRefresh={commentsRefresh}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// =============================================
// REPOST CARD
// =============================================
function RepostCard({
  repost,
  walletAddress,
  fullProfile,
  getProfileForAddress,
  expandedCommentsPostId,
  setExpandedCommentsPostId,
  commentInput,
  setCommentInput,
  handleAddComment,
  handleDeleteComment,
  getCommentCount,
  commentsRefresh,
  onUnrepost,
  openPublicProfile,
}: any) {
  const profile = getProfileForAddress(repost.originalAuthorAddr);
  const repostedByProfile = getProfileForAddress(repost.repostedByAddr);
  const avatarColor = profile?.tierColor || getAvatarColor(repost.originalAuthorAddr);
  const isMyRepost = walletAddress && repost.repostedByAddr.toLowerCase() === walletAddress.toLowerCase();
  const postId = repost.repostId;
  const commentCount = getCommentCount(postId);

  const displayOriginalUsername = profile?.username || repost.originalUsername;
  const displayRepostedByUsername = repostedByProfile?.username || repost.repostedByUsername;

  return (
    <div className="border border-[#18181b] border-l-[#4ade80]/40 bg-[#09090b] rounded-lg p-4 space-y-3 hover:border-[#4ade80]/30 transition-colors group relative">
      {/* Repost indicator */}
      <div className="flex items-center gap-2 text-[#4ade80] font-mono text-[10px] tracking-widest uppercase mb-1">
        <Repeat className="w-3 h-3" />
        <span>@{displayRepostedByUsername} reposted</span>
        <span className="text-[#3f3f46] ml-1">· {timeAgo(repost.repostedAt)}</span>
        {isMyRepost && (
          <button
            onClick={onUnrepost}
            title="Undo repost"
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[#3f3f46] hover:text-[#FF3366] p-1"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Original post header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => openPublicProfile(repost.originalAuthorAddr, profile)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 hover:opacity-80 transition-opacity overflow-hidden"
          style={{ backgroundColor: `${avatarColor}22`, border: `1px solid ${avatarColor}55`, color: avatarColor }}
        >
          {profile?.username ? (
            <img src={`https://unavatar.io/twitter/${profile.username}`} alt="avatar" className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all" />
          ) : repost.originalAuthorAddr.slice(2, 4).toUpperCase()}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openPublicProfile(repost.originalAuthorAddr, profile)}
              className="font-mono text-sm font-bold text-[#e4e4e7] hover:text-[#836EF9] transition-colors truncate"
            >
              {displayOriginalUsername ? `@${displayOriginalUsername}` : `${repost.originalAuthorAddr.slice(0, 6)}...`}
            </button>
            {profile?.tierName && (
              <span
                className="font-mono text-xs px-1.5 py-0.5 rounded border tracking-wider uppercase"
                style={{ color: profile.tierColor, borderColor: `${profile.tierColor}44`, backgroundColor: `${profile.tierColor}11` }}
              >
                {profile.tierName}
              </span>
            )}
          </div>
          <div className="font-mono text-xs text-[#52525b] tracking-wider">{timeAgo(repost.originalTimestamp)}</div>
        </div>
      </div>

      {/* Content */}
      <p className="font-mono text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-wrap break-words">
        {repost.originalContent}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1">
        {/* Comment on the repost */}
        <button
          onClick={() => setExpandedCommentsPostId(expandedCommentsPostId === postId ? null : postId)}
          className={`flex items-center gap-1.5 font-mono text-xs transition-all ${expandedCommentsPostId === postId ? 'text-[#00E5FF]' : 'text-[#52525b] hover:text-[#00E5FF]'} active:scale-90`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{commentCount}</span>
        </button>

        <button
          onClick={() => openPublicProfile(repost.originalAuthorAddr, profile)}
          className="ml-auto font-mono text-xs text-[#3f3f46] hover:text-[#836EF9] transition-colors tracking-wider uppercase"
        >
          View Card →
        </button>
      </div>

      {/* Comments Panel */}
      {expandedCommentsPostId === postId && (
        <CommentsPanel
          postId={postId}
          walletAddress={walletAddress}
          fullProfile={fullProfile}
          commentInput={commentInput}
          setCommentInput={setCommentInput}
          onAddComment={() => handleAddComment(postId)}
          onDeleteComment={(cid: string) => handleDeleteComment(postId, cid)}
          getProfileForAddress={getProfileForAddress}
          commentsRefresh={commentsRefresh}
        />
      )}
    </div>
  );
}

// =============================================
// COMMENTS PANEL
// =============================================
function CommentsPanel({
  postId,
  walletAddress,
  fullProfile,
  commentInput,
  setCommentInput,
  onAddComment,
  onDeleteComment,
  getProfileForAddress,
  commentsRefresh,
}: any) {
  const [comments, setComments] = useState<any[]>(() => loadComments(postId));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    kvdbGet(`comments_${postId}`).then((data: any) => {
      if (!active) return;
      if (Array.isArray(data)) {
        saveCommentsLocal(postId, data);
        setComments(data);
      }
      setIsLoading(false);
    }).catch(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [postId, commentsRefresh]);

  return (
    <div className="mt-4 pt-4 border-t border-[#18181b] space-y-4 pl-4 relative">
      {isLoading && (
        <span className="absolute top-2 right-2 font-mono text-[9px] text-[#836EF9] animate-pulse">
          ⚡ SYNCING...
        </span>
      )}
      {/* Comment list */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="font-mono text-xs text-[#3f3f46] tracking-wider italic">
            {isLoading ? 'Scanning grid...' : 'No grid transmissions yet...'}
          </p>
        ) : (
          comments.map((c: any) => {
            const initials = c.author ? c.author.slice(2, 4).toUpperCase() : '??';
            const profile = getProfileForAddress ? getProfileForAddress(c.author) : null;
            const avatarBgColor = profile?.tierColor || getAvatarColor(c.author);
            const isMyComment = walletAddress && c.author.toLowerCase() === walletAddress.toLowerCase();

            const displayAvatarUrl = profile?.username 
              ? `https://unavatar.io/twitter/${profile.username}` 
              : (c.avatarUrl || '');

            const displayUsername = profile?.username || c.username || (c.author ? `${c.author.slice(0, 6)}...` : 'Unknown');

            return (
              <div key={c.id} className="flex gap-3 items-start border-l border-[#18181b] pl-3 py-1 group/comment relative">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: `${avatarBgColor}22`, border: `1px solid ${avatarBgColor}55`, color: avatarBgColor }}
                >
                  {displayAvatarUrl ? (
                    <img src={displayAvatarUrl} alt={displayUsername} className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all" />
                  ) : initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#e4e4e7]">@{displayUsername}</span>
                    <span className="font-mono text-[9px] text-[#3f3f46]">{timeAgo(c.timestamp)}</span>
                    {isMyComment && (
                      <button
                        onClick={() => onDeleteComment(c.id)}
                        title="Delete comment"
                        className="ml-auto opacity-0 group-hover/comment:opacity-100 transition-opacity text-[#3f3f46] hover:text-[#FF3366]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="font-mono text-xs text-[#a1a1aa] leading-relaxed mt-0.5 whitespace-pre-wrap break-words">{c.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comment input */}
      {fullProfile ? (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Transmit comment..."
            className="flex-1 bg-transparent border border-[#18181b] rounded px-3 py-1.5 font-mono text-xs text-[#e4e4e7] placeholder-[#3f3f46] focus:outline-none focus:border-[#836EF9]/50"
            onKeyDown={(e) => { if (e.key === 'Enter') onAddComment(); }}
          />
          <button
            onClick={onAddComment}
            disabled={!commentInput.trim()}
            className="cyber-button px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Send
          </button>
        </div>
      ) : (
        <p className="font-mono text-xs text-[#FF3366] italic">Connect to leave comments</p>
      )}
    </div>
  );
}
