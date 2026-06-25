import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Printer, Edit, Eye, RefreshCw, Trash2, X,
  PlusCircle, FileText, Send, Save, ChevronRight, Layers,
  Package, Lock, Unlock, ArrowLeftRight, HelpCircle
} from 'lucide-react';
import { DB } from '../db/db.js';
import { CostEngine } from '../db/costEngine.js';

// Pre-fill default titles and descriptions for duct types
const TYPE_TITLE = { galvanized: 'RECTANGULAR GALVANIZED SHEET METAL DUCTS', black: 'BLACK SHEET METAL DUCTS', general: '' };
const TYPE_DESC = { 
  galvanized: 'Supply and manufacturing only of rectangular galvanized sheet metal ducts according to the required specifications and SMACNA.', 
  black: 'Supply and manufacturing of black sheet metal ducts for industrial and kitchen ventilation systems.', 
  general: '' 
};
const TYPE_TECH = {
  galvanized: `1. For slip and drive connection the weight includes slip and drive transverse connection.\n2. For TDF flange connection the price does not include corners and G-clamps.\n3. For TDC flange connection the price does not include corners and G-clamps.\n4. Galvanized ducts gauges will be according to project specifications.\n5. Thickness: according to SMACNA.\n6. Material: Galvanized sheet metals 275 g/m².`,
  black: `1. Supply & manufacturing of black sheet metal ducts for kitchen/industrial ventilation.\n2. Welding: continuous TIG weld, oil and heat resistant.\n3. Surface treatment: heat-resistant paint coating, suitable up to 350°C.\n4. Thickness: according to SMACNA specifications.\n5. Material: Black steel sheet (St37).`,
  general: '',
};

const DEFAULT_WK = (type) => type === 'galvanized' || type === 'black' ? [
  { id: 'wk1', desc: 'Round cut duct (4" to 10")', price: '120.00' },
  { id: 'wk2', desc: 'Round cut duct (12" to 18")', price: '220.00' },
  { id: 'wk3', desc: 'Round cut duct (Over 20")', price: '470.00' },
] : [];

const DEFAULT_TR = (type) => type === 'galvanized' ? [
  { id: 'tr1', desc: 'Square to round up to 10"', price: '120.00' },
  { id: 'tr2', desc: 'Square to round from 12" to 20"', price: '220.00' },
  { id: 'tr3', desc: 'Square to round from 22" to 30"', price: '470.00' },
] : [];

const mkId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export default function QuoteBuilder({ quotes, clients, products, settings, onUpdate, editingQuote, setEditingQuote, isAddMode, setIsAddMode, defaultProductType }) {
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
  const [formProductType, setFormProductType] = useState('galvanized');
  
  // Grouped items state
  // formItems is an array of: { id, productId, productName, itemTitle, itemDesc, qty, unitPrice, discountPct, techNotes, unitType, subsection }
  const [formItems, setFormItems] = useState([]);
  
  // Accessories (Section II)
  const [formAccessories, setFormAccessories] = useState([]);
  const [accLocked, setAccLocked] = useState(false);
  
  // Supplements (Section III)
  const [formWorkmanship, setFormWorkmanship] = useState([]);
  const [formTransformation, setFormTransformation] = useState([]);
  const [suppLocked, setSuppLocked] = useState(false);

  const fmtEN = (v) => (v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDateEN = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  const today = () => new Date().toISOString().split('T')[0];
  const dateAdd = (ds, n) => { const d = new Date(ds || new Date()); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
  const genNum = () => `QT-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(4, '0')}`;

  // Initialize form state when editingQuote changes
  useEffect(() => {
    if (editingQuote && editingQuote.id !== 'temp') {
      const q = editingQuote;
      setFormNumber(q.number || '');
      setFormClientId(q.clientId || '');
      setFormClientName(q.clientName || '');
      setFormClientContact(q.clientContact || '');
      setFormProjectName(q.projectName || '');
      setFormDate(q.date?.split('T')[0] || today());
      setFormValidUntil(q.validUntil?.split('T')[0] || dateAdd(q.date, 30));
      setFormPaymentTerms(q.paymentTerms || '');
      setFormDeliveryDays(q.deliveryDays || '14-21');
      setFormNotes(q.notes || '');
      setFormDiscountPct(q.discountPct || 0);
      setFormTaxPct(q.taxPct ?? 14);
      setFormProductType(q.productType || 'galvanized');
      setFormItems((q.items || []).map(it => ({ ...it, id: it.id || mkId(), subsection: it.subsection || 'صاج مجلفن' })));
      setFormAccessories(q.accessories || []);
      setFormWorkmanship(q.workmanship || DEFAULT_WK(q.productType || 'galvanized').map(r => ({ ...r, id: mkId() })));
      setFormTransformation(q.transformation || DEFAULT_TR(q.productType || 'galvanized').map(r => ({ ...r, id: mkId() })));
      setAccLocked(q.accLocked || false);
      setSuppLocked(q.suppLocked || false);
    } else {
      // New quote initialization
      const td = today();
      setFormNumber(genNum());
      setFormClientId('');
      setFormClientName('');
      setFormClientContact('');
      setFormProjectName('');
      setFormDate(td);
      setFormValidUntil(dateAdd(td, parseInt(settings.quoteValidity) || 30));
      setFormPaymentTerms('80% Down Payment required upon order confirmation. Balance due within 7 days of delivery.');
      setFormDeliveryDays('14-21');
      setFormNotes('');
      setFormDiscountPct(0);
      setFormTaxPct(14);
      
      const currentType = defaultProductType || 'galvanized';
      setFormProductType(currentType);
      
      // Default with one empty item under appropriate category & subsection
      const targetCategory = currentType === 'black' ? 'cat_black' : 'cat_galvanized';
      const defaultProd = products.find(p => p.categoryId === targetCategory) || products[0];
      const calc = defaultProd ? CostEngine.calculate(defaultProd) : null;
      const subsectionLabel = currentType === 'black' ? 'صاج أسود' : currentType === 'general' ? 'عام' : 'صاج مجلفن';
      
      setFormItems([{
        id: mkId(),
        productId: defaultProd ? defaultProd.id : '',
        productName: defaultProd ? defaultProd.name : '',
        itemTitle: TYPE_TITLE[currentType] || (defaultProd ? defaultProd.name.toUpperCase() : ''),
        itemDesc: TYPE_DESC[currentType] || (defaultProd ? defaultProd.name : ''),
        qty: 1,
        unitPrice: calc ? calc.finalPrice : 0,
        discountPct: 0,
        techNotes: TYPE_TECH[currentType] || '',
        unitType: defaultProd ? defaultProd.unitType : 'Ton',
        subsection: subsectionLabel
      }]);
      setFormAccessories([]);
      setFormWorkmanship(DEFAULT_WK(currentType).map(r => ({ ...r, id: mkId() })));
      setFormTransformation(DEFAULT_TR(currentType).map(r => ({ ...r, id: mkId() })));
      setAccLocked(false);
      setSuppLocked(false);
    }
  }, [editingQuote, defaultProductType]);

  // Client Selection
  const handleClientSelect = (clientId) => {
    setFormClientId(clientId);
    const c = clients.find(cl => cl.id === clientId);
    if (c) {
      setFormClientName(c.company || c.name);
      setFormClientContact(c.name);
    }
  };

  // Product Type Change
  const handleProductTypeChange = (type) => {
    setFormProductType(type);
    // Update items defaults
    const updated = formItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        return {
          ...item,
          itemTitle: TYPE_TITLE[type] || prod.name.toUpperCase(),
          itemDesc: TYPE_DESC[type] || prod.name,
          techNotes: TYPE_TECH[type] || '',
        };
      }
      return item;
    });
    setFormItems(updated);
    setFormWorkmanship(DEFAULT_WK(type).map(r => ({ ...r, id: mkId() })));
    setFormTransformation(DEFAULT_TR(type).map(r => ({ ...r, id: mkId() })));
  };

  // Items Handlers
  const handleAddItem = (subsection = 'صاج مجلفن') => {
    const pool = products.filter(p => p.active !== false);
    if (!pool.length) return;
    const prod = pool.find(p => p.categoryId === (formProductType === 'black' ? 'cat_black' : 'cat_galvanized')) || pool[0];
    const calc = CostEngine.calculate(prod);
    setFormItems([...formItems, {
      id: mkId(),
      productId: prod.id,
      productName: prod.name,
      itemTitle: TYPE_TITLE[formProductType] || prod.name.toUpperCase(),
      itemDesc: TYPE_DESC[formProductType] || prod.name,
      qty: 1,
      unitPrice: calc ? calc.finalPrice : 0,
      discountPct: 0,
      techNotes: TYPE_TECH[formProductType] || '',
      unitType: prod.unitType || 'Ton',
      subsection: subsection
    }]);
  };

  const handleRemoveItem = (id) => setFormItems(formItems.filter(item => item.id !== id));

  const handleItemChange = (id, field, val) => {
    const upd = formItems.map(item => {
      if (item.id === id) {
        if (field === 'productId') {
          const prod = products.find(p => p.id === val);
          if (prod) {
            const calc = CostEngine.calculate(prod);
            return {
              ...item,
              productId: prod.id,
              productName: prod.name,
              itemTitle: TYPE_TITLE[formProductType] || prod.name.toUpperCase(),
              itemDesc: TYPE_DESC[formProductType] || prod.name,
              unitType: prod.unitType,
              unitPrice: calc ? calc.finalPrice : 0,
              image: prod.image || ''
            };
          } else {
            return {
              ...item,
              productId: '',
              image: ''
            };
          }
        }
        return { ...item, [field]: val };
      }
      return item;
    });
    setFormItems(upd);
  };

  // Section II Accessories
  const handleAddAccessory = (prod) => {
    if (formAccessories.find(a => a.productId === prod.id)) return;
    const calc = CostEngine.calculate(prod);
    setFormAccessories([...formAccessories, {
      productId: prod.id,
      name: prod.name,
      description: prod.description || '',
      image: prod.image || '',
      unitLabel: prod.unitType || 'pc',
      unitPrice: calc ? calc.finalPrice : 0,
    }]);
  };

  const handleRemoveAccessory = (prodId) => setFormAccessories(formAccessories.filter(a => a.productId !== prodId));
  const handleAccChange = (idx, field, val) => {
    const upd = [...formAccessories];
    upd[idx][field] = val;
    setFormAccessories(upd);
  };

  // Section III Supplements
  const addWkRow = () => setFormWorkmanship([...formWorkmanship, { id: mkId(), desc: '', price: '0.00' }]);
  const removeWkRow = (id) => setFormWorkmanship(formWorkmanship.filter(r => r.id !== id));
  const changeWk = (id, field, val) => setFormWorkmanship(formWorkmanship.map(r => r.id === id ? { ...r, [field]: val } : r));

  const addTrRow = () => setFormTransformation([...formTransformation, { id: mkId(), desc: '', price: '0.00' }]);
  const removeTrRow = (id) => setFormTransformation(formTransformation.filter(r => r.id !== id));
  const changeTr = (id, field, val) => setFormTransformation(formTransformation.map(r => r.id === id ? { ...r, [field]: val } : r));

  // Compute live calculations
  const liveTotals = (() => {
    const items = formItems.map(it => {
      const sub = (it.qty || 0) * (it.unitPrice || 0);
      const discAmt = sub * ((it.discountPct || 0) / 100);
      const tot = sub - discAmt;
      return { ...it, subtotal: sub, discountAmt: discAmt, total: tot };
    });
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discAmt = subtotal * ((parseFloat(formDiscountPct) || 0) / 100);
    const afterDisc = subtotal - discAmt;
    const taxAmt = afterDisc * ((parseFloat(formTaxPct) || 0) / 100);
    const total = afterDisc + taxAmt;
    return { items, subtotal, discountPct: parseFloat(formDiscountPct) || 0, discountAmt: discAmt, taxPct: parseFloat(formTaxPct) || 0, taxAmt, total };
  })();

  // Save quotation to DB
  const handleSave = (asDraft = true) => {
    if (!formClientName.trim()) { alert('يرجى إدخال اسم العميل'); return; }
    if (!liveTotals.items.length) { alert('يرجى إضافة بند واحد على الأقل'); return; }
    
    const data = {
      number: formNumber || genNum(),
      productType: formProductType,
      clientId: formClientId,
      clientName: formClientName,
      clientContact: formClientContact,
      projectName: formProjectName.trim(),
      date: formDate || today(),
      validUntil: formValidUntil || dateAdd(formDate, 30),
      paymentTerms: formPaymentTerms,
      deliveryDays: formDeliveryDays,
      notes: formNotes,
      items: liveTotals.items,
      accessories: formAccessories,
      workmanship: formWorkmanship,
      transformation: formTransformation,
      accLocked,
      suppLocked,
      subtotal: liveTotals.subtotal,
      discountPct: liveTotals.discountPct,
      discountAmt: liveTotals.discountAmt,
      taxPct: liveTotals.taxPct,
      taxAmt: liveTotals.taxAmt,
      total: liveTotals.total,
    };

    if (isAddMode || !editingQuote || editingQuote.id === 'temp') {
      DB.insert('quotes', { ...data, status: asDraft ? 'draft' : 'sent' });
    } else {
      const prev = DB.getById('quotes', editingQuote.id);
      DB.update('quotes', editingQuote.id, { ...data, status: prev?.status || 'draft' });
    }

    onUpdate();
    setEditingQuote(null);
    setIsAddMode(false);
    window.location.hash = 'quotes';
  };

  // Helper to extract unique subsections
  const uniqueSubsections = Array.from(new Set(formItems.map(it => it.subsection || 'صاج مجلفن')));

  const bannerTitle = formProductType === 'black' ? 'Black Sheet Metal Ducts' : formProductType === 'general' ? 'General Fabrication' : 'Galvanized Sheet Metal Ducts';
  const bannerImage = formProductType === 'black' ? '/images/black_duct.png' : formProductType === 'general' ? '/images/raw_fe.png' : '/images/galvanized_duct.png';

  // Trigger Print of the A4 layout
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    // Group items for print template HTML
    const itemsBySection = {};
    uniqueSubsections.forEach(sec => {
      itemsBySection[sec] = liveTotals.items.filter(it => it.subsection === sec);
    });

    const sectionsHTML = uniqueSubsections.map((sec, subSecIdx) => {
      const secItems = itemsBySection[sec] || [];
      return `
        <tr class="bg-slate-100/80 font-bold border-b border-slate-200">
          <td colspan="6" class="py-2.5 px-4 text-xs text-[#02273b] text-left uppercase tracking-wider font-extrabold">${sec}</td>
        </tr>
        ${secItems.map((it, i) => `
          <tr class="border-b border-slate-200">
            <td class="py-5 px-4 text-slate-400 text-xs align-top">${subSecIdx + 1}.${i + 1}</td>
            <td class="py-5 px-4 align-top">
              <p class="font-bold text-slate-900 mb-1 uppercase text-sm">${it.itemTitle || it.productName}</p>
              ${it.itemDesc ? `<p class="text-xs text-slate-500 mb-3 leading-relaxed">${it.itemDesc}</p>` : ''}
              ${it.techNotes ? `
                <div class="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mt-2">
                  <p class="text-[9px] font-bold uppercase tracking-wider text-[#02273b] mb-1.5">Technical Note:</p>
                  <p class="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">${it.techNotes.replace('275 g/m²', '<strong class="text-red-650 font-bold">275 g/m²</strong>')}</p>
                </div>
              ` : ''}
            </td>
            <td class="py-5 px-4 text-right text-slate-600 text-xs align-top">${it.unitType || '—'}</td>
            <td class="py-5 px-4 text-right font-semibold text-slate-800 text-xs align-top">${(it.qty || 0).toLocaleString('en')}</td>
            <td class="py-5 px-4 text-right text-slate-600 text-xs align-top">${fmtEN(it.unitPrice)}</td>
            <td class="py-5 px-4 text-right font-bold text-slate-900 align-top">${fmtEN(it.total)}</td>
          </tr>
        `).join('')}
      `;
    }).join('');

    const accHTML = formAccessories.length ? `
      <div style="margin-bottom: 48px;">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
          <div style="height:1px;background:#e5e9eb;flex:1;"></div>
          <h4 style="font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#73787d;white-space:nowrap;">II. Specialized Component Index</h4>
          <div style="height:1px;background:#e5e9eb;flex:1;"></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;">
          ${formAccessories.map(a => `
            <div style="background:#f7fafc;border:1px solid #e5e9eb;border-radius:8px;padding:14px;display:flex;flex-direction:column;">
              <div style="height:80px;background:#fff;border:1px solid #ebeef0;border-radius:6px;margin-bottom:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:8px;">
                ${a.image ? `<img src="${a.image}" style="max-height:100%;max-width:100%;object-fit:contain;mix-blend-mode:multiply;"/>` : `<span style="font-size:24px;">📦</span>`}
              </div>
              <p style="font-size:11px;font-weight:700;color:#181c1e;margin-bottom:4px;text-transform:uppercase;">${a.name}</p>
              ${a.description ? `<p style="font-size:10px;color:#73787d;margin-bottom:8px;flex:1;line-height:1.5;">${a.description}</p>` : '<div style="flex:1;"></div>'}
              <div style="border-top:1px solid #ebeef0;padding-top:8px;margin-top:4px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:8px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d;">UNIT PRICE</span>
                <span style="font-size:12px;font-weight:700;color:#02273b;">$${fmtEN(a.unitPrice)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const secNumSupp = formAccessories.length ? 'III' : 'II';
    const wkHTML = formWorkmanship.filter(r => r.desc).length ? `
      <div>
        <h5 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#02273b;margin-bottom:12px;display:flex;align-items:center;gap:8px;"><span style="width:16px;height:1px;background:#02273b;"></span>Assembly Workmanship</h5>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#f7fafc;border-top:1px solid #e5e9eb;border-bottom:1px solid #e5e9eb;">
              <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:600;color:#73787d;">Description</th>
              <th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:600;color:#73787d;">Price (L.E)</th>
            </tr>
          </thead>
          <tbody>
            ${formWorkmanship.filter(r => r.desc).map((r, i) => `
              <tr style="border-bottom:1px solid #ebeef0;background:${i % 2 === 1 ? '#f7fafc' : '#fff'};">
                <td style="padding:10px;color:#181c1e;">${r.desc}</td>
                <td style="padding:10px;text-align:right;font-weight:600;color:#02273b;">${r.price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    const trHTML = formTransformation.filter(r => r.desc).length ? `
      <div>
        <h5 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#02273b;margin-bottom:12px;display:flex;align-items:center;gap:8px;"><span style="width:16px;height:1px;background:#02273b;"></span>Transformation Surcharges</h5>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#f7fafc;border-top:1px solid #e5e9eb;border-bottom:1px solid #e5e9eb;">
              <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:600;color:#73787d;">Description</th>
              <th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:600;color:#73787d;">Price (L.E)</th>
            </tr>
          </thead>
          <tbody>
            ${formTransformation.filter(r => r.desc).map((r, i) => `
              <tr style="border-bottom:1px solid #ebeef0;background:${i % 2 === 1 ? '#f7fafc' : '#fff'};">
                <td style="padding:10px;color:#181c1e;">${r.desc}</td>
                <td style="padding:10px;text-align:right;font-weight:600;color:#02273b;">${r.price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    const firstProductImage = products.find(p => p.id === formItems[0]?.productId)?.image || '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Quotation ${formNumber}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'IBM Plex Sans', sans-serif;
      background-color: #fff;
    }
    @media print {
      body {
        background-color: #fff;
      }
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body class="p-8">
  <div class="max-w-[950px] mx-auto bg-white">
    <!-- Header -->
    <div class="flex justify-between items-start mb-10 border-b border-slate-200 pb-6">
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <div class="bg-white border border-slate-100 rounded-xl p-2 shadow-sm w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 65" class="w-12 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10,32 C30,12 70,12 90,32 C70,22 30,22 10,32 Z" fill="#02273b" />
              <path d="M15,42 C35,25 65,25 85,42 C65,32 35,32 15,42 Z" fill="#006780" />
              <path d="M25,52 C40,39 60,39 75,52 C60,45 40,45 25,52 Z" fill="#86d1ed" />
            </svg>
          </div>
          <div>
            <h1 class="text-[#02273b] text-base font-black tracking-tight leading-none">AL-FATH</h1>
            <p class="text-[9px] text-[#006780] font-bold mt-1 uppercase tracking-wider">Engineering Industries</p>
          </div>
        </div>
        <div class="mt-4">
          <p class="text-[9px] text-slate-450 font-bold uppercase tracking-widest">Client</p>
          <h2 class="text-sm font-bold text-slate-800">${formClientName}</h2>
          ${formClientContact ? `<p class="text-xs text-slate-500 mt-0.5">Attn: ${formClientContact}</p>` : ''}
        </div>
      </div>
      <div class="text-right">
        <h1 class="text-3xl font-black text-[#02273b] uppercase tracking-tight">Quotation</h1>
        <p class="text-xs text-slate-400 font-semibold mt-1">Reference: ${formNumber}</p>
        <div class="flex gap-6 mt-4 justify-end text-right">
          <div>
            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Date</p>
            <p class="text-xs font-semibold text-slate-800">${fmtDateEN(formDate)}</p>
          </div>
          ${formProjectName ? `
            <div>
              <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Project</p>
              <p class="text-xs font-semibold text-slate-800">${formProjectName}</p>
            </div>
          ` : ''}
          <div>
            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Valid Until</p>
            <p class="text-xs font-semibold text-slate-800">${fmtDateEN(formValidUntil)}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Hero Image Showcase -->
    <div class="relative w-full h-48 bg-slate-100 rounded-2xl overflow-hidden mb-10 border border-slate-200">
      ${bannerImage ? `<img src="${bannerImage}" class="w-full h-full object-cover object-center"/>` : `<div class="w-full h-full flex items-center justify-center"><span class="text-slate-300 text-3xl font-extrabold">AL-FATH</span></div>`}
      <div class="absolute inset-0 bg-gradient-to-r from-[#02273b]/90 via-[#02273b]/40 to-transparent flex flex-col justify-center p-8">
        <p class="text-[10px] text-[#86d1ed] font-bold tracking-widest uppercase mb-1">Primary Fabrication</p>
        <h3 class="text-xl text-white font-black max-w-md leading-tight">${bannerTitle}</h3>
      </div>
    </div>

    <!-- Section I -->
    <div class="mb-10">
      <div class="flex items-center gap-4 mb-4">
        <div class="h-px bg-slate-200 flex-1"></div>
        <h4 class="text-[9px] font-bold uppercase text-slate-400 tracking-widest">I. Primary Fabrication Schedule</h4>
        <div class="h-px bg-slate-200 flex-1"></div>
      </div>
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="bg-slate-50 border-y border-slate-200 text-[9px] font-bold text-slate-400 uppercase">
            <th class="py-2.5 px-4 w-16">Item</th>
            <th class="py-2.5 px-4">Description</th>
            <th class="py-2.5 px-4 text-right w-24">Unit</th>
            <th class="py-2.5 px-4 text-right w-32">Qty</th>
            <th class="py-2.5 px-4 text-right w-32">Rate (L.E)</th>
            <th class="py-2.5 px-4 text-right w-40">Total (L.E)</th>
          </tr>
        </thead>
        <tbody class="align-top">
          ${sectionsHTML}
        </tbody>
      </table>
    </div>

    <!-- Section II -->
    ${accHTML}

    <!-- Section III -->
    ${(formWorkmanship.filter(r => r.desc).length || formTransformation.filter(r => r.desc).length) ? `
      <div class="mb-10 page-break">
        <div class="flex items-center gap-4 mb-5">
          <div class="h-px bg-slate-200 flex-1"></div>
          <h4 class="text-[9px] font-bold uppercase text-slate-400 tracking-widest">${secNumSupp}. Technical Supplements & Surcharges</h4>
          <div class="h-px bg-slate-200 flex-1"></div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
          ${wkHTML}
          ${trHTML}
        </div>
      </div>
    ` : ''}

    <!-- Section IV -->
    <div class="mb-10 bg-slate-50 rounded-2xl border border-slate-200 p-6">
      <h4 class="text-[9px] font-bold uppercase tracking-widest text-[#02273b] mb-4">IV. Commercial Terms</h4>
      <div class="grid grid-cols-3 gap-6">
        <div>
          <p class="text-[9px] font-bold text-slate-450 uppercase mb-1">Payment Structure</p>
          <p class="text-xs text-slate-700 leading-relaxed">${formPaymentTerms || '—'}</p>
        </div>
        <div>
          <p class="text-[9px] font-bold text-slate-450 uppercase mb-1">Delivery Timeline</p>
          <p class="text-xs text-slate-700 leading-relaxed"><strong class="font-semibold text-[#02273b]">${formDeliveryDays} Business Days</strong></p>
        </div>
        <div>
          <p class="text-[9px] font-bold text-slate-450 uppercase mb-1">Quote Validity</p>
          <p class="text-xs text-slate-700 leading-relaxed">Valid for <strong class="font-semibold text-[#02273b]">${fmtDateEN(formValidUntil)}</strong></p>
        </div>
      </div>
    </div>

    <!-- Signatures & Total -->
    <div class="mt-16 pt-8 border-t border-slate-200 flex justify-between items-end relative">
      <!-- Stamp APPROVED -->
      <div style="position:absolute; left:45%; top: -30px; transform: rotate(-12deg); opacity: 0.72;" class="bg-white border-4 border-[#02273b] text-[#02273b] font-bold py-3 px-6 rounded-lg uppercase tracking-widest flex flex-col items-center gap-1">
        <svg viewBox="0 0 100 65" class="w-12 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10,32 C30,12 70,12 90,32 C70,22 30,22 10,32 Z" fill="#02273b" />
          <path d="M15,42 C35,25 65,25 85,42 C65,32 35,32 15,42 Z" fill="#006780" />
          <path d="M25,52 C40,39 60,39 75,52 C60,45 40,45 25,52 Z" fill="#86d1ed" />
        </svg>
        <div class="text-[10px] text-center font-black leading-none mt-1">
          AL-FATH ENGINEERING<br>
          <span class="text-xs font-black">APPROVED</span>
        </div>
      </div>
      
      <div class="w-[60%] grid grid-cols-3 gap-4">
        <div class="text-center">
          <div class="h-12 border-b border-slate-300 mb-2"></div>
          <p class="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Sales Management</p>
        </div>
        <div class="text-center">
          <div class="h-12 border-b border-slate-300 mb-2"></div>
          <p class="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Contract Control</p>
        </div>
        <div class="text-center">
          <div class="h-12 border-b border-slate-300 mb-2"></div>
          <p class="text-[9px] text-slate-450 font-bold uppercase tracking-wider">General Manager</p>
        </div>
      </div>

      <div class="bg-[#02273b] p-5 rounded-2xl text-white min-w-[260px]">
        <div class="flex justify-between items-end mb-2">
          <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Grand Total (L.E)</span>
          <span class="text-xl font-bold">${fmtEN(liveTotals.total)}</span>
        </div>
        <div class="border-t border-slate-700/60 pt-2 flex justify-between items-center text-[10px]">
          <span class="text-slate-400 font-semibold">VAT Inclusive (${formTaxPct}%)</span>
          <span class="bg-[#86d1ed] text-[#02273b] font-black px-2 py-0.5 rounded text-[8px] uppercase">Final Review</span>
        </div>
      </div>
    </div>

    <!-- Footer Notes -->
    <div class="mt-12 flex justify-between items-center border-t border-slate-100 pt-4 text-[9px] text-slate-400 font-medium">
      <div class="flex gap-2">
        <span class="bg-slate-100 text-slate-400 px-2 py-0.5 rounded uppercase font-bold">Confidential</span>
        <span class="bg-slate-100 text-slate-400 px-2 py-0.5 rounded uppercase font-bold">Approved</span>
      </div>
      <p>© ${new Date().getFullYear()} Al-Fath Engineering Industries. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-[#02273b]">إنشاء عرض سعر ذكي</h2>
          <p className="text-xs text-slate-400 font-semibold">قم بتكوين بنود الإنتاج وتنظيمها في أقسام فرعية ومعاينة عرض السعر A4 لحظياً</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button type="button" onClick={() => handleSave(true)} className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
            <Save className="w-4 h-4"/>حفظ كمسودة
          </button>
          <button type="button" onClick={() => handleSave(false)} className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#006780]/15" style={{background:'#006780'}}>
            <Send className="w-4 h-4"/>حفظ وإرسال عرض السعر
          </button>
          <button type="button" onClick={handlePrint} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer" title="تحميل ملف PDF / طباعة">
            <Printer className="w-4 h-4"/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: INTERACTIVE BUILDER FORM (5/12 width) */}
        <div className="lg:col-span-5 space-y-6 max-h-[80vh] overflow-y-auto pr-1">
          {/* 1. Product Family type selection */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><ChevronRight className="w-4 h-4 text-[#006780]"/>عائلة الإنتاج الرئيسية</h3>
            <div className="grid grid-cols-3 gap-2">
              {[{key:'galvanized',label:'Galvanized',sub:'مجلفن',icon:'💿'},{key:'black',label:'Black Sheet',sub:'أسود',icon:'⬛'},{key:'general',label:'General',sub:'عام',icon:'📦'}].map(t=>(
                <button key={t.key} type="button" onClick={()=>handleProductTypeChange(t.key)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${formProductType===t.key?'border-[#006780] bg-[#006780]/5 text-[#02273b] font-bold':'border-slate-100 hover:border-slate-200'}`}>
                  <span className="text-xl">{t.icon}</span>
                  <div>
                    <p className="text-[10px] font-black">{t.label}</p>
                    <p className="text-[9px] text-slate-400">{t.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Client Details */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><ChevronRight className="w-4 h-4 text-[#006780]"/>تفاصيل العميل وعرض السعر</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wide">العميل في الـ CRM</label>
                <select value={formClientId} onChange={e=>handleClientSelect(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-slate-50/50">
                  <option value="">— اختر العميل لملء البيانات تلقائياً —</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.name} — {c.company||'فردي'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wide">اسم الشركة / العميل</label>
                <input type="text" value={formClientName} onChange={e=>setFormClientName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-slate-50/50" placeholder="شركة الإنشاءات..."/>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wide">جهة الاتصال / المهندس المسؤول</label>
                <input type="text" value={formClientContact} onChange={e=>setFormClientContact(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-slate-50/50" placeholder="م/ أحمد..."/>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wide">اسم المشروع</label>
                <input type="text" value={formProjectName} onChange={e=>setFormProjectName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-slate-50/50" placeholder="مشروع SPEED COOL..."/>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wide">تاريخ العرض</label>
                <input type="date" value={formDate} onChange={e=>setFormDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-slate-50/50"/>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wide">صالح حتى</label>
                <input type="date" value={formValidUntil} onChange={e=>setFormValidUntil(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-slate-50/50"/>
              </div>
            </div>
          </div>

          {/* 3. Items and Subsections Builder */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><ChevronRight className="w-4 h-4 text-[#006780]"/>I. جدول بنود الصاج المجلفن والأسود</h3>
            </div>
            
            {/* Loop through each subsection group */}
            {uniqueSubsections.map(subSecName => {
              const subSecItems = formItems.filter(it => it.subsection === subSecName);
              return (
                <div key={subSecName} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <input 
                      type="text" 
                      value={subSecName} 
                      onChange={e => {
                        const newName = e.target.value;
                        const updated = formItems.map(it => it.subsection === subSecName ? { ...it, subsection: newName } : it);
                        setFormItems(updated);
                      }}
                      className="font-bold text-xs text-[#02273b] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#006780] focus:outline-none px-1"
                    />
                    <button type="button" onClick={() => handleAddItem(subSecName)} className="text-[10px] font-bold text-[#006780] hover:text-[#02273b] flex items-center gap-0.5 px-2 py-1 rounded bg-[#006780]/5 cursor-pointer">
                      <Plus className="w-3 h-3"/>إضافة بند صاج مجلفن
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {subSecItems.map((item, idx) => {
                      const img = products.find(p => p.id === item.productId)?.image || item.image || '';
                      return (
                        <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-3 space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                            <span>بند فرعي #{idx+1}</span>
                            <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                          {img && (
                            <div className="h-20 w-full overflow-hidden rounded bg-slate-50 flex items-center justify-center border border-slate-100 mb-2">
                              <img src={img} alt="" className="h-full object-contain" style={{mixBlendMode: 'multiply'}}/>
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-3">
                              <label className="block text-[9px] text-slate-400 font-bold mb-0.5">استيراد منتج مسجل (اختياري للتعبئة التلقائية)</label>
                              <select value={item.productId || ''} onChange={e => handleItemChange(item.id, 'productId', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780] bg-white">
                                <option value="">-- أدخل البيانات يدوياً / اختر منتجاً للاستيراد --</option>
                                {products.filter(p => p.active !== false).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[9px] text-slate-400 font-bold mb-0.5">اسم البند / المنتج</label>
                              <input type="text" value={item.productName || ''} onChange={e => handleItemChange(item.id, 'productName', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" placeholder="مثال: دكت صاج مجلفن..."/>
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold mb-0.5">الوحدة</label>
                              <input type="text" value={item.unitType || ''} onChange={e => handleItemChange(item.id, 'unitType', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" placeholder="م²، طن، كجم..."/>
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold mb-0.5">الكمية</label>
                              <input type="number" value={item.qty || ''} onChange={e => handleItemChange(item.id, 'qty', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" min="0" step="0.001"/>
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold mb-0.5">سعر الوحدة (جنيه)</label>
                              <input type="number" value={item.unitPrice || ''} onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" min="0" step="0.01"/>
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold mb-0.5">الخصم (%)</label>
                              <input type="number" value={item.discountPct || ''} onChange={e => handleItemChange(item.id, 'discountPct', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" min="0" max="100"/>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-400 font-bold mb-0.5">عنوان البند في المستند</label>
                            <input type="text" value={item.itemTitle || ''} onChange={e => handleItemChange(item.id, 'itemTitle', e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" placeholder="RECTANGULAR GALVANIZED SHEET DUCTS"/>
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-400 font-bold mb-0.5">الوصف التفصيلي</label>
                            <input type="text" value={item.itemDesc || ''} onChange={e => handleItemChange(item.id, 'itemDesc', e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]"/>
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-400 font-bold mb-0.5">ملاحظات فنية ف التقديم</label>
                            <textarea value={item.techNotes || ''} onChange={e => handleItemChange(item.id, 'techNotes', e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#006780] font-mono" rows="3"/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <button type="button" onClick={() => {
              // Add new subsection group with a temporary name
              const num = uniqueSubsections.length + 1;
              handleAddItem(`قسم فرعي جديد #${num}`);
            }} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-white">
              <PlusCircle className="w-4 h-4"/>إضافة قسم فرعي جديد
            </button>
          </div>

          {/* 4. Accessories Picker */}
          <div className={`bg-white rounded-2xl p-5 border shadow-xs space-y-4 transition-all ${accLocked?'bg-amber-50/20 border-amber-200':'border-slate-100'}`}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><ChevronRight className="w-4 h-4 text-[#006780]"/>II. إكسسوارات ومكونات الفلنجة والزوايا</h3>
              <button type="button" onClick={()=>setAccLocked(!accLocked)} className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded ${accLocked?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-500'}`}>
                {accLocked ? <Lock className="w-2.5 h-2.5"/> : <Unlock className="w-2.5 h-2.5"/>}
                {accLocked ? 'LOCKED' : 'UNLOCKED'}
              </button>
            </div>
            
            {!accLocked && (
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">اضغط لإضافة / حذف من عرض السعر:</p>
                  <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                    {products.filter(p=>p.active!==false && p.categoryId !== 'cat_galvanized' && p.categoryId !== 'cat_black').map(prod=>{
                      const added = formAccessories.some(a=>a.productId===prod.id);
                      return <button key={prod.id} type="button" onClick={()=>added?handleRemoveAccessory(prod.id):handleAddAccessory(prod)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center text-[10px] transition-all cursor-pointer ${added?'border-[#006780] bg-[#006780]/5 text-[#02273b] font-bold':'border-slate-100 hover:border-slate-200 text-slate-600'}`}>
                        {prod.image?<div className="w-8 h-8 overflow-hidden rounded bg-slate-50 flex items-center justify-center"><img src={prod.image} alt="" className="w-full h-full object-contain"/></div>:<div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center"><Package className="w-4 h-4 text-slate-350"/></div>}
                        <span className="leading-tight mt-1">{prod.name}</span>
                        {added&&<span className="text-[8px] font-bold text-emerald-600">✓</span>}
                      </button>;
                    })}
                  </div>
                </div>

                {formAccessories.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">بيانات وتكلفة القطع المختارة:</p>
                    {formAccessories.map((acc, idx) => (
                      <div key={acc.productId} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>{acc.name}</span>
                          <button type="button" onClick={()=>handleRemoveAccessory(acc.productId)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] text-slate-400 font-bold mb-0.5">الوحدة</label>
                            <input type="text" value={acc.unitLabel||''} onChange={e=>handleAccChange(idx,'unitLabel',e.target.value)} className="w-full px-2 py-0.5 rounded border border-slate-200 text-xs bg-white focus:outline-none"/>
                          </div>
                          <div>
                            <label className="block text-[8px] text-slate-400 font-bold mb-0.5">سعر الوحدة ($)</label>
                            <input type="number" value={acc.unitPrice||''} onChange={e=>handleAccChange(idx,'unitPrice',parseFloat(e.target.value)||0)} className="w-full px-2 py-0.5 rounded border border-slate-200 text-xs bg-white focus:outline-none" min="0" step="0.01"/>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[8px] text-slate-400 font-bold mb-0.5">الوصف التفصيلي</label>
                            <input type="text" value={acc.description||''} onChange={e=>handleAccChange(idx,'description',e.target.value)} className="w-full px-2 py-0.5 rounded border border-slate-200 text-xs bg-white focus:outline-none"/>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Supplements Workmanship (Section III) */}
          <div className={`bg-white rounded-2xl p-5 border shadow-xs space-y-4 transition-all ${suppLocked?'bg-amber-50/20 border-amber-200':'border-slate-100'}`}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><ChevronRight className="w-4 h-4 text-[#006780]"/>III. التشغيلات الإضافية وسير العمل</h3>
              <button type="button" onClick={()=>setSuppLocked(!suppLocked)} className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded ${suppLocked?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-500'}`}>
                {suppLocked ? <Lock className="w-2.5 h-2.5"/> : <Unlock className="w-2.5 h-2.5"/>}
                {suppLocked ? 'LOCKED' : 'UNLOCKED'}
              </button>
            </div>
            
            {!suppLocked && (
              <div className="space-y-4">
                {/* Assembly Workmanship */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-600">مصنعيات التجميع والقص الدائري</p>
                    <button type="button" onClick={addWkRow} className="text-[9px] font-bold text-[#006780] hover:text-[#02273b] cursor-pointer">+ إضافة بند</button>
                  </div>
                  {formWorkmanship.map(r => (
                    <div key={r.id} className="flex gap-2 items-center">
                      <input type="text" value={r.desc} onChange={e=>changeWk(r.id,'desc',e.target.value)} placeholder="وصف المصنعية..." className="flex-grow px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none"/>
                      <input type="number" value={r.price} onChange={e=>changeWk(r.id,'price',e.target.value)} placeholder="0.00" className="w-20 px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none text-right" step="0.01"/>
                      <button type="button" onClick={()=>removeWkRow(r.id)} className="text-rose-500 hover:text-rose-700 cursor-pointer"><X className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>

                {/* Transformation Surcharges */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-600">تعديلات التحويلات والمساليب</p>
                    <button type="button" onClick={addTrRow} className="text-[9px] font-bold text-[#006780] hover:text-[#02273b] cursor-pointer">+ إضافة بند</button>
                  </div>
                  {formTransformation.map(r => (
                    <div key={r.id} className="flex gap-2 items-center">
                      <input type="text" value={r.desc} onChange={e=>changeTr(r.id,'desc',e.target.value)} placeholder="وصف التعديل الفني..." className="flex-grow px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none"/>
                      <input type="number" value={r.price} onChange={e=>changeTr(r.id,'price',e.target.value)} placeholder="0.00" className="w-20 px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none text-right" step="0.01"/>
                      <button type="button" onClick={()=>removeTrRow(r.id)} className="text-rose-500 hover:text-rose-700 cursor-pointer"><X className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 6. Commercial Terms (Section IV) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><ChevronRight className="w-4 h-4 text-[#006780]"/>IV. الشروط التجارية والمالية</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">طريقة وهيكلة الدفع</label>
                <textarea value={formPaymentTerms} onChange={e=>setFormPaymentTerms(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780] bg-slate-50/50" rows="2"/>
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">مدة التسليم (أيام عمل)</label>
                <input type="text" value={formDeliveryDays} onChange={e=>setFormDeliveryDays(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780] bg-slate-50/50" placeholder="14-21"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">نسبة الخصم الإجمالي (%)</label>
                  <input type="number" value={formDiscountPct} onChange={e=>setFormDiscountPct(parseFloat(e.target.value)||0)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780] bg-slate-50/50" min="0" max="100"/>
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">ضريبة القيمة المضافة (%)</label>
                  <input type="number" value={formTaxPct} onChange={e=>setFormTaxPct(parseFloat(e.target.value)||0)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780] bg-slate-50/50" min="0"/>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREMIUM A4 PRINT DOCUMENT PREVIEW (7/12 width) */}
        <div className="lg:col-span-7 bg-slate-100 rounded-2xl p-4 md:p-8 border border-slate-200 shadow-inner max-h-[85vh] overflow-y-auto flex justify-center">
          <div dir="ltr" className="w-full max-w-[850px] bg-white rounded-lg shadow-xl border border-slate-250 p-8 md:p-12 relative print-shadow-none print-border flex flex-col justify-between" style={{aspectRatio:'1/1.414', fontFamily:"'IBM Plex Sans', sans-serif"}}>
            
            <div className="space-y-10">
              {/* Document Header */}
              <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-white border border-slate-150 rounded-xl p-2 shadow-xs w-14 h-14 flex items-center justify-center">
                      <svg viewBox="0 0 100 65" className="w-10 h-6" fill="none" xmlns="http://www.w3.org/2050/svg">
                        <path d="M10,32 C30,12 70,12 90,32 C70,22 30,22 10,32 Z" fill="#02273b" />
                        <path d="M15,42 C35,25 65,25 85,42 C65,32 35,32 15,42 Z" fill="#006780" />
                        <path d="M25,52 C40,39 60,39 75,52 C60,45 40,45 25,52 Z" fill="#86d1ed" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-[#02273b] text-sm font-black tracking-tight leading-none">AL-FATH</h1>
                      <p className="text-[8px] text-[#006780] font-bold mt-0.5 uppercase tracking-wider">Engineering Industries</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Client</p>
                    <h2 class="text-xs font-bold text-slate-800 uppercase">{formClientName || 'ELNADA FOR CONTRACTING'}</h2>
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end">
                  <h1 className="text-2xl font-black text-[#02273b] uppercase tracking-tight mb-1">Quotation</h1>
                  <p className="text-[10px] text-slate-400 font-semibold">Reference: {formNumber}</p>
                  <div className="flex gap-6 mt-4 text-right">
                    <div>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Date</p>
                      <p className="text-[10px] font-bold text-slate-850">{fmtDateEN(formDate)}</p>
                    </div>
                    {formProjectName && (
                      <div>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Project</p>
                        <p className="text-[10px] font-bold text-slate-850 uppercase">{formProjectName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Valid Until</p>
                      <p className="text-[10px] font-bold text-slate-850">{fmtDateEN(formValidUntil)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Hero Banner */}
              <div className="relative w-full h-36 md:h-44 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                {bannerImage ? (
                  <img src={bannerImage} alt="" className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-slate-200 text-3xl">AL-FATH</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#02273b]/90 via-[#02273b]/50 to-transparent flex flex-col justify-center p-6">
                  <p className="text-[8px] text-[#86d1ed] tracking-widest uppercase font-bold mb-1">Primary Fabrication</p>
                  <h3 className="text-base text-white font-black max-w-sm leading-tight">{bannerTitle}</h3>
                </div>
              </div>

              {/* Section I Table */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <h4 className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">I. Primary Fabrication Schedule</h4>
                  <div class="h-px bg-slate-200 flex-1"></div>
                </div>
                
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr class="bg-slate-50 border-y border-slate-200 text-[8px] font-bold text-slate-400 uppercase">
                      <th class="py-2 px-3 w-10">Item</th>
                      <th class="py-2 px-3">Description</th>
                      <th class="py-2 px-3 text-right w-16">Unit</th>
                      <th class="py-2 px-3 text-right w-20">Qty</th>
                      <th class="py-2 px-3 text-right w-24">Rate (L.E)</th>
                      <th class="py-2 px-3 text-right w-28">Total (L.E)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueSubsections.map((subSecName, subSecIdx) => {
                      const subItems = liveTotals.items.filter(it => it.subsection === subSecName);
                      return (
                        <React.Fragment key={subSecName}>
                          <tr className="bg-slate-100/60 font-bold border-b border-slate-200">
                            <td colSpan={6} className="py-2 px-3 text-[9px] text-[#02273b] font-black uppercase">{subSecName}</td>
                          </tr>
                          {subItems.map((it, i) => (
                            <tr key={it.id} className="border-b border-slate-200 last:border-0">
                              <td className="py-4 px-3 text-slate-400 font-semibold align-top">{subSecIdx + 1}.{i + 1}</td>
                              <td className="py-4 px-3 align-top">
                                <p className="font-bold text-slate-800 uppercase mb-1">{it.itemTitle || it.productName}</p>
                                {it.itemDesc && <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">{it.itemDesc}</p>}
                                {it.techNotes && (
                                  <div className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 mt-1.5">
                                    <p className="text-[8px] font-bold text-[#02273b] uppercase tracking-wider mb-1">Technical Note:</p>
                                    <p className="text-[10px] text-slate-500 whitespace-pre-wrap leading-relaxed">
                                      {it.techNotes.includes('275 g/m²') ? (
                                        <span>{it.techNotes.substring(0, it.techNotes.indexOf('275 g/m²'))}<strong className="text-red-500 font-bold">275 g/m²</strong>{it.techNotes.substring(it.techNotes.indexOf('275 g/m²') + '275 g/m²'.length)}</span>
                                      ) : it.techNotes}
                                    </p>
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-3 text-right text-slate-500 align-top">{it.unitType || '—'}</td>
                              <td className="py-4 px-3 text-right font-semibold text-slate-700 align-top">{(it.qty || 0).toLocaleString('en')}</td>
                              <td className="py-4 px-3 text-right text-slate-500 align-top">{fmtEN(it.unitPrice)}</td>
                              <td className="py-4 px-3 text-right font-bold text-slate-850 align-top">{fmtEN(it.total)}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Section II: Accessories */}
              {formAccessories.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <h4 className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">II. Specialized Component Index</h4>
                    <div class="h-px bg-slate-200 flex-1"></div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {formAccessories.map((a, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg border border-slate-200 p-3 flex flex-col justify-between">
                        <div>
                          <div className="h-16 bg-white rounded border border-slate-100 flex items-center justify-center p-1 overflow-hidden mb-2">
                            {a.image ? <img src={a.image} alt="" className="max-h-full max-w-full object-contain" style={{mixBlendMode:'multiply'}}/> : <span className="text-xl">📦</span>}
                          </div>
                          <h5 className="font-bold text-slate-800 text-[10px] leading-tight mb-0.5">{a.name}</h5>
                          {a.description && <p className="text-[8px] text-slate-400 leading-normal mb-2">{a.description}</p>}
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-150 pt-2 mt-auto">
                          <span className="text-[8px] font-bold text-slate-400 uppercase">UNIT PRICE</span>
                          <span className="text-[10px] font-black text-[#02273b]">${fmtEN(a.unitPrice)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section III: Supplements */}
              {(formWorkmanship.filter(r => r.desc).length > 0 || formTransformation.filter(r => r.desc).length > 0) && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <h4 className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">{formAccessories.length ? 'III' : 'II'}. Technical Supplements & Surcharges</h4>
                    <div class="h-px bg-slate-200 flex-1"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {formWorkmanship.filter(r => r.desc).length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[8px] font-bold text-[#02273b] uppercase flex items-center gap-1.5"><span className="w-3 h-px bg-[#02273b]"/>Assembly Workmanship</h5>
                        <table className="w-full text-left text-[10px] border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-y border-slate-200 font-bold text-slate-400 uppercase text-[8px]">
                              <th className="py-1 px-2">Description</th>
                              <th className="py-1 px-2 text-right">Price (L.E)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formWorkmanship.filter(r => r.desc).map((r, i) => (
                              <tr key={i} className="border-b border-slate-100">
                                <td className="py-1.5 px-2 text-slate-650">{r.desc}</td>
                                <td className="py-1.5 px-2 text-right font-semibold text-[#02273b]">{r.price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {formTransformation.filter(r => r.desc).length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[8px] font-bold text-[#02273b] uppercase flex items-center gap-1.5"><span className="w-3 h-px bg-[#02273b]"/>Transformation Surcharges</h5>
                        <table className="w-full text-left text-[10px] border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-y border-slate-200 font-bold text-slate-400 uppercase text-[8px]">
                              <th className="py-1 px-2">Description</th>
                              <th className="py-1 px-2 text-right">Price (L.E)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formTransformation.filter(r => r.desc).map((r, i) => (
                              <tr key={i} className="border-b border-slate-100">
                                <td className="py-1.5 px-2 text-slate-650">{r.desc}</td>
                                <td className="py-1.5 px-2 text-right font-semibold text-[#02273b]">{r.price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Section IV: Commercial Terms */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h4 className="text-[8px] font-bold uppercase text-[#02273b] mb-3">IV. Commercial Terms</h4>
                <div className="grid grid-cols-3 gap-4 text-[10px]">
                  <div>
                    <p className="text-[8px] font-bold text-slate-450 uppercase mb-1">Payment Structure</p>
                    <p className="text-slate-600 leading-normal">{formPaymentTerms || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-450 uppercase mb-1">Delivery Timeline</p>
                    <p className="text-slate-600 leading-normal"><strong class="font-bold text-[#02273b]">{formDeliveryDays} Business Days</strong></p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-450 uppercase mb-1">Quote Validity</p>
                    <p className="text-slate-600 leading-normal">Valid for <strong class="font-bold text-[#02273b]">{fmtDateEN(formValidUntil)}</strong></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Signature & Total */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end relative">
              {/* Approved Stamp */}
              <div style={{transform: 'rotate(-12deg)', opacity: 0.75}} className="absolute left-[40%] top-0 -translate-y-1/3 bg-white border-2.5 border-[#02273b] text-[#02273b] font-bold py-1.5 px-3 rounded-lg uppercase flex flex-col items-center gap-0.5">
                <svg viewBox="0 0 100 65" className="w-8 h-4.5" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10,32 C30,12 70,12 90,32 C70,22 30,22 10,32 Z" fill="#02273b" />
                  <path d="M15,42 C35,25 65,25 85,42 C65,32 35,32 15,42 Z" fill="#006780" />
                  <path d="M25,52 C40,39 60,39 75,52 C60,45 40,45 25,52 Z" fill="#86d1ed" />
                </svg>
                <div className="text-[7px] text-center font-black leading-none mt-0.5">
                  AL-FATH ENGINEERING<br />
                  <span className="text-[9px] font-black">APPROVED</span>
                </div>
              </div>

              <div className="w-[55%] grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="h-10 border-b border-slate-200 mb-1"></div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Sales Management</p>
                </div>
                <div className="text-center">
                  <div className="h-10 border-b border-slate-200 mb-1"></div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Contract Control</p>
                </div>
                <div className="text-center">
                  <div className="h-10 border-b border-slate-200 mb-1"></div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">General Manager</p>
                </div>
              </div>

              <div className="bg-[#02273b] p-4 rounded-xl text-white min-w-[200px] text-right">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[8px] font-bold text-slate-350 uppercase">Grand Total (L.E)</span>
                  <span className="text-lg font-black">{fmtEN(liveTotals.total)}</span>
                </div>
                <div className="border-t border-slate-700/60 pt-1 flex justify-between items-center text-[8px] text-slate-400">
                  <span>VAT Inclusive (${formTaxPct}%)</span>
                  <span className="bg-[#86d1ed] text-[#02273b] font-black px-1.5 py-0.5 rounded text-[7px] uppercase">Final Review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
