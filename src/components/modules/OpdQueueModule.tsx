import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Volume2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  PhoneCall,
  UserCheck,
  QrCode,
  Mic,
  MicOff,
  User,
  Phone,
  Sparkles,
  Printer,
  X,
  Play,
  RotateCcw,
  Check,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { OpdToken, StaffUser, TriagePriority, OpdQueueStatus } from '../../types/hms';
import { OPD_TOKENS_LIST } from '../../data/mockHmsData';

interface OpdQueueModuleProps {
  currentUser: StaffUser;
  onOpenEmrForPatient: (uhid: string) => void;
}

// Predefined ABDM ABHA demo QR cards for instant 1-click autofill testing
const SAMPLE_ABHA_CARDS = [
  {
    name: 'Rahul Sharma',
    age: 34,
    gender: 'Male' as const,
    mobile: '9833299401',
    abhaId: '91-4412-9901-5678',
    department: 'General Medicine',
    priority: 'Urgent' as TriagePriority,
  },
  {
    name: 'Ananya Rao',
    age: 5,
    gender: 'Female' as const,
    mobile: '9920048192',
    abhaId: '91-7712-4019-8921',
    department: 'Pediatrics',
    priority: 'Normal' as TriagePriority,
  },
  {
    name: 'Vikramaditya Sen',
    age: 58,
    gender: 'Male' as const,
    mobile: '9820144921',
    abhaId: '91-8291-3019-1234',
    department: 'Cardiology',
    priority: 'Emergency' as TriagePriority,
  },
];

const DEPARTMENT_DOCTORS: Record<string, { doctor: string; chamber: string }> = {
  'General Medicine': { doctor: 'Dr. Sanjay Nambiar, MD', chamber: 'Chamber 104' },
  Cardiology: { doctor: 'Dr. Sunita Deshmukh, MD', chamber: 'Chamber 101' },
  Pediatrics: { doctor: 'Dr. Ramesh Joshi, MD (Ped)', chamber: 'Chamber 302' },
  Orthopaedics: { doctor: 'Dr. Vikram Malhotra, MS', chamber: 'Chamber 114' },
};

export const OpdQueueModule: React.FC<OpdQueueModuleProps> = ({
  currentUser,
  onOpenEmrForPatient,
}) => {
  // Queue state
  const [tokens, setTokens] = useState<OpdToken[]>(OPD_TOKENS_LIST);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Live PA announcement banner state
  const [announcedToken, setAnnouncedToken] = useState<OpdToken | null>(null);

  // Quick Registration Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    mobile: '',
    abhaId: '',
    isAbhaVerified: false,
    department: 'General Medicine',
    doctorAssigned: DEPARTMENT_DOCTORS['General Medicine'].doctor,
    chamber: DEPARTMENT_DOCTORS['General Medicine'].chamber,
    priority: 'Normal' as TriagePriority,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [issuedReceiptToken, setIssuedReceiptToken] = useState<OpdToken | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // Voice Search & Action Banner state
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Play pleasant hospital announcement dual-tone chime
  const playHospitalChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';

      // Standard hospital attention chime (D5 then A5)
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);

      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch (e) {
      // Audio context not available or muted
    }
  };

  // Web Speech API initialization for voice banner
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsVoiceListening(true);
        setVoiceFeedback(null);
      };

      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          text += event.results[i][0].transcript;
        }
        setVoiceTranscript(text);
        processVoiceCommand(text);
      };

      recognition.onerror = (err: any) => {
        console.warn('Voice recognition error:', err);
        setIsVoiceListening(false);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
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
  }, [tokens]);

  const toggleVoiceListening = () => {
    if (isVoiceListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setIsVoiceListening(false);
    } else {
      setVoiceTranscript('');
      setVoiceFeedback(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          simulateSpeechCommand('Check-in Rahul Sharma for General Medicine');
        }
      } else {
        simulateSpeechCommand('Check-in Rahul Sharma for General Medicine');
      }
    }
  };

  // Simulated speech-to-text runner
  const simulateSpeechCommand = (command: string) => {
    setIsVoiceListening(true);
    setVoiceFeedback(null);
    let curr = '';
    let i = 0;
    const interval = setInterval(() => {
      if (i < command.length) {
        curr += command[i];
        setVoiceTranscript(curr);
        i++;
      } else {
        clearInterval(interval);
        setIsVoiceListening(false);
        processVoiceCommand(command);
      }
    }, 35);
  };

  // Natural language voice action processor
  const processVoiceCommand = (commandText: string) => {
    const lower = commandText.toLowerCase().trim();

    // 1. Voice Check-in command: e.g. "Check-in Rahul Sharma for General Medicine"
    if (lower.includes('check-in') || lower.includes('check in') || lower.includes('register')) {
      // Determine department
      let dept = 'General Medicine';
      if (lower.includes('cardio')) dept = 'Cardiology';
      else if (lower.includes('ped') || lower.includes('child')) dept = 'Pediatrics';
      else if (lower.includes('ortho')) dept = 'Orthopaedics';

      // Extract patient name
      let patientName = 'Rahul Sharma';
      const match = lower.match(/(?:check-in|check in|register)\s+([a-zA-Z\s]+?)\s+(?:for|to|in)/i);
      if (match && match[1]) {
        patientName = match[1]
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }

      // Populate form and execute check-in
      const deptDetails = DEPARTMENT_DOCTORS[dept] || DEPARTMENT_DOCTORS['General Medicine'];
      const prefix = dept === 'Cardiology' ? 'CARD' : dept === 'Pediatrics' ? 'PED' : 'MED';
      const countInDept = tokens.filter((t) => t.department === dept).length + 1;
      const tokenNumber = `${prefix}-${String(100 + countInDept)}`;
      const randomUhid = `UHID-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      const newToken: OpdToken = {
        tokenId: `TOK-${Date.now()}`,
        tokenNumber,
        patientName,
        uhid: randomUhid,
        age: 34,
        gender: 'Male',
        ageGender: '34M',
        mobileNumber: '+91 98332 99401',
        doctorName: deptDetails.doctor,
        department: dept,
        roomNo: deptDetails.chamber,
        triagePriority: 'Urgent',
        triage: 'P2-Emergent',
        status: 'CHECKED_IN',
        waitTimeMin: 15,
        abhaId: '91-4412-9901-5678',
        abhaLinked: true,
        checkedInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setTokens((prev) => [newToken, ...prev]);
      setVoiceFeedback(
        `✓ Voice Action: Checked in "${patientName}" for ${dept} (Token ${tokenNumber})`
      );
      playHospitalChime();
      return;
    }

    // 2. Call next token command: e.g. "Call next token for Cardiology"
    if (lower.includes('call next') || lower.includes('call token')) {
      let deptFilter = selectedDept;
      if (lower.includes('cardio')) deptFilter = 'Cardiology';
      else if (lower.includes('ped')) deptFilter = 'Pediatrics';
      else if (lower.includes('medicine')) deptFilter = 'General Medicine';

      const candidate = tokens.find(
        (t) =>
          t.status === 'CHECKED_IN' &&
          (deptFilter === 'ALL' || t.department.toLowerCase() === deptFilter.toLowerCase())
      );

      if (candidate) {
        handleCallNextToken(candidate);
        setVoiceFeedback(`✓ Calling Token ${candidate.tokenNumber}: ${candidate.patientName}`);
      } else {
        setVoiceFeedback('No waiting patients found in this queue to call.');
      }
      return;
    }

    // 3. Filter department command: e.g. "Show Cardiology queue"
    if (lower.includes('cardio')) {
      setSelectedDept('Cardiology');
      setVoiceFeedback('Switched view to Cardiology Queue.');
    } else if (lower.includes('ped')) {
      setSelectedDept('Pediatrics');
      setVoiceFeedback('Switched view to Pediatrics Queue.');
    } else if (lower.includes('medicine')) {
      setSelectedDept('General Medicine');
      setVoiceFeedback('Switched view to General Medicine Queue.');
    } else if (lower.includes('all')) {
      setSelectedDept('ALL');
      setVoiceFeedback('Showing all OPD departments.');
    }
  };

  // Queue Action: Call Token (Announcement & Chime)
  const handleCallNextToken = (token: OpdToken) => {
    playHospitalChime();
    setAnnouncedToken(token);

    // Set token to IN_PROGRESS
    setTokens((prev) =>
      prev.map((t) => (t.tokenId === token.tokenId ? { ...t, status: 'IN_PROGRESS' } : t))
    );

    // Auto-dismiss the prominent PA broadcast bar after 6 seconds
    setTimeout(() => {
      setAnnouncedToken(null);
    }, 6000);
  };

  // Queue Action: Mark In-Progress
  const handleMarkInProgress = (tokenId: string) => {
    const target = tokens.find((t) => t.tokenId === tokenId);
    if (target) {
      playHospitalChime();
      setAnnouncedToken(target);
      setTimeout(() => setAnnouncedToken(null), 5000);
    }
    setTokens((prev) =>
      prev.map((t) => (t.tokenId === tokenId ? { ...t, status: 'IN_PROGRESS' } : t))
    );
  };

  // Queue Action: Complete Consultation
  const handleCompleteConsultation = (tokenId: string) => {
    setTokens((prev) =>
      prev.map((t) => (t.tokenId === tokenId ? { ...t, status: 'COMPLETED' } : t))
    );
  };

  // Handle department change in registration form
  const handleDepartmentChange = (dept: string) => {
    const details = DEPARTMENT_DOCTORS[dept] || DEPARTMENT_DOCTORS['General Medicine'];
    setFormData((prev) => ({
      ...prev,
      department: dept,
      doctorAssigned: details.doctor,
      chamber: details.chamber,
    }));
  };

  // Handle Registration Form Submit
  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.firstName.trim()) {
      setFormError('Please enter the patient’s first name.');
      return;
    }
    if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
      setFormError('Please enter a valid age.');
      return;
    }
    if (!formData.mobile || formData.mobile.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    const deptPrefix =
      formData.department === 'Cardiology'
        ? 'CARD'
        : formData.department === 'Pediatrics'
        ? 'PED'
        : 'MED';
    const deptCount = tokens.filter((t) => t.department === formData.department).length + 1;
    const tokenNumber = `${deptPrefix}-${String(100 + deptCount)}`;
    const uhid = `UHID-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const newToken: OpdToken = {
      tokenId: `TOK-${Date.now()}`,
      tokenNumber,
      patientName: fullName,
      uhid,
      age: Number(formData.age),
      gender: formData.gender,
      ageGender: `${formData.age}${formData.gender[0]}`,
      mobileNumber: `+91 ${formData.mobile.replace(/\D/g, '').slice(-10)}`,
      doctorName: formData.doctorAssigned,
      department: formData.department,
      roomNo: formData.chamber,
      triagePriority: formData.priority,
      triage:
        formData.priority === 'Emergency'
          ? 'P1-Resus'
          : formData.priority === 'Urgent'
          ? 'P2-Emergent'
          : 'P4-Standard',
      status: 'CHECKED_IN',
      waitTimeMin: 15,
      abhaId: formData.abhaId || undefined,
      abhaLinked: !!formData.isAbhaVerified,
      checkedInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTokens((prev) => [newToken, ...prev]);
    setIssuedReceiptToken(newToken);
    playHospitalChime();

    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      age: '',
      gender: 'Male',
      mobile: '',
      abhaId: '',
      isAbhaVerified: false,
      department: 'General Medicine',
      doctorAssigned: DEPARTMENT_DOCTORS['General Medicine'].doctor,
      chamber: DEPARTMENT_DOCTORS['General Medicine'].chamber,
      priority: 'Normal',
    });
  };

  // Fill sample ABHA QR profile
  const handleApplyAbhaProfile = (card: (typeof SAMPLE_ABHA_CARDS)[0]) => {
    const [first, ...rest] = card.name.split(' ');
    const details =
      DEPARTMENT_DOCTORS[card.department] || DEPARTMENT_DOCTORS['General Medicine'];
    setFormData({
      firstName: first,
      lastName: rest.join(' '),
      age: String(card.age),
      gender: card.gender,
      mobile: card.mobile,
      abhaId: card.abhaId,
      isAbhaVerified: true,
      department: card.department,
      doctorAssigned: details.doctor,
      chamber: details.chamber,
      priority: card.priority,
    });
    setIsQrScannerOpen(false);
  };

  // Filtered Tokens for Queue Table
  const filteredTokens = tokens.filter((t) => {
    const matchesDept = selectedDept === 'ALL' || t.department === selectedDept;
    const matchesSearch =
      t.patientName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.tokenNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.uhid.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.doctorName.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const checkedInCount = tokens.filter((t) => t.status === 'CHECKED_IN').length;
  const inProgressCount = tokens.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = tokens.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>Outpatient Department (OPD) Reception & Check-In Station</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            OPD Waiting Queue & Patient Check-In Dashboard
          </h1>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>NABH Level 3 Usability Standard</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-800">{checkedInCount} Waiting</span>
            <span aria-hidden="true">·</span>
            <span className="text-purple-700 font-semibold">{inProgressCount} In-Progress</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-semibold">{completedCount} Completed</span>
          </div>
        </div>

        {/* Quick PA System indicator */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-mono font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PA System: Online</span>
          </div>
        </div>
      </div>

      {/* 2. Voice Search & Action Banner at the Top */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-md border border-sky-800/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <button
              onClick={toggleVoiceListening}
              className={`p-3 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                isVoiceListening
                  ? 'bg-rose-500 text-white ring-4 ring-rose-400/40 animate-pulse'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
              }`}
              title={isVoiceListening ? 'Stop voice recognition' : 'Activate Voice Speech-to-Text'}
            >
              {isVoiceListening ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  Voice Search & Queue Action Banner
                </span>
                {isVoiceListening && (
                  <span className="text-[10px] bg-rose-500 text-white font-bold px-2 py-0.2 rounded-full uppercase animate-pulse">
                    Listening...
                  </span>
                )}
              </div>
              <div className="text-sm font-semibold text-white mt-0.5">
                {isVoiceListening ? (
                  <span className="italic text-sky-200">
                    "{voiceTranscript || 'Speak your command, e.g. Check-in Rahul Sharma for General Medicine'}"
                  </span>
                ) : (
                  <span>Hands-free speech-to-text input for check-in and queue actions</span>
                )}
              </div>
            </div>
          </div>

          {/* 1-Click Voice Command Simulations */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-slate-300 font-medium">Quick Voice Actions:</span>
            <button
              onClick={() =>
                simulateSpeechCommand('Check-in Rahul Sharma for General Medicine')
              }
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-md text-white transition-colors text-[11px] flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3 text-sky-300" />
              <span>"Check-in Rahul Sharma"</span>
            </button>

            <button
              onClick={() => simulateSpeechCommand('Check-in Ananya Rao for Pediatrics')}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-md text-white transition-colors text-[11px] flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3 text-sky-300" />
              <span>"Check-in Ananya (Pediatrics)"</span>
            </button>

            <button
              onClick={() => simulateSpeechCommand('Call next token')}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-md text-white transition-colors text-[11px] flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3 text-sky-300" />
              <span>"Call Next Token"</span>
            </button>
          </div>
        </div>

        {/* Live Audio Waves Visualization when listening */}
        {isVoiceListening && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-sky-200">
            <div className="flex items-center gap-1 h-3.5">
              <span className="w-1 bg-sky-400 h-2 animate-bounce rounded-full" />
              <span className="w-1 bg-sky-300 h-3.5 animate-bounce delay-75 rounded-full" />
              <span className="w-1 bg-sky-400 h-1.5 animate-bounce delay-150 rounded-full" />
              <span className="w-1 bg-sky-200 h-4 animate-bounce delay-100 rounded-full" />
              <span className="w-1 bg-sky-400 h-2.5 animate-bounce delay-200 rounded-full" />
            </div>
            <span>Say: "Check-in [Name] for [General Medicine / Cardiology / Pediatrics]" or "Call next token"</span>
          </div>
        )}

        {/* Voice Feedback Notification */}
        {voiceFeedback && (
          <div className="mt-3 p-2 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-xs text-emerald-200 flex items-center justify-between">
            <span>{voiceFeedback}</span>
            <button
              onClick={() => setVoiceFeedback(null)}
              className="text-emerald-400 hover:text-white ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 3. Live PA Announcement Banner (when token called) */}
      {announcedToken && (
        <div className="p-4 bg-emerald-600 text-white rounded-xl shadow-lg border border-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-700/90 flex items-center justify-center shrink-0 animate-bounce">
              <Volume2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                PUBLIC ADDRESS AUDIO ANNOUNCEMENT
              </div>
              <div className="text-base font-black">
                Token {announcedToken.tokenNumber}: {announcedToken.patientName} → Please proceed to{' '}
                <span className="underline decoration-white decoration-2">
                  {announcedToken.roomNo} ({announcedToken.doctorName})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={playHospitalChime}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Repeat Chime</span>
            </button>
            <button
              onClick={() => setAnnouncedToken(null)}
              className="p-1.5 text-emerald-100 hover:text-white rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Split-Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT SIDE: Quick Patient Registration Form ================= */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Form Header */}
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600" />
                <span>Quick Patient Registration</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant token issue with ABHA verification
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsQrScannerOpen(true)}
              className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 text-sky-700" />
              <span>Scan ABHA QR</span>
            </button>
          </div>

          {formError && (
            <div className="mx-5 mt-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegisterPatient} className="p-5 space-y-4">
            {/* ABHA Verification Field */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>ABHA ID (Ayushman Bharat Health Account)</span>
                </label>
                {formData.isAbhaVerified ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                    <Check className="w-3 h-3" /> ABDM Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Optional</span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 91-4412-9901-5678 or user@abdm"
                  value={formData.abhaId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      abhaId: e.target.value,
                      isAbhaVerified: e.target.value.length > 5,
                    })
                  }
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setIsQrScannerOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan QR</span>
                </button>
              </div>
            </div>

            {/* Name Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  First Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sharma"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Age (Years) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  required
                  placeholder="e.g. 34"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Gender</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                  {(['Male', 'Female', 'Other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={`py-1 text-xs font-semibold rounded text-center transition-colors ${
                        formData.gender === g
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {g[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Mobile Number <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono font-medium text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="9833299401"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })
                  }
                  className="w-full pl-11 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>

            {/* Department Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Department & Consultant Chamber
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:border-sky-500"
              >
                <option value="General Medicine">General Medicine (Chamber 104 - Dr. Sanjay Nambiar)</option>
                <option value="Cardiology">Cardiology (Chamber 101 - Dr. Sunita Deshmukh)</option>
                <option value="Pediatrics">Pediatrics (Chamber 302 - Dr. Ramesh Joshi)</option>
                <option value="Orthopaedics">Orthopaedics (Chamber 114 - Dr. Vikram Malhotra)</option>
              </select>
            </div>

            {/* Priority Triage Badge Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                NABH Priority Triage Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Normal */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: 'Normal' })}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    formData.priority === 'Normal'
                      ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950">Normal</span>
                    {formData.priority === 'Normal' && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Routine Consult</span>
                </button>

                {/* Urgent */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: 'Urgent' })}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    formData.priority === 'Urgent'
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950">Urgent</span>
                    {formData.priority === 'Urgent' && <Check className="w-3.5 h-3.5 text-amber-700" />}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">High Fever / Pain</span>
                </button>

                {/* Emergency */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: 'Emergency' })}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    formData.priority === 'Emergency'
                      ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-950">Emergency</span>
                    {formData.priority === 'Emergency' && <Check className="w-3.5 h-3.5 text-rose-700" />}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Chest Pain / Resus</span>
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Register & Issue Live Token</span>
              </button>
            </div>
          </form>
        </div>

        {/* ================= RIGHT SIDE: Live Waiting Room Token Queue Table ================= */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Header & Department Tabs */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Live OPD Waiting Room Token Queue</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Organized by Department with NABH priority triaging
              </p>
            </div>

            {/* Top Queue Action: Call Next Token */}
            <button
              onClick={() => {
                const nextWaiting = filteredTokens.find((t) => t.status === 'CHECKED_IN');
                if (nextWaiting) {
                  handleCallNextToken(nextWaiting);
                } else {
                  alert('No patients in CHECKED_IN status in this department view.');
                }
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 shrink-0"
            >
              <Volume2 className="w-4 h-4" />
              <span>Call Next Token</span>
            </button>
          </div>

          {/* Department Tabs & Search Filter */}
          <div className="p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto text-xs">
              {[
                { id: 'ALL', label: 'All Departments' },
                { id: 'General Medicine', label: 'General Medicine' },
                { id: 'Cardiology', label: 'Cardiology' },
                { id: 'Pediatrics', label: 'Pediatrics' },
              ].map((tab) => {
                const count =
                  tab.id === 'ALL'
                    ? tokens.length
                    : tokens.filter((t) => t.department === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedDept(tab.id)}
                    className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-colors ${
                      selectedDept === tab.id
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label} <span className="font-mono text-[11px] text-slate-400">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search token, patient, UHID..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
              />
            </div>
          </div>

          {/* Live Queue Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Token #</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Priority Triage</th>
                  <th className="py-2.5 px-3">Doctor Assigned</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Queue Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No patients in queue for this department view.
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map((token) => (
                    <tr key={token.tokenId} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Token # */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-sm text-sky-950">
                          {token.tokenNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {token.checkedInTime}
                        </div>
                      </td>

                      {/* 2. Patient Name & Demographics */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{token.patientName}</span>
                          {token.abhaLinked && (
                            <span title="ABHA Verified Patient">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{token.uhid}</span>
                          <span>·</span>
                          <span>{token.ageGender}</span>
                          <span>·</span>
                          <span>{token.mobileNumber}</span>
                        </div>
                      </td>

                      {/* 3. Priority Triage Badge (NABH Accessible High-Contrast) */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            token.triagePriority === 'Emergency'
                              ? 'bg-rose-100 text-rose-950 border border-rose-300'
                              : token.triagePriority === 'Urgent'
                              ? 'bg-amber-100 text-amber-950 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                          }`}
                        >
                          {token.triagePriority === 'Emergency' && (
                            <AlertTriangle className="w-3 h-3 text-rose-700 shrink-0" />
                          )}
                          {token.triagePriority === 'Urgent' && (
                            <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                          )}
                          {token.triagePriority === 'Normal' && (
                            <CheckCircle className="w-3 h-3 text-emerald-700 shrink-0" />
                          )}
                          <span>{token.triagePriority}</span>
                        </span>
                      </td>

                      {/* 4. Doctor Assigned & Chamber */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{token.doctorName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span>{token.department}</span>
                          <span>·</span>
                          <span className="font-medium text-sky-800">{token.roomNo}</span>
                        </div>
                      </td>

                      {/* 5. Status Badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            token.status === 'IN_PROGRESS'
                              ? 'bg-purple-100 text-purple-950 border border-purple-300 animate-pulse'
                              : token.status === 'CHECKED_IN'
                              ? 'bg-blue-100 text-blue-950 border border-blue-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          {token.status === 'CHECKED_IN' && 'CHECKED_IN'}
                          {token.status === 'IN_PROGRESS' && 'IN_PROGRESS'}
                          {token.status === 'COMPLETED' && 'COMPLETED'}
                        </span>
                      </td>

                      {/* 6. Action Buttons for Queue Management */}
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {token.status === 'CHECKED_IN' && (
                          <>
                            <button
                              onClick={() => handleCallNextToken(token)}
                              className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors shadow-2xs"
                              title="Ring chime and broadcast token"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>Call</span>
                            </button>
                            <button
                              onClick={() => handleMarkInProgress(token.tokenId)}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors shadow-2xs"
                            >
                              <Play className="w-3 h-3" />
                              <span>Mark In-Progress</span>
                            </button>
                          </>
                        )}

                        {token.status === 'IN_PROGRESS' && (
                          <>
                            <button
                              onClick={() => handleCompleteConsultation(token.tokenId)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors shadow-2xs"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Complete Consultation</span>
                            </button>
                            <button
                              onClick={() => onOpenEmrForPatient(token.uhid)}
                              className="px-1.5 py-1 text-sky-700 hover:underline text-xs font-semibold"
                            >
                              EMR →
                            </button>
                          </>
                        )}

                        {token.status === 'COMPLETED' && (
                          <div className="inline-flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-medium">✓ Finished</span>
                            <button
                              onClick={() => onOpenEmrForPatient(token.uhid)}
                              className="px-1.5 py-1 text-slate-600 hover:text-sky-700 text-xs font-semibold"
                            >
                              View EMR
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. ABHA QR Scanner Modal */}
      {isQrScannerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setIsQrScannerOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold">ABHA Patient QR Code Scanner</h3>
              </div>
              <button
                onClick={() => setIsQrScannerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="w-40 h-40 mx-auto bg-white border-2 border-dashed border-sky-400 rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  <QrCode className="w-20 h-20 text-slate-800" />
                  <span className="text-[11px] font-bold text-sky-800 mt-2">Scan or select below</span>
                  {/* Animated scanner laser bar */}
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-rose-500 shadow-md animate-pulse" />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Scan patient's Ayushman Bharat Health Account (ABHA) QR Card
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                  Or Auto-Fill with Verified Test Profiles:
                </span>
                <div className="space-y-2">
                  {SAMPLE_ABHA_CARDS.map((card) => (
                    <button
                      key={card.abhaId}
                      onClick={() => handleApplyAbhaProfile(card)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50/60 text-left transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{card.name}</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            ({card.age}y / {card.gender[0]})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          ABHA: {card.abhaId} · Mob: +91 {card.mobile}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-sky-700 group-hover:translate-x-0.5 transition-transform">
                        Select →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Token Generated Receipt Modal / Dialog */}
      {issuedReceiptToken && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setIssuedReceiptToken(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center border-b border-slate-200 pb-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">OPD Token Issued</h3>
              <p className="text-xs text-slate-500">Patient checked in successfully</p>
            </div>

            {/* Token Card */}
            <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl text-center space-y-1">
              <span className="text-xs text-sky-800 font-semibold uppercase">Token Number</span>
              <div className="text-3xl font-black font-mono text-sky-950">
                {issuedReceiptToken.tokenNumber}
              </div>
              <div className="text-xs font-semibold text-slate-800 pt-1">
                {issuedReceiptToken.patientName}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {issuedReceiptToken.uhid} · {issuedReceiptToken.ageGender}
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Department:</span>
                <span className="font-semibold text-slate-900">{issuedReceiptToken.department}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Consultant:</span>
                <span className="font-semibold text-slate-900">{issuedReceiptToken.doctorName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Chamber:</span>
                <span className="font-bold text-sky-800">{issuedReceiptToken.roomNo}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Triage Priority:</span>
                <span className="font-bold text-slate-900">{issuedReceiptToken.triagePriority}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Wait:</span>
                <span className="font-mono text-slate-800">{issuedReceiptToken.waitTimeMin} mins</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                onClick={() => setIssuedReceiptToken(null)}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
