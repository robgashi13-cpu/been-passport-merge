import UIKit
import WebKit

final class WebEngine: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    let webView: WKWebView
    var usesBundle = false
    var onRouteChange: ((String) -> Void)?
    var onURLChange: ((URL?) -> Void)?

    private var schemeHandler: BundledWebHandler?
    private var oauthInFlight = false
    private var completingOAuth = false
    private var lastPublishedPath: String?

    static let oauthCaptureScript = """
    (function() {
      try {
        var host = String(location.hostname || '');
        if (location.protocol !== 'https:') return;
        if (host !== 'wanderpass.me' && !host.endsWith('.wanderpass.me')) return;
        var href = String(location.href);
        if (!/(access_token=|refresh_token=|[?&#]code=)/.test(href)) return;
        var w = window.webkit;
        if (w && w.messageHandlers && w.messageHandlers.oauthCallback) {
          w.messageHandlers.oauthCallback.postMessage(href);
        }
      } catch (e) {}
    })();
    """

    static let nativeChromeScript = """
    (function() {
      try {
        window.__HQ_NATIVE__ = true;
        var root = document.documentElement;
        if (root) root.classList.add('hq-native');
        function report() {
          try {
            if (window.__HQ_NAVIGATING__) return;
            var w = window.webkit;
            if (w && w.messageHandlers && w.messageHandlers.hqRoute) {
              w.messageHandlers.hqRoute.postMessage(String(location.pathname || '/'));
            }
          } catch (e) {}
        }
        var push = history.pushState;
        var replace = history.replaceState;
        history.pushState = function() {
          var ret = push.apply(this, arguments);
          report();
          return ret;
        };
        history.replaceState = function() {
          var ret = replace.apply(this, arguments);
          report();
          return ret;
        };
        window.addEventListener('popstate', report);
        window.addEventListener('hashchange', report);
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', report);
        } else {
          report();
        }
      } catch (e) {}
    })();
    """

    override init() {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.allowsAirPlayForMediaPlayback = true
        config.allowsPictureInPictureMediaPlayback = true

        let bundled = BundledWebHandler.bundleAvailable
        var handler: BundledWebHandler?
        if bundled {
            let bundledHandler = BundledWebHandler()
            config.setURLSchemeHandler(bundledHandler, forURLScheme: BundledWebHandler.scheme)
            handler = bundledHandler
        }

        let scripts = config.userContentController
        scripts.addUserScript(WKUserScript(
            source: WebEngine.nativeChromeScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))
        scripts.addUserScript(WKUserScript(
            source: WebEngine.oauthCaptureScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        ))

        let webView = WKWebView(frame: .zero, configuration: config)
        self.webView = webView
        self.usesBundle = bundled
        super.init()
        self.schemeHandler = handler

        scripts.add(self, name: "oauthCallback")
        scripts.add(self, name: "hqRoute")

        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.allowsLinkPreview = true
        webView.isOpaque = false
        webView.backgroundColor = .systemBackground
        webView.scrollView.backgroundColor = .systemBackground
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bouncesZoom = false
        if #available(iOS 15.0, *) {
            webView.underPageBackgroundColor = .systemBackground
        }

        let refresh = UIRefreshControl()
        refresh.addTarget(self, action: #selector(pullToRefresh(_:)), for: .valueChanged)
        webView.scrollView.refreshControl = refresh
    }

    func loadStartPage() {
        let start = usesBundle ? BundledWebHandler.startURL : URL(string: "https://wanderpass.me")
        if let start {
            webView.load(URLRequest(url: start))
        }
    }

    func navigate(to path: String) {
        guard !oauthInFlight, !completingOAuth else { return }
        let current = webView.url
        let onBundled = current?.scheme?.lowercased() == BundledWebHandler.scheme
        let onLive = current.map { OAuthBridge.isLiveSite($0) } ?? false
        if onBundled || onLive {
            let escaped = Self.jsString(path)
            let js = """
            (function(path) {
              try {
                var cur = location.pathname || '/';
                if (cur === path) return;
                window.__HQ_NAVIGATING__ = true;
                history.pushState({}, '', path);
                window.dispatchEvent(new PopStateEvent('popstate'));
                window.__HQ_NAVIGATING__ = false;
              } catch (e) {
                window.__HQ_NAVIGATING__ = false;
              }
            })(\(escaped))
            """
            webView.evaluateJavaScript(js) { [weak self] _, error in
                if error != nil {
                    self?.load(path: path)
                }
            }
        } else {
            load(path: path)
        }
        lastPublishedPath = path
    }

    func scrollToTop() {
        webView.evaluateJavaScript("""
        (function() {
          try {
            var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
            var el = document.scrollingElement || document.documentElement;
            if (el && el !== document.body) el.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
          } catch (e) {}
        })();
        """)
    }

    func setNativeTabBarHeight(_ height: CGFloat) {
        let px = String(format: "%.0f", max(height, 0))
        webView.evaluateJavaScript("""
        (function() {
          try {
            window.__HQ_NATIVE__ = true;
            var r = document.documentElement;
            if (r) {
              r.classList.add('hq-native');
              r.style.setProperty('--hq-native-tabbar-h', '\(px)px');
            }
          } catch (e) {}
        })();
        """)
    }

    private func load(path: String) {
        let base = usesBundle ? BundledWebHandler.startURL : URL(string: "https://wanderpass.me/")!
        guard let url = URL(string: path, relativeTo: base)?.absoluteURL else { return }
        webView.load(URLRequest(url: url))
    }

    private static func jsString(_ value: String) -> String {
        let escaped = value
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: "\\n")
        return "'\(escaped)'"
    }

    @objc func pullToRefresh(_ sender: UIRefreshControl) {
        webView.reload()
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "hqRoute" {
            guard let path = message.body as? String else { return }
            publishRoute(path)
            return
        }
        guard message.name == "oauthCallback", let href = message.body as? String, let url = URL(string: href) else { return }
        completeOAuth(from: url)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.scrollView.refreshControl?.endRefreshing()
        onURLChange?(webView.url)
        publishRouteFromWebView()
        if usesBundle, oauthInFlight, let current = webView.url, OAuthBridge.isLiveSite(current) {
            webView.evaluateJavaScript("String(window.location.href)") { [weak self] result, _ in
                guard let href = result as? String, let url = URL(string: href) else { return }
                if OAuthBridge.hasSessionTokens(url) {
                    self?.completeOAuth(from: url)
                }
            }
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        webView.scrollView.refreshControl?.endRefreshing()
        onURLChange?(webView.url)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        webView.scrollView.refreshControl?.endRefreshing()
        onURLChange?(webView.url)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }

        let scheme = url.scheme?.lowercased() ?? ""
        if scheme == "mailto" || scheme == "tel" || scheme == "sms" || scheme == "facetime" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }

        if usesBundle, handleBundledNavigation(url, in: webView, decisionHandler: decisionHandler) {
            return
        }

        if let frame = navigationAction.targetFrame, !frame.isMainFrame {
            decisionHandler(.allow)
            return
        }

        if navigationAction.navigationType == .linkActivated, shouldOpenExternally(url) {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }

        if navigationAction.targetFrame?.isMainFrame ?? true {
            onURLChange?(url)
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard let url = navigationAction.request.url else { return nil }
        if usesBundle {
            if OAuthBridge.isBrokerPath(url) {
                oauthInFlight = true
                onURLChange?(url)
                if let live = OAuthBridge.liveBrokerURL(from: url) {
                    webView.load(URLRequest(url: live))
                    return nil
                }
            }
            if OAuthBridge.isLiveSite(url) || OAuthBridge.isProviderAuth(url) {
                oauthInFlight = true
                onURLChange?(url)
                if let rewritten = OAuthBridge.rewrittenQueryRedirects(url) {
                    webView.load(URLRequest(url: rewritten))
                } else {
                    webView.load(URLRequest(url: url))
                }
                return nil
            }
            if let rewritten = BundledWebHandler.rewriteLiveSite(url) {
                webView.load(URLRequest(url: rewritten))
                return nil
            }
        }
        if shouldOpenExternally(url) {
            UIApplication.shared.open(url)
        } else {
            webView.load(URLRequest(url: url))
        }
        return nil
    }

    /// Returns true if the decision handler was called.
    private func handleBundledNavigation(_ url: URL, in webView: WKWebView, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) -> Bool {
        // Lovable's Apple sign-in navigates to /~oauth/initiate on the current
        // origin. That route exists only on the live site, not in the bundle.
        if OAuthBridge.isBrokerPath(url) {
            oauthInFlight = true
            onURLChange?(url)
            if let live = OAuthBridge.liveBrokerURL(from: url) {
                decisionHandler(.cancel)
                webView.load(URLRequest(url: live))
                return true
            }
        }

        if OAuthBridge.isProviderAuth(url) {
            oauthInFlight = true
            onURLChange?(url)
            if let rewritten = OAuthBridge.rewrittenQueryRedirects(url), rewritten != url {
                decisionHandler(.cancel)
                webView.load(URLRequest(url: rewritten))
                return true
            }
            decisionHandler(.allow)
            return true
        }

        if OAuthBridge.isLiveSite(url) {
            if OAuthBridge.hasSessionTokens(url) {
                decisionHandler(.cancel)
                completeOAuth(from: url)
                return true
            }
            if oauthInFlight || OAuthBridge.isBrokerPath(url) {
                // Stay on the live allowlisted origin so the broker and Apple
                // callback can finish; a start-of-document script reports the hash.
                onURLChange?(url)
                decisionHandler(.allow)
                return true
            }
            if let rewritten = BundledWebHandler.rewriteLiveSite(url) {
                decisionHandler(.cancel)
                webView.load(URLRequest(url: rewritten))
                return true
            }
        }

        return false
    }

    private func completeOAuth(from liveURL: URL) {
        guard usesBundle, !completingOAuth else { return }
        guard let bundled = OAuthBridge.bundledCallback(from: liveURL) else { return }
        completingOAuth = true
        oauthInFlight = false
        webView.stopLoading()
        webView.load(URLRequest(url: bundled))
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [weak self] in
            self?.completingOAuth = false
            self?.onURLChange?(self?.webView.url)
        }
    }

    private func shouldOpenExternally(_ url: URL) -> Bool {
        let scheme = url.scheme?.lowercased() ?? ""
        if scheme == BundledWebHandler.scheme || scheme == "about" || scheme == "blob" || scheme == "data" || scheme == "javascript" {
            return false
        }
        guard scheme == "http" || scheme == "https" else { return false }
        guard let host = url.host?.lowercased() else { return false }
        return !isInternalHost(host)
    }

    private func isInternalHost(_ host: String) -> Bool {
        if host == "wanderpass.me" || host.hasSuffix(".wanderpass.me") { return true }
        if host == "supabase.co" || host.hasSuffix(".supabase.co") { return true }
        if host == "accounts.google.com" || host == "myaccount.google.com" { return true }
        if host == "appleid.apple.com" { return true }
        if host == "lovable.dev" || host.hasSuffix(".lovable.dev") { return true }
        if host == "oauth.lovable.app" || host.hasSuffix(".lovable.app") { return true }
        return false
    }

    private func publishRouteFromWebView() {
        if let path = webView.url?.path, !path.isEmpty {
            publishRoute(path)
            return
        }
        webView.evaluateJavaScript("String(location.pathname || '/')") { [weak self] result, _ in
            if let path = result as? String {
                self?.publishRoute(path)
            }
        }
    }

    private func publishRoute(_ path: String) {
        guard path != lastPublishedPath else { return }
        lastPublishedPath = path
        DispatchQueue.main.async { [weak self] in
            self?.onRouteChange?(path)
        }
    }
}
