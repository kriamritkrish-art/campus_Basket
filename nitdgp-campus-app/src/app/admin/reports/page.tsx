'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  History,
  CheckCircle,
  FileText
} from 'lucide-react';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('Overall');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [history, setHistory] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await apiRequest('/api/admin/reports/history');
      if (res.success && res.reports) {
        setHistory(res.reports);
      }
    } catch (err) {
      console.warn('History error:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleGeneratePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setStatusMsg(null);

    try {
      const token = localStorage.getItem('nit_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const res = await fetch(`${backendUrl}/api/admin/reports/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reportType, dateRange })
      });

      if (!res.ok) throw new Error('Failed to generate official PDF report');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NIT_DGP_Report_${reportType.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMsg('Institutional PDF Report generated and downloaded successfully.');
      fetchHistory();
    } catch (err: any) {
      alert(err.message || 'Report generation error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCsv = (type: string) => {
    const token = localStorage.getItem('nit_token');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    window.open(`${backendUrl}/api/admin/reports/export-csv?type=${type}&token=${token}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-[#4F9D32]" />
          <span>Executive Reports &amp; Financial Audits</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Generate publication-grade PDF operational reports and export RFC 4180 compliant CSV datasets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Generator Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#4F9D32]" />
            <span>Generate Official PDF Audit</span>
          </h3>

          <form onSubmit={handleGeneratePdf} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Audit Scope / Service Line
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#17202A] font-semibold focus:outline-none focus:border-[#4F9D32] focus:bg-white cursor-pointer"
              >
                <option value="Overall">Overall Campus Services (Full Platform)</option>
                <option value="Food & Meals">Food &amp; Meals Only</option>
                <option value="Fresh Fruits">Fresh Fruits Only</option>
                <option value="Express Laundry">Express Laundry Only</option>
                <option value="Stationery & Essentials">Stationery &amp; Essentials Only</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Audit Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#17202A] font-semibold focus:outline-none focus:border-[#4F9D32] focus:bg-white cursor-pointer"
              >
                <option value="Today">Today (Active shift)</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Month">Current Calendar Month</option>
                <option value="Last Quarter">Past Financial Quarter</option>
              </select>
            </div>

            {statusMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#347A27] rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-sm shadow-[#4F9D32]/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Compiling PDF...' : 'Download PDF Audit Report'}</span>
            </button>
          </form>
        </div>

        {/* Instant CSV Datasets */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
            <Download className="w-4 h-4 text-[#4F9D32]" />
            <span>Instant Raw CSV Datasets</span>
          </h3>
          <p className="text-xs text-slate-500">
            Export uncompressed records for Excel, Power BI or institutional ledger import
          </p>

          <div className="space-y-2.5 pt-2">
            {[
              { label: 'Campus Orders Dataset (Orders + Line Items)', type: 'orders' },
              { label: 'Product Catalog & Pricing SKU Matrix', type: 'products' },
              { label: 'Real-Time Inventory & Buffer Stock Data', type: 'inventory' },
              { label: 'Express Laundry Dual-OTP Tracking Log', type: 'laundry' }
            ].map((csv) => (
              <button
                key={csv.type}
                onClick={() => handleDownloadCsv(csv.type)}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-left text-xs font-semibold text-[#17202A] flex items-center justify-between transition group"
              >
                <span>{csv.label}</span>
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4F9D32] transition" />
              </button>
            ))}
          </div>
        </div>

        {/* Report History */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
            <History className="w-4 h-4 text-[#4F9D32]" />
            <span>Recent Generated Audits</span>
          </h3>

          <div className="space-y-3">
            {(history.length > 0
              ? history
              : [
                  { reportTitle: 'Food & Meals Performance Audit', reportType: 'Food', dateRangeText: 'Last 30 Days', fileSize: '142 KB' },
                  { reportTitle: 'Comprehensive Campus Operations', reportType: 'Overall', dateRangeText: 'This Month', fileSize: '198 KB' }
                ]
            ).map((h: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-xs text-[#17202A]">{h.reportTitle}</div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>{h.dateRangeText}</span>
                  <span className="font-mono">{h.fileSize}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
