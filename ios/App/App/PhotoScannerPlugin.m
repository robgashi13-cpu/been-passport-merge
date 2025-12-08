#import <Capacitor/Capacitor.h>

CAP_PLUGIN(PhotoScannerPlugin, "PhotoScanner",
           CAP_PLUGIN_METHOD(scanPhotos, CAPPluginReturnPromise);)
