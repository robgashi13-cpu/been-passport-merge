import { registerPlugin } from '@capacitor/core';

export interface TabBarPlugin {
    setActiveTab(options: { tab: string }): Promise<{ success: boolean; tab: string }>;
    getActiveTab(): Promise<{ tab: string }>;
    addListener(eventName: 'tabChange', listenerFunc: (data: { tab: string }) => void): Promise<{ remove: () => void }>;
}

const TabBar = registerPlugin<TabBarPlugin>('TabBar');

export default TabBar;
