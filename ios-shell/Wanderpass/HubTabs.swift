import UIKit

enum HubTab: Int, CaseIterable {
    case dashboard
    case world
    case travel
    case cameras
    case tv
    case korauto
    case korautoks

    var path: String {
        switch self {
        case .dashboard: return "/"
        case .world: return "/world"
        case .travel: return "/travel"
        case .cameras: return "/cameras"
        case .tv: return "/tv"
        case .korauto: return "/korauto"
        case .korautoks: return "/korautoks"
        }
    }

    var title: String {
        switch self {
        case .dashboard: return "Dashboard"
        case .world: return "World News"
        case .travel: return "Travel"
        case .cameras: return "Cameras"
        case .tv: return "TV"
        case .korauto: return "KORAUTO"
        case .korautoks: return "korautoks.com"
        }
    }

    var symbol: String {
        switch self {
        case .dashboard: return "square.grid.2x2"
        case .world: return "globe"
        case .travel: return "airplane"
        case .cameras: return "web.camera"
        case .tv: return "tv"
        case .korauto: return "car"
        case .korautoks: return "magnifyingglass"
        }
    }

    var symbolFill: String {
        switch self {
        case .dashboard: return "square.grid.2x2.fill"
        case .world: return "globe.americas.fill"
        case .travel: return "airplane"
        case .cameras: return "web.camera.fill"
        case .tv: return "tv.fill"
        case .korauto: return "car.fill"
        case .korautoks: return "magnifyingglass"
        }
    }

    var tabBarItem: UITabBarItem {
        let fill = UIImage(systemName: symbolFill)
        let item = UITabBarItem(
            title: title,
            image: UIImage(systemName: symbol) ?? fill,
            selectedImage: fill ?? UIImage(systemName: symbol)
        )
        item.tag = rawValue
        item.accessibilityLabel = title
        return item
    }

    static func matching(path rawPath: String) -> HubTab? {
        var path = rawPath
        if let q = path.firstIndex(of: "?") {
            path = String(path[..<q])
        }
        if let h = path.firstIndex(of: "#") {
            path = String(path[..<h])
        }
        if path.isEmpty { path = "/" }
        if path == "/calendar" || path.hasPrefix("/calendar/") {
            return .travel
        }
        if path == "/" {
            return .dashboard
        }
        return allCases
            .filter { $0 != .dashboard && (path == $0.path || path.hasPrefix($0.path + "/")) }
            .max(by: { $0.path.count < $1.path.count })
    }
}
