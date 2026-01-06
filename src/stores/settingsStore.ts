import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  storageFolderName: string | null;
  directoryHandle: FileSystemDirectoryHandle | null;
  isSettingsOpen: boolean;
  setDirectoryHandle: (handle: FileSystemDirectoryHandle | null, name: string | null) => void;
  setIsSettingsOpen: (open: boolean) => void;
  clearStorage: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      storageFolderName: null,
      directoryHandle: null,
      isSettingsOpen: false,
      
      setDirectoryHandle: (handle, name) => set({ 
        directoryHandle: handle,
        storageFolderName: name 
      }),
      
      setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
      
      clearStorage: () => set({ 
        directoryHandle: null, 
        storageFolderName: null 
      }),
    }),
    {
      name: 'visualizer-settings',
      partialize: (state) => ({ 
        storageFolderName: state.storageFolderName 
      }),
    }
  )
);

// Store the directory handle in IndexedDB since it can't be serialized to localStorage
const DB_NAME = 'visualizer-storage';
const STORE_NAME = 'directory-handles';
const HANDLE_KEY = 'storage-folder';

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(handle, HANDLE_KEY);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(HANDLE_KEY);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch {
    return null;
  }
}

export async function clearDirectoryHandle(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(HANDLE_KEY);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch {
    // Ignore errors when clearing
  }
}
