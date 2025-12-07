#import <Capacitor/Capacitor.h>

CAP_PLUGIN(TabBarPlugin, "TabBar",
    CAP_PLUGIN_METHOD(setActiveTab, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getActiveTab, CAPPluginReturnPromise);
)
