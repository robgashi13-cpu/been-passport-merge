import Foundation
import Capacitor
import WidgetKit

@objc(TabBarPlugin)
public class TabBarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TabBarPlugin"
    public let jsName = "TabBar"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateWidgetData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setActiveTab", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getActiveTab", returnType: CAPPluginReturnPromise)
    ]
    
    private var activeTab: String = "dashboard"

    @objc func updateWidgetData(_ call: CAPPluginCall) {
        // Data reading
        let visitedCount = call.getInt("visitedCount")
        let rankTitle = call.getString("rankTitle")
        let rankLevel = call.getInt("rankLevel")
        let percentage = call.getInt("percentage")
        let mapBase64 = call.getString("mapBase64")

        if let userDefaults = UserDefaults(suiteName: "group.com.been.passport") {
            if let count = visitedCount {
                userDefaults.set(count, forKey: "visitedCount")
            }
            if let title = rankTitle {
                userDefaults.set(title, forKey: "rankTitle")
            }
            if let level = rankLevel {
                userDefaults.set(level, forKey: "rankLevel")
            }
            if let pct = percentage {
                userDefaults.set(pct, forKey: "percentage")
            }
            if let base64 = mapBase64 {
                userDefaults.set(base64, forKey: "mapImage")
            }
            
            // Reload Timelines
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
            
            call.resolve(["success": true])
        } else {
           call.reject("Could not access App Group UserDefaults. Make sure App Groups are enabled in Xcode.")
        }
    }
    
    @objc func setActiveTab(_ call: CAPPluginCall) {
        // Sync from JS to Native if needed, but mainly we listen for Native -> JS
        if let tab = call.getString("tab") {
            self.activeTab = tab
            // Here we might want to tell the Native Controller to switch tabs if JS initiated it?
            // NotificationCenter.default.post(name: NSNotification.Name("JSTabSelected"), object: nil, userInfo: ["tab": tab])
        }
        call.resolve()
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
