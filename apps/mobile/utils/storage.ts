// apps/mobile/utils/storage.ts
import { MMKV } from "react-native-mmkv"

// Create a storage instance with encryption
export const storage = new MMKV({
    id: "app-storage",
    encryptionKey: "your-secure-encryption-key", // You should use a secure key, possibly from an environment variable
})

// Helper functions to make it easier to use
export const StorageUtils = {
    // Store a string value
    setString: (key: string, value: string): void => {
        storage.set(key, value);
    },

    // Get a string value
    getString: (key: string): string | undefined => {
        return storage.getString(key);
    },

    // Store an object
    setObject: (key: string, value: object): void => {
        storage.set(key, JSON.stringify(value));
    },

    // Get an object
    getObject: <T>(key: string): T | null => {
        const value = storage.getString(key);
        if (value) {
            try {
                return JSON.parse(value) as T;
            } catch (e: any) {
                console.error('Error parsing stored object:', e);
            }
        }
        return null;
    },

    // Remove a value
    remove: (key: string): void => {
        storage.delete(key);
    },

    // Clear all storage
    clear: (): void => {
        storage.clearAll();
    },

    // Check if a key exists
    hasKey: (key: string): boolean => {
        return storage.contains(key);
    },

    // Get all keys
    getAllKeys: (): string[] => {
        return storage.getAllKeys();
    }
};

