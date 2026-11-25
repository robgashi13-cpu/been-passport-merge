import Foundation

enum OAuthBridge {
    static let liveOrigin = "https://wanderpass.me"
    static let liveHost = "wanderpass.me"
    private static let redirectKeys: Set<String> = [
        "redirect_uri", "redirect_to", "redirectTo", "redirect", "return_to",
    ]

    static func isLiveSite(_ url: URL) -> Bool {
        let host = url.host?.lowercased() ?? ""
        return host == liveHost || host.hasSuffix("." + liveHost)
    }

    static func isBrokerPath(_ url: URL) -> Bool {
        let path = url.path
        return path == "/~oauth/initiate" || path.hasPrefix("/~oauth/")
    }

    static func isProviderAuth(_ url: URL) -> Bool {
        let host = url.host?.lowercased() ?? ""
        if host == "appleid.apple.com" || host.hasSuffix(".appleid.apple.com") { return true }
        if host == "lovable.dev" || host.hasSuffix(".lovable.dev") { return true }
        if host == "oauth.lovable.app" || host.hasSuffix(".lovable.app") { return true }
        if host.contains("supabase.co"), url.path.contains("/auth/") { return true }
        return false
    }

    /// Rebuild a broker request so it hits the live allowlisted origin
    /// with redirect_uri=https://wanderpass.me instead of app://wanderpass.
    static func liveBrokerURL(from url: URL) -> URL? {
        var comps = URLComponents()
        comps.scheme = "https"
        comps.host = liveHost
        comps.path = url.path.isEmpty ? "/~oauth/initiate" : url.path
        var items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
        var foundRedirect = false
        for index in items.indices {
            let name = items[index].name
            guard redirectKeys.contains(name) else { continue }
            foundRedirect = true
            let value = items[index].value ?? ""
            if value.isEmpty || value.lowercased().hasPrefix("app://") {
                items[index].value = liveOrigin
            }
        }
        if !foundRedirect {
            items.append(URLQueryItem(name: "redirect_uri", value: liveOrigin))
        }
        comps.queryItems = items.isEmpty ? nil : items
        return comps.url
    }

    static func rewrittenQueryRedirects(_ url: URL) -> URL? {
        guard var comps = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return nil }
        var items = comps.queryItems ?? []
        var changed = false
        for index in items.indices {
            guard redirectKeys.contains(items[index].name) else { continue }
            let value = items[index].value ?? ""
            if value.lowercased().hasPrefix("app://") {
                items[index].value = rewrittenRedirect(value)
                changed = true
            }
        }
        guard changed else { return nil }
        comps.queryItems = items
        return comps.url
    }

    static func rewrittenRedirect(_ value: String) -> String {
        guard let url = URL(string: value) else { return liveOrigin }
        var live = URLComponents()
        live.scheme = "https"
        live.host = liveHost
        let path = url.path
        live.path = (path.isEmpty || path == "/") ? "" : path
        live.query = url.query
        live.fragment = url.fragment
        // window.location.origin has no trailing slash and no path.
        if (path.isEmpty || path == "/"), url.query == nil, url.fragment == nil {
            return liveOrigin
        }
        return live.string ?? liveOrigin
    }

    static func hasSessionTokens(_ url: URL) -> Bool {
        let blob = [url.fragment, url.query].compactMap { $0 }.joined(separator: "&")
        guard !blob.isEmpty else { return false }
        if blob.contains("error=") && !blob.contains("access_token=") { return false }
        if blob.contains("access_token="), blob.contains("refresh_token=") { return true }
        if blob.contains("access_token=") { return true }
        // Authorization code without tokens; still a callback we should capture.
        if let query = url.query, query.contains("code="), !query.contains("error=") {
            return true
        }
        if let fragment = url.fragment, fragment.contains("code="), !fragment.contains("error=") {
            return true
        }
        return false
    }

    static func bundledCallback(from liveURL: URL) -> URL? {
        var comps = URLComponents()
        comps.scheme = BundledWebHandler.scheme
        comps.host = BundledWebHandler.host
        let path = liveURL.path
        comps.path = path.isEmpty ? "/" : path
        // The SPA has no /~oauth route; land on the home page with the fragment.
        if isBrokerPath(liveURL) {
            comps.path = "/"
        }
        comps.query = liveURL.query
        comps.fragment = liveURL.fragment
        return comps.url
    }
}
