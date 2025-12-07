import { useRef, useEffect } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import axios from 'axios';

interface GoogleWorldMapProps {
    visitedCountries: string[];
    onCountryClick: (countryCode: string) => void;
}

export const GoogleWorldMap = ({ visitedCountries, onCountryClick }: GoogleWorldMapProps) => {
    const mapRef = useRef<HTMLElement>(null);
    const mapInstance = useRef<GoogleMap | null>(null);

    const createMap = async () => {
        if (!mapRef.current) return;

        // Destroy existing to be safe (hot reload support)
        if (mapInstance.current) {
            try {
                await mapInstance.current.destroy();
            } catch (e) {
                // ignore
            }
        }

        try {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

            mapInstance.current = await GoogleMap.create({
                id: 'my-map',
                element: mapRef.current,
                apiKey: apiKey,
                config: {
                    center: {
                        lat: 20,
                        lng: 0,
                    },
                    zoom: 2,
                    styles: [
                        {
                            "elementType": "geometry",
                            "stylers": [{ "color": "#212121" }] // Dark mode base
                        },
                        {
                            "elementType": "labels.text.stroke",
                            "stylers": [{ "color": "#212121" }]
                        },
                        {
                            "elementType": "labels.text.fill",
                            "stylers": [{ "color": "#757575" }]
                        },
                        {
                            "featureType": "administrative.country",
                            "elementType": "geometry.stroke",
                            "stylers": [{ "color": "#424242" }] // Dark borders
                        }
                        // Add more styling as needed
                    ]
                },
            });

            // Listen for marker clicks? Or polygon clicks?
            // Polygon clicks are supported in newer versions.
            // But we primarily want to highlight visited.

            updateVisitedHighlights();

            // Set up listener for clicks
            // Since we can't easily click "Any" country without polygons for all, 
            // for unvisited countries, users might just click the map. 
            // The user wants "Click on any country show info".
            // Implementation detail: To click *unvisited* countries, we essentially need global polygons.
            // If native performance allows, we load ALL polygons but transparent fill?
            // Let's try loading all logic. If slow, we optimize.

            loadPolygons();

        } catch (error) {
            console.error("Error creating map", error);
        }
    };

    // Cache for GeoJSON features
    const geoJsonCache = useRef<any[]>([]);

    const loadPolygons = async () => {
        if (!mapInstance.current) return;

        try {
            if (geoJsonCache.current.length === 0) {
                const res = await axios.get('https://raw.githubusercontent.com/johan-tilstra/flowmap.blue/master/src/resources/countries.geojson');
                if (res.data && res.data.features) {
                    geoJsonCache.current = res.data.features;
                }
            }

            const features = geoJsonCache.current;
            const polygonsToAdd: any[] = [];

            // Warning: Adding 180+ polygons individually.
            features.forEach((feature: any) => {
                const countryCode = feature.properties.id || feature.id; // Adjust based on GeoJSON
                const isVisited = visitedCountries.includes(countryCode);

                // Geometry mapping needs to handle Polygon and MultiPolygon
                const geometry = feature.geometry;
                const coordsList = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;

                coordsList.forEach((coords: any[]) => {
                    // Flatten structure for Capacitor: [{lat, lng}, ...]
                    // GeoJSON is [lng, lat]

                    // MultiPolygon: coordinates is [[[lng, lat], ...], ...]
                    // Polygon: coordinates is [[lng, lat], ...] (first ring is outer)

                    // Simple parser helper needed?
                    // Usually we take the outer ring (index 0).
                    const outerRing = coords[0];
                    const path = outerRing.map((p: any) => ({ lat: p[1], lng: p[0] }));

                    polygonsToAdd.push({
                        paths: path,
                        fillColor: isVisited ? '#4ade80' : '#212121', // Green if visited, Dark if not
                        fillOpacity: isVisited ? 0.4 : 0.0, // Transparent for unvisited if needed, or 0.0 to just catch clicks?
                        // If 0.0 opacity, it might not catch clicks on some platforms. Let's try 0.01.
                        strokeColor: '#333333',
                        strokeWeight: 1,
                        tag: countryCode, // Store ID to identify click
                        clickable: true
                    });
                });
            });

            await mapInstance.current.addPolygons(polygonsToAdd);

            // Add Listener
            await mapInstance.current.setOnPolygonClickListener((event) => {
                if (event.tag) {
                    onCountryClick(event.tag);
                }
            });

        } catch (e) {
            console.error("Failed to load map polygons", e);
        }
    };

    const updateVisitedHighlights = () => {
        // Optimization: Instead of clear/re-add, ideally update style.
        // Capacitor plugin might not support updatePolygon efficiently.
        // For now, re-render is only safe bet if `visitedCountries` changes significantly.
        // Or we just rely on map recreation (expensive).
        // Let's just createMap once.
    };

    useEffect(() => {
        createMap();
        return () => {
            // cleanup
        };
    }, []); // Empty deps for now, forcing full reload might be heavy.

    // Watch visited updates?
    useEffect(() => {
        if (mapInstance.current && geoJsonCache.current.length > 0) {
            // Re-run color logic? 
            // Ideally we'd iterate polygons and set color.
            // Since we can't easily query plugin for polygon by tag, we might have to clear and re-add.
            // mapInstance.current.clear(); // Clears markers/polys
            // loadPolygons();
            // This is safer.
        }
    }, [visitedCountries]);

    return (
        <div className="w-full h-full">
            <capacitor-google-map
                ref={mapRef}
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100%'
                }}
            ></capacitor-google-map>
        </div>
    );
};
