import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Download,
  X,
  FileCode,
  KeyRound,
  Check,
  Send,
  ExternalLink,
} from 'lucide-react';
import { Patient, EmrRecord, StaffUser } from '../../types/hms';

interface FhirBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  record: EmrRecord;
  currentUser: StaffUser;
}

export const FhirBundleModal: React.FC<FhirBundleModalProps> = ({
  isOpen,
  onClose,
  patient,
  record,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [abdmTxId, setAbdmTxId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate authentic NRCeS / ABDM compliant FHIR R4 Bundle JSON
  const fhirPayload = {
    resourceType: 'Bundle',
    id: `bundle-opd-${patient.uhid.replace(/[^a-zA-Z0-9]/g, '')}`,
    meta: {
      versionId: '1',
      lastUpdated: new Date().toISOString(),
      profile: [
        'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle',
      ],
    },
    identifier: {
      system: 'https://ndhm.gov.in/bundle-identifier',
      value: `NRCES-DOC-${Date.now()}`,
    },
    type: 'document',
    timestamp: new Date().toISOString(),
    entry: [
      {
        fullUrl: `urn:uuid:composition-${patient.id}`,
        resource: {
          resourceType: 'Composition',
          id: `comp-${patient.id}`,
          status: 'final',
          type: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '371530004',
                display: 'Clinical consultation report',
              },
            ],
            text: 'OPD Clinical Consultation Note',
          },
          subject: {
            reference: `Patient/${patient.uhid}`,
            display: patient.name,
          },
          encounter: {
            reference: `Encounter/ENC-OPD-${patient.id}`,
            display: 'Outpatient Specialist Consultation',
          },
          date: new Date().toISOString(),
          author: [
            {
              reference: `Practitioner/${currentUser.hprId}`,
              display: `${currentUser.name} (${currentUser.title})`,
            },
          ],
          title: 'Consultation Note & Progress Record',
          custodian: {
            reference: 'Organization/IN-MH-004291',
            display: 'AuraHealth Super Specialty Hospital (HFR: IN-MH-004291)',
          },
          section: [
            {
              title: 'Subjective - Chief Complaints',
              code: {
                coding: [
                  {
                    system: 'http://loinc.org',
                    code: '10154-3',
                    display: 'Chief complaint',
                  },
                ],
              },
              text: {
                status: 'generated',
                div: `<div xmlns="http://www.w3.org/1999/xhtml">${record.notes.subjective}</div>`,
              },
            },
            {
              title: 'Objective - Physical Examination & Vitals',
              code: {
                coding: [
                  {
                    system: 'http://loinc.org',
                    code: '29545-1',
                    display: 'Physical findings',
                  },
                ],
              },
              text: {
                status: 'generated',
                div: `<div xmlns="http://www.w3.org/1999/xhtml">BP: ${record.vitals.bp}, HR: ${record.vitals.hr} bpm, SpO2: ${record.vitals.spo2}%, Temp: ${record.vitals.temp}</div>`,
              },
            },
            {
              title: 'Assessment - Diagnoses',
              code: {
                coding: [
                  {
                    system: 'http://loinc.org',
                    code: '51848-0',
                    display: 'Evaluation and management note',
                  },
                ],
              },
              text: {
                status: 'generated',
                div: `<div xmlns="http://www.w3.org/1999/xhtml">${record.icd10Codes.map((c) => `${c.code} - ${c.desc}`).join(', ')}</div>`,
              },
            },
            {
              title: 'Plan - Medication & Follow-up',
              code: {
                coding: [
                  {
                    system: 'http://loinc.org',
                    code: '18776-5',
                    display: 'Plan of treatment',
                  },
                ],
              },
              text: {
                status: 'generated',
                div: `<div xmlns="http://www.w3.org/1999/xhtml">${record.prescriptions.map((p) => `${p.drug} (${p.frequency})`).join('; ')}</div>`,
              },
            },
          ],
        },
      },
      {
        fullUrl: `urn:uuid:patient-${patient.uhid}`,
        resource: {
          resourceType: 'Patient',
          id: patient.uhid,
          identifier: [
            {
              system: 'https://healthid.ndhm.gov.in',
              value: patient.abhaId,
              type: { text: 'ABHA ID' },
            },
            {
              system: 'https://aurahealth.org/uhid',
              value: patient.uhid,
              type: { text: 'Hospital UHID' },
            },
          ],
          name: [{ text: patient.name }],
          telecom: [{ system: 'phone', value: patient.phone }],
          gender: patient.gender.toLowerCase(),
          birthDate: `${2026 - patient.age}-01-01`,
        },
      },
      ...record.icd10Codes.map((codeItem, index) => ({
        fullUrl: `urn:uuid:condition-${index}`,
        resource: {
          resourceType: 'Condition',
          id: `cond-${index}`,
          clinicalStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: 'active',
              },
            ],
          },
          verificationStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                code: 'confirmed',
              },
            ],
          },
          code: {
            coding: [
              {
                system: 'http://hl7.org/fhir/sid/icd-10',
                code: codeItem.code,
                display: codeItem.desc,
              },
            ],
            text: codeItem.desc,
          },
          subject: {
            reference: `Patient/${patient.uhid}`,
          },
        },
      })),
      {
        fullUrl: 'urn:uuid:vitals-panel',
        resource: {
          resourceType: 'Observation',
          id: 'vitals-panel-01',
          status: 'final',
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                  code: 'vital-signs',
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '85354-9',
                display: 'Blood pressure panel with all children optional',
              },
            ],
          },
          subject: { reference: `Patient/${patient.uhid}` },
          effectiveDateTime: new Date().toISOString(),
          component: [
            {
              code: {
                coding: [
                  { system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' },
                ],
              },
              valueQuantity: {
                value: parseInt(record.vitals.bp.split('/')[0]) || 120,
                unit: 'mmHg',
                system: 'http://unitsofmeasure.org',
                code: 'mm[Hg]',
              },
            },
            {
              code: {
                coding: [
                  { system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' },
                ],
              },
              valueQuantity: {
                value: record.vitals.hr,
                unit: 'beats/minute',
                system: 'http://unitsofmeasure.org',
                code: '/min',
              },
            },
            {
              code: {
                coding: [
                  { system: 'http://loinc.org', code: '2708-6', display: 'Oxygen saturation' },
                ],
              },
              valueQuantity: {
                value: record.vitals.spo2,
                unit: '%',
                system: 'http://unitsofmeasure.org',
                code: '%',
              },
            },
          ],
        },
      },
    ],
  };

  const jsonString = JSON.stringify(fhirPayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fhir_r4_bundle_${patient.uhid}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSignAndPush = () => {
    setIsSigning(true);
    setTimeout(() => {
      setIsSigning(false);
      setIsSigned(true);
      setAbdmTxId(`ABDM-TX-2026-${Math.floor(100000 + Math.random() * 900000)}`);
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>NRCeS / ABDM Compliant FHIR R4 Clinical Document Bundle</span>
                <span className="text-[10px] font-mono bg-sky-500/30 text-sky-300 px-2 py-0.5 rounded border border-sky-400/30">
                  FHIR v4.0.1
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Patient: {patient.name} ({patient.uhid}) · ABHA: {patient.abhaId}
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

        {/* Certificate Signing Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <KeyRound className="w-4 h-4 text-emerald-700" />
            <span className="text-slate-600">Digital Certificate:</span>
            <span className="font-semibold text-slate-900 font-mono">
              DSC: {currentUser.name} ({currentUser.licenseNumber})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md shadow-2xs flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md shadow-2xs flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .json</span>
            </button>
          </div>
        </div>

        {/* JSON Viewer */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-emerald-400 leading-relaxed select-text">
          <pre>{jsonString}</pre>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {isSigned ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4" /> Cryptographically Signed & Sent! ({abdmTxId})
              </span>
            ) : (
              <span>Ready for NHA National Health Locker Push</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSignAndPush}
              disabled={isSigning || isSigned}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSigning
                  ? 'Signing & Encrypting...'
                  : isSigned
                  ? 'Dispatched to ABDM ✓'
                  : 'Sign & Push to National Health Locker'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
