import React, { useState } from 'react';
import {
  Pill,
  Search,
  AlertTriangle,
  CheckCircle,
  PackageCheck,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { PharmacyItem, StaffUser } from '../../types/hms';
import { PHARMACY_INVENTORY } from '../../data/mockHmsData';

interface PharmacyModuleProps {
  currentUser: StaffUser;
}

export const PharmacyModule: React.FC<PharmacyModuleProps> = ({ currentUser }) => {
  const [inventory, setInventory] = useState<PharmacyItem[]>(PHARMACY_INVENTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredItems = inventory.filter((item) => {
    const matchesQuery =
      item.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rackLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const lowStockCount = inventory.filter((i) => i.status === 'LOW_STOCK').length;
  const expiringCount = inventory.filter((i) => i.status === 'EXPIRING_SOON').length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
            Inpatient & OPD Clinical Pharmacy
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Drug Formulary & Inventory Dispensing
          </h1>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>Incharge: {currentUser.name}</span>
            <span aria-hidden="true">·</span>
            <span>PCI License: {currentUser.licenseNumber}</span>
            <span aria-hidden="true">·</span>
            <span>Schedule H1 / LASA Audit Current</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lowStockCount > 0 && (
            <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{lowStockCount} Low Stock Alerts</span>
            </span>
          )}
          {expiringCount > 0 && (
            <span className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{expiringCount} Near Expiry</span>
            </span>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {['ALL', 'IN_STOCK', 'LOW_STOCK', 'EXPIRING_SOON'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'ALL'
                ? 'All Formulary'
                : st === 'IN_STOCK'
                ? 'In Stock'
                : st === 'LOW_STOCK'
                ? 'Low Stock'
                : 'Expiring Soon'}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drug, generic name, batch, rack..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
          />
        </div>
      </div>

      {/* Pharmacy Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Drug & Strength</th>
                <th className="py-3 px-4">Generic Composition</th>
                <th className="py-3 px-4">Dosage Form</th>
                <th className="py-3 px-4">Stock on Hand</th>
                <th className="py-3 px-4">Batch & Expiry</th>
                <th className="py-3 px-4">Rack Location</th>
                <th className="py-3 px-4">Unit Rate</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.drugId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{item.brandName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{item.strength}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {item.genericName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {item.dosageForm}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                    {item.stockQty}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Min: {item.reorderLevel})
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-slate-800 text-[11px]">
                      Batch: {item.batchNumber}
                    </div>
                    <div className="text-slate-500 text-[11px]">Exp: {item.expiryDate}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    {item.rackLocation}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800 tabular-nums">
                    ₹{item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.status === 'LOW_STOCK'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'EXPIRING_SOON'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
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
