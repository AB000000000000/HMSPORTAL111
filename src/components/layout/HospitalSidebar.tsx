import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BedDouble,
  Stethoscope,
  Pill,
  Microscope,
  CreditCard,
  CalendarCheck,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  X,
  HeartPulse,
  PhoneCall,
  Activity,
} from 'lucide-react';
import { ModuleId, NavigationModule, HospitalBranch } from '../../types/hms';
import { NAV_MODULES } from '../../data/mockHmsData';

interface HospitalSidebarProps {
  activeModule: ModuleId;
  activeSubItem?: string;
  onSelectModule: (moduleId: ModuleId, subItemId?: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activeBranch: HospitalBranch;
}

// Map module IDs to Lucide icons
const MODULE_ICONS: Record<ModuleId, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  'opd-queue': Users,
  'ipd-wards': BedDouble,
  'emr-station': Stethoscope,
  pharmacy: Pill,
  diagnostics: Microscope,
  billing: CreditCard,
  'hr-roster': CalendarCheck,
  'compliance-audits': ShieldCheck,
};

export const HospitalSidebar: React.FC<HospitalSidebarProps> = ({
  activeModule,
  activeSubItem,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  activeBranch,
}) => {
  // Track open/collapsed state of module sub-items in the sidebar
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    dashboard: true,
    'opd-queue': true,
    'ipd-wards': true,
    'emr-station': true,
  });

  const toggleSubItems = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div className="truncate">
              <div className="text-sm font-black tracking-tight text-slate-900 leading-none flex items-center gap-1.5">
                <span>AURA HEALTH</span>
                <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-100">
                  HMS
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">
                NABH 5th Ed · Enterprise
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Module Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {!isCollapsed && (
          <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Clinical & Admin Modules
          </div>
        )}

        {NAV_MODULES.map((module) => {
          const Icon = MODULE_ICONS[module.id] || Activity;
          const isActive = activeModule === module.id;
          const isExpanded = !!expandedModules[module.id];
          const hasSubItems = module.subItems && module.subItems.length > 0;

          return (
            <div key={module.id} className="group/item">
              {/* Primary Module Button */}
              <div
                onClick={() => onSelectModule(module.id)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors relative ${
                  isActive
                    ? 'bg-sky-50 text-sky-900 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
                title={isCollapsed ? `${module.label}: ${module.description}` : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-sky-600 rounded-r-md" />
                )}

                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-sky-600' : 'text-slate-500 group-hover/item:text-slate-800'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="text-xs truncate">{module.label}</span>
                  )}
                </div>

                {/* Right controls: Badge & Collapsible Chevron */}
                {!isCollapsed && (
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {module.badgeCount !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold ${
                          module.badgeVariant === 'urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : module.badgeVariant === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {module.badgeCount}
                      </span>
                    )}

                    {hasSubItems && (
                      <button
                        onClick={(e) => toggleSubItems(module.id, e)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-colors"
                        title={isExpanded ? 'Collapse sub-items' : 'Expand sub-items'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Sub-navigation Items (when expanded and not collapsed) */}
              {!isCollapsed && hasSubItems && isExpanded && (
                <div className="ml-7 mt-0.5 pl-2 border-l border-slate-200 space-y-0.5">
                  {module.subItems.map((sub) => {
                    const isSubActive =
                      isActive && (!activeSubItem || activeSubItem === sub.id);
                    return (
                      <button
                        key={sub.id}
                        onClick={() => onSelectModule(module.id, sub.id)}
                        className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] truncate transition-colors flex items-center justify-between ${
                          isSubActive
                            ? 'text-sky-700 font-semibold bg-sky-50/60'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{sub.label}</span>
                        {sub.badgeCount && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sub.badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info & Collapse Toggle */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Active Facility</span>
              <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                {activeBranch.city}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1 text-rose-700">
                <PhoneCall className="w-3 h-3" />
                <span>Ext. 4000</span>
              </span>
              <span className="text-emerald-700 font-medium">HFR Active</span>
            </div>

            <button
              onClick={onToggleCollapse}
              className="w-full mt-2 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
              title="Collapse sidebar rail"
            >
              <PanelLeftClose className="w-3.5 h-3.5 text-slate-500" />
              <span>Collapse Sidebar</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
              title="Expand sidebar"
            >
              <PanelLeft className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer Backdrop and Offcanvas */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 h-full bg-white shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
