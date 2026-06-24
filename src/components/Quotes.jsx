import React, { useState, useRef } from 'react';
import { Search, Plus, Printer, Edit, Eye, RefreshCw, Trash2, X, PlusCircle, FileText, Send, Save, ChevronRight } from 'lucide-react';
import { DB } from '../db/db.js';
import { CostEngine } from '../db/costEngine.js';

export default function Quotes({ quotes, clients, products, settings, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [viewingQuote, setViewingQuote] = useState(null);
  const [editingQuote, setEditingQuote] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [statusChangingQuote, setStatusChangingQuote] = useState(null);
  const printRef = useRef(null);

  // Form States
  const [formNumber, setFormNumber] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formClientContact, setFormClientContact] = useState('');
  const [formProjectName, setFormProjectName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formValidUntil, setFormValidUntil] = useState('');
  const [formPaymentTerms, setFormPaymentTerms] = useState('');
  const [formDeliveryDays, setFormDeliveryDays] = useState('14-21');
  const [formNotes, setFormNotes] = useState('');
  const [formDiscountPct, setFormDiscountPct] = useState(0);
  const [formTaxPct, setFormTaxPct] = useState(14);
  const [formItems, setFormItems] = useState([]);

  const genId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

  const formatCurrency = (val) =>
    (val || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (settings.currency || 'جنيه');

  const formatCurrencyEn = (val) =>
    (val || 0).toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateEn = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusInfo = (status) => {
    const map = {
      draft:    { label: 'مسودة',  en: 'DRAFT',         cls: 'bg-slate-100 text-slate-700 border-slate-200' },
      sent:     { label: 'مرسل',   en: 'SENT',          cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      accepted: { label: 'مقبول', en: 'ACCEPTED',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      rejected: { label: 'مرفوض', en: 'REJECTED',       cls: 'bg-rose-50 text-rose-700 border-rose-200' },
      expired:  { label: 'منتهي',  en: 'EXPIRED',       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    };
    return map[status] || { label: 'غير محدد', en: 'UNKNOWN', cls: 'bg-slate-100 text-slate-600' };
  };

  const getStatusBadge = (status) => {
    const item = getStatusInfo(status);
    return <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${item.cls}`}>{item.label}</span>;
  };

  const genQuoteNumber = () => {
    const count = quotes.length + 1;
    const year = new Date().getFullYear();
    return `QT-${year}-${String(count).padStart(4, '0')}`;
  };

  const dateAdd = (dateStr, days) => {
    const d = new Date(dateStr || new Date());
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const today = () => new Date().toISOString().split('T')[0];

  // ---------- OPEN ADD ----------
  const handleOpenAdd = () => {
    setIsAddMode(true);
    const num = genQuoteNumber();
    const dateToday = today();
    const validity = dateAdd(dateToday, parseInt(settings.quoteValidity) || 30);
    setFormNumber(num);
    setFormClientId(''); setFormClientName(''); setFormClientContact('');
    setFormProjectName('');
    setFormDate(dateToday); setFormValidUntil(validity);
    setFormPaymentTerms(settings.paymentTerms || '80% دفعة مقدمة عند تأكيد الطلب، والباقي خلال 7 أيام من التسليم.');
    setFormDeliveryDays('14-21');
    setFormNotes(''); setFormDiscountPct(0); setFormTaxPct(14);
    setFormItems([]);
    setEditingQuote({ id: 'temp' });
  };

  // ---------- OPEN EDIT ----------
  const handleOpenEdit = (q) => {
    setIsAddMode(false);
    setEditingQuote(q);
    setFormNumber(q.number || '');
    setFormClientId(q.clientId || ''); setFormClientName(q.clientName || ''); setFormClientContact(q.clientContact || '');
    setFormProjectName(q.projectName || '');
    setFormDate(q.date ? q.date.split('T')[0] : '');
    setFormValidUntil(q.validUntil ? q.validUntil.split('T')[0] : '');
    setFormPaymentTerms(q.paymentTerms || '');
    setFormDeliveryDays(q.deliveryDays || '14-21');
    setFormNotes(q.notes || '');
    setFormDiscountPct(q.discountPct || 0);
    setFormTaxPct(q.taxPct ?? 14);
    setFormItems(q.items || []);
  };

  const handleClientSelect = (clientId) => {
    const cli = clients.find(c => c.id === clientId);
    if (cli) { setFormClientId(cli.id); setFormClientName(cli.name); setFormClientContact(cli.contactPerson || ''); }
    else { setFormClientId(''); setFormClientName(''); setFormClientContact(''); }
  };

  // ---------- ITEM MANAGEMENT ----------
  const handleAddItemRow = () => {
    const activeProducts = products.filter(p => p.active !== false);
    if (!activeProducts.length) { alert('لا توجد منتجات نشطة'); return; }
    const firstProd = activeProducts[0];
    const calc = CostEngine.calculate(firstProd);
    setFormItems([...formItems, {
      productId: firstProd.id, productName: firstProd.name,
      unitType: firstProd.unitType, image: firstProd.image || '',
      qty: 1, unitPrice: calc ? calc.finalPrice : 0,
      discountPct: 0, note: '', techNotes: ''
    }]);
  };

  const handleRemoveItemRow = (idx) => setFormItems(formItems.filter((_, i) => i !== idx));

  const handleItemChange = (idx, field, val) => {
    const updated = [...formItems];
    if (field === 'productId') {
      const prod = products.find(p => p.id === val);
      if (prod) {
        const calc = CostEngine.calculate(prod);
        updated[idx] = { ...updated[idx], productId: prod.id, productName: prod.name, unitType: prod.unitType, image: prod.image || '', unitPrice: calc ? calc.finalPrice : 0 };
      }
    } else { updated[idx][field] = val; }
    setFormItems(updated);
  };

  // ---------- TOTALS ----------
  const getLiveQuoteTotals = () => {
    let subtotal = 0;
    const computedItems = formItems.map(item => {
      const s = (item.qty || 0) * (item.unitPrice || 0);
      const d = s * ((item.discountPct || 0) / 100);
      const t = s - d;
      subtotal += t;
      return { ...item, subtotal: s, discountAmt: d, total: t };
    });
    const quoteDiscountAmt = subtotal * ((parseFloat(formDiscountPct) || 0) / 100);
    const afterDiscount = subtotal - quoteDiscountAmt;
    const taxAmt = afterDiscount * ((parseFloat(formTaxPct) || 0) / 100);
    const finalTotal = afterDiscount + taxAmt;
    return { items: computedItems, subtotal, discountPct: parseFloat(formDiscountPct) || 0, discountAmt: quoteDiscountAmt, taxPct: parseFloat(formTaxPct) || 0, taxAmt, total: finalTotal };
  };

  const getQuoteTotals = (q) => {
    let subtotal = 0;
    (q.items || []).forEach(item => { subtotal += (item.total || 0); });
    const discountAmt = subtotal * ((q.discountPct || 0) / 100);
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = afterDiscount * ((q.taxPct ?? 14) / 100);
    return { subtotal, discountAmt, taxAmt, total: afterDiscount + taxAmt };
  };

  const liveTotals = getLiveQuoteTotals();

  // ---------- SAVE ----------
  const handleSaveQuote = (asDraft = true) => {
    if (!formClientName.trim()) { alert('يرجى اختيار عميل أو كتابة اسمه'); return; }
    if (!formItems.length) { alert('يرجى إضافة منتج واحد على الأقل'); return; }
    const totals = getLiveQuoteTotals();
    const data = {
      number: formNumber || genQuoteNumber(),
      clientId: formClientId, clientName: formClientName, clientContact: formClientContact,
      projectName: formProjectName.trim(),
      date: formDate || today(), validUntil: formValidUntil || dateAdd(formDate, 30),
      paymentTerms: formPaymentTerms, deliveryDays: formDeliveryDays,
      notes: formNotes, items: totals.items,
      subtotal: totals.subtotal, discountPct: totals.discountPct,
      discountAmt: totals.discountAmt, taxPct: totals.taxPct,
      taxAmt: totals.taxAmt, total: totals.total,
    };
    if (isAddMode) DB.insert('quotes', { ...data, status: asDraft ? 'draft' : 'sent' });
    else { const prev = DB.getById('quotes', editingQuote.id); DB.update('quotes', editingQuote.id, { ...data, status: prev?.status || 'draft' }); }
    onUpdate();
    setEditingQuote(null);
  };

  // ---------- SET STATUS ----------
  const handleSetStatus = (status) => { DB.update('quotes', statusChangingQuote.id, { status }); onUpdate(); setStatusChangingQuote(null); };

  // ---------- DELETE ----------
  const handleDeleteQuote = (q) => { if (window.confirm(`حذف عرض السعر "${q.number}"؟`)) { DB.delete('quotes', q.id); onUpdate(); } };

  // ---------- PRINT (Premium A4 Design) ----------
  const handlePrint = (q) => {
    const tots = getQuoteTotals(q);
    const heroItem = (q.items || [])[0];
    const heroProduct = heroItem ? products.find(p => p.id === heroItem.productId) : null;
    const heroImg = heroProduct?.image || heroItem?.image || '';
    const companyName = settings.name || 'مصنع الفتح للصناعات الهندسية';
    const statusInfo = getStatusInfo(q.status);

    const itemsRows = (q.items || []).map((item, i) => `
      <tr style="border-bottom:1px solid #e5e9eb;">
        <td style="padding:16px 12px; color:#42474c; font-size:13px; white-space:nowrap;">${i + 1}.${i + 1}</td>
        <td style="padding:16px 12px;">
          <p style="font-weight:700; color:#181c1e; font-size:14px; margin-bottom:6px;">${item.productName || ''}</p>
          ${item.note ? `<p style="color:#73787d; font-size:12px; margin-bottom:10px;">${item.note}</p>` : ''}
          ${item.techNotes ? `
          <div style="background:#f7fafc; border:1px solid #e5e9eb; border-radius:6px; padding:12px; margin-top:8px;">
            <p style="font-size:11px; font-weight:700; color:#02273b; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">Technical Notes:</p>
            <p style="font-size:12px; color:#42474c; white-space:pre-wrap; line-height:1.7;">${item.techNotes}</p>
          </div>` : ''}
        </td>
        <td style="padding:16px 12px; text-align:right; color:#181c1e; font-size:13px; white-space:nowrap;">${item.unitType || '-'}</td>
        <td style="padding:16px 12px; text-align:right; color:#181c1e; font-size:13px; white-space:nowrap;">${(item.qty || 0).toLocaleString('en')}</td>
        <td style="padding:16px 12px; text-align:right; color:#181c1e; font-size:13px; white-space:nowrap;">${formatCurrencyEn(item.unitPrice)}</td>
        <td style="padding:16px 12px; text-align:right; font-weight:700; color:#181c1e; font-size:14px; white-space:nowrap;">${formatCurrencyEn(item.total)}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
<!DOCTYPE html><html lang="en">
<head>
<meta charset="utf-8"/>
<title>Quotation ${q.number} — ${companyName}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{font-family:'IBM Plex Sans',sans-serif;background:#f7fafc;color:#181c1e;padding:24px}
  .page{max-width:960px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .doc-header{padding:40px 48px 32px;border-bottom:1px solid #e5e9eb;display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
  .company-block{}
  .company-name{font-size:22px;font-weight:700;color:#02273b;margin-bottom:4px}
  .company-sub{font-size:12px;color:#73787d;line-height:1.6}
  .doc-meta{text-align:right}
  .doc-title{font-size:42px;font-weight:700;color:#02273b;letter-spacing:-.02em;text-transform:uppercase;margin-bottom:4px}
  .ref{font-size:14px;color:#73787d;margin-bottom:16px}
  .meta-row{display:flex;gap:32px;justify-content:flex-end}
  .meta-item label{display:block;font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#73787d;margin-bottom:2px}
  .meta-item p{font-size:14px;font-weight:600;color:#181c1e}
  .hero{position:relative;height:220px;overflow:hidden;margin:0 48px;border-radius:8px;margin-bottom:0}
  .hero img{width:100%;height:100%;object-fit:cover;object-position:center}
  .hero-grad{position:absolute;inset:0;background:linear-gradient(to right,rgba(2,39,59,.9),rgba(2,39,59,.55),transparent);display:flex;flex-direction:column;justify-content:center;padding:32px 40px}
  .hero-badge{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#86d1ed;margin-bottom:8px}
  .hero-title{font-size:26px;font-weight:700;color:#fff;max-width:380px;line-height:1.3}
  .section{padding:32px 48px}
  .section-divider{display:flex;align-items:center;gap:16px;margin-bottom:24px}
  .section-divider hr{flex:1;border:none;border-top:1px solid #e5e9eb}
  .section-divider h4{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#73787d;white-space:nowrap}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#f7fafc;border-top:1px solid #e5e9eb;border-bottom:1px solid #e5e9eb}
  th{padding:10px 12px;font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#73787d;text-align:left}
  th:last-child,th.r{text-align:right}
  .commercial{background:#f7fafc;margin:0 48px 32px;padding:24px 28px;border-radius:8px;border:1px solid #e5e9eb}
  .commercial h4{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#02273b;margin-bottom:20px}
  .commercial-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
  .commercial-grid label{display:block;font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#73787d;margin-bottom:6px}
  .commercial-grid p{font-size:13px;color:#181c1e;line-height:1.6}
  .signatures-area{padding:32px 48px;border-top:1px solid #e5e9eb;display:flex;justify-content:space-between;align-items:flex-end}
  .sigs{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;width:60%}
  .sig-box{text-align:center}
  .sig-line{height:56px;border-bottom:1px solid #c2c7cd;margin-bottom:8px}
  .sig-label{font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d}
  .totals-box{background:#f7fafc;border:1px solid #e5e9eb;border-radius:8px;padding:20px 24px;min-width:260px}
  .total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#42474c;border-bottom:1px solid #ebeef0}
  .total-row:last-child{border:none;padding-top:12px;font-size:18px;font-weight:700;color:#02273b}
  .status-badge{display:inline-block;font-size:10px;font-weight:600;letter-spacing:.05em;padding:3px 8px;border-radius:4px;background:#97e2fe;color:#00667e}
  .footer-bar{padding:12px 48px;border-top:1px solid #ebeef0;display:flex;justify-content:space-between;align-items:center}
  .footer-badge{background:#e0e3e5;color:#42474c;font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:3px;margin-right:6px}
  .footer-copy{font-size:11px;color:#73787d}
  .client-block{padding:0 48px 32px}
  .client-block label{font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#73787d;display:block;margin-bottom:4px}
  .client-block h2{font-size:20px;font-weight:700;color:#181c1e;margin-bottom:4px}
  .client-block p{font-size:13px;color:#73787d}
  @media print{body{padding:0;background:#fff}.page{box-shadow:none;border-radius:0}}
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="doc-header">
    <div class="company-block">
      <div class="company-name">${companyName}</div>
      <div class="company-sub">
        ${settings.address || ''}<br>
        ${settings.phone ? '📞 ' + settings.phone : ''} ${settings.email ? '| ✉️ ' + settings.email : ''}<br>
        ${settings.taxNo ? 'Tax Reg: ' + settings.taxNo : ''}
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-title">Quotation</div>
      <div class="ref">Reference: ${q.number}</div>
      <div class="meta-row">
        <div class="meta-item"><label>Date</label><p>${formatDateEn(q.date)}</p></div>
        ${q.projectName ? `<div class="meta-item"><label>Project</label><p>${q.projectName}</p></div>` : ''}
        <div class="meta-item"><label>Status</label><p><span class="status-badge">${statusInfo.en}</span></p></div>
      </div>
    </div>
  </div>

  <!-- Client -->
  <div class="client-block">
    <label>Client</label>
    <h2>${q.clientName || ''}</h2>
    ${q.clientContact ? `<p>Attn: ${q.clientContact}</p>` : ''}
  </div>

  <!-- Hero Image -->
  ${heroImg ? `
  <div style="margin:0 48px 40px;border-radius:8px;overflow:hidden;height:200px;position:relative;border:1px solid #e5e9eb">
    <img src="${heroImg}" style="width:100%;height:100%;object-fit:cover;object-position:center"/>
    <div style="position:absolute;inset:0;background:linear-gradient(to right,rgba(2,39,59,.88),rgba(2,39,59,.5),transparent);display:flex;flex-direction:column;justify-content:center;padding:32px 40px">
      <div style="font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#86d1ed;margin-bottom:8px">Primary Fabrication</div>
      <div style="font-size:22px;font-weight:700;color:#fff;max-width:380px;line-height:1.3">${heroItem?.productName || ''}</div>
    </div>
  </div>` : ''}

  <!-- I. Primary Fabrication Schedule -->
  <div class="section" style="padding-top:0">
    <div class="section-divider"><hr/><h4>I. Primary Fabrication Schedule</h4><hr/></div>
    <div style="overflow-x:auto">
      <table>
        <thead>
          <tr>
            <th style="width:60px">Item</th>
            <th>Description</th>
            <th class="r" style="width:70px">Unit</th>
            <th class="r" style="width:90px">Qty</th>
            <th class="r" style="width:110px">Rate (L.E)</th>
            <th class="r" style="width:120px">Total (L.E)</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
    </div>
  </div>

  <!-- Commercial Terms -->
  <div class="commercial">
    <h4>IV. Commercial Terms</h4>
    <div class="commercial-grid">
      <div>
        <label>Payment Structure</label>
        <p>${q.paymentTerms || '—'}</p>
      </div>
      <div>
        <label>Delivery Timeline</label>
        <p>Estimated <strong>${q.deliveryDays || '14-21'} Business Days</strong> from receipt of advance payment and approved drawings.</p>
      </div>
      <div>
        <label>Quote Validity</label>
        <p>Valid until <strong>${formatDateEn(q.validUntil)}</strong>. Subject to material market conditions.</p>
      </div>
    </div>
  </div>

  ${q.notes ? `
  <div style="margin:0 48px 24px;padding:16px 20px;border-radius:6px;border:1px solid #e5e9eb;background:#f7fafc">
    <div style="font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#73787d;margin-bottom:6px">Notes & Remarks</div>
    <p style="font-size:13px;color:#42474c;line-height:1.7;white-space:pre-wrap">${q.notes}</p>
  </div>` : ''}

  <!-- Signatures & Totals -->
  <div class="signatures-area">
    <div class="sigs">
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Sales Management</div></div>
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Contract Control</div></div>
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">General Manager</div></div>
    </div>
    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span>${formatCurrencyEn(tots.subtotal)} L.E</span></div>
      ${(q.discountPct || 0) > 0 ? `<div class="total-row" style="color:#ba1a1a"><span>Discount (${q.discountPct}%)</span><span>-${formatCurrencyEn(tots.discountAmt)} L.E</span></div>` : ''}
      <div class="total-row"><span>VAT (${q.taxPct ?? 14}%)</span><span>${formatCurrencyEn(tots.taxAmt)} L.E</span></div>
      <div class="total-row"><span>Grand Total (L.E)</span><span>${formatCurrencyEn(tots.total)}</span></div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer-bar">
    <div><span class="footer-badge">Confidential</span><span class="footer-badge">${statusInfo.en}</span></div>
    <div class="footer-copy">© ${new Date().getFullYear()} ${companyName}. All Rights Reserved.</div>
  </div>
</div>
<script>window.onload=()=>window.print();<\/script>
</body></html>`);
    printWindow.document.close();
  };

  // ---------- FILTER ----------
  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = (q.number?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (q.clientName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (q.projectName?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch && (activeTab ? q.status === activeTab : true);
  });

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">إدارة عروض الأسعار</h2>
          <p className="text-sm text-slate-500">إنشاء عروض أسعار احترافية بتصميم A4 مميز</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" /> إنشاء عرض سعر جديد
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-sm gap-1">
        {[
          { key: '', label: 'الكل', count: quotes.length },
          { key: 'draft', label: 'مسودات', count: quotes.filter(q => q.status === 'draft').length },
          { key: 'sent', label: 'مرسلة', count: quotes.filter(q => q.status === 'sent').length },
          { key: 'accepted', label: 'مقبولة', count: quotes.filter(q => q.status === 'accepted').length },
          { key: 'rejected', label: 'مرفوضة', count: quotes.filter(q => q.status === 'rejected').length },
          { key: 'expired', label: 'منتهية', count: quotes.filter(q => q.status === 'expired').length },
        ].map(({ key, label, count }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all ${activeTab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="ابحث برقم العرض أو اسم العميل أو المشروع..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50" />
        </div>
      </div>

      {/* Quotes Grid */}
      {filteredQuotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredQuotes.map((q) => {
            const tots = getQuoteTotals(q);
            const heroItem = (q.items || [])[0];
            const heroProduct = heroItem ? products.find(p => p.id === heroItem.productId) : null;
            const heroImg = heroProduct?.image || heroItem?.image || '';
            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md hover:border-slate-200 transition-all">
                {/* Card Hero */}
                <div className="relative h-36 bg-slate-100 overflow-hidden">
                  {heroImg ? (
                    <img src={heroImg} alt={heroItem?.productName} className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between">
                    <span className="text-white font-bold text-sm drop-shadow">{q.number}</span>
                    {getStatusBadge(q.status)}
                  </div>
                </div>
                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{q.clientName}</p>
                    {q.projectName && <p className="text-xs text-slate-400 mt-0.5">{q.projectName}</p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{formatDate(q.date)}</span>
                    <span className="font-bold text-indigo-600 text-sm">{formatCurrency(tots.total)}</span>
                  </div>
                  <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                    <button onClick={() => setViewingQuote(q)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <Eye className="w-3.5 h-3.5" /> معاينة
                    </button>
                    <button onClick={() => handlePrint(q)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                      <Printer className="w-3.5 h-3.5" /> طباعة
                    </button>
                    <button onClick={() => handleOpenEdit(q)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit className="w-3.5 h-3.5" /> تعديل
                    </button>
                    <button onClick={() => setStatusChangingQuote(q)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="تغيير الحالة">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteQuote(q)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="حذف">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <FileText className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">لا توجد عروض أسعار في هذا القسم</p>
          <button onClick={handleOpenAdd} className="mt-4 text-indigo-600 text-sm font-semibold hover:underline">+ إنشاء أول عرض سعر</button>
        </div>
      )}

      {/* ================================================================
          MODAL: VIEW QUOTE — Premium A4 Preview
      ================================================================ */}
      {viewingQuote && (() => {
        const q = viewingQuote;
        const tots = getQuoteTotals(q);
        const heroItem = (q.items || [])[0];
        const heroProduct = heroItem ? products.find(p => p.id === heroItem.productId) : null;
        const heroImg = heroProduct?.image || heroItem?.image || '';
        const statusInfo = getStatusInfo(q.status);

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4">
            {/* Floating action bar */}
            <div className="sticky top-4 z-10 flex justify-between items-center max-w-4xl mx-auto mb-4">
              <button onClick={() => setViewingQuote(null)}
                className="flex items-center gap-2 bg-white/90 backdrop-blur text-slate-700 font-semibold text-sm px-4 py-2 rounded-xl shadow-md hover:bg-white transition-all">
                <X className="w-4 h-4" /> إغلاق
              </button>
              <div className="flex gap-2">
                <button onClick={() => { setViewingQuote(null); handleOpenEdit(q); }}
                  className="flex items-center gap-2 bg-white/90 backdrop-blur text-slate-700 font-semibold text-sm px-4 py-2 rounded-xl shadow-md hover:bg-white transition-all">
                  <Edit className="w-4 h-4" /> تعديل
                </button>
                <button onClick={() => handlePrint(q)}
                  className="flex items-center gap-2 bg-indigo-600 text-white font-semibold text-sm px-5 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition-all">
                  <Printer className="w-4 h-4" /> طباعة / PDF
                </button>
              </div>
            </div>

            {/* A4 Document */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {/* Top accent */}
              <div className="h-1.5 bg-gradient-to-r from-[#02273b] to-[#006780]" />

              {/* Document Header */}
              <div className="px-10 pt-10 pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                  <div className="text-lg font-bold text-[#02273b]">{settings.name || 'مصنع الفتح للصناعات الهندسية'}</div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {settings.address}<br/>
                    {settings.phone && `📞 ${settings.phone}`}{settings.email && ` | ✉️ ${settings.email}`}
                  </div>
                  {q.clientName && (
                    <div className="mt-5">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Client</div>
                      <div className="font-bold text-slate-900 text-base">{q.clientName}</div>
                      {q.clientContact && <div className="text-xs text-slate-500 mt-0.5">Attn: {q.clientContact}</div>}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-4xl font-bold text-[#02273b] uppercase tracking-tight">Quotation</div>
                  <div className="text-sm text-slate-400 mt-1 mb-4">Reference: {q.number}</div>
                  <div className="flex gap-6 justify-end text-right">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Date</div>
                      <div className="text-sm font-semibold text-slate-800">{formatDateEn(q.date)}</div>
                    </div>
                    {q.projectName && (
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Project</div>
                        <div className="text-sm font-semibold text-slate-800">{q.projectName}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Status</div>
                      <div>{getStatusBadge(q.status)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Product Image */}
              {heroImg && (
                <div className="relative h-52 overflow-hidden">
                  <img src={heroImg} alt={heroItem?.productName} className="w-full h-full object-cover object-center" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#02273b]/90 via-[#02273b]/55 to-transparent flex flex-col justify-center px-10">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[#86d1ed] mb-2">Primary Fabrication</div>
                    <div className="text-2xl font-bold text-white max-w-xs leading-tight">{heroItem?.productName}</div>
                  </div>
                </div>
              )}

              {/* I. Items Table */}
              <div className="px-10 py-8">
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">I. Primary Fabrication Schedule</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-100">
                        <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-left w-16">Item</th>
                        <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-left">Description</th>
                        <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right w-20">Unit</th>
                        <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right w-24">Qty</th>
                        <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right w-28">Rate (L.E)</th>
                        <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right w-32">Total (L.E)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(q.items || []).map((item, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="py-5 px-4 text-slate-400 text-xs">{i + 1}.{i + 1}</td>
                          <td className="py-5 px-4">
                            <p className="font-bold text-slate-900 mb-1">{item.productName}</p>
                            {item.note && <p className="text-xs text-slate-400 mb-2">{item.note}</p>}
                            {item.techNotes && (
                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#02273b] mb-2">Technical Notes:</p>
                                <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">{item.techNotes}</p>
                              </div>
                            )}
                          </td>
                          <td className="py-5 px-4 text-right text-slate-600 text-xs">{item.unitType || '-'}</td>
                          <td className="py-5 px-4 text-right text-slate-800 font-semibold text-xs">{(item.qty || 0).toLocaleString('en')}</td>
                          <td className="py-5 px-4 text-right text-slate-600 text-xs">{formatCurrencyEn(item.unitPrice)}</td>
                          <td className="py-5 px-4 text-right font-bold text-slate-900">{formatCurrencyEn(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Commercial Terms */}
              <div className="mx-10 mb-8 bg-slate-50 rounded-xl border border-slate-200 p-6">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#02273b] mb-4">IV. Commercial Terms</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Payment Structure</div>
                    <p className="text-xs text-slate-700 leading-relaxed">{q.paymentTerms || '—'}</p>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Delivery Timeline</div>
                    <p className="text-xs text-slate-700 leading-relaxed"><strong>{q.deliveryDays || '14-21'} Business Days</strong> from advance payment receipt.</p>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Quote Validity</div>
                    <p className="text-xs text-slate-700 leading-relaxed">Valid until <strong>{formatDateEn(q.validUntil)}</strong>.</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {q.notes && (
                <div className="mx-10 mb-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-2">Notes & Remarks</div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{q.notes}</p>
                </div>
              )}

              {/* Signatures + Totals */}
              <div className="px-10 pb-10 border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="grid grid-cols-3 gap-6 flex-1">
                  {['Sales Management', 'Contract Control', 'General Manager'].map((s) => (
                    <div key={s} className="text-center">
                      <div className="h-14 border-b border-slate-300 mb-2" />
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{s}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#02273b] text-white rounded-xl p-6 min-w-[240px] shadow-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>{formatCurrencyEn(tots.subtotal)}</span></div>
                    {(q.discountPct || 0) > 0 && <div className="flex justify-between text-rose-300"><span>Discount ({q.discountPct}%)</span><span>-{formatCurrencyEn(tots.discountAmt)}</span></div>}
                    <div className="flex justify-between text-slate-300"><span>VAT ({q.taxPct ?? 14}%)</span><span>{formatCurrencyEn(tots.taxAmt)}</span></div>
                    <div className="h-px bg-white/20 my-2" />
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-slate-300 uppercase tracking-wider">Grand Total</span>
                      <span className="text-xl font-bold text-white">{formatCurrencyEn(tots.total)} L.E</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-10 py-4 flex justify-between items-center bg-slate-50">
                <div className="flex gap-2">
                  <span className="bg-slate-200 text-slate-500 text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded">Confidential</span>
                  <span className="bg-slate-200 text-slate-500 text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded">{statusInfo.en}</span>
                </div>
                <div className="text-xs text-slate-400">© {new Date().getFullYear()} {settings.name}. All Rights Reserved.</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================================================================
          MODAL: CREATE / EDIT QUOTE — Builder Form
      ================================================================ */}
      {editingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="bg-[#02273b] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#86d1ed]" />
                <h3 className="font-bold">{isAddMode ? 'إنشاء عرض سعر جديد' : `تعديل عرض السعر: ${editingQuote.number || ''}`}</h3>
              </div>
              <button onClick={() => setEditingQuote(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-grow">
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Form Fields */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Basic Info */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                    <h4 className="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-indigo-500" /> بيانات العرض الأساسية
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">رقم عرض السعر</label>
                        <input type="text" value={formNumber} onChange={(e) => setFormNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">العميل</label>
                        <select value={formClientId} onChange={(e) => handleClientSelect(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                          <option value="">-- اختر عميلاً --</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company || 'شخصي'}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">اسم العميل (يدوي)</label>
                        <input type="text" value={formClientName} onChange={(e) => setFormClientName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          placeholder="اسم الشركة / الشخص" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">عناية (Attn.)</label>
                        <input type="text" value={formClientContact} onChange={(e) => setFormClientContact(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          placeholder="م. أحمد محمود" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">اسم المشروع</label>
                        <input type="text" value={formProjectName} onChange={(e) => setFormProjectName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          placeholder="مثال: مشروع التبريد المركزي — الدور الأول" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">تاريخ الإصدار</label>
                        <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">صالح حتى</label>
                        <input type="date" value={formValidUntil} onChange={(e) => setFormValidUntil(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                      </div>
                    </div>
                  </div>

                  {/* Items Builder */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-indigo-500" /> بنود عرض السعر
                      </h4>
                      <button type="button" onClick={handleAddItemRow}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all">
                        <PlusCircle className="w-3.5 h-3.5" /> إضافة بند
                      </button>
                    </div>
                    <div className="space-y-4">
                      {formItems.map((item, idx) => {
                        const heroProduct = products.find(p => p.id === item.productId);
                        const heroImg = heroProduct?.image || item.image || '';
                        return (
                          <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {/* Item header with product image */}
                            {heroImg && (
                              <div className="relative h-24 overflow-hidden">
                                <img src={heroImg} alt={item.productName} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#02273b]/75 to-transparent flex items-center px-4">
                                  <span className="text-white font-bold text-xs">{item.productName}</span>
                                </div>
                              </div>
                            )}
                            <div className="p-4 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">المنتج</label>
                                  <select value={item.productId} onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50">
                                    {products.filter(p => p.active !== false).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">الكمية ({item.unitType})</label>
                                  <input type="number" value={item.qty || ''} onChange={(e) => handleItemChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" step="0.001" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">سعر الوحدة</label>
                                  <input type="number" value={item.unitPrice || ''} onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" step="0.01" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">ملاحظات البند</label>
                                  <input type="text" value={item.note || ''} onChange={(e) => handleItemChange(idx, 'note', e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="مواصفات مختصرة..." />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">خصم البند (%)</label>
                                  <input type="number" value={item.discountPct || ''} onChange={(e) => handleItemChange(idx, 'discountPct', parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" max="100" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-400 mb-1">الملاحظات الفنية (Technical Notes)</label>
                                <textarea value={item.techNotes || ''} onChange={(e) => handleItemChange(idx, 'techNotes', e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  rows="2" placeholder="مثال: 1. الصاج مجلفن 275 g/m²&#10;2. حسب مواصفات SMACNA" />
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <span className="text-xs font-bold text-emerald-600">
                                  الإجمالي: {formatCurrency((item.qty || 0) * (item.unitPrice || 0) * (1 - (item.discountPct || 0) / 100))}
                                </span>
                                <button type="button" onClick={() => handleRemoveItemRow(idx)}
                                  className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold">
                                  <Trash2 className="w-3.5 h-3.5" /> حذف البند
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {!formItems.length && (
                        <div className="text-center text-xs text-slate-400 py-6 border-2 border-dashed border-slate-200 rounded-xl">
                          لا توجد بنود مضافة. اضغط «إضافة بند» لإضافة أول منتج.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <label className="block text-xs font-semibold text-slate-500 mb-2">شروط الدفع</label>
                      <textarea value={formPaymentTerms} onChange={(e) => setFormPaymentTerms(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" rows="3" />
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <label className="block text-xs font-semibold text-slate-500 mb-2">ملاحظات إضافية</label>
                      <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" rows="3" />
                    </div>
                  </div>
                </div>

                {/* RIGHT: Live Summary */}
                <div className="space-y-4">
                  <div className="bg-[#02273b] text-white rounded-2xl p-5 sticky top-0 space-y-4">
                    <h4 className="text-xs font-bold text-[#86d1ed] uppercase tracking-wider border-b border-white/10 pb-2">الحساب التلقائي</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-slate-300">
                        <span>إجمالي البنود:</span>
                        <span>{formatCurrency(liveTotals.subtotal)}</span>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">الخصم الإضافي (%)</label>
                        <input type="number" value={formDiscountPct} onChange={(e) => setFormDiscountPct(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#86d1ed]" min="0" max="100" />
                      </div>
                      {liveTotals.discountPct > 0 && (
                        <div className="flex justify-between text-rose-300 font-semibold text-xs">
                          <span>الخصم الإضافي:</span>
                          <span>-{formatCurrency(liveTotals.discountAmt)}</span>
                        </div>
                      )}
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">ضريبة القيمة المضافة (%)</label>
                        <input type="number" value={formTaxPct} onChange={(e) => setFormTaxPct(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#86d1ed]" min="0" max="100" />
                      </div>
                      <div className="flex justify-between text-slate-300 text-xs">
                        <span>الضريبة ({formTaxPct}%):</span>
                        <span>+{formatCurrency(liveTotals.taxAmt)}</span>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div className="flex justify-between font-bold text-lg text-emerald-400">
                        <span>الإجمالي النهائي:</span>
                        <span>{formatCurrency(liveTotals.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Days */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">مدة التسليم (أيام عمل)</label>
                    <input type="text" value={formDeliveryDays} onChange={(e) => setFormDeliveryDays(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      placeholder="14-21" />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
              <button type="button" onClick={() => setEditingQuote(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-semibold transition-colors">
                إلغاء
              </button>
              <button type="button" onClick={() => handleSaveQuote(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                <Save className="w-4 h-4" /> حفظ كمسودة
              </button>
              <button type="button" onClick={() => handleSaveQuote(false)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                <Send className="w-4 h-4" /> حفظ وإرسال
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          MODAL: Change Status
      ================================================================ */}
      {statusChangingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">تغيير حالة عرض السعر</h3>
              <button onClick={() => setStatusChangingQuote(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-2">
              <p className="text-xs text-slate-400 mb-3">اختر الحالة الجديدة لـ <span className="font-bold text-slate-700">{statusChangingQuote.number}</span>:</p>
              {['draft', 'sent', 'accepted', 'rejected', 'expired'].map((s) => {
                const info = getStatusInfo(s);
                return (
                  <button key={s} onClick={() => handleSetStatus(s)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-xs font-semibold transition-all ${statusChangingQuote.status === s ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                    <span>{info.label}</span>
                    <span className={`px-2 py-0.5 rounded-full border ${info.cls}`}>{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
