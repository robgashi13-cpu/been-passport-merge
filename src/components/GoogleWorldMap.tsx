import { useRef, useEffect } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import axios from 'axios';

interface GoogleWorldMapProps {
    visitedCountries: string[];
    onCountryClick: (countryCode: string) => void;
    selectedCountry?: string | null;
}

export const GoogleWorldMap = ({ visitedCountries, onCountryClick, selectedCountry }: GoogleWorldMapProps) => {
    const mapRef = useRef<HTMLElement>(null);
    const mapInstance = useRef<GoogleMap | null>(null);

    // Cache for GeoJSON features
    const geoJsonCache = useRef<any[]>([]);

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
            let apiKey: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

            // If strictly using Native Config (Info.plist), do not pass an invalid key here.
            if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
                apiKey = undefined;
            }

            mapInstance.current = await GoogleMap.create({
                id: 'my-map',
                element: mapRef.current,
                apiKey: apiKey, // logic: if undefined, plugin looks in Info.plist (iOS) or AndroidManifest (Android)
                config: {
                    center: {
                        lat: 20,
                        lng: 0,
                    },
                    zoom: 2,
                    disableDefaultUI: true, // Hide all controls (Zoom, Map Type, Street View) for clean look
                    styles: [
                        {
                            "elementType": "geometry",
                            "stylers": [{ "color": "#121212" }] // Deeper dark background
                        },
                        {
                            "elementType": "labels",
                            "stylers": [{ "visibility": "off" }] // Hide all labels by default for clean look
                        },
                        {
                            "elementType": "labels.text.fill", // Restore country names/admin if needed, but Skratch is very clean.
                            "stylers": [{ "color": "#757575" }]
                        },
                        {
                            "featureType": "administrative.country",
                            "elementType": "geometry.stroke",
                            "stylers": [{ "color": "#333333" }, { "weight": 1 }] // Subtle borders
                        },
                        {
                            "featureType": "administrative.country",
                            "elementType": "labels",
                            "stylers": [{ "visibility": "simplified" }, { "color": "#888888" }] // Only country labels
                        },
                        {
                            "featureType": "water",
                            "elementType": "geometry",
                            "stylers": [{ "color": "#000000" }] // Black water for contrast
                        },
                        {
                            "featureType": "road",
                            "stylers": [{ "visibility": "off" }] // Hide roads
                        },
                        {
                            "featureType": "poi",
                            "stylers": [{ "visibility": "off" }] // Hide POIs
                        }
                    ]
                },
            });

            // Load polygons after map creation
            loadPolygons();

        } catch (error: any) {
            console.error("Error creating map", error);
            // Alert for debugging on device
            alert(`Map Error: ${error?.message || JSON.stringify(error)}`);
        }
    };

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

            features.forEach((feature: any) => {
                const countryCode = feature.properties.id || feature.id;
                const isVisited = visitedCountries.includes(countryCode);
                const isSelected = selectedCountry === countryCode;

                // Styling Logic
                let fillColor = '#1E1E1E'; // Default Dark Grey
                if (isSelected) fillColor = '#FFFFFF'; // Highlight selected country (White)
                else if (isVisited) fillColor = '#4ade80'; // Visited Green

                const geometry = feature.geometry;
                const coordsList = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;

                coordsList.forEach((coords: any[]) => {
                    const outerRing = coords[0];
                    const path = outerRing.map((p: any) => ({ lat: p[1], lng: p[0] }));

                    polygonsToAdd.push({
                        paths: path,
                        fillColor: fillColor,
                        fillOpacity: 1.0,
                        strokeColor: '#333333',
                        strokeWeight: 1,
                        tag: countryCode,
                        clickable: true
                    });
                });
            });

            await mapInstance.current.addPolygons(polygonsToAdd);

            await mapInstance.current.setOnPolygonClickListener((event) => {
                if (event.tag) {
                    onCountryClick(event.tag);
                }
            });

        } catch (e) {
            console.error("Failed to load map polygons", e);
        }
    };

    useEffect(() => {
        createMap();
        return () => {
            if (mapInstance.current) {
                mapInstance.current.destroy().catch(() => { });
            }
        };
    }, []);

    // Re-run polygon logic when visited countries change
    useEffect(() => {
        if (mapInstance.current && geoJsonCache.current.length > 0) {
            // For now, simpler to recreate or just clear polygons if possible.
            // But existing logic relying on recreate is safer for now.
            // Or we just re-run loadPolygons which adds NEW polygons properly?
            // No, duplicate polygons are bad.
            // Let's just createMap again for simplicity in this phase.
            createMap();
        }
    }, [visitedCountries, selectedCountry]);

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
