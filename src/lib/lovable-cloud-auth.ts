type LovableAuthMethod = (...args: unknown[]) => Promise<unknown>;

const noopAsync: LovableAuthMethod = async () => null;

export const createLovableAuth = () => {
  const auth = {
    getToken: noopAsync,
    getSession: noopAsync,
    getUser: noopAsync,
    signIn: noopAsync,
    signOut: noopAsync,
    refreshSession: noopAsync,
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
    }),
  };

  return new Proxy(auth, {
    get(target, property: string | symbol) {
      if (property in target) {
        return target[property as keyof typeof target];
      }

      return noopAsync;
    },
  });
};
