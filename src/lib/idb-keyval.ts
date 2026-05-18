const DB_NAME = "wanderpass-keyval";
const STORE_NAME = "keyval";
const LOCAL_PREFIX = "wanderpass-idb-keyval:";

type Key = IDBValidKey;

const hasIndexedDb = () => typeof indexedDB !== "undefined";

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const withStore = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

export const get = async <T = unknown>(key: Key): Promise<T | undefined> => {
  if (!hasIndexedDb()) {
    const raw = localStorage.getItem(`${LOCAL_PREFIX}${String(key)}`);
    return raw ? JSON.parse(raw) as T : undefined;
  }

  return withStore<T | undefined>("readonly", store => store.get(key));
};

export const set = async (key: Key, value: unknown): Promise<void> => {
  if (!hasIndexedDb()) {
    localStorage.setItem(`${LOCAL_PREFIX}${String(key)}`, JSON.stringify(value));
    return;
  }

  await withStore<Key>("readwrite", store => store.put(value, key));
};

export const del = async (key: Key): Promise<void> => {
  if (!hasIndexedDb()) {
    localStorage.removeItem(`${LOCAL_PREFIX}${String(key)}`);
    return;
  }

  await withStore<undefined>("readwrite", store => store.delete(key));
};

export const keys = async (): Promise<Key[]> => {
  if (!hasIndexedDb()) {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(LOCAL_PREFIX))
      .map(key => key.slice(LOCAL_PREFIX.length));
  }

  return withStore<Key[]>("readonly", store => store.getAllKeys());
};
