import { useState, useRef, useCallback, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from "react-simple-maps";
import { countries } from '@/data/countries';
import { getVisaRequirementFromMatrix } from '@/data/visaMatrix';
import { VISA_SUBSTITUTIONS, getVisaPowerGroups } from '@/data/visaSubstitutions';
import { MapPin, CreditCard, ZoomIn, ZoomOut } from 'lucide-react';

import worldData from '@/data/world-110m.json';

interface GlobeMapProps {
    visitedCountries: string[];
    toggleVisited?: (code: string) => void;
    userPassportCode?: string;
    heldVisas?: string[];
    onCountryClick?: (code: string) => void;
}

// Numeric ID to ISO2 mapping
const numericToIso2: Record<string, string> = {
    "8": "AL", "20": "AD", "40": "AT", "112": "BY", "56": "BE", "70": "BA", "100": "BG",
    "191": "HR", "196": "CY", "203": "CZ", "208": "DK", "233": "EE", "246": "FI", "250": "FR",
    "276": "DE", "300": "GR", "348": "HU", "352": "IS", "372": "IE", "380": "IT", "428": "LV",
    "438": "LI", "440": "LT", "442": "LU", "807": "MK", "470": "MT", "498": "MD", "492": "MC",
    "499": "ME", "528": "NL", "578": "NO", "616": "PL", "620": "PT", "642": "RO", "643": "RU",
    "674": "SM", "688": "RS", "703": "SK", "705": "SI", "724": "ES", "752": "SE", "756": "CH",
    "792": "TR", "804": "UA", "826": "GB", "336": "VA",
    "28": "AG", "32": "AR", "44": "BS", "52": "BB", "84": "BZ", "68": "BO", "76": "BR",
    "124": "CA", "152": "CL", "170": "CO", "188": "CR", "192": "CU", "212": "DM", "214": "DO",
    "218": "EC", "222": "SV", "308": "GD", "320": "GT", "328": "GY", "332": "HT", "340": "HN",
    "388": "JM", "484": "MX", "558": "NI", "591": "PA", "600": "PY", "604": "PE", "630": "PR",
    "662": "LC", "670": "VC", "740": "SR", "780": "TT", "840": "US", "858": "UY", "862": "VE",
    "4": "AF", "51": "AM", "31": "AZ", "48": "BH", "50": "BD", "64": "BT", "96": "BN",
    "116": "KH", "156": "CN", "268": "GE", "344": "HK", "356": "IN", "360": "ID", "364": "IR",
    "368": "IQ", "376": "IL", "392": "JP", "400": "JO", "398": "KZ", "414": "KW", "417": "KG",
    "418": "LA", "422": "LB", "446": "MO", "458": "MY", "462": "MV", "496": "MN", "104": "MM",
    "524": "NP", "408": "KP", "512": "OM", "586": "PK", "275": "PS", "608": "PH", "634": "QA",
    "682": "SA", "702": "SG", "410": "KR", "144": "LK", "760": "SY", "762": "TJ", "764": "TH",
    "626": "TL", "795": "TM", "784": "AE", "860": "UZ", "704": "VN", "887": "YE",
    "12": "DZ", "24": "AO", "204": "BJ", "72": "BW", "854": "BF", "108": "BI", "120": "CM",
    "132": "CV", "140": "CF", "148": "TD", "174": "KM", "178": "CG", "180": "CD", "262": "DJ",
    "818": "EG", "226": "GQ", "232": "ER", "748": "SZ", "231": "ET", "266": "GA", "270": "GM",
    "288": "GH", "324": "GN", "624": "GW", "384": "CI", "404": "KE", "426": "LS", "430": "LR",
    "434": "LY", "450": "MG", "454": "MW", "466": "ML", "478": "MR", "480": "MU", "504": "MA",
    "508": "MZ", "516": "NA", "562": "NE", "566": "NG", "646": "RW", "678": "ST", "686": "SN",
    "690": "SC", "694": "SL", "706": "SO", "710": "ZA", "728": "SS", "729": "SD", "834": "TZ",
    "768": "TG", "788": "TN", "800": "UG", "894": "ZM", "716": "ZW",
    "36": "AU", "242": "FJ", "296": "KI", "584": "MH", "583": "FM", "520": "NR", "554": "NZ",
    "585": "PW", "598": "PG", "882": "WS", "90": "SB", "776": "TO", "798": "TV", "548": "VU",
};

const nameToIso2: Record<string, string> = {
    "czechia": "CZ", "united states of america": "US", "united states": "US",
    "united kingdom": "GB", "bosnia and herz.": "BA", "north macedonia": "MK",
    "south korea": "KR", "north korea": "KP", "democratic republic of the congo": "CD",
    "dem. rep. congo": "CD", "republic of the congo": "CG", "côte d'ivoire": "CI",
    "ivory coast": "CI", "central african republic": "CF", "south sudan": "SS",
    "equatorial guinea": "GQ", "dominican republic": "DO", "united arab emirates": "AE",
    "saudi arabia": "SA", "new zealand": "NZ", "papua new guinea": "PG",
    "solomon islands": "SB", "timor-leste": "TL", "w. sahara": "EH",
    "western sahara": "EH", "falkland is.": "FK", "somaliland": "SO", "kosovo": "XK",
};

const getIso2Code = (geo: any): string | null => {
    const id = geo.id;
    const name = geo.properties?.name || geo.properties?.NAME || "";
    if (id && numericToIso2[id]) return numericToIso2[id];
    const nameLower = name.toLowerCase().trim();
    if (nameToIso2[nameLower]) return nameToIso2[nameLower];
    const country = countries.find(c =>
        c.name.toLowerCase() === nameLower ||
        nameLower.includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(nameLower)
    );
    if (country) return country.code;
    return null;
};

const getCountryFillColor = (
    iso2: string | null,
    visitedCountries: string[],
    viewMode: 'visited' | 'visa',
    userPassportCode?: string,
    heldVisas?: string[]
): string => {
    if (!iso2) return "rgba(60, 60, 60, 0.3)";

    if (viewMode === 'visited') {
        if (visitedCountries.includes(iso2)) {
            return "rgba(255, 255, 255, 0.9)";
        }
        return "rgba(80, 80, 80, 0.5)";
    }

    if (userPassportCode) {
        if (userPassportCode === iso2) {
            return "rgba(255, 255, 255, 0.9)";
        }
        let visaInfo = getVisaRequirementFromMatrix(userPassportCode, iso2);
        if ((!visaInfo || visaInfo.requirement === 'visa-required') && heldVisas && heldVisas.length > 0) {
            if (heldVisas.includes(iso2)) return "rgba(34, 197, 94, 0.7)";
            const powerGroups = getVisaPowerGroups(heldVisas);
            const hasAccess = powerGroups.some(group => VISA_SUBSTITUTIONS[group]?.includes(iso2));
            if (hasAccess) return "rgba(34, 197, 94, 0.7)";
        }
        if (visaInfo) {
            switch (visaInfo.requirement) {
                case 'visa-free': return "rgba(34, 197, 94, 0.7)";
                case 'visa-on-arrival': return "rgba(132, 204, 22, 0.7)";
                case 'e-visa': return "rgba(234, 179, 8, 0.7)";
                case 'eta': return "rgba(249, 115, 22, 0.7)";
                case 'visa-required': return "rgba(239, 68, 68, 0.6)";
            }
        }
    }
    return "rgba(80, 80, 80, 0.5)";
};

const GlobeMap = ({ visitedCountries, toggleVisited, userPassportCode, heldVisas = [], onCountryClick }: GlobeMapProps) => {
    // Full 360 rotation without latitude clamping
    const [rotation, setRotation] = useState<[number, number, number]>([0, -20, 0]);
    const [isDragging, setIsDragging] = useState(false);
    const lastMousePos = useRef<{ x: number; y: number } | null>(null);
    const [viewMode, setViewMode] = useState<'visited' | 'visa'>('visited');
    const [scale, setScale] = useState(320);
    const initialDistance = useRef<number | null>(null);
    const initialScale = useRef<number>(320);

    const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e && e.touches.length === 2) {
            // Pinch start
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialDistance.current = Math.sqrt(dx * dx + dy * dy);
            initialScale.current = scale;
            return;
        }
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        lastMousePos.current = { x: clientX, y: clientY };
    }, [scale]);

    const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e && e.touches.length === 2 && initialDistance.current) {
            // Pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const newScale = Math.max(150, Math.min(800, initialScale.current * (distance / initialDistance.current)));
            setScale(newScale);
            return;
        }

        if (!isDragging || !lastMousePos.current) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const dx = clientX - lastMousePos.current.x;
        const dy = clientY - lastMousePos.current.y;

        // Full 360 rotation - no clamping on latitude
        setRotation(prev => [
            prev[0] + dx * 0.5, // Inverted: Drag left moves left
            prev[1] - dy * 0.5, // Inverted: Drag up moves up
            prev[2]
        ]);
        lastMousePos.current = { x: clientX, y: clientY };
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        lastMousePos.current = null;
        initialDistance.current = null;
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -30 : 30;
        setScale(prev => Math.max(150, Math.min(800, prev + delta)));
    }, []);

    const handleCountryClick = (geo: any) => {
        const iso2 = getIso2Code(geo);
        if (iso2) {
            if (onCountryClick) {
                onCountryClick(iso2);
            } else if (toggleVisited) {
                toggleVisited(iso2);
            }
        }
    };

    return (
        <div
            className="w-full h-full fixed inset-0 z-[9999] bg-black touch-none cursor-grab active:cursor-grabbing flex flex-col"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
        >
            {/* View Mode Toggle Buttons - Top */}
            <div className="absolute top-20 left-0 right-0 flex justify-center z-[10000] pointer-events-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                <div className="bg-black/60 backdrop-blur-md p-1 rounded-xl flex gap-1 border border-white/10">
                    <button
                        onClick={(e) => { e.stopPropagation(); setViewMode('visited'); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'visited'
                            ? 'bg-white text-black shadow-lg'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Visited
                        </span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (userPassportCode) setViewMode('visa');
                        }}
                        disabled={!userPassportCode}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'visa'
                            ? 'bg-[#D4AF37] text-black shadow-lg'
                            : 'text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Visa Power
                        </span>
                    </button>
                </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[10000] flex flex-col gap-2 pointer-events-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); setScale(prev => Math.min(800, prev + 50)); }}
                    className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setScale(prev => Math.max(150, prev - 50)); }}
                    className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
            </div>

            {/* Globe - Centered higher */}
            <div className="flex-1 flex items-center justify-center" style={{ marginTop: '-60px' }}>
                <ComposableMap
                    projection="geoOrthographic"
                    projectionConfig={{
                        scale: scale,
                        center: [0, 0],
                        rotate: rotation
                    }}
                    style={{ width: "100%", height: "100%", maxHeight: "70vh" }}
                >
                    <Sphere id="globe-sphere" fill="#0a0a0a" stroke="#333" strokeWidth={0.5} />
                    <Graticule stroke="#222" strokeWidth={0.3} />
                    <Geographies geography={worldData}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const iso2 = getIso2Code(geo);
                                const isVisited = iso2 ? visitedCountries.includes(iso2) : false;
                                const fillColor = getCountryFillColor(iso2, visitedCountries, viewMode, userPassportCode, heldVisas);

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCountryClick(geo);
                                        }}
                                        style={{
                                            default: {
                                                fill: fillColor,
                                                stroke: "rgba(255, 255, 255, 0.3)",
                                                strokeWidth: 0.5,
                                                outline: "none",
                                                cursor: "pointer",
                                                transition: "fill 0.3s ease"
                                            },
                                            hover: {
                                                fill: isVisited ? "rgba(255, 255, 255, 1)" : "rgba(200, 200, 200, 0.6)",
                                                stroke: "rgba(255, 255, 255, 0.8)",
                                                strokeWidth: 1,
                                                outline: "none",
                                                cursor: "pointer",
                                            },
                                            pressed: {
                                                fill: "rgba(255, 255, 255, 0.9)",
                                                outline: "none"
                                            }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ComposableMap>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-36 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <p className="text-white/60 text-sm">Drag to rotate • Pinch to zoom • Tap for details</p>
                </div>
            </div>
        </div>
    );
};

export default GlobeMap;
