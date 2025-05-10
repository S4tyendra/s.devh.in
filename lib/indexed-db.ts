// IndexedDB utility functions for storing and retrieving shortened URLs

const DB_NAME = "stellar-link-db";
const DB_VERSION = 1;
const STORE_NAME = "shortened-urls";

export interface ShortenedUrl {
  id?: number;
  originalUrl: string;
  shortUrl: string;
  isProtected: boolean;
  pin?: string;
  createdAt: number; // timestamp
}

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject("IndexedDB is not available in this environment.");
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (_event) => {
      reject("Error opening database");
    };

    request.onsuccess = (_event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (_event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        // Create indexes
        store.createIndex("shortUrl", "shortUrl", { unique: true });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
};

// Add a new shortened URL to the database
export const addShortenedUrlEntry = async (urlData: Omit<ShortenedUrl, "id">): Promise<ShortenedUrl> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.add(urlData);

    request.onsuccess = () => {
      // Retrieve the full object with the auto-generated ID
      const getRequest = store.get(request.result as IDBValidKey);
      getRequest.onsuccess = () => {
        resolve(getRequest.result as ShortenedUrl);
      };
      getRequest.onerror = () => {
        reject("Error retrieving added URL from database");
      }
    };

    request.onerror = () => {
      reject("Error adding shortened URL to database");
    };
  });
};

// Get all shortened URLs from the database
export const getAllShortenedUrls = async (): Promise<ShortenedUrl[]> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("createdAt");

    const request = index.openCursor(null, "prev"); // Get in reverse chronological order
    const urls: ShortenedUrl[] = [];

    request.onsuccess = (_event) => {
      const cursor = request.result;
      if (cursor) {
        urls.push(cursor.value as ShortenedUrl);
        cursor.continue();
      } else {
        resolve(urls);
      }
    };

    request.onerror = () => {
      reject("Error getting shortened URLs from database");
    };
  });
};

// Delete a shortened URL from the database
export const deleteShortenedUrlEntry = async (id: number): Promise<void> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject("Error deleting shortened URL from database");
    };
  });
};

// Clear all shortened URLs from the database
export const clearAllShortenedUrls = async (): Promise<void> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject("Error clearing shortened URLs from database");
    };
  });
};