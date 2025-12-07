import Foundation
import Capacitor
import WidgetKit

@objc(TabBarPlugin)
public class TabBarPlugin: CAPPlugin, CAPBridgedPlugin {
    // ... (rest of class) ...

    @objc func updateWidgetData(_ call: CAPPluginCall) {
        // ... (data reading) ...
        
        if let userDefaults = UserDefaults(suiteName: "group.com.been.passport") {
            // ... (defaults setting) ...
            
            if let mapBase64 = call.getString("mapBase64") {
                userDefaults.set(mapBase64, forKey: "mapImage")
            }
            
            // Reload Timelines
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
            
            call.resolve(["success": true])
        } else {
           // ...
        }
    }
    
    @objc func getActiveTab(_ call: CAPPluginCall) {
        call.resolve(["tab": activeTab])
    }
    
    public override func load() {
        print("⚡️ TabBarPlugin Loaded")
        // Listen for native tab selection changes
        NotificationCenter.default.addObserver(self, selector: #selector(handleNativeTabChange(_:)), name: NSNotification.Name("NativeTabSelected"), object: nil)
    }
    
    @objc func handleNativeTabChange(_ notification: Notification) {
        guard let tab = notification.userInfo?["tab"] as? String else { return }
        print("⚡️ Native Tab Selected: \(tab). Notifying JS listeners.")
        activeTab = tab
        notifyListeners("tabChange", data: ["tab": tab])
    }
}
