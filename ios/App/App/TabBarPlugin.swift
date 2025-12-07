import Foundation
import Capacitor
import UIKit

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

class WanderPassTabBarController: CAPBridgeViewController, UITabBarDelegate {
    
    private let tabBar = UITabBar()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupTabBar()
        
        // Listen for web tab changes
        NotificationCenter.default.addObserver(self, selector: #selector(handleWebTabChange(_:)), name: NSNotification.Name("WebTabChanged"), object: nil)
    }
    
    private func setupTabBar() {
        view.addSubview(tabBar)
        tabBar.translatesAutoresizingMaskIntoConstraints = false
        tabBar.delegate = self
        
        // Items
        let items: [UITabBarItem] = [
            UITabBarItem(title: "Home", image: UIImage(systemName: "house"), selectedImage: UIImage(systemName: "house.fill")),
            UITabBarItem(title: "Map", image: UIImage(systemName: "globe"), selectedImage: UIImage(systemName: "globe.americas.fill")),
            UITabBarItem(title: "Calendar", image: UIImage(systemName: "calendar"), selectedImage: UIImage(systemName: "calendar.circle.fill")),
            UITabBarItem(title: "Passport", image: UIImage(systemName: "creditcard"), selectedImage: UIImage(systemName: "creditcard.fill"))
        ]
        // Assign tags for identification
        items[0].tag = 0
        items[1].tag = 1
        items[2].tag = 2
        items[3].tag = 3
        
        tabBar.setItems(items, animated: false)
        tabBar.selectedItem = items[0]
        
        // Appearance
        let appearance = UITabBarAppearance()
        appearance.configureWithDefaultBackground()
        // Translucent dark background
        appearance.backgroundColor = UIColor.black.withAlphaComponent(0.85)
        let blur = UIBlurEffect(style: .systemThickMaterialDark)
        appearance.backgroundEffect = blur
        
        // Item Appearance
        let itemAppearance = UITabBarItemAppearance()
        itemAppearance.normal.iconColor = UIColor.white.withAlphaComponent(0.5)
        itemAppearance.normal.titleTextAttributes = [.foregroundColor: UIColor.white.withAlphaComponent(0.5)]
        
        itemAppearance.selected.iconColor = .white
        itemAppearance.selected.titleTextAttributes = [.foregroundColor: UIColor.white]
        
        appearance.stackedLayoutAppearance = itemAppearance
        appearance.inlineLayoutAppearance = itemAppearance
        appearance.compactInlineLayoutAppearance = itemAppearance
        
        tabBar.standardAppearance = appearance
        if #available(iOS 15.0, *) {
            tabBar.scrollEdgeAppearance = appearance
        }
        
        // Constraints - Pin to bottom
        NSLayoutConstraint.activate([
            tabBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tabBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tabBar.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
    
    // MARK: - UITabBarDelegate
    func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        let tabs = ["dashboard", "map", "calendar", "passport"]
        let index = item.tag
        
        if index < tabs.count {
            let tabId = tabs[index]
            print("⚡️ Custom TabBar: Selected \(tabId)")
            
            // Haptic Feedback
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
            
            // Notify Web Context via Global Function Call (Robust)
            let js = "window.onNativeTabChange && window.onNativeTabChange('\(tabId)')"
            DispatchQueue.main.async {
                self.bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)
            }
        }
    }
    
    // Handle Web -> Native Sync
    @objc func handleWebTabChange(_ notification: Notification) {
        guard let tabId = notification.userInfo?["tab"] as? String else { return }
        let tabs = ["dashboard", "map", "calendar", "passport"]
        
        if let index = tabs.firstIndex(of: tabId) {
            DispatchQueue.main.async {
                self.tabBar.selectedItem = self.tabBar.items?[index]
            }
        }
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        view.bringSubviewToFront(tabBar)
    }
}
