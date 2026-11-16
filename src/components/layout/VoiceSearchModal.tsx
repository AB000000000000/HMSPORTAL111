import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Search,
  X,
  Volume2,
  ArrowRight,
  User,
  Bed,
  FileText,
  Activity,
  CornerDownLeft,
} from 'lucide-react';
import { ModuleId, Patient } from '../../types/hms';
import { NAV_MODULES, PATIENTS_DATABASE } from '../../data/mockHmsData';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (moduleId: ModuleId, subItemId?: string) => void;
  onSelectPatient: (patient: Patient) => void;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  onSelectPatient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setSpeechError(null);
    } else {
      stopListening();
    }
  }, [isOpen]);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English standard for Indian hospital system

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setSearchQuery(currentTranscript);
        handleVoiceCommand(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission blocked. You can still type or test sample voice commands below.');
        } else {
          setSpeechError(`Voice recognition: ${event.error}. You can also use simulated commands.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const startListening = () => {
    setSpeechError(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.start();
        } catch (err) {
          // Simulated fallback
          setIsListening(true);
          simulateVoiceRecognition();
        }
      }
    } else {
      // Browser does not support speech recognition natively
      simulateVoiceRecognition();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const simulateVoiceRecognition = () => {
    setIsListening(true);
    setSpeechError(null);
    const demoPhrases = [
      'Show OPD Queue',
      'Find patient Rohan Sharma',
      'Go to IPD Wards bed matrix',
      'Check EMR Station',
      'Open Pharmacy formulary',
      'Check NABH Compliance Audits',
    ];
    const picked = demoPhrases[Math.floor(Math.random() * demoPhrases.length)];
    let current = '';
    let index = 0;
    const interval = setInterval(() => {
      if (index < picked.length) {
        current += picked[index];
        setSearchQuery(current);
        index++;
      } else {
        clearInterval(interval);
        setIsListening(false);
        handleVoiceCommand(picked);
      }
    }, 45);
  };

  const handleVoiceCommand = (command: string) => {
    const text = command.toLowerCase().trim();
    setTranscriptHistory((prev) => [command, ...prev.slice(0, 4)]);

    // Check for direct module match
    if (text.includes('opd') || text.includes('token') || text.includes('outpatient')) {
      onSelectModule('opd-queue');
      onClose();
      return;
    }
    if (text.includes('ipd') || text.includes('ward') || text.includes('bed') || text.includes('census')) {
      onSelectModule('ipd-wards');
      onClose();
      return;
    }
    if (text.includes('emr') || text.includes('record') || text.includes('clinical') || text.includes('soap')) {
      onSelectModule('emr-station');
      onClose();
      return;
    }
    if (text.includes('pharmacy') || text.includes('drug') || text.includes('medicine') || text.includes('stock')) {
      onSelectModule('pharmacy');
      onClose();
      return;
    }
    if (text.includes('diagnostic') || text.includes('lab') || text.includes('pathology') || text.includes('ris') || text.includes('x-ray')) {
      onSelectModule('diagnostics');
      onClose();
      return;
    }
    if (text.includes('billing') || text.includes('tpa') || text.includes('insurance') || text.includes('invoice')) {
      onSelectModule('billing');
      onClose();
      return;
    }
    if (text.includes('roster') || text.includes('shift') || text.includes('doctor schedule') || text.includes('nurse')) {
      onSelectModule('hr-roster');
      onClose();
      return;
    }
    if (text.includes('compliance') || text.includes('nabh') || text.includes('audit') || text.includes('waste')) {
      onSelectModule('compliance-audits');
      onClose();
      return;
    }
    if (text.includes('dashboard') || text.includes('home') || text.includes('overview')) {
      onSelectModule('dashboard');
      onClose();
      return;
    }

    // Check for patient match
    const foundPatient = PATIENTS_DATABASE.find(
      (p) =>
        text.includes(p.name.toLowerCase()) ||
        text.includes(p.uhid.toLowerCase()) ||
        text.includes(p.uhid.replace('uhid-2026-', ''))
    );
    if (foundPatient) {
      onSelectPatient(foundPatient);
      onSelectModule('emr-station');
      onClose();
    }
  };

  const query = searchQuery.trim().toLowerCase();

  // Filter modules
  const filteredModules = NAV_MODULES.filter(
    (m) =>
      m.label.toLowerCase().includes(query) ||
      m.description.toLowerCase().includes(query) ||
      m.subItems.some((s) => s.label.toLowerCase().includes(query))
  );

  // Filter patients
  const filteredPatients = PATIENTS_DATABASE.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.uhid.toLowerCase().includes(query) ||
      p.abhaId.toLowerCase().includes(query) ||
      p.department.toLowerCase().includes(query) ||
      p.attendingDoctor.toLowerCase().includes(query)
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header & input */}
        <div className="relative flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (filteredModules.length > 0) {
                  onSelectModule(filteredModules[0].id);
                  onClose();
                } else if (filteredPatients.length > 0) {
                  onSelectPatient(filteredPatients[0]);
                  onSelectModule('emr-station');
                  onClose();
                }
              }
              if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Type or speak: 'OPD Queue', 'Dr. Sunita', 'UHID 84920', 'Bed matrix'..."
            className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden"
          />

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {/* Microphone trigger */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium ${
                isListening
                  ? 'bg-rose-50 text-rose-700 border border-rose-300 animate-pulse'
                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice search'}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-rose-600" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-sky-600" />
                  <span className="hidden sm:inline">Voice</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Listening wave simulation if active */}
        {isListening && (
          <div className="px-4 py-3 bg-sky-50 border-b border-sky-100 flex items-center justify-between text-xs text-sky-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 h-4">
                <span className="w-1 bg-sky-600 h-3 animate-bounce rounded-full" />
                <span className="w-1 bg-sky-600 h-4 animate-bounce delay-75 rounded-full" />
                <span className="w-1 bg-sky-600 h-2 animate-bounce delay-150 rounded-full" />
                <span className="w-1 bg-sky-600 h-5 animate-bounce delay-200 rounded-full" />
                <span className="w-1 bg-sky-600 h-3 animate-bounce delay-100 rounded-full" />
              </div>
              <span className="font-medium">
                Listening for hospital voice navigation command...
              </span>
            </div>
            <button
              onClick={stopListening}
              className="px-2 py-0.5 text-[11px] font-semibold bg-white border border-sky-200 rounded-md text-sky-700 hover:bg-sky-100"
            >
              Done
            </button>
          </div>
        )}

        {speechError && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 flex items-center justify-between">
            <span>{speechError}</span>
            <button
              onClick={simulateVoiceRecognition}
              className="ml-2 font-medium underline text-amber-900 shrink-0"
            >
              Simulate voice
            </button>
          </div>
        )}

        {/* Quick voice command suggestion chips */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs text-slate-500 whitespace-nowrap">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">Try saying:</span>
          {[
            'OPD Queue',
            'Find Rohan Sharma',
            'IPD Wards',
            'EMR Station',
            'Pharmacy formulary',
            'NABH Compliance',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setSearchQuery(prompt);
                handleVoiceCommand(prompt);
              }}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-sky-300 hover:text-sky-700 text-xs transition-colors shrink-0 flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3 text-slate-400" />
              <span>"{prompt}"</span>
            </button>
          ))}
        </div>

        {/* Search Results Container */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 p-2">
          {/* Module matches */}
          {filteredModules.length > 0 && (
            <div className="p-2">
              <div className="text-[11px] font-bold text-slate-400 tracking-wider mb-1.5 uppercase px-2">
                Hospital Modules
              </div>
              <div className="space-y-1">
                {filteredModules.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => {
                      onSelectModule(mod.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-sky-50/80 group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 group-hover:bg-sky-100 group-hover:text-sky-700 flex items-center justify-center transition-colors">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-sky-900 flex items-center gap-2">
                          <span>{mod.label}</span>
                          {mod.badgeCount !== undefined && (
                            <span className="text-[11px] font-mono font-medium text-slate-500">
                              ({mod.badgeCount})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-md">
                          {mod.description}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Patient matches */}
          {filteredPatients.length > 0 && (
            <div className="p-2">
              <div className="text-[11px] font-bold text-slate-400 tracking-wider mb-1.5 uppercase px-2">
                Patient Records (ABHA / UHID Lookup)
              </div>
              <div className="space-y-1">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      onSelectPatient(patient);
                      onSelectModule('emr-station');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-emerald-50/70 group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-950 flex items-center gap-2">
                          <span>{patient.name}</span>
                          <span className="text-xs text-slate-500 font-normal">
                            ({patient.age}y / {patient.gender[0]})
                          </span>
                          <span className="text-xs font-mono font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                            {patient.uhid}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{patient.department}</span>
                          <span aria-hidden="true">·</span>
                          <span>{patient.attendingDoctor}</span>
                          {patient.bedNo && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-slate-700">Bed: {patient.bedNo}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        Open EMR
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredModules.length === 0 && filteredPatients.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">No matching modules or patients found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for "OPD", "Wards", "Pharmacy", "Rohan Sharma", or "UHID-2026-84920"
              </p>
            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">
                Esc
              </kbd>{' '}
              to close
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">
                ↵ Enter
              </kbd>{' '}
              to select
            </span>
          </div>
          <span className="text-[11px] text-slate-400">NABH Usability Compliant Search</span>
        </div>
      </div>
    </div>
  );
};
