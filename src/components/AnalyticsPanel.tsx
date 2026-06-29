import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BudgetCategory, Expense } from '../types';
import { formatRupiah } from '../utils/budgetHelpers';
import LucideIcon from './LucideIcon';

interface AnalyticsPanelProps {
  categories: BudgetCategory[];
  expenses: Expense[];
}

export default function AnalyticsPanel({ categories, expenses }: AnalyticsPanelProps) {
  // Aggregate data for standard bar chart
  const barChartData = useMemo(() => {
    return categories.map((cat) => ({
      name: cat.name.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name,
      Anggaran: cat.allocatedBudget,
      Pengeluaran: cat.spent
    }));
  }, [categories]);

  // Aggregate data for spending breakdown (pie chart)
  const pieChartData = useMemo(() => {
    return categories
      .filter((cat) => cat.spent > 0)
      .map((cat) => ({
        name: cat.name,
        value: cat.spent,
        colorHex:
          cat.color === 'emerald'
            ? '#10b981'
            : cat.color === 'blue'
            ? '#3b82f6'
            : cat.color === 'amber'
            ? '#f59e0b'
            : cat.color === 'rose'
            ? '#ef4444'
            : cat.color === 'purple'
            ? '#a855f7'
            : '#64748b'
      }));
  }, [categories]);

  // Total calculations
  const totals = useMemo(() => {
    const totalBudget = categories.reduce((sum, c) => sum + c.allocatedBudget, 0);
    const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallUsagePercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    
    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallUsagePercent
    };
  }, [categories]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs">
          <p className="font-bold mb-1.5">{payload[0].payload.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="flex justify-between gap-4 font-medium" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="font-bold">{formatRupiah(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" id="analytics-panel">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Budget Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-600 text-white shadow-sm">
            <LucideIcon name="Wallet" size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Anggaran Limit</p>
            <h4 className="text-lg font-bold text-slate-800 mt-0.5">
              {formatRupiah(totals.totalBudget)}
            </h4>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-100">
            <LucideIcon name="TrendingDown" size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Pengeluaran</p>
            <h4 className="text-lg font-bold text-slate-800 mt-0.5">
              {formatRupiah(totals.totalSpent)}
            </h4>
          </div>
        </div>

        {/* Remaining Budget Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${totals.totalRemaining < 0 ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            <LucideIcon name={totals.totalRemaining < 0 ? 'AlertTriangle' : 'TrendingUp'} size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Sisa Anggaran Kolektif</p>
            <h4 className={`text-lg font-bold mt-0.5 ${totals.totalRemaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatRupiah(totals.totalRemaining)}
            </h4>
          </div>
        </div>
      </div>

      {/* Progress summary bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200">
        <div className="flex justify-between items-center text-sm font-semibold mb-2">
          <span className="text-slate-600">Persentase Penggunaan Anggaran Rumah Tangga</span>
          <span className={totals.overallUsagePercent >= 100 ? 'text-rose-600 font-bold' : totals.overallUsagePercent >= 85 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
            {totals.overallUsagePercent}% Terpakai
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totals.overallUsagePercent >= 100
                ? 'bg-rose-500'
                : totals.overallUsagePercent >= 85
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(totals.overallUsagePercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {totals.totalRemaining < 0
            ? 'Peringatan: Pengeluaran total bulanan Anda telah melebihi batas total limit anggaran yang ditetapkan!'
            : `Bagus! Anda masih memiliki kelonggaran belanja sebesar ${formatRupiah(totals.totalRemaining)} bulan ini.`}
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Bar Chart: Comparison */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col h-[380px]">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Perbandingan Limit vs Realisasi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Perbandingan budget yang dianggarkan dengan pengeluaran aktual</p>
          </div>
          <div className="flex-1 min-h-0">
            {categories.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Belum ada data untuk ditampilkan. Buat pos anggaran terlebih dahulu.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 500, color: '#64748b' }} />
                  <Bar dataKey="Anggaran" name="Limit Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pengeluaran" name="Pengeluaran" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart: Proportion */}
        <div className="bg-white rounded-none sm:rounded-2xl mx-[-20px] sm:mx-0 border-y sm:border border-x-0 sm:border-x border-slate-200 p-5 flex flex-col h-[420px] sm:h-[380px]">
          <div className="mb-4 px-2 sm:px-0">
            <h3 className="font-bold text-slate-800 text-sm">Proporsi Pengeluaran Kategori</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pembagian porsi pengeluaran belanja berdasarkan pos anggaran</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {pieChartData.length === 0 ? (
              <div className="text-slate-400 text-xs">
                Belum ada pengeluaran belanja yang tercatat.
              </div>
            ) : (
              <div className="w-full h-full flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Chart Wrapper Container */}
                <div className="relative w-full sm:w-[50%] h-[210px] sm:h-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.colorHex} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text (Perfectly centered inside the ring) */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10 bg-white/40 p-1.5 rounded-full">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Belanja</p>
                    <p className="text-xs sm:text-sm font-black text-slate-800 leading-none mt-0.5">{formatRupiah(totals.totalSpent)}</p>
                  </div>
                </div>

                {/* Legend List */}
                <div className="w-full sm:w-[50%] px-4 sm:px-0 max-h-[140px] sm:max-h-[220px] overflow-y-auto space-y-2 flex-1">
                  {pieChartData.map((item, index) => {
                    const percent = Math.round((item.value / totals.totalSpent) * 100);
                    return (
                      <div key={index} className="flex items-center justify-between text-xs py-0.5">
                        <div className="flex items-center gap-2 max-w-[65%]">
                          <span className="w-2.5 h-2.5 rounded-full block shrink-0" style={{ backgroundColor: item.colorHex }} />
                          <span className="font-semibold text-slate-600 truncate">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-800 text-right shrink-0">{percent}% ({formatRupiah(item.value)})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
