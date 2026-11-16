import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  Building,
  RefreshCw,
  Award,
} from 'lucide-react';
import { ComplianceCheck, StaffUser } from '../../types/hms';
import { COMPLIANCE_CHECKLIST } from '../../data/mockHmsData';

interface ComplianceModuleProps {
  currentUser: StaffUser;
}

export const ComplianceModule: React.FC<ComplianceModuleProps> = ({ currentUser }) => {
  const [checklist, setChecklist] = useState<ComplianceCheck[]>(COMPLIANCE_CHECKLIST);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredItems = checklist.filter(
    (item) => selectedCategory === 'ALL' || item.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
            Quality Assurance & Regulatory Affairs
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            NABH 5th Edition & Statutory Audit Console
          </h1>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>NABH Level 3 Apex Hospital Accreditation</span>
            <span aria-hidden="true">·</span>
            <span>State Pollution Control Board BMW Rules 2016</span>
            <span aria-hidden="true">·</span>
            <span>ABDM M3 Certified</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-700" />
            <span>NABH Score: 98.4% (Exemplary)</span>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1 overflow-x-auto">
        {[
          'ALL',
          'Patient Safety',
          'Infection Control',
          'BMW (Bio-Medical Waste)',
          'ABHA/NDHM',
          'Medicine Safety',
        ].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {cat === 'ALL' ? 'All Audit Standards' : cat}
          </button>
        ))}
      </div>

      {/* Compliance Standards List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isCompliant = item.status === 'COMPLIANT';
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isCompliant
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isCompliant ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-sky-800">
                      {item.standardCode}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-900 block tabular-nums">
                      {item.complianceScore}% Score
                    </span>
                    <span className="text-[10px] text-slate-400">Audited {item.lastAudited}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isCompliant
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {item.actionRequired && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                  <span className="font-semibold text-slate-800 shrink-0">Audit Finding / Log:</span>
                  <span>{item.actionRequired}</span>
                </div>
              )}

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Auditor: {item.auditor}</span>
                <span className="text-sky-700 font-medium">Category: {item.category}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
