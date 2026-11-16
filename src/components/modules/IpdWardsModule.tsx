import React, { useState } from 'react';
import {
  Bed,
  Activity,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  User,
  ShieldAlert,
  ArrowRight,
  Pill,
  Clock,
  Layers,
  Calendar,
  AlertCircle,
  Building,
  Check,
  X,
  Stethoscope,
  Filter,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { IpdBed, HospitalBranch, PharmacyFefoDrug, DrugBatch, Patient } from '../../types/hms';
import { IPD_BEDS_LIST, PHARMACY_FEFO_DRUGS, PATIENTS_DATABASE } from '../../data/mockHmsData';

interface IpdWardsModuleProps {
  activeBranch: HospitalBranch;
  onOpenEmr: (uhid: string) => void;
}

export const IpdWardsModule: React.FC<IpdWardsModuleProps> = ({
  activeBranch,
  onOpenEmr,
}) => {
  // ================= STATE: Ward Census =================
  const [beds, setBeds] = useState<IpdBed[]>(IPD_BEDS_LIST);
  const [selectedWardCategory, setSelectedWardCategory] = useState<string>('ALL');
  const [bedSearchQuery, setBedSearchQuery] = useState('');

  // Modals for Bed Actions
  const [selectedBedForAdmission, setSelectedBedForAdmission] = useState<IpdBed | null>(null);
  const [selectedBedForDetails, setSelectedBedForDetails] = useState<IpdBed | null>(null);
  const [selectedBedForMaintenance, setSelectedBedForMaintenance] = useState<IpdBed | null>(null);

  // Admission Form State
  const [admissionForm, setAdmissionForm] = useState({
    patientName: '',
    uhid: '',
    age: '45',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    doctor: 'Dr. Sunita Deshmukh',
    diagnosis: '',
    alertStatus: 'STABLE' as 'STABLE' | 'OBSERVATION' | 'CRITICAL',
    oxygenSupport: true,
    ventilator: false,
  });

  // ================= STATE: Pharmacy FEFO Inventory =================
  const [fefoDrugs, setFefoDrugs] = useState<PharmacyFefoDrug[]>(PHARMACY_FEFO_DRUGS);
  const [fefoSearch, setFefoSearch] = useState('');
  const [fefoFilter, setFefoFilter] = useState<'ALL' | 'EXPIRING_90' | 'CRITICAL_30' | 'COLD_STORAGE'>('ALL');
  const [expandedDrugId, setExpandedDrugId] = useState<string | null>(null);
  const [dispenseSuccessToast, setDispenseSuccessToast] = useState<string | null>(null);

  // Census Counters
  const occupiedCount = beds.filter((b) => b.status === 'OCCUPIED').length;
  const availableCount = beds.filter((b) => b.status === 'AVAILABLE').length;
  const maintenanceCount = beds.filter(
    (b) => b.status === 'MAINTENANCE' || b.status === 'CLEANING'
  ).length;
  const totalMatrixBeds = beds.length;
  const matrixOccRate = Math.round((occupiedCount / totalMatrixBeds) * 100);

  // Filter beds by category (ICU, General Ward, Private Suites)
  const filteredBeds = beds.filter((bed) => {
    let matchesCategory = true;
    if (selectedWardCategory === 'ICU') {
      matchesCategory = bed.ward === 'ICU-A' || bed.ward === 'ICU-B' || bed.bedNumber.startsWith('ICU');
    } else if (selectedWardCategory === 'GENERAL') {
      matchesCategory = bed.ward === 'GENERAL-MALE' || bed.ward === 'GENERAL-FEMALE' || bed.bedNumber.startsWith('GEN');
    } else if (selectedWardCategory === 'PRIVATE') {
      matchesCategory = bed.ward === 'PRIVATE-DELUXE' || bed.bedNumber.startsWith('SUITE') || bed.bedNumber.startsWith('DELUXE');
    }

    const matchesSearch =
      bed.bedNumber.toLowerCase().includes(bedSearchQuery.toLowerCase()) ||
      (bed.patient?.name.toLowerCase().includes(bedSearchQuery.toLowerCase()) ?? false) ||
      (bed.patient?.uhid.toLowerCase().includes(bedSearchQuery.toLowerCase()) ?? false) ||
      (bed.patient?.diagnosis.toLowerCase().includes(bedSearchQuery.toLowerCase()) ?? false);

    return matchesCategory && matchesSearch;
  });

  // Handle bed click according to its status
  const handleBedClick = (bed: IpdBed) => {
    if (bed.status === 'AVAILABLE') {
      setSelectedBedForAdmission(bed);
      // Pre-fill with a sample waiting patient from database
      const candidate = PATIENTS_DATABASE.find((p) => p.status === 'OPD' || p.status === 'Emergency');
      if (candidate) {
        setAdmissionForm({
          patientName: candidate.name,
          uhid: candidate.uhid,
          age: String(candidate.age),
          gender: candidate.gender,
          doctor: candidate.attendingDoctor,
          diagnosis: candidate.chiefComplaint,
          alertStatus: candidate.triageCategory === 'P1' ? 'CRITICAL' : 'OBSERVATION',
          oxygenSupport: bed.oxygenSupport,
          ventilator: bed.ventilator,
        });
      }
    } else if (bed.status === 'OCCUPIED') {
      setSelectedBedForDetails(bed);
    } else if (bed.status === 'MAINTENANCE' || bed.status === 'CLEANING') {
      setSelectedBedForMaintenance(bed);
    }
  };

  // Confirm Inpatient Admission
  const handleConfirmAdmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedForAdmission) return;

    const updatedBeds = beds.map((b) => {
      if (b.bedId === selectedBedForAdmission.bedId) {
        return {
          ...b,
          status: 'OCCUPIED' as const,
          oxygenSupport: admissionForm.oxygenSupport,
          ventilator: admissionForm.ventilator,
          patient: {
            uhid: admissionForm.uhid || `UHID-2026-${Math.floor(10000 + Math.random() * 90000)}`,
            name: admissionForm.patientName || 'Admitted Patient',
            ageGender: `${admissionForm.age}${admissionForm.gender[0]}`,
            doctor: admissionForm.doctor,
            diagnosis: admissionForm.diagnosis || 'Under Observation',
            admissionDate: new Date().toISOString().slice(0, 10),
            alertStatus: admissionForm.alertStatus,
          },
        };
      }
      return b;
    });

    setBeds(updatedBeds);
    setSelectedBedForAdmission(null);
  };

  // Discharge Patient from Bed
  const handleDischargePatient = (bedId: string) => {
    setBeds((prev) =>
      prev.map((b) => (b.bedId === bedId ? { ...b, status: 'MAINTENANCE' as const, patient: undefined } : b))
    );
    setSelectedBedForDetails(null);
  };

  // Release Maintenance Bed to Available
  const handleCompleteDisinfection = (bedId: string) => {
    setBeds((prev) =>
      prev.map((b) => (b.bedId === bedId ? { ...b, status: 'AVAILABLE' as const } : b))
    );
    setSelectedBedForMaintenance(null);
  };

  // ================= PHARMACY FEFO LOGIC =================
  // Filter FEFO drugs
  const filteredFefoDrugs = fefoDrugs.filter((drug) => {
    const matchesSearch =
      drug.brandName.toLowerCase().includes(fefoSearch.toLowerCase()) ||
      drug.genericName.toLowerCase().includes(fefoSearch.toLowerCase()) ||
      drug.category.toLowerCase().includes(fefoSearch.toLowerCase()) ||
      drug.batches.some((b) => b.batchNumber.toLowerCase().includes(fefoSearch.toLowerCase()));

    let matchesFilter = true;
    if (fefoFilter === 'EXPIRING_90') {
      matchesFilter = drug.batches.some((b) => b.daysUntilExpiry <= 90);
    } else if (fefoFilter === 'CRITICAL_30') {
      matchesFilter = drug.batches.some((b) => b.daysUntilExpiry <= 30);
    } else if (fefoFilter === 'COLD_STORAGE') {
      matchesFilter = drug.category.toLowerCase().includes('cold');
    }

    return matchesSearch && matchesFilter;
  });

  // Calculate FEFO inventory summary metrics
  const totalExpiring90 = fefoDrugs.flatMap((d) => d.batches).filter((b) => b.daysUntilExpiry <= 90).length;
  const totalCritical30 = fefoDrugs.flatMap((d) => d.batches).filter((b) => b.daysUntilExpiry <= 30).length;
  const totalUnits = fefoDrugs.reduce((acc, d) => acc + d.totalStock, 0);

  // Dispense from earliest expiring batch (FEFO Principle)
  const handleDispenseFefo = (drugId: string) => {
    setFefoDrugs((prev) =>
      prev.map((drug) => {
        if (drug.drugId === drugId && drug.batches.length > 0) {
          // Sort batches by earliest expiry date (FEFO)
          const sortedBatches = [...drug.batches].sort(
            (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
          );

          // Decrement from the earliest batch (#1 in queue)
          const earliest = sortedBatches[0];
          if (earliest.stockQty > 0) {
            const updatedEarliest = { ...earliest, stockQty: earliest.stockQty - 1 };
            const updatedBatches = sortedBatches.map((b) =>
              b.batchNumber === earliest.batchNumber ? updatedEarliest : b
            );
            const newTotalStock = drug.totalStock - 1;

            setDispenseSuccessToast(
              `✓ Dispensed 1 unit of ${drug.brandName} from earliest Batch ${earliest.batchNumber} (Exp: ${earliest.expiryDate})`
            );
            setTimeout(() => setDispenseSuccessToast(null), 4000);

            return {
              ...drug,
              totalStock: newTotalStock,
              batches: updatedBatches,
            };
          }
        }
        return drug;
      })
    );
  };

  return (
    <div className="space-y-8">
      {/* =========================================================================
          TOP SECTION: INPATIENT WARD CENSUS OVERVIEW
         ========================================================================= */}
      <section className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="text-xs font-semibold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>Inpatient Department (IPD) · {activeBranch.shortName}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Ward Census & Bed Matrix Management
            </h1>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Facility Capacity: {activeBranch.totalBeds} Beds</span>
              <span aria-hidden="true">·</span>
              <span>Central O2 Vacuum Piped</span>
              <span aria-hidden="true">·</span>
              <span>NABH Level 3 Inpatient Accreditation</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Census Live Sync</span>
            </div>
          </div>
        </div>

        {/* 1. Summary Metric Cards with Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Beds */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Ward Capacity</span>
              <Bed className="w-4 h-4 text-slate-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {activeBranch.totalBeds}
              </span>
              <span className="text-xs text-slate-400 font-mono">Beds</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Active Matrix Sample: {totalMatrixBeds} Beds
            </div>
          </div>

          {/* Occupied Beds */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Occupied Beds</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {activeBranch.occupiedBeds}
              </span>
              <span className="text-xs text-rose-700 font-bold font-mono">
                ({occupiedCount} in active view)
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Avg Length of Stay: 3.8 days
            </div>
          </div>

          {/* Available Beds */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Available & Sanitized</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
                {activeBranch.totalBeds - activeBranch.occupiedBeds}
              </span>
              <span className="text-xs text-emerald-800 font-bold font-mono">
                ({availableCount} in view)
              </span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 font-medium">
              Ready for immediate admission
            </div>
          </div>

          {/* Maintenance / Cleaning Beds */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Maintenance / Terminal Clean</span>
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
                {maintenanceCount}
              </span>
              <span className="text-xs text-slate-400 font-mono">Beds</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-800 font-medium">
              Disinfection protocol active
            </div>
          </div>

          {/* Overall Census Occupancy Rate */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Census Occupancy Rate</span>
              <Activity className="w-4 h-4 text-sky-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {Math.round((activeBranch.occupiedBeds / activeBranch.totalBeds) * 100)}%
              </span>
              <span className="text-xs text-slate-500">Facility-Wide</span>
            </div>
            {/* Visual Progress Bar */}
            <div className="mt-2.5 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((activeBranch.occupiedBeds / activeBranch.totalBeds) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1 text-[10px] text-slate-400 text-right font-mono">
              Matrix sample: {matrixOccRate}% Occ
            </div>
          </div>
        </div>

        {/* 2. Ward Breakdown Category Tabs & Bed Search */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            {[
              { id: 'ALL', label: 'All Wards' },
              { id: 'ICU', label: 'ICU (Intensive Care)' },
              { id: 'GENERAL', label: 'General Ward (Male / Female)' },
              { id: 'PRIVATE', label: 'Private Suites & Deluxe' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedWardCategory(tab.id)}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                  selectedWardCategory === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bed number or patient */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search bed, patient, diagnosis..."
              value={bedSearchQuery}
              onChange={(e) => setBedSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
            />
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex items-center gap-5 text-xs text-slate-600 px-1">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <span>AVAILABLE (Click to Admit)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-200" />
            <span>OCCUPIED (Click for Patient Summary)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-200" />
            <span>MAINTENANCE (Terminal Disinfection)</span>
          </span>
        </div>

        {/* 3. Individual Bed Cards Color-Coded Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBeds.map((bed) => {
            const isAvailable = bed.status === 'AVAILABLE';
            const isOccupied = bed.status === 'OCCUPIED';
            const isMaintenance = bed.status === 'MAINTENANCE' || bed.status === 'CLEANING';

            return (
              <div
                key={bed.bedId}
                onClick={() => handleBedClick(bed)}
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-md select-none ${
                  isAvailable
                    ? 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-500'
                    : isOccupied
                    ? 'bg-white border-slate-300 hover:border-sky-500'
                    : 'bg-amber-50/60 border-amber-300 hover:border-amber-500'
                }`}
              >
                {/* Bed Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : isOccupied
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <Bed className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-sm block">
                        {bed.bedNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        {bed.ward}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isAvailable
                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                        : isOccupied
                        ? 'bg-slate-100 text-slate-900 border border-slate-300'
                        : 'bg-amber-100 text-amber-950 border border-amber-300'
                    }`}
                  >
                    {isMaintenance ? 'MAINTENANCE' : bed.status}
                  </span>
                </div>

                {/* Patient Information if Occupied */}
                {isOccupied && bed.patient ? (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs truncate max-w-[150px]">
                        {bed.patient.name}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {bed.patient.ageGender}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      UHID: {bed.patient.uhid}
                    </div>
                    <p className="text-[11px] text-slate-700 line-clamp-2 leading-relaxed">
                      <span className="font-semibold text-slate-900">Dx:</span> {bed.patient.diagnosis}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Doc: {bed.patient.doctor.split(' ')[1] || bed.patient.doctor}</span>
                      <span
                        className={`font-bold px-1 rounded ${
                          bed.patient.alertStatus === 'CRITICAL'
                            ? 'text-rose-700 bg-rose-50'
                            : 'text-slate-600'
                        }`}
                      >
                        {bed.patient.alertStatus || 'STABLE'}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Available Action Prompt */}
                {isAvailable && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/70 text-xs flex items-center justify-between text-emerald-900">
                    <span className="font-bold text-[11px] flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Click to Admit Patient</span>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 font-mono">
                      Ready
                    </span>
                  </div>
                )}

                {/* Maintenance Action Prompt */}
                {isMaintenance && (
                  <div className="mt-3 pt-3 border-t border-amber-200/70 text-xs flex items-center justify-between text-amber-900">
                    <span className="font-bold text-[11px] flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                      <span>Terminal Disinfection</span>
                    </span>
                    <span className="text-[10px] text-amber-800 font-bold underline">
                      Release
                    </span>
                  </div>
                )}

                {/* Equipment Strip */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 text-[10px]">
                  {bed.oxygenSupport && (
                    <span className="px-1.5 py-0.2 rounded bg-sky-50 text-sky-800 border border-sky-200 font-mono flex items-center gap-0.5">
                      <Wind className="w-3 h-3 text-sky-600" /> Central O2
                    </span>
                  )}
                  {bed.ventilator && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200 font-mono font-bold">
                      Ventilator
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          BOTTOM SECTION: PHARMACY FEFO INVENTORY (FIRST-EXPIRY-FIRST-OUT)
         ========================================================================= */}
      <section className="space-y-6 pt-6 border-t-2 border-slate-200">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5" />
              <span>Hospital Pharmacy Inventory Management</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Pharmacy FEFO (First-Expiry-First-Out) Inventory & Batch Matrix
            </h2>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>NABH Medicine Safety Mandate MOM.5.2</span>
              <span aria-hidden="true">·</span>
              <span>Sorted by Earliest Expiry</span>
              <span aria-hidden="true">·</span>
              <span>Barcoded Batch Accessioning</span>
            </div>
          </div>

          {/* Quick Dispense Success Toast Notification */}
          {dispenseSuccessToast && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{dispenseSuccessToast}</span>
            </div>
          )}
        </div>

        {/* FEFO Summary Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium block">Total Formulations (SKUs)</span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block tabular-nums">
              {fefoDrugs.length} Active
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">In Hospital Formulary</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium block">Total Units on Hand</span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block tabular-nums">
              {totalUnits.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Across All Storage Racks</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-2xs bg-amber-50/20">
            <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
              <span>Expiring &lt; 90 Days (FEFO Alert)</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-2xl font-bold font-mono text-amber-900 mt-1 block tabular-nums">
              {totalExpiring90} Batches
            </span>
            <span className="text-[11px] text-amber-800 mt-1 block font-medium">
              Prioritize for immediate dispensing
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-300 shadow-2xs bg-rose-50/20">
            <div className="flex items-center justify-between text-xs text-rose-800 font-bold">
              <span>Critical &lt; 30 Days (STAT Alert)</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-2xl font-bold font-mono text-rose-900 mt-1 block tabular-nums">
              {totalCritical30} Batches
            </span>
            <span className="text-[11px] text-rose-800 mt-1 block font-medium">
              Immediate recall / return to vendor
            </span>
          </div>
        </div>

        {/* Search & FEFO Filter Tabs */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            {[
              { id: 'ALL', label: 'All Medications' },
              { id: 'EXPIRING_90', label: 'Expiring < 90 Days (FEFO Alert)' },
              { id: 'CRITICAL_30', label: 'Critical < 30 Days' },
              { id: 'COLD_STORAGE', label: 'Cold Storage (2-8°C)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFefoFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                  fefoFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search drug or batch */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search brand, generic, batch #..."
              value={fefoSearch}
              onChange={(e) => setFefoSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
            />
          </div>
        </div>

        {/* Searchable Drug Catalog Table with Interactive "Batch Expiry Matrix" */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Brand & Generic Name</th>
                  <th className="py-3 px-4">Dosage Form</th>
                  <th className="py-3 px-4">Total Stock (Units)</th>
                  <th className="py-3 px-4">Interactive Batch Expiry Matrix (FEFO Order)</th>
                  <th className="py-3 px-4 text-right">FEFO Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFefoDrugs.map((drug) => {
                  // Sort batches strictly by earliest expiry date (FEFO Principle)
                  const sortedBatches = [...drug.batches].sort(
                    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                  );

                  return (
                    <tr key={drug.drugId} className="hover:bg-slate-50/60 transition-colors">
                      {/* Drug Name & Category */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{drug.brandName}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{drug.genericName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {drug.category}
                        </div>
                      </td>

                      {/* Dosage Form & Strength */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {drug.dosageForm}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono mt-1">
                          {drug.strength}
                        </div>
                      </td>

                      {/* Total Stock */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                          {drug.totalStock}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">units</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Reorder: {drug.reorderLevel} · ₹{drug.unitPrice.toFixed(2)}/u
                        </div>
                      </td>

                      {/* Interactive Batch Expiry Matrix (FEFO) */}
                      <td className="py-3.5 px-4 min-w-[340px]">
                        <div className="space-y-1.5">
                          {sortedBatches.map((batch, idx) => {
                            const isEarliest = idx === 0;
                            const isCritical = batch.daysUntilExpiry <= 30;
                            const isExpiring90 = batch.daysUntilExpiry <= 90 && !isCritical;

                            return (
                              <div
                                key={batch.batchNumber}
                                className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                                  isCritical
                                    ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                                    : isExpiring90
                                    ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                                    : 'bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isEarliest && (
                                    <span
                                      className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-sky-600 text-white"
                                      title="FEFO Priority: Earliest expiring batch must be dispensed first"
                                    >
                                      #1 FEFO Next
                                    </span>
                                  )}
                                  <span className="font-mono font-bold">{batch.batchNumber}</span>
                                  <span className="text-slate-400">·</span>
                                  <span className="font-mono text-[11px]">{batch.stockQty} Qty</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px]">
                                    Exp: {batch.expiryDate}
                                  </span>

                                  {/* Visual Warning Highlights for NABH Compliance */}
                                  {isCritical && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 text-rose-700" />
                                      <span>{batch.daysUntilExpiry}d (CRITICAL)</span>
                                    </span>
                                  )}
                                  {isExpiring90 && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-amber-700" />
                                      <span>{batch.daysUntilExpiry}d (EXPIRING)</span>
                                    </span>
                                  )}
                                  {!isCritical && !isExpiring90 && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-900 border border-emerald-300">
                                      {batch.daysUntilExpiry}d (Safe)
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDispenseFefo(drug.drugId)}
                          disabled={drug.totalStock <= 0}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs inline-flex items-center gap-1.5"
                          title="Dispense 1 unit from earliest expiring batch (#1 FEFO)"
                        >
                          <Pill className="w-3.5 h-3.5" />
                          <span>Dispense FEFO</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MODAL 1: INPATIENT BED ADMISSION MODAL (WHEN AVAILABLE BED CLICKED)
         ========================================================================= */}
      {selectedBedForAdmission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setSelectedBedForAdmission(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-sm font-bold flex items-center gap-2">
                  <Bed className="w-4 h-4 text-emerald-400" />
                  <span>Admit Patient to Bed {selectedBedForAdmission.bedNumber}</span>
                </div>
                <p className="text-xs text-slate-300">
                  Ward: {selectedBedForAdmission.ward} · Status: AVAILABLE
                </p>
              </div>
              <button
                onClick={() => setSelectedBedForAdmission(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Admission Form */}
            <form onSubmit={handleConfirmAdmission} className="p-6 space-y-4 text-xs">
              {/* Select or type patient */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Patient Name & UHID <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={admissionForm.patientName}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, patientName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Age</label>
                  <input
                    type="number"
                    value={admissionForm.age}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, age: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={admissionForm.gender}
                    onChange={(e) =>
                      setAdmissionForm({ ...admissionForm, gender: e.target.value as any })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Admitting Consultant Doctor
                </label>
                <select
                  value={admissionForm.doctor}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, doctor: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  <option value="Dr. Sunita Deshmukh">Dr. Sunita Deshmukh, MD (Cardiology)</option>
                  <option value="Dr. Arvind Sen">Dr. Arvind Sen, DM (Neurology)</option>
                  <option value="Dr. Vikram Malhotra">Dr. Vikram Malhotra, MS (Orthopaedics)</option>
                  <option value="Dr. Rajesh Bhatt">Dr. Rajesh Bhatt, MD (Pulmonology)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Admission Diagnosis & Chief Complaint
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute STEMI post-PCI / Severe Sepsis"
                  value={admissionForm.diagnosis}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, diagnosis: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Triage Alert Status */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Clinical Alert Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['STABLE', 'OBSERVATION', 'CRITICAL'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setAdmissionForm({ ...admissionForm, alertStatus: status })}
                      className={`p-2 rounded-lg border font-bold text-center transition-all ${
                        admissionForm.alertStatus === status
                          ? status === 'CRITICAL'
                            ? 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-300'
                            : status === 'OBSERVATION'
                            ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-300'
                            : 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-300'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Oxygen & Ventilator Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={admissionForm.oxygenSupport}
                    onChange={(e) =>
                      setAdmissionForm({ ...admissionForm, oxygenSupport: e.target.checked })
                    }
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-semibold text-slate-800">Oxygen Support Piped</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={admissionForm.ventilator}
                    onChange={(e) =>
                      setAdmissionForm({ ...admissionForm, ventilator: e.target.checked })
                    }
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-semibold text-slate-800">Ventilator Required</span>
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBedForAdmission(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  Confirm IPD Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: INPATIENT DETAILS & DISCHARGE MODAL (WHEN OCCUPIED BED CLICKED)
         ========================================================================= */}
      {selectedBedForDetails && selectedBedForDetails.patient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setSelectedBedForDetails(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-sm font-bold flex items-center gap-2">
                  <Bed className="w-4 h-4 text-sky-400" />
                  <span>Bed {selectedBedForDetails.bedNumber} — Inpatient Record</span>
                </div>
                <p className="text-xs text-slate-300">
                  Ward: {selectedBedForDetails.ward} · Status: OCCUPIED
                </p>
              </div>
              <button
                onClick={() => setSelectedBedForDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedBedForDetails.patient.name}
                  </span>
                  <span className="font-mono text-slate-500 font-semibold">
                    {selectedBedForDetails.patient.ageGender}
                  </span>
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  UHID: {selectedBedForDetails.patient.uhid}
                </div>
                <div className="text-slate-800 pt-1">
                  <span className="font-semibold text-slate-900">Diagnosis:</span>{' '}
                  {selectedBedForDetails.patient.diagnosis}
                </div>
                <div className="text-slate-600 flex justify-between pt-1 text-[11px]">
                  <span>Attending: {selectedBedForDetails.patient.doctor}</span>
                  <span className="font-mono text-slate-400">
                    Admitted: {selectedBedForDetails.patient.admissionDate}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-400 text-[11px] block">Oxygen Piped</span>
                  <span className="font-bold text-slate-800">
                    {selectedBedForDetails.oxygenSupport ? 'Connected' : 'Room Air'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-400 text-[11px] block">Alert Status</span>
                  <span className="font-bold text-rose-700">
                    {selectedBedForDetails.patient.alertStatus || 'STABLE'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenEmr(selectedBedForDetails.patient!.uhid);
                    setSelectedBedForDetails(null);
                  }}
                  className="flex-1 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold transition-colors"
                >
                  Open EMR Station →
                </button>
                <button
                  type="button"
                  onClick={() => handleDischargePatient(selectedBedForDetails.bedId)}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Discharge & Clear Bed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: MAINTENANCE / TERMINAL DISINFECTION RELEASE MODAL
         ========================================================================= */}
      {selectedBedForMaintenance && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setSelectedBedForMaintenance(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Bed {selectedBedForMaintenance.bedNumber} Disinfection
              </h3>
              <p className="text-xs text-slate-500">
                NABH Infection Control Protocol HIC 3.4
              </p>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mattress & bed frame wiped with 0.5% Sodium Hypochlorite</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Autoclaved linen and sanitized pillows replaced</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Central oxygen flow meter & suction bottle sterilized</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedBedForMaintenance(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCompleteDisinfection(selectedBedForMaintenance.bedId)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Mark Cleaned & Available
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
