// Location-change notifications were removed at the user's request.
// The hook signature is kept stable so existing callers compile without changes,
// but no notification is ever sent and no permission is requested.
export const requestNotificationPermission = async (): Promise<boolean> => false;

export const useLocationNotifications = (
    _countryCode: string | null,
    _countryName: string | null,
) => {
    return {
        hasPermission: false,
        requestPermission: async () => false,
        isSupported: false,
    };
};

