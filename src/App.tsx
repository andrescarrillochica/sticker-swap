import { useState } from 'react';
import { CollectionProvider } from './lib/CollectionContext';
import { TradeCartProvider } from './lib/TradeCartContext';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { CollectionPage } from './pages/CollectionPage';
import { SparesPage } from './pages/SparesPage';
import { TradePage } from './pages/TradePage';
import { BackupPage } from './pages/BackupPage';

export type Tab = 'home' | 'collection' | 'spares' | 'trade' | 'backup';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  return (
    <div className={`min-h-screen ${activeTab === 'home' ? 'bg-[#111]' : 'bg-gray-50'}`}>
      <main className="pb-20 max-w-lg mx-auto">
        {activeTab === 'home' && <HomePage onNavigate={setActiveTab} />}
        {activeTab === 'collection' && <CollectionPage />}
        {activeTab === 'spares' && <SparesPage />}
        {activeTab === 'trade' && <TradePage />}
        {activeTab === 'backup' && <BackupPage />}
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} dark={activeTab === 'home'} />
    </div>
  );
}

export default function App() {
  return (
    <CollectionProvider>
      <TradeCartProvider>
        <AppContent />
      </TradeCartProvider>
    </CollectionProvider>
  );
}
