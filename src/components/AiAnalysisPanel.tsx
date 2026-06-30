import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { BudgetCategory, Expense } from '../types';
import { formatRupiah } from '../utils/budgetHelpers';
import LucideIcon from './LucideIcon';

interface AiAnalysisPanelProps {
  categories: BudgetCategory[];
  expenses: Expense[];
}

export default function AiAnalysisPanel({ categories, expenses }: AiAnalysisPanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('user_gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      const defaultKey = 'AQ.Ab8RN6LUI6Il-MwiO9SJ05mx7EG2Z6oA95m8ViNnEnB5pA4MSA';
      setApiKey(defaultKey);
      localStorage.setItem('user_gemini_api_key', defaultKey);
    }
  }, []);

  const handleSaveKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('user_gemini_api_key', val);
  };

  const generateAnalysis = async () => {
    if (!apiKey) {
      setError('Silakan masukkan API Key Gemini terlebih dahulu.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    setAnalysisResult('');

    try {
      const summaryData = {
        totalBudget: categories.reduce((sum, cat) => sum + cat.allocatedBudget, 0),
        totalSpent: categories.reduce((sum, cat) => sum + cat.spent, 0),
        categories: categories.map(c => ({
          name: c.name,
          allocated: c.allocatedBudget,
          spent: c.spent,
          percentage: (c.spent / c.allocatedBudget) * 100
        })),
        recentExpenses: expenses.slice(0, 10).map(e => ({
          description: e.description,
          amount: e.amount,
          date: e.date
        }))
      };

      const prompt = `Anda adalah asisten keuangan pribadi yang cerdas. Tolong analisis data pengeluaran bulanan berikut dan berikan saran atau insight yang berguna untuk menghemat atau mengatur uang lebih baik.
Gunakan bahasa Indonesia yang profesional, ramah, dan ringkas. Gunakan format markdown untuk memudahkan pembacaan.

Data Anggaran:
Total Anggaran: ${formatRupiah(summaryData.totalBudget)}
Total Pengeluaran: ${formatRupiah(summaryData.totalSpent)}

Detail Pos Anggaran:
${summaryData.categories.map(c => `- ${c.name}: Terpakai ${formatRupiah(c.spent)} dari ${formatRupiah(c.allocated)} (${c.percentage.toFixed(1)}%)`).join('\n')}

Berikan:
1. Ringkasan kondisi keuangan saat ini.
2. Pos anggaran mana yang perlu diwaspadai.
3. 2-3 Tips praktis untuk bulan ini.
`;

      let response;
      let modelUsed = '';
      let requestErrorMsg = '';
      const modelsToTry = [
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.1-pro-preview',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
      ];

      for (const model of modelsToTry) {
        try {
          let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          // Deteksi tipe token: Jika diawali AIzaSy maka gunakan query parameter ?key=
          // Jika tidak, asumsikan itu adalah OAuth Access Token / Bearer Token (seperti AQ. atau ya29.)
          const trimmedKey = apiKey.trim();
          if (trimmedKey.startsWith('AIzaSy')) {
            url += `?key=${trimmedKey}`;
          } else {
            headers['Authorization'] = `Bearer ${trimmedKey}`;
          }

          response = await fetch(
            url,
            {
              method: 'POST',
              headers: headers,
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: prompt,
                      },
                    ],
                  },
                ],
              }),
            }
          );

          if (response.ok) {
            modelUsed = model;
            break;
          } else {
            const errData = await response.json().catch(() => ({}));
            requestErrorMsg = errData?.error?.message || `Status HTTP: ${response.status}`;
            console.warn(`Model ${model} gagal: ${requestErrorMsg}`);
          }
        } catch (err: any) {
          requestErrorMsg = err?.message || String(err);
          console.warn(`Gagal menghubungi model ${model}: ${requestErrorMsg}`);
        }
      }

      if (!response || !response.ok) {
        let userFriendlyMsg = requestErrorMsg || 'Gagal menghubungi server Gemini.';
        if (
          userFriendlyMsg.toLowerCase().includes('permission') || 
          userFriendlyMsg.toLowerCase().includes('caller') || 
          userFriendlyMsg.toLowerCase().includes('api key')
        ) {
          userFriendlyMsg = 'Izin Ditolak (The caller does not have permission). Pastikan API Key Gemini yang Anda masukkan valid, aktif, memiliki kuota gratis/berbayar, dan memiliki akses untuk model Generative Language.';
        }
        throw new Error(userFriendlyMsg);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setAnalysisResult(text || 'Tidak ada analisis yang dapat dihasilkan.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menghasilkan analisis. Periksa koneksi internet atau validitas API Key Anda.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <LucideIcon name="Sparkles" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-extrabold text-slate-800">Analisa AI Keuangan</h3>
            <p className="text-xs text-slate-500 mt-1">Dapatkan insight dan saran cerdas tentang pengeluaran Anda menggunakan AI. Karena ini berjalan langsung di browser Anda (client-side), Anda harus memasukkan API Key Gemini Anda sendiri.</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-2">Google Gemini API Key</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiKey}
              onChange={handleSaveKey}
              placeholder="Masukkan API Key Gemini..."
              className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono text-slate-800"
            />
            <button
              onClick={generateAnalysis}
              disabled={isAnalyzing || !apiKey}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {isAnalyzing ? <LucideIcon name="Loader2" className="animate-spin" size={14} /> : <LucideIcon name="Bot" size={14} />}
              {isAnalyzing ? 'Menganalisis...' : 'Analisis Sekarang'}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">API key Anda hanya disimpan secara lokal di perangkat Anda (localStorage) dan tidak pernah dikirim ke server kami.</p>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs flex items-center gap-2">
            <LucideIcon name="AlertCircle" size={14} />
            {error}
          </div>
        )}
      </div>

      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
            <LucideIcon name="BrainCircuit" className="text-indigo-600" size={18} />
            <h4 className="font-bold text-slate-800">Hasil Analisis</h4>
          </div>
          <div className="prose prose-sm prose-slate max-w-none text-xs sm:text-sm">
            <Markdown>{analysisResult}</Markdown>
          </div>
        </motion.div>
      )}
    </div>
  );
}
