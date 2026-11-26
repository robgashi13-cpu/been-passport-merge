import UIKit
import WebKit

/// System tab bar controller so iOS 27.1 can apply Liquid Glass automatically.
/// A single WKWebView is shared across tabs and only its route changes.
///
/// Root cause of the missing bar in ecd956aa: the web view was added to
/// `UITabBarController.view` with `frame = view.bounds`, which covers the
/// system tab bar (and, on iPhone Duo's inner display, the vertical bar
/// under the status bar). On iOS 27 the Liquid Glass tab bar is not a
/// simple sibling that `bringSubviewToFront(tabBar)` can reliably raise,
/// so the chrome ended up hidden behind the web view.
///
/// Fix: keep the web view inside the selected child view controller, which
/// is the region UITabBarController already lays out under/beside its chrome.
final class HubTabBarController: UITabBarController, UITabBarControllerDelegate {
    private let engine = WebEngine()
    private var applyingSelectionFromWeb = false
    private var chromeVisible = true
    private var lastChromeSignature: String?
    private let placementToggle = UIButton(type: .system)
    private var prefersSidebar = true

    override func viewDidLoad() {
        super.viewDidLoad()
        delegate = self
        view.backgroundColor = .systemBackground
        tabBar.isTranslucent = true
        // Do not set a custom appearance or background — the SDK supplies Liquid Glass.
        tabBarMinimizeBehavior = .onScrollDown

        // iOS 27: iPhone apps show a bottom tab bar by default on every size.
        // Opting into the sidebar makes the system show a sidebar when there
        // is room (regular horizontal size class, e.g. iPhone Duo inner display).
        // Apple's WWDC26 guidance: on iPhone there is no system sidebar/tab
        // toggle, so we add a visible control that flips preferredPlacement.
        if #available(iOS 18.0, *) {
            mode = .tabSidebar
        }
        sidebar.preferredPlacement = .sidebar
        sidebar.delegate = self

        viewControllers = HubTab.allCases.map { tab in
            let page = HubPageController()
            page.tabBarItem = tab.tabBarItem
            return page
        }

        engine.onRouteChange = { [weak self] path in
            self?.selectTab(matching: path)
        }
        engine.onURLChange = { [weak self] url in
            self?.updateChromeVisibility(for: url)
        }

        configurePlacementToggle()
        attachWebViewToSelectedPage()
        engine.loadStartPage()
        publishChrome()
        updatePlacementToggle()

        registerForTraitChanges([UITraitHorizontalSizeClass.self, UITraitVerticalSizeClass.self]) { (self: HubTabBarController, _) in
            self.attachWebViewToSelectedPage()
            self.publishChrome()
            self.updatePlacementToggle()
        }
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        attachWebViewToSelectedPage()
        publishChrome()
        layoutPlacementToggle()
        // Keep the toggle above the web content, but never above the system chrome.
        view.bringSubviewToFront(placementToggle)
    }

    override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
        super.viewWillTransition(to: size, with: coordinator)
        // Fold/unfold resizes the scene; do not reload the web app.
        coordinator.animate(alongsideTransition: { [weak self] _ in
            self?.attachWebViewToSelectedPage()
            self?.publishChrome()
            self?.updatePlacementToggle()
        }, completion: { [weak self] _ in
            self?.attachWebViewToSelectedPage()
            self?.publishChrome()
            self?.updatePlacementToggle()
        })
    }

    func tabBarController(_ tabBarController: UITabBarController, shouldSelect viewController: UIViewController) -> Bool {
        guard !applyingSelectionFromWeb else {
            attachWebView(to: viewController)
            return true
        }
        guard let tab = HubTab(rawValue: viewController.tabBarItem.tag) else { return true }
        attachWebView(to: viewController)
        if selectedViewController === viewController {
            engine.scrollToTop()
        } else {
            engine.navigate(to: tab.path)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        }
        return true
    }

    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {
        attachWebView(to: viewController)
        publishChrome()
    }

    private func selectTab(matching path: String) {
        guard let tab = HubTab.matching(path: path) else { return }
        guard let pages = viewControllers, tab.rawValue < pages.count else { return }
        guard selectedIndex != tab.rawValue else { return }
        applyingSelectionFromWeb = true
        attachWebView(to: pages[tab.rawValue])
        selectedIndex = tab.rawValue
        applyingSelectionFromWeb = false
        publishChrome()
    }

    private func attachWebViewToSelectedPage() {
        if let host = selectedViewController {
            attachWebView(to: host)
        }
    }

    private func attachWebView(to host: UIViewController) {
        let page = unwrapped(host)
        let webView = engine.webView
        if webView.superview !== page.view {
            webView.removeFromSuperview()
            webView.translatesAutoresizingMaskIntoConstraints = true
            webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            page.view.addSubview(webView)
        }
        webView.frame = page.view.bounds
    }

    private func unwrapped(_ controller: UIViewController) -> UIViewController {
        if let nav = controller as? UINavigationController, let top = nav.topViewController {
            return top
        }
        return controller
    }

    private func updateChromeVisibility(for url: URL?) {
        let visible = Self.shouldShowChrome(for: url)
        guard visible != chromeVisible else { return }
        chromeVisible = visible
        tabBar.alpha = visible ? 1 : 0
        tabBar.isUserInteractionEnabled = visible
        updatePlacementToggle()
        publishChrome()
    }

    private func publishChrome() {
        let host = selectedViewController.map { unwrapped($0) }
        let insets = host?.view.safeAreaInsets ?? view.safeAreaInsets
        let regular = traitCollection.horizontalSizeClass == .regular
        let chrome = NativeChrome(
            isRegularWidth: regular,
            bottom: chromeVisible ? insets.bottom : 0,
            leading: chromeVisible ? insets.left : 0,
            trailing: chromeVisible ? insets.right : 0,
            top: insets.top
        )
        let signature = "\(chrome.isRegularWidth ? 1 : 0)-\(Int(chrome.bottom))-\(Int(chrome.leading))-\(Int(chrome.trailing))-\(Int(chrome.top))"
        guard signature != lastChromeSignature else { return }
        lastChromeSignature = signature
        engine.applyNativeChrome(chrome)
    }

    private func configurePlacementToggle() {
        var config = UIButton.Configuration.filled()
        config.cornerStyle = .capsule
        config.baseBackgroundColor = UIColor.secondarySystemBackground.withAlphaComponent(0.92)
        config.baseForegroundColor = UIColor.label
        config.image = UIImage(systemName: "sidebar.left")
        config.preferredSymbolConfigurationForImage = UIImage.SymbolConfiguration(pointSize: 15, weight: .semibold)
        config.contentInsets = NSDirectionalEdgeInsets(top: 8, leading: 8, bottom: 8, trailing: 8)
        placementToggle.configuration = config
        placementToggle.translatesAutoresizingMaskIntoConstraints = true
        placementToggle.accessibilityLabel = "Switch between sidebar and tab bar"
        placementToggle.addTarget(self, action: #selector(togglePlacement), for: .touchUpInside)
        placementToggle.isHidden = true
        view.addSubview(placementToggle)
    }

    @objc private func togglePlacement() {
        prefersSidebar.toggle()
        sidebar.preferredPlacement = prefersSidebar ? .sidebar : .tabBar
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        updatePlacementToggle()
        // Let the system finish the placement change, then republish safe-area insets.
        DispatchQueue.main.async { [weak self] in
            self?.publishChrome()
            self?.updatePlacementToggle()
        }
    }

    private func updatePlacementToggle() {
        let available = chromeVisible && sidebar.isAvailable
        placementToggle.isHidden = !available
        placementToggle.isEnabled = available
        let sidebarActive = prefersSidebar && sidebar.preferredPlacement != .tabBar
        placementToggle.accessibilityValue = sidebarActive ? "Sidebar" : "Tab bar"
        if var config = placementToggle.configuration {
            config.image = UIImage(systemName: sidebarActive ? "dock.rectangle" : "sidebar.left")
            placementToggle.configuration = config
        }
        layoutPlacementToggle()
    }

    private func layoutPlacementToggle() {
        let size: CGFloat = 36
        let insets = view.safeAreaInsets
        let x = max(insets.right, 10)
        let y = max(insets.top, 10)
        placementToggle.frame = CGRect(
            x: view.bounds.width - x - size,
            y: y + 4,
            width: size,
            height: size
        )
        placementToggle.layer.cornerRadius = size / 2
    }

    private static func shouldShowChrome(for url: URL?) -> Bool {
        guard let url else { return true }
        let scheme = url.scheme?.lowercased() ?? ""
        if scheme == BundledWebHandler.scheme { return !OAuthBridge.isBrokerPath(url) }
        if OAuthBridge.isBrokerPath(url) { return false }
        if OAuthBridge.isProviderAuth(url) { return false }
        if OAuthBridge.isLiveSite(url) { return true }
        return false
    }
}

extension HubTabBarController: UITabBarController.Sidebar.Delegate {
    func tabBarController(_ tabBarController: UITabBarController, sidebarAvailabilityDidChange sidebar: UITabBarController.Sidebar) {
        updatePlacementToggle()
        publishChrome()
    }
}

final class HubPageController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        view.clipsToBounds = true
    }
}
