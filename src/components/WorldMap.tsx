import { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { countries, getCountryByCode } from '@/data/countries';
import { getVisaRequirementFromMatrix, getVisaRequirementColor, getVisaRequirementLabel, VisaRequirement } from '@/data/visaMatrix';
import { VISA_SUBSTITUTIONS, AVAILABLE_ADDITIONAL_VISAS, getVisaPowerGroups } from '@/data/visaSubstitutions';
import { MapPin, Globe, CreditCard, Maximize2, Minimize2 } from 'lucide-react';
import { StatusBar } from '@capacitor/status-bar';

// Import TopoJSON data
import worldData from '@/data/world-110m.json';
import { createPortal } from "react-dom";

interface WorldMapProps {
  visitedCountries: string[];
  toggleVisited?: (code: string) => void;
  userPassportCode?: string; // Add passport to show visa colors
  heldVisas?: string[];
  bucketList?: string[];
  onCountryClick?: (code: string) => void;
  isFullScreen?: boolean;
}

// Comprehensive numeric ID to ISO2 mapping from Natural Earth / world-110m.json
const numericToIso2: Record<string, string> = {
  // Europe
  "8": "AL", "20": "AD", "40": "AT", "112": "BY", "56": "BE", "70": "BA", "100": "BG",
  "191": "HR", "196": "CY", "203": "CZ", "208": "DK", "233": "EE", "246": "FI", "250": "FR",
  "276": "DE", "300": "GR", "348": "HU", "352": "IS", "372": "IE", "380": "IT", "428": "LV",
  "438": "LI", "440": "LT", "442": "LU", "807": "MK", "470": "MT", "498": "MD", "492": "MC",
  "499": "ME", "528": "NL", "578": "NO", "616": "PL", "620": "PT", "642": "RO", "643": "RU",
  "674": "SM", "688": "RS", "703": "SK", "705": "SI", "724": "ES", "752": "SE", "756": "CH",
  "792": "TR", "804": "UA", "826": "GB", "336": "VA",
  // Americas
  "28": "AG", "32": "AR", "44": "BS", "52": "BB", "84": "BZ", "68": "BO", "76": "BR",
  "124": "CA", "152": "CL", "170": "CO", "188": "CR", "192": "CU", "212": "DM", "214": "DO",
  "218": "EC", "222": "SV", "308": "GD", "320": "GT", "328": "GY", "332": "HT", "340": "HN",
  "388": "JM", "484": "MX", "558": "NI", "591": "PA", "600": "PY", "604": "PE", "630": "PR",
  "662": "LC", "670": "VC", "740": "SR", "780": "TT", "840": "US", "858": "UY", "862": "VE",
  // Asia
  "4": "AF", "51": "AM", "31": "AZ", "48": "BH", "50": "BD", "64": "BT", "96": "BN",
  "116": "KH", "156": "CN", "268": "GE", "344": "HK", "356": "IN", "360": "ID", "364": "IR",
  "368": "IQ", "376": "IL", "392": "JP", "400": "JO", "398": "KZ", "414": "KW", "417": "KG",
  "418": "LA", "422": "LB", "446": "MO", "458": "MY", "462": "MV", "496": "MN", "104": "MM",
  "524": "NP", "408": "KP", "512": "OM", "586": "PK", "275": "PS", "608": "PH", "634": "QA",
  "682": "SA", "702": "SG", "410": "KR", "144": "LK", "760": "SY", "762": "TJ", "764": "TH",
  "626": "TL", "795": "TM", "784": "AE", "860": "UZ", "704": "VN", "887": "YE",
  // Africa
  "12": "DZ", "24": "AO", "204": "BJ", "72": "BW", "854": "BF", "108": "BI", "120": "CM",
  "132": "CV", "140": "CF", "148": "TD", "174": "KM", "178": "CG", "180": "CD", "262": "DJ",
  "818": "EG", "226": "GQ", "232": "ER", "748": "SZ", "231": "ET", "266": "GA", "270": "GM",
  "288": "GH", "324": "GN", "624": "GW", "384": "CI", "404": "KE", "426": "LS", "430": "LR",
  "434": "LY", "450": "MG", "454": "MW", "466": "ML", "478": "MR", "480": "MU", "504": "MA",
  "508": "MZ", "516": "NA", "562": "NE", "566": "NG", "646": "RW", "678": "ST", "686": "SN",
  "690": "SC", "694": "SL", "706": "SO", "710": "ZA", "728": "SS", "729": "SD", "834": "TZ",
  "768": "TG", "788": "TN", "800": "UG", "894": "ZM", "716": "ZW",
  // Oceania
  "36": "AU", "242": "FJ", "296": "KI", "584": "MH", "583": "FM", "520": "NR", "554": "NZ",
  "585": "PW", "598": "PG", "882": "WS", "90": "SB", "776": "TO", "798": "TV", "548": "VU",
  // Caribbean & others
  "660": "AI", "533": "AW", "136": "KY", "531": "CW", "312": "GP", "474": "MQ",
  "652": "BL", "663": "MF", "534": "SX", "796": "TC", "850": "VI", "92": "VG",
  // Additional entries
  "732": "EH", "540": "NC",
};

// Name-based fallback mapping
const nameToIso2: Record<string, string> = {
  "czechia": "CZ", "czech republic": "CZ", "czech rep.": "CZ",
  "united states of america": "US", "united states": "US", "usa": "US",
  "united kingdom": "GB", "great britain": "GB", "britain": "GB",
  "bosnia and herz.": "BA", "bosnia and herzegovina": "BA", "bosnia": "BA",
  "north macedonia": "MK", "macedonia": "MK", "n. macedonia": "MK",
  "south korea": "KR", "korea": "KR", "republic of korea": "KR",
  "north korea": "KP", "dem. rep. korea": "KP", "dpr korea": "KP",
  "democratic republic of the congo": "CD", "dem. rep. congo": "CD", "dr congo": "CD", "drc": "CD",
  "republic of the congo": "CG", "congo": "CG",
  "côte d'ivoire": "CI", "ivory coast": "CI", "cote d'ivoire": "CI",
  "central african republic": "CF", "central african rep.": "CF",
  "south sudan": "SS", "s. sudan": "SS",
  "equatorial guinea": "GQ", "eq. guinea": "GQ",
  "dominican republic": "DO", "dominican rep.": "DO",
  "united arab emirates": "AE", "uae": "AE",
  "saudi arabia": "SA", "new zealand": "NZ", "papua new guinea": "PG",
  "solomon islands": "SB", "solomon is.": "SB",
  "timor-leste": "TL", "east timor": "TL",
  "w. sahara": "EH", "western sahara": "EH",
  "falkland is.": "FK", "falkland islands": "FK",
  "fr. s. antarctic lands": "TF",
  "somaliland": "SO", "n. cyprus": "CY", "kosovo": "XK",
};

// Get ISO2 code from geography properties
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

// Get country fill color based on visa requirement or visited status
const getCountryFillColor = (
  iso2: string | null,
  visitedCountries: string[],
  userPassportCode?: string,
  heldVisas?: string[]
): string => {
  if (!iso2) return "rgba(60, 60, 60, 0.3)";

  // If visited, show white
  if (visitedCountries.includes(iso2)) {
    return "rgba(255, 255, 255, 0.9)";
  }

  // If user has passport selected, show visa colors
  if (userPassportCode && userPassportCode !== iso2) {
    let visaInfo = getVisaRequirementFromMatrix(userPassportCode, iso2);

    // Check for substitutions (Held Visas)
    if ((!visaInfo || visaInfo.requirement === 'visa-required') && heldVisas && heldVisas.length > 0) {
      // 1. Direct Visa held for this country
      if (heldVisas.includes(iso2)) {
        return "rgba(34, 197, 94, 0.7)";
      }

      // 2. Visa Substitutions (Power Groups)
      const powerGroups = getVisaPowerGroups(heldVisas);
      const hasAccess = powerGroups.some(group => VISA_SUBSTITUTIONS[group]?.includes(iso2));
      if (hasAccess) {
        return "rgba(34, 197, 94, 0.7)";
      }
    }

    if (visaInfo) {
      switch (visaInfo.requirement) {
        case 'visa-free': return "rgba(34, 197, 94, 0.7)"; // Green
        case 'visa-on-arrival': return "rgba(132, 204, 22, 0.7)"; // Lime
        case 'e-visa': return "rgba(234, 179, 8, 0.7)"; // Yellow
        case 'eta': return "rgba(249, 115, 22, 0.7)"; // Orange
        case 'visa-required': return "rgba(239, 68, 68, 0.6)"; // Red
      }
    }
  }

  // Default unvisited
  return "rgba(80, 80, 80, 0.5)";
};

const WorldMap = ({ visitedCountries, toggleVisited, userPassportCode, heldVisas = [], onCountryClick, isFullScreen: externalIsFullScreen = false }: WorldMapProps) => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [internalIsFullScreen, setInternalIsFullScreen] = useState(false);
  const isFullScreen = externalIsFullScreen || internalIsFullScreen;

  // Handle True Full Screen (Hide Status Bar)
  useEffect(() => {
    const handleFullScreenChange = async () => {
      try {
        if (isFullScreen) {
          await StatusBar.hide();
        } else {
          await StatusBar.show();
        }
      } catch (err) {
        console.warn("StatusBar plugin not available or failed:", err);
      }
    };
    handleFullScreenChange();

    return () => {
      // Ensure status bar returns on unmount/cleanup if we were in fullscreen
      if (isFullScreen) {
        StatusBar.show().catch(() => { });
      }
    };
  }, [isFullScreen]);

  const [tooltipContent, setTooltipContent] = useState<{
    name: string;
    flag: string;
    visited: boolean;
    visaInfo?: { requirement: VisaRequirement; duration?: string };
  } | null>(null);

  const visitedCount = visitedCountries.length;
  const percentage = Math.round((visitedCount / countries.length) * 100);
  const userPassport = userPassportCode ? getCountryByCode(userPassportCode) : null;

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

  const handleCountryHover = (geo: any) => {
    const iso2 = getIso2Code(geo);
    const name = geo.properties?.name || "Unknown";

    if (iso2) {
      const country = getCountryByCode(iso2);
      let visaInfo = userPassportCode ? getVisaRequirementFromMatrix(userPassportCode, iso2) : null;

      // Check substitutions
      if (userPassportCode && (!visaInfo || visaInfo.requirement === 'visa-required') && heldVisas.length > 0) {
        // 1. Direct Visa
        if (heldVisas.includes(iso2)) {
          visaInfo = { requirement: 'visa-free', duration: 'Visa Held', notes: 'Direct Visa Access' };
        } else {
          // 2. Power Groups
          const powerGroups = getVisaPowerGroups(heldVisas);
          const substitutedGroup = powerGroups.find(group => VISA_SUBSTITUTIONS[group]?.includes(iso2));

          if (substitutedGroup) {
            const label = substitutedGroup === 'SCHENGEN_VISA' ? 'Schengen Visa' :
              substitutedGroup === 'US_VISA' ? 'US Visa' :
                substitutedGroup.replace('_VISA', ' Visa');
            visaInfo = { requirement: 'visa-free', duration: `via ${label}`, notes: 'Visa Substitution' };
          }
        }
      }

      if (country) {
        setHoveredCountry(iso2);
        setTooltipContent({
          name: country.name,
          flag: country.flagEmoji,
          visited: visitedCountries.includes(iso2),
          visaInfo: visaInfo ? { requirement: visaInfo.requirement, duration: visaInfo.duration } : undefined
        });
        return;
      }
    }

    setHoveredCountry(null);
    setTooltipContent({ name, flag: "🌍", visited: false });
  };

  const [viewMode, setViewMode] = useState<'visited' | 'visa'>('visited');
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomChange = (position: { k: number, x: number, y: number }) => {
    setZoomLevel(position.k);
  };

  const MapContent = (
    <div className={`space-y-4 md:space-y-6 animate-fade-in flex flex-col transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[9999] bg-black w-screen h-screen touch-none' : 'h-full'}`}>
      <div className={`text-center py-4 md:py-6 flex-shrink-0 relative pointer-events-none ${isFullScreen ? 'hidden' : ''}`}>
        {!isFullScreen && (
          <h2 className="font-display text-2xl md:text-4xl font-bold mb-2 animate-slide-up">
            World <span className="text-gradient-white">Explorer</span>
          </h2>
        )}

        {/* View Mode Toggle - Only show if NOT fullscreen */}
        {!isFullScreen && (
          <div className="flex justify-center mt-4 mb-2 animate-slide-up pointer-events-auto" style={{ animationDelay: "0.1s" }}>
            <div className="bg-white/10 p-1 rounded-xl flex gap-1 border border-white/10 backdrop-blur-md relative">
              <button
                onClick={() => setViewMode('visited')}
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
                onClick={() => {
                  if (userPassportCode) setViewMode('visa');
                  else alert("Please select a passport first (Header > Passport Icon)");
                }}
                disabled={!userPassportCode}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'visa'
                  ? 'bg-[#D4AF37] text-black shadow-lg shadow-gold/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Visa Power
                </span>
              </button>
            </div>
          </div>
        )}

        {!isFullScreen && (
          <p className="text-sm md:text-base text-muted-foreground animate-slide-up" style={{ animationDelay: "0.2s" }}>
            {viewMode === 'visa' && userPassportCode ? (
              <span className="flex items-center justify-center gap-2 text-gold">
                <span className="text-lg">{userPassport?.flagEmoji}</span>
                Showing visa requirements for {userPassport?.name} passport
              </span>
            ) : (
              "Mark your travels and explore the world"
            )}
          </p>
        )}
      </div>

      {/* Interactive 2D Map */}
      <div className={`relative bg-gradient-card rounded-xl md:rounded-2xl border border-border/50 overflow-hidden hover-glow transition-all duration-500 flex-grow flex flex-col ${isFullScreen ? 'h-full rounded-none border-none' : 'p-2 md:p-8'}`}>
        {/* Full Screen Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent map click
            setInternalIsFullScreen(!internalIsFullScreen);
          }}
          className={`absolute z-[10000] p-2 md:p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all shadow-xl ${isFullScreen ? 'bottom-10 right-4' : 'bottom-4 right-4'}`}
        >
          {isFullScreen ? <Minimize2 className="w-5 h-5 md:w-6 md:h-6" /> : <Maximize2 className="w-5 h-5 md:w-6 md:h-6" />}
        </button>

        {/* ... Tooltip ... */}
        {tooltipContent && (
          // ... existing tooltip ...
          <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 bg-black/95 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl border border-white/20 shadow-2xl backdrop-blur-sm animate-fade-in max-w-[200px] md:max-w-none pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl">{tooltipContent.flag}</span>
              <span className="font-semibold text-sm md:text-base truncate">{tooltipContent.name}</span>
            </div>
            {tooltipContent.visited && (
              <span className="text-green-400 text-xs md:text-sm font-medium">✓ Visited</span>
            )}
            {tooltipContent.visaInfo && (viewMode === 'visa' || !tooltipContent.visited) && (
              <div className="mt-1 text-xs">
                <span
                  className="px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: `${getVisaRequirementColor(tooltipContent.visaInfo.requirement)}20`,
                    color: getVisaRequirementColor(tooltipContent.visaInfo.requirement)
                  }}
                >
                  {getVisaRequirementLabel(tooltipContent.visaInfo.requirement)}
                </span>
                {tooltipContent.visaInfo.duration && (
                  <span className="ml-2 text-muted-foreground">{tooltipContent.visaInfo.duration}</span>
                )}
              </div>
            )}
          </div>
        )}

        <div
          className="w-full flex-grow relative cursor-pointer transition-all"
          style={{ minHeight: isFullScreen ? "100%" : "400px" }}
        >

          {/* ... Map Component ... */}
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: isFullScreen ? 140 : 100, center: [0, 0] }}
            style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
          >
            {/* ... ZoomableGroup ... */}
            <ZoomableGroup
              zoom={1}
              minZoom={1}
              maxZoom={50}
              translateExtent={[
                [-100, -100],
                [900, 700]
              ]}
              onMove={handleZoomChange}
            >
              <Geographies geography={worldData}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const iso2 = getIso2Code(geo);

                    // Logic for Fill Color
                    let fillColor = "rgba(80, 80, 80, 0.3)"; // Base unvisited

                    if (iso2) {
                      if (viewMode === 'visited') {
                        if (visitedCountries.includes(iso2)) {
                          fillColor = "rgba(255, 255, 255, 0.9)"; // White for visited
                        } else {
                          fillColor = "rgba(80, 80, 80, 0.5)"; // Dark for unvisited
                        }
                      } else if (viewMode === 'visa' && userPassportCode) {
                        // Visa Mode
                        if (userPassportCode === iso2) {
                          fillColor = "rgba(255, 255, 255, 0.9)"; // Your Home/Passport country
                        } else {
                          fillColor = getCountryFillColor(iso2, [], userPassportCode, heldVisas);
                        }
                      }
                    }

                    const isVisited = iso2 ? visitedCountries.includes(iso2) : false;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => handleCountryClick(geo)}
                        onMouseEnter={() => handleCountryHover(geo)}
                        onMouseLeave={() => {
                          setHoveredCountry(null);
                          setTooltipContent(null);
                        }}
                        style={{
                          default: {
                            fill: fillColor,
                            stroke: "rgba(255, 255, 255, 0.2)",
                            strokeWidth: 0.5 / zoomLevel, // Scale stroke width too
                            vectorEffect: "non-scaling-stroke",
                            outline: "none",
                            cursor: "pointer",
                            transition: "all 0.3s ease"
                          },
                          hover: {
                            fill: isVisited && viewMode === 'visited' ? "rgba(255, 255, 255, 1)" : "rgba(200, 200, 200, 0.5)",
                            stroke: "rgba(255, 255, 255, 0.8)",
                            strokeWidth: 1 / zoomLevel,
                            vectorEffect: "non-scaling-stroke",
                            outline: "none",
                            cursor: "pointer",
                          },
                          pressed: {
                            fill: "rgba(255, 255, 255, 0.9)",
                            strokeWidth: 1 / zoomLevel,
                            vectorEffect: "non-scaling-stroke",
                            outline: "none"
                          }
                        }}
                      />
                    );
                  })
                }
              </Geographies>


              {/* Country Labels - Only show at low zoom levels */}
              {zoomLevel < 3 && countries.map((country) => {
                if (!country.coordinates) return null;
                const coordinates: [number, number] = [country.coordinates[1], country.coordinates[0]];
                const isVisited = visitedCountries.includes(country.code);

                // Scale labels based on zoom, but hide entirely at high zoom
                const baseMapUnitSize = 3;
                const fontSize = baseMapUnitSize / zoomLevel;

                return (
                  <Marker key={country.code} coordinates={coordinates}>
                    <text
                      textAnchor="middle"
                      y={fontSize / 2}
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fill: isVisited || viewMode === 'visa' ? "#fff" : "rgba(255,255,255,0.7)",
                        fontSize: `${fontSize}px`,
                        fontWeight: "500",
                        pointerEvents: "none",
                        opacity: zoomLevel > 2 ? 0.5 : 1,
                        textShadow: `0px 0px ${0.3 / zoomLevel}px rgba(0,0,0,0.9)`
                      }}
                    >
                      {country.name}
                    </text>
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* Legend - Hide in FullScreen */}
        {!isFullScreen && viewMode === 'visa' && userPassportCode ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:gap-4 text-xs md:text-sm flex-shrink-0 animate-fade-in">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded" style={{ backgroundColor: "rgba(34,197,94,0.7)" }} />
              <span className="text-muted-foreground">Visa Free</span>
            </div>
            {/* ... other legend items ... same as before */}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded" style={{ backgroundColor: "rgba(132,204,22,0.7)" }} />
              <span className="text-muted-foreground">On Arrival</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded" style={{ backgroundColor: "rgba(234,179,8,0.7)" }} />
              <span className="text-muted-foreground">e-Visa</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded" style={{ backgroundColor: "rgba(249, 115, 22, 0.7)" }} />
              <span className="text-white/60">ETA</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded" style={{ backgroundColor: "rgba(239,68,68,0.6)" }} />
              <span className="text-muted-foreground">Required</span>
            </div>
          </div>
        ) : !isFullScreen && (
          <div className="mt-4 flex items-center justify-center gap-4 md:gap-8 flex-wrap text-xs md:text-sm flex-shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-md shadow-lg" style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }} />
              <span className="text-muted-foreground font-medium">Visited ({visitedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-md shadow-lg" style={{ backgroundColor: "rgba(80, 80, 80, 0.5)" }} />
              <span className="text-muted-foreground font-medium">Not visited</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick stats - Hide in FullScreen */}
      {!isFullScreen && viewMode === 'visited' && (
        <div className="grid grid-cols-4 gap-2 flex-shrink-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="bg-gradient-card rounded-lg border border-border/50 p-2 text-center hover-lift group transition-all duration-300">
            <MapPin className="w-4 h-4 text-primary mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <div className="font-display text-lg font-bold">{visitedCount}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Countries</div>
          </div>
          <div className="bg-gradient-card rounded-lg border border-border/50 p-2 text-center hover-lift group transition-all duration-300">
            <Globe className="w-4 h-4 text-primary mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <div className="font-display text-lg font-bold">{percentage}%</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Explored</div>
          </div>
          <div className="bg-gradient-card rounded-lg border border-border/50 p-2 text-center hover-lift group transition-all duration-300">
            <div className="w-4 h-4 mx-auto mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-sm">✈️</span>
            </div>
            <div className="font-display text-lg font-bold">{countries.length - visitedCount}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Left</div>
          </div>
          <div className="bg-gradient-card rounded-lg border border-border/50 p-2 text-center hover-lift group transition-all duration-300">
            <div className="w-4 h-4 mx-auto mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-sm">🏆</span>
            </div>
            <div className="font-display text-lg font-bold">{countries.length}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Total</div>
          </div>
        </div>
      )}
    </div >
  );

  if (isFullScreen) {
    return createPortal(MapContent, document.body);
  }

  return MapContent;
};

export default WorldMap;
