import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Lock, Hash } from 'lucide-react';
import { useAura, CONTRACT_ADDRESS } from '../context/AuraContext';
import AuraNetworkABI from '../config/AuraNetworkABI.json';

function getInitials(address: string): string {
  return address ? address.slice(2, 4).toUpperCase() : '??';
}

function getAvatarColor(address: string): string {
  const colors = ['#836EF9', '#00E5FF', '#FF3366', '#FFD700', '#4ade80', '#FF5E00'];
  const idx = parseInt(address?.slice(2, 4) || '00', 16) % colors.length;
  return colors[idx];
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Rooms() {
  const {
    walletAddress,
    fullProfile,
    holdings,
    allProfilesData,
    publicClient,
    writeContractAsync,
  } = useAura();

  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [roomMessages, setRoomMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build rooms list: own room + holdings rooms
  const rooms = [
    ...(walletAddress
      ? [
          {
            address: walletAddress,
            username: fullProfile?.screen_name || walletAddress.slice(0, 6),
            tierColor: fullProfile?.tierColor || '#836EF9',
            isOwn: true,
          },
        ]
      : []),
    ...holdings.map((h) => {
      let username = `${h.address.slice(0, 6)}...`;
      let tierColor = getAvatarColor(h.address);
      if (allProfilesData && (allProfilesData as any[])[0]) {
        const addresses = (allProfilesData as any[])[0] as string[];
        const profilesList = (allProfilesData as any[])[1] as any[];
        const idx = addresses.findIndex(
          (a) => a.toLowerCase() === h.address.toLowerCase()
        );
        if (idx !== -1) {
          username = profilesList[idx].username || username;
          tierColor =
            profilesList[idx].tierName === 'Shark'
              ? '#FF5E00'
              : profilesList[idx].tierColor || tierColor;
        }
      }
      return { address: h.address, username, tierColor, isOwn: false, amount: h.amount };
    }),
  ];

  // Fetch messages when room changes
  useEffect(() => {
    if (!selectedRoom || !publicClient) return;

    const fetchMessages = async () => {
      setIsChatLoading(true);
      setRoomMessages([]);
      try {
        const eventAbi = (AuraNetworkABI as any[]).find(
          (a) => a.type === 'event' && a.name === 'RoomMessage'
        );
        if (!eventAbi) {
          setIsChatLoading(false);
          return;
        }

        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock > 100000n ? latestBlock - 100000n : 0n;

        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS as `0x${string}`,
          event: eventAbi,
          args: { room: selectedRoom.address },
          fromBlock,
          toBlock: 'latest',
        });

        const messages = logs.map((log: any) => {
          const { sender, message, timestamp } = log.args;
          let username = `${sender.slice(0, 6)}...${sender.slice(-4)}`;
          let tierColor = getAvatarColor(sender);

          if (allProfilesData && (allProfilesData as any[])[0]) {
            const addresses = (allProfilesData as any[])[0] as string[];
            const profilesList = (allProfilesData as any[])[1] as any[];
            const idx = addresses.findIndex(
              (a) => a.toLowerCase() === sender.toLowerCase()
            );
            if (idx !== -1) {
              username = profilesList[idx].username || username;
              tierColor =
                profilesList[idx].tierName === 'Shark'
                  ? '#FF5E00'
                  : profilesList[idx].tierColor || tierColor;
            }
          }

          return {
            id: `${log.blockNumber}-${log.logIndex}`,
            sender,
            username,
            tierColor,
            message,
            timestamp: Number(timestamp),
          };
        });

        messages.sort((a: any, b: any) => a.timestamp - b.timestamp);
        setRoomMessages(messages);
      } catch (err) {
        console.error('Error fetching room messages:', err);
      } finally {
        setIsChatLoading(false);
      }
    };

    fetchMessages();
  }, [selectedRoom, publicClient, allProfilesData]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedRoom || isSendingMsg || !walletAddress) return;

    const msgText = chatInput.trim();
    setChatInput('');
    setIsSendingMsg(true);

    // Optimistic update
    const optimisticMsg = {
      id: `optimistic-${Date.now()}`,
      sender: walletAddress,
      username: fullProfile?.screen_name || `${walletAddress.slice(0, 6)}...`,
      tierColor: fullProfile?.tierColor || '#836EF9',
      message: msgText,
      timestamp: Math.floor(Date.now() / 1000),
      optimistic: true,
    };
    setRoomMessages((prev) => [...prev, optimisticMsg]);

    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: AuraNetworkABI,
        functionName: 'sendMessage',
        args: [selectedRoom.address, msgText],
      });
      await publicClient?.waitForTransactionReceipt({ hash: tx });
    } catch (err) {
      console.error('Failed to send message:', err);
      // Revert optimistic update on error
      setRoomMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setChatInput(msgText);
    } finally {
      setIsSendingMsg(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#18181b] bg-[#050505]/90 backdrop-blur-sm px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Hash className="w-5 h-5 text-[#836EF9]" />
          <span className="font-mono text-sm font-bold tracking-widest uppercase text-[#836EF9]">
            Rooms
          </span>
          <Lock className="w-3 h-3 text-[#52525b]" />
          <span className="font-mono text-xs text-[#52525b] tracking-wider">
            Token-Gated Chat
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Room List */}
        <div className="w-64 border-r border-[#18181b] flex flex-col flex-shrink-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#18181b]">
            <p className="font-mono text-xs text-[#52525b] tracking-widest uppercase">
              {rooms.length} accessible rooms
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
                <Lock className="w-8 h-8 text-[#27272a]" />
                <p className="font-mono text-xs text-[#3f3f46] tracking-wider text-center">
                  Hold cards to access rooms
                </p>
              </div>
            ) : (
              <div className="py-2">
                {rooms.map((room) => {
                  const isSelected =
                    selectedRoom?.address?.toLowerCase() ===
                    room.address.toLowerCase();
                  return (
                    <button
                      key={room.address}
                      onClick={() => setSelectedRoom(room)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-[#18181b]/50"
                      style={{
                        backgroundColor: isSelected ? `${room.tierColor}11` : undefined,
                        borderLeft: isSelected
                          ? `2px solid ${room.tierColor}`
                          : '2px solid transparent',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 overflow-hidden"
                        style={{
                          backgroundColor: `${room.tierColor}22`,
                          border: `1px solid ${room.tierColor}55`,
                          color: room.tierColor,
                        }}
                      >
                        {room.isOwn && fullProfile?.avatar_url ? (
                          <img
                            src={fullProfile.avatar_url}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(room.address)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs font-bold text-[#e4e4e7] truncate">
                          @{room.username}
                        </div>
                        {room.isOwn ? (
                          <div className="font-mono text-xs text-[#836EF9] tracking-wider">
                            Your Room
                          </div>
                        ) : (
                          <div className="font-mono text-xs text-[#52525b] tracking-wider">
                            ×{(room as any).amount} cards
                          </div>
                        )}
                      </div>
                      <MessageSquare
                        className="w-3 h-3 flex-shrink-0"
                        style={{ color: isSelected ? room.tierColor : '#3f3f46' }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <MessageSquare className="w-12 h-12 text-[#27272a]" />
              <p className="font-mono text-sm text-[#3f3f46] tracking-wider">
                Select a room to start chatting
              </p>
              <p className="font-mono text-xs text-[#27272a] tracking-wider text-center max-w-xs">
                Only card holders can access and message in each room.
              </p>
            </div>
          ) : (
            <>
              {/* Room Header */}
              <div className="border-b border-[#18181b] px-5 py-3 flex items-center gap-3 flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold overflow-hidden"
                  style={{
                    backgroundColor: `${selectedRoom.tierColor}22`,
                    border: `1px solid ${selectedRoom.tierColor}55`,
                    color: selectedRoom.tierColor,
                  }}
                >
                  {selectedRoom.isOwn && fullProfile?.avatar_url ? (
                    <img
                      src={fullProfile.avatar_url}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(selectedRoom.address)
                  )}
                </div>
                <div>
                  <p
                    className="font-mono text-sm font-bold"
                    style={{ color: selectedRoom.tierColor }}
                  >
                    @{selectedRoom.username}
                  </p>
                  <p className="font-mono text-xs text-[#52525b] tracking-wider">
                    {selectedRoom.address.slice(0, 6)}...{selectedRoom.address.slice(-4)}
                  </p>
                </div>
                {isChatLoading && (
                  <span className="ml-auto inline-block w-4 h-4 border border-[#836EF9] border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {isChatLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <span className="inline-block w-6 h-6 border-2 border-[#836EF9] border-t-transparent rounded-full animate-spin" />
                      <p className="font-mono text-xs text-[#52525b] tracking-wider">
                        Loading messages...
                      </p>
                    </div>
                  </div>
                ) : roomMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <MessageSquare className="w-8 h-8 text-[#27272a]" />
                    <p className="font-mono text-xs text-[#3f3f46] tracking-wider">
                      No messages yet. Be the first to broadcast.
                    </p>
                  </div>
                ) : (
                  roomMessages.map((msg) => {
                    const isMe =
                      walletAddress &&
                      msg.sender.toLowerCase() === walletAddress.toLowerCase();
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5"
                          style={{
                            backgroundColor: `${msg.tierColor}22`,
                            border: `1px solid ${msg.tierColor}55`,
                            color: msg.tierColor,
                          }}
                        >
                          {isMe && fullProfile?.avatar_url ? (
                            <img
                              src={fullProfile.avatar_url}
                              alt="avatar"
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            getInitials(msg.sender)
                          )}
                        </div>
                        <div
                          className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="font-mono text-xs font-bold"
                              style={{ color: msg.tierColor }}
                            >
                              @{msg.username}
                            </span>
                            <span className="font-mono text-xs text-[#3f3f46]">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                            {msg.optimistic && (
                              <span className="font-mono text-xs text-[#52525b] italic">
                                sending...
                              </span>
                            )}
                          </div>
                          <div
                            className="font-mono text-sm px-3 py-2 rounded-lg border break-words"
                            style={{
                              backgroundColor: isMe
                                ? `${msg.tierColor}15`
                                : '#18181b',
                              borderColor: isMe
                                ? `${msg.tierColor}33`
                                : '#27272a',
                              color: '#e4e4e7',
                            }}
                          >
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-[#18181b] px-5 py-4 flex gap-3 flex-shrink-0"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Broadcast to room..."
                  maxLength={500}
                  disabled={isSendingMsg || !walletAddress}
                  className="flex-1 bg-transparent border border-[#18181b] rounded px-4 py-2 font-mono text-sm text-[#e4e4e7] placeholder-[#3f3f46] focus:outline-none focus:border-[#836EF9]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isSendingMsg || !walletAddress}
                  className="cyber-button px-4 py-2 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-xs font-mono tracking-widest uppercase"
                >
                  {isSendingMsg ? (
                    <span className="inline-block w-4 h-4 border border-[#836EF9] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
