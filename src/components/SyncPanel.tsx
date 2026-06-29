import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LucideIcon from './LucideIcon';

interface SyncPanelProps {
  onTriggerSync: () => Promise<void> | void;
  categoriesCount: number;
  expensesCount: number;
}

export default function SyncPanel({ onTriggerSync, categoriesCount, expensesCount }: SyncPanelProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('id-ID'));

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      await onTriggerSync();
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString('id-ID'));
      setSyncMessage('Sinkronisasi cloud berhasil! Seluruh data anggaran dan catatan belanja Anda telah diperbarui dari Firebase.');
    } catch (error) {
      console.error(error);
      setSyncMessage('Sinkronisasi gagal. Pastikan Anda memiliki koneksi internet yang stabil.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6" id="sync-panel">
      {/* Overview Cloud Card */}
      <div className="bg-white rounded-3xl p-6 relative overflow-hidden shadow-sm border border-slate-200">
        <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute left-1/3 bottom-[-50px] w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              SINKRONISASI CLOUD AKTIF
            </div>
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Google Firebase Database</h3>
            <p className="text-slate-500 text-xs max-w-md leading-relaxed">
              Seluruh data pos anggaran dan riwayat belanja Anda kini disimpan secara aman di layanan cloud Firebase Firestore secara real-time.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-w-[200px] flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <LucideIcon name="CloudLightning" className="text-blue-500 shrink-0" size={14} />
              <span className="text-xs font-semibold text-slate-400">Sinkronisasi Terakhir</span>
            </div>
            <p className="text-lg font-black text-slate-900">{lastSyncTime}</p>
            <p className="text-[10px] text-slate-500 mt-1">
              Data Cloud: {categoriesCount} Pos | {expensesCount} Transaksi
            </p>
          </div>
        </div>
      </div>

      {/* Cloud Sync Status & Manual Refresher */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-sm">Status Sinkronisasi Multi-Perangkat</h4>
            <p className="text-xs text-slate-400 max-w-lg">
              Setiap kali Anda menambah pos atau mencatat belanja, data otomatis tersimpan ke cloud. Tekan tombol di samping jika Anda ingin memuat paksa data terbaru dari perangkat lain.
            </p>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0"
          >
            <LucideIcon name="RefreshCw" className={isSyncing ? 'animate-spin' : ''} size={14} />
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
          </button>
        </div>

        {/* Database Credentials / Info List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <LucideIcon name="ShieldCheck" size={16} />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-700">Penyimpanan Aman</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                Menggunakan aturan keamanan Firestore yang tersertifikasi untuk menjamin data Anda tidak dapat diakses oleh pihak luar.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <LucideIcon name="Layers" size={16} />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-700">Arsitektur Off-line First</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                Aplikasi tetap berjalan mulus meskipun perangkat Anda offline. Perubahan akan disinkronkan otomatis saat koneksi kembali terhubung.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sync success/failure notifications */}
      <AnimatePresence>
        {syncMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-start gap-3 text-xs"
          >
            <LucideIcon name="CheckCircle" className="shrink-0 text-emerald-600 mt-0.5" size={16} />
            <div className="space-y-1">
              <p className="font-bold">Notifikasi Sistem</p>
              <p className="leading-relaxed font-medium">{syncMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
