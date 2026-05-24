import { useState, useEffect } from 'react';
import { Activity, Bell, Zap, UserPlus, Terminal, TrendingUp, MessageSquare, Cpu, Coins, Repeat } from 'lucide-react';
import { useAura } from '../context/AuraContext';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const ALERT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  NEW_IDENTITY: { label: 'IDENTITY', color: '#4ade80', icon: UserPlus },
  BROADCAST: { label: 'SIGNAL', color: '#00E5FF', icon: Terminal },
  RESONANCE: { label: 'RESONANCE', color: '#FF3366', icon: Zap },
  MARKET_TRADE: { label: 'MARKET', color: '#FFD700', icon: TrendingUp },
  TIP: { label: 'TRANSFER', color: '#F59E0B', icon: Coins },
  SYSTEM: { label: 'SYSTEM', color: '#836EF9', icon: Cpu },
  ROOM: { label: 'ROOM', color: '#836EF9', icon: MessageSquare },
  COMMENT: { label: 'COMMENT', color: '#00E5FF', icon: MessageSquare },
  REPOST: { label: 'REPOST', color: '#4ade80', icon: Repeat },
};

export default function Alerts() {
  const { alerts, clearUnreadAlerts, walletAddress, fullProfile } = useAura();
  const [activeTab, setActiveTab] = useState<'all' | 'interactions' | 'system'>('all');

  useEffect(() => {
    if (clearUnreadAlerts) {
      clearUnreadAlerts();
    }
  }, [clearUnreadAlerts]);

  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === 'all') return true;
    if (activeTab === 'system') return alert.type === 'SYSTEM';
    
    if (activeTab === 'interactions') {
      if (alert.type === 'SYSTEM') return false;
      if (!fullProfile) return true; // Show all until logged in
      
      const userMention = `@${fullProfile.screen_name.toLowerCase()}`;
      const userAddr = walletAddress?.toLowerCase() || '';
      const msgLower = alert.message.toLowerCase();
      
      return msgLower.includes(userMention) || 
             (userAddr && msgLower.includes(userAddr)) ||
             msgLower.includes('you bought') ||
             msgLower.includes('you sold') ||
             msgLower.includes('you tipped') ||
             msgLower.includes('tipped you') ||
             msgLower.includes('resonated with your') ||
             alert.type === 'TIP' ||
             alert.type === 'ROOM' ||
             alert.type === 'COMMENT' ||
             alert.type === 'REPOST';
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-hidden bg-[#050505] flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#18181b] bg-[#050505]/95 backdrop-blur-md px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-[#836EF9]" />
          <span className="font-mono text-sm font-bold tracking-widest uppercase text-[#836EF9]">
            Alerts Hub
          </span>
          <span className="ml-2 relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#836EF9] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#836EF9]" />
          </span>
          <span className="ml-auto font-mono text-xs text-[#52525b] tracking-wider">
            {filteredAlerts.length} filtered events
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#18181b] bg-[#050505] flex-shrink-0">
        <div className="flex max-w-2xl mx-auto px-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3.5 font-mono text-xs tracking-[0.2em] uppercase font-bold text-center border-b-2 transition-all relative cursor-pointer ${
              activeTab === 'all'
                ? 'border-[#836EF9] text-white'
                : 'border-transparent text-[#52525b] hover:text-[#a1a1aa]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('interactions')}
            className={`flex-1 py-3.5 font-mono text-xs tracking-[0.2em] uppercase font-bold text-center border-b-2 transition-all relative cursor-pointer ${
              activeTab === 'interactions'
                ? 'border-[#836EF9] text-white'
                : 'border-transparent text-[#52525b] hover:text-[#a1a1aa]'
            }`}
          >
            Interactions
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-3.5 font-mono text-xs tracking-[0.2em] uppercase font-bold text-center border-b-2 transition-all relative cursor-pointer ${
              activeTab === 'system'
                ? 'border-[#836EF9] text-white'
                : 'border-transparent text-[#52525b] hover:text-[#a1a1aa]'
            }`}
          >
            System
          </button>
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Activity className="w-10 h-10 text-[#27272a] animate-pulse" />
              <p className="font-mono text-sm text-[#3f3f46] tracking-wider uppercase">
                Awaiting signals...
              </p>
              <p className="font-mono text-xs text-[#27272a] tracking-wider text-center max-w-xs leading-relaxed">
                {activeTab === 'interactions'
                  ? 'No personal notifications yet. Broadcast signals or acquire cards to trigger grid interactions.'
                  : activeTab === 'system'
                  ? 'No system signals on this frequency.'
                  : 'Awaiting network signals to populate the feed...'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const config = ALERT_TYPE_CONFIG[alert.type] || {
                label: alert.type,
                color: '#836EF9',
                icon: Bell,
              };
              const IconComponent = config.icon;

              return (
                <div
                  key={alert.id}
                  className="border border-[#18181b] bg-[#09090b]/40 hover:bg-[#09090b]/80 backdrop-blur-md rounded-xl px-4 py-4 flex items-start gap-4 hover:border-[#836EF9]/30 transition-all duration-300 relative group overflow-hidden"
                  style={{
                    boxShadow: `inset 0 0 12px ${config.color}05`,
                  }}
                >
                  {/* Subtle hover edge glow */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 group-hover:w-[4px]"
                    style={{ backgroundColor: config.color }}
                  />

                  {/* Icon Wrapper */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0"
                    style={{
                      borderColor: `${config.color}33`,
                      backgroundColor: `${config.color}08`,
                      color: config.color,
                    }}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  {/* Body & Meta */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-[9px] px-2 py-0.5 rounded border tracking-widest uppercase font-bold"
                        style={{
                          color: config.color,
                          borderColor: `${config.color}44`,
                          backgroundColor: `${config.color}11`,
                        }}
                      >
                        {config.label}
                      </span>
                      <span className="font-mono text-[10px] text-[#3f3f46] tracking-wider ml-auto">
                        {alert.time instanceof Date
                          ? formatTime(alert.time)
                          : formatTime(new Date(alert.time))}
                      </span>
                    </div>

                    <p className="font-mono text-sm text-[#e4e4e7] leading-relaxed break-words pr-2">
                      {alert.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
