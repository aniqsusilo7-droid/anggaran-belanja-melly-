import { useState } from 'react';
import { motion } from 'motion/react';
import { BudgetCategory } from '../types';
import { formatRupiah } from '../utils/budgetHelpers';
import LucideIcon from './LucideIcon';

interface BudgetCategoryCardProps {
  key?: any;
  category: BudgetCategory;
  onAddExpenseClick: (categoryId: string) => void;
  onUpdateBudgetLimit: (categoryId: string, newLimit: number) => void;
  onDeleteCategory: (categoryId: string) => void;
  onEditCategory: (category: BudgetCategory) => void;
  onViewTransactions: (categoryId: string) => void;
}

export default function BudgetCategoryCard({
  category,
  onAddExpenseClick,
  onUpdateBudgetLimit,
  onDeleteCategory,
  onEditCategory,
  onViewTransactions
}: BudgetCategoryCardProps) {
  const percentage = Math.min(Math.round((category.spent / category.allocatedBudget) * 100), 200);
  const isOver = category.spent > category.allocatedBudget;
  const isWarning = !isOver && (category.spent / category.allocatedBudget) >= 0.85;

  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(category.allocatedBudget.toString());

  const handleLimitSubmit = () => {
    const newLimit = parseInt(limitInput, 10);
    if (!isNaN(newLimit) && newLimit >= 0) {
      onUpdateBudgetLimit(category.id, newLimit);
    } else {
      setLimitInput(category.allocatedBudget.toString());
    }
    setIsEditingLimit(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLimitSubmit();
    }
  };

  let progressColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let textColor = 'text-emerald-700';
  let cardBorder = 'border-slate-200 hover:border-blue-300';

  if (isOver) {
    progressColor = 'bg-rose-500';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    textColor = 'text-rose-700';
    cardBorder = 'border-rose-100 hover:border-rose-200 shadow-rose-50/50';
  } else if (isWarning) {
    progressColor = 'bg-amber-500';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    textColor = 'text-amber-700';
    cardBorder = 'border-amber-100 hover:border-amber-200 shadow-amber-50/50';
  } else {
    // Normal / Emerald
    switch (category.color) {
      case 'emerald':
        progressColor = 'bg-emerald-500';
        badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        textColor = 'text-emerald-700';
        break;
      case 'blue':
        progressColor = 'bg-blue-500';
        badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
        textColor = 'text-blue-700';
        break;
      case 'amber':
        progressColor = 'bg-amber-500';
        badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
        textColor = 'text-amber-700';
        break;
      case 'rose':
        progressColor = 'bg-rose-500';
        badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
        textColor = 'text-rose-700';
        break;
      case 'purple':
        progressColor = 'bg-purple-500';
        badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
        textColor = 'text-purple-700';
        break;
      default:
        progressColor = 'bg-slate-500';
        badgeColor = 'bg-slate-50 text-slate-700 border-slate-200';
        textColor = 'text-slate-700';
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      id={`cat-card-${category.id}`}
      className={`bg-white rounded-2xl p-5 border shadow-sm transition-all duration-200 flex flex-col justify-between ${cardBorder}`}
    >
      <div>
        {/* Header: Icon, Name & Action buttons */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${badgeColor} border flex items-center justify-center`}>
              <LucideIcon name={category.icon} size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base tracking-tight leading-tight">
                {category.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Pos Anggaran</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditCategory(category)}
              className="text-slate-300 hover:text-blue-500 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              title="Ubah Kategori"
              id={`btn-edit-${category.id}`}
            >
              <LucideIcon name="Pencil" size={16} />
            </button>
            <button
              onClick={() => onDeleteCategory(category.id)}
              className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              title="Hapus Kategori"
              id={`btn-del-${category.id}`}
            >
              <LucideIcon name="Trash2" size={16} />
            </button>
          </div>
        </div>

        {/* Budget Progress & Metrics */}
        <div className="space-y-2 mb-5">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium text-slate-500">Terpakai</span>
            <span className={`text-base font-bold ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>
              {formatRupiah(category.spent)}
            </span>
          </div>

          {/* Custom Sleek Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${progressColor}`}
            />
          </div>

          {/* Budget Info Row */}
          <div className="flex justify-between text-xs font-medium text-slate-400 pt-1">
            <span>Limit: {formatRupiah(category.allocatedBudget)}</span>
            <span className={`px-1.5 py-0.5 rounded-md ${isOver ? 'bg-rose-50 text-rose-600 font-semibold' : ''}`}>
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Adjust Budget Quick Controls & Actions */}
      <div className="space-y-3 pt-3 border-t border-slate-50">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-xs font-semibold text-slate-400">Atur Limit:</span>
          <div className="flex items-center gap-1">
            {isEditingLimit ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  onBlur={handleLimitSubmit}
                  onKeyDown={handleKeyDown}
                  className="w-24 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsEditingLimit(true);
                  setLimitInput(category.allocatedBudget.toString());
                }}
                className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded cursor-pointer transition-colors"
                title="Ubah limit budget"
              >
                {formatRupiah(category.allocatedBudget)}
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onViewTransactions(category.id)}
            className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition-all"
            id={`btn-view-${category.id}`}
          >
            <LucideIcon name="Calendar" size={14} />
            Transaksi
          </button>
          <button
            onClick={() => onAddExpenseClick(category.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all"
            id={`btn-add-${category.id}`}
          >
            <LucideIcon name="PlusCircle" size={14} />
            Belanja
          </button>
        </div>
      </div>
    </motion.div>
  );
}
