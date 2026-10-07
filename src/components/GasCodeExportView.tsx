// SIM-TIRTA LESTARI Google Apps Script Code Export Center
// Viewer, Copy, dan Download Semua File Kode .gs & .html Siap Deploy ke Google Sheets

import React, { useState } from 'react';
import { GAS_FILES, GasFile } from '../services/gasCodeRepository';
import {
  Code2,
  Copy,
  Download,
  CheckCircle2,
  FileCode,
  Layers,
  Terminal,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export const GasCodeExportView: React.FC = () => {
  const [selectedFileName, setSelectedFileName] = useState<string>('Config.gs');
  const [copySuccess, setCopySuccess] = useState(false);

  const selectedFile =
    GAS_FILES.find((f) => f.name === selectedFileName) || GAS_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <Code2 className="w-7 h-7 text-sky-600" />
            <span>Pusat Kode Google Apps Script & Clasp</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Seluruh berkas backend .gs, router, konfigurasi, dan panduan README lengkap siap salin ke Google Apps Script.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopyCode}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-md transition cursor-pointer"
          >
            {copySuccess ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
            <span>{copySuccess ? 'Tersalin!' : 'Salin Kode Ini'}</span>
          </button>

          <button
            onClick={handleDownloadFile}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-sm transition cursor-pointer text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Berkas</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kolom Kiri: Daftar Berkas GAS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-slate-800 text-sm px-2 uppercase tracking-wider text-xs">
            Daftar Berkas Proyek ({GAS_FILES.length})
          </h3>

          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {GAS_FILES.map((f) => {
              const isSelected = f.name === selectedFileName;

              return (
                <button
                  key={f.name}
                  onClick={() => setSelectedFileName(f.name)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-sky-600 text-white font-black shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileCode className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-sky-600'}`} />
                    <span className="font-mono truncate">{f.name}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {f.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Guide */}
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 space-y-1">
            <span className="font-bold block flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Cara Pasang ke Google Sheets:</span>
            </span>
            <p className="text-[11px] text-sky-800 leading-snug">
              Buka Google Sheets &rarr; Ekstensi &rarr; Apps Script &rarr; Buat file sesuai nama di atas
              &rarr; Tempel isi kodenya &rarr; Jalankan fungsi <code className="font-mono font-bold">setupSystem()</code>.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Code Preview Area */}
        <div className="lg:col-span-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between">
          {/* Top Bar of Code Editor */}
          <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm font-bold text-sky-400">
                {selectedFile.name}
              </span>
              <span className="text-xs text-slate-400">
                &mdash; {selectedFile.description}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copySuccess ? 'Tersalin!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code Body */}
          <div className="p-5 overflow-x-auto max-h-[650px] overflow-y-auto">
            <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
              <code>{selectedFile.content}</code>
            </pre>
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-900/80 px-5 py-2.5 border-t border-slate-800 text-slate-400 text-xs flex items-center justify-between">
            <span>KPSPAM Tirta Lestari &bull; Google Apps Script Ready</span>
            <span className="font-mono">{selectedFile.content.split('\n').length} lines</span>
          </div>
        </div>
      </div>
    </div>
  );
};
