import SwiftUI

@main
struct WanderpassApp: App {
    @UIApplicationDelegateAdaptor(HQAppDelegate.self) private var hqAppDelegate

    var body: some Scene {
        WindowGroup {
            HubRootView()
                .ignoresSafeArea()
        }
    }
}

struct HubRootView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> HubTabBarController {
        HubTabBarController()
    }

    func updateUIViewController(_ uiViewController: HubTabBarController, context: Context) {}
}
