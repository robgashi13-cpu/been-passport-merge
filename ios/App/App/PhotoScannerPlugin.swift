import Foundation
import Capacitor
import Photos

@objc(PhotoScannerPlugin)
public class PhotoScannerPlugin: CAPPlugin {

    @objc func scanPhotos(_ call: CAPPluginCall) {
        let status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        
        if status == .authorized || status == .limited {
            self.fetchPhotos(call)
        } else if status == .notDetermined {
            PHPhotoLibrary.requestAuthorization(for: .readWrite) { newStatus in
                if newStatus == .authorized || newStatus == .limited {
                    self.fetchPhotos(call)
                } else {
                    call.reject("Permission denied")
                }
            }
        } else {
            call.reject("Permission denied")
        }
    }
    
    private func fetchPhotos(_ call: CAPPluginCall) {
        DispatchQueue.global(qos: .userInitiated).async {
            let fetchOptions = PHFetchOptions()
            fetchOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
            // Only fetch images
            let assets = PHAsset.fetchAssets(with: .image, options: fetchOptions)
            
            var results: [[String: Any]] = []
            
            assets.enumerateObjects { (asset, count, stop) in
                // We only care about assets that have location data
                if let location = asset.location, let date = asset.creationDate {
                    let dateString = ISO8601DateFormatter().string(from: date)
                    let entry: [String: Any] = [
                        "latitude": location.coordinate.latitude,
                        "longitude": location.coordinate.longitude,
                        "date": dateString
                    ]
                    results.append(entry)
                }
            }
            
            call.resolve([
                "photos": results
            ])
        }
    }
}
