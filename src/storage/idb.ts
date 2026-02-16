import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MPCSDB extends DBSchema {
    assets: {
        key: string;
        value: Blob;
    };
}

const DB_NAME = 'mpcs-assets-db';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

let dbPromise: Promise<IDBPDatabase<MPCSDB>> | null = null;

function getDB() {
    if (!dbPromise) {
        dbPromise = openDB<MPCSDB>(DB_NAME, DB_VERSION, {
            upgrade(db: IDBPDatabase<MPCSDB>) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            },
        });
    }
    return dbPromise;
}

export async function storeAsset(blob: Blob): Promise<string> {
    const db = await getDB();
    const id = crypto.randomUUID();
    await db.put(STORE_NAME, blob, id);
    return id;
}

export async function getAsset(id: string): Promise<Blob | undefined> {
    const db = await getDB();
    return db.get(STORE_NAME, id);
}

export async function deleteAsset(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
}

export async function clearAssets(): Promise<void> {
    const db = await getDB();
    await db.clear(STORE_NAME);
}

// Helper to convert File to Blob if needed (though File extends Blob)
export async function storeFile(file: File): Promise<string> {
    return storeAsset(file);
}

// Helper for generating object URLs from stored assets
export async function getAssetUrl(id: string): Promise<string | null> {
    const blob = await getAsset(id);
    if (!blob) return null;
    return URL.createObjectURL(blob);
}
