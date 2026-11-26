import UIKit
import WebKit

/// System tab bar controller so iOS 27.1 can apply Liquid Glass automatically.
/// A single WKWebView is shared across tabs and only its route changes.
///
/// The web view is pinned to this controller's full bounds, inserted behind
/// the system tab bar (or its Liquid Glass wrapper), so the page is
/// edge-to-edge and the glass pill floats over the content. Insets are
/// published as CSS variables; the web view frame is never shrunk, which
/// would leave a system-background strip where the navigation sits.
///
/// ecd956aa added the web view on top of `UITabBarController.view` and hid
/// the chrome. 70a92b2a moved it into the inset child, which made the bar
/// visible but reserved a white strip beside or below it.
///
/// On iPhone / folded Duo the system still caps visible tabs at 5 (4 + More).
/// The web view is hidden while the system More list is showing so it cannot
/// cover that list; selecting a More item reveals it again and navigates.
final class HubTabBarController: UITabBarController, UITabBarControllerDelegate, UINavigationControllerDelegate {
    private let engine = WebEngine()
    private var applyingSelectionFromWeb = false
    private var chromeVisible = true
    private var lastChromeSignature: String?
    private let placementToggle = UIButton(type: .system)
    private var prefersSidebar = true
    private var lastContentPage: HubPageController?
    #if DEBUG
    private var forceMoreForScreenshot = false
    #endif

    override func viewDidLoad() {
        super.viewDidLoad()
        delegate = self
        view.backgroundColor = HQCanvas.color
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

        moreNavigationController.delegate = self
        moreNavigationController.navigationBar.prefersLargeTitles = false

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

        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-HQShowMore") {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) { [weak self] in
                self?.presentMoreForScreenshot()
            }
        }
        #endif
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        attachWebViewToSelectedPage()
        publishChrome()
        layoutPlacementToggle()
        // Keep the toggle above the web content, but never above the system chrome.
        raisePlacementToggleWithoutCoveringChrome()
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
        if isMoreInterface(viewController) {
            return true
        }
        guard let page = contentPage(from: viewController), let tab = HubTab(rawValue: page.tabBarItem.tag) else {
            return true
        }
        guard !applyingSelectionFromWeb else {
            attachWebView(to: page)
            return true
        }
        attachWebView(to: page)
        if selectedViewController === viewController || contentPage(from: selectedViewController) === page {
            engine.scrollToTop()
        } else {
            engine.navigate(to: tab.path)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        }
        return true
    }

    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {
        if isMoreInterface(viewController) {
            moreNavigationController.setNavigationBarHidden(false, animated: false)
            publishChrome()
            return
        }
        if let page = contentPage(from: viewController) {
            attachWebView(to: page)
        }
        publishChrome()
    }

    func navigationController(_ navigationController: UINavigationController, willShow viewController: UIViewController, animated: Bool) {
        guard navigationController === moreNavigationController else { return }
        if let page = viewController as? HubPageController {
            navigationController.setNavigationBarHidden(true, animated: animated)
            attachWebView(to: page)
            if let tab = HubTab(rawValue: page.tabBarItem.tag), !applyingSelectionFromWeb {
                engine.navigate(to: tab.path)
            }
        } else {
            navigationController.setNavigationBarHidden(false, animated: animated)
        }
    }

    func navigationController(_ navigationController: UINavigationController, didShow viewController: UIViewController, animated: Bool) {
        guard navigationController === moreNavigationController else { return }
        if let page = viewController as? HubPageController {
            attachWebView(to: page)
            publishChrome()
        }
    }

    private func selectTab(matching path: String) {
        #if DEBUG
        if forceMoreForScreenshot { return }
        #endif
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
        if isMoreInterface(selectedViewController) {
            hideWebViewForMoreList()
            return
        }
        if let host = selectedViewController, let page = contentPage(from: host) {
            lastContentPage = page
            if page.additionalSafeAreaInsets != .zero {
                page.additionalSafeAreaInsets = .zero
            }
        }
        pinWebViewEdgeToEdge()
    }

    private func attachWebView(to host: UIViewController) {
        if let page = contentPage(from: host) {
            lastContentPage = page
            if page.additionalSafeAreaInsets != .zero {
                page.additionalSafeAreaInsets = .zero
            }
        }
        if isMoreInterface(selectedViewController) {
            hideWebViewForMoreList()
            return
        }
        pinWebViewEdgeToEdge()
    }

    /// Hide the shared web view so the system More list is visible.
    private func hideWebViewForMoreList() {
        engine.webView.isHidden = true
    }

    /// Fill this controller's bounds and sit behind the Liquid Glass chrome.
    private func pinWebViewEdgeToEdge() {
        let webView = engine.webView
        webView.isHidden = false
        webView.translatesAutoresizingMaskIntoConstraints = true
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        if webView.superview !== view {
            webView.removeFromSuperview()
            insertWebViewBehindChrome(webView)
        } else {
            ensureWebViewBehindChrome(webView)
        }
        webView.frame = view.bounds
    }

    private func insertWebViewBehindChrome(_ webView: UIView) {
        if let chrome = chromeContainer() {
            view.insertSubview(webView, belowSubview: chrome)
        } else {
            view.insertSubview(webView, at: 0)
        }
    }

    private func ensureWebViewBehindChrome(_ webView: UIView) {
        guard let chrome = chromeContainer(),
              let webIdx = view.subviews.firstIndex(of: webView),
              let chromeIdx = view.subviews.firstIndex(of: chrome),
              webIdx >= chromeIdx
        else { return }
        view.insertSubview(webView, belowSubview: chrome)
    }

    /// The direct subview of this controller that hosts the tab bar / Liquid Glass.
    /// Only a direct child can be passed to `insertSubview(_:belowSubview:)`.
    private func chromeContainer() -> UIView? {
        var node: UIView? = tabBar
        while let current = node {
            if current.superview === view { return current }
            node = current.superview
        }
        return nil
    }

    private func raisePlacementToggleWithoutCoveringChrome() {
        guard placementToggle.superview === view else { return }
        if let chrome = chromeContainer() {
            view.insertSubview(placementToggle, belowSubview: chrome)
        } else {
            view.bringSubviewToFront(placementToggle)
        }
    }

    private func contentPage(from controller: UIViewController?) -> HubPageController? {
        guard let controller else { return nil }
        if let page = controller as? HubPageController { return page }
        if let nav = controller as? UINavigationController, let page = nav.topViewController as? HubPageController {
            return page
        }
        if let page = unwrapped(controller) as? HubPageController { return page }
        return nil
    }

    private func unwrapped(_ controller: UIViewController) -> UIViewController {
        if let nav = controller as? UINavigationController, let top = nav.topViewController {
            return top
        }
        return controller
    }

    /// System More list / More navigation, not a hub page.
    private func isMoreInterface(_ controller: UIViewController?) -> Bool {
        guard let controller else { return false }
        if controller === moreNavigationController { return true }
        if contentPage(from: controller) != nil { return false }
        let names = [
            String(describing: type(of: controller)),
            String(describing: type(of: unwrapped(controller)))
        ]
        return names.contains { $0.localizedCaseInsensitiveContains("More") }
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
        let insets = resolvedChromeInsets()
        let regular = traitCollection.horizontalSizeClass == .regular
        let chrome = NativeChrome(
            isRegularWidth: regular,
            bottom: chromeVisible ? insets.bottom : 0,
            leading: chromeVisible ? insets.left : 0,
            trailing: chromeVisible ? insets.right : 0,
            top: insets.top
        )
        // Never shrink the child or the web view with additionalSafeAreaInsets:
        // that reserved a white strip under the floating glass bar. Content is
        // cleared with the injected CSS variables instead.
        if let page = contentPage(from: selectedViewController) ?? lastContentPage,
           page.additionalSafeAreaInsets != .zero {
            page.additionalSafeAreaInsets = .zero
        }
        let signature = "\(chrome.isRegularWidth ? 1 : 0)-\(Int(chrome.bottom.rounded()))-\(Int(chrome.leading.rounded()))-\(Int(chrome.trailing.rounded()))-\(Int(chrome.top.rounded()))"
        guard signature != lastChromeSignature else { return }
        lastChromeSignature = signature
        engine.applyNativeChrome(chrome)
    }

    /// Combine UIKit safe-area insets with the on-screen tab bar / Liquid Glass
    /// pill frame. On folded iPhone Duo the vertical status chrome and the
    /// floating tab pill overlay the web view instead of shrinking its frame,
    /// so `safeAreaInsets.right` alone is not enough for the web header.
    private func resolvedChromeInsets() -> UIEdgeInsets {
        let webView = engine.webView
        let host = contentPage(from: selectedViewController) ?? lastContentPage
        var insets = webView.superview != nil ? webView.safeAreaInsets : (host?.view.safeAreaInsets ?? view.safeAreaInsets)
        let windowInsets = webView.window?.safeAreaInsets ?? view.window?.safeAreaInsets ?? .zero
        insets.top = max(insets.top, windowInsets.top)
        insets.left = max(insets.left, windowInsets.left)
        insets.bottom = max(insets.bottom, windowInsets.bottom)
        insets.right = max(insets.right, windowInsets.right)

        if chromeVisible, !tabBar.isHidden, tabBar.alpha > 0.01, tabBar.bounds.width > 1, tabBar.bounds.height > 1 {
            let target: UIView = webView.superview != nil ? webView : (host?.view ?? view)
            let tabFrame = tabBar.convert(tabBar.bounds, to: target)
            let barInRoot = tabBar.convert(tabBar.bounds, to: view)
            let bounds = target.bounds
            if tabFrame.intersects(bounds) {
                let overlap = tabFrame.intersection(bounds).insetBy(dx: -8, dy: -8).intersection(bounds)
                let maxSide = max(bounds.width, bounds.height) * 0.4
                if overlap.width >= overlap.height, overlap.height > 1, overlap.height <= maxSide {
                    if overlap.midY > bounds.midY {
                        insets.bottom = max(insets.bottom, bounds.maxY - overlap.minY)
                    } else {
                        insets.top = max(insets.top, overlap.maxY - bounds.minY)
                    }
                } else if overlap.width > 1, overlap.width <= maxSide {
                    if overlap.midX > bounds.midX {
                        insets.right = max(insets.right, bounds.maxX - overlap.minX)
                    } else {
                        insets.left = max(insets.left, overlap.maxX - bounds.minX)
                    }
                }
            }
            // Liquid Glass on Duo can draw a vertical pill whose UIView frame
            // does not intersect the web view. If the bar is taller than it is
            // wide, still reserve its width on the side it sits on.
            if tabBar.bounds.height > tabBar.bounds.width * 1.2 {
                let pad = tabBar.bounds.width + 12
                if barInRoot.midX >= view.bounds.midX {
                    insets.right = max(insets.right, pad)
                } else {
                    insets.left = max(insets.left, pad)
                }
            } else if tabBar.bounds.width > tabBar.bounds.height * 1.2 {
                let pad = tabBar.bounds.height + 12
                if barInRoot.midY >= view.bounds.midY {
                    insets.bottom = max(insets.bottom, pad)
                }
            }
        }
        return insets
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
        let insets = resolvedChromeInsets()
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

    #if DEBUG
    /// Used by the screenshot job (`simctl launch … -HQShowMore`) so we can
    /// capture the system More list without coordinate tapping.
    fileprivate func presentMoreForScreenshot() {
        let visibleCount = tabBar.items?.count ?? 0
        let titles = (tabBar.items ?? []).compactMap { $0.title }
        let hasMoreItem = titles.contains("More") || visibleCount < HubTab.allCases.count
        guard hasMoreItem else { return }
        forceMoreForScreenshot = true
        selectedViewController = moreNavigationController
        moreNavigationController.setNavigationBarHidden(false, animated: false)
    }
    #endif

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
        view.backgroundColor = HQCanvas.color
        view.clipsToBounds = false
        edgesForExtendedLayout = .all
        extendedLayoutIncludesOpaqueBars = true
    }
}
