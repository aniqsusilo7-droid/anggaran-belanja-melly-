import { BudgetCategory, Expense } from '../types';

export const INITIAL_CATEGORIES: BudgetCategory[] = [
  {
    id: 'cat-1',
    name: 'Makanan & Minuman',
    allocatedBudget: 3000000, // Rp 3.000.000
    spent: 2450000,
    color: 'emerald',
    icon: 'Utensils',
  },
  {
    id: 'cat-2',
    name: 'Transportasi',
    allocatedBudget: 1500000, // Rp 1.500.000
    spent: 1350000, // 90% - will trigger limit warning!
    color: 'amber',
    icon: 'Car',
  },
  {
    id: 'cat-3',
    name: 'Listrik & Air (Utilitas)',
    allocatedBudget: 1200000, // Rp 1.200.000
    spent: 980000,
    color: 'blue',
    icon: 'Droplet',
  },
  {
    id: 'cat-4',
    name: 'Hiburan & Liburan',
    allocatedBudget: 1000000, // Rp 1.000.000
    spent: 1050000, // 105% - critical! Over budget!
    color: 'rose',
    icon: 'Sparkles',
  },
  {
    id: 'cat-5',
    name: 'Kesehatan & Obat',
    allocatedBudget: 800000, // Rp 800.000
    spent: 150000,
    color: 'purple',
    icon: 'HeartPulse',
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  // Makanan
  { id: 'exp-1', categoryId: 'cat-1', amount: 450000, description: 'Belanja Bulanan Carrefour', date: '2026-06-05' },
  { id: 'exp-2', categoryId: 'cat-1', amount: 120000, description: 'Makan Malam GoFood', date: '2026-06-12' },
  { id: 'exp-3', categoryId: 'cat-1', amount: 880000, description: 'Makan Keluarga Akhir Pekan', date: '2026-06-18' },
  { id: 'exp-4', categoryId: 'cat-1', amount: 1000000, description: 'Stok beras dan sembako', date: '2026-06-25' },
  
  // Transportasi
  { id: 'exp-5', categoryId: 'cat-2', amount: 500000, description: 'Isi Bensin Mobil', date: '2026-06-02' },
  { id: 'exp-6', categoryId: 'cat-2', amount: 450000, description: 'Servis Motor Rutin', date: '2026-06-10' },
  { id: 'exp-7', categoryId: 'cat-2', amount: 400000, description: 'Top up e-Toll', date: '2026-06-20' },
  
  // Listrik & Air
  { id: 'exp-8', categoryId: 'cat-3', amount: 750000, description: 'Token Listrik PLN', date: '2026-06-03' },
  { id: 'exp-9', categoryId: 'cat-3', amount: 230000, description: 'Tagihan Air PDAM', date: '2026-06-05' },
  
  // Hiburan
  { id: 'exp-10', categoryId: 'cat-4', amount: 250000, description: 'Tiket Bioskop & Popcorn', date: '2026-06-08' },
  { id: 'exp-11', categoryId: 'cat-4', amount: 800000, description: 'Staycation Akhir Pekan', date: '2026-06-22' },
  
  // Kesehatan
  { id: 'exp-12', categoryId: 'cat-5', amount: 150000, description: 'Beli Vitamin & Masker', date: '2026-06-14' }
];
