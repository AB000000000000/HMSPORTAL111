import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Receipt,
  ShieldCheck,
  ShieldAlert,
  FileText,
  CheckCircle2,
  Clock,
  Search,
  Download,
  AlertCircle,
  Filter,
  Plus,
  Trash2,
  Printer,
  ArrowRight,
  Lock,
  Unlock,
  Hash,
  RefreshCw,
  ExternalLink,
  Eye,
  Copy,
  Check,
  Building2,
  Server,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  FileCheck,
  CheckCheck,
  Info,
} from 'lucide-react';
import {
  StaffUser,
  InvoiceLineItem,
  TpaClaim,
  TpaClaimStatus,
  CertInAuditLog,
  CertInSeverity,
} from '../../types/hms';
import {
  SAMPLE_INVOICE_LINE_ITEMS,
  SAMPLE_TPA_CLAIMS,
  SAMPLE_CERTIN_AUDIT_LOGS,
  PATIENTS_DATABASE,
} from '../../data/mockHmsData';

interface BillingModuleProps {
  currentUser: StaffUser;
}

type ActiveTab = 'billing-tpa' | 'certin-audit';

// SAC & HSN Code Presets for Indian Healthcare
const SAC_HSN_PRESETS = {
  Procedure: { code: '999312', defaultTax: 0, label: 'SAC 999312 - Surgical & Clinical Procedures (Exempt)' },
  Consultation: { code: '999312', defaultTax: 0, label: 'SAC 999312 - Medical Consultation (Exempt)' },
  Lab: { code: '999316', defaultTax: 0, label: 'SAC 999316 - Pathological & Diagnostic Tests (Exempt)' },
  'Room Rent': { code: '999312', defaultTax: 12, label: 'SAC 999312 - Inpatient Bed/Room > ₹5,000/day (12% GST)' },
  Pharmacy: { code: '3004', defaultTax: 5, label: 'HSN 3004 - Formulated Pharmaceuticals (5% GST)' },
};

export const BillingModule: React.FC<BillingModuleProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('billing-tpa');

  // ==========================================
  // TAB 1: GST BILLING & INVOICE STATE
  // ==========================================
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const currentPatient = PATIENTS_DATABASE[selectedPatientIndex] || PATIENTS_DATABASE[0];

  const [invoiceNumber] = useState('INV-2026-00482');
  const [invoiceDate] = useState('2026-11-16');
  const [billType, setBillType] = useState<'Cashless TPA' | 'Self Pay' | 'CGHS / ECHS' | 'Corporate'>('Cashless TPA');
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PARTIAL' | 'PAID' | 'SETTLED'>('PARTIAL');
  const [discountAmount, setDiscountAmount] = useState<number>(2000);

  // Line items state
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(SAMPLE_INVOICE_LINE_ITEMS);

  // New Line Item Modal / Form state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState<InvoiceLineItem['category']>('Pharmacy');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCode, setNewItemCode] = useState(SAC_HSN_PRESETS['Pharmacy'].code);
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemRate, setNewItemRate] = useState(1200);
  const [newItemTaxRate, setNewItemTaxRate] = useState(5);

  // Print Tax Invoice Modal
  const [showInvoicePrintModal, setShowInvoicePrintModal] = useState(false);

  // Record Payment Modal
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'UPI_QR' | 'POS_CARD' | 'NET_BANKING' | 'CASH'>('UPI_QR');
  const [paymentRefNumber, setPaymentRefNumber] = useState('UPI-REF-992019482');
  const [paymentPaidAmount, setPaymentPaidAmount] = useState<number>(25000);

  // ==========================================
  // TPA CLAIMS WORKFLOW STATE
  // ==========================================
  const [tpaClaims, setTpaClaims] = useState<TpaClaim[]>(SAMPLE_TPA_CLAIMS);
  const [tpaQueryModalClaim, setTpaQueryModalClaim] = useState<TpaClaim | null>(null);
  const [tpaQueryResponseText, setTpaQueryResponseText] = useState('');
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);
  const [newClaimProvider, setNewClaimProvider] = useState('Star Health & Allied Insurance');
  const [newClaimPolicy, setNewClaimPolicy] = useState('STAR-OPT-2026-78491');
  const [newClaimAmount, setNewClaimAmount] = useState(150000);

  // ==========================================
  // TAB 2: CERT-IN AUDIT LOGS STATE
  // ==========================================
  const [auditLogs, setAuditLogs] = useState<CertInAuditLog[]>(SAMPLE_CERTIN_AUDIT_LOGS);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Cryptographic Verification State
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState<number>(0);
  const [chainTampered, setChainTampered] = useState(false);
  const [tamperedBlockIndex, setTamperedBlockIndex] = useState<number | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(
    'Verified via Stratum-1 IST NTP Server (time.nplindia.org). 7 blocks authenticated.'
  );

  // New Log Event Modal
  const [showNewLogModal, setShowNewLogModal] = useState(false);
  const [newLogAction, setNewLogAction] = useState<CertInAuditLog['action']>('VIEW_EMR');
  const [newLogResource, setNewLogResource] = useState('Patient Clinical Record: UHID-2026-84920');
  const [newLogSeverity, setNewLogSeverity] = useState<CertInSeverity>('INFO');

  // ==========================================
  // FINANCIAL CALCULATIONS (GST)
  // ==========================================
  const financialSummary = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    let exemptValue = 0;
    let taxableValue = 0;

    lineItems.forEach((item) => {
      const lineBase = item.unitRate * item.quantity;
      const lineTax = (lineBase * item.taxRatePercent) / 100;
      subtotal += lineBase;
      totalTax += lineTax;

      if (item.taxRatePercent === 0) {
        exemptValue += lineBase;
      } else {
        taxableValue += lineBase;
      }
    });

    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    const grossTotal = subtotal + totalTax;
    const netPayable = Math.max(0, grossTotal - discountAmount);

    // Associated TPA Pre-authorization for current patient
    const patientClaim = tpaClaims.find((c) => c.uhid === currentPatient.uhid);
    const tpaApproved = patientClaim ? patientClaim.approvedAmount : 220000;
    const patientCopay = Math.max(0, netPayable - tpaApproved);

    return {
      subtotal,
      exemptValue,
      taxableValue,
      cgst,
      sgst,
      totalTax,
      grossTotal,
      netPayable,
      tpaApproved,
      patientCopay,
    };
  }, [lineItems, discountAmount, tpaClaims, currentPatient]);

  // Handle Category Change in Add Item
  const handleCategoryChange = (category: InvoiceLineItem['category']) => {
    setNewItemCategory(category);
    const preset = SAC_HSN_PRESETS[category];
    setNewItemCode(preset.code);
    setNewItemTaxRate(preset.defaultTax);
  };

  // Add Item to Line Items
  const handleAddLineItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim()) return;

    const baseAmount = newItemRate * newItemQty;
    const newItem: InvoiceLineItem = {
      id: `ITEM-${Date.now().toString().slice(-4)}`,
      category: newItemCategory,
      description: newItemDesc,
      sacHsnCode: newItemCode,
      quantity: newItemQty,
      unitRate: newItemRate,
      taxRatePercent: newItemTaxRate,
      amount: baseAmount,
    };

    setLineItems((prev) => [...prev, newItem]);
    setNewItemDesc('');
    setIsAddingItem(false);
  };

  // Remove Item
  const handleRemoveLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Advance TPA Claim Workflow
  const handleAdvanceTpaClaim = (claimId: string) => {
    setTpaClaims((prev) =>
      prev.map((c) => {
        if (c.claimId !== claimId) return c;
        if (c.status === 'SUBMITTED') {
          return {
            ...c,
            status: 'APPROVED',
            approvedAmount: c.claimedAmount - 15000,
            deductionAmount: 15000,
          };
        }
        if (c.status === 'UNDER_QUERY') {
          return {
            ...c,
            status: 'APPROVED',
            approvedAmount: c.claimedAmount - 10000,
            deductionAmount: 10000,
            queryNote: undefined,
          };
        }
        if (c.status === 'APPROVED') {
          return {
            ...c,
            status: 'SETTLED',
            settledAt: '2026-11-16 10:00',
          };
        }
        return c;
      })
    );
  };

  // Submit Query Response
  const handleSubmitQueryResponse = () => {
    if (!tpaQueryModalClaim) return;
    setTpaClaims((prev) =>
      prev.map((c) => {
        if (c.claimId !== tpaQueryModalClaim.claimId) return c;
        return {
          ...c,
          status: 'APPROVED',
          approvedAmount: c.claimedAmount - 8000,
          deductionAmount: 8000,
          queryNote: `Resolved on 2026-11-16: ${tpaQueryResponseText || 'Operative notes uploaded.'}`,
        };
      })
    );
    setTpaQueryModalClaim(null);
    setTpaQueryResponseText('');
  };

  // Submit New Claim
  const handleCreateNewClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const newClaim: TpaClaim = {
      claimId: `CLM-NHCX-${Math.floor(100 + Math.random() * 900)}`,
      policyNumber: newClaimPolicy,
      tpaProvider: newClaimProvider,
      preAuthId: `PA-NHCX-${Math.floor(10000 + Math.random() * 90000)}`,
      uhid: currentPatient.uhid,
      patientName: currentPatient.name,
      claimedAmount: newClaimAmount,
      approvedAmount: 0,
      deductionAmount: 0,
      status: 'SUBMITTED',
      submittedAt: '2026-11-16 10:15',
    };
    setTpaClaims((prev) => [newClaim, ...prev]);
    setShowNewClaimModal(false);
  };

  // ==========================================
  // CRYPTOGRAPHIC CHAIN LOGIC
  // ==========================================
  const verifyHashChain = () => {
    setIsVerifyingChain(true);
    setVerificationProgress(0);
    setVerificationFeedback(null);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setVerificationProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setIsVerifyingChain(false);

        if (chainTampered) {
          setVerificationFeedback(
            `SECURITY AUDIT ALERT: Cryptographic chain mismatch at block #${
              tamperedBlockIndex !== null ? tamperedBlockIndex + 1 : 3
            }. Parent block hash does not validate!`
          );
        } else {
          setVerificationFeedback(
            `CRYPTOGRAPHIC INTEGRITY CONFIRMED: All ${auditLogs.length} blocks verified against Stratum-1 IST NTP master ledger. Zero tampering detected.`
          );
        }
      }
    }, 150);
  };

  // Simulate Tamper Attack for Forensic Test
  const handleSimulateTamper = () => {
    if (chainTampered) {
      // Restore valid chain
      setAuditLogs(SAMPLE_CERTIN_AUDIT_LOGS);
      setChainTampered(false);
      setTamperedBlockIndex(null);
      setVerificationFeedback('Ledger restored to certified genesis hash chain.');
    } else {
      // Corrupt block 2 (index 2)
      const corrupted = [...auditLogs];
      corrupted[2] = {
        ...corrupted[2],
        action: 'DISCHARGE_PATIENT',
        sha256Hash: 'baad000000000000000000000000000000000000000000000000000000000000',
      };
      setAuditLogs(corrupted);
      setChainTampered(true);
      setTamperedBlockIndex(2);
      setVerificationFeedback('Simulation Active: Block #3 altered intentionally. Run verification to test forensic detection.');
    }
  };

  // Append a live Audit Event to the Chain
  const handleAppendAuditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const headLog = auditLogs[0];
    const newHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const newLog: CertInAuditLog = {
      logId: `AUD-2026-${Math.floor(90420 + Math.random() * 50)}`,
      timestampIst: `${new Date().toISOString().replace('T', ' ').slice(0, 19)}.120 IST`,
      actorEmail: currentUser.email,
      actorName: currentUser.name,
      role: currentUser.role,
      ipAddress: '192.168.1.104',
      action: newLogAction,
      resourceType: newLogResource,
      resourceId: `RES-${Date.now().toString().slice(-6)}`,
      severity: newLogSeverity,
      sha256Hash: newHash,
      previousHash: headLog.sha256Hash,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    setShowNewLogModal(false);
  };

  // Copy hash helper
  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actorEmail.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.ipAddress.includes(auditSearchQuery) ||
      log.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.resourceType.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(auditSearchQuery.toLowerCase());

    const matchesSeverity =
      selectedSeverity === 'ALL' || log.severity === selectedSeverity;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* HEADER & MODULE SWITCHER BAR */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
            Patient Financial Services & Forensic Cybersecurity
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Financial Billing, TPA Claims & CERT-In Audit Inspector
          </h1>
          <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <span>Hospital GSTIN: 27AABCA1234F1Z5 (Maharashtra)</span>
            <span aria-hidden="true">·</span>
            <span>NHCX Pre-Auth Gateway Online</span>
            <span aria-hidden="true">·</span>
            <span>CERT-In Sec 70B Mandate Compliant</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('billing-tpa')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'billing-tpa'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-sky-600" />
            <span>GST Billing & TPA Desk</span>
          </button>
          <button
            onClick={() => setActiveTab('certin-audit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'certin-audit'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>CERT-In Immutable Audit Trail</span>
            {chainTampered ? (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GST-COMPLIANT BILLING & INSURANCE TPA DESK */}
      {/* ========================================================= */}
      {activeTab === 'billing-tpa' && (
        <div className="space-y-6">
          {/* Top Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block">Total Invoiced Amount</span>
              <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block tabular-nums">
                ₹{financialSummary.grossTotal.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Exempt: ₹{financialSummary.exemptValue.toLocaleString('en-IN')} · Tax: ₹{financialSummary.totalTax.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block">TPA Insurance Approved</span>
              <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block tabular-nums">
                ₹{financialSummary.tpaApproved.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                Direct Cashless Pre-Auth
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block">Patient Copay / Self-Pay Balance</span>
              <span className="text-2xl font-bold font-mono text-amber-700 mt-1 block tabular-nums">
                ₹{financialSummary.patientCopay.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Status: {paymentStatus.replace('_', ' ')}
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block">Active TPA Pre-Auths</span>
              <span className="text-2xl font-bold font-mono text-sky-800 mt-1 block tabular-nums">
                {tpaClaims.length} Claims
              </span>
              <span className="text-[11px] text-sky-700 font-medium mt-1 block">
                NHCX Connected Gateway
              </span>
            </div>
          </div>

          {/* Main 2-Column Grid: Invoice Generator on Left, TPA Claims on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: ITEMIZED GST INVOICE GENERATOR (8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-5">
              {/* Patient & Bill Header Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Tax Invoice: {invoiceNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-sky-100 text-sky-800 font-semibold">
                          RULE 46 CGST
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Date: {invoiceDate} · SAC/HSN Itemized Bill
                      </div>
                    </div>
                  </div>

                  {/* Actions: Print and Record Payment */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowInvoicePrintModal(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="View printable official GST tax invoice"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Tax Invoice</span>
                    </button>
                    <button
                      onClick={() => setShowRecordPaymentModal(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  </div>
                </div>

                {/* Patient Selector Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Select Patient UHID
                    </label>
                    <select
                      value={selectedPatientIndex}
                      onChange={(e) => setSelectedPatientIndex(Number(e.target.value))}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-medium"
                    >
                      {PATIENTS_DATABASE.slice(0, 5).map((p, idx) => (
                        <option key={p.id} value={idx}>
                          {p.name} ({p.uhid})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Billing Scheme
                    </label>
                    <select
                      value={billType}
                      onChange={(e) => setBillType(e.target.value as any)}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-medium"
                    >
                      <option value="Cashless TPA">Cashless TPA Insurance</option>
                      <option value="Self Pay">Self Pay / POS Direct</option>
                      <option value="CGHS / ECHS">CGHS / ECHS Central Govt</option>
                      <option value="Corporate">Corporate Empanelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Payment Status Tracking
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-semibold text-slate-800"
                    >
                      <option value="PENDING">PENDING (Unpaid)</option>
                      <option value="PARTIAL">PARTIAL (TPA Approved / Copay Due)</option>
                      <option value="PAID">PAID (Full Copay Received)</option>
                      <option value="SETTLED">SETTLED (Final Bank Remittance)</option>
                    </select>
                  </div>
                </div>

                {/* Patient Information Summary Banner */}
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-wrap items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{currentPatient.name}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-slate-600">{currentPatient.uhid}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-slate-500">ABHA: {currentPatient.abhaId}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Dept: <span className="font-medium text-slate-700">{currentPatient.department}</span> · Dr: {currentPatient.attendingDoctor}
                  </div>
                </div>
              </div>

              {/* Line Items Table Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Itemized Services & Consumables ({lineItems.length})
                    </span>
                  </div>

                  <button
                    onClick={() => setIsAddingItem(!isAddingItem)}
                    className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line Item</span>
                  </button>
                </div>

                {/* Inline Add Line Item Form */}
                {isAddingItem && (
                  <form
                    onSubmit={handleAddLineItem}
                    className="p-4 bg-sky-50/60 border-b border-sky-100 space-y-3"
                  >
                    <div className="text-xs font-bold text-sky-900 flex items-center justify-between">
                      <span>Add New Hospital Service / Medicine / Room Charge</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingItem(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Category
                        </label>
                        <select
                          value={newItemCategory}
                          onChange={(e) =>
                            handleCategoryChange(e.target.value as InvoiceLineItem['category'])
                          }
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md focus:border-sky-500"
                        >
                          <option value="Procedure">Procedure (PCI, OT)</option>
                          <option value="Room Rent">Room / ICU Rent</option>
                          <option value="Pharmacy">Pharmacy / Drugs</option>
                          <option value="Lab">Lab / Diagnostics</option>
                          <option value="Consultation">Consultation</option>
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Item Description
                        </label>
                        <input
                          type="text"
                          required
                          value={newItemDesc}
                          onChange={(e) => setNewItemDesc(e.target.value)}
                          placeholder="e.g. 2D Echo Cardiography Doppler"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:border-sky-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          SAC/HSN Code
                        </label>
                        <input
                          type="text"
                          value={newItemCode}
                          onChange={(e) => setNewItemCode(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-[11px]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Tax Rate (GST)
                        </label>
                        <select
                          value={newItemTaxRate}
                          onChange={(e) => setNewItemTaxRate(Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md font-medium"
                        >
                          <option value={0}>0% (Exempt)</option>
                          <option value={5}>5% (Pharma)</option>
                          <option value={12}>12% (Room &gt;5k)</option>
                          <option value={18}>18% (Elective)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newItemQty}
                          onChange={(e) => setNewItemQty(Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md font-mono"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Unit Rate (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={newItemRate}
                          onChange={(e) => setNewItemRate(Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md font-mono"
                        />
                      </div>

                      <div className="sm:col-span-7 flex items-end justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingItem(false)}
                          className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-2xs"
                        >
                          Add Line Item
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-2 text-center">SAC/HSN</th>
                        <th className="py-2.5 px-2 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate</th>
                        <th className="py-2.5 px-2 text-right">Tax %</th>
                        <th className="py-2.5 px-3 text-right">Total (₹)</th>
                        <th className="py-2.5 px-2 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.map((item) => {
                        const lineBase = item.unitRate * item.quantity;
                        const lineTax = (lineBase * item.taxRatePercent) / 100;
                        const lineTotal = lineBase + lineTax;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="text-[11px] font-semibold text-slate-700">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900 leading-tight">
                                {item.description}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-500">
                              {item.sacHsnCode}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-700">
                              {item.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                              ₹{item.unitRate.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                              {item.taxRatePercent === 0 ? (
                                <span className="text-emerald-700 font-medium text-[11px]">Exempt</span>
                              ) : (
                                <span className="text-slate-800 font-medium">{item.taxRatePercent}%</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                              ₹{lineTotal.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => handleRemoveLineItem(item.id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                title="Remove line item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Financial Computation Summary Box */}
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <div className="max-w-md ml-auto space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal (Base Value):</span>
                      <span className="font-mono tabular-nums">
                        ₹{financialSummary.subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Healthcare Exempt Services (0%):</span>
                      <span className="font-mono tabular-nums">
                        ₹{financialSummary.exemptValue.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Taxable Goods & Services:</span>
                      <span className="font-mono tabular-nums">
                        ₹{financialSummary.taxableValue.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {financialSummary.totalTax > 0 && (
                      <div className="py-1.5 px-2.5 bg-slate-100 rounded-md space-y-1 text-[11px]">
                        <div className="flex justify-between text-slate-700">
                          <span>Central GST (CGST - 50%):</span>
                          <span className="font-mono font-medium tabular-nums">
                            ₹{financialSummary.cgst.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>State GST (SGST - 50%):</span>
                          <span className="font-mono font-medium tabular-nums">
                            ₹{financialSummary.sgst.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-900 font-semibold border-t border-slate-200 pt-1">
                          <span>Total GST Added:</span>
                          <span className="font-mono tabular-nums">
                            ₹{financialSummary.totalTax.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Hospital Scheme Concession / Discount:</span>
                      <div className="flex items-center gap-1 font-mono">
                        <span>- ₹</span>
                        <input
                          type="number"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(Number(e.target.value))}
                          className="w-20 px-1 py-0.5 bg-white border border-slate-200 rounded text-right font-mono text-xs tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
                      <span>Total Net Payable:</span>
                      <span className="font-mono text-base tabular-nums text-slate-900">
                        ₹{financialSummary.netPayable.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {billType === 'Cashless TPA' && (
                      <div className="pt-2 border-t border-dashed border-slate-200 space-y-1">
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Less: TPA Insurance Pre-Auth Coverage:</span>
                          <span className="font-mono tabular-nums">
                            - ₹{financialSummary.tpaApproved.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          <span>Patient Out-of-Pocket Copay Due:</span>
                          <span className="font-mono text-base tabular-nums">
                            ₹{financialSummary.patientCopay.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: INSURANCE TPA CLAIMS SUBMISSION & PIPELINE (4 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-5">
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Cashless TPA Claims Pipeline
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowNewClaimModal(true)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Pre-Auth</span>
                  </button>
                </div>

                <div className="text-xs text-slate-500 mt-2">
                  Integrated with National Health Claims Exchange (NHCX) for real-time cashless approval.
                </div>

                {/* TPA Claims Cards List */}
                <div className="mt-4 space-y-3">
                  {tpaClaims.map((claim) => {
                    const isUnderQuery = claim.status === 'UNDER_QUERY';
                    const isApproved = claim.status === 'APPROVED';
                    const isSettled = claim.status === 'SETTLED';

                    return (
                      <div
                        key={claim.claimId}
                        className={`p-3.5 rounded-lg border transition-all ${
                          isUnderQuery
                            ? 'bg-amber-50/60 border-amber-300'
                            : isSettled
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-xs text-slate-900">
                              {claim.tpaProvider}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                              Policy: {claim.policyNumber}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                              isSettled
                                ? 'bg-slate-200 text-slate-800'
                                : isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isUnderQuery
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {claim.status}
                          </span>
                        </div>

                        {/* Patient & PreAuth Info */}
                        <div className="mt-2 text-xs grid grid-cols-2 gap-2 text-slate-600 bg-slate-50/80 p-2 rounded border border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Patient / UHID</span>
                            <span className="font-semibold text-slate-800">{claim.patientName}</span>
                            <span className="font-mono text-[10px] block text-slate-500">{claim.uhid}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Pre-Auth ID</span>
                            <span className="font-mono text-[11px] text-slate-800 font-semibold">{claim.preAuthId}</span>
                            <span className="text-[10px] text-slate-400 block">{claim.submittedAt}</span>
                          </div>
                        </div>

                        {/* Amounts Strip */}
                        <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Claimed</span>
                            <span className="font-mono font-bold text-slate-800 tabular-nums">
                              ₹{claim.claimedAmount.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Approved</span>
                            <span className="font-mono font-bold text-emerald-700 tabular-nums">
                              ₹{claim.approvedAmount.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {claim.deductionAmount > 0 && (
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Deduction</span>
                              <span className="font-mono font-bold text-rose-600 tabular-nums">
                                ₹{claim.deductionAmount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* If Under Query: display notification */}
                        {isUnderQuery && (
                          <div className="mt-2.5 p-2 bg-amber-100/70 border border-amber-300 rounded text-[11px] text-amber-900 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Insurer Query Pending</span>
                            </div>
                            <p className="text-[11px] text-amber-800 leading-tight">
                              {claim.queryNote || 'Awaiting additional operative clinical documentation.'}
                            </p>
                            <button
                              onClick={() => {
                                setTpaQueryModalClaim(claim);
                                setTpaQueryResponseText('');
                              }}
                              className="mt-1 w-full py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold transition-colors"
                            >
                              Upload Query Clarification
                            </button>
                          </div>
                        )}

                        {/* Workflow Pipeline Action Bar */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <span>Stage:</span>
                            <span className="font-semibold text-slate-600">
                              {claim.status === 'SUBMITTED' && '1/4 Submitted'}
                              {claim.status === 'UNDER_QUERY' && '2/4 Under Query'}
                              {claim.status === 'APPROVED' && '3/4 Pre-Auth Approved'}
                              {claim.status === 'SETTLED' && '4/4 Fully Settled'}
                            </span>
                          </div>

                          {claim.status !== 'SETTLED' && !isUnderQuery && (
                            <button
                              onClick={() => handleAdvanceTpaClaim(claim.claimId)}
                              className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1 hover:underline"
                            >
                              <span>
                                {claim.status === 'SUBMITTED' ? 'Approve Pre-Auth' : 'Finalize Settlement'}
                              </span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CERT-IN & NABH IMMUTABLE AUDIT TRAIL INSPECTOR */}
      {/* ========================================================= */}
      {activeTab === 'certin-audit' && (
        <div className="space-y-6">
          {/* Top Cryptographic Hash Chain Verification Banner */}
          <div
            className={`p-4 sm:p-5 rounded-xl border transition-all ${
              chainTampered
                ? 'bg-rose-50 border-rose-300 shadow-sm'
                : 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {chainTampered ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 text-xs font-bold font-mono">
                      <ShieldAlert className="w-4 h-4 text-rose-700" />
                      <span>CRYPTOGRAPHIC MISMATCH · TAMPER DETECTED</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-xs font-bold font-mono">
                      <ShieldCheck className="w-4 h-4 text-emerald-800" />
                      <span>CHAIN INTACT - TAMPER FREE</span>
                    </div>
                  )}

                  <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                    SHA-256 Chained Hash Ledger
                  </span>
                </div>

                <div className="text-xs text-slate-700 max-w-3xl leading-relaxed">
                  {verificationFeedback || (
                    <span>
                      Continuous cryptographic hashing connects each audit record to its predecessor. Any unauthorized database row modification invalidates downstream hashes instantaneously under Indian CERT-In guidelines.
                    </span>
                  )}
                </div>

                {/* Ledger Hashes Monospace Details */}
                <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Ledger Head Hash:</span>
                    <span className="font-bold text-slate-800 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                      {auditLogs[0]?.sha256Hash.slice(0, 24)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">NTP Time Reference:</span>
                    <span className="text-slate-700 font-medium">time.nplindia.org (Stratum-1 IST)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Run Verification & Simulate Tamper */}
              <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
                <button
                  disabled={isVerifyingChain}
                  onClick={verifyHashChain}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingChain ? 'animate-spin' : ''}`} />
                  <span>
                    {isVerifyingChain
                      ? `Verifying (${verificationProgress}%)...`
                      : 'Verify Cryptographic Hash Chain'}
                  </span>
                </button>

                <button
                  onClick={handleSimulateTamper}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                    chainTampered
                      ? 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                      : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                  }`}
                  title="Test forensic tamper detection by corrupting a historical block"
                >
                  {chainTampered ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Restore Genesis Chain</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Simulate Tamper Attack</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Verification Progress Bar */}
            {isVerifyingChain && (
              <div className="mt-3 w-full bg-emerald-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 transition-all duration-150"
                  style={{ width: `${verificationProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* CERT-In Compliance Metrics Card Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium block">Statutory Mandate</span>
              <span className="text-base font-bold text-slate-900 mt-0.5 block">
                CERT-In Sec 70B
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Cyber Security Directions 2022</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium block">Mandatory Log Retention</span>
              <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                180 Days (Rolling)
              </span>
              <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">Active Cold Archive</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium block">Verified Entries</span>
              <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                {auditLogs.length} Blocks Linked
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Merkle Chain Depth</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium block">Audit Actions Logged</span>
              <span className="text-base font-bold font-mono text-sky-800 mt-0.5 block">
                7 Critical Events
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">EMR, TPA, Narcotics, Code Blue</span>
            </div>
          </div>

          {/* Forensic Log Viewer Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Toolbar: Search, Filters, Append Log */}
            <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    placeholder="Search actor, action, IP, resource..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                {/* Severity Filter Chips */}
                <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg text-xs">
                  {['ALL', 'INFO', 'CRITICAL_CLINICAL', 'SECURITY_ALERT'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSelectedSeverity(sev)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        selectedSeverity === sev
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sev === 'ALL'
                        ? 'All'
                        : sev === 'CRITICAL_CLINICAL'
                        ? 'Critical'
                        : sev === 'SECURITY_ALERT'
                        ? 'Security'
                        : 'Info'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action: Append Event */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewLogModal(true)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Append Audit Event</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Timestamp (IST)</th>
                    <th className="py-3 px-3">Actor & Role</th>
                    <th className="py-3 px-3">IP Address</th>
                    <th className="py-3 px-3">Action Performed</th>
                    <th className="py-3 px-4">Resource Target</th>
                    <th className="py-3 px-3 text-center">Severity</th>
                    <th className="py-3 px-3">SHA-256 Hash</th>
                    <th className="py-3 px-2 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredAuditLogs.map((log, index) => {
                    const isCorrupted = chainTampered && index === tamperedBlockIndex;
                    const isExpanded = expandedLogId === log.logId;

                    return (
                      <React.Fragment key={log.logId}>
                        <tr
                          className={`transition-colors ${
                            isCorrupted
                              ? 'bg-rose-50/90 border-l-4 border-l-rose-500'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          {/* Timestamp (IST) */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                            {log.timestampIst}
                          </td>

                          {/* Actor Email & Role */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{log.actorName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{log.actorEmail}</div>
                            <div className="text-[10px] text-sky-700 font-semibold">{log.role}</div>
                          </td>

                          {/* IP Address */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                log.ipAddress.startsWith('172.')
                                  ? 'bg-rose-100 text-rose-800 font-bold'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {log.ipAddress}
                            </span>
                          </td>

                          {/* Action Performed */}
                          <td className="py-3 px-3">
                            <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              {log.action}
                            </span>
                          </td>

                          {/* Resource Type & ID */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 leading-tight">
                              {log.resourceType}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {log.resourceId}
                            </div>
                          </td>

                          {/* Severity */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                log.severity === 'SECURITY_ALERT'
                                  ? 'bg-rose-100 text-rose-800'
                                  : log.severity === 'CRITICAL_CLINICAL'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {log.severity.replace('_', ' ')}
                            </span>
                          </td>

                          {/* SHA-256 Hash with Copy */}
                          <td className="py-3 px-3 font-mono text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <span
                                className={`truncate max-w-[110px] ${
                                  isCorrupted ? 'text-rose-600 font-bold' : ''
                                }`}
                                title={log.sha256Hash}
                              >
                                {log.sha256Hash.slice(0, 10)}...{log.sha256Hash.slice(-6)}
                              </span>
                              <button
                                onClick={() => handleCopyHash(log.sha256Hash)}
                                className="text-slate-400 hover:text-slate-600 p-0.5"
                                title="Copy full SHA-256 hash"
                              >
                                {copiedHash === log.sha256Hash ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Inspect Details Button */}
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() =>
                                setExpandedLogId(isExpanded ? null : log.logId)
                              }
                              className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition-colors"
                              title="Inspect raw cryptographic forensic payload"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-sky-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Forensic JSON Card */}
                        {isExpanded && (
                          <tr className="bg-slate-900 text-slate-200">
                            <td colSpan={8} className="p-4 font-mono text-xs">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-2">
                                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                  <Hash className="w-3.5 h-3.5" />
                                  <span>Forensic Audit Packet #{log.logId}</span>
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  NTP Reference: time.nplindia.org
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 text-[11px]">
                                  <div>
                                    <span className="text-slate-400">Block SHA-256: </span>
                                    <span className="text-emerald-300 select-all font-mono break-all">
                                      {log.sha256Hash}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Parent Block Hash: </span>
                                    <span className="text-sky-300 select-all font-mono break-all">
                                      {log.previousHash}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Actor Session: </span>
                                    <span>{log.actorEmail} [{log.role}]</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Client Terminal: </span>
                                    <span>IP {log.ipAddress} (VLAN 10 Clinical Core)</span>
                                  </div>
                                </div>

                                <div className="space-y-1 text-[11px]">
                                  <div>
                                    <span className="text-slate-400">Action: </span>
                                    <span className="text-white font-bold">{log.action}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Target Resource: </span>
                                    <span>{log.resourceType} - {log.resourceId}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">DPDP Privacy Status: </span>
                                    <span className="text-emerald-400">Consent Verified (DPDP Act 2023)</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">TLS Encryption: </span>
                                    <span>TLS_AES_256_GCM_SHA384 (ECDHE-RSA)</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono">
                Showing {filteredAuditLogs.length} of {auditLogs.length} forensic entries
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>NTP Stratum-1 Sync Active (± 0.4ms)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: PRINT OFFICIAL GST TAX INVOICE */}
      {/* ========================================================= */}
      {showInvoicePrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            {/* Action Bar (Top) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Receipt className="w-4 h-4 text-sky-600" />
                <span>GST Tax Invoice (Rule 46 CGST Rules, 2017)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setShowInvoicePrintModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Hospital Invoice Body */}
            <div className="space-y-6 text-slate-900" id="tax-invoice-printable">
              {/* Hospital Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    AURA SUPER SPECIALTY HOSPITAL & RESEARCH INSTITUTE
                  </h2>
                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                    142, Dr. E. Moses Road, Worli, Mumbai, Maharashtra - 400018<br />
                    Phone: +91 22 6900 1000 · Emergency Hotline: 1066<br />
                    <strong className="text-slate-800">GSTIN: 27AABCA1234F1Z5</strong> · State: 27 (Maharashtra)<br />
                    NABH Accredited Tertiary Care Center (HFR: MH-MUM-90124)
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-sm font-bold text-slate-900">TAX INVOICE</div>
                  <div className="mt-1">Invoice No: <strong>{invoiceNumber}</strong></div>
                  <div>Date: <strong>{invoiceDate}</strong></div>
                  <div>Place of Supply: <strong>27 - Maharashtra</strong></div>
                </div>
              </div>

              {/* Patient Details */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-500 font-semibold text-[10px] uppercase">Billed To (Patient)</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{currentPatient.name}</div>
                  <div className="font-mono text-slate-600 mt-0.5">
                    UHID: {currentPatient.uhid} · Age/Gender: {currentPatient.age}Y/{currentPatient.gender}
                  </div>
                  <div className="font-mono text-slate-500">
                    ABHA ID: {currentPatient.abhaId}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-slate-500 font-semibold text-[10px] uppercase">Admission Details</div>
                  <div className="font-medium text-slate-800 mt-0.5">
                    Department: {currentPatient.department}
                  </div>
                  <div className="text-slate-600">
                    Consultant: {currentPatient.attendingDoctor}
                  </div>
                  <div className="text-slate-700 font-medium">
                    Payer Scheme: {billType}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Description of Goods / Services</th>
                    <th className="p-2 text-center">SAC/HSN</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Rate (₹)</th>
                    <th className="p-2 text-right">Tax %</th>
                    <th className="p-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lineItems.map((item, idx) => {
                    const lineBase = item.unitRate * item.quantity;
                    const lineTax = (lineBase * item.taxRatePercent) / 100;
                    return (
                      <tr key={item.id}>
                        <td className="p-2 font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-2 font-semibold text-slate-900">{item.description}</td>
                        <td className="p-2 text-center font-mono text-slate-600">{item.sacHsnCode}</td>
                        <td className="p-2 text-right font-mono">{item.quantity}</td>
                        <td className="p-2 text-right font-mono">₹{item.unitRate.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-right font-mono">{item.taxRatePercent}%</td>
                        <td className="p-2 text-right font-mono font-bold">
                          ₹{(lineBase + lineTax).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals & Tax Breakup */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800">GST Declaration:</div>
                  <p>
                    Specialized healthcare services by clinical establishments are exempt under Notification No. 12/2017-CT(R) (SAC 999312 / 999316). Non-ICU room rents exceeding ₹5,000/day are levied at 12% GST without ITC.
                  </p>
                  <div className="pt-2 font-bold text-slate-800">
                    Payment Status: <span className="text-emerald-700">{paymentStatus}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-right">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-mono">₹{financialSummary.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CGST (Central Tax):</span>
                    <span className="font-mono">₹{financialSummary.cgst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SGST (State Tax):</span>
                    <span className="font-mono">₹{financialSummary.sgst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheme Concession:</span>
                    <span className="font-mono">- ₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm border-t border-slate-300 pt-1 text-slate-900">
                    <span>Net Total:</span>
                    <span className="font-mono">₹{financialSummary.netPayable.toLocaleString('en-IN')}</span>
                  </div>
                  {billType === 'Cashless TPA' && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>TPA Pre-Auth Approved:</span>
                      <span className="font-mono">₹{financialSummary.tpaApproved.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end border-t border-slate-200 text-xs">
                <div>
                  <div className="font-mono text-[10px] text-slate-400">
                    Digitally Signed via AuraHealth Hospital Information System<br />
                    Timestamp: {invoiceDate} 10:14:02 IST
                  </div>
                </div>

                <div className="text-right">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <span className="text-slate-600 font-medium">Authorized Signatory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: RECORD PAYMENT */}
      {/* ========================================================= */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Record Patient Copay Collection</h3>
              </div>
              <button
                onClick={() => setShowRecordPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'UPI_QR', label: 'Dynamic UPI QR' },
                    { id: 'POS_CARD', label: 'POS Card Terminal' },
                    { id: 'NET_BANKING', label: 'Net Banking NEFT' },
                    { id: 'CASH', label: 'Cash Counter' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMode(mode.id as any)}
                      className={`p-2 rounded-lg border text-left font-semibold transition-colors ${
                        paymentMode === mode.id
                          ? 'bg-sky-50 border-sky-400 text-sky-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  value={paymentPaidAmount}
                  onChange={(e) => setPaymentPaidAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Transaction / UTR Reference Number
                </label>
                <input
                  type="text"
                  value={paymentRefNumber}
                  onChange={(e) => setPaymentRefNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800">
                Payment receipt will be automatically transmitted to patient's ABHA health locker and GST credit journal.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRecordPaymentModal(false)}
                className="px-3 py-1.5 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentStatus('PAID');
                  setShowRecordPaymentModal(false);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
              >
                Confirm Receipt & Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: RESPOND TO TPA QUERY */}
      {/* ========================================================= */}
      {tpaQueryModalClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Respond to Insurer Query ({tpaQueryModalClaim.tpaProvider})
                </h3>
              </div>
              <button
                onClick={() => setTpaQueryModalClaim(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                <span className="font-bold block text-[11px] text-amber-800">Insurer Query:</span>
                <p className="mt-1">{tpaQueryModalClaim.queryNote}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Clinical Clarification & Operative Notes Summary
                </label>
                <textarea
                  rows={3}
                  value={tpaQueryResponseText}
                  onChange={(e) => setTpaQueryResponseText(e.target.value)}
                  placeholder="e.g. Primary PCI performed with DES stent. Cath cine CD uploaded via NHCX portal with operator notes attached..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 text-xs"
                />
              </div>

              <div className="p-2.5 bg-slate-100 rounded text-[11px] text-slate-600 flex items-center justify-between">
                <span>Attached: Angiogram_Cine_Report.pdf (3.4 MB)</span>
                <span className="text-emerald-700 font-bold">Encrypted & Ready</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTpaQueryModalClaim(null)}
                className="px-3 py-1.5 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitQueryResponse}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
              >
                Transmit Clarification via NHCX
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: SUBMIT NEW TPA PRE-AUTH CLAIM */}
      {/* ========================================================= */}
      {showNewClaimModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewClaim}
            className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Submit New Cashless TPA Pre-Auth</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewClaimModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Patient UHID
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${currentPatient.name} (${currentPatient.uhid})`}
                  className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Insurance Provider / TPA
                </label>
                <select
                  value={newClaimProvider}
                  onChange={(e) => setNewClaimProvider(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Star Health & Allied Insurance">Star Health & Allied Insurance</option>
                  <option value="HDFC ERGO General Insurance">HDFC ERGO General Insurance</option>
                  <option value="Niva Bupa Health Insurance">Niva Bupa Health Insurance</option>
                  <option value="ICICI Lombard General Insurance">ICICI Lombard General Insurance</option>
                  <option value="Care Health Insurance">Care Health Insurance</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Policy / Member ID
                </label>
                <input
                  type="text"
                  required
                  value={newClaimPolicy}
                  onChange={(e) => setNewClaimPolicy(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Estimated Claim Amount (₹)
                </label>
                <input
                  type="number"
                  min={1000}
                  value={newClaimAmount}
                  onChange={(e) => setNewClaimAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewClaimModal(false)}
                className="px-3 py-1.5 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
              >
                Submit Pre-Auth to NHCX
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: APPEND AUDIT EVENT (CERT-IN) */}
      {/* ========================================================= */}
      {showNewLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAppendAuditEvent}
            className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Record Forensic Audit Event</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewLogModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Actor (Staff Member)
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${currentUser.name} (${currentUser.role} · ${currentUser.email})`}
                  className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Audit Action
                </label>
                <select
                  value={newLogAction}
                  onChange={(e) => setNewLogAction(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                >
                  <option value="VIEW_EMR">VIEW_EMR (Access Patient Record)</option>
                  <option value="UPDATE_INVOICE">UPDATE_INVOICE (Modify Line Items/Discount)</option>
                  <option value="SUBMIT_TPA_CLAIM">SUBMIT_TPA_CLAIM (Pre-Auth Dispatch)</option>
                  <option value="DISPENSE_NARCOTICS">DISPENSE_NARCOTICS (Schedule H1 Drug)</option>
                  <option value="DISCHARGE_PATIENT">DISCHARGE_PATIENT (Clinical Discharge Summary)</option>
                  <option value="EXPORT_FHIR_BUNDLE">EXPORT_FHIR_BUNDLE (ABDM Gateway Push)</option>
                  <option value="CODE_BLUE_BROADCAST">CODE_BLUE_BROADCAST (Emergency Drill)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Resource Description
                </label>
                <input
                  type="text"
                  required
                  value={newLogResource}
                  onChange={(e) => setNewLogResource(e.target.value)}
                  placeholder="e.g. Patient Clinical Record: UHID-2026-84920"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Severity Classification
                </label>
                <select
                  value={newLogSeverity}
                  onChange={(e) => setNewLogSeverity(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="INFO">INFO (Standard Operation)</option>
                  <option value="CRITICAL_CLINICAL">CRITICAL_CLINICAL (High-Alert Patient Intervention)</option>
                  <option value="SECURITY_ALERT">SECURITY_ALERT (Subnet / Access Anomaly)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewLogModal(false)}
                className="px-3 py-1.5 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
              >
                Sign & Cryptographically Chain Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
