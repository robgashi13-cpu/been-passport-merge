import SwiftUI

@main
struct WanderpassApp: App {
    var body: some Scene {
        WindowGroup {
            WebContainerView()
                .ignoresSafeArea()
        }
    }
}
