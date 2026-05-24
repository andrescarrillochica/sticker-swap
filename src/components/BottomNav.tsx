import { Home, BookOpen, Copy, ArrowLeftRight, HardDrive } from 'lucide-react';
import type { Tab } from '../App';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  dark?: boolean;
}

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'collection', label: 'Collection', Icon: BookOpen },
  { id: 'spares', label: 'Spares', Icon: Copy },
  { id: 'trade', label: 'Trade', Icon: ArrowLeftRight },
  { id: 'backup', label: 'Backup', Icon: HardDrive },
];

export function BottomNav({ active, onChange, dark }: Props) {
  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 safe-area-pb border-t ${dark ? 'bg-[#1c1c1c] border-white/10' : 'bg-white border-gray-200'}`}>
      <div className="flex">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
              active === id
                ? dark ? 'text-white' : 'text-blue-600'
                : dark ? 'text-gray-600' : 'text-gray-500'
            }`}
          >
            <Icon size={22} className={active === id ? (dark ? 'text-white' : 'text-blue-600') : (dark ? 'text-gray-600' : 'text-gray-400')} />
            <span className={`text-[10px] mt-0.5 font-medium ${active === id ? (dark ? 'text-white' : 'text-blue-600') : (dark ? 'text-gray-600' : 'text-gray-500')}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
