import { ComponentType } from 'react';

export type StaffRole = 'Doctor' | 'Receptionist' | 'Pharmacist' | 'Admin';

export interface HospitalBranch {
  id: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  hfrId: string; // Health Facility Registry ID
  abhaFacilityId: string;
  type: string;
  nabhLevel: string;
  totalBeds: number;
  occupiedBeds: number;
  availableDoctors: number;
  emergencyStatus: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  emergencyContact: string;
  address: string;
}

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  title: string;
  department: string;
  hprId: string; // Healthcare Professionals Registry ID
  email: string;
  phone: string;
  badgeNumber: string;
  activeShift: string;
  licenseNumber: string;
}

export type ModuleId =
  | 'dashboard'
  | 'opd-queue'
  | 'ipd-wards'
  | 'emr-station'
  | 'pharmacy'
  | 'diagnostics'
  | 'billing'
  | 'hr-roster'
  | 'compliance-audits';

export interface SubNavigationItem {
  id: string;
  label: string;
  badgeCount?: number;
}

export interface NavigationModule {
  id: ModuleId;
  label: string;
  iconName: string;
  description: string;
  badgeCount?: number;
  badgeVariant?: 'default' | 'urgent' | 'warning';
  subItems: SubNavigationItem[];
}

export interface Patient {
  id: string;
  uhid: string; // Unique Health Identifier (e.g. UHID-2026-84920)
  abhaId: string; // ABHA Health ID e.g. 91-8291-3019-1234
  abhaAddress: string; // e.g. rohan.sharma@abdm
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string;
  department: string;
  attendingDoctor: string;
  status: 'OPD' | 'Admitted' | 'Discharged' | 'Emergency';
  wardNo?: string;
  bedNo?: string;
  triageCategory: 'P1' | 'P2' | 'P3' | 'P4';
  chiefComplaint: string;
  admissionDate?: string;
  allergies?: string[];
}

export type OpdQueueStatus = 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED';
export type TriagePriority = 'Normal' | 'Urgent' | 'Emergency';

export interface OpdToken {
  tokenId: string;
  tokenNumber: string;
  patientName: string;
  uhid: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  ageGender: string;
  mobileNumber: string;
  doctorName: string;
  department: string; // e.g. General Medicine, Cardiology, Pediatrics
  roomNo: string;
  triagePriority: TriagePriority;
  triage?: string;
  status: OpdQueueStatus;
  waitTimeMin: number;
  abhaId?: string;
  abhaLinked: boolean;
  appointmentTime?: string;
  checkedInTime: string;
}

export type BedStatus = 'OCCUPIED' | 'AVAILABLE' | 'CLEANING' | 'MAINTENANCE';

export interface IpdBed {
  bedId: string;
  bedNumber: string;
  ward: 'ICU-A' | 'ICU-B' | 'HDU' | 'GENERAL-MALE' | 'GENERAL-FEMALE' | 'PRIVATE-DELUXE' | 'ISOLATION';
  status: BedStatus;
  oxygenSupport: boolean;
  ventilator: boolean;
  patient?: {
    uhid: string;
    name: string;
    ageGender: string;
    doctor: string;
    diagnosis: string;
    admissionDate: string;
    alertStatus?: 'STABLE' | 'OBSERVATION' | 'CRITICAL';
  };
}

export interface EmrRecord {
  uhid: string;
  patientName: string;
  ageGender: string;
  abhaId: string;
  chiefComplaint: string;
  vitals: {
    bp: string;
    hr: number;
    temp: string;
    spo2: number;
    rr: number;
    weight: string;
  };
  notes: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  icd10Codes: { code: string; desc: string }[];
  prescriptions: {
    drug: string;
    dosage: string;
    frequency: string;
    duration: string;
    route: string;
  }[];
}

export interface DrugBatch {
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  stockQty: number;
  mfgDate?: string;
  rackLocation: string;
  daysUntilExpiry: number;
  status: 'SAFE' | 'EXPIRING_90_DAYS' | 'CRITICAL_30_DAYS' | 'EXPIRED';
}

export interface PharmacyFefoDrug {
  drugId: string;
  brandName: string;
  genericName: string;
  dosageForm: 'Tablet' | 'Injection' | 'Syrup' | 'IV Infusion' | 'Inhaler';
  strength: string;
  totalStock: number;
  reorderLevel: number;
  unitPrice: number;
  requiresPrescription: boolean;
  category: string;
  batches: DrugBatch[];
}

export interface PharmacyItem {
  drugId: string;
  brandName: string;
  genericName: string;
  dosageForm: 'Tablet' | 'Injection' | 'Syrup' | 'IV Infusion' | 'Inhaler';
  strength: string;
  stockQty: number;
  reorderLevel: number;
  expiryDate: string;
  batchNumber: string;
  rackLocation: string;
  unitPrice: number;
  requiresPrescription: boolean;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'EXPIRING_SOON';
}

export interface DiagnosticOrder {
  orderId: string;
  uhid: string;
  patientName: string;
  testName: string;
  category: 'LIS' | 'RIS';
  orderedBy: string;
  sampleStatus: 'COLLECTED' | 'PROCESSING' | 'REPORTED' | 'CRITICAL_ALERT';
  resultValue?: string;
  normalRange?: string;
  isCritical?: boolean;
  orderTime: string;
  modality?: 'CT Scan' | 'MRI' | 'Digital X-Ray' | 'Ultrasound' | 'Pathology' | 'Hematology';
}

export interface InvoiceLineItem {
  id: string;
  category: 'Consultation' | 'Pharmacy' | 'Lab' | 'Room Rent' | 'Procedure';
  description: string;
  sacHsnCode: string;
  quantity: number;
  unitRate: number;
  taxRatePercent: number; // e.g. 0%, 5%, 12%
  amount: number;
}

export type TpaClaimStatus = 'SUBMITTED' | 'UNDER_QUERY' | 'APPROVED' | 'SETTLED';

export interface TpaClaim {
  claimId: string;
  policyNumber: string;
  tpaProvider: string;
  preAuthId: string;
  uhid: string;
  patientName: string;
  claimedAmount: number;
  approvedAmount: number;
  deductionAmount: number;
  status: TpaClaimStatus;
  submittedAt: string;
  settledAt?: string;
  queryNote?: string;
}

export type CertInSeverity = 'INFO' | 'CRITICAL_CLINICAL' | 'SECURITY_ALERT';

export interface CertInAuditLog {
  logId: string;
  timestampIst: string;
  actorEmail: string;
  actorName: string;
  role: 'Doctor' | 'Receptionist' | 'Pharmacist' | 'Admin';
  ipAddress: string;
  action:
    | 'VIEW_EMR'
    | 'UPDATE_INVOICE'
    | 'SUBMIT_TPA_CLAIM'
    | 'DISPENSE_NARCOTICS'
    | 'DISCHARGE_PATIENT'
    | 'EXPORT_FHIR_BUNDLE'
    | 'CODE_BLUE_BROADCAST';
  resourceType: string;
  resourceId: string;
  severity: CertInSeverity;
  sha256Hash: string;
  previousHash: string;
}

export interface BillingInvoice {
  invoiceId: string;
  uhid: string;
  patientName: string;
  billType: 'Cashless TPA' | 'Self Pay' | 'CGHS / ECHS' | 'Corporate';
  insuranceProvider?: string;
  totalAmount: number;
  insuranceCovered: number;
  copayAmount: number;
  status: 'PRE_AUTH_PENDING' | 'APPROVED' | 'SETTLED' | 'UNPAID';
  date: string;
  department: string;
}

export interface RosterShift {
  staffId: string;
  staffName: string;
  role: 'Doctor' | 'Staff Nurse' | 'Technician' | 'Admin';
  department: string;
  shift: 'Morning (08:00 - 16:00)' | 'Evening (16:00 - 00:00)' | 'Night (00:00 - 08:00)' | 'On-Call';
  onDuty: boolean;
  roomOrWard: string;
  complianceRatioMet: boolean;
}

export interface ComplianceCheck {
  id: string;
  standardCode: string; // e.g. "NABH COP 6.1"
  title: string;
  category: 'Patient Safety' | 'Infection Control' | 'BMW (Bio-Medical Waste)' | 'ABHA/NDHM' | 'Medicine Safety';
  complianceScore: number;
  status: 'COMPLIANT' | 'NEEDS_REVIEW' | 'CRITICAL_NON_CONFORMITY';
  lastAudited: string;
  auditor: string;
  actionRequired?: string;
}

export interface CodeBlueAlert {
  active: boolean;
  location: string;
  triggeredAt: string;
  triggeredBy: string;
  responderCount: number;
}
