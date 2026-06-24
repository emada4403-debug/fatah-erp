import React, { useState } from 'react';
import { Search, Plus, Printer, Edit, Eye, RefreshCw, Trash2, X, PlusCircle, FileText, Send, Save, ChevronRight, Layers } from 'lucide-react';
import { DB } from '../db/db.js';
import { CostEngine } from '../db/costEngine.js';

// ─── Pre-filled tech notes per product type ───────────────────────────────
const TECH_NOTES = {
  galvanized: `1. For slip & drive connection the weight includes slip & drive transverse connection.\n2. For TDF flange connection the price does not include corners and G-clamps.\n3. For TDC flange connection the price does not include corners and G-clamps.\n4. Galvanized duct gauges will be according to project specifications.\n5. Thickness: according to SMACNA.\n6. Material: Galvanized sheet metals 275 g/m².`,
  black: `1. Supply & manufacturing of black sheet metal ducts for kitchen/industrial ventilation.\n2. Welding: continuous TIG weld, oil and heat resistant.\n3. Surface treatment: heat-resistant paint coating, suitable up to 350°C.\n4. Thickness: according to SMACNA specifications.\n5. Material: Black steel sheet (St37).`,
  general: '',
};

const SUPPLEMENTS = {
  galvanized: {
    workmanship: [
      { desc: 'Round cut duct (4" to 10")', price: '120.00' },
      { desc: 'Round cut duct (12" to 18")', price: '220.00' },
      { desc: 'Round cut duct (Over 20")', price: '470.00' },
    ],
    transformation: [
      { desc: 'Square to round up to 10"', price: '120.00' },
      { desc: 'Square to round from 12" to 20"', price: '220.00' },
      { desc: 'Square to round from 22" to 30"', price: '470.00' },
    ],
  },
  black: {
    workmanship: [
      { desc: 'Round cut duct (4" to 10")', price: '120.00' },
      { desc: 'Round cut duct (12" to 18")', price: '220.00' },
      { desc: 'Round cut duct (Over 20")', price: '470.00' },
    ],
    transformation: [],
  },
  general: { workmanship: [], transformation: [] },
};

// ─── Stamp SVG component (for React preview) ─────────────────────────────
const Stamp = () => (
  <div className="relative flex-shrink-0" style={{ width: 130, height: 130 }}>
    <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'rotate(-12deg)', opacity: 0.72 }}>
      <div className="relative w-full h-full">
        {/* Outer ring */}
        <svg viewBox="0 0 130 130" className="w-full h-full absolute inset-0">
          <circle cx="65" cy="65" r="60" fill="none" stroke="#02273b" strokeWidth="3"/>
          <circle cx="65" cy="65" r="52" fill="none" stroke="#02273b" strokeWidth="1"/>
          {/* Arc text top */}
          <defs>
            <path id="topArc" d="M 15,65 A 50,50 0 0,1 115,65"/>
            <path id="botArc" d="M 20,80 A 50,50 0 0,0 110,80"/>
          </defs>
          <text fontSize="8.5" fontWeight="700" letterSpacing="2.5" fill="#02273b" fontFamily="IBM Plex Sans, sans-serif">
            <textPath href="#topArc" startOffset="5%">AL-FATH ENGINEERING INDUSTRIES</textPath>
          </text>
          <text fontSize="7.5" fontWeight="600" letterSpacing="2" fill="#006780" fontFamily="IBM Plex Sans, sans-serif">
            <textPath href="#botArc" startOffset="15%">EST. 1985 · EGYPT</textPath>
          </text>
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <div className="text-[7px] font-bold tracking-widest uppercase text-[#02273b]">QUOTATION</div>
          <div className="w-10 h-px bg-[#02273b]" />
          <div className="text-[14px] font-black tracking-wider text-[#02273b] leading-none">APPROVED</div>
          <div className="w-10 h-px bg-[#02273b]" />
          <div className="text-[7px] font-semibold tracking-wider text-[#006780]">{new Date().getFullYear()}</div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Stamp HTML string (for print window) ────────────────────────────────
const STAMP_HTML = `
<div style="position:absolute;top:50%;left:55%;transform:translate(-50%,-50%) rotate(-12deg);opacity:0.7;pointer-events:none;width:130px;height:130px">
  <svg viewBox="0 0 130 130" style="width:100%;height:100%;position:absolute;inset:0">
    <circle cx="65" cy="65" r="60" fill="none" stroke="#02273b" stroke-width="3"/>
    <circle cx="65" cy="65" r="52" fill="none" stroke="#02273b" stroke-width="1"/>
    <defs>
      <path id="ta" d="M 15,65 A 50,50 0 0,1 115,65"/>
      <path id="ba" d="M 20,80 A 50,50 0 0,0 110,80"/>
    </defs>
    <text font-size="8.5" font-weight="700" letter-spacing="2.5" fill="#02273b" font-family="IBM Plex Sans,sans-serif">
      <textPath href="#ta" startOffset="5%">AL-FATH ENGINEERING INDUSTRIES</textPath>
    </text>
    <text font-size="7.5" font-weight="600" letter-spacing="2" fill="#006780" font-family="IBM Plex Sans,sans-serif">
      <textPath href="#ba" startOffset="15%">EST. 1985 · EGYPT</textPath>
    </text>
  </svg>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px">
    <div style="font-size:7px;font-weight:700;letter-spacing:3px;color:#02273b;text-transform:uppercase">QUOTATION</div>
    <div style="width:38px;height:1px;background:#02273b"></div>
    <div style="font-size:15px;font-weight:900;letter-spacing:2px;color:#02273b;line-height:1">APPROVED</div>
    <div style="width:38px;height:1px;background:#02273b"></div>
    <div style="font-size:7px;font-weight:600;letter-spacing:2px;color:#006780">${new Date().getFullYear()}</div>
  </div>
</div>`;

export default function Quotes({ quotes, clients, products, settings, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [viewingQuote, setViewingQuote] = useState(null);
  const [editingQuote, setEditingQuote] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [statusChangingQuote, setStatusChangingQuote] = useState(null);

  // Form state
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
  const [formProductType, setFormProductType] = useState('galvanized');

  // ── Helpers ──────────────────────────────────────────────────────────────
  const companyNameEn = settings.nameEn || 'Al-Fath Engineering Industries';
  const companyAddressEn = settings.addressEn || 'Industrial Zone, 10th of Ramadan City, Egypt';

  const fmtAR = (val) =>
    (val || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (settings.currency || 'جنيه');
  const fmtEN = (val) =>
    (val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtDateEN = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const fmtDateAR = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const today = () => new Date().toISOString().split('T')[0];
  const dateAdd = (ds, n) => { const d = new Date(ds || new Date()); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
  const genNum = () => `QT-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(4, '0')}`;

  const statusInfo = (s) => ({
    draft:    { ar: 'مسودة',  en: 'DRAFT',    cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    sent:     { ar: 'مرسل',   en: 'SENT',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    accepted: { ar: 'مقبول',  en: 'ACCEPTED', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { ar: 'مرفوض', en: 'REJECTED',  cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    expired:  { ar: 'منتهي',  en: 'EXPIRED',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  }[s] || { ar: 'غير محدد', en: 'UNKNOWN', cls: 'bg-slate-100 text-slate-600' });

  const badge = (s) => {
    const i = statusInfo(s);
    return <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${i.cls}`}>{i.ar}</span>;
  };

  const calcTotals = (q) => {
    const subtotal = (q.items || []).reduce((acc, it) => acc + (it.total || 0), 0);
    const discountAmt = subtotal * ((q.discountPct || 0) / 100);
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = afterDiscount * ((q.taxPct ?? 14) / 100);
    return { subtotal, discountAmt, taxAmt, total: afterDiscount + taxAmt };
  };

  // ── Open forms ────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setIsAddMode(true);
    const td = today();
    setFormNumber(genNum()); setFormClientId(''); setFormClientName(''); setFormClientContact('');
    setFormProjectName(''); setFormDate(td); setFormValidUntil(dateAdd(td, parseInt(settings.quoteValidity) || 30));
    setFormPaymentTerms('80% down payment upon order confirmation. Balance due within 7 days of delivery.');
    setFormDeliveryDays('14-21'); setFormNotes(''); setFormDiscountPct(0); setFormTaxPct(14);
    setFormProductType('galvanized'); setFormItems([]);
    setEditingQuote({ id: 'temp' });
  };

  const handleOpenEdit = (q) => {
    setIsAddMode(false); setEditingQuote(q);
    setFormNumber(q.number || ''); setFormClientId(q.clientId || '');
    setFormClientName(q.clientName || ''); setFormClientContact(q.clientContact || '');
    setFormProjectName(q.projectName || '');
    setFormDate(q.date?.split('T')[0] || ''); setFormValidUntil(q.validUntil?.split('T')[0] || '');
    setFormPaymentTerms(q.paymentTerms || ''); setFormDeliveryDays(q.deliveryDays || '14-21');
    setFormNotes(q.notes || ''); setFormDiscountPct(q.discountPct || 0); setFormTaxPct(q.taxPct ?? 14);
    setFormProductType(q.productType || 'galvanized'); setFormItems(q.items || []);
  };

  const handleClientSelect = (id) => {
    const c = clients.find(x => x.id === id);
    if (c) { setFormClientId(c.id); setFormClientName(c.name); setFormClientContact(c.contactPerson || ''); }
    else { setFormClientId(''); setFormClientName(''); setFormClientContact(''); }
  };

  const handleProductTypeChange = (type) => {
    setFormProductType(type);
    // Update tech notes on all existing items
    setFormItems(prev => prev.map(it => ({ ...it, techNotes: TECH_NOTES[type] })));
  };

  // ── Item management ───────────────────────────────────────────────────────
  const handleAddItem = () => {
    // Filter products by type if specialized
    const typeMap = { galvanized: 'cat_galvanized', black: 'cat_black', general: null };
    const catFilter = typeMap[formProductType];
    let pool = products.filter(p => p.active !== false);
    if (catFilter) pool = pool.filter(p => p.categoryId === catFilter);
    if (!pool.length) pool = products.filter(p => p.active !== false);
    if (!pool.length) { alert('لا توجد منتجات نشطة'); return; }
    const prod = pool[0];
    const calc = CostEngine.calculate(prod);
    setFormItems([...formItems, {
      productId: prod.id, productName: prod.name,
      unitType: prod.unitType, image: prod.image || '',
      qty: 1, unitPrice: calc ? calc.finalPrice : 0,
      discountPct: 0, note: '',
      techNotes: TECH_NOTES[formProductType],
    }]);
  };

  const handleRemoveItem = (idx) => setFormItems(formItems.filter((_, i) => i !== idx));

  const handleItemChange = (idx, field, val) => {
    const updated = [...formItems];
    if (field === 'productId') {
      const prod = products.find(p => p.id === val);
      if (prod) {
        const calc = CostEngine.calculate(prod);
        updated[idx] = { ...updated[idx], productId: prod.id, productName: prod.name, unitType: prod.unitType, image: prod.image || '', unitPrice: calc ? calc.finalPrice : 0 };
      }
    } else updated[idx][field] = val;
    setFormItems(updated);
  };

  // ── Live totals ───────────────────────────────────────────────────────────
  const liveTotals = (() => {
    let subtotal = 0;
    const items = formItems.map(it => {
      const s = (it.qty || 0) * (it.unitPrice || 0);
      const d = s * ((it.discountPct || 0) / 100);
      const t = s - d;
      subtotal += t;
      return { ...it, subtotal: s, discountAmt: d, total: t };
    });
    const discountAmt = subtotal * ((parseFloat(formDiscountPct) || 0) / 100);
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = afterDiscount * ((parseFloat(formTaxPct) || 0) / 100);
    return { items, subtotal, discountPct: parseFloat(formDiscountPct) || 0, discountAmt, taxPct: parseFloat(formTaxPct) || 0, taxAmt, total: afterDiscount + taxAmt };
  })();

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = (asDraft = true) => {
    if (!formClientName.trim()) { alert('يرجى إدخال اسم العميل'); return; }
    if (!liveTotals.items.length) { alert('يرجى إضافة بند واحد على الأقل'); return; }
    const data = {
      number: formNumber || genNum(), productType: formProductType,
      clientId: formClientId, clientName: formClientName, clientContact: formClientContact,
      projectName: formProjectName.trim(), date: formDate || today(),
      validUntil: formValidUntil || dateAdd(formDate, 30),
      paymentTerms: formPaymentTerms, deliveryDays: formDeliveryDays,
      notes: formNotes, items: liveTotals.items,
      subtotal: liveTotals.subtotal, discountPct: liveTotals.discountPct,
      discountAmt: liveTotals.discountAmt, taxPct: liveTotals.taxPct,
      taxAmt: liveTotals.taxAmt, total: liveTotals.total,
    };
    if (isAddMode) DB.insert('quotes', { ...data, status: asDraft ? 'draft' : 'sent' });
    else { const prev = DB.getById('quotes', editingQuote.id); DB.update('quotes', editingQuote.id, { ...data, status: prev?.status || 'draft' }); }
    onUpdate();
    setEditingQuote(null);
  };

  const handleSetStatus = (s) => { DB.update('quotes', statusChangingQuote.id, { status: s }); onUpdate(); setStatusChangingQuote(null); };
  const handleDelete = (q) => { if (window.confirm(`حذف "${q.number}"?`)) { DB.delete('quotes', q.id); onUpdate(); } };

  // ── Print ────────────────────────────────────────────────────────────────
  const handlePrint = (q) => {
    const tots = calcTotals(q);
    const heroItem = (q.items || [])[0];
    const heroImg = products.find(p => p.id === heroItem?.productId)?.image || heroItem?.image || '';
    const supps = SUPPLEMENTS[q.productType || 'galvanized'] || SUPPLEMENTS.general;

    const itemsHTML = (q.items || []).map((it, i) => `
      <tr style="border-bottom:1px solid #e5e9eb;">
        <td style="padding:14px 12px;color:#73787d;font-size:12px">${i + 1}.${i + 1}</td>
        <td style="padding:14px 12px">
          <p style="font-weight:700;color:#181c1e;font-size:14px;margin-bottom:4px">${it.productName || ''}</p>
          ${it.note ? `<p style="color:#73787d;font-size:12px;margin-bottom:8px">${it.note}</p>` : ''}
          ${it.techNotes ? `
          <div style="background:#f7fafc;border:1px solid #e5e9eb;border-radius:6px;padding:12px;margin-top:6px">
            <p style="font-size:10px;font-weight:700;color:#02273b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Technical Notes:</p>
            <p style="font-size:12px;color:#42474c;white-space:pre-wrap;line-height:1.8">${it.techNotes}</p>
          </div>` : ''}
        </td>
        <td style="padding:14px 12px;text-align:right;font-size:13px;color:#181c1e;white-space:nowrap">${it.unitType || '—'}</td>
        <td style="padding:14px 12px;text-align:right;font-size:13px;color:#181c1e;white-space:nowrap">${(it.qty || 0).toLocaleString('en')}</td>
        <td style="padding:14px 12px;text-align:right;font-size:13px;color:#181c1e;white-space:nowrap">${fmtEN(it.unitPrice)}</td>
        <td style="padding:14px 12px;text-align:right;font-size:14px;font-weight:700;color:#181c1e;white-space:nowrap">${fmtEN(it.total)}</td>
      </tr>`).join('');

    const wkHTML = supps.workmanship.length ? `
      <div>
        <h5 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#02273b;margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <span style="width:16px;height:1px;background:#02273b;display:inline-block"></span> Assembly Workmanship
        </h5>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#f7fafc;border-top:1px solid #e5e9eb;border-bottom:1px solid #e5e9eb">
            <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#73787d">Description</th>
            <th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#73787d">Price (L.E / pc)</th>
          </tr></thead>
          <tbody>${supps.workmanship.map((r, i) => `
            <tr style="border-bottom:1px solid #ebeef0;background:${i%2===1?'#f7fafc':'#fff'}">
              <td style="padding:10px">${r.desc}</td>
              <td style="padding:10px;text-align:right;font-weight:600;color:#02273b">${r.price}</td>
            </tr>`).join('')}</tbody>
        </table>
      </div>` : '';

    const trHTML = supps.transformation.length ? `
      <div>
        <h5 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#02273b;margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <span style="width:16px;height:1px;background:#02273b;display:inline-block"></span> Transformation Surcharges
        </h5>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#f7fafc;border-top:1px solid #e5e9eb;border-bottom:1px solid #e5e9eb">
            <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#73787d">Description</th>
            <th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#73787d">Price (L.E / pc)</th>
          </tr></thead>
          <tbody>${supps.transformation.map((r, i) => `
            <tr style="border-bottom:1px solid #ebeef0;background:${i%2===1?'#f7fafc':'#fff'}">
              <td style="padding:10px">${r.desc}</td>
              <td style="padding:10px;text-align:right;font-weight:600;color:#02273b">${r.price}</td>
            </tr>`).join('')}</tbody>
        </table>
      </div>` : '';

    const pw = window.open('', '_blank');
    pw.document.write(`<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><title>Quotation ${q.number}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'IBM Plex Sans',sans-serif;background:#f7fafc;padding:20px}
.page{max-width:980px;margin:0 auto;background:#fff;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,.1)}
.accent{height:6px;background:linear-gradient(to right,#02273b,#006780)}
.dh{padding:36px 48px 28px;border-bottom:1px solid #e5e9eb;display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
.cn{font-size:20px;font-weight:700;color:#02273b;margin-bottom:4px}
.ci{font-size:11px;color:#73787d;line-height:1.7}
.dt{text-align:right}.qt{font-size:40px;font-weight:700;color:#02273b;letter-spacing:-.02em;text-transform:uppercase;margin-bottom:2px}
.qr{font-size:13px;color:#73787d;margin-bottom:14px}
.mr{display:flex;gap:28px;justify-content:flex-end}
.mi label{display:block;font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d;margin-bottom:2px}
.mi p{font-size:13px;font-weight:600;color:#181c1e}
.cl{padding:16px 48px 28px}
.cl label{font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d;display:block;margin-bottom:4px}
.cl h2{font-size:18px;font-weight:700;color:#181c1e;margin-bottom:2px}
.cl p{font-size:12px;color:#73787d}
.hero{position:relative;height:200px;overflow:hidden;margin:0 48px;border-radius:8px}
.hero img{width:100%;height:100%;object-fit:cover}
.hg{position:absolute;inset:0;background:linear-gradient(to right,rgba(2,39,59,.9),rgba(2,39,59,.55),transparent);display:flex;flex-direction:column;justify-content:center;padding:36px 40px}
.hb{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#86d1ed;margin-bottom:6px}
.ht{font-size:24px;font-weight:700;color:#fff;max-width:340px;line-height:1.3}
.sec{padding:28px 48px}
.sdiv{display:flex;align-items:center;gap:16px;margin-bottom:20px}
.sdiv hr{flex:1;border:none;border-top:1px solid #e5e9eb}
.sdiv h4{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#73787d;white-space:nowrap}
table.items{width:100%;border-collapse:collapse}
table.items thead tr{background:#f7fafc;border-top:1px solid #e5e9eb;border-bottom:1px solid #e5e9eb}
table.items th{padding:10px 12px;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#73787d;text-align:left}
.comm{background:#f7fafc;margin:0 48px 28px;padding:22px 28px;border-radius:8px;border:1px solid #e5e9eb}
.comm h4{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#02273b;margin-bottom:18px}
.cg{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.cg label{display:block;font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d;margin-bottom:4px}
.cg p{font-size:12px;color:#181c1e;line-height:1.6}
.sigs{padding:28px 48px;border-top:1px solid #e5e9eb;display:flex;justify-content:space-between;align-items:flex-end;position:relative}
.sg{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;width:60%}
.sb{text-align:center}
.sl{height:50px;border-bottom:1px solid #c2c7cd;margin-bottom:6px}
.sl2{font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d}
.tot{background:#02273b;color:#fff;padding:22px 24px;min-width:240px;border-radius:8px}
.tr2{display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:rgba(255,255,255,.65);border-bottom:1px solid rgba(255,255,255,.1)}
.tr2:last-child{border:none;padding-top:10px;font-size:18px;font-weight:700;color:#fff}
.fbar{padding:10px 48px;border-top:1px solid #ebeef0;display:flex;justify-content:space-between;align-items:center;background:#f7fafc}
.fb{background:#e0e3e5;color:#42474c;font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:3px;margin-right:6px}
.fc{font-size:10px;color:#73787d}
.supp-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
@media print{body{padding:0;background:#fff}.page{box-shadow:none}}
</style></head><body>
<div class="page">
  <div class="accent"></div>
  <div class="dh">
    <div>
      <div class="cn">${companyNameEn}</div>
      <div class="ci">${companyAddressEn}<br>${settings.phone ? '📞 ' + settings.phone : ''} ${settings.email ? '| ✉ ' + settings.email : ''}<br>${settings.taxNo ? 'Tax Reg: ' + settings.taxNo : ''}</div>
    </div>
    <div class="dt">
      <div class="qt">Quotation</div>
      <div class="qr">Reference: ${q.number}</div>
      <div class="mr">
        <div class="mi"><label>Date</label><p>${fmtDateEN(q.date)}</p></div>
        ${q.projectName ? `<div class="mi"><label>Project</label><p>${q.projectName}</p></div>` : ''}
        <div class="mi"><label>Valid Until</label><p>${fmtDateEN(q.validUntil)}</p></div>
      </div>
    </div>
  </div>
  <div class="cl">
    <label>Client</label>
    <h2>${q.clientName || ''}</h2>
    ${q.clientContact ? `<p>Attn: ${q.clientContact}</p>` : ''}
  </div>
  ${heroImg ? `<div class="hero"><img src="${heroImg}"/><div class="hg"><div class="hb">${q.productType === 'galvanized' ? 'Galvanized Sheet Metal' : q.productType === 'black' ? 'Black Sheet Metal' : 'Primary Fabrication'}</div><div class="ht">${heroItem?.productName || ''}</div></div></div><div style="height:28px"></div>` : ''}
  <div class="sec" style="padding-top:${heroImg?'0':'28px'}">
    <div class="sdiv"><hr><h4>I. Primary Fabrication Schedule</h4><hr></div>
    <table class="items">
      <thead><tr>
        <th style="width:55px">Item</th><th>Description</th>
        <th style="text-align:right;width:65px">Unit</th>
        <th style="text-align:right;width:80px">Qty</th>
        <th style="text-align:right;width:105px">Rate (L.E)</th>
        <th style="text-align:right;width:115px">Total (L.E)</th>
      </tr></thead>
      <tbody>${itemsHTML}</tbody>
    </table>
  </div>
  ${(supps.workmanship.length || supps.transformation.length) ? `
  <div class="sec" style="padding-top:0">
    <div class="sdiv"><hr><h4>${q.productType==='galvanized'?'II. Technical Supplements & Surcharges':'II. Assembly Workmanship'}</h4><hr></div>
    <div class="${supps.transformation.length ? 'supp-grid' : ''}">${wkHTML}${trHTML}</div>
  </div>` : ''}
  <div class="comm">
    <h4>III. Commercial Terms</h4>
    <div class="cg">
      <div><label>Payment Structure</label><p>${q.paymentTerms || '—'}</p></div>
      <div><label>Delivery Timeline</label><p>Estimated <strong>${q.deliveryDays || '14-21'} Business Days</strong> from receipt of advance payment and approved drawings.</p></div>
      <div><label>Quote Validity</label><p>Valid until <strong>${fmtDateEN(q.validUntil)}</strong>. Subject to material market conditions.</p></div>
    </div>
  </div>
  ${q.notes ? `<div style="margin:0 48px 20px;padding:16px 20px;border-radius:6px;border:1px solid #e5e9eb;background:#f7fafc"><div style="font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#73787d;margin-bottom:6px">Notes & Remarks</div><p style="font-size:12px;color:#42474c;white-space:pre-wrap;line-height:1.7">${q.notes}</p></div>` : ''}
  <div class="sigs">
    ${STAMP_HTML}
    <div class="sg">
      <div class="sb"><div class="sl"></div><div class="sl2">Sales Management</div></div>
      <div class="sb"><div class="sl"></div><div class="sl2">Contract Control</div></div>
      <div class="sb"><div class="sl"></div><div class="sl2">General Manager</div></div>
    </div>
    <div class="tot">
      <div class="tr2"><span>Subtotal</span><span>${fmtEN(tots.subtotal)} L.E</span></div>
      ${(q.discountPct||0)>0?`<div class="tr2" style="color:#fca5a5"><span>Discount (${q.discountPct}%)</span><span>-${fmtEN(tots.discountAmt)} L.E</span></div>`:''}
      <div class="tr2"><span>VAT (${q.taxPct??14}%)</span><span>${fmtEN(tots.taxAmt)} L.E</span></div>
      <div class="tr2"><span>Grand Total (L.E)</span><span>${fmtEN(tots.total)}</span></div>
    </div>
  </div>
  <div class="fbar">
    <div><span class="fb">Confidential</span><span class="fb">Doc: ${q.number}</span></div>
    <div class="fc">© ${new Date().getFullYear()} ${companyNameEn} — All Rights Reserved.</div>
  </div>
</div>
<script>window.onload=()=>window.print();<\/script>
</body></html>`);
    pw.document.close();
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = quotes.filter(q => {
    const s = searchTerm.toLowerCase();
    const m = (q.number?.toLowerCase().includes(s)) || (q.clientName?.toLowerCase().includes(s)) || (q.projectName?.toLowerCase().includes(s));
    return m && (activeTab ? q.status === activeTab : true);
  });

  const typeLabel = (t) => ({ galvanized: '💿 Galvanized', black: '⬛ Black Sheet', general: '📦 General' }[t] || '');

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">إدارة عروض الأسعار</h2>
          <p className="text-sm text-slate-500">عروض أسعار A4 احترافية مع ختم الشركة — إنجليزي بالكامل</p>
        </div>
        <button onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-[#02273b] hover:bg-[#1d3d52] text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm">
          <Plus className="w-5 h-5" /> إنشاء عرض سعر
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-sm gap-1">
        {[['', 'الكل', quotes.length], ['draft', 'مسودات', quotes.filter(q => q.status==='draft').length],
          ['sent', 'مرسلة', quotes.filter(q => q.status==='sent').length],
          ['accepted', 'مقبولة', quotes.filter(q => q.status==='accepted').length],
          ['rejected', 'مرفوضة', quotes.filter(q => q.status==='rejected').length],
          ['expired', 'منتهية', quotes.filter(q => q.status==='expired').length]
        ].map(([key, label, count]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all ${activeTab === key ? 'border-[#02273b] text-[#02273b]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="ابحث برقم العرض أو اسم العميل أو المشروع..."
            className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006780] text-sm bg-slate-50/50" />
        </div>
      </div>

      {/* Quote Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(q => {
            const tots = calcTotals(q);
            const heroImg = products.find(p => p.id === q.items?.[0]?.productId)?.image || q.items?.[0]?.image || '';
            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-lg hover:border-[#86d1ed] transition-all duration-300">
                {/* Hero */}
                <div className="relative h-40 bg-slate-100 overflow-hidden">
                  {heroImg ? (
                    <img src={heroImg} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><FileText className="w-14 h-14 text-slate-200" /></div>
                  )}
                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Top badges */}
                  <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
                    {q.productType && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-[#02273b]/80 text-[#86d1ed] backdrop-blur-sm">
                        {typeLabel(q.productType)}
                      </span>
                    )}
                    {badge(q.status)}
                  </div>
                  {/* Bottom info */}
                  <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between">
                    <div>
                      <p className="text-white font-bold text-sm drop-shadow">{q.number}</p>
                      <p className="text-white/70 text-xs">{fmtDateEN(q.date)}</p>
                    </div>
                    <p className="text-white font-black text-base drop-shadow">{fmtEN(tots.total)} <span className="text-xs font-normal opacity-70">L.E</span></p>
                  </div>
                </div>
                {/* Body */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-bold text-slate-900">{q.clientName}</p>
                    {q.projectName && <p className="text-xs text-slate-400 mt-0.5">{q.projectName}</p>}
                  </div>
                  {/* Item thumbnails */}
                  <div className="flex gap-1.5">
                    {(q.items || []).slice(0, 4).map((it, i) => {
                      const img = products.find(p => p.id === it.productId)?.image || it.image || '';
                      return img ? (
                        <div key={i} className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : null;
                    })}
                    {(q.items || []).length > 4 && <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">+{(q.items || []).length - 4}</div>}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                    <button onClick={() => setViewingQuote(q)} title="معاينة" className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#02273b] hover:bg-slate-100 rounded-lg transition-all"><Eye className="w-3.5 h-3.5"/>معاينة</button>
                    <button onClick={() => handlePrint(q)} title="طباعة" className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"><Printer className="w-3.5 h-3.5"/>PDF</button>
                    <button onClick={() => handleOpenEdit(q)} title="تعديل" className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit className="w-3.5 h-3.5"/>تعديل</button>
                    <button onClick={() => setStatusChangingQuote(q)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"><RefreshCw className="w-3.5 h-3.5"/></button>
                    <button onClick={() => handleDelete(q)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
          <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium text-sm">لا توجد عروض أسعار. اضغط «إنشاء عرض سعر» للبدء.</p>
        </div>
      )}

      {/* ================================================================
          MODAL: VIEW — Premium A4 Preview
      ================================================================ */}
      {viewingQuote && (() => {
        const q = viewingQuote;
        const tots = calcTotals(q);
        const heroImg = products.find(p => p.id === q.items?.[0]?.productId)?.image || q.items?.[0]?.image || '';
        const si = statusInfo(q.status);
        const supps = SUPPLEMENTS[q.productType || 'galvanized'] || SUPPLEMENTS.general;
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(2,39,59,0.6)', backdropFilter: 'blur(4px)' }}>
            {/* Floating toolbar */}
            <div className="sticky top-4 z-10 flex justify-between items-center max-w-4xl mx-auto px-4 mb-4">
              <button onClick={() => setViewingQuote(null)}
                className="flex items-center gap-2 bg-white/95 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg hover:bg-white transition-all">
                <X className="w-4 h-4" /> إغلاق
              </button>
              <div className="flex gap-2">
                <button onClick={() => { setViewingQuote(null); handleOpenEdit(q); }}
                  className="flex items-center gap-2 bg-white/95 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg hover:bg-white transition-all">
                  <Edit className="w-4 h-4" /> تعديل
                </button>
                <button onClick={() => handlePrint(q)}
                  className="flex items-center gap-2 bg-[#02273b] text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg hover:bg-[#1d3d52] transition-all">
                  <Printer className="w-4 h-4" /> طباعة / PDF
                </button>
              </div>
            </div>

            {/* A4 Document */}
            <div className="max-w-4xl mx-auto px-4 pb-8">
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                {/* Top accent */}
                <div className="h-1.5" style={{ background: 'linear-gradient(to right, #02273b, #006780)' }} />

                {/* Header */}
                <div className="px-10 pt-10 pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6">
                  <div>
                    <div className="text-lg font-bold text-[#02273b]">{companyNameEn}</div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {companyAddressEn}<br/>
                      {settings.phone && `📞 ${settings.phone}`}{settings.email && ` | ✉ ${settings.email}`}
                      {settings.taxNo && <><br/>Tax Reg: {settings.taxNo}</>}
                    </div>
                    {q.clientName && (
                      <div className="mt-5 pl-4 border-l-2 border-[#006780]">
                        <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Client</div>
                        <div className="font-bold text-slate-900 text-base">{q.clientName}</div>
                        {q.clientContact && <div className="text-xs text-slate-500 mt-0.5">Attn: {q.clientContact}</div>}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-4xl font-bold text-[#02273b] uppercase tracking-tight">Quotation</div>
                    <div className="text-sm text-slate-400 mt-1 mb-4">Reference: {q.number}</div>
                    <div className="flex gap-6 justify-end">
                      <div><div className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Date</div><div className="text-sm font-semibold text-slate-800">{fmtDateEN(q.date)}</div></div>
                      {q.projectName && <div><div className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Project</div><div className="text-sm font-semibold text-slate-800">{q.projectName}</div></div>}
                      <div><div className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Valid Until</div><div className="text-sm font-semibold text-slate-800">{fmtDateEN(q.validUntil)}</div></div>
                    </div>
                    <div className="mt-3">{badge(q.status)}</div>
                  </div>
                </div>

                {/* Hero Image */}
                {heroImg && (
                  <div className="relative h-52 overflow-hidden">
                    <img src={heroImg} alt="" className="w-full h-full object-cover object-center" />
                    <div className="absolute inset-0 flex flex-col justify-center px-10" style={{ background: 'linear-gradient(to right, rgba(2,39,59,.9), rgba(2,39,59,.55), transparent)' }}>
                      <div className="text-[9px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#86d1ed' }}>
                        {q.productType === 'galvanized' ? 'Galvanized Sheet Metal' : q.productType === 'black' ? 'Black Sheet Metal' : 'Primary Fabrication'}
                      </div>
                      <div className="text-2xl font-bold text-white max-w-xs leading-tight">{q.items?.[0]?.productName}</div>
                    </div>
                  </div>
                )}

                {/* Items Table */}
                <div className="px-10 py-8">
                  <div className="flex items-center gap-4 mb-5"><div className="h-px bg-slate-200 flex-1"/><span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">I. Primary Fabrication Schedule</span><div className="h-px bg-slate-200 flex-1"/></div>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-y border-slate-100">
                          {['Item','Description','Unit','Qty','Rate (L.E)','Total (L.E)'].map((h, i) => (
                            <th key={h} className={`py-3 px-4 text-[9px] font-bold uppercase tracking-wider text-slate-400 ${i < 2 ? 'text-left' : 'text-right'} ${i===0?'w-14':i===2?'w-16':i===3?'w-20':i===4?'w-28':'w-32'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(q.items || []).map((it, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="py-5 px-4 text-slate-400 text-xs">{i+1}.{i+1}</td>
                            <td className="py-5 px-4">
                              <p className="font-bold text-slate-900 mb-1">{it.productName}</p>
                              {it.note && <p className="text-xs text-slate-400 mb-2">{it.note}</p>}
                              {it.techNotes && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#02273b] mb-2">Technical Notes:</p>
                                  <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">{it.techNotes}</p>
                                </div>
                              )}
                            </td>
                            <td className="py-5 px-4 text-right text-slate-600 text-xs">{it.unitType || '—'}</td>
                            <td className="py-5 px-4 text-right font-semibold text-slate-800 text-xs">{(it.qty||0).toLocaleString('en')}</td>
                            <td className="py-5 px-4 text-right text-slate-600 text-xs">{fmtEN(it.unitPrice)}</td>
                            <td className="py-5 px-4 text-right font-bold text-slate-900">{fmtEN(it.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Supplements */}
                {(supps.workmanship.length > 0 || supps.transformation.length > 0) && (
                  <div className="px-10 pb-8">
                    <div className="flex items-center gap-4 mb-5"><div className="h-px bg-slate-200 flex-1"/><span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">II. Technical Supplements & Surcharges</span><div className="h-px bg-slate-200 flex-1"/></div>
                    <div className={`grid gap-6 ${supps.transformation.length ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {supps.workmanship.length > 0 && (
                        <div>
                          <h5 className="text-[9px] font-bold uppercase tracking-wider text-[#02273b] mb-3 flex items-center gap-2"><span className="w-4 h-px bg-[#02273b] inline-block"/>Assembly Workmanship</h5>
                          <div className="rounded-xl border border-slate-100 overflow-hidden">
                            <table className="w-full border-collapse text-xs">
                              <thead><tr className="bg-slate-50 border-y border-slate-100"><th className="py-2 px-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">Description</th><th className="py-2 px-3 text-right text-[9px] font-bold uppercase tracking-wider text-slate-400">Price (L.E)</th></tr></thead>
                              <tbody>{supps.workmanship.map((r,i) => <tr key={i} className={`border-b border-slate-100 last:border-0 ${i%2===1?'bg-slate-50':''}`}><td className="py-2.5 px-3 text-slate-700">{r.desc}</td><td className="py-2.5 px-3 text-right font-semibold text-[#02273b]">{r.price}</td></tr>)}</tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {supps.transformation.length > 0 && (
                        <div>
                          <h5 className="text-[9px] font-bold uppercase tracking-wider text-[#02273b] mb-3 flex items-center gap-2"><span className="w-4 h-px bg-[#02273b] inline-block"/>Transformation Surcharges</h5>
                          <div className="rounded-xl border border-slate-100 overflow-hidden">
                            <table className="w-full border-collapse text-xs">
                              <thead><tr className="bg-slate-50 border-y border-slate-100"><th className="py-2 px-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">Description</th><th className="py-2 px-3 text-right text-[9px] font-bold uppercase tracking-wider text-slate-400">Price (L.E)</th></tr></thead>
                              <tbody>{supps.transformation.map((r,i) => <tr key={i} className={`border-b border-slate-100 last:border-0 ${i%2===1?'bg-slate-50':''}`}><td className="py-2.5 px-3 text-slate-700">{r.desc}</td><td className="py-2.5 px-3 text-right font-semibold text-[#02273b]">{r.price}</td></tr>)}</tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Commercial Terms */}
                <div className="mx-10 mb-8 bg-slate-50 rounded-xl border border-slate-200 p-6">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#02273b] mb-4">
                    {supps.workmanship.length ? 'III.' : 'II.'} Commercial Terms
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div><div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">Payment Structure</div><p className="text-xs text-slate-700 leading-relaxed">{q.paymentTerms || '—'}</p></div>
                    <div><div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">Delivery Timeline</div><p className="text-xs text-slate-700 leading-relaxed"><strong>{q.deliveryDays||'14-21'} Business Days</strong> from advance payment receipt.</p></div>
                    <div><div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">Quote Validity</div><p className="text-xs text-slate-700 leading-relaxed">Valid until <strong>{fmtDateEN(q.validUntil)}</strong>.</p></div>
                  </div>
                </div>

                {q.notes && (
                  <div className="mx-10 mb-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-amber-600 mb-2">Notes & Remarks</div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{q.notes}</p>
                  </div>
                )}

                {/* Signatures + Totals + Stamp */}
                <div className="px-10 pb-10 border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-end gap-6 relative">
                  {/* Stamp */}
                  <div className="absolute left-1/2 top-6 -translate-x-1/2 hidden md:block">
                    <Stamp />
                  </div>
                  <div className="grid grid-cols-3 gap-6 flex-1">
                    {['Sales Management','Contract Control','General Manager'].map(s => (
                      <div key={s} className="text-center">
                        <div className="h-14 border-b border-slate-300 mb-2"/>
                        <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{s}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-6 min-w-[240px] shadow-lg flex-shrink-0" style={{ background: '#02273b' }}>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>{fmtEN(tots.subtotal)}</span></div>
                      {(q.discountPct||0)>0 && <div className="flex justify-between text-rose-300"><span>Discount ({q.discountPct}%)</span><span>-{fmtEN(tots.discountAmt)}</span></div>}
                      <div className="flex justify-between text-slate-300"><span>VAT ({q.taxPct??14}%)</span><span>{fmtEN(tots.taxAmt)}</span></div>
                      <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.15)' }}/>
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Grand Total (L.E)</span>
                        <span className="text-xl font-bold text-white">{fmtEN(tots.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 px-10 py-4 flex justify-between items-center bg-slate-50">
                  <div className="flex gap-2">
                    <span className="bg-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded">Confidential</span>
                    <span className="bg-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded">{si.en}</span>
                  </div>
                  <div className="text-xs text-slate-400">© {new Date().getFullYear()} {companyNameEn} — All Rights Reserved.</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================================================================
          MODAL: BUILDER FORM
      ================================================================ */}
      {editingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[95vh]">
            {/* Modal header */}
            <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ background: '#02273b' }}>
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5" style={{ color: '#86d1ed' }} />
                <h3 className="font-bold text-white">{isAddMode ? 'إنشاء عرض سعر جديد' : `تعديل: ${editingQuote.number || ''}`}</h3>
              </div>
              <button onClick={() => setEditingQuote(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"><X className="w-6 h-6"/></button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-grow">
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT */}
                <div className="lg:col-span-2 space-y-5">

                  {/* Product Type Selector */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-[#006780]"/>نوع المنتج الرئيسي</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: 'galvanized', label: 'Galvanized Sheet', sub: 'صاج مجلفن', icon: '💿', catId: 'cat_galvanized' },
                        { key: 'black', label: 'Black Sheet Metal', sub: 'صاج أسود', icon: '⬛', catId: 'cat_black' },
                        { key: 'general', label: 'General', sub: 'عام', icon: '📦', catId: null },
                      ].map(t => (
                        <button key={t.key} type="button" onClick={() => handleProductTypeChange(t.key)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${formProductType === t.key ? 'border-[#006780] bg-[#006780]/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                          <span className="text-2xl">{t.icon}</span>
                          <div>
                            <p className={`text-xs font-bold ${formProductType === t.key ? 'text-[#02273b]' : 'text-slate-700'}`}>{t.label}</p>
                            <p className="text-[10px] text-slate-400">{t.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                    <h4 className="font-bold text-xs text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-[#006780]"/>بيانات العرض</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Reference No.</label>
                        <input type="text" value={formNumber} onChange={e=>setFormNumber(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white font-mono"/></div>
                      <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Client (from CRM)</label>
                        <select value={formClientId} onChange={e=>handleClientSelect(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white">
                          <option value="">— Select Client —</option>
                          {clients.map(c=><option key={c.id} value={c.id}>{c.name} — {c.company||'Individual'}</option>)}
                        </select></div>
                      <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Client Name</label>
                        <input type="text" value={formClientName} onChange={e=>setFormClientName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white" placeholder="Company / Person name"/></div>
                      <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Attn.</label>
                        <input type="text" value={formClientContact} onChange={e=>setFormClientContact(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white" placeholder="Eng. Ahmed Mahmoud"/></div>
                      <div className="sm:col-span-2"><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Project Name</label>
                        <input type="text" value={formProjectName} onChange={e=>setFormProjectName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white" placeholder="e.g. Speed Cool — HVAC System Phase 1"/></div>
                      <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Issue Date</label>
                        <input type="date" value={formDate} onChange={e=>setFormDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white"/></div>
                      <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Valid Until</label>
                        <input type="date" value={formValidUntil} onChange={e=>setFormValidUntil(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white"/></div>
                    </div>
                  </div>

                  {/* Items Builder */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-bold text-xs text-slate-700 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-[#006780]"/>Primary Fabrication Schedule</h4>
                      <button type="button" onClick={handleAddItem}
                        className="text-xs text-white font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all" style={{ background: '#006780' }}>
                        <PlusCircle className="w-3.5 h-3.5"/>Add Item
                      </button>
                    </div>
                    <div className="space-y-4">
                      {formItems.map((item, idx) => {
                        const img = products.find(p=>p.id===item.productId)?.image || item.image || '';
                        return (
                          <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            {img && (
                              <div className="relative h-20 overflow-hidden">
                                <img src={img} alt="" className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 flex items-center px-4" style={{ background: 'linear-gradient(to right, rgba(2,39,59,.8), transparent)' }}>
                                  <span className="text-white font-bold text-xs">{item.productName}</span>
                                </div>
                              </div>
                            )}
                            <div className="p-4 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Product</label>
                                  <select value={item.productId} onChange={e=>handleItemChange(idx,'productId',e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-slate-50">
                                    {products.filter(p=>p.active!==false).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                                  </select>
                                </div>
                                <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Qty ({item.unitType})</label>
                                  <input type="number" value={item.qty||''} onChange={e=>handleItemChange(idx,'qty',parseFloat(e.target.value)||0)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780]" min="0" step="0.001"/></div>
                                <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Rate (L.E)</label>
                                  <input type="number" value={item.unitPrice||''} onChange={e=>handleItemChange(idx,'unitPrice',parseFloat(e.target.value)||0)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780]" min="0" step="0.01"/></div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Short Note</label>
                                  <input type="text" value={item.note||''} onChange={e=>handleItemChange(idx,'note',e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780]" placeholder="Brief description..."/></div>
                                <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Discount (%)</label>
                                  <input type="number" value={item.discountPct||''} onChange={e=>handleItemChange(idx,'discountPct',parseFloat(e.target.value)||0)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780]" min="0" max="100"/></div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Technical Notes (appears in document)</label>
                                <textarea value={item.techNotes||''} onChange={e=>handleItemChange(idx,'techNotes',e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] font-mono" rows="4"/>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <span className="text-xs font-bold" style={{ color: '#006780' }}>
                                  Total: {fmtEN((item.qty||0)*(item.unitPrice||0)*(1-(item.discountPct||0)/100))} L.E
                                </span>
                                <button type="button" onClick={()=>handleRemoveItem(idx)} className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold">
                                  <Trash2 className="w-3.5 h-3.5"/>Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {!formItems.length && (
                        <div className="text-center text-xs text-slate-400 py-8 border-2 border-dashed border-slate-200 rounded-xl">
                          No items yet. Click «Add Item» to add your first product.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <label className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Payment Terms</label>
                      <textarea value={formPaymentTerms} onChange={e=>setFormPaymentTerms(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white" rows="3"/>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <label className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Notes & Remarks</label>
                      <textarea value={formNotes} onChange={e=>setFormNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white" rows="3"/>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Live Summary */}
                <div className="space-y-4">
                  <div className="rounded-2xl p-5 sticky top-0 space-y-4" style={{ background: '#02273b' }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider border-b border-white/10 pb-2" style={{ color: '#86d1ed' }}>Financial Summary</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-slate-300"><span>Subtotal:</span><span>{fmtEN(liveTotals.subtotal)} L.E</span></div>
                      <div className="h-px bg-white/10"/>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Additional Discount (%)</label>
                        <input type="number" value={formDiscountPct} onChange={e=>setFormDiscountPct(parseFloat(e.target.value)||0)} className="w-full rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} min="0" max="100"/>
                      </div>
                      {liveTotals.discountPct>0 && <div className="flex justify-between text-red-300 font-semibold text-xs"><span>Discount ({liveTotals.discountPct}%):</span><span>-{fmtEN(liveTotals.discountAmt)} L.E</span></div>}
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">VAT (%)</label>
                        <input type="number" value={formTaxPct} onChange={e=>setFormTaxPct(parseFloat(e.target.value)||0)} className="w-full rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} min="0" max="100"/>
                      </div>
                      <div className="flex justify-between text-slate-300 text-xs"><span>VAT ({liveTotals.taxPct}%):</span><span>+{fmtEN(liveTotals.taxAmt)} L.E</span></div>
                      <div className="h-px bg-white/10"/>
                      <div className="flex justify-between font-bold text-lg text-emerald-400"><span>Grand Total:</span><span>{fmtEN(liveTotals.total)}</span></div>
                      <div className="text-xs text-slate-400 text-right">L.E</div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Delivery (Business Days)</label>
                    <input type="text" value={formDeliveryDays} onChange={e=>setFormDeliveryDays(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white" placeholder="14-21"/>
                  </div>
                  {/* Stamp preview */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Document Stamp</p>
                    <Stamp/>
                    <p className="text-[9px] text-slate-400 text-center">يظهر هذا الختم تلقائياً في وثيقة عرض السعر</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
              <button type="button" onClick={()=>setEditingQuote(null)} className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-semibold transition-colors">إلغاء</button>
              <button type="button" onClick={()=>handleSave(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"><Save className="w-4 h-4"/>Save Draft</button>
              <button type="button" onClick={()=>handleSave(false)} className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm" style={{ background: '#006780' }}><Send className="w-4 h-4"/>Save & Send</button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHANGE MODAL */}
      {statusChangingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#02273b' }}>
              <h3 className="font-bold text-sm text-white">Change Status — {statusChangingQuote.number}</h3>
              <button onClick={()=>setStatusChangingQuote(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-2">
              {['draft','sent','accepted','rejected','expired'].map(s=>{
                const i=statusInfo(s);
                return (
                  <button key={s} onClick={()=>handleSetStatus(s)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-xs font-semibold transition-all ${statusChangingQuote.status===s?'border-[#006780] bg-[#006780]/5 text-[#02273b]':'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                    <span>{i.ar}</span>
                    <span className={`px-2.5 py-0.5 rounded-full border ${i.cls}`}>{i.en}</span>
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
