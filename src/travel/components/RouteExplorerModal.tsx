import { ExternalLink, Globe2 } from 'lucide-react';

interface RouteExplorerButtonProps {
  className?: string;
}

const ROUTE_EXPLORER_URL = 'https://route-explorer.com/';

export const openRouteExplorer = () => {
  window.open(ROUTE_EXPLORER_URL, '_blank', 'noopener,noreferrer');
};

export const RouteExplorerButton = ({ className = '' }: RouteExplorerButtonProps) => (
  <button
    onClick={openRouteExplorer}
    className={`w-full group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-white/[0.04] to-purple-500/15 backdrop-blur-xl p-4 text-left active:scale-[0.99] transition-all hover:border-white/20 ${className}`}
  >
    <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/20 blur-3xl group-hover:bg-blue-500/30 transition-all" />
    <div className="relative flex items-center gap-4">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/15 flex items-center justify-center shrink-0">
        <Globe2 className="w-5 h-5 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-foreground text-sm truncate">Route Explorer Globe</h3>
        <p className="text-xs text-muted-foreground truncate">3,900+ airports · live route arcs</p>
      </div>
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground border border-white/15 rounded-full px-2.5 py-1 shrink-0">
        Open <ExternalLink className="w-3 h-3" />
      </span>
    </div>
  </button>
);

export default RouteExplorerButton;
