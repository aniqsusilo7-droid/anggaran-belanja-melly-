/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BudgetCategory, Expense, SystemNotification } from './types';
import { INITIAL_CATEGORIES, INITIAL_EXPENSES } from './data/mockData';
import { formatRupiah, checkBudgetLimits } from './utils/budgetHelpers';
import {
  fetchCategories,
  fetchExpenses,
  fetchNotifications,
  saveCategory,
  deleteCategoryAndExpenses,
  saveExpense,
  deleteExpenseDoc,
  saveNotifications,
  uploadAllLocalData
} from './firebase';

// Subcomponents
import BudgetCategoryCard from './components/BudgetCategoryCard';
import ExpenseModal from './components/ExpenseModal';
import CategoryModal from './components/CategoryModal';
import AnalyticsPanel from './components/AnalyticsPanel';
import SyncPanel from './components/SyncPanel';
import AiAnalysisPanel from './components/AiAnalysisPanel';
import LucideIcon from './components/LucideIcon';

const THEMES = [
  {
    id: 'default',
    name: 'Default Slate',
    accentColor: 'blue-600',
    bgMain: 'bg-slate-50',
    bgHeader: 'bg-white',
    borderHeader: 'border-slate-200',
    textMain: 'text-slate-800',
    textMuted: 'text-slate-500',
    textTitle: 'text-slate-900',
    bgCard: 'bg-white',
    borderCard: 'border-slate-200',
    bgBadge: 'bg-slate-100',
    accentBg: 'bg-blue-600 hover:bg-blue-700 text-white',
    accentText: 'text-blue-600',
    bgNav: 'bg-white border-slate-200',
    isDark: false,
    navActive: 'text-blue-600 bg-blue-50/70 font-semibold',
    navInactive: 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
  },
  {
    id: 'midnight',
    name: 'Midnight Ocean',
    accentColor: 'teal-500',
    bgMain: 'bg-slate-950',
    bgHeader: 'bg-slate-900',
    borderHeader: 'border-slate-800',
    textMain: 'text-slate-200',
    textMuted: 'text-slate-400',
    textTitle: 'text-white',
    bgCard: 'bg-slate-900',
    borderCard: 'border-slate-800',
    bgBadge: 'bg-slate-800',
    accentBg: 'bg-teal-500 hover:bg-teal-600 text-slate-950',
    accentText: 'text-teal-400',
    bgNav: 'bg-slate-900 border-slate-800',
    isDark: true,
    navActive: 'text-teal-400 bg-teal-950/70 font-semibold',
    navInactive: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
  },
  {
    id: 'forest',
    name: 'Warm Forest',
    accentColor: 'emerald-600',
    bgMain: 'bg-emerald-50/30',
    bgHeader: 'bg-emerald-900',
    borderHeader: 'border-emerald-800',
    textMain: 'text-stone-800',
    textMuted: 'text-stone-500',
    textTitle: 'text-white',
    bgCard: 'bg-white',
    borderCard: 'border-emerald-100',
    bgBadge: 'bg-emerald-100/50',
    accentBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    accentText: 'text-emerald-700',
    bgNav: 'bg-emerald-900 border-emerald-800',
    isDark: false,
    navActive: 'text-white bg-emerald-800/80 font-semibold',
    navInactive: 'text-emerald-200 hover:text-white hover:bg-emerald-800/40'
  },
  {
    id: 'lavender',
    name: 'Cosmic Lavender',
    accentColor: 'violet-500',
    bgMain: 'bg-zinc-950',
    bgHeader: 'bg-purple-950',
    borderHeader: 'border-purple-900',
    textMain: 'text-zinc-200',
    textMuted: 'text-zinc-400',
    textTitle: 'text-white',
    bgCard: 'bg-zinc-900',
    borderCard: 'border-purple-950',
    bgBadge: 'bg-purple-900/40',
    accentBg: 'bg-violet-500 hover:bg-violet-600 text-white',
    accentText: 'text-violet-400',
    bgNav: 'bg-purple-950 border-purple-900',
    isDark: true,
    navActive: 'text-violet-300 bg-purple-900/50 font-semibold',
    navInactive: 'text-purple-200 hover:text-white hover:bg-purple-900/20'
  },
  {
    id: 'sunset',
    name: 'Sunset Rose',
    accentColor: 'rose-500',
    bgMain: 'bg-rose-50/40',
    bgHeader: 'bg-rose-500',
    borderHeader: 'border-rose-600',
    textMain: 'text-rose-950',
    textMuted: 'text-rose-700/60',
    textTitle: 'text-white',
    bgCard: 'bg-white',
    borderCard: 'border-rose-100',
    bgBadge: 'bg-rose-100/50',
    accentBg: 'bg-rose-500 hover:bg-rose-600 text-white',
    accentText: 'text-rose-600',
    bgNav: 'bg-rose-500 border-rose-600',
    isDark: false,
    navActive: 'text-white bg-rose-600/80 font-semibold',
    navInactive: 'text-rose-100 hover:text-white hover:bg-rose-600/40'
  }
];

export default function App() {
  // --- Core State ---
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  
  // --- UI/Theme State ---
  const [currentTheme, setCurrentTheme] = useState<string>(() => localStorage.getItem('app_theme') || 'default');
  
  const theme = useMemo(() => {
    return THEMES.find(t => t.id === currentTheme) || THEMES[0];
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('app_theme', currentTheme);
    if (theme.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme, theme]);

  // --- UI/Navigation State ---
  const [activeMonth, setActiveMonth] = useState<string>(new Date().toISOString().substring(0, 7)); // 'YYYY-MM'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'analytics' | 'sync' | 'ai'>('dashboard');
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedCatForExpense, setSelectedCatForExpense] = useState<string>('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [txFilterCategory, setTxFilterCategory] = useState<string>('all');
  
  // Active transient banner/toast for push alert simulations
  const [activeToast, setActiveToast] = useState<SystemNotification | null>(null);

  // --- Filtered Data ---
  const currentMonthCategories = useMemo(() => {
    return categories.filter(c => !c.month || c.month === activeMonth);
  }, [categories, activeMonth]);

  const currentMonthExpenses = useMemo(() => {
    return expenses
      .filter(e => e.date.startsWith(activeMonth))
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.id.localeCompare(a.id);
      });
  }, [expenses, activeMonth]);

  // --- Deletion Dialog State ---
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'category' | 'expense';
    id: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'category',
    id: '',
    title: '',
    message: ''
  });

  // --- Initialize State ---
  useEffect(() => {
    async function initData() {
      try {
        const fbCats = await fetchCategories();
        const fbExpenses = await fetchExpenses();
        const fbNotifs = await fetchNotifications();

        if (fbCats && fbCats.length > 0) {
          // Sort categories or map them
          setCategories(fbCats);
          setExpenses(fbExpenses);
          setNotifications(fbNotifs);
          saveToStorage(fbCats, fbExpenses, fbNotifs);
        } else {
          // Firebase is empty, check localStorage or use mock
          const storedCats = localStorage.getItem('budget_categories');
          const storedExpenses = localStorage.getItem('budget_expenses');
          const storedNotifs = localStorage.getItem('budget_notifications');

          if (storedCats && storedExpenses) {
            const c = JSON.parse(storedCats);
            const e = JSON.parse(storedExpenses);
            const n = storedNotifs ? JSON.parse(storedNotifs) : [];
            setCategories(c);
            setExpenses(e);
            setNotifications(n);
            // Upload to firebase
            await uploadAllLocalData(c, e, n);
          } else {
            setCategories(INITIAL_CATEGORIES);
            setExpenses(INITIAL_EXPENSES);
            const initialAlerts = checkBudgetLimits(INITIAL_CATEGORIES);
            setNotifications(initialAlerts);
            saveToStorage(INITIAL_CATEGORIES, INITIAL_EXPENSES, initialAlerts);
            // Upload to firebase
            await uploadAllLocalData(INITIAL_CATEGORIES, INITIAL_EXPENSES, initialAlerts);
          }
        }
      } catch (err) {
        console.warn("Could not fetch from Firebase, falling back to local storage:", err);
        // Fallback to local storage if offline/error
        const storedCats = localStorage.getItem('budget_categories');
        const storedExpenses = localStorage.getItem('budget_expenses');
        const storedNotifs = localStorage.getItem('budget_notifications');

        if (storedCats && storedExpenses) {
          setCategories(JSON.parse(storedCats));
          setExpenses(JSON.parse(storedExpenses));
          if (storedNotifs) {
            setNotifications(JSON.parse(storedNotifs));
          }
        } else {
          setCategories(INITIAL_CATEGORIES);
          setExpenses(INITIAL_EXPENSES);
          const initialAlerts = checkBudgetLimits(INITIAL_CATEGORIES);
          setNotifications(initialAlerts);
          saveToStorage(INITIAL_CATEGORIES, INITIAL_EXPENSES, initialAlerts);
        }
      }
    }
    initData();
  }, []);

  // --- Sync State Helper to Persist ---
  const saveToStorage = (updatedCats: BudgetCategory[], updatedExpenses: Expense[], updatedNotifs: SystemNotification[]) => {
    localStorage.setItem('budget_categories', JSON.stringify(updatedCats));
    localStorage.setItem('budget_expenses', JSON.stringify(updatedExpenses));
    localStorage.setItem('budget_notifications', JSON.stringify(updatedNotifs));
  };

  // --- Budget adjustments ---
  const handleUpdateBudgetLimit = async (categoryId: string, newLimit: number) => {
    const updated = categories.map((cat) => {
      if (cat.id === categoryId) {
        return { ...cat, allocatedBudget: newLimit };
      }
      return cat;
    });

    const adjustedCat = updated.find(c => c.id === categoryId);

    // Check budget limits again after limit adjustment
    const newAlerts = checkBudgetLimits(updated);
    
    // Find new notifications that weren't in the state before
    const existingIds = new Set(notifications.map(n => n.categoryId + '-' + n.type));
    const newlyTriggered = newAlerts.filter(n => !existingIds.has(n.categoryId + '-' + n.type));

    let finalNotifs = [...notifications];
    if (newlyTriggered.length > 0) {
      finalNotifs = [...newlyTriggered, ...notifications];
      // Trigger native-like toast alert
      setActiveToast(newlyTriggered[0]);
    }

    setCategories(updated);
    setNotifications(finalNotifs);
    saveToStorage(updated, expenses, finalNotifs);

    try {
      if (adjustedCat) {
        await saveCategory(adjustedCat);
      }
      await saveNotifications(finalNotifs);
    } catch (e) {
      console.error("Firebase sync error during budget adjustment:", e);
    }
  };

  // --- Add or edit custom category (pos anggaran) ---
  const copyPreviousMonthCategories = async () => {
    // Determine previous month string
    const [year, month] = activeMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);
    const prevMonthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Find categories from prev month or default (without month)
    let prevCats = categories.filter(c => c.month === prevMonthStr);
    if (prevCats.length === 0) {
      prevCats = categories.filter(c => !c.month);
    }
    
    if (prevCats.length === 0) {
      alert("Tidak ada data bulan sebelumnya untuk disalin.");
      return;
    }

    const copiedCats = prevCats.map(cat => ({
      ...cat,
      id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      month: activeMonth,
      spent: 0
    }));

    const updated = [...copiedCats, ...categories];
    setCategories(updated);
    saveToStorage(updated, expenses, notifications);

    // Save each to Firebase
    try {
      for (const cat of copiedCats) {
        await saveCategory(cat);
      }
    } catch (e) {
      console.error("Firebase sync error during copy:", e);
    }
  };

  const copyNextMonthCategories = async () => {
    // Determine next month string
    const [year, month] = activeMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + 1);
    const nextMonthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Check if next month already has categories
    if (categories.some(c => c.month === nextMonthStr)) {
        alert("Bulan depan sudah memiliki data anggaran.");
        return;
    }
    
    // Find current categories
    let currentCats = categories.filter(c => c.month === activeMonth);
    
    if (currentCats.length === 0) {
        // Maybe copy default ones to next month
        currentCats = categories.filter(c => !c.month);
    }
    
    if (currentCats.length === 0) {
      alert("Tidak ada data anggaran bulan ini untuk disalin.");
      return;
    }

    const copiedCats = currentCats.map(cat => ({
      ...cat,
      id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      month: nextMonthStr,
      spent: 0
    }));

    const updated = [...copiedCats, ...categories];
    setCategories(updated);
    saveToStorage(updated, expenses, notifications);

    // Save each to Firebase
    try {
      for (const cat of copiedCats) {
        await saveCategory(cat);
      }
    } catch (e) {
      console.error("Firebase sync error during copy to next month:", e);
    }
  };

  const handleSaveCategory = async (name: string, allocatedBudget: number, color: string, icon: string, categoryId?: string) => {
    if (categoryId) {
      // Edit existing category
      const existingCat = categories.find(c => c.id === categoryId);
      if (!existingCat) return;

      const updatedCat: BudgetCategory = {
        ...existingCat,
        name,
        allocatedBudget,
        color,
        icon
      };

      const updatedCategories = categories.map(c => c.id === categoryId ? updatedCat : c);
      setCategories(updatedCategories);
      
      const newAlerts = checkBudgetLimits(updatedCategories);
      saveToStorage(updatedCategories, expenses, newAlerts);

      try {
        await saveCategory(updatedCat);
        if (newAlerts.length > 0) {
          await saveNotifications(newAlerts);
        }
      } catch (e) {
        console.error("Firebase sync error during edit category:", e);
      }
    } else {
      // Add new category
      const newCat: BudgetCategory = {
        id: `cat-${Date.now()}`,
        name,
        allocatedBudget,
        spent: 0,
        color,
        icon,
        month: activeMonth
      };

      const updated = [newCat, ...categories];
      setCategories(updated);
      saveToStorage(updated, expenses, notifications);

      // Show simulated notification
      const welcomeNotif: SystemNotification = {
        id: `notif-info-${newCat.id}`,
        categoryId: newCat.id,
        categoryName: name,
        type: 'normal',
        message: `Pos anggaran baru "${name}" berhasil dibuat dengan limit ${formatRupiah(allocatedBudget)}.`,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      const updatedNotifs = [welcomeNotif, ...notifications];
      setNotifications(updatedNotifs);
      saveToStorage(updated, expenses, updatedNotifs);

      try {
        await saveCategory(newCat);
        await saveNotifications(updatedNotifs);
      } catch (e) {
        console.error("Firebase sync error during add category:", e);
      }
    }
  };

  // --- Delete a category (pos anggaran) ---
  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    setConfirmDialog({
      isOpen: true,
      type: 'category',
      id: categoryId,
      title: 'Hapus Pos Anggaran?',
      message: `Apakah Anda yakin ingin menghapus pos anggaran "${category.name}"? Semua transaksi belanja terkait di pos ini juga akan terhapus secara permanen.`
    });
  };

  const handleConfirmDelete = async () => {
    const { type, id } = confirmDialog;
    if (type === 'category') {
      const updatedCats = categories.filter(c => c.id !== id);
      const associatedExpenses = expenses.filter(e => e.categoryId === id);
      const associatedExpenseIds = associatedExpenses.map(e => e.id);
      const updatedExpenses = expenses.filter(e => e.categoryId !== id);
      const updatedNotifs = notifications.filter(n => n.categoryId !== id);

      setCategories(updatedCats);
      setExpenses(updatedExpenses);
      setNotifications(updatedNotifs);
      saveToStorage(updatedCats, updatedExpenses, updatedNotifs);

      try {
        await deleteCategoryAndExpenses(id, associatedExpenseIds);
        await saveNotifications(updatedNotifs);
      } catch (e) {
        console.error("Firebase sync error during category delete:", e);
      }
    } else if (type === 'expense') {
      const expenseToDelete = expenses.find(e => e.id === id);
      if (expenseToDelete) {
        const updatedExpenses = expenses.filter(e => e.id !== id);
        
        // Deduct spent from associated category
        const updatedCats = categories.map((cat) => {
          if (cat.id === expenseToDelete.categoryId) {
            return { ...cat, spent: Math.max(0, cat.spent - expenseToDelete.amount) };
          }
          return cat;
        });

        // Recalculate alerts
        const updatedAlerts = checkBudgetLimits(updatedCats);
        setExpenses(updatedExpenses);
        setCategories(updatedCats);
        setNotifications(updatedAlerts);
        saveToStorage(updatedCats, updatedExpenses, updatedAlerts);

        try {
          await deleteExpenseDoc(id);
          const updatedCat = updatedCats.find(c => c.id === expenseToDelete.categoryId);
          if (updatedCat) {
            await saveCategory(updatedCat);
          }
          await saveNotifications(updatedAlerts);
        } catch (e) {
          console.error("Firebase sync error during expense delete:", e);
        }
      }
    }
    
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // --- Record an expense (belanja baru) ---
  const handleAddExpense = async (categoryId: string, amount: number, description: string, date: string) => {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      categoryId,
      amount,
      description,
      date
    };

    const updatedExpenses = [newExpense, ...expenses];

    // Recalculate spent values across categories
    const updatedCats = categories.map((cat) => {
      if (cat.id === categoryId) {
        return { ...cat, spent: cat.spent + amount };
      }
      return cat;
    });

    // Check limits and issue alerts
    const updatedAlerts = checkBudgetLimits(updatedCats);
    
    // Find newly triggered alerts
    const existingIds = new Set(notifications.map(n => n.categoryId + '-' + n.type));
    const newlyTriggered = updatedAlerts.filter(n => !existingIds.has(n.categoryId + '-' + n.type));

    let finalNotifs = [...notifications];
    if (newlyTriggered.length > 0) {
      finalNotifs = [...newlyTriggered, ...notifications];
      // Sound cue & show visual push toast
      setActiveToast(newlyTriggered[0]);
    } else {
      // General success log notification
      const catName = categories.find(c => c.id === categoryId)?.name || '';
      const successNotif: SystemNotification = {
        id: `notif-success-${newExpense.id}`,
        categoryId,
        categoryName: catName,
        type: 'normal',
        message: `Mencatat belanja "${description}" sebesar ${formatRupiah(amount)} pada pos "${catName}".`,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      finalNotifs = [successNotif, ...notifications];
    }

    setExpenses(updatedExpenses);
    setCategories(updatedCats);
    setNotifications(finalNotifs);
    saveToStorage(updatedCats, updatedExpenses, finalNotifs);

    try {
      await saveExpense(newExpense);
      const updatedCat = updatedCats.find(c => c.id === categoryId);
      if (updatedCat) {
        await saveCategory(updatedCat);
      }
      await saveNotifications(finalNotifs);
    } catch (e) {
      console.error("Firebase sync error during add expense:", e);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddExpenseOpen(true);
  };

  const handleUpdateExpense = async (expenseId: string, categoryId: string, amount: number, description: string, date: string) => {
    const oldExpense = expenses.find(e => e.id === expenseId);
    if (!oldExpense) return;

    const oldAmount = oldExpense.amount;
    const oldCategoryId = oldExpense.categoryId;

    const updatedExpense: Expense = {
      ...oldExpense,
      categoryId,
      amount,
      description,
      date
    };

    const updatedExpenses = expenses.map(e => e.id === expenseId ? updatedExpense : e);

    // Recalculate spent values across categories
    const updatedCats = categories.map((cat) => {
      let spentVal = cat.spent;
      if (cat.id === oldCategoryId) {
        spentVal = Math.max(0, spentVal - oldAmount);
      }
      if (cat.id === categoryId) {
        spentVal = spentVal + amount;
      }
      return { ...cat, spent: spentVal };
    });

    const updatedAlerts = checkBudgetLimits(updatedCats);

    setExpenses(updatedExpenses);
    setCategories(updatedCats);
    setNotifications(updatedAlerts);
    saveToStorage(updatedCats, updatedExpenses, updatedAlerts);

    try {
      await saveExpense(updatedExpense);
      if (oldCategoryId !== categoryId) {
        const updatedOldCat = updatedCats.find(c => c.id === oldCategoryId);
        if (updatedOldCat) {
          await saveCategory(updatedOldCat);
        }
      }
      const updatedNewCat = updatedCats.find(c => c.id === categoryId);
      if (updatedNewCat) {
        await saveCategory(updatedNewCat);
      }
      await saveNotifications(updatedAlerts);
    } catch (e) {
      console.error("Firebase sync error during update expense:", e);
    }

    setEditingExpense(null);
  };

  // --- Remove a specific transaction ---
  const handleDeleteExpense = (expenseId: string) => {
    const expenseToDelete = expenses.find(e => e.id === expenseId);
    if (!expenseToDelete) return;

    setConfirmDialog({
      isOpen: true,
      type: 'expense',
      id: expenseId,
      title: 'Hapus Transaksi?',
      message: `Apakah Anda yakin ingin menghapus catatan transaksi "${expenseToDelete.description}" sebesar ${formatRupiah(expenseToDelete.amount)}?`
    });
  };

  // --- Interactive Sync callback ---
  const handleSyncComplete = async () => {
    try {
      const fbCats = await fetchCategories();
      const fbExpenses = await fetchExpenses();
      const fbNotifs = await fetchNotifications();

      if (fbCats && fbCats.length > 0) {
        setCategories(fbCats);
        setExpenses(fbExpenses);
        setNotifications(fbNotifs);
        saveToStorage(fbCats, fbExpenses, fbNotifs);
      } else {
        await uploadAllLocalData(categories, expenses, notifications);
      }
    } catch (error) {
      console.error("Manual pull from Firebase failed, reloading local state:", error);
      const storedCats = localStorage.getItem('budget_categories');
      const storedExpenses = localStorage.getItem('budget_expenses');
      const storedNotifs = localStorage.getItem('budget_notifications');

      if (storedCats && storedExpenses) {
        setCategories(JSON.parse(storedCats));
        setExpenses(JSON.parse(storedExpenses));
        if (storedNotifs) {
          setNotifications(JSON.parse(storedNotifs));
        }
      }
      throw error;
    }
  };

  // --- Mark all notifications as read ---
  const handleMarkAllNotifsAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem('budget_notifications', JSON.stringify(updated));

    try {
      await saveNotifications(updated);
    } catch (e) {
      console.error("Firebase error marking notifications as read:", e);
    }
  };

  // --- Computed stats ---
  const totalBudget = useMemo(() => currentMonthCategories.reduce((sum, c) => sum + c.allocatedBudget, 0), [currentMonthCategories]);
  const totalSpent = useMemo(() => currentMonthCategories.reduce((sum, c) => sum + c.spent, 0), [currentMonthCategories]);
  const unreadNotifsCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  return (
    <div className="h-screen w-screen bg-slate-100 sm:py-6 px-0 sm:px-4 font-sans text-slate-800 flex flex-col items-center justify-center overflow-hidden">
      
      {/* Mobile Frame Envelope Wrapper (Desktop displays as beautiful mobile phone simulation, Mobile displays edge-to-edge with sticky header/tabs) */}
      <div className={`w-full max-w-md sm:max-w-xl ${theme.bgMain} ${theme.textMain} h-full sm:h-[820px] sm:max-h-full sm:rounded-[36px] sm:shadow-2xl sm:border-[8px] sm:border-slate-900 relative overflow-hidden flex flex-col justify-between transition-colors duration-300`}>
        
        {/* Theme Selector Bar (Paling Atas) */}
        <div className="bg-slate-900 text-slate-200 py-2.5 px-5 flex items-center justify-between text-xs shrink-0 select-none border-b border-slate-800 z-40">
          <div className="flex items-center gap-2 font-semibold">
            <LucideIcon name="Palette" size={14} className="text-blue-400" />
            <span>Tema Aplikasi:</span>
          </div>
          <div className="flex items-center gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setCurrentTheme(t.id)}
                className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border-2 transition-all duration-200 hover:scale-110 active:scale-95 ${
                  currentTheme === t.id ? 'border-white scale-110 shadow-lg' : 'border-slate-700 hover:border-slate-500'
                }`}
                title={t.name}
                style={{
                  background: t.id === 'default' ? '#2563eb' : 
                              t.id === 'midnight' ? '#14b8a6' : 
                              t.id === 'forest' ? '#059669' : 
                              t.id === 'lavender' ? '#7c3aed' : '#e11d48'
                }}
              >
                {currentTheme === t.id && (
                  <LucideIcon name="Check" size={11} className="text-white font-black" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Android Top StatusBar Simulation (Only visible on screens showing frame) */}
        <div className="hidden sm:flex bg-slate-900 text-white text-[11px] px-6 py-2.5 items-center justify-between font-mono">
          <div className="flex items-center gap-1.5">
            <LucideIcon name="Wallet" size={12} className="text-emerald-400" />
            <span className="font-bold tracking-tight">AnggaranKita OS</span>
          </div>
          <div className="flex items-center gap-2">
            <span>2026-06-28</span>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Outer Container containing Top header */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Main Top Header Navigation */}
          <header className={`${theme.bgHeader} border-b ${theme.borderHeader} px-5 py-4 flex items-center justify-between relative shrink-0 transition-colors duration-300`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${theme.id === 'default' ? 'bg-blue-600' : theme.id === 'midnight' ? 'bg-teal-500 text-slate-950' : theme.id === 'forest' ? 'bg-emerald-600' : theme.id === 'lavender' ? 'bg-violet-600' : 'bg-rose-600'} rounded-lg flex items-center justify-center text-white shrink-0`}>
                <LucideIcon name="Wallet" size={18} />
              </div>
              <div>
                <h1 className={`text-base font-bold tracking-tight ${theme.textTitle} leading-tight capitalize`}>
                  melly finance
                </h1>
                <p className={`text-[10px] ${theme.id === 'default' ? 'text-slate-400' : 'opacity-70'} font-bold uppercase tracking-wider`}>Juni 2026</p>
              </div>
            </div>

            {/* Icons Stack: Notification & Avatar */}
            <div className="flex items-center gap-2">
              {/* Notification Center Trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`p-2.5 rounded-xl transition-all relative border shadow-sm ${
                    theme.isDark 
                      ? 'hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800' 
                      : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
                  }`}
                  id="btn-trigger-notification-center"
                >
                  <LucideIcon name="Bell" size={18} />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-bounce">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                <AnimatePresence>
                  {isNotifOpen && (
                    <>
                      {/* Invisible backdrop */}
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                      
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 max-h-[400px] overflow-y-auto flex flex-col justify-between"
                      >
                        <div className="px-4 pb-2 border-b border-slate-50 flex justify-between items-center">
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Pusat Peringatan</h4>
                          {notifications.length > 0 && (
                            <button
                              onClick={handleMarkAllNotifsAsRead}
                              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
                            >
                              Tandai Dibaca
                            </button>
                          )}
                        </div>

                        <div className="divide-y divide-slate-50 overflow-y-auto flex-1">
                          {notifications.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-xs">
                              Tidak ada notifikasi baru. Anggaran Anda terpantau aman!
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={`p-4 text-xs transition-colors ${
                                  !notif.isRead ? 'bg-slate-50/50' : ''
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <div className="mt-0.5 shrink-0">
                                    {notif.type === 'critical' ? (
                                      <LucideIcon name="AlertTriangle" className="text-rose-500" size={14} />
                                    ) : notif.type === 'warning' ? (
                                      <LucideIcon name="AlertTriangle" className="text-amber-500" size={14} />
                                    ) : (
                                      <LucideIcon name="CheckCircle" className="text-emerald-500" size={14} />
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <p className={`font-semibold ${notif.type === 'critical' ? 'text-rose-700' : 'text-slate-700'}`}>
                                      {notif.categoryName}
                                    </p>
                                    <p className="text-slate-500 leading-normal">{notif.message}</p>
                                    <span className="text-[9px] text-slate-400 block pt-0.5">
                                      {new Date(notif.timestamp).toLocaleTimeString('id-ID')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Avatar Indicator */}
              <div className="w-9 h-9 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center font-bold text-slate-600 shadow-sm text-xs select-none">
                <LucideIcon name="User" size={16} />
              </div>
            </div>
          </header>

          {/* Real-time floating Push notification toast */}
          <AnimatePresence>
            {activeToast && (
              <div className="absolute top-20 inset-x-4 z-50">
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-2xl p-4 shadow-lg border flex items-start gap-3 text-xs cursor-pointer ${
                    activeToast.type === 'critical'
                      ? 'bg-rose-900 text-white border-rose-800'
                      : 'bg-amber-500 text-white border-amber-600'
                  }`}
                  onClick={() => {
                    setActiveToast(null);
                    setIsNotifOpen(true);
                  }}
                >
                  <LucideIcon name="AlertTriangle" className="shrink-0 mt-0.5 animate-bounce" size={16} />
                  <div className="flex-1 space-y-1">
                    <p className="font-extrabold tracking-tight">ALARM AMBANG ANGGARAN</p>
                    <p className="font-medium opacity-90">{activeToast.message}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveToast(null);
                    }}
                    className="opacity-60 hover:opacity-100 p-0.5"
                  >
                    <LucideIcon name="Minus" size={14} />
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Core Content Area */}
          <main className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            
            {/* Tab: Dashboard Panel */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Month Selector */}
                <div className={`flex items-center justify-between ${theme.bgCard} rounded-2xl border ${theme.borderCard} p-3 shadow-sm transition-colors duration-300`}>
                  <button 
                    onClick={() => {
                      const [year, month] = activeMonth.split('-').map(Number);
                      const d = new Date(year, month - 1, 1);
                      d.setMonth(d.getMonth() - 1);
                      setActiveMonth(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
                    }}
                    className={`p-2 ${theme.isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'} rounded-xl transition-colors`}
                  >
                    <LucideIcon name="ChevronLeft" size={20} />
                  </button>
                  <h3 className={`font-bold ${theme.isDark ? 'text-slate-200' : 'text-slate-700'} text-sm`}>
                    {new Date(parseInt(activeMonth.split('-')[0]), parseInt(activeMonth.split('-')[1]) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button 
                    onClick={() => {
                      const [year, month] = activeMonth.split('-').map(Number);
                      const d = new Date(year, month - 1, 1);
                      d.setMonth(d.getMonth() + 1);
                      setActiveMonth(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
                    }}
                    className={`p-2 ${theme.isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'} rounded-xl transition-colors`}
                  >
                    <LucideIcon name="ChevronRight" size={20} />
                  </button>
                </div>

                {/* Total Balance / Overall Header Card */}
                <div className={`${theme.bgCard} rounded-2xl border ${theme.borderCard} p-5 shadow-sm transition-colors duration-300`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pengeluaran Bulan Ini</p>
                      <h2 className={`text-3xl font-black ${theme.isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{formatRupiah(totalSpent)}</h2>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${totalSpent > totalBudget ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'} border`}>
                        Sisa: {formatRupiah(Math.max(0, totalBudget - totalSpent))}
                      </span>
                    </div>
                  </div>
                  
                  <p className={`text-xs ${theme.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Total Plafon Anggaran: <span className={`font-semibold ${theme.isDark ? 'text-slate-200' : 'text-slate-700'}`}>{formatRupiah(totalBudget)}</span>
                  </p>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden flex">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0, 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full ${totalSpent > totalBudget ? 'bg-rose-500' : theme.accentBg}`}
                    />
                  </div>

                  {/* Warning banner simulation if any */}
                  {totalSpent >= totalBudget * 0.85 && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold mt-4">
                      <LucideIcon name="AlertTriangle" className="text-rose-500 shrink-0" size={14} />
                      <span>Keuangan mendekati ambang limit pengeluaran bulanan!</span>
                    </div>
                  )}
                </div>

                 {/* Dashboard Action Header: Create Pos / Create Transaksi */}
                <div className="flex flex-row items-center justify-between gap-2">
                  <h3 className={`font-extrabold ${theme.isDark ? 'text-slate-200' : 'text-slate-800'} text-xs sm:text-sm tracking-tight uppercase shrink-0`}>Pos Anggaran Anda</h3>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => setIsAddCatOpen(true)}
                      className={`inline-flex items-center gap-1 ${theme.bgCard} hover:opacity-90 ${theme.isDark ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-200'} border text-[11px] sm:text-xs font-bold py-1.5 px-2.5 rounded-xl transition-all shadow-sm`}
                      id="btn-add-new-category"
                    >
                      <LucideIcon name="Plus" size={12} />
                      Pos
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCatForExpense('');
                        setIsAddExpenseOpen(true);
                      }}
                      className={`inline-flex items-center gap-1 ${theme.accentBg} text-[11px] sm:text-xs font-bold py-1.5 px-2.5 rounded-xl transition-all shadow-md`}
                      id="btn-add-new-expense"
                    >
                      <LucideIcon name="Coins" size={12} />
                      Belanja
                    </button>
                  </div>
                </div>

                {/* Category Cards List */}
                {currentMonthCategories.length === 0 ? (
                  <div className={`${theme.bgCard} rounded-2xl p-10 border border-dashed ${theme.borderCard} text-center text-slate-400 space-y-3`}>
                    <LucideIcon name="Wallet" size={32} className="mx-auto text-slate-300" />
                    <div>
                      <p className={`font-bold ${theme.isDark ? 'text-slate-200' : 'text-slate-600'} text-sm`}>Belum Ada Pos Anggaran Bulan Ini</p>
                      <p className="text-xs text-slate-400 max-w-[240px] mx-auto mt-1">Buat pos anggaran pertama Anda atau salin dari bulan sebelumnya.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center gap-2">
                      <button
                        onClick={() => setIsAddCatOpen(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-1"
                      >
                        <LucideIcon name="Plus" size={14} />
                        Buat Pos Baru
                      </button>
                      <button
                        onClick={copyPreviousMonthCategories}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-all flex justify-center items-center gap-1"
                      >
                        <LucideIcon name="Copy" size={14} />
                        Salin dari Bulan Lalu
                      </button>
                      <button
                        onClick={copyNextMonthCategories}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-all flex justify-center items-center gap-1"
                      >
                        <LucideIcon name="Copy" size={14} />
                        Salin ke Bulan Depan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentMonthCategories.map((cat) => (
                      <BudgetCategoryCard
                        key={cat.id}
                        category={cat}
                        onAddExpenseClick={(catId) => {
                          setSelectedCatForExpense(catId);
                          setIsAddExpenseOpen(true);
                        }}
                        onUpdateBudgetLimit={handleUpdateBudgetLimit}
                        onDeleteCategory={handleDeleteCategory}
                        onEditCategory={(categoryToEdit) => {
                          setEditingCategory(categoryToEdit);
                          setIsAddCatOpen(true);
                        }}
                        onViewTransactions={(catId) => {
                          setActiveTab('transactions');
                          // Filter to view only this category
                          setTxFilterCategory(catId);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Full Historical Transactions */}
            {activeTab === 'transactions' && (
              <div className="space-y-6" id="transactions-tab">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className={`font-extrabold ${theme.isDark ? 'text-slate-200' : 'text-slate-800'} text-xs sm:text-sm uppercase tracking-tight`}>Riwayat Belanja</h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Daftar pengeluaran anggaran rumah tangga</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={txFilterCategory}
                      onChange={(e) => setTxFilterCategory(e.target.value)}
                      className={`text-xs border ${theme.borderCard} ${theme.bgCard} ${theme.isDark ? 'text-slate-200' : 'text-slate-700'} rounded-xl px-2 py-1.5 focus:outline-none focus:border-blue-500`}
                    >
                      <option value="all">Semua Pos</option>
                      {currentMonthCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        setSelectedCatForExpense(txFilterCategory === 'all' ? '' : txFilterCategory);
                        setIsAddExpenseOpen(true);
                      }}
                      className={`inline-flex items-center gap-1 ${theme.accentBg} text-[11px] sm:text-xs font-bold py-1.5 px-2.5 rounded-xl transition-all shadow-md shrink-0`}
                    >
                      <LucideIcon name="PlusCircle" size={12} />
                      Catat
                    </button>
                  </div>
                </div>

                {/* List Table of transactions */}
                {currentMonthExpenses.filter(e => txFilterCategory === 'all' || e.categoryId === txFilterCategory).length === 0 ? (
                  <div className={`${theme.bgCard} rounded-2xl p-10 border border-dashed ${theme.borderCard} text-center text-slate-400 space-y-3`}>
                    <LucideIcon name="Calendar" size={32} className="mx-auto text-slate-300" />
                    <div>
                      <p className={`font-bold ${theme.isDark ? 'text-slate-200' : 'text-slate-600'} text-sm`}>Belum Ada Transaksi Belanja</p>
                      <p className="text-xs text-slate-400 max-w-[240px] mx-auto mt-1">Belanja yang Anda catat akan muncul di sini.</p>
                    </div>
                  </div>
                ) : (
                  <div className={`${theme.bgCard} rounded-2xl border ${theme.isDark ? 'border-slate-800' : 'border-slate-100'} overflow-hidden shadow-sm`}>
                    <div className={`divide-y ${theme.isDark ? 'divide-slate-800' : 'divide-slate-50'}`}>
                      {currentMonthExpenses
                        .filter(e => txFilterCategory === 'all' || e.categoryId === txFilterCategory)
                        .map((exp) => {
                        const associatedCat = currentMonthCategories.find((c) => c.id === exp.categoryId);
                        return (
                          <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl border flex items-center justify-center ${
                                associatedCat?.color === 'emerald'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : associatedCat?.color === 'blue'
                                  ? 'bg-blue-50 text-blue-600 border-blue-100'
                                  : associatedCat?.color === 'amber'
                                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                                  : associatedCat?.color === 'rose'
                                  ? 'bg-rose-50 text-rose-600 border-rose-100'
                                  : associatedCat?.color === 'purple'
                                  ? 'bg-purple-50 text-purple-600 border-purple-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                <LucideIcon name={associatedCat?.icon || 'ShoppingBag'} size={16} />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">{exp.description}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-semibold text-slate-400">
                                  <span>{associatedCat?.name || 'Pos Tak Ditemukan'}</span>
                                  <span>•</span>
                                  <span>{exp.date}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-black ${theme.isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                -{formatRupiah(exp.amount)}
                              </span>
                              <button
                                onClick={() => handleEditExpense(exp)}
                                className={`text-slate-400 hover:text-blue-500 p-1.5 rounded-lg ${theme.isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} transition-colors`}
                                title="Ubah catatan"
                              >
                                <LucideIcon name="Pencil" size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className={`text-slate-400 hover:text-rose-500 p-1.5 rounded-lg ${theme.isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} transition-colors`}
                                title="Hapus catatan"
                              >
                                <LucideIcon name="Trash2" size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Analytics Visualizations */}
            {activeTab === 'analytics' && (
              <AnalyticsPanel categories={currentMonthCategories} expenses={currentMonthExpenses} />
            )}

            {/* Tab: Sync Multi Device */}
            {activeTab === 'sync' && (
              <SyncPanel
                onTriggerSync={handleSyncComplete}
                categoriesCount={categories.length}
                expensesCount={expenses.length}
              />
            )}

            {/* Tab: AI Analysis */}
            {activeTab === 'ai' && (
              <AiAnalysisPanel categories={currentMonthCategories} expenses={currentMonthExpenses} />
            )}
          </main>
        </div>

        {/* Persistent Elegant Bottom Tab Bar for Mobile Simulation */}
        <nav className={`${theme.id === 'default' ? 'bg-white' : theme.bgHeader} border-t ${theme.borderHeader} py-2 px-4 flex items-center justify-around relative z-30 shrink-0 transition-colors duration-300`}>
          {/* Dashboard Tab Button */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              activeTab === 'dashboard' ? theme.navActive : theme.navInactive
            }`}
            id="tab-btn-dashboard"
          >
            <LucideIcon name="Home" size={18} />
            <span className="text-[9px] font-bold tracking-tight">Dashboard</span>
          </button>

          {/* Transactions Tab Button */}
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              activeTab === 'transactions' ? theme.navActive : theme.navInactive
            }`}
            id="tab-btn-transactions"
          >
            <LucideIcon name="Calendar" size={18} />
            <span className="text-[9px] font-bold tracking-tight">Transaksi</span>
          </button>

          {/* Analytics Tab Button */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              activeTab === 'analytics' ? theme.navActive : theme.navInactive
            }`}
            id="tab-btn-analytics"
          >
            <LucideIcon name="TrendingUp" size={18} />
            <span className="text-[9px] font-bold tracking-tight">Grafik</span>
          </button>

          {/* Sync Tab Button */}
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              activeTab === 'sync' ? theme.navActive : theme.navInactive
            }`}
            id="tab-btn-sync"
          >
            <LucideIcon name="RefreshCw" size={18} />
            <span className="text-[9px] font-bold tracking-tight">Sinkron</span>
          </button>

          {/* AI Analysis Tab Button */}
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              activeTab === 'ai' ? theme.navActive : theme.navInactive
            }`}
            id="tab-btn-ai"
          >
            <LucideIcon name="Sparkles" size={18} />
            <span className="text-[9px] font-bold tracking-tight">AI</span>
          </button>
        </nav>

        {/* Android bottom nav gesture bar simulation */}
        <div className="hidden sm:block bg-slate-950 h-5 py-1 text-center select-none">
          <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto" />
        </div>
      </div>

      {/* --- Modals Portal --- */}
      <CategoryModal
        isOpen={isAddCatOpen}
        onClose={() => {
          setIsAddCatOpen(false);
          setEditingCategory(null);
        }}
        onSaveCategory={handleSaveCategory}
        initialCategory={editingCategory}
      />

      <ExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        categories={currentMonthCategories}
        preSelectedCategoryId={selectedCatForExpense}
        onAddExpense={handleAddExpense}
        onUpdateExpense={handleUpdateExpense}
        initialExpense={editingExpense}
      />

      {/* Custom Sleek Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Dialog Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 z-10 text-slate-800"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shrink-0">
                  <LucideIcon name="AlertTriangle" size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base">{confirmDialog.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{confirmDialog.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end mt-6">
                <button
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
