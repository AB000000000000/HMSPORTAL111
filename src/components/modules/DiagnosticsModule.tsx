import React, { useState } from 'react';
import {
  Microscope,
  Activity,
  AlertCircle,
  FileCheck,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { DiagnosticOrder, StaffUser } from '../../types/hms';
import { DIAGNOSTIC_ORDERS } from '../../data/mockHmsData';

interface DiagnosticsModuleProps {
  currentUser: StaffUser;
  onOpenPatientEmr: (uhid: string) => void;
}

export const DiagnosticsModule: React.FC<DiagnosticsModuleProps> = ({
  currentUser,
  onOpenPatientEmr,
}) => {
  const [orders, setOrders] = useState<DiagnosticOrder[]>(DIAGNOSTIC_ORDERS);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'LIS' | 'RIS' | 'CRITICAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      selectedFilter === 'ALL' ||
      (selectedFilter === 'CRITICAL' && order.isCritical) ||
      order.category === selectedFilter;
    const matchesSearch =
      order.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
            Diagnostic Services (LIS & RIS PACS)
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Pathology Laboratory & Radiology Imaging Console
          </h1>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>Analyzer Interfaces: Automated Bi-Directional Sync</span>
            <span aria-hidden="true">·</span>
            <span>DICOM PACS Gateway Online</span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-700 font-semibold">2 Critical Alerts</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>LIS/RIS HL7 & FHIR Bridge Active</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(['ALL', 'LIS', 'RIS', 'CRITICAL'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedFilter === filter
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter === 'ALL'
                ? 'All Orders'
                : filter === 'LIS'
                ? 'LIS Pathology'
                : filter === 'RIS'
                ? 'RIS Radiology'
                : 'Panic Values'}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test name, patient, UHID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order ID & Modality</th>
                <th className="py-3 px-4">Test Name</th>
                <th className="py-3 px-4">Patient / UHID</th>
                <th className="py-3 px-4">Ordered By</th>
                <th className="py-3 px-4">Result / Observation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <div className="font-bold text-slate-900">{order.orderId}</div>
                    <div className="text-[11px] text-slate-400">
                      {order.category} · {order.modality}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{order.testName}</div>
                    <div className="text-[11px] text-slate-500">Ordered: {order.orderTime}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{order.patientName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{order.uhid}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{order.orderedBy}</td>
                  <td className="py-3.5 px-4">
                    {order.resultValue ? (
                      <div>
                        <div
                          className={`font-semibold ${
                            order.isCritical ? 'text-rose-700 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {order.resultValue}
                        </div>
                        {order.normalRange && (
                          <div className="text-[11px] text-slate-400">Ref: {order.normalRange}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Processing in analyzer...</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        order.sampleStatus === 'CRITICAL_ALERT'
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : order.sampleStatus === 'REPORTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.sampleStatus === 'PROCESSING'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {order.sampleStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onOpenPatientEmr(order.uhid)}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-900 hover:underline"
                    >
                      Open EMR →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
