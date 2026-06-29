import { BudgetCategory, SystemNotification } from '../types';

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function checkBudgetLimits(
  categories: BudgetCategory[]
): SystemNotification[] {
  const notifications: SystemNotification[] = [];

  categories.forEach((category) => {
    const ratio = category.spent / category.allocatedBudget;
    
    if (ratio >= 1.0) {
      notifications.push({
        id: `notif-crit-${category.id}-${Date.now()}`,
        categoryId: category.id,
        categoryName: category.name,
        type: 'critical',
        message: `Batas Lampaui! Pengeluaran pos "${category.name}" telah melebihi anggaran sebesar ${formatRupiah(category.spent - category.allocatedBudget)}.`,
        timestamp: new Date().toISOString(),
        isRead: false
      });
    } else if (ratio >= 0.85) {
      const percentage = Math.round(ratio * 100);
      notifications.push({
        id: `notif-warn-${category.id}-${Date.now()}`,
        categoryId: category.id,
        categoryName: category.name,
        type: 'warning',
        message: `Mendekati Limit! Pengeluaran pos "${category.name}" sudah mencapai ${percentage}% (${formatRupiah(category.spent)} dari ${formatRupiah(category.allocatedBudget)}).`,
        timestamp: new Date().toISOString(),
        isRead: false
      });
    }
  });

  return notifications;
}
