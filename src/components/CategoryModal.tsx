import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LucideIcon from './LucideIcon';
import { BudgetCategory } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCategory: (name: string, allocatedBudget: number, color: string, icon: string, categoryId?: string) => void;
  initialCategory?: BudgetCategory | null;
}

const AVAILABLE_ICONS = [
  { name: 'Utensils', label: 'Kuliner/Makanan' },
  { name: 'Car', label: 'Transportasi' },
  { name: 'Droplet', label: 'Air/Tagihan' },
  { name: 'Sparkles', label: 'Hiburan' },
  { name: 'HeartPulse', label: 'Kesehatan' },
  { name: 'ShoppingBag', label: 'Belanja' },
  { name: 'Home', label: 'Rumah Tangga' },
  { name: 'Smartphone', label: 'Pulsa/Data' },
  { name: 'BookOpen', label: 'Edukasi' },
  { name: 'Coins', label: 'Simpanan/Kas' }
];

const AVAILABLE_COLORS = [
  { value: 'emerald', label: 'Hijau', bg: 'bg-emerald-500' },
  { value: 'blue', label: 'Biru', bg: 'bg-blue-500' },
  { value: 'amber', label: 'Oranye', bg: 'bg-amber-500' },
  { value: 'rose', label: 'Merah', bg: 'bg-rose-500' },
  { value: 'purple', label: 'Ungu', bg: 'bg-purple-500' }
];

export default function CategoryModal({
  isOpen,
  onClose,
  onSaveCategory,
  initialCategory
}: CategoryModalProps) {
  const [name, setName] = useState('');
  const [allocatedBudgetStr, setAllocatedBudgetStr] = useState('');
  const [color, setColor] = useState('emerald');
  const [icon, setIcon] = useState('Utensils');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setName(initialCategory.name);
        setAllocatedBudgetStr(initialCategory.allocatedBudget.toString());
        setColor(initialCategory.color);
        setIcon(initialCategory.icon);
      } else {
        setName('');
        setAllocatedBudgetStr('');
        setColor('emerald');
        setIcon('Utensils');
      }
      setError('');
    }
  }, [isOpen, initialCategory]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Masukkan nama pos anggaran');
      return;
    }

    const budget = parseFloat(allocatedBudgetStr);
    if (isNaN(budget) || budget <= 0) {
      setError('Masukkan jumlah anggaran limit bulanan yang valid (harus lebih besar dari 0)');
      return;
    }

    onSaveCategory(name.trim(), budget, color, icon, initialCategory?.id);
    onClose();
  };

  const isEditing = !!initialCategory;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col max-h-[90vh] border border-slate-100"
          >
            {/* Grabber for mobile visual clue */}
            <div className="sm:hidden flex justify-center py-3">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 pt-2 sm:pt-6 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{isEditing ? 'Ubah Pos Anggaran' : 'Tambah Pos Anggaran'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{isEditing ? 'Ubah pengaturan pos anggaran' : 'Buat pos anggaran khusus untuk membatasi belanja'}</p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl transition-colors"
                id="btn-close-cat-modal"
              >
                <LucideIcon name="Minus" size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              {error && (
                <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl border border-rose-100 flex items-start gap-2">
                  <LucideIcon name="AlertTriangle" className="shrink-0 mt-0.5" size={14} />
                  <span>{error}</span>
                </div>
              )}

              {/* Name Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nama Pos Anggaran
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Belanja Bulanan, Pulsa, atau SPP Anak"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-all"
                  required
                  autoFocus
                  id="input-cat-name"
                />
              </div>

              {/* Limit Allocation Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Batas Anggaran Bulanan (Limit)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-semibold text-sm">Rp</span>
                  </div>
                  <input
                    type="number"
                    value={allocatedBudgetStr}
                    onChange={(e) => setAllocatedBudgetStr(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold text-base focus:outline-none focus:border-slate-300 focus:bg-white transition-all"
                    required
                    id="input-cat-budget"
                  />
                </div>
              </div>

              {/* Icon selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pilih Ikon Pos
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {AVAILABLE_ICONS.map((ico) => {
                    const isSelected = icon === ico.name;
                    return (
                      <button
                        key={ico.name}
                        type="button"
                        onClick={() => setIcon(ico.name)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                        title={ico.label}
                      >
                        <LucideIcon name={ico.name} size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pilih Warna Tema Pos
                </label>
                <div className="flex items-center gap-3">
                  {AVAILABLE_COLORS.map((col) => {
                    const isSelected = color === col.value;
                    return (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => setColor(col.value)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isSelected ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent scale-100'
                        }`}
                        title={col.label}
                      >
                        <span className={`w-8 h-8 rounded-full ${col.bg} block`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-slate-200 text-slate-500 font-semibold text-sm rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 text-white font-semibold text-sm rounded-2xl hover:bg-slate-800 shadow-md transition-colors"
                  id="btn-submit-cat"
                >
                  {isEditing ? 'Simpan Perubahan' : 'Buat Pos Baru'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
