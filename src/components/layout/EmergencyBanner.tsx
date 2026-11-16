import React from 'react';
import { AlertTriangle, Siren, PhoneCall, Check, X } from 'lucide-react';
import { CodeBlueAlert } from '../../types/hms';

interface EmergencyBannerProps {
  alert: CodeBlueAlert;
  onDismiss: () => void;
  onDispatchTeam: () => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  alert,
  onDismiss,
  onDispatchTeam,
}) => {
  if (!alert.active) return null;

  return (
    <aside
      aria-label="Code Blue Emergency Broadcast"
      className="bg-rose-600 text-white px-4 py-2.5 shadow-md border-b border-rose-700 animate-in slide-in-from-top duration-200"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-700/80 flex items-center justify-center shrink-0 animate-pulse border border-rose-400">
            <Siren className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold tracking-wide flex items-center gap-2">
              <span className="bg-white text-rose-700 text-[11px] font-black px-1.5 py-0.5 rounded uppercase">
                CODE BLUE RESUSCITATION
              </span>
              <span>Location: {alert.location}</span>
            </div>
            <div className="text-rose-100 text-xs flex items-center gap-2 mt-0.5">
              <span>Triggered at {alert.triggeredAt}</span>
              <span aria-hidden="true">·</span>
              <span>By: {alert.triggeredBy}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-medium text-white underline">
                Responders on way: {alert.responderCount}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDispatchTeam}
            className="px-3 py-1.5 bg-white text-rose-700 hover:bg-rose-50 font-bold rounded-md text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Acknowledge & Join Resus ({alert.responderCount})</span>
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 text-rose-200 hover:text-white rounded-md hover:bg-rose-700/60 transition-colors"
            title="Clear alert broadcast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
