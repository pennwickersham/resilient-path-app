/**
 * storage.js — Durable persistence for Resilient Path
 *
 * WHY THIS EXISTS:
 * localStorage lives inside the WebView and can be evicted by the OS under
 * storage pressure (and is lost on reinstall). Workbook answers and health
 * data are irreplaceable, so on native platforms we persist them as JSON
 * files in the app's private Data directory via @capacitor/filesystem
 * (already a dependency). localStorage is kept as a fast synchronous cache
 * and as the primary store on plain web.
 *
 * MIGRATION: On first read, if no file exists but localStorage has data
 * under the same key, the localStorage value is promoted to a file
 * automatically. Existing users lose nothing.
 *
 * API (all async):
 *   await storage.get(key)            -> parsed value | null
 *   await storage.set(key, value)     -> void  (value is JSON-serialized)
 *   await storage.remove(key)         -> void
 *   await storage.exportBackup()      -> { filename, json } and writes a
 *                                        backup file to Documents (native)
 *   await storage.importBackup(json)  -> restores all known keys
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const isNative = Capacitor.isNativePlatform();
const FILE_PREFIX = 'rp-store-';

// Every key the app persists. Used by backup/restore.
export const STORAGE_KEYS = {
  WORKBOOK: 'resilientPathWorkbook',
  HEALTH_TOOLS: 'resilientPathHealthTools',
  CHAT_HISTORY: 'resilientPathChatHistory',
  AI_CONSENT: 'aiConsentAccepted',
  PERSONALIZATION: 'aiPersonalizationEnabled',
};

const fileFor = (key) => `${FILE_PREFIX}${key}.json`;

// In-memory cache so repeated reads don't hit the filesystem.
const cache = new Map();

async function readFile(key) {
  try {
    const res = await Filesystem.readFile({
      path: fileFor(key),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return typeof res.data === 'string' ? res.data : null;
  } catch {
    return null; // file doesn't exist yet
  }
}

async function writeFile(key, raw) {
  await Filesystem.writeFile({
    path: fileFor(key),
    directory: Directory.Data,
    data: raw,
    encoding: Encoding.UTF8,
    recursive: true,
  });
}

export const storage = {
  async get(key) {
    if (cache.has(key)) return cache.get(key);

    let raw = null;
    if (isNative) {
      raw = await readFile(key);
      if (raw === null) {
        // Migrate legacy localStorage value to durable file storage.
        const legacy = localStorage.getItem(key);
        if (legacy !== null) {
          raw = legacy;
          try { await writeFile(key, legacy); } catch (e) {
            console.error(`storage: migration write failed for ${key}`, e);
          }
        }
      }
    } else {
      raw = localStorage.getItem(key);
    }

    if (raw === null) {
      cache.set(key, null);
      return null;
    }
    let value;
    try { value = JSON.parse(raw); } catch { value = raw; } // tolerate legacy plain strings
    cache.set(key, value);
    return value;
  },

  async set(key, value) {
    cache.set(key, value);
    const raw = JSON.stringify(value);
    // localStorage doubles as cache on native and primary on web.
    try { localStorage.setItem(key, raw); } catch { /* quota — file is source of truth */ }
    if (isNative) {
      try { await writeFile(key, raw); } catch (e) {
        console.error(`storage: durable write failed for ${key}`, e);
      }
    }
  },

  async remove(key) {
    cache.delete(key);
    localStorage.removeItem(key);
    if (isNative) {
      try {
        await Filesystem.deleteFile({ path: fileFor(key), directory: Directory.Data });
      } catch { /* didn't exist */ }
    }
  },

  /**
   * Bundle every known key into a single JSON backup. On native, also
   * writes it to the user-visible Documents directory so it survives
   * uninstall and can be moved between devices.
   */
  async exportBackup() {
    const payload = { app: 'resilient-path', version: 1, exportedAt: new Date().toISOString(), data: {} };
    for (const key of Object.values(STORAGE_KEYS)) {
      payload.data[key] = await this.get(key);
    }
    const json = JSON.stringify(payload, null, 2);
    const filename = `Resilient_Path_Backup_${new Date().toISOString().split('T')[0]}.json`;

    if (isNative) {
      await Filesystem.writeFile({
        path: filename,
        directory: Directory.Documents,
        data: json,
        encoding: Encoding.UTF8,
        recursive: true,
      });
    }
    return { filename, json };
  },

  async importBackup(json) {
    let payload;
    try { payload = JSON.parse(json); } catch { throw new Error('Invalid backup file'); }
    if (!payload || payload.app !== 'resilient-path' || typeof payload.data !== 'object') {
      throw new Error('Not a Resilient Path backup file');
    }
    const known = new Set(Object.values(STORAGE_KEYS));
    for (const [key, value] of Object.entries(payload.data)) {
      if (known.has(key) && value !== null && value !== undefined) {
        await this.set(key, value);
      }
    }
  },
};

export default storage;
