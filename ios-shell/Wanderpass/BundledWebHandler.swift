import Foundation
import UniformTypeIdentifiers
import WebKit

final class BundledWebHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "app"
    static let host = "wanderpass"
    static let startURL = URL(string: "app://wanderpass/")!

    private let lock = NSLock()
    private var stopped = Set<ObjectIdentifier>()

    static func webRoot() -> URL? {
        Bundle.main.url(forResource: "Web", withExtension: nil)
    }

    static var bundleAvailable: Bool {
        guard let root = webRoot() else { return false }
        return FileManager.default.fileExists(atPath: root.appendingPathComponent("index.html").path)
    }

    static func rewriteLiveSite(_ url: URL) -> URL? {
        guard let host = url.host?.lowercased() else { return nil }
        guard host == "wanderpass.me" || host.hasSuffix(".wanderpass.me") else { return nil }
        var comps = URLComponents()
        comps.scheme = scheme
        comps.host = Self.host
        comps.path = url.path.isEmpty ? "/" : url.path
        comps.query = url.query
        comps.fragment = url.fragment
        return comps.url
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        let taskID = ObjectIdentifier(urlSchemeTask)
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }

        let result = Self.resource(for: url)
        lock.lock()
        let cancelled = stopped.contains(taskID)
        lock.unlock()
        if cancelled { return }

        guard let result else {
            let empty = Data()
            let response = HTTPURLResponse(
                url: url,
                statusCode: 404,
                httpVersion: "HTTP/1.1",
                headerFields: [
                    "Content-Type": "text/plain; charset=utf-8",
                    "Content-Length": "0",
                    "Cache-Control": "no-cache",
                ]
            )!
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(empty)
            urlSchemeTask.didFinish()
            return
        }

        let headers = [
            "Content-Type": result.mime,
            "Content-Length": "\(result.data.count)",
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
        ]
        guard let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers) else {
            urlSchemeTask.didFailWithError(URLError(.cannotDecodeContentData))
            return
        }
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(result.data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        lock.lock()
        stopped.insert(ObjectIdentifier(urlSchemeTask))
        lock.unlock()
    }

    private static let staticExtensions: Set<String> = [
        "js", "mjs", "cjs", "css", "map", "json", "wasm",
        "png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "avif",
        "woff", "woff2", "ttf", "otf", "eot",
        "mp4", "webm", "mp3", "wav", "ogg",
        "txt", "xml", "pdf", "webmanifest",
    ]

    private static func resource(for url: URL) -> (data: Data, mime: String)? {
        guard let root = webRoot()?.standardizedFileURL else { return nil }
        var path = url.path
        if path.isEmpty || path == "/" {
            path = "/index.html"
        }
        let relative = (path as NSString).standardizingPath.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let decoded = relative.removingPercentEncoding ?? relative
        let candidate = root.appendingPathComponent(decoded).standardizedFileURL
        guard candidate.path == root.path || candidate.path.hasPrefix(root.path + "/") else { return nil }

        var isDir: ObjCBool = false
        if FileManager.default.fileExists(atPath: candidate.path, isDirectory: &isDir) {
            let file = isDir.boolValue ? candidate.appendingPathComponent("index.html") : candidate
            if let data = try? Data(contentsOf: file) {
                return (data, mimeType(for: file))
            }
        }

        let ext = (decoded as NSString).pathExtension.lowercased()
        if !ext.isEmpty && ext != "html" && staticExtensions.contains(ext) {
            return nil
        }
        let index = root.appendingPathComponent("index.html")
        guard let data = try? Data(contentsOf: index) else { return nil }
        return (data, "text/html; charset=utf-8")
    }

    private static func mimeType(for file: URL) -> String {
        let ext = file.pathExtension.lowercased()
        switch ext {
        case "html", "htm": return "text/html; charset=utf-8"
        case "js", "mjs", "cjs": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json", "map", "webmanifest": return "application/json"
        case "wasm": return "application/wasm"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "gif": return "image/gif"
        case "webp": return "image/webp"
        case "ico": return "image/x-icon"
        case "avif": return "image/avif"
        case "woff": return "font/woff"
        case "woff2": return "font/woff2"
        case "ttf": return "font/ttf"
        case "otf": return "font/otf"
        case "mp4": return "video/mp4"
        case "webm": return "video/webm"
        case "mp3": return "audio/mpeg"
        case "txt": return "text/plain; charset=utf-8"
        case "xml": return "application/xml"
        case "pdf": return "application/pdf"
        default:
            if let type = UTType(filenameExtension: ext), let mime = type.preferredMIMEType {
                return mime
            }
            return "application/octet-stream"
        }
    }
}
