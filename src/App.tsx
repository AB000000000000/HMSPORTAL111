import React, { useState, useEffect } from 'react';
import { HospitalSidebar } from './components/layout/HospitalSidebar';
import { HospitalHeader } from './components/layout/HospitalHeader';
import { EmergencyBanner } from './components/layout/EmergencyBanner';
import { VoiceSearchModal } from './components/layout/VoiceSearchModal';
import { AbhaComplianceModal } from './components/layout/AbhaComplianceModal';
import { DashboardModule } from './components/modules/DashboardModule';
import { OpdQueueModule } from './components/modules/OpdQueueModule';
import { IpdWardsModule } from './components/modules/IpdWardsModule';
import { EmrStationModule } from './components/modules/EmrStationModule';
import { PharmacyModule } from './components/modules/PharmacyModule';
import { DiagnosticsModule } from './components/modules/DiagnosticsModule';
import { BillingModule } from './components/modules/BillingModule';
import { HrRosterModule } from './components/modules/HrRosterModule';
import { ComplianceModule } from './components/modules/ComplianceModule';
import {
  Users,
  BedDouble,
  Stethoscope,
  CreditCard,
  Building2,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  Check,
} from 'lucide-react';
import {
  HospitalBranch,
  StaffRole,
  StaffUser,
  ModuleId,
  Patient,
  CodeBlueAlert,
} from './types/hms';
import { HOSPITAL_BRANCHES, STAFF_PROFILES } from './data/mockHmsData';

export default function App() {
  // 1. Branch Management State (Mumbai Central, Varanasi, Bengaluru South, Delhi NCR)
  const [activeBranch, setActiveBranch] = useState<HospitalBranch>(HOSPITAL_BRANCHES[0]);

  // 2. Staff User / Role State
  const [currentRole, setCurrentRole] = useState<StaffRole>('Doctor');
  const currentUser: StaffUser = STAFF_PROFILES[currentRole] || STAFF_PROFILES['Doctor'];

  // 3. Navigation & Module State
  const [activeModule, setActiveModule] = useState<ModuleId>('opd-queue');
  const [activeSubItem, setActiveSubItem] = useState<string | undefined>(undefined);

  // 4. Sidebar Responsive Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 5. Patient Selection State (Synchronized across OPD, EMR, IPD, and Billing)
  const [selectedPatientUhid, setSelectedPatientUhid] = useState<string>('UHID-2026-84920');

  // 6. Global Modals & Emergency State
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isAbhaModalOpen, setIsAbhaModalOpen] = useState(false);
  const [codeBlueAlert, setCodeBlueAlert] = useState<CodeBlueAlert>({
    active: false,
    location: 'Ward 4B, Bed 412 (Cardio Resus)',
    triggeredAt: '08:42 AM',
    triggeredBy: 'Sr. Mary Kurian (Nurse In-Charge)',
    responderCount: 3,
  });

  // Global Keyboard Shortcuts (⌘K or Ctrl+K or '/' to open voice/search modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsVoiceSearchOpen((prev) => !prev);
      }
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setIsVoiceSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for Module and Patient Selection
  const handleSelectModule = (moduleId: ModuleId, subItemId?: string) => {
    setActiveModule(moduleId);
    setActiveSubItem(subItemId);
    setIsMobileSidebarOpen(false);
  };

  const handleOpenEmrForPatient = (uhid: string) => {
    setSelectedPatientUhid(uhid);
    setActiveModule('emr-station');
  };

  const handleSelectPatientFromSearch = (patient: Patient) => {
    setSelectedPatientUhid(patient.uhid);
    setActiveModule('emr-station');
    setIsVoiceSearchOpen(false);
  };

  const handleBranchSelect = (branch: HospitalBranch) => {
    setActiveBranch(branch);
  };

  // Emergency Code Blue Handlers
  const handleTriggerCodeBlue = () => {
    setCodeBlueAlert({
      active: true,
      location: 'Ward 4B, Bed 412 (Cardio Resus)',
      triggeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      triggeredBy: `${currentUser.name} (${currentUser.role})`,
      responderCount: 1,
    });
  };

  const handleDismissCodeBlue = () => {
    setCodeBlueAlert((prev) => ({ ...prev, active: false }));
  };

  const handleDispatchTeam = () => {
    setCodeBlueAlert((prev) => ({
      ...prev,
      responderCount: prev.responderCount + 1,
    }));
  };

  // 4 Primary Clinical & Financial Workflow Shortcuts
  const PRIMARY_MODULES: { id: ModuleId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'opd-queue', label: 'OPD Queue & Triage', icon: Users },
    { id: 'ipd-wards', label: 'IPD Ward Census & Inventory', icon: BedDouble },
    { id: 'emr-station', label: 'EMR & FHIR Station', icon: Stethoscope },
    { id: 'billing', label: 'Financial Billing & TPA', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* Top NABH Code Blue Resuscitation Emergency Banner */}
      <EmergencyBanner
        alert={codeBlueAlert}
        onDismiss={handleDismissCodeBlue}
        onDispatchTeam={handleDispatchTeam}
      />

      {/* Main Layout Shell */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar Navigation */}
        <HospitalSidebar
          activeModule={activeModule}
          activeSubItem={activeSubItem}
          onSelectModule={handleSelectModule}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          activeBranch={activeBranch}
        />

        {/* Content Area & Module Viewport */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          {/* Top Header Bar with Branch Switcher, Global Voice Search & Profile */}
          <HospitalHeader
            activeBranch={activeBranch}
            onBranchChange={handleBranchSelect}
            currentUser={currentUser}
            onRoleChange={(role) => setCurrentRole(role)}
            onOpenVoiceSearch={() => setIsVoiceSearchOpen(true)}
            onOpenAbhaModal={() => setIsAbhaModalOpen(true)}
            onToggleSidebarMobile={() => setIsMobileSidebarOpen(true)}
            onTriggerCodeBlue={handleTriggerCodeBlue}
            onNavigateToModule={handleSelectModule}
          />

          {/* Quick Context & Primary Module Quick-Switch Navigation Bar */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 shrink-0">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              {/* Branch Selector Quick Access & Breadcrumb */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-500">
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  <span className="font-semibold text-slate-800">Branch:</span>
                </div>

                {/* Direct Branch Dropdown Selector */}
                <select
                  value={activeBranch.id}
                  onChange={(e) => {
                    const selected = HOSPITAL_BRANCHES.find((b) => b.id === e.target.value);
                    if (selected) handleBranchSelect(selected);
                  }}
                  className="px-2 py-1 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-900 focus:outline-hidden focus:border-sky-500 cursor-pointer"
                  title="Switch Active Hospital Branch"
                >
                  {HOSPITAL_BRANCHES.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.shortName} ({branch.city}) — {branch.occupiedBeds}/{branch.totalBeds} Beds
                    </option>
                  ))}
                </select>

                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="font-mono text-slate-600 font-medium">HFR: {activeBranch.hfrId}</span>
              </div>

              {/* 4 Primary Workflow Segmented Controls */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 overflow-x-auto">
                {PRIMARY_MODULES.map((mod) => {
                  const Icon = mod.icon;
                  const isActive = activeModule === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleSelectModule(mod.id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span>{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Module Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {/* 1) OPD Queue & Triage */}
            {activeModule === 'opd-queue' && (
              <OpdQueueModule
                currentUser={currentUser}
                onOpenEmrForPatient={handleOpenEmrForPatient}
              />
            )}

            {/* 2) IPD Ward Census & Inventory */}
            {activeModule === 'ipd-wards' && (
              <IpdWardsModule
                activeBranch={activeBranch}
                onOpenEmr={handleOpenEmrForPatient}
              />
            )}

            {/* 3) EMR & FHIR Clinical Station */}
            {activeModule === 'emr-station' && (
              <EmrStationModule
                currentUser={currentUser}
                selectedPatientUhid={selectedPatientUhid}
              />
            )}

            {/* 4) Financial Billing & TPA Claims */}
            {activeModule === 'billing' && (
              <BillingModule currentUser={currentUser} />
            )}

            {/* Executive Dashboard */}
            {activeModule === 'dashboard' && (
              <DashboardModule
                activeBranch={activeBranch}
                currentUser={currentUser}
                onNavigate={handleSelectModule}
                onTriggerCodeBlue={handleTriggerCodeBlue}
              />
            )}

            {/* Pharmacy FEFO Dispensing */}
            {activeModule === 'pharmacy' && (
              <PharmacyModule currentUser={currentUser} />
            )}

            {/* Diagnostics LIS / RIS */}
            {activeModule === 'diagnostics' && (
              <DiagnosticsModule
                currentUser={currentUser}
                onOpenPatientEmr={handleOpenEmrForPatient}
              />
            )}

            {/* HR Duty Roster */}
            {activeModule === 'hr-roster' && (
              <HrRosterModule currentUser={currentUser} />
            )}

            {/* NABH & ABDM Compliance Audits */}
            {activeModule === 'compliance-audits' && (
              <ComplianceModule currentUser={currentUser} />
            )}
          </main>
        </div>
      </div>

      {/* Global Voice and Patient Search Modal (Triggered via ⌘K or Microphone) */}
      <VoiceSearchModal
        isOpen={isVoiceSearchOpen}
        onClose={() => setIsVoiceSearchOpen(false)}
        onSelectModule={handleSelectModule}
        onSelectPatient={handleSelectPatientFromSearch}
      />

      {/* ABHA Facility ID & ABDM Compliance Modal */}
      <AbhaComplianceModal
        isOpen={isAbhaModalOpen}
        onClose={() => setIsAbhaModalOpen(false)}
        activeBranch={activeBranch}
      />
    </div>
  );
}
