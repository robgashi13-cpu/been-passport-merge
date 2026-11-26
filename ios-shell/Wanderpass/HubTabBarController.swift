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
///
/// On iPhone / folded Duo the system still caps visible tabs at 5 (4 + More).
/// Tapping More used to look like a no-op because `didSelect` / layout
/// attached the shared WKWebView to `moreNavigationController` and covered
/// the system More list. The web view is only attached to `HubPageController`.
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
            if let last = lastContentPage, last.isViewLoaded {
                attachWebView(to: last)
            }
            return
        }
        if let host = selectedViewController {
            attachWebView(to: host)
        }
    }

    private func attachWebView(to host: UIViewController) {
        guard let page = contentPage(from: host) else { return }
        lastContentPage = page
        let webView = engine.webView
        if webView.superview !== page.view {
            webView.removeFromSuperview()
            webView.translatesAutoresizingMaskIntoConstraints = true
            webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            page.view.addSubview(webView)
        }
        webView.frame = page.view.bounds
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
        if let page = contentPage(from: selectedViewController) ?? lastContentPage {
            applyAdditionalSafeArea(on: page, needed: chromeVisible ? insets : UIEdgeInsets(top: insets.top, left: 0, bottom: 0, right: 0))
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
        if let host {
            let extra = host.additionalSafeAreaInsets
            insets = UIEdgeInsets(
                top: max(0, insets.top - extra.top),
                left: max(0, insets.left - extra.left),
                bottom: max(0, insets.bottom - extra.bottom),
                right: max(0, insets.right - extra.right)
            )
        }
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

    private func applyAdditionalSafeArea(on page: UIViewController, needed: UIEdgeInsets) {
        let current = page.view.safeAreaInsets
        let additional = page.additionalSafeAreaInsets
        let system = UIEdgeInsets(
            top: max(0, current.top - additional.top),
            left: max(0, current.left - additional.left),
            bottom: max(0, current.bottom - additional.bottom),
            right: max(0, current.right - additional.right)
        )
        let extra = UIEdgeInsets(
            top: max(0, needed.top - system.top),
            left: max(0, needed.left - system.left),
            bottom: max(0, needed.bottom - system.bottom),
            right: max(0, needed.right - system.right)
        )
        if extra != additional {
            page.additionalSafeAreaInsets = extra
        }
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
        view.backgroundColor = .systemBackground
        view.clipsToBounds = true
    }
}
