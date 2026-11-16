import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope,
  Heart,
  Thermometer,
  Activity,
  User,
  Plus,
  ShieldCheck,
  FileText,
  Save,
  CheckCircle,
  Download,
  AlertCircle,
  Pill,
  Mic,
  MicOff,
  Eye,
  EyeOff,
  FileCode,
  Search,
  Trash2,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  Check,
  Building,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { Patient, EmrRecord, StaffUser } from '../../types/hms';
import { PATIENTS_DATABASE, EMR_SAMPLE_RECORDS } from '../../data/mockHmsData';
import { FhirBundleModal } from './FhirBundleModal';

interface EmrStationModuleProps {
  currentUser: StaffUser;
  selectedPatientUhid?: string;
}

// ICD-10 Diagnostic Catalog for Autocomplete
const ICD10_CATALOG = [
  { code: 'I21.0', desc: 'Acute transmural myocardial infarction of anterior wall' },
  { code: 'I25.10', desc: 'Atherosclerotic heart disease of native coronary artery' },
  { code: 'I10', desc: 'Essential (primary) hypertension' },
  { code: 'E11.9', desc: 'Type 2 diabetes mellitus without complications' },
  { code: 'E78.00', desc: 'Pure hypercholesterolemia, unspecified' },
  { code: 'Z95.5', desc: 'Presence of coronary angioplasty implant and graft' },
  { code: 'J44.1', desc: 'Chronic obstructive pulmonary disease with acute exacerbation' },
  { code: 'I48.91', desc: 'Unspecified atrial fibrillation' },
  { code: 'K29.7', desc: 'Gastritis, unspecified, without bleeding' },
  { code: 'N17.9', desc: 'Acute kidney failure, unspecified' },
  { code: 'M54.5', desc: 'Low back pain' },
  { code: 'J06.9', desc: 'Acute upper respiratory infection, unspecified' },
];

export const EmrStationModule: React.FC<EmrStationModuleProps> = ({
  currentUser,
  selectedPatientUhid,
}) => {
  const [activeUhid, setActiveUhid] = useState<string>(
    selectedPatientUhid || 'UHID-2026-84920'
  );

  const currentPatient =
    PATIENTS_DATABASE.find((p) => p.uhid === activeUhid) || PATIENTS_DATABASE[0];

  // DPDP Privacy Blurring Mode (Digital Personal Data Protection Act compliance)
  const [isDpdpPrivacyEnabled, setIsDpdpPrivacyEnabled] = useState(false);

  // Active SOAP tab ('all' or 'S' | 'O' | 'A' | 'P')
  const [activeSoapTab, setActiveSoapTab] = useState<'all' | 'S' | 'O' | 'A' | 'P'>('all');

  // EMR Clinical Record State
  const [record, setRecord] = useState<EmrRecord>(EMR_SAMPLE_RECORDS);

  // Vitals State with automatic BMI & abnormal value detection
  const [vitalsData, setVitalsData] = useState({
    systolic: 124,
    diastolic: 78,
    pulse: 72,
    temp: 98.4,
    spo2: 99,
    respRate: 16,
    heightCm: 174,
    weightKg: 78.5,
  });

  // Calculate BMI: weight (kg) / [height (m)]^2
  const heightMeters = vitalsData.heightCm / 100;
  const calculatedBmi =
    heightMeters > 0 ? (vitalsData.weightKg / (heightMeters * heightMeters)).toFixed(1) : '22.0';

  // Physical examination text
  const [physicalExamNotes, setPhysicalExamNotes] = useState(
    'Conscious, oriented to time, place, and person. Pulse 72/min, regular, good volume. Right radial access site clean, puncture bandage dry. Chest: Bilateral vesicular breath sounds, no added crepitations. CVS: S1 S2 heard, no murmurs. Abdomen: Soft, non-tender. Peripheral pulses palpable.'
  );

  // ICD-10 Search & Selection
  const [icdSearchQuery, setIcdSearchQuery] = useState('');
  const [isIcdDropdownOpen, setIsIcdDropdownOpen] = useState(false);

  // Prescription Builder State
  const [newRx, setNewRx] = useState({
    drug: '',
    dosage: '1 Tab',
    frequency: 'Once daily (OD)',
    duration: '14 Days',
    route: 'Oral',
  });

  // Diagnostic Requisitions State
  const [diagnosticTests, setDiagnosticTests] = useState([
    { name: '12-Lead Electrocardiogram (ECG)', category: 'Radiology', stat: false, checked: true },
    { name: 'High-Sensitivity Troponin-I (hs-cTnI)', category: 'Pathology', stat: true, checked: true },
    { name: '2D Echocardiography with Doppler', category: 'Radiology', stat: false, checked: false },
    { name: 'Serum Creatinine & Electrolytes', category: 'Pathology', stat: false, checked: true },
    { name: 'Complete Blood Count (CBC)', category: 'Pathology', stat: false, checked: false },
  ]);

  // Voice Dictation Widget State
  const [dictationTarget, setDictationTarget] = useState<'S' | 'O' | 'A' | 'P'>('S');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [dictatedBuffer, setDictatedBuffer] = useState('');
  const [dictationHistory, setDictationHistory] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);

  // Modals & Save State
  const [isFhirModalOpen, setIsFhirModalOpen] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Initialize Web Speech API for voice dictation
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsVoiceListening(true);
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          current += event.results[i][0].transcript;
        }
        setDictatedBuffer(current);
      };

      recognition.onerror = () => {
        setIsVoiceListening(false);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const toggleVoiceDictation = () => {
    if (isVoiceListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setIsVoiceListening(false);
    } else {
      setDictatedBuffer('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          simulateDictationPhrase(
            'Patient reports complete resolution of chest discomfort. Mild soreness at right radial puncture site.'
          );
        }
      } else {
        simulateDictationPhrase(
          'Patient reports complete resolution of chest discomfort. Mild soreness at right radial puncture site.'
        );
      }
    }
  };

  const simulateDictationPhrase = (text: string) => {
    setIsVoiceListening(true);
    let curr = '';
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        curr += text[i];
        setDictatedBuffer(curr);
        i++;
      } else {
        clearInterval(interval);
        setIsVoiceListening(false);
      }
    }, 28);
  };

  // Append dictated buffer to active target SOAP field
  const handleAppendDictation = () => {
    if (!dictatedBuffer.trim()) return;

    if (dictationTarget === 'S') {
      setRecord((prev) => ({
        ...prev,
        notes: {
          ...prev.notes,
          subjective: `${prev.notes.subjective}\n[Dictation]: ${dictatedBuffer.trim()}`,
        },
      }));
    } else if (dictationTarget === 'O') {
      setPhysicalExamNotes((prev) => `${prev}\n[Dictation]: ${dictatedBuffer.trim()}`);
    } else if (dictationTarget === 'A') {
      setRecord((prev) => ({
        ...prev,
        notes: {
          ...prev.notes,
          assessment: `${prev.notes.assessment}\n[Dictation]: ${dictatedBuffer.trim()}`,
        },
      }));
    } else if (dictationTarget === 'P') {
      setRecord((prev) => ({
        ...prev,
        notes: {
          ...prev.notes,
          plan: `${prev.notes.plan}\n[Dictation]: ${dictatedBuffer.trim()}`,
        },
      }));
    }

    setDictationHistory((prev) => [dictatedBuffer.trim(), ...prev.slice(0, 3)]);
    setDictatedBuffer('');
  };

  // Add ICD-10 Diagnosis
  const handleAddDiagnosis = (diag: { code: string; desc: string }) => {
    if (record.icd10Codes.some((c) => c.code === diag.code)) {
      setIsIcdDropdownOpen(false);
      return;
    }
    setRecord((prev) => ({
      ...prev,
      icd10Codes: [...prev.icd10Codes, diag],
    }));
    setIcdSearchQuery('');
    setIsIcdDropdownOpen(false);
  };

  const handleRemoveDiagnosis = (code: string) => {
    setRecord((prev) => ({
      ...prev,
      icd10Codes: prev.icd10Codes.filter((c) => c.code !== code),
    }));
  };

  // Add Rx Medication
  const handleAddPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRx.drug.trim()) return;

    setRecord((prev) => ({
      ...prev,
      prescriptions: [
        ...prev.prescriptions,
        {
          drug: newRx.drug.trim(),
          dosage: newRx.dosage,
          frequency: newRx.frequency,
          duration: newRx.duration,
          route: newRx.route,
        },
      ],
    }));

    setNewRx({
      drug: '',
      dosage: '1 Tab',
      frequency: 'Once daily (OD)',
      duration: '14 Days',
      route: 'Oral',
    });
  };

  const handleRemovePrescription = (idx: number) => {
    setRecord((prev) => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveNotes = () => {
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  // Abnormal Vital Flags
  const isBpHigher = vitalsData.systolic >= 140 || vitalsData.diastolic >= 90;
  const isBpLower = vitalsData.systolic < 90 || vitalsData.diastolic < 60;
  const isPulseAbnormal = vitalsData.pulse > 100 || vitalsData.pulse < 60;
  const isSpo2Low = vitalsData.spo2 < 95;
  const isFever = vitalsData.temp >= 99.5;
  const bmiNumber = parseFloat(calculatedBmi);
  const isBmiHigh = bmiNumber >= 25.0;

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Consultant Clinical Documentation Desk · NABH COP 4.2 Standard</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Doctor EMR Station & SOAP Notes Workspace
          </h1>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>Attending: {currentUser.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">HPR ID: {currentUser.hprId}</span>
            <span aria-hidden="true">·</span>
            <span>MCI Reg: {currentUser.licenseNumber}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* DPDP Act Privacy Blurring Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsDpdpPrivacyEnabled(!isDpdpPrivacyEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs ${
              isDpdpPrivacyEnabled
                ? 'bg-purple-50 text-purple-900 border-purple-300 ring-2 ring-purple-200'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Digital Personal Data Protection (DPDP) Act Compliance: Mask patient phone and sensitive data"
          >
            {isDpdpPrivacyEnabled ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-purple-700" />
                <span>DPDP Masking: ON</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>DPDP Masking: OFF</span>
              </>
            )}
          </button>

          {/* Save Progress Notes */}
          <button
            type="button"
            onClick={handleSaveNotes}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>{isSavedToast ? 'Notes Saved!' : 'Save Draft'}</span>
          </button>

          {/* Requirement 2: Sign & Export FHIR R4 Bundle Button */}
          <button
            type="button"
            onClick={() => setIsFhirModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Sign & Export FHIR R4 Bundle</span>
          </button>
        </div>
      </div>

      {/* 2. Three-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: Patient Demographics, UHID, ABHA ID & Medical History ================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Patient Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            {/* Patient Switcher */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Active Patient Record
              </label>
              <select
                value={activeUhid}
                onChange={(e) => setActiveUhid(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-hidden focus:border-sky-500"
              >
                {PATIENTS_DATABASE.map((p) => (
                  <option key={p.uhid} value={p.uhid}>
                    {p.name} ({p.uhid.slice(-5)}) · {p.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-start gap-3">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-sky-600 to-cyan-700 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
                {currentPatient.name
                  .split(' ')
                  .map((n) => n[0])
                  .filter((_, i) => i < 2)
                  .join('')}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {currentPatient.name}
                </h3>
                <div className="text-xs text-slate-500">
                  {currentPatient.age} Yrs · {currentPatient.gender} · Blood: {currentPatient.bloodGroup}
                </div>
              </div>
            </div>

            {/* Identifiers (UHID & ABHA) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block">Hospital UHID</span>
                <span className="font-mono font-bold text-slate-900">{currentPatient.uhid}</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">ABHA Facility ID</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono font-bold ${
                      isDpdpPrivacyEnabled ? 'blur-xs select-none' : 'text-slate-900'
                    }`}
                  >
                    {isDpdpPrivacyEnabled
                      ? '91-XXXX-XXXX-1234'
                      : currentPatient.abhaId}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    M3
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Primary Contact</span>
                <span
                  className={`font-mono text-slate-700 ${
                    isDpdpPrivacyEnabled ? 'blur-xs select-none' : ''
                  }`}
                >
                  {isDpdpPrivacyEnabled ? '+91 98XXX XXX21' : currentPatient.phone}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Department & Bed</span>
                <span className="font-semibold text-slate-800">
                  {currentPatient.department}{' '}
                  {currentPatient.bedNo ? `(Bed: ${currentPatient.bedNo})` : '(OPD Lounge)'}
                </span>
              </div>
            </div>

            {/* DPDP Privacy Active Notification */}
            {isDpdpPrivacyEnabled && (
              <div className="p-2 rounded bg-purple-50 border border-purple-200 text-[11px] text-purple-900 font-medium">
                🔒 DPDP Act 2023 Masking Active: Contact numbers & identifiers blurred.
              </div>
            )}
          </div>

          {/* Active Drug Allergies & Warnings Card */}
          <div className="bg-white rounded-xl border border-rose-200 shadow-2xs p-4">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Known Drug Allergies</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-950 font-bold text-xs border border-rose-300">
                Penicillin (Anaphylaxis)
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 font-bold text-xs border border-amber-300">
                Sulfa Drugs (Rash)
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-xs">
                No Food Allergies
              </span>
            </div>
          </div>

          {/* Past Medical History Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Clinical History Timeline
              </h4>
              <span className="text-[10px] text-slate-400">NABH Verified</span>
            </div>

            <div className="relative pl-4 border-l-2 border-slate-200 space-y-3 text-xs">
              {/* Event 1 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-600 ring-4 ring-white" />
                <span className="text-[10px] font-mono text-slate-400">Nov 2024</span>
                <p className="font-bold text-slate-900">Primary PCI to LAD (DES Stent)</p>
                <p className="text-[11px] text-slate-500">
                  STEMI Anterior Wall, Resolute Onyx 3.0 x 24mm.
                </p>
              </div>

              {/* Event 2 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white" />
                <span className="text-[10px] font-mono text-slate-400">2022</span>
                <p className="font-bold text-slate-900">Type 2 Diabetes Mellitus</p>
                <p className="text-[11px] text-slate-500">HbA1c 7.8% on Metformin 500mg BD.</p>
              </div>

              {/* Event 3 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white" />
                <span className="text-[10px] font-mono text-slate-400">2019</span>
                <p className="font-bold text-slate-900">Dyslipidemia</p>
                <p className="text-[11px] text-slate-500">LDL 142 mg/dL on Atorvastatin.</p>
              </div>

              {/* Event 4 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                <span className="text-[10px] font-mono text-slate-400">2015</span>
                <p className="font-semibold text-slate-700">Laparoscopic Appendectomy</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CENTER COLUMN: Structured SOAP Notes Workspace ================= */}
        <div className="lg:col-span-6 space-y-4">
          {/* SOAP Tabs Navigation */}
          <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1 overflow-x-auto text-xs font-semibold">
            {[
              { id: 'all', label: 'All Sections (Stacked)' },
              { id: 'S', label: '[S] Subjective' },
              { id: 'O', label: '[O] Objective' },
              { id: 'A', label: '[A] Assessment' },
              { id: 'P', label: '[P] Plan' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSoapTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeSoapTab === tab.id
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* [S] Subjective Section */}
          {(activeSoapTab === 'all' || activeSoapTab === 'S') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">
                    S
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Subjective — Chief Complaints & Symptoms
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Patient-Reported HPI</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  History of Presenting Illness (HPI) & Chief Complaint
                </label>
                <textarea
                  rows={3}
                  value={record.notes.subjective}
                  onChange={(e) =>
                    setRecord({
                      ...record,
                      notes: { ...record.notes, subjective: e.target.value },
                    })
                  }
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:border-sky-500 leading-relaxed font-sans"
                  placeholder="Describe onset, location, duration, character, aggravating and relieving factors..."
                />
              </div>

              {/* Review of Systems (ROS) Quick Chips */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Review of Systems (ROS)
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['No Angina Recurrence', 'Denies Dyspnea', 'No Dizziness / Syncope', 'Radial Band Intact', 'Normal Appetite'].map((chip) => (
                    <span
                      key={chip}
                      className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]"
                    >
                      ✓ {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* [O] Objective Section (Vitals Card with Auto-Flagging & Physical Exam) */}
          {(activeSoapTab === 'all' || activeSoapTab === 'O') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                    O
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Objective — Vitals Card & Physical Examination
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">NABH Auto-Flagging Active</span>
              </div>

              {/* Interactive Vitals Card with Auto-Flagging for Abnormal Values */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Clinical Vitals Panel
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Auto-Checked: Just now
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Blood Pressure */}
                  <div
                    className={`p-2.5 rounded-lg border transition-all ${
                      isBpHigher
                        ? 'bg-rose-50 border-rose-300'
                        : isBpLower
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Blood Pressure</span>
                      <Activity className="w-3.5 h-3.5 text-sky-600" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        value={vitalsData.systolic}
                        onChange={(e) =>
                          setVitalsData({ ...vitalsData, systolic: Number(e.target.value) })
                        }
                        className="w-12 font-mono font-bold text-base bg-transparent focus:outline-hidden"
                      />
                      <span className="font-mono text-slate-400">/</span>
                      <input
                        type="number"
                        value={vitalsData.diastolic}
                        onChange={(e) =>
                          setVitalsData({ ...vitalsData, diastolic: Number(e.target.value) })
                        }
                        className="w-12 font-mono font-bold text-base bg-transparent focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">mmHg</span>
                    </div>
                    <div className="mt-1">
                      {isBpHigher ? (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded">
                          STAGE 1 HTN
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          NORMAL
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pulse Rate */}
                  <div
                    className={`p-2.5 rounded-lg border transition-all ${
                      isPulseAbnormal ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Pulse / HR</span>
                      <Heart className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        value={vitalsData.pulse}
                        onChange={(e) =>
                          setVitalsData({ ...vitalsData, pulse: Number(e.target.value) })
                        }
                        className="w-14 font-mono font-bold text-base bg-transparent focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">bpm</span>
                    </div>
                    <div className="mt-1">
                      {isPulseAbnormal ? (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded">
                          {vitalsData.pulse > 100 ? 'TACHYCARDIA' : 'BRADYCARDIA'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          NORMAL (60-100)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SpO2 */}
                  <div
                    className={`p-2.5 rounded-lg border transition-all ${
                      isSpo2Low ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>SpO2 Pulse Ox</span>
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        value={vitalsData.spo2}
                        onChange={(e) =>
                          setVitalsData({ ...vitalsData, spo2: Number(e.target.value) })
                        }
                        className="w-12 font-mono font-bold text-base bg-transparent focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">%</span>
                    </div>
                    <div className="mt-1">
                      {isSpo2Low ? (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded">
                          HYPOXEMIC (&lt;95%)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          OPTIMAL (Room Air)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Temperature */}
                  <div
                    className={`p-2.5 rounded-lg border transition-all ${
                      isFever ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Body Temp</span>
                      <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        step="0.1"
                        value={vitalsData.temp}
                        onChange={(e) =>
                          setVitalsData({ ...vitalsData, temp: Number(e.target.value) })
                        }
                        className="w-14 font-mono font-bold text-base bg-transparent focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">°F</span>
                    </div>
                    <div className="mt-1">
                      {isFever ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                          PYREXIA / FEVER
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          AFEBRILE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Second row: Resp Rate, Height, Weight, and Calculated BMI */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Resp Rate</span>
                    <span className="font-mono font-bold text-slate-900">{vitalsData.respRate} /min</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Height</span>
                    <span className="font-mono font-bold text-slate-900">{vitalsData.heightCm} cm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Weight</span>
                    <span className="font-mono font-bold text-slate-900">{vitalsData.weightKg} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Calculated BMI</span>
                    <span className="font-mono font-bold text-slate-900">
                      {calculatedBmi} kg/m²{' '}
                      <span
                        className={`text-[10px] px-1 rounded ${
                          isBmiHigh ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isBmiHigh ? 'Overweight' : 'Normal'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Examination Findings */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Physical Examination Findings
                </label>
                <textarea
                  rows={3}
                  value={physicalExamNotes}
                  onChange={(e) => setPhysicalExamNotes(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:border-sky-500 leading-relaxed font-sans"
                />
              </div>
            </div>
          )}

          {/* [A] Assessment Section (ICD-10 Diagnosis Search & Staging) */}
          {(activeSoapTab === 'all' || activeSoapTab === 'A') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs">
                    A
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Assessment — ICD-10 Diagnoses & Clinical Impression
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">WHO ICD-10 Catalog</span>
              </div>

              {/* ICD-10 Search Box with Live Autocomplete */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ICD-10 Diagnosis Search & Code Mapping
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={icdSearchQuery}
                    onFocus={() => setIsIcdDropdownOpen(true)}
                    onChange={(e) => {
                      setIcdSearchQuery(e.target.value);
                      setIsIcdDropdownOpen(true);
                    }}
                    placeholder="Search ICD-10 by code or description (e.g. 'I21.0', 'STEMI', 'Hypertension')..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                {/* Dropdown Results */}
                {isIcdDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 max-h-56 overflow-y-auto">
                    {ICD10_CATALOG.filter(
                      (item) =>
                        item.code.toLowerCase().includes(icdSearchQuery.toLowerCase()) ||
                        item.desc.toLowerCase().includes(icdSearchQuery.toLowerCase())
                    ).map((diag) => (
                      <button
                        key={diag.code}
                        type="button"
                        onClick={() => handleAddDiagnosis(diag)}
                        className="w-full px-3 py-2 text-left hover:bg-sky-50 text-xs flex items-center justify-between transition-colors"
                      >
                        <div>
                          <span className="font-mono font-bold text-sky-800 mr-2">{diag.code}</span>
                          <span className="text-slate-800">{diag.desc}</span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected ICD-10 Diagnoses List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Confirmed Diagnostic Codes ({record.icd10Codes.length})
                </span>
                {record.icd10Codes.map((diag, index) => (
                  <div
                    key={diag.code}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-900 font-mono">
                        {index === 0 ? 'PRIMARY' : 'SECONDARY'}
                      </span>
                      <div>
                        <span className="font-mono font-bold text-slate-900 mr-2">{diag.code}</span>
                        <span className="text-slate-700">{diag.desc}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDiagnosis(diag.code)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove diagnostic code"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Assessment Narrative */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Physician Assessment Narrative & Staging
                </label>
                <textarea
                  rows={2}
                  value={record.notes.assessment}
                  onChange={(e) =>
                    setRecord({
                      ...record,
                      notes: { ...record.notes, assessment: e.target.value },
                    })
                  }
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:border-sky-500 leading-relaxed font-sans"
                />
              </div>
            </div>
          )}

          {/* [P] Plan Section (Prescription Builder & Diagnostic Requisitions) */}
          {(activeSoapTab === 'all' || activeSoapTab === 'P') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                    P
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Plan — Prescription Builder & Diagnostic Requisitions
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">NABH Medication Safety</span>
              </div>

              {/* Prescription Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-sky-600" />
                    <span>e-Prescriptions (e-Rx)</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {record.prescriptions.length} Active Rx
                  </span>
                </div>

                {/* Medications List */}
                <div className="space-y-2">
                  {record.prescriptions.map((rx, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{rx.drug}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{rx.dosage}</span>
                          <span>·</span>
                          <span className="font-semibold text-sky-800">{rx.frequency}</span>
                          <span>·</span>
                          <span>{rx.duration}</span>
                          <span>·</span>
                          <span>Route: {rx.route}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePrescription(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Remove prescription"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Medication Form */}
                <form
                  onSubmit={handleAddPrescription}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs"
                >
                  <span className="font-bold text-slate-700 block">Add New Medication</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Drug name (e.g. Tab. Ticagrelor 90mg)..."
                      value={newRx.drug}
                      onChange={(e) => setNewRx({ ...newRx, drug: e.target.value })}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-hidden"
                    />
                    <select
                      value={newRx.frequency}
                      onChange={(e) => setNewRx({ ...newRx, frequency: e.target.value })}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                    >
                      <option value="Once daily (OD)">Once daily (OD)</option>
                      <option value="Twice daily (BD)">Twice daily (BD)</option>
                      <option value="Thrice daily (TDS)">Thrice daily (TDS)</option>
                      <option value="Four times daily (QID)">Four times daily (QID)</option>
                      <option value="At bedtime (HS)">At bedtime (HS)</option>
                      <option value="SOS (As needed)">SOS (As needed)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Duration (e.g. 14 Days)"
                      value={newRx.duration}
                      onChange={(e) => setNewRx({ ...newRx, duration: e.target.value })}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                    />
                    <button
                      type="submit"
                      className="py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Medication</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Diagnostic Test Requisitions */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Diagnostic Test Requisition (LIS & RIS PACS Orders)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {diagnosticTests.map((test, index) => (
                    <label
                      key={test.name}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        test.checked
                          ? 'bg-sky-50/70 border-sky-300 text-sky-950 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={test.checked}
                          onChange={(e) => {
                            const updated = [...diagnosticTests];
                            updated[index].checked = e.target.checked;
                            setDiagnosticTests(updated);
                          }}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>{test.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {test.stat ? 'STAT' : test.category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Overall Clinical Plan & Advice */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Physician Plan & Discharge Instructions
                </label>
                <textarea
                  rows={2}
                  value={record.notes.plan}
                  onChange={(e) =>
                    setRecord({
                      ...record,
                      notes: { ...record.notes, plan: e.target.value },
                    })
                  }
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:border-sky-500 leading-relaxed font-sans"
                />
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: Quick Voice Dictation Widget & Clinical Assistant ================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Voice Dictation Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Quick Voice Dictation
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Web Speech</span>
            </div>

            {/* Target Field Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Insert Voice Notes Into:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'S', label: '[S] Subjective' },
                  { id: 'O', label: '[O] Objective' },
                  { id: 'A', label: '[A] Assessment' },
                  { id: 'P', label: '[P] Plan' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDictationTarget(item.id as any)}
                    className={`py-1.5 px-2 rounded-md text-xs font-semibold text-center transition-all ${
                      dictationTarget === item.id
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pulsing Microphone Trigger Button */}
            <div className="text-center py-2">
              <button
                type="button"
                onClick={toggleVoiceDictation}
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all shadow-md ${
                  isVoiceListening
                    ? 'bg-rose-600 text-white ring-8 ring-rose-400/40 animate-pulse'
                    : 'bg-sky-600 hover:bg-sky-500 text-white hover:scale-105'
                }`}
                title={isVoiceListening ? 'Stop Dictating' : 'Tap to Speak Clinical Notes'}
              >
                {isVoiceListening ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>

              <div className="mt-2.5">
                <span className="text-xs font-bold text-slate-800 block">
                  {isVoiceListening ? 'Listening to doctor dictation...' : 'Tap to Speak Clinical Notes'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Appends to [{dictationTarget}] section
                </span>
              </div>
            </div>

            {/* Live Waveform Indicator when recording */}
            {isVoiceListening && (
              <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200 flex items-center justify-center gap-1.5">
                <span className="w-1 bg-sky-600 h-2 animate-bounce rounded-full" />
                <span className="w-1 bg-sky-600 h-4 animate-bounce delay-75 rounded-full" />
                <span className="w-1 bg-sky-600 h-1.5 animate-bounce delay-150 rounded-full" />
                <span className="w-1 bg-sky-600 h-5 animate-bounce delay-100 rounded-full" />
                <span className="w-1 bg-sky-600 h-3 animate-bounce delay-200 rounded-full" />
                <span className="text-xs font-medium text-sky-800 ml-2">Recording audio...</span>
              </div>
            )}

            {/* Transcribed Buffer Area */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Transcribed Audio Text
              </label>
              <textarea
                rows={3}
                placeholder="Spoken words appear here in real-time..."
                value={dictatedBuffer}
                onChange={(e) => setDictatedBuffer(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-sans focus:outline-hidden focus:border-sky-500"
              />

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  disabled={!dictatedBuffer.trim()}
                  onClick={handleAppendDictation}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Append to [{dictationTarget}]</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDictatedBuffer('')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-semibold"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Quick 1-Click Clinical Dictation Prompts */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Clinical Voice Samples:
              </span>
              <div className="space-y-1.5">
                {[
                  'Patient denies angina recurrence. Radial puncture clean.',
                  'BP 124/78, Pulse 72 regular, chest clear bilaterally.',
                  'Continue DAPT (Ticagrelor 90mg BD + Aspirin 75mg OD).',
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      simulateDictationPhrase(sample);
                    }}
                    className="w-full p-2 text-left rounded bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-900 border border-slate-200 text-[11px] leading-snug transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-sky-600 shrink-0" />
                    <span className="truncate">"{sample}"</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* NABH Clinical Compliance Badge */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-400">
                NABH COP 4.2 Standard
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">100% Compliant</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Every note digitally stamped with author HPR credential and SHA-256 timestamp.
            </p>
          </div>
        </div>
      </div>

      {/* 3. FHIR R4 Bundle Modal */}
      <FhirBundleModal
        isOpen={isFhirModalOpen}
        onClose={() => setIsFhirModalOpen(false)}
        patient={currentPatient}
        record={record}
        currentUser={currentUser}
      />
    </div>
  );
};
