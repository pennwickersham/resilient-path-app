import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Plus, Trash2, Eye, X, Share2, FileText, Image as ImageIcon, Loader2, Paperclip, ShieldCheck } from 'lucide-react';
import {
  DOC_TYPES, listDocuments, addDocument, deleteDocument,
  getDocumentUrl, revokeDocumentUrl, shareDocument, isPdf,
} from '../services/healthDocuments';
import { localDateStr } from '../utils/dates';

const isNative = Capacitor.isNativePlatform();
const isAndroid = Capacitor.getPlatform() === 'android';

const inputClass = 'w-full border border-secondary-200 rounded-xl p-3 text-secondary-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-white';
const labelClass = 'text-xs font-semibold text-secondary-500 uppercase tracking-wide';

const TYPE_STYLES = {
  Lab: 'bg-primary-50 text-primary-700 border-primary-100',
  Test: 'bg-amber-50 text-amber-700 border-amber-100',
  Imaging: 'bg-purple-50 text-purple-700 border-purple-100',
};

const formatDate = (d) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return d || 'No date';
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const emptyDraft = () => ({ title: '', date: localDateStr(), type: 'Lab', file: null });

/**
 * Labs, tests and imaging — attach photos or PDFs, list, view, delete.
 * Files are stored only on this device (see services/healthDocuments.js).
 */
export default function HealthDocuments() {
  const [docs, setDocs] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewer, setViewer] = useState(null); // { doc, url } | { doc, missing: true }
  const fileRef = useRef(null);

  useEffect(() => {
    listDocuments().then(setDocs).catch(() => setDocs([]));
  }, []);

  // Release blob URLs when the viewer closes.
  useEffect(() => () => revokeDocumentUrl(viewer?.url), [viewer]);

  const refresh = async () => {
    setDocs(await listDocuments());
  };

  const save = async () => {
    setError('');
    if (!draft.file) { setError('Choose a photo or PDF to attach.'); return; }
    setBusy(true);
    try {
      await addDocument(draft);
      await refresh();
      setDraft(emptyDraft());
      if (fileRef.current) fileRef.current.value = '';
      setAdding(false);
    } catch (e) {
      console.error('Attach document failed', e);
      setError(e.message || 'Couldn’t save that file — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"? The file will be removed from this device.`)) return;
    await deleteDocument(doc.id);
    await refresh();
  };

  const view = async (doc) => {
    // Android's WebView can't display PDFs, so hand those to a PDF app.
    if (isAndroid && isPdf(doc)) {
      try { await shareDocument(doc); } catch { setViewer({ doc, missing: true }); }
      return;
    }
    const url = await getDocumentUrl(doc);
    setViewer(url ? { doc, url } : { doc, missing: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-3">
        <h3 className="text-lg font-bold text-secondary-900">Labs, Tests &amp; Imaging</h3>
      </div>

      <p className="text-secondary-500 text-xs flex items-start gap-1.5">
        <ShieldCheck size={14} className="text-primary-500 shrink-0 mt-0.5" />
        Attach photos or PDFs of lab results, tests and imaging reports. They stay on this device only and are listed in your appointment PDF.
      </p>

      {adding ? (
        <div className="bg-secondary-50 p-4 rounded-xl border border-secondary-100 space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Type</label>
            <div role="radiogroup" aria-label="Document type" className="flex gap-2">
              {DOC_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={draft.type === t}
                  onClick={() => setDraft(d => ({ ...d, type: t }))}
                  className={`flex-1 px-3 py-2 rounded-full text-sm font-medium border ${
                    draft.type === t ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-secondary-700 border-secondary-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="doc-title">Title</label>
            <input
              id="doc-title"
              className={inputClass}
              placeholder="e.g., Blood panel, Lumbar MRI"
              value={draft.title}
              onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="doc-date">Date</label>
            <input
              id="doc-date"
              type="date"
              className={inputClass}
              value={draft.date}
              onChange={(e) => setDraft(d => ({ ...d, date: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>File</label>
            <label className="flex items-center gap-2 border-2 border-dashed border-primary-200 rounded-xl p-3 text-sm text-primary-700 font-semibold cursor-pointer hover:bg-primary-50 transition-colors">
              <Paperclip size={16} className="shrink-0" />
              <span className="truncate">{draft.file ? draft.file.name || 'File selected' : 'Choose a photo or PDF'}</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setDraft(d => ({ ...d, file, title: d.title || (file?.name || '').replace(/\.[^.]+$/, '') }));
                }}
              />
            </label>
          </div>
          {error && <p className="text-xs font-semibold text-purple-700">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />} Save
            </button>
            <button
              onClick={() => { setAdding(false); setError(''); setDraft(emptyDraft()); }}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl border border-secondary-200 text-secondary-600 font-semibold text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary-200 text-primary-600 font-semibold text-sm hover:bg-primary-50 transition-colors"
        >
          <Plus size={18} />
          Add Lab, Test or Imaging
        </button>
      )}

      {docs === null ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary-500" size={24} /></div>
      ) : docs.length === 0 ? (
        <p className="text-center text-sm text-secondary-400 py-4">Nothing attached yet.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map(doc => (
            <li key={doc.id} className="bg-secondary-50 p-3 rounded-xl border border-secondary-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-secondary-100 text-secondary-500 flex items-center justify-center shrink-0">
                {isPdf(doc) ? <FileText size={20} /> : <ImageIcon size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-secondary-900 truncate">{doc.title}</p>
                <p className="text-xs text-secondary-500 flex items-center gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${TYPE_STYLES[doc.type] || TYPE_STYLES.Lab}`}>{doc.type}</span>
                  {formatDate(doc.date)}
                </p>
              </div>
              <button onClick={() => view(doc)} aria-label={`View ${doc.title}`} className="p-2 text-primary-600 hover:text-primary-800">
                <Eye size={18} />
              </button>
              <button onClick={() => remove(doc)} aria-label={`Delete ${doc.title}`} className="p-2 text-purple-400 hover:text-purple-600">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Viewer ── */}
      {viewer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex flex-col"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center gap-2 p-3 text-white">
            <p className="flex-1 min-w-0 font-bold truncate">{viewer.doc.title}</p>
            {isNative && !viewer.missing && (
              <button onClick={() => shareDocument(viewer.doc)} aria-label="Share" className="p-2 rounded-full hover:bg-white/10">
                <Share2 size={20} />
              </button>
            )}
            <button onClick={() => setViewer(null)} aria-label="Close" className="p-2 rounded-full hover:bg-white/10">
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center p-3">
            {viewer.missing ? (
              <p className="text-white/80 text-sm text-center max-w-xs">
                This file isn&apos;t on this device (backups include the list of documents, not the files). You can delete this entry and attach the file again.
              </p>
            ) : isPdf(viewer.doc) ? (
              <iframe title={viewer.doc.title} src={viewer.url} className="w-full h-full bg-white rounded-lg" />
            ) : (
              <img src={viewer.url} alt={viewer.doc.title} className="max-w-full max-h-full object-contain rounded-lg" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
