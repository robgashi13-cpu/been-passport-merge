import Foundation
import Capacitor

@objc(TabBarPlugin)
public class TabBarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TabBarPlugin"
    public let jsName = "TabBar"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setActiveTab", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getActiveTab", returnType: CAPPluginReturnPromise)
    ]
    
    private var activeTab: String = "dashboard"
    
    @objc func setActiveTab(_ call: CAPPluginCall) {
        guard let tab = call.getString("tab") else {
            call.reject("Tab parameter is required")
            return
        }
        
        activeTab = tab
        
        // Post notification to update native UI
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: NSNotification.Name("WebTabChanged"), object: nil, userInfo: ["tab": tab])
        }
        
        call.resolve(["success": true, "tab": tab])
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
