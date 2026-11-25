import SwiftUI
import UIKit
import WebKit

struct WebContainerView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.allowsAirPlayForMediaPlayback = true
        config.allowsPictureInPictureMediaPlayback = true

        let bundled = BundledWebHandler.bundleAvailable
        if bundled {
            let handler = BundledWebHandler()
            config.setURLSchemeHandler(handler, forURLScheme: BundledWebHandler.scheme)
            context.coordinator.schemeHandler = handler
            let scripts = config.userContentController
            scripts.add(context.coordinator, name: "oauthCallback")
            scripts.addUserScript(WKUserScript(
                source: Coordinator.oauthCaptureScript,
                injectionTime: .atDocumentStart,
                forMainFrameOnly: false
            ))
        }
        context.coordinator.usesBundle = bundled

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
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
        refresh.addTarget(context.coordinator, action: #selector(Coordinator.pullToRefresh(_:)), for: .valueChanged)
        webView.scrollView.refreshControl = refresh

        context.coordinator.webView = webView
        let start = bundled ? BundledWebHandler.startURL : URL(string: "https://wanderpass.me")
        if let start {
            webView.load(URLRequest(url: start))
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        weak var webView: WKWebView?
        var schemeHandler: BundledWebHandler?
        var usesBundle = false
        private var oauthInFlight = false
        private var completingOAuth = false

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

        @objc func pullToRefresh(_ sender: UIRefreshControl) {
            webView?.reload()
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "oauthCallback", let href = message.body as? String, let url = URL(string: href) else { return }
            completeOAuth(from: url)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            webView.scrollView.refreshControl?.endRefreshing()
            guard usesBundle, oauthInFlight, let current = webView.url, OAuthBridge.isLiveSite(current) else { return }
            webView.evaluateJavaScript("String(window.location.href)") { [weak self] result, _ in
                guard let href = result as? String, let url = URL(string: href) else { return }
                if OAuthBridge.hasSessionTokens(url) {
                    self?.completeOAuth(from: url)
                }
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            webView.scrollView.refreshControl?.endRefreshing()
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            webView.scrollView.refreshControl?.endRefreshing()
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

            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            guard let url = navigationAction.request.url else { return nil }
            if usesBundle {
                if OAuthBridge.isBrokerPath(url) {
                    oauthInFlight = true
                    if let live = OAuthBridge.liveBrokerURL(from: url) {
                        webView.load(URLRequest(url: live))
                        return nil
                    }
                }
                if OAuthBridge.isLiveSite(url) || OAuthBridge.isProviderAuth(url) {
                    oauthInFlight = true
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
                if let live = OAuthBridge.liveBrokerURL(from: url) {
                    decisionHandler(.cancel)
                    webView.load(URLRequest(url: live))
                    return true
                }
            }

            if OAuthBridge.isProviderAuth(url) {
                oauthInFlight = true
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
            webView?.stopLoading()
            webView?.load(URLRequest(url: bundled))
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [weak self] in
                self?.completingOAuth = false
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
    }
}
