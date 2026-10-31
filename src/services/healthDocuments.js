/**
 * healthDocuments.js — Lab results, tests and imaging the user attaches
 *
 * PRIVACY: files never leave the device. Nothing here talks to a server.
 *
 * Storage, consistent with storage.js:
 *   - The list (title, date, type, file name…) is a normal storage key,
 *     STORAGE_KEYS.DOCUMENTS (durable file on native, localStorage on web).
 *   - The file bytes are too big for that, so:
 *       native → the app's private Data directory (rp-documents/<id>.<ext>)
 *       web    → IndexedDB in this browser
 *   Backups (storage.exportBackup) include the list only, not the files.
 *
 * API (all async):
 *   listDocuments()                       -> [{ id, title, date, type, mimeType, fileName, size, createdAt, path }]
 *   addDocument({ file, title, date, type })
 *   deleteDocument(id)
 *   getDocumentUrl(doc)                   -> URL usable in <img>/<iframe> (call revokeDocumentUrl when done)
 *   getDocumentDataUrl(doc)               -> data: URL (for embedding in the PDF), or null if missing
 *   shareDocument(doc)                    -> native share / "open in" sheet
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import storage, { STORAGE_KEYS } from './storage';

const isNative = Capacitor.isNativePlatform();
const DIR = 'rp-documents';

export const DOC_TYPES = ['Lab', 'Test', 'Imaging'];
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // keeps the native bridge and PDF export responsive

export const isPdf = (doc) => doc?.mimeType === 'application/pdf';
export const isImage = (doc) => (doc?.mimeType || '').startsWith('image/');

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const extFor = (mime, name) => {
  const fromName = (name || '').split('.').pop();
  if (fromName && fromName.length <= 5 && fromName !== name) return fromName.toLowerCase();
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/heic') return 'heic';
  return 'jpg';
};

const readAsDataUrl = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(r.error || new Error('Could not read file'));
  r.readAsDataURL(blob);
});

/* ── Web: IndexedDB file store ── */
const IDB_NAME = 'resilientPathFiles';
const IDB_STORE = 'files';

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbRun(mode, fn) {
  const db = await idbOpen();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, mode);
      const req = fn(tx.objectStore(IDB_STORE));
      tx.oncomplete = () => resolve(req?.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/* ── Public API ── */

export async function listDocuments() {
  const list = await storage.get(STORAGE_KEYS.DOCUMENTS);
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function addDocument({ file, title, date, type }) {
  if (!file) throw new Error('Choose a file to attach.');
  const mimeType = file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : '');
  if (mimeType !== 'application/pdf' && !mimeType.startsWith('image/')) {
    throw new Error('Please choose a photo or a PDF.');
  }
  if (file.size > MAX_FILE_BYTES) throw new Error('That file is larger than 20 MB. Please choose a smaller one.');

  const id = newId();
  const path = `${DIR}/${id}.${extFor(mimeType, file.name)}`;

  if (isNative) {
    const dataUrl = await readAsDataUrl(file);
    await Filesystem.writeFile({
      path,
      directory: Directory.Data,
      data: String(dataUrl).split(',')[1],
      recursive: true,
    });
  } else {
    await idbRun('readwrite', (os) => os.put(file, id));
  }

  const doc = {
    id,
    title: (title || '').trim() || file.name || 'Untitled',
    date: date || '',
    type: DOC_TYPES.includes(type) ? type : 'Lab',
    mimeType,
    fileName: file.name || '',
    size: file.size,
    createdAt: new Date().toISOString(),
    path,
  };
  const list = await listDocuments();
  await storage.set(STORAGE_KEYS.DOCUMENTS, [doc, ...list]);
  return doc;
}

export async function deleteDocument(id) {
  const list = await listDocuments();
  const doc = list.find(d => d.id === id);
  await storage.set(STORAGE_KEYS.DOCUMENTS, list.filter(d => d.id !== id));
  if (!doc) return;
  try {
    if (isNative) await Filesystem.deleteFile({ path: doc.path, directory: Directory.Data });
    else await idbRun('readwrite', (os) => os.delete(id));
  } catch { /* already gone */ }
}

async function getBlob(doc) {
  const blob = await idbRun('readonly', (os) => os.get(doc.id));
  return blob instanceof Blob ? blob : null;
}

/** URL for viewing in the app; null if the file isn't on this device (e.g. after restoring a backup). */
export async function getDocumentUrl(doc) {
  try {
    if (isNative) {
      await Filesystem.stat({ path: doc.path, directory: Directory.Data });
      const { uri } = await Filesystem.getUri({ path: doc.path, directory: Directory.Data });
      return Capacitor.convertFileSrc(uri);
    }
    const blob = await getBlob(doc);
    return blob ? URL.createObjectURL(blob) : null;
  } catch {
    return null;
  }
}

export function revokeDocumentUrl(url) {
  if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
}

export async function getDocumentDataUrl(doc) {
  try {
    if (isNative) {
      const res = await Filesystem.readFile({ path: doc.path, directory: Directory.Data });
      if (typeof res.data !== 'string') return readAsDataUrl(res.data);
      return `data:${doc.mimeType};base64,${res.data}`;
    }
    const blob = await getBlob(doc);
    return blob ? readAsDataUrl(blob) : null;
  } catch {
    return null;
  }
}

/** Native only: hand the file to the system share / "open in" sheet (the user picks where it goes). */
export async function shareDocument(doc) {
  // Share from a cache copy with a readable name: Android's FileProvider only
  // exposes the cache/external dirs, and the receiving app sees the name.
  const safe = (doc.title || 'document').replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'document';
  const to = `${safe}.${doc.path.split('.').pop()}`; // cache root: no parent dir to create
  try { await Filesystem.deleteFile({ path: to, directory: Directory.Cache }); } catch { /* none yet */ }
  const { uri } = await Filesystem.copy({ from: doc.path, directory: Directory.Data, to, toDirectory: Directory.Cache });
  try {
    await Share.share({ title: doc.title, url: uri, dialogTitle: doc.title });
  } catch { /* dismissed */ }
}
