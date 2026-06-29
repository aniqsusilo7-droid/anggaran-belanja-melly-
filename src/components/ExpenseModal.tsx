import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BudgetCategory } from '../types';
import { formatRupiah } from '../utils/budgetHelpers';
import LucideIcon from './LucideIcon';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: BudgetCategory[];
  preSelectedCategoryId?: string;
  onAddExpense: (categoryId: string, amount: number, description: string, date: string) => void;
}

export default function ExpenseModal({
  isOpen,
  onClose,
  categories,
  preSelectedCategoryId = '',
  onAddExpense
}: ExpenseModalProps) {
  const [categoryId, setCategoryId] = useState(preSelectedCategoryId || (categories[0]?.id || ''));
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCategoryId(preSelectedCategoryId || (categories[0]?.id || ''));
      setAmountStr('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [isOpen, preSelectedCategoryId, categories]);

  // Handle preset clicks
  const applyPreset = (val: number) => {
    setAmountStr(val.toString());
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setError('Masukkan jumlah pengeluaran yang valid (harus lebih dari 0)');
      return;
    }

    if (!categoryId) {
      setError('Silakan pilih kategori anggaran terlebih dahulu');
      return;
    }

    if (!description.trim()) {
      setError('Tuliskan keterangan belanja/pengeluaran');
      return;
    }

    onAddExpense(categoryId, amount, description, date);
    
    // Reset state
    setAmountStr('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

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
                <h3 className="text-lg font-bold text-slate-800">Catat Pengeluaran Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">Catat setiap pengeluaran dari pos anggaran Anda</p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl transition-colors"
                id="btn-close-expense-modal"
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

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nominal Pengeluaran (Rp)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-semibold text-sm">Rp</span>
                  </div>
                  <input
                    type="number"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold text-lg focus:outline-none focus:border-slate-300 focus:bg-white transition-all"
                    autoFocus
                    required
                    id="input-expense-amount"
                  />
                </div>

                {/* Nominal Presets */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[25000, 50000, 100000, 250000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="text-xs font-semibold bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 py-1.5 rounded-lg transition-colors"
                    >
                      +{preset / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Select */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pilih Pos Anggaran
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-medium focus:outline-none focus:border-slate-300 focus:bg-white transition-all"
                    id="select-expense-category"
                  >
                    <option value="" disabled>Pilih Pos...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} (Limit Sisa: {formatRupiah(Math.max(0, cat.allocatedBudget - cat.spent))})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Keterangan Belanja
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Beli telur dan sayuran di pasar"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-all"
                  required
                  id="input-expense-desc"
                />
              </div>

              {/* Date Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tanggal Pengeluaran
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 focus:outline-none focus:border-slate-300 focus:bg-white transition-all"
                    required
                    id="input-expense-date"
                  />
                </div>
              </div>

              {/* Warning Preview if nearing budget */}
              {selectedCategory && amountStr && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1.5 text-xs text-slate-500">
                  <div className="flex justify-between font-medium">
                    <span>Sisa Budget Saat Ini:</span>
                    <span className="font-bold text-slate-700">
                      {formatRupiah(selectedCategory.allocatedBudget - selectedCategory.spent)}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Setelah Belanja Ini:</span>
                    <span className={`font-bold ${
                      selectedCategory.spent + parseFloat(amountStr || '0') > selectedCategory.allocatedBudget
                        ? 'text-rose-600'
                        : 'text-slate-700'
                    }`}>
                      {formatRupiah(selectedCategory.allocatedBudget - (selectedCategory.spent + parseFloat(amountStr || '0')))}
                    </span>
                  </div>
                  {selectedCategory.spent + parseFloat(amountStr || '0') >= selectedCategory.allocatedBudget * 0.85 && (
                    <div className="text-amber-600 font-semibold flex items-center gap-1 mt-1">
                      <LucideIcon name="AlertTriangle" size={12} />
                      Belanja ini akan memicu notifikasi limit anggaran!
                    </div>
                  )}
                </div>
              )}

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
                  id="btn-submit-expense"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
