import { useState, useRef } from 'react';
import { Download, Upload, ClipboardCopy, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCollection } from '../lib/CollectionContext';
import { exportCollectionJson, importCollectionJson, clearCollection } from '../lib/storage';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getAllStickers } from '../lib/stickers';

export function BackupPage() {
  const { collection, updateCollection } = useCollection();
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importWarning, setImportWarning] = useState('');
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<Record<string, unknown> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const json = exportCollectionJson(collection);

  async function handleCopy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stickerswap-2026-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportText((ev.target?.result as string) ?? '');
    };
    reader.readAsText(file);
  }

  function handleValidateImport() {
    setImportError('');
    setImportWarning('');
    try {
      const imported = importCollectionJson(importText);
      const allIds = new Set(getAllStickers().map((s) => s.id));
      const unknown = Object.keys(imported).filter((id) => !allIds.has(id));
      if (unknown.length > 0) {
        setImportWarning(
          `${unknown.length} unknown sticker ID(s) will be ignored: ${unknown.slice(0, 5).join(', ')}${unknown.length > 5 ? '...' : ''}`
        );
      }
      // Filter unknown IDs
      const cleaned: Record<string, unknown> = {};
      for (const [id, entry] of Object.entries(imported)) {
        if (allIds.has(id)) cleaned[id] = entry;
      }
      setPendingImport(cleaned);
      setShowImportConfirm(true);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Invalid file format');
    }
  }

  function handleConfirmImport() {
    if (!pendingImport) return;
    updateCollection(pendingImport as Parameters<typeof updateCollection>[0]);
    setImportText('');
    setPendingImport(null);
    setShowImportConfirm(false);
    setImportWarning('');
  }

  function handleReset() {
    clearCollection();
    updateCollection({});
    setShowResetConfirm(false);
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Backup</h1>

      {/* Export */}
      <Section title="Export Collection">
        <p className="text-xs text-gray-500 mb-3">
          Save your collection to a file or copy it to the clipboard.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 active:bg-gray-50"
          >
            {copied ? (
              <CheckCircle size={15} className="text-emerald-500" />
            ) : (
              <ClipboardCopy size={15} />
            )}
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold active:bg-blue-700"
          >
            <Download size={15} />
            Download
          </button>
        </div>
      </Section>

      {/* Import */}
      <Section title="Import Collection">
        <p className="text-xs text-gray-500 mb-3">
          Restore a previously exported collection. Unknown sticker IDs will be ignored.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dashed border-gray-300 text-sm text-gray-600 mb-2 active:bg-gray-50"
        >
          <Upload size={15} />
          Choose JSON file
        </button>
        <p className="text-xs text-gray-400 text-center mb-2">— or paste JSON below —</p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste collection JSON here..."
          className="w-full h-24 px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
        />
        {importWarning && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mt-2">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">{importWarning}</p>
          </div>
        )}
        {importError && <p className="text-xs text-red-500 mt-1">{importError}</p>}
        <button
          onClick={handleValidateImport}
          disabled={!importText.trim()}
          className="w-full mt-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40 active:bg-emerald-700"
        >
          Validate & Import
        </button>
      </Section>

      {/* Reset */}
      <Section title="Reset">
        <p className="text-xs text-gray-500 mb-3">
          Permanently delete all local collection data. This cannot be undone.
        </p>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-red-200 text-red-600 text-sm font-semibold active:bg-red-50"
        >
          <Trash2 size={15} />
          Reset Local Collection
        </button>
      </Section>

      {showImportConfirm && (
        <ConfirmDialog
          title="Import Collection?"
          message="This will overwrite your current collection with the imported data. Continue?"
          confirmLabel="Import"
          onConfirm={handleConfirmImport}
          onCancel={() => setShowImportConfirm(false)}
        />
      )}

      {showResetConfirm && (
        <ConfirmDialog
          title="Reset Collection?"
          message="This will permanently delete all your sticker data from this device. Are you absolutely sure?"
          confirmLabel="Yes, Reset Everything"
          cancelLabel="Keep my data"
          destructive
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <h2 className="font-semibold text-sm text-gray-900 mb-1">{title}</h2>
      {children}
    </div>
  );
}
