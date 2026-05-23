import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuraProvider } from './context/AuraContext';
import { Sidebar, RightSidebar, RevealModal } from './components/Layout';
import Stream from './pages/Stream';
import Radar from './pages/Radar';
import Alerts from './pages/Alerts';
import Portfolio from './pages/Portfolio';
import Rooms from './pages/Rooms';
import NewCards from './pages/NewCards';
import { useAura } from './context/AuraContext';

const PAGE_TITLES: Record<string, string> = {
  '/stream': 'ON-CHAIN STREAM',
  '/': 'ON-CHAIN STREAM',
  '/radar': 'GLOBAL RADAR',
  '/alerts': 'LIVE NETWORK ALERTS',
  '/portfolio': 'YOUR PORTFOLIO',
  '/rooms': 'TOKEN-GATED ROOMS',
  '/new-cards': 'NEWLY MINTED CARDS',
};

function AppShell() {
  const { ready } = useAura();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'AURA_OS';

  if (!ready) {
    return (
      <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center">
        <div className="text-[#836EF9] font-mono animate-pulse">BOOTING AURA_OS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] text-[#a1a1aa] font-sans flex justify-center selection:bg-[#836EF9]/30 relative overflow-hidden">
      <div className="fixed inset-0 cyber-grid z-0 opacity-100"></div>
      <div className="fixed inset-0 scanlines z-0 opacity-80 pointer-events-none"></div>

      <div className="w-full max-w-[1200px] flex justify-between relative z-10 pt-4">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Middle Column */}
        <div className="w-[600px] border-x border-[#18181b] min-h-screen flex flex-col bg-[#050505]/95 backdrop-blur-md">
          <header className="sticky top-0 z-10 bg-[#050505] border-b border-[#18181b]">
            <div className="flex w-full">
              <div className="flex-1 text-white relative flex justify-center py-4">
                <span className="text-white font-bold tracking-widest text-sm uppercase">{title}</span>
                <div className="absolute bottom-0 h-[2px] w-full bg-[#836EF9]"></div>
              </div>
            </div>
          </header>

          <Routes>
            <Route path="/" element={<Navigate to="/stream" replace />} />
            <Route path="/stream" element={<Stream />} />
            <Route path="/radar" element={<Radar />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/new-cards" element={<NewCards />} />
            <Route path="*" element={<Navigate to="/stream" replace />} />
          </Routes>
        </div>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>

      {/* Reveal Modal */}
      <RevealModal />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuraProvider>
        <AppShell />
      </AuraProvider>
    </BrowserRouter>
  );
}
