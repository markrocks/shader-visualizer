import type { Preset, Sequence } from '../types';

const PRESETS_FILE = 'presets.json';
const SEQUENCES_FILE = 'sequences.json';

export interface StorageData {
  presets: Preset[];
  sequences: Sequence[];
}

// Check if File System Access API is supported
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

// Request directory access from user
export async function requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    console.warn('File System Access API is not supported in this browser');
    return null;
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    });
    return handle;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled the picker
      return null;
    }
    throw error;
  }
}

// Verify we still have permission to access the directory
export async function verifyPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    const permission = await handle.queryPermission({ mode: 'readwrite' });
    if (permission === 'granted') {
      return true;
    }
    
    const requestResult = await handle.requestPermission({ mode: 'readwrite' });
    return requestResult === 'granted';
  } catch {
    return false;
  }
}

// Read a JSON file from the directory
async function readJsonFile<T>(
  directoryHandle: FileSystemDirectoryHandle,
  filename: string
): Promise<T | null> {
  try {
    const fileHandle = await directoryHandle.getFileHandle(filename);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text) as T;
  } catch (error) {
    if ((error as Error).name === 'NotFoundError') {
      // File doesn't exist yet, that's okay
      return null;
    }
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

// Write a JSON file to the directory
async function writeJsonFile<T>(
  directoryHandle: FileSystemDirectoryHandle,
  filename: string,
  data: T
): Promise<boolean> {
  try {
    const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}

// Load presets from the directory
export async function loadPresetsFromFolder(
  directoryHandle: FileSystemDirectoryHandle
): Promise<Preset[]> {
  const hasPermission = await verifyPermission(directoryHandle);
  if (!hasPermission) {
    throw new Error('Permission denied to access folder');
  }
  
  const presets = await readJsonFile<Preset[]>(directoryHandle, PRESETS_FILE);
  return presets || [];
}

// Save presets to the directory
export async function savePresetsToFolder(
  directoryHandle: FileSystemDirectoryHandle,
  presets: Preset[]
): Promise<boolean> {
  const hasPermission = await verifyPermission(directoryHandle);
  if (!hasPermission) {
    throw new Error('Permission denied to access folder');
  }
  
  return writeJsonFile(directoryHandle, PRESETS_FILE, presets);
}

// Load sequences from the directory
export async function loadSequencesFromFolder(
  directoryHandle: FileSystemDirectoryHandle
): Promise<Sequence[]> {
  const hasPermission = await verifyPermission(directoryHandle);
  if (!hasPermission) {
    throw new Error('Permission denied to access folder');
  }
  
  const sequences = await readJsonFile<Sequence[]>(directoryHandle, SEQUENCES_FILE);
  return sequences || [];
}

// Save sequences to the directory
export async function saveSequencesToFolder(
  directoryHandle: FileSystemDirectoryHandle,
  sequences: Sequence[]
): Promise<boolean> {
  const hasPermission = await verifyPermission(directoryHandle);
  if (!hasPermission) {
    throw new Error('Permission denied to access folder');
  }
  
  return writeJsonFile(directoryHandle, SEQUENCES_FILE, sequences);
}

// Load all data from folder
export async function loadAllFromFolder(
  directoryHandle: FileSystemDirectoryHandle
): Promise<StorageData> {
  const [presets, sequences] = await Promise.all([
    loadPresetsFromFolder(directoryHandle),
    loadSequencesFromFolder(directoryHandle),
  ]);
  
  return { presets, sequences };
}

// Save all data to folder
export async function saveAllToFolder(
  directoryHandle: FileSystemDirectoryHandle,
  data: StorageData
): Promise<boolean> {
  const [presetsSuccess, sequencesSuccess] = await Promise.all([
    savePresetsToFolder(directoryHandle, data.presets),
    saveSequencesToFolder(directoryHandle, data.sequences),
  ]);
  
  return presetsSuccess && sequencesSuccess;
}
