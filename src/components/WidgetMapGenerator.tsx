import React, { useEffect, useRef } from 'react';
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { toPng } from 'html-to-image';
import worldData from '@/data/world-110m.json';

// Comprehensive numeric ID to ISO2 mapping (Copying essential part or importing if possible)
// For simplicity, we assume we can reuse the mapping or just use the visitedCountries logic simply.
// Ideally, we import the helper from WorldMap, but it's not exported.
// Let's assume we pass a simplified map for now or copy the minimal logic needed.

interface WidgetMapGeneratorProps {
    visitedCountries: string[];
    onSnapshotReady: (base64: string) => void;
}

// Minimal matching logic (simplified version of WorldMap's logic for speed/size)
const getIso2Code = (geo: any, countries: any[]): string | null => {
    // ... logic ...
    // Since we don't have easy access to the full logic without large refactor, 
    // we will rely on ID matching which covers most cases for the snapshot.
    // Or we can export the helper from WorldMap.tsx. 
    // Let's try to export it from WorldMap.tsx first in a separate step? 
    // No, let's just use a basic ID map here for the widget snapshot to keep it self-contained.
    return geo.id ? numericToIso2[geo.id] : null;
};

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
    "660": "AI", "533": "AW", "136": "KY", "531": "CW", "312": "GP", "474": "MQ",
    "652": "BL", "663": "MF", "534": "SX", "796": "TC", "850": "VI", "92": "VG",
    "732": "EH", "540": "NC",
};


export const WidgetMapGenerator = ({ visitedCountries, onSnapshotReady }: WidgetMapGeneratorProps) => {
    const ref = useRef<HTMLDivElement>(null);

    // Trigger snapshot when visitedCountries changes
    useEffect(() => {
        if (ref.current) {
            // Wait for render
            setTimeout(() => {
                if (ref.current) {
                    toPng(ref.current, { cacheBust: true, width: 400, height: 200 })
                        .then((dataUrl) => {
                            // Remove "data:image/png;base64," prefix for Swift Data init if needed
                            // But Data(base64Encoded:) usually wants clean base64.
                            // Actually, let's keep it mostly as is, but strip the header in the parent if needed.
                            const cleanBase64 = dataUrl.replace('data:image/png;base64,', '');
                            onSnapshotReady(cleanBase64);
                        })
                        .catch((err) => {
                            console.error('Failed to snapshot widget map', err);
                        });
                }
            }, 1000); // Delay to ensure map loads
        }
    }, [visitedCountries, onSnapshotReady]);

    return (
        <div
            ref={ref}
            style={{
                position: 'absolute',
                top: -9999,
                left: -9999,
                width: '400px',
                height: '200px',
                background: '#eaddcf', // Vintage sea/paper color
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '4px solid #8b4513' // Optional vintage border frame
            }}
        >
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 60, center: [0, 20] }} // Adjusted for widget aspect ratio
                style={{ width: "100%", height: "100%" }}
            >
                <Geographies geography={worldData}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            const iso2 = numericToIso2[geo.id];
                            const isVisited = iso2 && visitedCountries.includes(iso2);

                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    style={{
                                        default: {
                                            fill: isVisited ? "#8b4513" : "#d6c6b0", // Ink Brown vs Dark Parchment
                                            stroke: "#5e503f", // Dark Coffee stroke
                                            strokeWidth: 0.5,
                                            outline: "none",
                                        },
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
        </div>
    );
};
