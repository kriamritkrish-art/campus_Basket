'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  FileText,
  Code,
  X,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface AuditLogItem {
  id: string;
  userId?: string;
  user?: {
    email: string;
    role: string;
    name?: string;
  };
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/audit-logs');
      if (res.success && res.logs) {
        setLogs(res.logs);
      }
    } catch (err: any) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const adminEmail = log.user?.email || log.userId || '';
    const action = log.action || '';
    const entity = log.entity || '';

    const matchesSearch =
      adminEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entityId || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionColor = (action: string) => {
    if (action.includes('REFUND') || action.includes('DELETE') || action.includes('CANCEL')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('UPDATE') || action.includes('STATUS') || action.includes('SETTING')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (action.includes('CREATE') || action.includes('ADD')) {
      return 'bg-emerald-50 text-[#347A27] border-emerald-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const distinctActions = Array.from(new Set(logs.map((l) => l.action))).filter(Boolean);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#17202A] tracking-tight">Security &amp; Admin Audit Trail</h1>
            <p className="text-xs text-slate-500">
              Immutable historical logs tracking product updates, status changes, refunds, and administrative interventions
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4F9D32]' : ''}`} />
          Refresh Audit Trail
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Logged Operations</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-[#17202A] tracking-tight">{logs.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Chronological admin events captured</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Action Types</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600 tracking-tight">{distinctActions.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Catalog, pricing, refunds &amp; config events</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Security State</span>
            <CheckCircle className="w-4 h-4 text-[#347A27]" />
          </div>
          <div className="mt-3 text-2xl font-bold text-[#347A27] tracking-tight">Verified</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Role-based access check active on all endpoints</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, entity, admin email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Action:</span>
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#4F9D32] cursor-pointer"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            {distinctActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#4F9D32] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading audit trail...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-[#17202A] font-medium text-sm">No audit records found</p>
            <p className="text-slate-400 text-xs mt-1">Actions taken by administrators will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Administrator</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Target Entity</th>
                  <th className="px-5 py-3 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(log.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {(log.user?.email || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-[#17202A] block">
                            {log.user?.email || log.userId || 'Institutional Admin'}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {log.user?.role || 'ADMIN'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-[#17202A] font-semibold">{log.entity}</span>
                        {log.entityId && (
                          <span className="text-slate-400 text-[10px]">({log.entityId.slice(0, 10)})</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Code className="w-3 h-3 text-slate-500" />
                        Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17202A]">Audit Event Payload Inspection</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedLog.action} &bull; {selectedLog.entity}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-600">
                <div><strong className="text-[#17202A]">Log ID:</strong> {selectedLog.id}</div>
                <div><strong className="text-[#17202A]">Target ID:</strong> {selectedLog.entityId || 'N/A'}</div>
                <div><strong className="text-[#17202A]">Operator:</strong> {selectedLog.user?.email || selectedLog.userId}</div>
                <div><strong className="text-[#17202A]">Timestamp:</strong> {new Date(selectedLog.createdAt).toISOString()}</div>
              </div>

              {selectedLog.oldValue && (
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Previous State (oldValue)
                  </span>
                  <pre className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 text-rose-800 overflow-x-auto text-[11px]">
                    {typeof selectedLog.oldValue === 'object'
                      ? JSON.stringify(selectedLog.oldValue, null, 2)
                      : String(selectedLog.oldValue)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Applied State (newValue)
                  </span>
                  <pre className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-emerald-900 overflow-x-auto text-[11px]">
                    {typeof selectedLog.newValue === 'object'
                      ? JSON.stringify(selectedLog.newValue, null, 2)
                      : String(selectedLog.newValue)}
                  </pre>
                </div>
              )}

              {!selectedLog.oldValue && !selectedLog.newValue && (
                <div className="p-6 text-center text-slate-400">
                  No additional JSON payload attached to this security log.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
