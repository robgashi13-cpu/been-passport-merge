import { useRef, useEffect, useState, useMemo, useCallback, Suspense, lazy } from "react";
import * as topojson from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import { MapPin, CreditCard, Plus, Minus, Compass, Loader2, Plane, PlaneTakeoff } from "lucide-react";
import worldData from "@/data/world-110m.json";
import { countries } from "@/data/countries";
import { getVisaRequirementFromMatrix } from "@/data/visaMatrix";
import { VISA_SUBSTITUTIONS, getVisaPowerGroups } from "@/data/visaSubstitutions";
import airportCoords from "@/data/airportCoords.json";

const AIRPORTS = airportCoords as unknown as Record<string, [number, number, string]>;
const Globe = lazy(() => import("react-globe.gl"));

interface GlobeMapProps {
    visitedCountries: string[];
    toggleVisited?: (code: string) => void;
    userPassportCode?: string;
    heldVisas?: string[];
    onCountryClick?: (code: string) => void;
    livedCountries?: string[];
    bucketList?: string[];
    flightHistory?: Array<{ from: string; to: string; at: number; fromIata?: string; toIata?: string; airline?: string; flightNo?: string }>;
    selectedFlightIndex?: number | null;
}

type ArcDatum = { startLat: number; startLng: number; endLat: number; endLng: number; index: number; latest: boolean; selected: boolean };
type PointDatum = { lat: number; lng: number; iata: string; city: string; visits: number };

const numericToIso2: Record<string, string> = {
    "8":"AL","20":"AD","40":"AT","112":"BY","56":"BE","70":"BA","100":"BG",
    "191":"HR","196":"CY","203":"CZ","208":"DK","233":"EE","246":"FI","250":"FR",
    "276":"DE","300":"GR","348":"HU","352":"IS","372":"IE","380":"IT","428":"LV",
    "438":"LI","440":"LT","442":"LU","807":"MK","470":"MT","498":"MD","492":"MC",
    "499":"ME","528":"NL","578":"NO","616":"PL","620":"PT","642":"RO","643":"RU",
    "674":"SM","688":"RS","703":"SK","705":"SI","724":"ES","752":"SE","756":"CH",
    "792":"TR","804":"UA","826":"GB","336":"VA",
    "28":"AG","32":"AR","44":"BS","52":"BB","84":"BZ","68":"BO","76":"BR",
    "124":"CA","152":"CL","170":"CO","188":"CR","192":"CU","212":"DM","214":"DO",
    "218":"EC","222":"SV","308":"GD","320":"GT","328":"GY","332":"HT","340":"HN",
    "388":"JM","484":"MX","558":"NI","591":"PA","600":"PY","604":"PE","630":"PR",
    "662":"LC","670":"VC","740":"SR","780":"TT","840":"US","858":"UY","862":"VE",
    "4":"AF","51":"AM","31":"AZ","48":"BH","50":"BD","64":"BT","96":"BN",
    "116":"KH","156":"CN","268":"GE","344":"HK","356":"IN","360":"ID","364":"IR",
    "368":"IQ","376":"IL","392":"JP","400":"JO","398":"KZ","414":"KW","417":"KG",
    "418":"LA","422":"LB","446":"MO","458":"MY","462":"MV","496":"MN","104":"MM",
    "524":"NP","408":"KP","512":"OM","586":"PK","275":"PS","608":"PH","634":"QA",
    "682":"SA","702":"SG","410":"KR","144":"LK","760":"SY","762":"TJ","764":"TH",
    "626":"TL","795":"TM","784":"AE","860":"UZ","704":"VN","887":"YE",
    "12":"DZ","24":"AO","204":"BJ","72":"BW","854":"BF","108":"BI","120":"CM",
    "132":"CV","140":"CF","148":"TD","174":"KM","178":"CG","180":"CD","262":"DJ",
    "818":"EG","226":"GQ","232":"ER","748":"SZ","231":"ET","266":"GA","270":"GM",
    "288":"GH","324":"GN","624":"GW","384":"CI","404":"KE","426":"LS","430":"LR",
    "434":"LY","450":"MG","454":"MW","466":"ML","478":"MR","480":"MU","504":"MA",
    "508":"MZ","516":"NA","562":"NE","566":"NG","646":"RW","678":"ST","686":"SN",
    "690":"SC","694":"SL","706":"SO","710":"ZA","728":"SS","729":"SD","834":"TZ",
    "768":"TG","788":"TN","800":"UG","894":"ZM","716":"ZW",
    "36":"AU","242":"FJ","296":"KI","584":"MH","583":"FM","520":"NR","554":"NZ",
    "585":"PW","598":"PG","882":"WS","90":"SB","776":"TO","798":"TV","548":"VU","304":"GL",
};

const COLORS = {
    base: "rgba(38, 46, 70, 0.85)",
    visited: "rgba(245, 245, 247, 0.92)",
    lived: "rgba(96, 165, 250, 0.92)",
    bucket: "rgba(251, 146, 60, 0.92)",
    visaFree: "rgba(52, 211, 153, 0.92)",
    visaArrival: "rgba(163, 230, 53, 0.92)",
    eta: "rgba(245, 158, 11, 0.92)",
    eVisa: "rgba(251, 191, 36, 0.92)",
    visaReq: "rgba(239, 68, 68, 0.9)",
    home: "rgba(255, 255, 255, 1)",
    side: "rgba(20, 26, 44, 0.9)",
    stroke: "rgba(255, 255, 255, 0.22)",
};

type WorldTopology = Topology<{ countries: GeometryCollection }>;
type CountryFeatureProps = { iso: string; name: string };
type CountryFeature = Feature<Polygon | MultiPolygon, CountryFeatureProps>;

type GlobeHandle = {
    controls: () => {
        autoRotate: boolean; autoRotateSpeed: number;
        enableDamping: boolean; dampingFactor: number;
        rotateSpeed: number; zoomSpeed: number;
        minDistance: number; maxDistance: number;
        enableZoom: boolean;
    };
    pointOfView: (pov: { lat?: number; lng?: number; altitude?: number }, ms?: number) => void;
    camera: () => { position: { z: number } };
    renderer?: () => { setPixelRatio: (n: number) => void; setSize?: (w: number, h: number, updateStyle?: boolean) => void };
    scene?: () => { traverse: (cb: (o: { name?: string; type?: string; raycast?: () => null }) => void) => void };
};

/**
 * Globe — clean rebuild.
 *
 *  • Single fixed-quality renderer (no adaptive tier flicker).
 *  • Native devicePixelRatio (capped at 2) for crisp polygons & arcs.
 *  • Smooth damped rotation, full zoom range (close-up city detail → full earth).
 *  • Static flight arcs in city-precise coordinates; airport pins where known.
 *  • Country click bubbles up to the parent (which opens the centered detail modal).
 */
const GlobeMap = ({
    visitedCountries,
    toggleVisited,
    userPassportCode,
    heldVisas = [],
    onCountryClick,
    livedCountries = [],
    bucketList = [],
    flightHistory = [],
    selectedFlightIndex = null,
}: GlobeMapProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const globeRef = useRef<GlobeHandle | null>(null);
    const [size, setSize] = useState({ w: 0, h: 0 });
    const [viewMode, setViewMode] = useState<"visited" | "visa">("visited");
    const [hoverIso, setHoverIso] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(true);
    const [ready, setReady] = useState(false);
    const [showFlights, setShowFlights] = useState(false);
    const interactedRef = useRef(false);

    // ── Build country polygons once
    const polygons = useMemo<CountryFeature[]>(() => {
        const topology = worldData as unknown as WorldTopology;
        const fc = topojson.feature(topology, topology.objects.countries) as unknown as {
            features: Array<Feature<Polygon | MultiPolygon, { name?: string }> & { id?: string | number }>;
        };
        const list: CountryFeature[] = [];
        for (const f of fc.features) {
            const id = f.id != null ? String(Number(f.id)) : null;
            let iso = id && numericToIso2[id] ? numericToIso2[id] : null;
            const nm = (f.properties as { name?: string }).name;
            if (!iso && nm) {
                if (nm === "Kosovo") iso = "XK";
                else iso = countries.find(c => c.name === nm || c.name.includes(nm))?.code || null;
            }
            if (!iso) continue;
            list.push({ type: "Feature", geometry: f.geometry, properties: { iso, name: nm || iso } });
        }
        return list;
    }, []);

    // ── Color resolution
    const colorMap = useMemo<Map<string, string>>(() => {
        const map = new Map<string, string>();
        const powerGroups = viewMode === "visa" && userPassportCode ? getVisaPowerGroups(heldVisas) : [];
        const visaSubs = new Set<string>();
        if (viewMode === "visa") {
            powerGroups.forEach(g => (VISA_SUBSTITUTIONS[g] || []).forEach(c => visaSubs.add(c)));
        }
        for (const f of polygons) {
            const iso = f.properties.iso;
            let color: string = COLORS.base;
            if (viewMode === "visited") {
                if (livedCountries.includes(iso)) color = COLORS.lived;
                else if (bucketList.includes(iso)) color = COLORS.bucket;
                else if (visitedCountries.includes(iso)) color = COLORS.visited;
            } else if (userPassportCode) {
                if (iso === userPassportCode) color = COLORS.home;
                else {
                    const info = getVisaRequirementFromMatrix(userPassportCode, iso);
                    color = COLORS.visaReq;
                    if (info) {
                        switch (info.requirement) {
                            case "visa-free": color = COLORS.visaFree; break;
                            case "visa-on-arrival": color = COLORS.visaArrival; break;
                            case "e-visa": color = COLORS.eVisa; break;
                            case "eta": color = COLORS.eta; break;
                            case "visa-required": color = COLORS.visaReq; break;
                        }
                    }
                    if (color === COLORS.visaReq && (heldVisas.includes(iso) || visaSubs.has(iso))) color = COLORS.visaFree;
                }
            }
            map.set(iso, color);
        }
        return map;
    }, [polygons, viewMode, visitedCountries, livedCountries, bucketList, userPassportCode, heldVisas]);

    const polygonCapColorFn = useCallback((d: object) => colorMap.get((d as CountryFeature).properties.iso) || COLORS.base, [colorMap]);
    const polygonSideColorFn = useCallback(() => COLORS.side, []);
    const polygonStrokeColorFn = useCallback(() => COLORS.stroke, []);
    const polygonLabelFn = useCallback(() => "", []);

    // ── Flight arcs (city-precise where IATA known)
    const arcs = useMemo<ArcDatum[]>(() => {
        return flightHistory.map((flight, idx) => {
            const fromAirport = flight.fromIata ? AIRPORTS[flight.fromIata] : undefined;
            const toAirport = flight.toIata ? AIRPORTS[flight.toIata] : undefined;
            const a = fromAirport ? [fromAirport[0], fromAirport[1]] as [number, number] : countries.find(c => c.code === flight.from)?.coordinates;
            const b = toAirport ? [toAirport[0], toAirport[1]] as [number, number] : countries.find(c => c.code === flight.to)?.coordinates;
            if (!a || !b) return null;
            return {
                startLat: a[0], startLng: a[1], endLat: b[0], endLng: b[1],
                index: idx, latest: idx === flightHistory.length - 1,
                selected: selectedFlightIndex === idx,
            } as ArcDatum;
        }).filter((x): x is ArcDatum => x !== null);
    }, [flightHistory, selectedFlightIndex]);

    // Cap arcs to keep things smooth on dense histories
    const visibleArcs = useMemo(() => {
        if (!showFlights) return [] as ArcDatum[];
        return arcs.length > 400 ? arcs.slice(-400) : arcs;
    }, [arcs, showFlights]);

    // ── Airport pins
    const airportPoints = useMemo<PointDatum[]>(() => {
        if (!showFlights) return [];
        const map = new Map<string, PointDatum>();
        for (const f of flightHistory) {
            for (const iata of [f.fromIata, f.toIata]) {
                if (!iata) continue;
                const a = AIRPORTS[iata];
                if (!a) continue;
                const existing = map.get(iata);
                if (existing) existing.visits++;
                else map.set(iata, { lat: a[0], lng: a[1], iata, city: a[2], visits: 1 });
            }
        }
        return Array.from(map.values());
    }, [flightHistory, showFlights]);

    // ── Resize
    useEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;
        const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // ── Camera + smooth controls
    useEffect(() => {
        if (!ready || !globeRef.current) return;
        const controls = globeRef.current.controls();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;
        controls.enableDamping = true;
        controls.dampingFactor = 0.14;
        controls.rotateSpeed = 0.6;
        controls.zoomSpeed = 1.25;
        controls.enableZoom = true;
        controls.minDistance = 120;   // closer zoom for city detail
        controls.maxDistance = 700;   // pulled out for full earth view

        try {
            const cached = localStorage.getItem("user_geo");
            if (cached) {
                const { lat, lng } = JSON.parse(cached);
                if (typeof lat === "number" && typeof lng === "number") {
                    globeRef.current.pointOfView({ lat, lng, altitude: 1.9 }, 1400);
                }
            } else if (userPassportCode) {
                const c = countries.find(p => p.code === userPassportCode)?.coordinates;
                if (c) globeRef.current.pointOfView({ lat: c[0], lng: c[1], altitude: 1.9 }, 1400);
            }
        } catch { /* ignore */ }

        const stop = () => {
            interactedRef.current = true;
            const c = globeRef.current?.controls();
            if (c) c.autoRotate = false;
            window.removeEventListener("pointerdown", stop);
            window.removeEventListener("wheel", stop);
            window.removeEventListener("keydown", stop);
        };
        window.addEventListener("pointerdown", stop, { passive: true });
        window.addEventListener("wheel", stop, { passive: true });
        window.addEventListener("keydown", stop);
        return () => {
            window.removeEventListener("pointerdown", stop);
            window.removeEventListener("wheel", stop);
            window.removeEventListener("keydown", stop);
        };
    }, [ready, userPassportCode]);

    // ── Crisp DPR (capped at 2 so very high-density screens don't tank framerate)
    useEffect(() => {
        if (!ready || !globeRef.current) return;
        try {
            const renderer = globeRef.current.renderer?.();
            if (!renderer) return;
            const native = window.devicePixelRatio || 1;
            renderer.setPixelRatio(Math.min(native, 2));
        } catch { /* ignore */ }
    }, [ready]);

    // ── Arcs/lines must NOT block country pointer events
    useEffect(() => {
        if (!ready || !globeRef.current) return;
        const scene = globeRef.current.scene?.();
        if (!scene) return;
        const noHit = () => null;
        scene.traverse((obj) => {
            const name = (obj?.name || '').toLowerCase();
            const type = (obj?.type || '').toLowerCase();
            if (name.includes('arc') || type.includes('line')) obj.raycast = noHit;
        });
    }, [ready, visibleArcs]);

    // ── Geolocation
    useEffect(() => {
        if (!("geolocation" in navigator)) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                try { localStorage.setItem("user_geo", JSON.stringify({ lat: latitude, lng: longitude })); } catch { /* ignore */ }
                if (globeRef.current && !interactedRef.current) {
                    globeRef.current.pointOfView({ lat: latitude, lng: longitude, altitude: 1.6 }, 1500);
                }
            },
            () => { /* deny silently */ },
            { enableHighAccuracy: false, timeout: 2500, maximumAge: 60 * 60 * 1000 },
        );
    }, []);

    // ── Fly to selected flight
    useEffect(() => {
        if (!ready || selectedFlightIndex == null || !globeRef.current) return;
        const flight = flightHistory[selectedFlightIndex];
        if (!flight) return;
        const c = countries.find(co => co.code === flight.to)?.coordinates;
        if (c) globeRef.current.pointOfView({ lat: c[0], lng: c[1], altitude: 1.4 }, 1000);
    }, [selectedFlightIndex, flightHistory, ready]);

    useEffect(() => {
        const t = setTimeout(() => setShowHint(false), 4500);
        return () => clearTimeout(t);
    }, []);

    const handleZoom = (delta: number) => {
        if (!globeRef.current) return;
        const camera = globeRef.current.camera();
        const r = 100;
        const alt = (camera.position.z - r) / r;
        const next = Math.max(0.1, Math.min(5, alt + delta));
        globeRef.current.pointOfView({ altitude: next }, 280);
    };

    const handleRecenter = () => {
        if (!globeRef.current) return;
        const c = userPassportCode ? countries.find(p => p.code === userPassportCode)?.coordinates : undefined;
        if (c) globeRef.current.pointOfView({ lat: c[0], lng: c[1], altitude: 1.8 }, 900);
        else globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 900);
    };

    const tooltipCountry = hoverIso ? countries.find(c => c.code === hoverIso)?.name || hoverIso : null;

    const visitedLegend = [
        { c: COLORS.visited, label: "Visited" },
        { c: COLORS.lived, label: "Lived" },
        { c: COLORS.bucket, label: "Bucket" },
    ];
    const visaLegend = [
        { c: COLORS.visaFree, label: "Visa-free" },
        { c: COLORS.visaArrival, label: "On arrival" },
        { c: COLORS.eVisa, label: "e-Visa" },
        { c: COLORS.eta, label: "ETA" },
        { c: COLORS.visaReq, label: "Required" },
    ];
    const legend = viewMode === "visited" ? visitedLegend : visaLegend;

    return (
        <div
            ref={containerRef}
            className="globe-stage w-full h-full relative overflow-hidden touch-none select-none"
            style={{ background: "radial-gradient(ellipse at 50% 38%, #11172a 0%, #06080f 55%, #02030a 100%)" }}
            role="application"
            aria-label="Interactive world globe"
        >
            {/* Starfield */}
            <div
                aria-hidden
                className="absolute inset-0 opacity-[0.35] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,0.9), transparent 50%),
                                      radial-gradient(1px 1px at 78% 14%, rgba(255,255,255,0.7), transparent 50%),
                                      radial-gradient(1.5px 1.5px at 36% 76%, rgba(255,255,255,0.85), transparent 50%),
                                      radial-gradient(1px 1px at 88% 64%, rgba(255,255,255,0.6), transparent 50%),
                                      radial-gradient(1px 1px at 52% 38%, rgba(255,255,255,0.7), transparent 50%),
                                      radial-gradient(1px 1px at 22% 88%, rgba(255,255,255,0.5), transparent 50%)`,
                }}
            />

            <Suspense fallback={null}>
                {size.w > 0 && size.h > 0 && (
                    <Globe
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ref={globeRef as any}
                        onGlobeReady={() => setReady(true)}
                        width={size.w}
                        height={size.h}
                        animateIn={true}
                        rendererConfig={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                        backgroundColor="rgba(0,0,0,0)"
                        showAtmosphere={true}
                        atmosphereColor="#7cc6ff"
                        atmosphereAltitude={0.18}
                        globeImageUrl={null as unknown as string}
                        showGlobe={true}
                        polygonsData={polygons}
                        polygonAltitude={(d: object) => (((d as CountryFeature).properties.iso === hoverIso) ? 0.022 : 0.008)}
                        polygonCapColor={polygonCapColorFn}
                        polygonSideColor={polygonSideColorFn}
                        polygonStrokeColor={polygonStrokeColorFn}
                        polygonLabel={polygonLabelFn}
                        polygonsTransitionDuration={180}
                        onPolygonHover={(p: object | null) => {
                            const f = p as CountryFeature | null;
                            const next = f?.properties.iso ?? null;
                            setHoverIso(prev => prev === next ? prev : next);
                        }}
                        onPolygonClick={(p: object) => {
                            const iso = (p as CountryFeature).properties.iso;
                            if (onCountryClick) onCountryClick(iso);
                            else if (toggleVisited) toggleVisited(iso);
                        }}
                        arcsData={visibleArcs}
                        arcStartLat={(d: object) => (d as ArcDatum).startLat}
                        arcStartLng={(d: object) => (d as ArcDatum).startLng}
                        arcEndLat={(d: object) => (d as ArcDatum).endLat}
                        arcEndLng={(d: object) => (d as ArcDatum).endLng}
                        arcColor={(d: object) => {
                            const a = d as ArcDatum;
                            if (a.selected) return ["rgba(255,209,102,0.95)", "rgba(255,209,102,0.4)"];
                            if (a.latest) return ["rgba(255,255,255,0.95)", "rgba(255,255,255,0.35)"];
                            return ["rgba(158,197,255,0.85)", "rgba(158,197,255,0.2)"];
                        }}
                        arcStroke={(d: object) => {
                            const a = d as ArcDatum;
                            return a.selected ? 0.55 : a.latest ? 0.4 : 0.28;
                        }}
                        arcAltitudeAutoScale={0.5}
                        arcDashLength={1}
                        arcDashGap={0}
                        arcDashAnimateTime={0}
                        arcsTransitionDuration={0}
                        arcCurveResolution={64}
                        pointsData={airportPoints}
                        pointLat={(d: object) => (d as PointDatum).lat}
                        pointLng={(d: object) => (d as PointDatum).lng}
                        pointAltitude={0.005}
                        pointRadius={(d: object) => Math.min(0.35, 0.12 + (d as PointDatum).visits * 0.04)}
                        pointColor={() => "rgba(255,209,102,0.95)"}
                        pointLabel={(d: object) => {
                            const p = d as PointDatum;
                            return `<div style="background:rgba(0,0,0,0.85);color:#fff;padding:6px 10px;border-radius:8px;font:600 11px/1.3 system-ui;border:1px solid rgba(255,255,255,0.1)">
                                <div style="color:#ffd166">${p.iata}</div>
                                <div style="opacity:.75">${p.city} · ${p.visits} visit${p.visits === 1 ? "" : "s"}</div>
                            </div>`;
                        }}
                        pointsMerge={true}
                    />
                )}
            </Suspense>

            {!ready && (
                <div className="absolute inset-0 z-[5] grid place-items-center text-white/60">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-7 h-7 animate-spin text-white/70" />
                        <span className="text-xs uppercase tracking-[0.25em]">Building globe…</span>
                    </div>
                </div>
            )}

            {hoverIso && tooltipCountry && (
                <div
                    className="pointer-events-none absolute z-[95] left-1/2 -translate-x-1/2 top-20 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-xl"
                    role="status"
                    aria-live="polite"
                >
                    {tooltipCountry}
                </div>
            )}

            <div
                className="absolute top-4 left-0 right-0 flex justify-center z-[10] pointer-events-none"
                style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
                <div className="globe-chrome p-1 rounded-2xl flex gap-1 pointer-events-auto animate-fade-in" role="tablist" aria-label="Globe view mode">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={viewMode === "visited"}
                        onClick={() => setViewMode("visited")}
                        data-active={viewMode === "visited"}
                        className="globe-toggle-pill px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white min-h-11"
                    >
                        <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" aria-hidden />
                            Visited
                        </span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={viewMode === "visa"}
                        onClick={() => userPassportCode && setViewMode("visa")}
                        disabled={!userPassportCode}
                        data-active={viewMode === "visa"}
                        className="globe-toggle-pill px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white disabled:opacity-30 min-h-11"
                    >
                        <span className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" aria-hidden />
                            Visa Power
                        </span>
                    </button>
                </div>
            </div>

            {showHint && ready && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[10] pointer-events-none animate-fade-in">
                    <div className="globe-chrome rounded-full px-4 py-2 text-xs text-white/80">
                        Drag to rotate · Pinch / scroll to zoom · Tap a country
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-[10] pointer-events-none">
                <div className="globe-chrome rounded-2xl px-3 py-2 flex flex-col gap-1.5">
                    {legend.map(l => (
                        <div key={l.label} className="flex items-center gap-2 text-[11px] text-white/75">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: l.c }} aria-hidden />
                            {l.label}
                        </div>
                    ))}
                </div>
            </div>

            <div
                className="absolute right-3 z-[10] flex flex-col gap-2"
                style={{ top: "calc(env(safe-area-inset-top) + 5rem)" }}
            >
                <button onClick={() => handleZoom(-0.4)} aria-label="Zoom in" className="globe-chrome globe-fab min-h-11 min-w-11">
                    <Plus className="w-5 h-5" aria-hidden />
                </button>
                <button onClick={() => handleZoom(0.4)} aria-label="Zoom out" className="globe-chrome globe-fab min-h-11 min-w-11">
                    <Minus className="w-5 h-5" aria-hidden />
                </button>
                <button onClick={handleRecenter} aria-label="Recenter globe" className="globe-chrome globe-fab min-h-11 min-w-11">
                    <Compass className="w-5 h-5" aria-hidden />
                </button>
                <button
                    onClick={() => setShowFlights(v => !v)}
                    aria-label={showFlights ? "Hide flight history" : "Show flight history"}
                    aria-pressed={showFlights}
                    className="globe-chrome globe-fab min-h-11 min-w-11"
                    data-active={showFlights}
                    style={showFlights ? { color: "#ffd166", borderColor: "rgba(255,209,102,0.5)" } : undefined}
                    title={showFlights ? "Hide flight history" : "Show flight history"}
                >
                    {showFlights ? <PlaneTakeoff className="w-5 h-5" aria-hidden /> : <Plane className="w-5 h-5" aria-hidden />}
                </button>
            </div>
        </div>
    );
};

export default GlobeMap;
