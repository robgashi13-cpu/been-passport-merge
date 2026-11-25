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

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        weak var webView: WKWebView?
        var schemeHandler: BundledWebHandler?
        var usesBundle = false

        @objc func pullToRefresh(_ sender: UIRefreshControl) {
            webView?.reload()
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            webView.scrollView.refreshControl?.endRefreshing()
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

            if usesBundle, let rewritten = BundledWebHandler.rewriteLiveSite(url) {
                decisionHandler(.cancel)
                webView.load(URLRequest(url: rewritten))
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
            if usesBundle, let rewritten = BundledWebHandler.rewriteLiveSite(url) {
                webView.load(URLRequest(url: rewritten))
                return nil
            }
            if shouldOpenExternally(url) {
                UIApplication.shared.open(url)
            } else {
                webView.load(URLRequest(url: url))
            }
            return nil
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
            return false
        }
    }
}
