/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BudgetCategory {
  id: string;
  name: string;
  allocatedBudget: number;
  spent: number;
  color: string; // Tailwind color class or hex
  icon: string;  // Lucide icon name
  month?: string; // e.g. "YYYY-MM"
}

export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string; // ISO string or YYYY-MM-DD
}

export interface SystemNotification {
  id: string;
  categoryId: string;
  categoryName: string;
  type: 'warning' | 'info' | 'critical' | 'normal';
  message: string;
  timestamp: string;
  isRead: boolean;
}


