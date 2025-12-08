//
//  WanderWidget.swift
//  IMPORTANT: This file must ONLY belong to the "WanderWidget" target in Xcode.
//  If you see 'main' attribute error, UNCHECK "App" in Target Membership for this file.
//

import WidgetKit
import SwiftUI
import Intents

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), visitedCount: 12, rankTitle: "Backpacker", percentage: 5, mapImage: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), visitedCount: 12, rankTitle: "Backpacker", percentage: 5, mapImage: nil)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []

        // Read from App Group
        let userDefaults = UserDefaults(suiteName: "group.com.been.passport")
        let visitedCount = userDefaults?.integer(forKey: "visitedCount") ?? 0
        let rankTitle = userDefaults?.string(forKey: "rankTitle") ?? "Traveler"
        let percentage = userDefaults?.integer(forKey: "percentage") ?? 0
        let mapBase64 = userDefaults?.string(forKey: "mapImage")

        var mapImage: UIImage? = nil
        if let base64 = mapBase64, let data = Data(base64Encoded: base64) {
            mapImage = UIImage(data: data)
        }

        let currentDate = Date()
        let entry = SimpleEntry(date: currentDate, visitedCount: visitedCount, rankTitle: rankTitle, percentage: percentage, mapImage: mapImage)
        entries.append(entry)

        // Refresh every hour (Safe Unwrap)
        let refreshDate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate) ?? currentDate.addingTimeInterval(3600)
        let timeline = Timeline(entries: entries, policy: .after(refreshDate))
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let visitedCount: Int
    let rankTitle: String
    let percentage: Int
    let mapImage: UIImage?
}

struct WanderWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack {
            // 1. Background: Vintage Map or Parchment Color
            Color(red: 0.92, green: 0.87, blue: 0.81) // #eaddcf Parchment
                .edgesIgnoringSafeArea(.all)
            
            // 2. Full-bleed Map Image
            if let image = entry.mapImage {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            
            // 3. Subtle Grain/Overlay for readability
            // Gradient from bottom to allow text to pop, or just subtle vignette
            LinearGradient(gradient: Gradient(colors: [
                Color.clear,
                Color(red: 0.92, green: 0.87, blue: 0.81).opacity(0.3),
                Color(red: 0.92, green: 0.87, blue: 0.81).opacity(0.8)
            ]), startPoint: .top, endPoint: .bottom)
            
            // 4. Content Overlay
            VStack(alignment: .leading) {
                Spacer()
                
                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("VISITED WORLD")
                            .font(.system(size: 10, weight: .bold, design: .serif))
                            .foregroundColor(Color(red: 0.4, green: 0.3, blue: 0.2)) // Dark Coffee
                            .kerning(1.0)
                        
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text("\(entry.visitedCount)")
                                .font(.system(size: 42, weight: .black, design: .serif))
                                .foregroundColor(Color(red: 0.35, green: 0.2, blue: 0.05)) // Deep Ink
                            
                            Text("COUNTRIES")
                                .font(.system(size: 12, weight: .bold, design: .serif))
                                .foregroundColor(Color(red: 0.5, green: 0.4, blue: 0.3))
                                .padding(.bottom, 6)
                        }
                    }
                    
                    Spacer()
                    
                    // Rank Stamp
                    VStack(spacing: 2) {
                        Image(systemName: "laurel.leading")
                            .font(.system(size: 14))
                            .foregroundColor(Color(red: 0.6, green: 0.4, blue: 0.2))
                        
                        Text(entry.rankTitle.uppercased())
                            .font(.system(size: 10, weight: .bold, design: .serif))
                            .foregroundColor(Color(red: 0.4, green: 0.3, blue: 0.2))
                            .multilineTextAlignment(.center)
                            .lineLimit(1)
                            .padding(.horizontal, 4)
                        
                         Image(systemName: "laurel.trailing")
                             .font(.system(size: 14))
                             .foregroundColor(Color(red: 0.6, green: 0.4, blue: 0.2))
                    }
                    .padding(8)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(red: 0.5, green: 0.4, blue: 0.3), lineWidth: 1.5)
                            .background(Color.white.opacity(0.4))
                    )
                }
            }
            .padding(16)
        }
    }
}

@main
struct WanderWidget: Widget {
    let kind: String = "WanderWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                WanderWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                WanderWidgetEntryView(entry: entry)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName("Travel Stats")
        .description("Your travel progress at a glance.")
        .supportedFamilies([.systemMedium, .systemLarge, .systemExtraLarge])
        .disableContentMarginsIfAvailable()
    }
}

extension WidgetConfiguration {
    func disableContentMarginsIfAvailable() -> some WidgetConfiguration {
        if #available(iOS 15.0, *) {
            return self.contentMarginsDisabled()
        } else {
            return self
        }
    }
}
