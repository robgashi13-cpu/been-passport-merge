import { useState } from 'react';
import { Upload, Image, MapPin, Calendar, FolderOpen, AlertCircle } from 'lucide-react';
import exifr from 'exifr';
import { TripEntry } from '@/data/trips';
import { countries } from '@/data/countries';

interface PhotoLocation {
    latitude: number;
    longitude: number;
    timestamp: Date;
    filename: string;
}

interface PhotoUploadProps {
    onTripsDetected: (trips: Partial<TripEntry>[]) => void;
}

export const PhotoUpload = ({ onTripsDetected }: PhotoUploadProps) => {
    const [processing, setProcessing] = useState(false);
    const [photoLocations, setPhotoLocations] = useState<PhotoLocation[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
    const [totalPhotosScanned, setTotalPhotosScanned] = useState(0);

    // Reverse geocode coordinates to country/city
    const reverseGeocode = async (lat: number, lon: number): Promise<{ country: string; city?: string }> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
            );
            const data = await response.json();

            return {
                country: data.address?.country || 'Unknown',
                city: data.address?.city || data.address?.town || data.address?.village
            };
        } catch (err) {
            console.error('Geocoding error:', err);
            return { country: 'Unknown' };
        }
    };

    // Request access to Photos folder
    const requestPhotoAccess = async () => {
        setProcessing(true);
        setError(null);
        setPhotoLocations([]);
        setTotalPhotosScanned(0);

        try {
            // Use File System Access API to get directory access
            // @ts-ignore - showDirectoryPicker may not be in all TypeScript definitions
            if ('showDirectoryPicker' in window) {
                // @ts-ignore
                const dirHandle = await window.showDirectoryPicker({
                    id: 'photos',
                    mode: 'read',
                    startIn: 'pictures'
                });

                setPermissionStatus('granted');
                await scanDirectory(dirHandle);
            } else {
                // Fallback for browsers without File System Access API
                setError('Your browser does not support folder access. Please use the file upload instead, or try Chrome/Edge.');
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                // User cancelled
                setPermissionStatus('idle');
            } else {
                setError('Could not access photos. Please try again or use the file upload option.');
                setPermissionStatus('denied');
            }
        } finally {
            setProcessing(false);
        }
    };

    // Scan directory recursively for photos
    const scanDirectory = async (dirHandle: any, depth = 0) => {
        if (depth > 3) return; // Limit recursion depth

        const locations: PhotoLocation[] = [];
        let scanned = 0;

        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file' && entry.name.match(/\.(jpg|jpeg|png)$/i)) {
                try {
                    const file = await entry.getFile();
                    const exif = await exifr.parse(file, {
                        gps: true,
                        pick: ['latitude', 'longitude', 'DateTimeOriginal', 'CreateDate']
                    });

                    if (exif?.latitude && exif?.longitude) {
                        locations.push({
                            latitude: exif.latitude,
                            longitude: exif.longitude,
                            timestamp: exif.DateTimeOriginal || exif.CreateDate || new Date(),
                            filename: file.name
                        });
                    }
                } catch (err) {
                    console.warn(`Could not extract EXIF from ${entry.name}:`, err);
                }
                scanned++;
                setTotalPhotosScanned(prev => prev + 1);
            } else if (entry.kind === 'directory') {
                await scanDirectory(entry, depth + 1);
            }
        }

        if (locations.length > 0) {
            setPhotoLocations(prev => [...prev, ...locations]);
        }

        if (depth === 0 && locations.length === 0 && scanned === 0) {
            setError('No photos found in the selected folder or its subfolders, or no location data found in photos.');
        } else if (depth === 0 && locations.length > 0) {
            await clusterIntoTrips(locations);
        }
    };

    // Fallback for direct file upload
    const handlePhotoUpload = async (files: FileList) => {
        setProcessing(true);
        setError(null);
        const locations: PhotoLocation[] = [];
        setTotalPhotosScanned(0);

        try {
            for (const file of Array.from(files)) {
                try {
                    const exif = await exifr.parse(file, {
                        gps: true,
                        pick: ['latitude', 'longitude', 'DateTimeOriginal', 'CreateDate']
                    });

                    if (exif?.latitude && exif?.longitude) {
                        locations.push({
                            latitude: exif.latitude,
                            longitude: exif.longitude,
                            timestamp: exif.DateTimeOriginal || exif.CreateDate || new Date(),
                            filename: file.name
                        });
                    }
                } catch (err) {
                    console.warn(`Could not extract EXIF from ${file.name}:`, err);
                }
                setTotalPhotosScanned(prev => prev + 1);
            }

            if (locations.length === 0) {
                setError('No location data found in photos. Make sure location services were enabled when photos were taken.');
                setProcessing(false);
                return;
            }

            setPhotoLocations(locations);

            // Cluster locations into trips
            await clusterIntoTrips(locations);
        } catch (err) {
            setError('Error processing photos. Please try again.');
            console.error('Photo upload error:', err);
        } finally {
            setProcessing(false);
        }
    };

    // Cluster photo locations into trips
    const clusterIntoTrips = async (locations: PhotoLocation[]) => {
        // Sort by timestamp
        const sorted = [...locations].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const trips: Partial<TripEntry>[] = [];
        let currentTrip: Partial<TripEntry> | null = null;

        for (const location of sorted) {
            const geocoded = await reverseGeocode(location.latitude, location.longitude);

            // Find matching country
            const country = countries.find(c =>
                c.name.toLowerCase() === geocoded.country.toLowerCase() ||
                geocoded.country.toLowerCase().includes(c.name.toLowerCase())
            );

            if (!country) continue;

            // Check if this location belongs to current trip
            if (currentTrip &&
                currentTrip.countryCode === country.code &&
                currentTrip.endDate) {
                // Extend current trip if within 7 days
                const daysDiff = Math.abs(
                    new Date(location.timestamp).getTime() - new Date(currentTrip.endDate).getTime()
                ) / (1000 * 60 * 60 * 24);

                if (daysDiff <= 7) {
                    currentTrip.endDate = new Date(location.timestamp);
                    continue;
                }
            }

            // Start new trip
            if (currentTrip) {
                trips.push(currentTrip);
            }

            currentTrip = {
                countryCode: country.code,
                countryName: country.name,
                cityName: geocoded.city,
                startDate: new Date(location.timestamp),
                endDate: new Date(location.timestamp),
            };
        }

        // Add final trip
        if (currentTrip) {
            trips.push(currentTrip);
        }

        onTripsDetected(trips);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="text-center py-4">
                <h3 className="font-display text-2xl font-bold mb-2">
                    Import from <span className="text-gradient-white">Photos</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                    Upload photos to automatically extract location data and create trips
                </p>
            </div>

            {/* Upload Area */}
            <div className="bg-gradient-card rounded-xl border border-border/50 p-8">
                <label className="flex flex-col items-center justify-center cursor-pointer hover-lift transition-all">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                        disabled={processing}
                    />

                    <Upload className={`w-16 h-16 mb-4 ${processing ? 'animate-pulse' : ''}`} />

                    <div className="text-center">
                        <div className="font-bold text-lg mb-1">
                            {processing ? 'Processing photos...' : 'Click to upload photos'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Supports JPG, PNG with GPS data
                        </div>
                    </div>
                </label>

                {error && (
                    <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                        {error}
                    </div>
                )}
            </div>

            {/* Photo Locations */}
            {photoLocations.length > 0 && (
                <div className="bg-gradient-card rounded-xl border border-border/50 p-6">
                    <h4 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                        <Image className="w-5 h-5" />
                        Found {photoLocations.length} photos with location data
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {photoLocations.map((loc, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm p-2 bg-secondary/30 rounded">
                                <span className="truncate">{loc.filename}</span>
                                <span className="text-muted-foreground">
                                    {new Date(loc.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="bg-muted/20 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="mb-2"><strong>How it works:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Upload photos with GPS data (location services enabled)</li>
                    <li>We extract coordinates and timestamps from photo metadata</li>
                    <li>Photos are grouped into trips by location and date</li>
                    <li>You can review and edit detected trips before saving</li>
                </ul>
            </div>
        </div>
    );
};
