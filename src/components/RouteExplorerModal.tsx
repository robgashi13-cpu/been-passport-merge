import { X } from 'lucide-react';
import { useEffect } from 'react';

interface RouteExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RouteExplorerModal = ({ isOpen, onClose }: RouteExplorerModalProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm animate-fade-in flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">🌍</span>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-foreground text-sm sm:text-base truncate">Route Explorer Globe</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Interactive flight route map · route-explorer.com</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-foreground transition-all active:scale-95 shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 relative bg-white">
        <iframe
          src="https://route-explorer.com/"
          title="Route Explorer Globe"
          className="absolute inset-0 w-full h-full border-0"
          allow="geolocation; fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};

export default RouteExplorerModal;
