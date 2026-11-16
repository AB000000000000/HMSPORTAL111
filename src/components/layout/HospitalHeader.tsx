import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  ChevronDown,
  Mic,
  Search,
  ShieldCheck,
  Bell,
  Siren,
  Menu,
  Check,
  User,
  ArrowRight,
  LogOut,
  Stethoscope,
  Clock,
  Sparkles,
} from 'lucide-react';
import { HospitalBranch, StaffRole, StaffUser, ModuleId } from '../../types/hms';
import { HOSPITAL_BRANCHES, STAFF_PROFILES } from '../../data/mockHmsData';

interface HospitalHeaderProps {
  activeBranch: HospitalBranch;
  onBranchChange: (branch: HospitalBranch) => void;
  currentUser: StaffUser;
  onRoleChange: (role: StaffRole) => void;
  onOpenVoiceSearch: () => void;
  onOpenAbhaModal: () => void;
  onToggleSidebarMobile: () => void;
  onTriggerCodeBlue: () => void;
  onNavigateToModule: (moduleId: ModuleId) => void;
}

export const HospitalHeader: React.FC<HospitalHeaderProps> = ({
  activeBranch,
  onBranchChange,
  currentUser,
  onRoleChange,
  onOpenVoiceSearch,
  onOpenAbhaModal,
  onToggleSidebarMobile,
  onTriggerCodeBlue,
  onNavigateToModule,
}) => {
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const branchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rolesList: StaffRole[] = ['Doctor', 'Receptionist', 'Pharmacist', 'Admin'];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
      <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 md:gap-4">
        {/* Left Section: Mobile Menu Toggle & Branch Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile hamburger menu */}
          <button
            onClick={onToggleSidebarMobile}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Branch Switcher Dropdown */}
          <div className="relative" ref={branchRef}>
            <button
              onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-left transition-colors focus-visible:ring-2 focus-visible:ring-sky-500"
              aria-expanded={isBranchDropdownOpen}
              title="Switch Hospital Branch"
            >
              <div className="w-7 h-7 rounded-md bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                  <span className="truncate max-w-[140px] md:max-w-[190px]">
                    {activeBranch.shortName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-normal">
                    ({activeBranch.city})
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 leading-tight flex items-center gap-1.5 font-mono">
                  <span>{activeBranch.occupiedBeds}/{activeBranch.totalBeds} Beds</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-semibold">
                    {Math.round((activeBranch.occupiedBeds / activeBranch.totalBeds) * 100)}% Occ
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                  isBranchDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Branch Switcher Menu */}
            {isBranchDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Hospital Branches ({HOSPITAL_BRANCHES.length})
                  </span>
                  <span className="text-[11px] text-sky-700 font-medium">ABHA Linked</span>
                </div>

                <div className="py-1 max-h-72 overflow-y-auto">
                  {HOSPITAL_BRANCHES.map((branch) => {
                    const isCurrent = branch.id === activeBranch.id;
                    const occRate = Math.round((branch.occupiedBeds / branch.totalBeds) * 100);
                    return (
                      <button
                        key={branch.id}
                        onClick={() => {
                          onBranchChange(branch);
                          setIsBranchDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 text-left flex items-start justify-between transition-colors ${
                          isCurrent
                            ? 'bg-sky-50/80 text-sky-950'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>{branch.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-sky-600 text-white font-medium px-1.5 py-0.2 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 space-x-1.5 font-mono">
                            <span>HFR: {branch.hfrId}</span>
                            <span>·</span>
                            <span>{branch.occupiedBeds}/{branch.totalBeds} Beds ({occRate}%)</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {branch.nabhLevel}
                          </div>
                        </div>

                        {isCurrent && (
                          <Check className="w-4 h-4 text-sky-600 shrink-0 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="px-3 pt-2 pb-1 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Central Cloud HMS Sync</span>
                  <span className="text-emerald-700 font-medium">99.98% SLA</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Section: Global Voice Search Bar */}
        <div className="flex-1 max-w-xl mx-2">
          <div
            onClick={onOpenVoiceSearch}
            className="group relative flex items-center w-full px-3 py-2 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 hover:border-sky-300 rounded-lg cursor-pointer transition-all"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenVoiceSearch();
              }
            }}
            title="Global Voice and Patient Search (Cmd+K)"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0 mr-2.5 transition-colors" />
            <div className="flex-1 text-xs text-slate-400 group-hover:text-slate-600 truncate select-none">
              <span className="hidden md:inline">Voice navigation or patient lookup (e.g. "OPD Queue", "UHID 84920")...</span>
              <span className="md:hidden">Voice / Patient Search...</span>
            </div>

            {/* Voice microphone trigger icon */}
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <div
                className="p-1 rounded-md bg-white border border-slate-200 text-sky-700 hover:bg-sky-50 shadow-2xs transition-colors flex items-center gap-1"
                title="Speak voice command"
              >
                <Mic className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                <span className="text-[10px] font-semibold hidden sm:inline text-sky-800">
                  Voice
                </span>
              </div>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Section: ABHA Compliance Badge, Emergency Code Blue, Notifications & Staff Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* ABHA Facility ID Compliance Badge */}
          <button
            onClick={onOpenAbhaModal}
            className="hidden md:flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 rounded-lg text-left transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Ayushman Bharat Digital Mission (ABDM) Facility ID & M3 Compliance"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <div className="text-[11px] font-bold leading-none flex items-center gap-1">
                <span className="text-emerald-950 font-mono">
                  ABHA ID: {activeBranch.abhaFacilityId.split('-')[0]}-{activeBranch.abhaFacilityId.split('-')[1]}...
                </span>
              </div>
              <div className="text-[10px] text-emerald-700 leading-tight mt-0.5">
                M3 ABDM Compliant
              </div>
            </div>
          </button>

          {/* Quick Code Blue Emergency Resuscitation Trigger */}
          <button
            onClick={onTriggerCodeBlue}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
            title="NABH Code Blue Broadcast Drill"
          >
            <Siren className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="hidden xl:inline">Code Blue</span>
          </button>

          {/* Notification Center Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors focus-visible:ring-2 focus-visible:ring-sky-500"
              title="Hospital Alerts & Notifications"
              aria-label="Hospital notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white" />
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Clinical & Station Alerts
                  </span>
                  <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                    3 High Priority
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  <div
                    onClick={() => {
                      onNavigateToModule('diagnostics');
                      setIsNotificationOpen(false);
                    }}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-rose-700">
                      <span>PANIC LAB VALUE</span>
                      <span className="text-[10px] text-slate-400 font-mono">10m ago</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium mt-1">
                      Troponin-I Critical: 4,820 pg/mL (Rohan Sharma, ICU-102)
                    </p>
                    <span className="text-[11px] text-sky-700 hover:underline mt-1 inline-block">
                      View in Diagnostics →
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      onNavigateToModule('pharmacy');
                      setIsNotificationOpen(false);
                    }}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-amber-700">
                      <span>LOW DRUG INVENTORY</span>
                      <span className="text-[10px] text-slate-400 font-mono">25m ago</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium mt-1">
                      Inj. Meropenem 1g stock dropped to 18 vials (Reorder: 60)
                    </p>
                    <span className="text-[11px] text-sky-700 hover:underline mt-1 inline-block">
                      View in Pharmacy →
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      onNavigateToModule('billing');
                      setIsNotificationOpen(false);
                    }}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-sky-700">
                      <span>TPA PRE-AUTH REQUEST</span>
                      <span className="text-[10px] text-slate-400 font-mono">1h ago</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium mt-1">
                      Star Health cashless query for Cath Lab DES procedure
                    </p>
                    <span className="text-[11px] text-sky-700 hover:underline mt-1 inline-block">
                      View in Billing Desk →
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge & Role Switcher */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500"
              aria-expanded={isProfileDropdownOpen}
              title="Staff Profile & Role Switcher"
            >
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-sky-600 to-cyan-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .filter((_, i) => i < 2)
                  .join('')}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                  <span className="truncate max-w-[120px]">{currentUser.name}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 leading-tight truncate max-w-[150px]">
                  {currentUser.department}
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                  isProfileDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile & Role Switcher Dropdown */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{currentUser.title}</div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>HPR ID: {currentUser.hprId}</span>
                    <span className="text-emerald-700 font-semibold">Active Shift</span>
                  </div>
                </div>

                {/* Role Switcher Section */}
                <div className="px-3 py-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
                    Switch Staff Role (Simulate Permissions)
                  </div>
                  <div className="space-y-1">
                    {rolesList.map((role) => {
                      const profile = STAFF_PROFILES[role];
                      const isCurrent = currentUser.role === role;
                      return (
                        <button
                          key={role}
                          onClick={() => {
                            onRoleChange(role);
                            setIsProfileDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-sky-50 text-sky-950 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{role}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                · {profile.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              {profile.department}
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ABHA Badge in mobile dropdown */}
                <div className="px-3 pt-2 border-t border-slate-100 md:hidden">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onOpenAbhaModal();
                    }}
                    className="w-full px-2.5 py-2 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-semibold text-left flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>ABHA Facility Compliance</span>
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1 rounded">
                      M3
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
