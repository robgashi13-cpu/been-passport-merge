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
    <div className="fixed inset-0 z-[100] bg-background animate-fade-in">
      {/* Full-bleed iframe — matches route-explorer.com layout natively */}
      <iframe
        src="https://route-explorer.com/"
        title="Route Explorer Globe"
        className="absolute inset-0 w-full h-full border-0 bg-white"
        allow="geolocation; fullscreen"
        referrerPolicy="no-referrer-when-downgrade"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      />

      {/* Floating close button — sits over the site's own header area */}
      <button
        onClick={onClose}
        className="fixed top-3 right-3 w-10 h-10 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center shadow-lg backdrop-blur-md border border-white/10 transition-all active:scale-95 z-[101]"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default RouteExplorerModal;
