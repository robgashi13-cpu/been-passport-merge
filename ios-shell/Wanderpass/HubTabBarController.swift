import UIKit
import WebKit

/// System tab bar controller so iOS 27.1 can apply Liquid Glass automatically.
/// A single WKWebView is shared across tabs and only its route changes.
final class HubTabBarController: UITabBarController, UITabBarControllerDelegate {
    private let engine = WebEngine()
    private var applyingSelectionFromWeb = false
    private var lastTabBarHeight: CGFloat = -1
    private var tabBarVisible = true

    override func viewDidLoad() {
        super.viewDidLoad()
        delegate = self
        view.backgroundColor = .systemBackground
        tabBar.isTranslucent = true
        // Do not set a custom appearance or background — the SDK supplies Liquid Glass.
        tabBarMinimizeBehavior = .onScrollDown
        if #available(iOS 18.0, *) {
            mode = .automatic
        }

        viewControllers = HubTab.allCases.map { tab in
            let page = HubPageController()
            page.tabBarItem = tab.tabBarItem
            return page
        }

        engine.onRouteChange = { [weak self] path in
            self?.selectTab(matching: path)
        }
        engine.onURLChange = { [weak self] url in
            self?.updateTabBarVisibility(for: url)
        }

        embedWebView()
        engine.loadStartPage()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        embedWebView()
        publishTabBarHeight()
    }

    func tabBarController(_ tabBarController: UITabBarController, shouldSelect viewController: UIViewController) -> Bool {
        guard !applyingSelectionFromWeb else { return true }
        guard let tab = HubTab(rawValue: viewController.tabBarItem.tag) else { return true }
        if selectedViewController === viewController {
            engine.scrollToTop()
        } else {
            engine.navigate(to: tab.path)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        }
        return true
    }

    private func selectTab(matching path: String) {
        guard let tab = HubTab.matching(path: path) else { return }
        guard let pages = viewControllers, tab.rawValue < pages.count else { return }
        guard selectedIndex != tab.rawValue else { return }
        applyingSelectionFromWeb = true
        selectedIndex = tab.rawValue
        applyingSelectionFromWeb = false
    }

    private func embedWebView() {
        let webView = engine.webView
        if webView.superview !== view {
            view.addSubview(webView)
        }
        webView.frame = view.bounds
        view.bringSubviewToFront(tabBar)
    }

    private func updateTabBarVisibility(for url: URL?) {
        let visible = Self.shouldShowTabBar(for: url)
        guard visible != tabBarVisible else { return }
        tabBarVisible = visible
        tabBar.alpha = visible ? 1 : 0
        tabBar.isUserInteractionEnabled = visible
        publishTabBarHeight()
    }

    private func publishTabBarHeight() {
        let height: CGFloat = tabBarVisible ? tabBar.frame.height : 0
        guard abs(height - lastTabBarHeight) >= 0.5 else { return }
        lastTabBarHeight = height
        engine.setNativeTabBarHeight(height)
    }

    private static func shouldShowTabBar(for url: URL?) -> Bool {
        guard let url else { return true }
        let scheme = url.scheme?.lowercased() ?? ""
        if scheme == BundledWebHandler.scheme { return !OAuthBridge.isBrokerPath(url) }
        if OAuthBridge.isBrokerPath(url) { return false }
        if OAuthBridge.isProviderAuth(url) { return false }
        if OAuthBridge.isLiveSite(url) { return true }
        return false
    }
}

private final class HubPageController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        view.isUserInteractionEnabled = false
    }
}
