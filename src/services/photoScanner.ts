import { registerPlugin } from '@capacitor/core';

export interface ScannedLocation {
    latitude: number;
    longitude: number;
    date: string; // ISO string
}

export interface PhotoScannerPlugin {
    scanPhotos(): Promise<{ photos: ScannedLocation[] }>;
    requestPermissions?(): Promise<{ results: any[] }>; // Add optional method just in case
}

const PhotoScanner = registerPlugin<PhotoScannerPlugin>('PhotoScanner');

export const scanPhotoLibrary = async (): Promise<ScannedLocation[]> => {
    try {
        // Attempt to request permissions if method exists
        if (PhotoScanner.requestPermissions) {
            await PhotoScanner.requestPermissions();
        }

        const result = await PhotoScanner.scanPhotos();
        return result.photos;
    } catch (error) {
        console.error("Error scanning photos:", error);
        return [];
    }
};
