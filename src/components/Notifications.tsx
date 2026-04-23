import { useStore } from '../store';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export function Notifications() {
  const { notifications, removeNotification } = useStore();

  if (notifications.length === 0) return null;

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'border-green-500/20 bg-green-500/10 text-green-400',
    error: 'border-red-500/20 bg-red-500/10 text-red-400',
    info: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[200] space-y-2 max-w-sm">
      {notifications.map(n => {
        const Icon = icons[n.type];
        return (
          <div
            key={n.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-xl animate-slide-up-modal hover:scale-105 transition-all duration-300 ${colors[n.type]}`}
          >
            <Icon className="h-5 w-5 shrink-0 animate-checkmark" />
            <span className="text-sm flex-1 font-medium">{n.text}</span>
            <button onClick={() => removeNotification(n.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
