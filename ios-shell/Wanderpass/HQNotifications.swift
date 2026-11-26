import UIKit
import WebKit
import UserNotifications
import BackgroundTasks
import Security

/// HQ alerts: Frigate detections and KORAUTO car changes as iOS local notifications.
///
/// No APNs (a free-Apple-ID sideload cannot get the push entitlement). Instead:
///  • while HQ is open, the shell reads the `hq-notify` feed every 60 s and shows banners;
///  • while HQ is in the background or closed, iOS wakes it with BGAppRefreshTask when it decides to
///    (best effort: typically a few times per hour to a few times per day, never after a force-quit).
///
/// The signed-in web app hands the shell a read-only *device key* via the `hqNotify` script message.
/// That key can only read the text feed (no cameras or media) and is kept in the Keychain.
final class HQNotifier: NSObject, WKScriptMessageHandler, UNUserNotificationCenterDelegate {
    static let shared = HQNotifier()
    static let refreshTaskID = "me.wanderpass.hub.notify-refresh"
    static let handlerName = "hqNotify"

    private enum Key {
        static let base = "hqNotify.base"
        static let cursor = "hqNotify.cursor"
        static let seen = "hqNotify.seen"
        static let prefsFrigate = "hqNotify.prefs.frigate"
        static let prefsCars = "hqNotify.prefs.cars"
    }

    private let defaults = UserDefaults.standard
    private weak var webView: WKWebView?
    private var attachTimer: Timer?
    private var pollTimer: Timer?
    private var polling = false
    private var pendingPath: String?
    private var launched = false

    // MARK: Launch

    func appDidLaunch() {
        guard !launched else { return }
        launched = true
        UNUserNotificationCenter.current().delegate = self
        BGTaskScheduler.shared.register(forTaskWithIdentifier: Self.refreshTaskID, using: nil) { [weak self] task in
            guard let refresh = task as? BGAppRefreshTask else {
                task.setTaskCompleted(success: false)
                return
            }
            self?.handleBackgroundRefresh(refresh)
        }
        let nc = NotificationCenter.default
        nc.addObserver(self, selector: #selector(didBecomeActive), name: UIApplication.didBecomeActiveNotification, object: nil)
        nc.addObserver(self, selector: #selector(willResignActive), name: UIApplication.willResignActiveNotification, object: nil)
        nc.addObserver(self, selector: #selector(didEnterBackground), name: UIApplication.didEnterBackgroundNotification, object: nil)
        startAttachLoop()
    }

    // MARK: Find the hub's WKWebView without touching the tab bar / web container code

    private func startAttachLoop() {
        attachTimer?.invalidate()
        attachTimer = Timer.scheduledTimer(withTimeInterval: 0.75, repeats: true) { [weak self] _ in
            self?.attachIfNeeded()
        }
        attachIfNeeded()
    }

    private func attachIfNeeded() {
        if let current = webView, current.window != nil {
            attachTimer?.invalidate()
            attachTimer = nil
            return
        }
        guard let found = Self.findWebView() else { return }
        let controller = found.configuration.userContentController
        controller.removeScriptMessageHandler(forName: Self.handlerName)
        controller.add(self, name: Self.handlerName)
        webView = found
        attachTimer?.invalidate()
        attachTimer = nil
        if let path = pendingPath {
            pendingPath = nil
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in self?.open(path: path) }
        }
    }

    private static func findWebView() -> WKWebView? {
        for scene in UIApplication.shared.connectedScenes {
            guard let windowScene = scene as? UIWindowScene else { continue }
            for window in windowScene.windows {
                if let web = search(window) { return web }
            }
        }
        return nil
    }

    private static func search(_ view: UIView) -> WKWebView? {
        if let web = view as? WKWebView { return web }
        for sub in view.subviews {
            if let web = search(sub) { return web }
        }
        return nil
    }

    // MARK: Messages from the web app

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.handlerName, let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "hello":
            sendStatus()
        case "register":
            guard let key = body["key"] as? String, !key.isEmpty, key.count < 600,
                  let base = body["base"] as? String, let baseURL = URL(string: base),
                  baseURL.scheme == "https", baseURL.host?.hasSuffix(".supabase.co") == true else { return }
            DeviceKeychain.save(key)
            defaults.set(base, forKey: Key.base)
            applyPrefs(body["prefs"])
            if defaults.string(forKey: Key.cursor) == nil {
                // Start from "now" so the first run does not replay old events.
                defaults.set(ISO8601DateFormatter().string(from: Date()), forKey: Key.cursor)
            }
            requestPermission { [weak self] in
                self?.sendStatus()
                self?.startForegroundPolling()
                self?.scheduleBackgroundRefresh()
            }
        case "prefs":
            applyPrefs(body["prefs"])
            sendStatus()
        case "requestPermission":
            UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
                DispatchQueue.main.async {
                    if settings.authorizationStatus == .denied {
                        if let url = URL(string: UIApplication.openNotificationSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                        self?.sendStatus()
                    } else {
                        self?.requestPermission { self?.sendStatus() }
                    }
                }
            }
        case "unregister":
            DeviceKeychain.delete()
            defaults.removeObject(forKey: Key.cursor)
            stopForegroundPolling()
            BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: Self.refreshTaskID)
            sendStatus()
        case "test":
            deliver([FeedItem(id: "test-\(Date().timeIntervalSince1970)", kind: "test", title: "HQ alerts are on", body: "Camera detections and KORAUTO car changes will show here.", at: nil, path: nil)])
        case "checkNow":
            poll { _ in }
        default:
            break
        }
    }

    private func applyPrefs(_ value: Any?) {
        guard let prefs = value as? [String: Any] else { return }
        if let f = prefs["frigate"] as? Bool { defaults.set(!f, forKey: Key.prefsFrigate) } // stored inverted: default on
        if let c = prefs["cars"] as? Bool { defaults.set(!c, forKey: Key.prefsCars) }
    }

    private var frigateOn: Bool { !defaults.bool(forKey: Key.prefsFrigate) }
    private var carsOn: Bool { !defaults.bool(forKey: Key.prefsCars) }

    private func requestPermission(_ done: @escaping () -> Void) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in
            DispatchQueue.main.async { done() }
        }
    }

    private func sendStatus() {
        UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                guard let self, let web = self.webView else { return }
                let permission: String
                switch settings.authorizationStatus {
                case .authorized, .provisional, .ephemeral: permission = "granted"
                case .denied: permission = "denied"
                default: permission = "default"
                }
                let refresh = UIApplication.shared.backgroundRefreshStatus == .available
                let status: [String: Any] = [
                    "registered": DeviceKeychain.load() != nil,
                    "permission": permission,
                    "backgroundRefresh": refresh,
                    "frigate": self.frigateOn,
                    "cars": self.carsOn,
                ]
                guard let data = try? JSONSerialization.data(withJSONObject: status),
                      let json = String(data: data, encoding: .utf8) else { return }
                web.evaluateJavaScript("window.__hqNotifyNative && window.__hqNotifyNative(\(json));", completionHandler: nil)
            }
        }
    }

    // MARK: Foreground / background lifecycle

    @objc private func didBecomeActive() {
        UNUserNotificationCenter.current().setBadgeCount(0, withCompletionHandler: nil)
        attachIfNeeded()
        if webView == nil { startAttachLoop() }
        startForegroundPolling()
    }

    @objc private func willResignActive() {
        stopForegroundPolling()
    }

    @objc private func didEnterBackground() {
        scheduleBackgroundRefresh()
    }

    private func startForegroundPolling() {
        guard DeviceKeychain.load() != nil else { return }
        pollTimer?.invalidate()
        pollTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            self?.poll { _ in }
        }
        poll { _ in }
    }

    private func stopForegroundPolling() {
        pollTimer?.invalidate()
        pollTimer = nil
    }

    private func scheduleBackgroundRefresh() {
        guard DeviceKeychain.load() != nil else { return }
        let request = BGAppRefreshTaskRequest(identifier: Self.refreshTaskID)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
        try? BGTaskScheduler.shared.submit(request)
    }

    private func handleBackgroundRefresh(_ task: BGAppRefreshTask) {
        scheduleBackgroundRefresh()
        var finished = false
        let finish: (Bool) -> Void = { ok in
            DispatchQueue.main.async {
                guard !finished else { return }
                finished = true
                task.setTaskCompleted(success: ok)
            }
        }
        task.expirationHandler = { finish(false) }
        DispatchQueue.main.async { [weak self] in
            guard let self else { finish(false); return }
            self.poll(finish)
        }
    }

    // MARK: Feed

    struct FeedItem: Decodable {
        let id: String
        let kind: String
        let title: String
        let body: String
        let at: String?
        let path: String?
    }

    private struct FeedResponse: Decodable {
        let cursor: String?
        let items: [FeedItem]
    }

    private func poll(_ done: @escaping (Bool) -> Void) {
        guard !polling else { done(true); return }
        guard let key = DeviceKeychain.load(), let base = defaults.string(forKey: Key.base) else { done(false); return }
        guard frigateOn || carsOn else { done(true); return }
        let iso = ISO8601DateFormatter()
        let cursorDate = defaults.string(forKey: Key.cursor).flatMap { iso.date(from: $0) } ?? Date()
        // Overlap by two minutes; already-seen ids are skipped.
        let since = iso.string(from: cursorDate.addingTimeInterval(-120))
        var comps = URLComponents(string: base.trimmingCharacters(in: CharacterSet(charactersIn: "/")) + "/functions/v1/hq-notify/feed")
        comps?.queryItems = [
            URLQueryItem(name: "since", value: since),
            URLQueryItem(name: "frigate", value: frigateOn ? "1" : "0"),
            URLQueryItem(name: "cars", value: carsOn ? "1" : "0"),
        ]
        guard let url = comps?.url else { done(false); return }
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 25)
        request.setValue(key, forHTTPHeaderField: "x-hq-device")
        polling = true
        URLSession.shared.dataTask(with: request) { [weak self] data, response, _ in
            DispatchQueue.main.async {
                guard let self else { return }
                self.polling = false
                let status = (response as? HTTPURLResponse)?.statusCode ?? 0
                if status == 401 {
                    DeviceKeychain.delete()
                    self.stopForegroundPolling()
                    self.sendStatus()
                    done(false)
                    return
                }
                guard status == 200, let data, let feed = try? JSONDecoder().decode(FeedResponse.self, from: data) else {
                    done(false)
                    return
                }
                var seen = self.defaults.stringArray(forKey: Key.seen) ?? []
                let seenSet = Set(seen)
                let fresh = feed.items.filter { !seenSet.contains($0.id) }
                seen.append(contentsOf: fresh.map(\.id))
                if seen.count > 400 { seen.removeFirst(seen.count - 400) }
                self.defaults.set(seen, forKey: Key.seen)
                if let cursor = feed.cursor { self.defaults.set(cursor, forKey: Key.cursor) }
                self.deliver(fresh)
                if !fresh.isEmpty {
                    self.webView?.evaluateJavaScript("window.__hqNotifyRefresh && window.__hqNotifyRefresh();", completionHandler: nil)
                }
                done(true)
            }
        }.resume()
    }

    private func deliver(_ items: [FeedItem]) {
        guard !items.isEmpty else { return }
        let center = UNUserNotificationCenter.current()
        let groups = Dictionary(grouping: items) { $0.kind == "camera" ? "camera" : $0.kind == "test" ? "test" : "cars" }
        var posted = 0
        for (group, list) in groups {
            if list.count <= 3 {
                for item in list {
                    post(id: item.id, title: item.title, body: item.body, path: item.path, thread: group, center: center)
                    posted += 1
                }
            } else {
                let title = group == "camera" ? "\(list.count) camera detections" : "\(list.count) KORAUTO car changes"
                let body = list.prefix(4).map(\.title).joined(separator: " · ")
                post(id: "summary-\(group)-\(list[0].id)", title: title, body: body, path: list[0].path, thread: group, center: center)
                posted += 1
            }
        }
        if posted > 0, UIApplication.shared.applicationState != .active {
            center.getDeliveredNotifications { delivered in
                center.setBadgeCount(delivered.count, withCompletionHandler: nil)
            }
        }
    }

    private func post(id: String, title: String, body: String, path: String?, thread: String, center: UNUserNotificationCenter) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.threadIdentifier = thread
        content.interruptionLevel = .active
        if let path { content.userInfo = ["path": path] }
        center.add(UNNotificationRequest(identifier: id, content: content, trigger: nil), withCompletionHandler: nil)
    }

    // MARK: UNUserNotificationCenterDelegate

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .list, .sound])
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        let path = response.notification.request.content.userInfo["path"] as? String
        DispatchQueue.main.async { [weak self] in
            if let path { self?.open(path: path) }
            completionHandler()
        }
    }

    private func open(path: String) {
        guard path.hasPrefix("/"), path.count < 100,
              path.allSatisfy({ $0.isLetter || $0.isNumber || $0 == "/" || $0 == "-" || $0 == "_" }) else { return }
        guard let web = webView else {
            pendingPath = path
            startAttachLoop()
            return
        }
        // pushState is hooked by the shell's route reporter, so the native tab bar follows.
        let js = """
        (function(p){try{if(location.pathname!==p){history.pushState({},'',p);window.dispatchEvent(new PopStateEvent('popstate'));}
        window.__hqNotifyOpen&&window.__hqNotifyOpen();}catch(e){}})('\(path)');
        """
        web.evaluateJavaScript(js, completionHandler: nil)
    }
}

/// Stores the read-only notifications device key (accessible after first unlock so background refresh works).
enum DeviceKeychain {
    private static let service = "me.wanderpass.hub.notify"
    private static let account = "device-key"
    private static let fallbackKey = "hqNotify.deviceKeyFallback"

    private static var query: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: account]
    }

    static func save(_ value: String) {
        delete()
        var attributes = query
        attributes[kSecValueData as String] = Data(value.utf8)
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        if SecItemAdd(attributes as CFDictionary, nil) != errSecSuccess {
            // Some re-signing tools strip keychain groups; keep alerts working anyway.
            UserDefaults.standard.set(value, forKey: fallbackKey)
        }
    }

    static func load() -> String? {
        var q = query
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: AnyObject?
        if SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let data = out as? Data, let s = String(data: data, encoding: .utf8) {
            return s
        }
        return UserDefaults.standard.string(forKey: fallbackKey)
    }

    static func delete() {
        SecItemDelete(query as CFDictionary)
        UserDefaults.standard.removeObject(forKey: fallbackKey)
    }
}

/// Registers the background refresh task before launch finishes (required by BGTaskScheduler).
final class HQAppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        HQNotifier.shared.appDidLaunch()
        return true
    }
}
