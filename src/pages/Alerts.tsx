import { Activity } from 'lucide-react';
import { useAura } from '../context/AuraContext';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const ALERT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  NEW_IDENTITY: { label: 'NEW IDENTITY', color: '#4ade80' },
  BROADCAST: { label: 'BROADCAST', color: '#00E5FF' },
  RESONANCE: { label: 'RESONANCE', color: '#FF3366' },
  MARKET_TRADE: { label: 'MARKET', color: '#FFD700' },
};

export default function Alerts() {
  const { alerts } = useAura();

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#18181b] bg-[#050505]/90 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#836EF9]" />
          <span className="font-mono text-sm font-bold tracking-widest uppercase text-[#836EF9]">
            Network Alerts
          </span>
          <span className="ml-2 relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#836EF9] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#836EF9]" />
          </span>
          <span className="ml-auto font-mono text-xs text-[#52525b] tracking-wider">
            {alerts.length} events
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-2">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Activity className="w-10 h-10 text-[#27272a] animate-pulse" />
            <p className="font-mono text-sm text-[#3f3f46] tracking-wider">
              Awaiting network signals...
            </p>
            <p className="font-mono text-xs text-[#27272a] tracking-wider text-center max-w-xs">
              Real-time on-chain events will appear here as they occur on the grid.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = ALERT_TYPE_CONFIG[alert.type] || {
              label: alert.type,
              color: '#836EF9',
            };

            return (
              <div
                key={alert.id}
                className="border border-[#18181b] bg-[#09090b] rounded-lg px-4 py-3 flex items-start gap-3 hover:border-[#836EF9]/20 transition-all group"
                style={{
                  borderLeftColor: `${config.color}55`,
                  borderLeftWidth: '2px',
                }}
              >
                {/* Type Badge */}
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded border tracking-widest uppercase flex-shrink-0 mt-0.5"
                  style={{
                    color: config.color,
                    borderColor: `${config.color}44`,
                    backgroundColor: `${config.color}11`,
                  }}
                >
                  {config.label}
                </span>

                {/* Message */}
                <span className="font-mono text-sm text-[#a1a1aa] flex-1 leading-relaxed">
                  {alert.message}
                </span>

                {/* Timestamp */}
                <span className="font-mono text-xs text-[#3f3f46] tracking-wider flex-shrink-0 mt-0.5">
                  {alert.time instanceof Date
                    ? formatTime(alert.time)
                    : formatTime(new Date(alert.time))}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
