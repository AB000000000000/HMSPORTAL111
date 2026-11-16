import React from 'react';
import {
  Bed,
  Users,
  Activity,
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Stethoscope,
  Microscope,
  Pill,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';
import { HospitalBranch, StaffUser, ModuleId } from '../../types/hms';
import { OPD_TOKENS_LIST, IPD_BEDS_LIST, DIAGNOSTIC_ORDERS } from '../../data/mockHmsData';

interface DashboardModuleProps {
  activeBranch: HospitalBranch;
  currentUser: StaffUser;
  onNavigate: (module: ModuleId) => void;
  onTriggerCodeBlue: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  activeBranch,
  currentUser,
  onNavigate,
  onTriggerCodeBlue,
}) => {
  const occRate = Math.round((activeBranch.occupiedBeds / activeBranch.totalBeds) * 100);

  return (
    <div className="space-y-6">
      {/* Module Title & Context Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
            {activeBranch.shortName} · {activeBranch.nabhLevel}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Executive Clinical & Operations Console
          </h1>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>Logged in: {currentUser.name} ({currentUser.role})</span>
            <span aria-hidden="true">·</span>
            <span>HFR: {activeBranch.hfrId}</span>
            <span aria-hidden="true">·</span>
            <span>ABHA M3 Gateway: Online</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('opd-queue')}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span>Open OPD Queue</span>
          </button>
          <button
            onClick={() => onNavigate('ipd-wards')}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Bed className="w-4 h-4 text-slate-500" />
            <span>Bed Census Grid</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Inpatient Bed Census */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>IPD Bed Occupancy</span>
            <Bed className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {activeBranch.occupiedBeds}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {activeBranch.totalBeds} Beds</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <div className="w-full bg-slate-100 rounded-full h-1.5 mr-2">
              <div
                className="bg-sky-600 h-1.5 rounded-full"
                style={{ width: `${occRate}%` }}
              />
            </div>
            <span className="font-mono font-semibold text-slate-700 shrink-0">{occRate}%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>ICU Beds: 65 (94% Occ)</span>
            <span className="text-emerald-700 font-medium">12 Avail.</span>
          </div>
        </div>

        {/* Metric 2: OPD Live Footfall */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>OPD Token Stream</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">148</span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +14% vs yesterday
            </span>
          </div>
          <div className="mt-2.5 text-xs text-slate-600 flex items-center justify-between">
            <span>In Consultation: 14</span>
            <span className="text-rose-700 font-mono font-semibold">18 Waiting</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Avg Consult Time: 12m</span>
            <span className="text-sky-700 font-medium">Triage P1: 2</span>
          </div>
        </div>

        {/* Metric 3: Doctor & Nursing Availability */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Medical Duty Roster</span>
            <Stethoscope className="w-4 h-4 text-cyan-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {activeBranch.availableDoctors}
            </span>
            <span className="text-xs text-slate-500">Doctors Active</span>
          </div>
          <div className="mt-2.5 text-xs text-slate-600 flex items-center justify-between">
            <span>Staff Nurses on Shift: 114</span>
            <span className="text-emerald-700 font-medium">100% Roster</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>ICU Nurse Ratio: 1:1</span>
            <span className="text-slate-700 font-mono">NABH Met</span>
          </div>
        </div>

        {/* Metric 4: NABH Quality Indicators */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>NABH 5th Ed. Quality</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
              98.4%
            </span>
            <span className="text-xs text-slate-500">Index Score</span>
          </div>
          <div className="mt-2.5 text-xs text-slate-600 flex items-center justify-between">
            <span>HAI Infection Rate: 0.38%</span>
            <span className="text-emerald-700 font-medium">Benchmark &lt;1%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Emergency TAT: 2m 14s</span>
            <span className="text-sky-700 font-medium">M3 Synced</span>
          </div>
        </div>
      </div>

      {/* Main Grid: OPD Live Queue & IPD Bed Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live OPD Token Desk */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Active Outpatient Queue & Consultation Desks
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time token management with automated triage allocation
              </p>
            </div>
            <button
              onClick={() => onNavigate('opd-queue')}
              className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1"
            >
              <span>View Full Queue (18)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Token</th>
                  <th className="py-2.5 px-4">Patient / UHID</th>
                  <th className="py-2.5 px-4">Department & Doctor</th>
                  <th className="py-2.5 px-4">Triage Priority</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Wait Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {OPD_TOKENS_LIST.slice(0, 5).map((token) => (
                  <tr key={token.tokenId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-900">
                      {token.tokenNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{token.patientName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{token.uhid} · {token.ageGender}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{token.department}</div>
                      <div className="text-[11px] text-slate-500">{token.doctorName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          token.triagePriority === 'Emergency' || token.triage?.startsWith('P1')
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : token.triagePriority === 'Urgent' || token.triage?.startsWith('P2')
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {token.triagePriority || token.triage || 'Normal'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          token.status === 'IN_PROGRESS'
                            ? 'text-purple-700'
                            : token.status === 'CHECKED_IN'
                            ? 'text-sky-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {token.status === 'IN_PROGRESS' && '● In-Progress'}
                        {token.status === 'CHECKED_IN' && '○ Checked-In'}
                        {token.status === 'COMPLETED' && '✓ Completed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {token.waitTimeMin} mins
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 Col): Critical Alerts & Bed Status */}
        <div className="space-y-6">
          {/* Critical Diagnostic & Lab Alert Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                  Critical Panic Alerts (LIS/RIS)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                STAT
              </span>
            </div>

            <div className="p-4 space-y-3">
              {DIAGNOSTIC_ORDERS.filter((d) => d.isCritical).map((order) => (
                <div
                  key={order.orderId}
                  className="p-3 rounded-lg border border-rose-200 bg-rose-50/30 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-rose-900">
                    <span>{order.testName}</span>
                    <span className="text-[10px] font-mono text-slate-500">{order.orderTime}</span>
                  </div>
                  <div className="text-slate-700 font-medium">
                    Patient: {order.patientName} ({order.uhid})
                  </div>
                  <div className="font-mono text-rose-700 font-bold">
                    Result: {order.resultValue}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-rose-100">
                    <span>Ref: {order.normalRange}</span>
                    <button
                      onClick={() => onNavigate('diagnostics')}
                      className="text-sky-700 hover:underline font-semibold"
                    >
                      Acknowledge →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Code Blue & Resuscitation Action */}
          <div className="p-4 bg-slate-900 rounded-xl text-white shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Emergency Readiness
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">NABH Level 3 Standard</span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Resuscitation crash carts verified. Defibrillator self-test passed at 06:00 AM.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={onTriggerCodeBlue}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                Broadcast Code Blue Drill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
