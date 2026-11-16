import React, { useState } from 'react';
import {
  CalendarCheck,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Search,
  Filter,
  UserPlus,
} from 'lucide-react';
import { RosterShift, StaffUser } from '../../types/hms';
import { DUTY_ROSTER } from '../../data/mockHmsData';

interface HrRosterModuleProps {
  currentUser: StaffUser;
}

export const HrRosterModule: React.FC<HrRosterModuleProps> = ({ currentUser }) => {
  const [roster, setRoster] = useState<RosterShift[]>(DUTY_ROSTER);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const filteredRoster = roster.filter(
    (item) => departmentFilter === 'ALL' || item.department.includes(departmentFilter)
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
            Clinical Human Resources & Staffing
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Doctor & Nursing Duty Roster (NABH Ratios)
          </h1>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>NABH Staff-to-Bed Mandate: ICU 1:1 · HDU 1:2 · General 1:5</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-semibold">100% Shift Compliance Met</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Shift Coverage Complete</span>
          </div>
        </div>
      </div>

      {/* NABH Ratio Monitoring Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>ICU Nurse-to-Patient Ratio</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">1 : 1 (Active)</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Mandatory continuous 1-on-1 nursing for intubated/critical beds.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>HDU Nurse-to-Patient Ratio</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">1 : 2 (Active)</div>
          <p className="text-[11px] text-slate-400 mt-1">
            1 Staff Nurse assigned per 2 step-down beds.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>General Ward Ratio</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">1 : 5 (Active)</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Well within NABH 5th edition threshold (&le; 1:6).
          </p>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Shift Roster
            </span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
            >
              <option value="ALL">All Departments</option>
              <option value="Cardiology">Cardiology</option>
              <option value="ICU">ICU & HDU</option>
              <option value="Orthopaedics">Orthopaedics</option>
              <option value="Reception">OPD Reception</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {filteredRoster.length} Personnel on Active Duty
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Name & ID</th>
                <th className="py-3 px-4">Designation Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Shift Timings</th>
                <th className="py-3 px-4">Assigned Room / Bed Matrix</th>
                <th className="py-3 px-4 text-right">Ratio Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoster.map((sh) => (
                <tr key={sh.staffId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{sh.staffName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{sh.staffId}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-sky-50 text-sky-800 px-2 py-0.5 rounded font-semibold text-[11px]">
                      {sh.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{sh.department}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{sh.shift}</td>
                  <td className="py-3.5 px-4 text-slate-800 font-medium">{sh.roomOrWard}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ NABH Met
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
