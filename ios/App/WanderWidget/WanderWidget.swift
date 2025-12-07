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
            // Background
            Color(red: 0.1, green: 0.1, blue: 0.1)
                .edgesIgnoringSafeArea(.all)
            
            // Texture/Gradient
            LinearGradient(gradient: Gradient(colors: [Color.black, Color(red: 0.15, green: 0.15, blue: 0.15)]), startPoint: .topLeading, endPoint: .bottomTrailing)
            
            // Dynamic Map Background if available
            if let image = entry.mapImage {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .opacity(0.3) // Faint background map
                    .blendMode(.overlay)
            }
            
            HStack(spacing: 15) {
                // Left Side: Map Representation
                ZStack {
                    Circle()
                        .fill(Color(red: 0.2, green: 0.2, blue: 0.2))
                        .frame(width: 100, height: 100)
                    
                    if let image = entry.mapImage {
                         Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 90, height: 90)
                            .clipShape(Circle())
                    } else {
                        // Fallback SAFE SYMBOL: "globe" works on iOS 13+.
                        Image(systemName: "globe")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 80, height: 80)
                            .foregroundColor(Color.blue.opacity(0.6))
                            .shadow(color: .blue.opacity(0.4), radius: 10, x: 0, y: 0)
                    }
                }
                
                // Right Side: Stats
                VStack(alignment: .leading, spacing: 8) {
                    // ... existing stats ...
                    VStack(alignment: .leading, spacing: 2) {
                        Text("VISITED")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.gray)
                        Text("\(entry.visitedCount)")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.white)
                        Text("COUNTRIES")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.gray)
                    }
                    
                    Spacer().frame(height: 5)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("RANK")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.gray)
                        Text(entry.rankTitle)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(Color(red: 0.83, green: 0.68, blue: 0.21)) // Gold
                    }
                    
                    // Small Progress Bar
                    VStack(alignment: .leading) {
                         GeometryReader { geometry in
                             ZStack(alignment: .leading) {
                                 Rectangle()
                                     .frame(width: geometry.size.width, height: 4)
                                     .opacity(0.3)
                                     .foregroundColor(.gray)
                                     .cornerRadius(2)
                                 
                                 Rectangle()
                                     .frame(width: min(CGFloat(Float(entry.percentage)) / 100.0 * geometry.size.width, geometry.size.width), height: 4)
                                     .foregroundColor(.blue)
                                     .cornerRadius(2)
                             }
                         }
                         .frame(height: 4)
                    }
                    .frame(width: 80)
                }
            }
            .padding()
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
        .supportedFamilies([.systemMedium])
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
