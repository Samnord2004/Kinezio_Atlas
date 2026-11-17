import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="print:hidden fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3.5 py-2 text-xs font-medium shadow-lg border border-slate-700"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Автономный режим · Все данные и карты доступны офлайн</span>
    </div>
  );
};
