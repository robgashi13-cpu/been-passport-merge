import { useEffect, useRef, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { runColdSync, getLastSyncAt, SyncProgress } from "@/services/syncService";

const FRESH_WINDOW_MS = 5 * 60 * 1000; // 5 min — skip splash if synced recently

interface UseColdSyncResult {
    /** Whether the splash overlay should be visible. */
    visible: boolean;
    progress: number;
    label: string;
    online: boolean;
    skip: () => void;
}

/**
 * Runs the cold-open sync exactly once per app load.
 * Returns state for the SyncSplash overlay.
 */
export const useColdSync = (): UseColdSyncResult => {
    const { user, isLoggedIn, visitedCountries, bucketList, livedCountries } = useUser();
    const ran = useRef(false);
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(0);
    const [label, setLabel] = useState("Preparing…");
    const [online, setOnline] = useState<boolean>(
        typeof navigator !== "undefined" ? navigator.onLine : true
    );

    // Track network status (for the splash badge + general UX).
    useEffect(() => {
        const onOnline = () => setOnline(true);
        const onOffline = () => setOnline(false);
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
        };
    }, []);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        const lastSync = getLastSyncAt();
        const isFresh = Date.now() - lastSync < FRESH_WINDOW_MS;
        const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

        // Priority: passport + visited + bucket + lived
        const passport = isLoggedIn && user?.passportCode ? [user.passportCode] : [];
        const priority = Array.from(new Set([
            ...passport,
            ...(visitedCountries || []),
            ...(bucketList || []),
            ...(livedCountries || []),
        ]));

        // Offline → no point hitting network; just skip the splash, cached data is used.
        if (!isOnline) {
            return;
        }

        // Recently synced → still refresh in background, but no splash.
        const showSplash = !isFresh;
        if (showSplash) setVisible(true);

        const handleProgress = (p: SyncProgress) => {
            setProgress(p.pct);
            setLabel(p.step);
        };

        runColdSync({
            priorityIsoCodes: priority,
            onProgress: handleProgress,
            timeoutMs: 9000,
        }).finally(() => {
            // Brief delay so users see the bar hit 100%
            setTimeout(() => setVisible(false), 450);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const skip = () => setVisible(false);

    return { visible, progress, label, online, skip };
};
