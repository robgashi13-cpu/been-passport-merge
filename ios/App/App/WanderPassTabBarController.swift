import UIKit
import WebKit
import Capacitor

class WanderPassTabBarController: UITabBarController, UITabBarControllerDelegate {
    
    private var capacitorVC: CAPBridgeViewController?
    
    private let tabItems: [(id: String, title: String, icon: String, selectedIcon: String)] = [
        ("dashboard", "Home", "house", "house.fill"),
        ("map", "Map", "globe", "globe.americas.fill"),
        ("calendar", "Calendar", "calendar", "calendar.circle.fill"),
        ("passport", "Passport", "creditcard", "creditcard.fill")
    ]
    
    override func viewDidLoad() {
        super.viewDidLoad()
        delegate = self
        setupAppearance()
        setupTabs()
        setupCapacitorBridge()  // Setup AFTER tabs so WebView is on top
        
        // Listen for web tab changes
        NotificationCenter.default.addObserver(self, selector: #selector(handleWebTabChange(_:)), name: NSNotification.Name("WebTabChanged"), object: nil)
    }
    
    private func setupCapacitorBridge() {
        // Create the Capacitor WebView
        let bridgeVC = CAPBridgeViewController()
        self.capacitorVC = bridgeVC
        
        // Add the WebView as a child of THIS controller (not a tab)
        // This keeps it always visible regardless of selected tab
        addChild(bridgeVC)
        // Insert WebView BELOW the tab bar explicitly
        view.insertSubview(bridgeVC.view, belowSubview: tabBar)
        
        // Position WebView to fill the screen
        bridgeVC.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            bridgeVC.view.topAnchor.constraint(equalTo: view.topAnchor),
            bridgeVC.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bridgeVC.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            bridgeVC.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        bridgeVC.didMove(toParent: self)
        
        // Ensure WebView is behind the tab bar but in front of tab content
        view.bringSubviewToFront(tabBar)
    }
    
    private func setupAppearance() {
        // iOS 26 Liquid Glass Style Tab Bar
        let appearance = UITabBarAppearance()
        
        // Translucent background with blur
        appearance.configureWithDefaultBackground()
        appearance.backgroundColor = UIColor.black.withAlphaComponent(0.6)
        
        // Add blur effect
        let blurEffect = UIBlurEffect(style: .systemUltraThinMaterialDark)
        appearance.backgroundEffect = blurEffect
        
        // Item appearance
        let itemAppearance = UITabBarItemAppearance()
        
        // Normal state
        itemAppearance.normal.iconColor = UIColor.white.withAlphaComponent(0.5)
        itemAppearance.normal.titleTextAttributes = [
            .foregroundColor: UIColor.white.withAlphaComponent(0.5),
            .font: UIFont.systemFont(ofSize: 10, weight: .medium)
        ]
        
        // Selected state
        itemAppearance.selected.iconColor = .white
        itemAppearance.selected.titleTextAttributes = [
            .foregroundColor: UIColor.white,
            .font: UIFont.systemFont(ofSize: 10, weight: .semibold)
        ]
        
        appearance.stackedLayoutAppearance = itemAppearance
        appearance.inlineLayoutAppearance = itemAppearance
        appearance.compactInlineLayoutAppearance = itemAppearance
        
        tabBar.standardAppearance = appearance
        if #available(iOS 15.0, *) {
            tabBar.scrollEdgeAppearance = appearance
        }
        
        // Add shadow
        tabBar.layer.shadowColor = UIColor.black.cgColor
        tabBar.layer.shadowOffset = CGSize(width: 0, height: -4)
        tabBar.layer.shadowRadius = 16
        tabBar.layer.shadowOpacity = 0.5
        
        // Rounded corners
        tabBar.layer.cornerRadius = 24
        tabBar.layer.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
    }
    
    private func setupTabs() {
        // Create dummy VCs for each tab - their views won't be visible
        // because WebView will be layered on top
        var viewControllers: [UIViewController] = []
        
        for item in tabItems {
            let vc = UIViewController()
            vc.view.backgroundColor = .black
            
            let tabItem = UITabBarItem(
                title: item.title,
                image: UIImage(systemName: item.icon),
                selectedImage: UIImage(systemName: item.selectedIcon)
            )
            vc.tabBarItem = tabItem
            
            viewControllers.append(vc)
        }
        
        self.viewControllers = viewControllers
        selectedIndex = 0
    }
    
    // MARK: - UITabBarControllerDelegate
    
    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {
        guard let index = tabBarController.viewControllers?.firstIndex(of: viewController),
              index < tabItems.count else { return }
        
        let tabId = tabItems[index].id
        
        print("⚡️ Native Tab Bar: User selected tab \(index) = \(tabId)")
        
        // Haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
        
        // Notify the Capacitor plugin via NotificationCenter
        NotificationCenter.default.post(name: NSNotification.Name("NativeTabSelected"), object: nil, userInfo: ["tab": tabId])
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // Ensure tab bar stays on top and visible
        tabBar.isHidden = false
        view.bringSubviewToFront(tabBar)
    }

    @objc func handleWebTabChange(_ notification: Notification) {
        guard let tabId = notification.userInfo?["tab"] as? String,
              let index = tabItems.firstIndex(where: { $0.id == tabId }) else { return }
        
        DispatchQueue.main.async {
            self.selectedIndex = index
        }
    }
}
