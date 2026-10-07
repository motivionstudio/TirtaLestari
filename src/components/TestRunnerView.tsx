// SIM-TIRTA LESTARI Automated Test Suite View
// Menguji Secara Langsung 10 Kasus Uji Kritikal Logika Bisnis & Integritas Sistem

import React, { useState } from 'react';
import { TestRunner, TestResult } from '../services/tests';
import { AppStorage } from '../services/storage';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

export const TestRunnerView: React.FC = () => {
  const tariffs = AppStorage.getTariffs();
  const [results, setResults] = useState<TestResult[]>(() =>
    TestRunner.runAllTests(tariffs)
  );
  const [isRunning, setIsRunning] = useState(false);

  const handleRunAll = () => {
    setIsRunning(true);
    setTimeout(() => {
      const freshResults = TestRunner.runAllTests(tariffs);
      setResults(freshResults);
      setIsRunning(false);
    }, 500);
  };

  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            <span>Pengujian Otomatis Sistem (Test Suite)</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Verifikasi langsung formula tarif progresif per blok, nomor kwitansi, normalisasi WA, denda, dan aturan privasi.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunAll}
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isRunning ? 'Sedang Menguji...' : 'Jalankan Semua Tes'}</span>
          </button>
        </div>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase block">Total Pengujian</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">
              {results.length} Kasus
            </span>
          </div>
          <div className="w-12 h-12 bg-sky-50 text-sky-700 rounded-2xl flex items-center justify-center font-bold">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase block">
              Lolos (Passed)
            </span>
            <span className="text-3xl font-black text-emerald-700 mt-1 block">
              {passCount} Tes
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
            failCount === 0
              ? 'bg-slate-50 border-slate-200'
              : 'bg-rose-50 border-rose-200'
          }`}
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase block">Gagal (Failed)</span>
            <span
              className={`text-3xl font-black mt-1 block ${
                failCount === 0 ? 'text-slate-400' : 'text-rose-700'
              }`}
            >
              {failCount} Tes
            </span>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
              failCount === 0 ? 'bg-slate-200 text-slate-500' : 'bg-rose-600 text-white'
            }`}
          >
            {failCount === 0 ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </div>
        </div>
      </div>

      {/* Test Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-sm">
            Rincian Hasil Pengujian Unit & Integrasi
          </span>
          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded">
            Tingkat Kelulusan: {Math.round((passCount / results.length) * 100)}%
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {results.map((res) => (
            <div key={res.testId} className="p-4 hover:bg-slate-50/80 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 shrink-0">
                    {res.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {res.testId}
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm">{res.name}</span>
                      <span className="text-[11px] text-sky-800 bg-sky-50 px-2 py-0.5 rounded font-semibold">
                        {res.category}
                      </span>
                    </div>

                    {res.details && (
                      <p className="text-xs text-slate-600 mt-1 font-mono">{res.details}</p>
                    )}

                    <div className="flex items-center space-x-4 text-xs mt-2 text-slate-500 font-mono">
                      <span>
                        Harapan: <strong className="text-slate-800">{res.expected}</strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Hasil Aktual:{' '}
                        <strong className={res.passed ? 'text-emerald-700' : 'text-rose-700'}>
                          {res.actual}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-black px-3 py-1 rounded-full ${
                    res.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {res.passed ? 'LOLOS (PASS)' : 'GAGAL (FAIL)'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
