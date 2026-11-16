import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  X,
  ExternalLink,
  Building2,
  Users,
  Database,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { HospitalBranch } from '../../types/hms';

interface AbhaComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBranch: HospitalBranch;
}

export const AbhaComplianceModal: React.FC<AbhaComplianceModalProps> = ({
  isOpen,
  onClose,
  activeBranch,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedTime, setVerifiedTime] = useState('2 minutes ago');

  if (!isOpen) return null;

  const handleRecheck = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifiedTime('Just now');
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span>ABHA & ABDM Compliance Node</span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  M3 ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Ayushman Bharat Digital Mission (ABDM) & National Health Authority (NHA)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Facility Registry Info Box */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Facility Credentials ({activeBranch.shortName})
              </span>
              <button
                onClick={handleRecheck}
                disabled={isVerifying}
                className="text-xs text-sky-700 hover:text-sky-900 flex items-center gap-1 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>Verify Gateway</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">ABHA Facility ID</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {activeBranch.abhaFacilityId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Health Facility Registry (HFR ID)</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {activeBranch.hfrId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">NABH Accreditation</span>
                <span className="font-semibold text-slate-900">{activeBranch.nabhLevel}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Sync</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Synchronized ({verifiedTime})
                </span>
              </div>
            </div>
          </div>

          {/* ABDM Milestone Compliance Cards */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              ABDM Digital Health Integration Milestones
            </h4>
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 flex items-center justify-between">
                    <span>Milestone 1: ABHA Creation & Verification</span>
                    <span className="text-emerald-700 font-mono font-medium">100% Pass</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Aadhaar OTP and biometric tokenization active at OPD registration desk. Instant QR scan-and-share ready.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 flex items-center justify-between">
                    <span>Milestone 2: Health Information Provider (HIP)</span>
                    <span className="text-emerald-700 font-mono font-medium">Connected</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Live FHIR R4 standard packaging for Discharge Summaries, Diagnostic Lab Reports, and Prescription records.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 flex items-center justify-between">
                    <span>Milestone 3: Health Information User (HIU)</span>
                    <span className="text-emerald-700 font-mono font-medium">M3 Certified</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Consent Manager Protocol v1.0. Clinicians can request past health records with cryptographically signed patient approval.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Registry Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">142/142</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">Doctors on HPR</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-lg font-bold font-mono text-emerald-700 tabular-nums">98.4%</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">Consent Link Rate</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-lg font-bold font-mono text-sky-700 tabular-nums">FHIR R4</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">Bundle Protocol</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            National Health Claims Exchange (NHCX) Ready
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
