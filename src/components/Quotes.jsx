import React, { useState } from 'react';
import {
  Search, Plus, Printer, Edit, Eye, RefreshCw, Trash2, X,
  PlusCircle, FileText, Send, Save, ChevronRight, Layers,
  Package, Lock, Unlock
} from 'lucide-react';
import { DB } from '../db/db.js';
import { CostEngine } from '../db/costEngine.js';

// ── Pre-fill constants ────────────────────────────────────────────────────────
const TYPE_TITLE = { galvanized:'RECTANGULAR GALVANIZED SHEET METAL DUCTS', black:'BLACK SHEET METAL DUCTS', general:'' };
const TYPE_DESC  = { galvanized:'Supply and manufacturing only of rectangular galvanized sheet metal ducts according to the required specifications and SMACNA.', black:'Supply and manufacturing of black sheet metal ducts for industrial and kitchen ventilation systems.', general:'' };
const TYPE_TECH  = {
  galvanized:`1. For slip & drive connection the weight includes slip & drive transverse connection.\n2. For TDF flange connection the price does not include corners and G-clamps.\n3. For TDC flange connection the price does not include corners and G-clamps.\n4. Galvanized duct gauges will be according to project specifications.\n5. Thickness: according to SMACNA.\n6. Material: Galvanized sheet metals 275 g/m².`,
  black:`1. Supply & manufacturing of black sheet metal ducts for kitchen/industrial ventilation.\n2. Welding: continuous TIG weld, oil and heat resistant.\n3. Surface treatment: heat-resistant paint coating, suitable up to 350°C.\n4. Thickness: according to SMACNA specifications.\n5. Material: Black steel sheet (St37).`,
  general:'',
};
const DEFAULT_WK = (type) => type==='galvanized'||type==='black' ? [
  {id:'wk1', desc:'Round cut duct (4" to 10")',  price:'120.00'},
  {id:'wk2', desc:'Round cut duct (12" to 18")', price:'220.00'},
  {id:'wk3', desc:'Round cut duct (Over 20")',   price:'470.00'},
] : [];
const DEFAULT_TR = (type) => type==='galvanized' ? [
  {id:'tr1', desc:'Square to round up to 10"',        price:'120.00'},
  {id:'tr2', desc:'Square to round from 12" to 20"',  price:'220.00'},
  {id:'tr3', desc:'Square to round from 22" to 30"',  price:'470.00'},
] : [];

const mkId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);

// ── Stamp React component ────────────────────────────────────────────────────
const Stamp = () => (
  <div style={{width:130,height:130,flexShrink:0}}>
    <div style={{width:'100%',height:'100%',transform:'rotate(-12deg)',opacity:0.72}}>
      <div style={{position:'relative',width:'100%',height:'100%'}}>
        <svg viewBox="0 0 130 130" style={{width:'100%',height:'100%',position:'absolute',inset:0}}>
          <circle cx="65" cy="65" r="60" fill="none" stroke="#02273b" strokeWidth="3"/>
          <circle cx="65" cy="65" r="52" fill="none" stroke="#02273b" strokeWidth="1"/>
          <defs>
            <path id="ta2" d="M 15,65 A 50,50 0 0,1 115,65"/>
            <path id="ba2" d="M 20,80 A 50,50 0 0,0 110,80"/>
          </defs>
          <text fontSize="8.5" fontWeight="700" letterSpacing="2.5" fill="#02273b" fontFamily="IBM Plex Sans,sans-serif">
            <textPath href="#ta2" startOffset="5%">AL-FATH ENGINEERING INDUSTRIES</textPath>
          </text>
          <text fontSize="7.5" fontWeight="600" letterSpacing="2" fill="#006780" fontFamily="IBM Plex Sans,sans-serif">
            <textPath href="#ba2" startOffset="15%">EST. 1985 · EGYPT</textPath>
          </text>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3}}>
          <div style={{fontSize:7,fontWeight:700,letterSpacing:3,color:'#02273b',textTransform:'uppercase'}}>QUOTATION</div>
          <div style={{width:38,height:1,background:'#02273b'}}/>
          <div style={{fontSize:15,fontWeight:900,letterSpacing:2,color:'#02273b',lineHeight:1}}>APPROVED</div>
          <div style={{width:38,height:1,background:'#02273b'}}/>
          <div style={{fontSize:7,fontWeight:600,letterSpacing:2,color:'#006780'}}>{new Date().getFullYear()}</div>
        </div>
      </div>
    </div>
  </div>
);

const STAMP_HTML = (yr) => `<div style="position:absolute;top:50%;left:55%;transform:translate(-50%,-50%) rotate(-12deg);opacity:0.7;pointer-events:none;width:130px;height:130px"><svg viewBox="0 0 130 130" style="width:100%;height:100%;position:absolute;inset:0"><circle cx="65" cy="65" r="60" fill="none" stroke="#02273b" stroke-width="3"/><circle cx="65" cy="65" r="52" fill="none" stroke="#02273b" stroke-width="1"/><defs><path id="ta" d="M 15,65 A 50,50 0 0,1 115,65"/><path id="ba" d="M 20,80 A 50,50 0 0,0 110,80"/></defs><text font-size="8.5" font-weight="700" letter-spacing="2.5" fill="#02273b" font-family="IBM Plex Sans,sans-serif"><textPath href="#ta" startOffset="5%">AL-FATH ENGINEERING INDUSTRIES</textPath></text><text font-size="7.5" font-weight="600" letter-spacing="2" fill="#006780" font-family="IBM Plex Sans,sans-serif"><textPath href="#ba" startOffset="15%">EST. 1985 &middot; EGYPT</textPath></text></svg><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px"><div style="font-size:7px;font-weight:700;letter-spacing:3px;color:#02273b;text-transform:uppercase">QUOTATION</div><div style="width:38px;height:1px;background:#02273b"></div><div style="font-size:15px;font-weight:900;letter-spacing:2px;color:#02273b;line-height:1">APPROVED</div><div style="width:38px;height:1px;background:#02273b"></div><div style="font-size:7px;font-weight:600;letter-spacing:2px;color:#006780">${yr}</div></div></div>`;

// ── Section Header with Lock ────────────────────────────────────────────────
const SectionHeader = ({ title, locked, onToggleLock, children }) => (
  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
    <h4 className="font-bold text-xs text-slate-700 flex items-center gap-2">
      <ChevronRight className="w-4 h-4 text-[#006780]"/>
      {title}
    </h4>
    <div className="flex items-center gap-2">
      {children}
      <button type="button" onClick={onToggleLock}
        title={locked ? 'Section Locked — click to unlock' : 'Section Unlocked — click to lock'}
        className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${locked ? 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}>
        {locked ? <Lock className="w-3 h-3"/> : <Unlock className="w-3 h-3"/>}
        {locked ? 'LOCKED' : 'UNLOCKED'}
      </button>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
export default function Quotes({ quotes, clients, products, settings, onUpdate }) {
  const [searchTerm, setSearchTerm]     = useState('');
  const [activeTab, setActiveTab]       = useState('');
  const [viewingQuote, setViewingQuote] = useState(null);
  const [editingQuote, setEditingQuote] = useState(null);
  const [isAddMode, setIsAddMode]       = useState(false);
  const [statusChangingQuote, setStatusChangingQuote] = useState(null);

  // Basic form state
  const [formNumber, setFormNumber]             = useState('');
  const [formClientId, setFormClientId]         = useState('');
  const [formClientName, setFormClientName]     = useState('');
  const [formClientContact, setFormClientContact] = useState('');
  const [formProjectName, setFormProjectName]   = useState('');
  const [formDate, setFormDate]                 = useState('');
  const [formValidUntil, setFormValidUntil]     = useState('');
  const [formPaymentTerms, setFormPaymentTerms] = useState('');
  const [formDeliveryDays, setFormDeliveryDays] = useState('14-21');
  const [formNotes, setFormNotes]               = useState('');
  const [formDiscountPct, setFormDiscountPct]   = useState(0);
  const [formTaxPct, setFormTaxPct]             = useState(14);
  const [formProductType, setFormProductType]   = useState('galvanized');
  const [formItems, setFormItems]               = useState([]);

  // Section II — Accessories
  const [formAccessories, setFormAccessories]   = useState([]);
  const [accLocked, setAccLocked]               = useState(false);

  // Section III — Supplements (dynamic rows)
  const [formWorkmanship, setFormWorkmanship]       = useState([]);
  const [formTransformation, setFormTransformation] = useState([]);
  const [suppLocked, setSuppLocked]                 = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const cNameEn   = settings.nameEn    || 'Al-Fath Engineering Industries';
  const cAddrEn   = settings.addressEn || 'Industrial Zone, 10th of Ramadan City, Egypt';
  const fmtEN     = (v) => (v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtDateEN = (d) => d ? new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—';
  const today     = () => new Date().toISOString().split('T')[0];
  const dateAdd   = (ds,n) => { const d=new Date(ds||new Date()); d.setDate(d.getDate()+n); return d.toISOString().split('T')[0]; };
  const genNum    = () => `QT-${new Date().getFullYear()}-${String(quotes.length+1).padStart(4,'0')}`;

  const siMap = {
    draft:    {ar:'مسودة', en:'DRAFT',    cls:'bg-slate-100 text-slate-700 border-slate-200'},
    sent:     {ar:'مرسل',  en:'SENT',     cls:'bg-blue-50 text-blue-700 border-blue-200'},
    accepted: {ar:'مقبول', en:'ACCEPTED', cls:'bg-emerald-50 text-emerald-700 border-emerald-200'},
    rejected: {ar:'مرفوض',en:'REJECTED',  cls:'bg-rose-50 text-rose-700 border-rose-200'},
    expired:  {ar:'منتهي', en:'EXPIRED',  cls:'bg-amber-50 text-amber-700 border-amber-200'},
  };
  const si   = (s) => siMap[s] || {ar:'غير محدد',en:'UNKNOWN',cls:'bg-slate-100 text-slate-600'};
  const badge = (s) => { const i=si(s); return <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${i.cls}`}>{i.ar}</span>; };

  const calcTotals = (q) => {
    const sub  = (q.items||[]).reduce((a,it)=>a+(it.total||0),0);
    const disc = sub * ((q.discountPct||0)/100);
    const after = sub - disc;
    const tax  = after * ((q.taxPct??14)/100);
    return {subtotal:sub, discountAmt:disc, taxAmt:tax, total:after+tax};
  };

  // ── Open Add ─────────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setIsAddMode(true);
    const td = today();
    setFormNumber(genNum()); setFormClientId(''); setFormClientName(''); setFormClientContact('');
    setFormProjectName(''); setFormDate(td);
    setFormValidUntil(dateAdd(td, parseInt(settings.quoteValidity)||30));
    setFormPaymentTerms('80% down payment upon order confirmation. Balance due within 7 days of delivery.');
    setFormDeliveryDays('14-21'); setFormNotes('');
    setFormDiscountPct(0); setFormTaxPct(14); setFormProductType('galvanized');
    setFormItems([]); setFormAccessories([]);
    setFormWorkmanship(DEFAULT_WK('galvanized').map(r=>({...r,id:mkId()})));
    setFormTransformation(DEFAULT_TR('galvanized').map(r=>({...r,id:mkId()})));
    setAccLocked(false); setSuppLocked(false);
    setEditingQuote({id:'temp'});
  };

  // ── Open Edit ─────────────────────────────────────────────────────────────────
  const handleOpenEdit = (q) => {
    setIsAddMode(false); setEditingQuote(q);
    setFormNumber(q.number||''); setFormClientId(q.clientId||'');
    setFormClientName(q.clientName||''); setFormClientContact(q.clientContact||'');
    setFormProjectName(q.projectName||'');
    setFormDate(q.date?.split('T')[0]||''); setFormValidUntil(q.validUntil?.split('T')[0]||'');
    setFormPaymentTerms(q.paymentTerms||''); setFormDeliveryDays(q.deliveryDays||'14-21');
    setFormNotes(q.notes||'');
    setFormDiscountPct(q.discountPct||0); setFormTaxPct(q.taxPct??14);
    setFormProductType(q.productType||'galvanized');
    setFormItems(q.items||[]);
    setFormAccessories(q.accessories||[]);
    const pt = q.productType||'galvanized';
    setFormWorkmanship(q.workmanship  || DEFAULT_WK(pt).map(r=>({...r,id:mkId()})));
    setFormTransformation(q.transformation || DEFAULT_TR(pt).map(r=>({...r,id:mkId()})));
    setAccLocked(q.accLocked||false);
    setSuppLocked(q.suppLocked||false);
  };

  const handleClientSelect = (id) => {
    const c = clients.find(x=>x.id===id);
    if (c) { setFormClientId(c.id); setFormClientName(c.name); setFormClientContact(c.contactPerson||''); }
    else   { setFormClientId(''); setFormClientName(''); setFormClientContact(''); }
  };

  const handleProductTypeChange = (type) => {
    setFormProductType(type);
    setFormItems(prev=>prev.map(it=>({...it,itemTitle:TYPE_TITLE[type],itemDesc:TYPE_DESC[type],techNotes:TYPE_TECH[type]})));
    if (!suppLocked) {
      setFormWorkmanship(DEFAULT_WK(type).map(r=>({...r,id:mkId()})));
      setFormTransformation(DEFAULT_TR(type).map(r=>({...r,id:mkId()})));
    }
  };

  // ── Items ─────────────────────────────────────────────────────────────────────
  const handleAddItem = () => {
    const pool = products.filter(p=>p.active!==false);
    if (!pool.length) { alert('لا توجد منتجات نشطة'); return; }
    const prod = pool[0];
    const calc = CostEngine.calculate(prod);
    setFormItems([...formItems, {
      productId:prod.id, productName:prod.name,
      itemTitle:TYPE_TITLE[formProductType], itemDesc:TYPE_DESC[formProductType],
      unitType:prod.unitType, image:prod.image||'',
      qty:1, unitPrice:calc?calc.finalPrice:0,
      discountPct:0, techNotes:TYPE_TECH[formProductType],
    }]);
  };

  const handleRemoveItem = (idx) => setFormItems(formItems.filter((_,i)=>i!==idx));

  const handleItemChange = (idx, field, val) => {
    const upd = [...formItems];
    if (field==='productId') {
      const prod = products.find(p=>p.id===val);
      if (prod) {
        const calc = CostEngine.calculate(prod);
        upd[idx] = {...upd[idx], productId:prod.id, productName:prod.name, unitType:prod.unitType, image:prod.image||'', unitPrice:calc?calc.finalPrice:0};
      }
    } else upd[idx][field] = val;
    setFormItems(upd);
  };

  // ── Accessories (Section II) ─────────────────────────────────────────────────
  const handleAddAccessory = (prod) => {
    if (formAccessories.find(a=>a.productId===prod.id)) return;
    const calc = CostEngine.calculate(prod);
    setFormAccessories([...formAccessories, {
      productId:prod.id, name:prod.name,
      description:prod.description||'',
      image:prod.image||'', unitLabel:prod.unitType||'pc',
      unitPrice:calc?calc.finalPrice:0,
    }]);
  };

  const handleRemoveAccessory = (prodId) => setFormAccessories(formAccessories.filter(a=>a.productId!==prodId));

  const handleAccChange = (idx, field, val) => {
    const upd = [...formAccessories]; upd[idx][field] = val; setFormAccessories(upd);
  };

  // ── Supplements (Section III) ────────────────────────────────────────────────
  const addWkRow    = () => setFormWorkmanship([...formWorkmanship, {id:mkId(), desc:'', price:'0.00'}]);
  const removeWkRow = (id) => setFormWorkmanship(formWorkmanship.filter(r=>r.id!==id));
  const changeWk    = (id,field,val) => setFormWorkmanship(formWorkmanship.map(r=>r.id===id?{...r,[field]:val}:r));

  const addTrRow    = () => setFormTransformation([...formTransformation, {id:mkId(), desc:'', price:'0.00'}]);
  const removeTrRow = (id) => setFormTransformation(formTransformation.filter(r=>r.id!==id));
  const changeTr    = (id,field,val) => setFormTransformation(formTransformation.map(r=>r.id===id?{...r,[field]:val}:r));

  // ── Live totals ───────────────────────────────────────────────────────────────
  const liveTotals = (() => {
    const items = formItems.map(it => {
      const s=(it.qty||0)*(it.unitPrice||0), d=s*((it.discountPct||0)/100), t=s-d;
      return {...it,subtotal:s,discountAmt:d,total:t};
    });
    const sub = items.reduce((acc, it) => acc + (it.total || 0), 0);
    const disc=sub*((parseFloat(formDiscountPct)||0)/100);
    const after=sub-disc;
    const tax=after*((parseFloat(formTaxPct)||0)/100);
    return {items,subtotal:sub,discountPct:parseFloat(formDiscountPct)||0,discountAmt:disc,taxPct:parseFloat(formTaxPct)||0,taxAmt:tax,total:after+tax};
  })();

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = (asDraft=true) => {
    if (!formClientName.trim()) { alert('يرجى إدخال اسم العميل'); return; }
    if (!liveTotals.items.length) { alert('يرجى إضافة بند واحد على الأقل'); return; }
    const data = {
      number:formNumber||genNum(), productType:formProductType,
      clientId:formClientId, clientName:formClientName, clientContact:formClientContact,
      projectName:formProjectName.trim(), date:formDate||today(),
      validUntil:formValidUntil||dateAdd(formDate,30),
      paymentTerms:formPaymentTerms, deliveryDays:formDeliveryDays,
      notes:formNotes, items:liveTotals.items, accessories:formAccessories,
      workmanship:formWorkmanship, transformation:formTransformation,
      accLocked, suppLocked,
      subtotal:liveTotals.subtotal, discountPct:liveTotals.discountPct,
      discountAmt:liveTotals.discountAmt, taxPct:liveTotals.taxPct,
      taxAmt:liveTotals.taxAmt, total:liveTotals.total,
    };
    if (isAddMode) DB.insert('quotes',{...data,status:asDraft?'draft':'sent'});
    else { const prev=DB.getById('quotes',editingQuote.id); DB.update('quotes',editingQuote.id,{...data,status:prev?.status||'draft'}); }
    onUpdate(); setEditingQuote(null);
  };

  const handleSetStatus = (s) => { DB.update('quotes',statusChangingQuote.id,{status:s}); onUpdate(); setStatusChangingQuote(null); };
  const handleDelete    = (q) => { if (window.confirm(`حذف "${q.number}"?`)) { DB.delete('quotes',q.id); onUpdate(); } };

  // ── Print ──────────────────────────────────────────────────────────────────────
  const handlePrint = (q) => {
    const tots = calcTotals(q);
    const acc  = q.accessories || [];
    const wk   = q.workmanship    || DEFAULT_WK(q.productType||'galvanized');
    const tr   = q.transformation || DEFAULT_TR(q.productType||'galvanized');
    const heroImg = products.find(p=>p.id===q.items?.[0]?.productId)?.image || q.items?.[0]?.image || '';

    const itemsHTML = (q.items||[]).map((it,i)=>`
      <tr style="border-bottom:1px solid #e5e9eb">
        <td style="padding:14px 12px;color:#73787d;font-size:12px;vertical-align:top">${i+1}.${i+1}</td>
        <td style="padding:14px 12px;vertical-align:top">
          ${it.itemTitle?`<p style="font-weight:700;color:#181c1e;font-size:14px;margin-bottom:6px;text-transform:uppercase">${it.itemTitle}</p>`:`<p style="font-weight:700;color:#181c1e;font-size:14px;margin-bottom:6px">${it.productName}</p>`}
          ${it.itemDesc?`<p style="color:#42474c;font-size:12px;margin-bottom:10px;line-height:1.7">${it.itemDesc}</p>`:''}
          ${it.techNotes?`<div style="background:#f7fafc;border:1px solid #e5e9eb;border-radius:6px;padding:12px;margin-top:6px"><p style="font-size:10px;font-weight:700;color:#02273b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Technical Note:</p><p style="font-size:12px;color:#42474c;white-space:pre-wrap;line-height:1.9">${it.techNotes}</p></div>`:''}
        </td>
        <td style="padding:14px 12px;text-align:right;font-size:13px;vertical-align:top;white-space:nowrap">${it.unitType||'—'}</td>
        <td style="padding:14px 12px;text-align:right;font-size:13px;vertical-align:top;white-space:nowrap">${(it.qty||0).toLocaleString('en')}</td>
        <td style="padding:14px 12px;text-align:right;font-size:13px;vertical-align:top;white-space:nowrap">${fmtEN(it.unitPrice)}</td>
        <td style="padding:14px 12px;text-align:right;font-size:14px;font-weight:700;color:#181c1e;vertical-align:top;white-space:nowrap">${fmtEN(it.total)}</td>
      </tr>`).join('');

    const accHTML = acc.length ? `
      <div style="padding:0 48px 32px">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px"><hr style="flex:1;border:none;border-top:1px solid #e5e9eb"/><h4 style="font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#73787d;white-space:nowrap">II. Specialized Component Index</h4><hr style="flex:1;border:none;border-top:1px solid #e5e9eb"/></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px">
          ${acc.map(a=>`<div style="background:#fff;border:1px solid #e5e9eb;border-radius:8px;padding:14px;display:flex;flex-direction:column">${a.image?`<div style="height:80px;background:#f7fafc;border:1px solid #ebeef0;border-radius:6px;margin-bottom:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:8px"><img src="${a.image}" style="max-height:100%;max-width:100%;object-fit:contain;mix-blend-mode:multiply"/></div>`:`<div style="height:80px;background:#f7fafc;border:1px solid #ebeef0;border-radius:6px;margin-bottom:10px;display:flex;align-items:center;justify-content:center"><span style="font-size:24px">📦</span></div>`}<p style="font-size:11px;font-weight:700;color:#181c1e;margin-bottom:4px;text-transform:uppercase">${a.name}</p>${a.description?`<p style="font-size:10px;color:#73787d;margin-bottom:8px;flex:1;line-height:1.5">${a.description}</p>`:'<div style="flex:1"></div>'}<div style="border-top:1px solid #ebeef0;padding-top:8px;margin-top:4px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d">UNIT PRICE${a.unitLabel&&a.unitLabel!=='pc'?' ('+a.unitLabel+')':''}</span><span style="font-size:13px;font-weight:700;color:#02273b">${fmtEN(a.unitPrice)} L.E</span></div></div>`).join('')}
        </div>
      </div>` : '';

    const secNumSupp = acc.length ? 'III' : 'II';
    const wkHTML = wk.filter(r=>r.desc).length ? `
      <div>
        <h5 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#02273b;margin-bottom:12px">Assembly Workmanship</h5>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#f7fafc;border-top:1px solid #e5e9eb;border-bottom:1px solid #e5e9eb"><th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:600;color:#73787d">Description</th><th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:600;color:#73787d">Price (L.E / pc)</th></tr></thead>
          <tbody>${wk.filter(r=>r.desc).map((r,i)=>`<tr style="border-bottom:1px solid #ebeef0;background:${i%2===1?'#f7fafc':'#fff'}"><td style="padding:10px">${r.desc}</td><td style="padding:10px;text-align:right;font-weight:600;color:#02273b">${r.price||'—'}</td></tr>`).join('')}</tbody>
        </table>
      </div>` : '';

    const trHTML = tr.filter(r=>r.desc).length ? `
      <div>
        <h5 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#02273b;margin-bottom:12px">Transformation Surcharges</h5>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#f7fafc;border-top:1px solid #e5e9eb;border-bottom:1px solid #e5e9eb"><th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:600;color:#73787d">Description</th><th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:600;color:#73787d">Price (L.E / pc)</th></tr></thead>
          <tbody>${tr.filter(r=>r.desc).map((r,i)=>`<tr style="border-bottom:1px solid #ebeef0;background:${i%2===1?'#f7fafc':'#fff'}"><td style="padding:10px">${r.desc}</td><td style="padding:10px;text-align:right;font-weight:600;color:#02273b">${r.price||'—'}</td></tr>`).join('')}</tbody>
        </table>
      </div>` : '';

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Quotation ${q.number}</title><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:'IBM Plex Sans',sans-serif;background:#f7fafc;padding:20px}.page{max-width:980px;margin:0 auto;background:#fff;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,.1)}@media print{body{padding:0;background:#fff}.page{box-shadow:none}}</style></head><body>
<div class="page">
  <div style="height:6px;background:linear-gradient(to right,#02273b,#006780)"></div>
  <div style="padding:36px 48px 24px;border-bottom:1px solid #e5e9eb;display:flex;justify-content:space-between;align-items:flex-start;gap:24px">
    <div>
      <div style="font-size:20px;font-weight:700;color:#02273b;margin-bottom:4px">${cNameEn}</div>
      <div style="font-size:11px;color:#73787d;line-height:1.8">${cAddrEn}${settings.phone?'<br>📞 '+settings.phone:''}${settings.email?' | ✉ '+settings.email:''}${settings.taxNo?'<br>Tax Reg: '+settings.taxNo:''}</div>
      <div style="margin-top:18px;padding-left:12px;border-left:3px solid #006780"><div style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d;margin-bottom:4px">Client</div><div style="font-size:18px;font-weight:700;color:#181c1e">${q.clientName||''}</div>${q.clientContact?`<div style="font-size:12px;color:#73787d;margin-top:2px">Attn: ${q.clientContact}</div>`:''}</div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div style="font-size:40px;font-weight:700;color:#02273b;letter-spacing:-.02em;text-transform:uppercase;margin-bottom:2px">Quotation</div>
      <div style="font-size:13px;color:#73787d;margin-bottom:14px">Reference: ${q.number}</div>
      <div style="display:flex;gap:24px;justify-content:flex-end">
        <div><div style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d;margin-bottom:2px">Date</div><div style="font-size:13px;font-weight:600;color:#181c1e">${fmtDateEN(q.date)}</div></div>
        ${q.projectName?`<div><div style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d;margin-bottom:2px">Project</div><div style="font-size:13px;font-weight:600;color:#181c1e">${q.projectName}</div></div>`:''}
        <div><div style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d;margin-bottom:2px">Valid Until</div><div style="font-size:13px;font-weight:600;color:#181c1e">${fmtDateEN(q.validUntil)}</div></div>
      </div>
    </div>
  </div>
  ${heroImg?`<div style="margin:28px 48px 32px;border-radius:8px;overflow:hidden;height:200px;border:1px solid #e5e9eb"><img src="${heroImg}" style="width:100%;height:100%;object-fit:cover;object-position:center"/></div>`:'<div style="height:28px"></div>'}
  <div style="padding:0 48px 32px">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px"><hr style="flex:1;border:none;border-top:1px solid #e5e9eb"/><h4 style="font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#73787d;white-space:nowrap">I. Primary Fabrication Schedule</h4><hr style="flex:1;border:none;border-top:1px solid #e5e9eb"/></div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f7fafc;border-top:1px solid #e5e9eb;border-bottom:1px solid #e5e9eb">
        <th style="padding:10px 12px;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#73787d;text-align:left;width:55px">Item</th>
        <th style="padding:10px 12px;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#73787d;text-align:left">Description</th>
        <th style="padding:10px 12px;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#73787d;text-align:right;width:65px">Unit</th>
        <th style="padding:10px 12px;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#73787d;text-align:right;width:80px">Qty</th>
        <th style="padding:10px 12px;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#73787d;text-align:right;width:105px">Rate (L.E)</th>
        <th style="padding:10px 12px;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#73787d;text-align:right;width:115px">Total (L.E)</th>
      </tr></thead>
      <tbody>${itemsHTML}</tbody>
    </table>
  </div>
  ${accHTML}
  ${(wkHTML||trHTML)?`<div style="padding:0 48px 32px"><div style="display:flex;align-items:center;gap:16px;margin-bottom:20px"><hr style="flex:1;border:none;border-top:1px solid #e5e9eb"/><h4 style="font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#73787d;white-space:nowrap">${secNumSupp}. Technical Supplements &amp; Surcharges</h4><hr style="flex:1;border:none;border-top:1px solid #e5e9eb"/></div><div style="display:grid;grid-template-columns:${trHTML&&wkHTML?'1fr 1fr':'1fr'};gap:24px">${wkHTML}${trHTML}</div></div>`:''}
  <div style="background:#f7fafc;margin:0 48px 28px;padding:22px 28px;border-radius:8px;border:1px solid #e5e9eb">
    <div style="font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#02273b;margin-bottom:16px">IV. Commercial Terms</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
      <div><div style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d;margin-bottom:4px">Payment Structure</div><p style="font-size:12px;color:#181c1e;line-height:1.6">${q.paymentTerms||'—'}</p></div>
      <div><div style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d;margin-bottom:4px">Delivery Timeline</div><p style="font-size:12px;color:#181c1e;line-height:1.6">Estimated <strong>${q.deliveryDays||'14-21'} Business Days</strong></p></div>
      <div><div style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d;margin-bottom:4px">Quote Validity</div><p style="font-size:12px;color:#181c1e;line-height:1.6">Valid until <strong>${fmtDateEN(q.validUntil)}</strong></p></div>
    </div>
  </div>
  ${q.notes?`<div style="margin:0 48px 20px;padding:16px 20px;border-radius:6px;border:1px solid #e5e9eb;background:#fffbf0"><div style="font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#92400e;margin-bottom:6px">Notes &amp; Remarks</div><p style="font-size:12px;color:#42474c;white-space:pre-wrap;line-height:1.7">${q.notes}</p></div>`:''}
  <div style="padding:28px 48px;border-top:1px solid #e5e9eb;display:flex;justify-content:space-between;align-items:flex-end;position:relative">
    ${STAMP_HTML(new Date().getFullYear())}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;width:60%">${['Sales Management','Contract Control','General Manager'].map(s=>`<div style="text-align:center"><div style="height:50px;border-bottom:1px solid #c2c7cd;margin-bottom:6px"></div><div style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#73787d">${s}</div></div>`).join('')}</div>
    <div style="background:#02273b;color:#fff;padding:22px 24px;min-width:240px;border-radius:8px">
      <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:rgba(255,255,255,.65);border-bottom:1px solid rgba(255,255,255,.1)"><span>Subtotal</span><span>${fmtEN(tots.subtotal)} L.E</span></div>
      ${(q.discountPct||0)>0?`<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#fca5a5;border-bottom:1px solid rgba(255,255,255,.1)"><span>Discount (${q.discountPct}%)</span><span>-${fmtEN(tots.discountAmt)} L.E</span></div>`:''}
      <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:rgba(255,255,255,.65);border-bottom:1px solid rgba(255,255,255,.1)"><span>VAT (${q.taxPct??14}%)</span><span>${fmtEN(tots.taxAmt)} L.E</span></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-top:10px"><span style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.05em">Grand Total (L.E)</span><span style="font-size:20px;font-weight:700;color:#fff">${fmtEN(tots.total)}</span></div>
    </div>
  </div>
  <div style="padding:10px 48px;border-top:1px solid #ebeef0;display:flex;justify-content:space-between;align-items:center;background:#f7fafc">
    <div><span style="background:#e0e3e5;color:#42474c;font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:3px;margin-right:6px">Confidential</span><span style="background:#e0e3e5;color:#42474c;font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:3px">${si(q.status).en}</span></div>
    <div style="font-size:10px;color:#73787d">© ${new Date().getFullYear()} ${cNameEn} — All Rights Reserved.</div>
  </div>
</div></body></html>`;

    const pw = window.open('','_blank','width=1000,height=800');
    if (!pw) { alert('يرجى السماح بالنوافذ المنبثقة ثم اضغط طباعة مرة أخرى'); return; }
    pw.document.open(); pw.document.write(html); pw.document.close();
    setTimeout(() => { if (pw&&!pw.closed) { pw.focus(); pw.print(); } }, 1200);
  };

  const filtered = quotes.filter(q => {
    const s=searchTerm.toLowerCase();
    return (q.number?.toLowerCase().includes(s)||q.clientName?.toLowerCase().includes(s)||q.projectName?.toLowerCase().includes(s)) && (activeTab?q.status===activeTab:true);
  });

  // ══════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">إدارة عروض الأسعار</h2>
          <p className="text-sm text-slate-500">عروض A4 احترافية • مجلفن & أسود • قفل الأقسام</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm" style={{background:'#02273b'}}>
          <Plus className="w-5 h-5"/> إنشاء عرض سعر
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-sm gap-1">
        {[['','الكل',quotes.length],['draft','مسودات',quotes.filter(q=>q.status==='draft').length],['sent','مرسلة',quotes.filter(q=>q.status==='sent').length],['accepted','مقبولة',quotes.filter(q=>q.status==='accepted').length],['rejected','مرفوضة',quotes.filter(q=>q.status==='rejected').length],['expired','منتهية',quotes.filter(q=>q.status==='expired').length]].map(([k,l,c])=>(
          <button key={k} onClick={()=>setActiveTab(k)} className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all ${activeTab===k?'border-[#02273b] text-[#02273b]':'border-transparent text-slate-500 hover:text-slate-700'}`}>{l} ({c})</button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="relative"><Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/><input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="ابحث برقم العرض أو اسم العميل..." className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006780] text-sm bg-slate-50/50"/></div>
      </div>

      {/* Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(q => {
            const tots = calcTotals(q);
            const heroImg = products.find(p=>p.id===q.items?.[0]?.productId)?.image || q.items?.[0]?.image || '';
            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-lg hover:border-[#86d1ed] transition-all duration-300">
                <div className="relative h-40 bg-slate-100 overflow-hidden">
                  {heroImg?<img src={heroImg} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>:<div className="w-full h-full flex items-center justify-center"><FileText className="w-14 h-14 text-slate-200"/></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"/>
                  <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {q.productType && <span className="text-[10px] font-bold px-2 py-1 rounded-md text-[#86d1ed]" style={{background:'rgba(2,39,59,0.8)'}}>{q.productType==='galvanized'?'💿 Galvanized':q.productType==='black'?'⬛ Black Sheet':'📦 General'}</span>}
                      {q.accLocked   && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/90 text-white" title="Components Locked"><Lock className="w-2.5 h-2.5 inline"/>II</span>}
                      {q.suppLocked  && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/90 text-white" title="Supplements Locked"><Lock className="w-2.5 h-2.5 inline"/>III</span>}
                    </div>
                    {badge(q.status)}
                  </div>
                  <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between">
                    <div><p className="text-white font-bold text-sm drop-shadow">{q.number}</p><p className="text-white/60 text-xs">{fmtDateEN(q.date)}</p></div>
                    <p className="text-white font-black text-base drop-shadow">{fmtEN(tots.total)} <span className="text-xs font-normal opacity-60">L.E</span></p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div><p className="font-bold text-slate-900">{q.clientName}</p>{q.projectName && <p className="text-xs text-slate-400 mt-0.5">{q.projectName}</p>}</div>
                  {(q.accessories||[]).length>0 && <div className="flex gap-1.5 items-center flex-wrap"><span className="text-[10px] text-slate-400">Components:</span>{(q.accessories||[]).slice(0,4).map((a,i)=><div key={i} className="w-7 h-7 rounded bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">{a.image?<img src={a.image} alt="" className="w-full h-full object-contain"/>:<Package className="w-3.5 h-3.5 text-slate-300"/>}</div>)}{(q.accessories||[]).length>4&&<span className="text-[10px] text-slate-400">+{(q.accessories||[]).length-4}</span>}</div>}
                  <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                    <button onClick={()=>setViewingQuote(q)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#02273b] hover:bg-slate-100 rounded-lg transition-all"><Eye className="w-3.5 h-3.5"/>معاينة</button>
                    <button onClick={()=>handlePrint(q)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"><Printer className="w-3.5 h-3.5"/>PDF</button>
                    <button onClick={()=>handleOpenEdit(q)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit className="w-3.5 h-3.5"/>تعديل</button>
                    <button onClick={()=>setStatusChangingQuote(q)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><RefreshCw className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>handleDelete(q)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center"><FileText className="w-16 h-16 text-slate-200 mx-auto mb-4"/><p className="text-slate-400 font-medium text-sm">لا توجد عروض أسعار. اضغط «إنشاء عرض سعر» للبدء.</p></div>
      )}

      {/* VIEW MODAL */}
      {viewingQuote && (() => {
        const q=viewingQuote, tots=calcTotals(q);
        const heroImg = products.find(p=>p.id===q.items?.[0]?.productId)?.image || q.items?.[0]?.image || '';
        const acc=q.accessories||[];
        const wk=q.workmanship||DEFAULT_WK(q.productType||'galvanized');
        const tr_s=q.transformation||DEFAULT_TR(q.productType||'galvanized');
        const secNum = acc.length?'III':'II';
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto" style={{background:'rgba(2,39,59,0.65)',backdropFilter:'blur(4px)'}}>
            <div className="sticky top-4 z-10 flex justify-between items-center max-w-4xl mx-auto px-4 mb-4">
              <button onClick={()=>setViewingQuote(null)} className="flex items-center gap-2 bg-white/95 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg hover:bg-white"><X className="w-4 h-4"/>إغلاق</button>
              <div className="flex gap-2">
                <button onClick={()=>{setViewingQuote(null);handleOpenEdit(q);}} className="flex items-center gap-2 bg-white/95 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg hover:bg-white"><Edit className="w-4 h-4"/>تعديل</button>
                <button onClick={()=>handlePrint(q)} className="flex items-center gap-2 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg" style={{background:'#02273b'}}><Printer className="w-4 h-4"/>طباعة / PDF</button>
              </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 pb-8">
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl" style={{fontFamily:"'IBM Plex Sans',sans-serif"}}>
                <div className="h-1.5" style={{background:'linear-gradient(to right,#02273b,#006780)'}}/>
                {/* Header */}
                <div className="px-10 pt-10 pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6">
                  <div>
                    <div className="text-lg font-bold text-[#02273b]">{cNameEn}</div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">{cAddrEn}<br/>{settings.phone&&`📞 ${settings.phone}`}{settings.email&&` | ✉ ${settings.email}`}{settings.taxNo&&<><br/>Tax Reg: {settings.taxNo}</>}</div>
                    {q.clientName&&<div className="mt-5 pl-4 border-l-2 border-[#006780]"><div className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Client</div><div className="font-bold text-slate-900 text-base">{q.clientName}</div>{q.clientContact&&<div className="text-xs text-slate-500 mt-0.5">Attn: {q.clientContact}</div>}</div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-4xl font-bold text-[#02273b] uppercase tracking-tight">Quotation</div>
                    <div className="text-sm text-slate-400 mt-1 mb-4">Reference: {q.number}</div>
                    <div className="flex gap-5 justify-end">
                      <div><div className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Date</div><div className="text-sm font-semibold text-slate-800">{fmtDateEN(q.date)}</div></div>
                      {q.projectName&&<div><div className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Project</div><div className="text-sm font-semibold text-slate-800">{q.projectName}</div></div>}
                      <div><div className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Valid Until</div><div className="text-sm font-semibold text-slate-800">{fmtDateEN(q.validUntil)}</div></div>
                    </div>
                    <div className="mt-3">{badge(q.status)}</div>
                  </div>
                </div>
                {heroImg&&<div className="mx-10 mt-6 mb-0 rounded-xl overflow-hidden h-48 border border-slate-100"><img src={heroImg} alt="" className="w-full h-full object-cover object-center"/></div>}
                {/* I Items */}
                <div className="px-10 py-8">
                  <div className="flex items-center gap-4 mb-5"><div className="h-px bg-slate-200 flex-1"/><span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">I. Primary Fabrication Schedule</span><div className="h-px bg-slate-200 flex-1"/></div>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full border-collapse text-sm">
                      <thead><tr className="bg-slate-50 border-y border-slate-100">{['Item','Description','Unit','Qty','Rate (L.E)','Total (L.E)'].map((h,i)=><th key={h} className={`py-3 px-4 text-[9px] font-bold uppercase tracking-wider text-slate-400 ${i<2?'text-left':'text-right'} ${i===0?'w-14':i===2?'w-16':i===3?'w-20':i===4?'w-28':'w-32'}`}>{h}</th>)}</tr></thead>
                      <tbody>{(q.items||[]).map((it,i)=><tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-5 px-4 text-slate-400 text-xs align-top">{i+1}.{i+1}</td>
                        <td className="py-5 px-4 align-top">{it.itemTitle?<p className="font-bold text-slate-900 mb-1 uppercase text-sm">{it.itemTitle}</p>:<p className="font-bold text-slate-900 mb-1">{it.productName}</p>}{it.itemDesc&&<p className="text-xs text-slate-500 mb-3 leading-relaxed">{it.itemDesc}</p>}{it.techNotes&&<div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-1"><p className="text-[9px] font-bold uppercase tracking-wider text-[#02273b] mb-2">Technical Note:</p><p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">{it.techNotes}</p></div>}</td>
                        <td className="py-5 px-4 text-right text-slate-600 text-xs align-top">{it.unitType||'—'}</td>
                        <td className="py-5 px-4 text-right font-semibold text-slate-800 text-xs align-top">{(it.qty||0).toLocaleString('en')}</td>
                        <td className="py-5 px-4 text-right text-slate-600 text-xs align-top">{fmtEN(it.unitPrice)}</td>
                        <td className="py-5 px-4 text-right font-bold text-slate-900 align-top">{fmtEN(it.total)}</td>
                      </tr>)}</tbody>
                    </table>
                  </div>
                </div>
                {/* II Accessories */}
                {acc.length>0&&<div className="px-10 pb-8">
                  <div className="flex items-center gap-4 mb-5"><div className="h-px bg-slate-200 flex-1"/><span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">II. Specialized Component Index {q.accLocked&&'🔒'}</span><div className="h-px bg-slate-200 flex-1"/></div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {acc.map((a,i)=><div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col hover:border-[#006780] transition-colors">
                      <div className="h-20 bg-white rounded-lg border border-slate-100 mb-3 flex items-center justify-center p-2 overflow-hidden">{a.image?<img src={a.image} alt="" className="max-h-full max-w-full object-contain" style={{mixBlendMode:'multiply'}}/>:<Package className="w-8 h-8 text-slate-200"/>}</div>
                      <p className="text-xs font-bold text-slate-900 mb-1 uppercase">{a.name}</p>
                      {a.description&&<p className="text-[10px] text-slate-400 mb-3 flex-1 leading-relaxed">{a.description}</p>}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-auto"><span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">UNIT PRICE{a.unitLabel&&a.unitLabel!=='pc'?` (${a.unitLabel})`:''}</span><span className="text-sm font-bold text-[#02273b]">{fmtEN(a.unitPrice)} L.E</span></div>
                    </div>)}
                  </div>
                </div>}
                {/* III Supplements */}
                {(wk.filter(r=>r.desc).length>0||tr_s.filter(r=>r.desc).length>0)&&<div className="px-10 pb-8">
                  <div className="flex items-center gap-4 mb-5"><div className="h-px bg-slate-200 flex-1"/><span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{secNum}. Technical Supplements & Surcharges {q.suppLocked&&'🔒'}</span><div className="h-px bg-slate-200 flex-1"/></div>
                  <div className={`grid gap-6 ${tr_s.filter(r=>r.desc).length&&wk.filter(r=>r.desc).length?'grid-cols-2':'grid-cols-1'}`}>
                    {wk.filter(r=>r.desc).length>0&&<div><h5 className="text-[9px] font-bold uppercase tracking-wider text-[#02273b] mb-3 flex items-center gap-2"><span className="w-4 h-px bg-[#02273b] inline-block"/>Assembly Workmanship</h5><div className="rounded-xl border border-slate-100 overflow-hidden"><table className="w-full border-collapse text-xs"><thead><tr className="bg-slate-50 border-y border-slate-100"><th className="py-2 px-3 text-left text-[9px] font-bold uppercase text-slate-400">Description</th><th className="py-2 px-3 text-right text-[9px] font-bold uppercase text-slate-400">Price (L.E)</th></tr></thead><tbody>{wk.filter(r=>r.desc).map((r,i)=><tr key={r.id||i} className={`border-b border-slate-100 last:border-0 ${i%2===1?'bg-slate-50':''}`}><td className="py-2.5 px-3 text-slate-700">{r.desc}</td><td className="py-2.5 px-3 text-right font-semibold text-[#02273b]">{r.price}</td></tr>)}</tbody></table></div></div>}
                    {tr_s.filter(r=>r.desc).length>0&&<div><h5 className="text-[9px] font-bold uppercase tracking-wider text-[#02273b] mb-3 flex items-center gap-2"><span className="w-4 h-px bg-[#02273b] inline-block"/>Transformation Surcharges</h5><div className="rounded-xl border border-slate-100 overflow-hidden"><table className="w-full border-collapse text-xs"><thead><tr className="bg-slate-50 border-y border-slate-100"><th className="py-2 px-3 text-left text-[9px] font-bold uppercase text-slate-400">Description</th><th className="py-2 px-3 text-right text-[9px] font-bold uppercase text-slate-400">Price (L.E)</th></tr></thead><tbody>{tr_s.filter(r=>r.desc).map((r,i)=><tr key={r.id||i} className={`border-b border-slate-100 last:border-0 ${i%2===1?'bg-slate-50':''}`}><td className="py-2.5 px-3 text-slate-700">{r.desc}</td><td className="py-2.5 px-3 text-right font-semibold text-[#02273b]">{r.price}</td></tr>)}</tbody></table></div></div>}
                  </div>
                </div>}
                {/* Commercial Terms */}
                <div className="mx-10 mb-8 bg-slate-50 rounded-xl border border-slate-200 p-6">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#02273b] mb-4">IV. Commercial Terms</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div><div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">Payment Structure</div><p className="text-xs text-slate-700 leading-relaxed">{q.paymentTerms||'—'}</p></div>
                    <div><div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">Delivery Timeline</div><p className="text-xs text-slate-700 leading-relaxed"><strong>{q.deliveryDays||'14-21'} Business Days</strong></p></div>
                    <div><div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">Quote Validity</div><p className="text-xs text-slate-700 leading-relaxed">Valid until <strong>{fmtDateEN(q.validUntil)}</strong></p></div>
                  </div>
                </div>
                {q.notes&&<div className="mx-10 mb-8 bg-amber-50 border border-amber-200 rounded-xl p-5"><div className="text-[9px] font-bold uppercase tracking-wider text-amber-600 mb-2">Notes & Remarks</div><p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{q.notes}</p></div>}
                {/* Signatures */}
                <div className="px-10 pb-10 border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-end gap-6 relative">
                  <div className="absolute left-1/2 top-6 -translate-x-1/2 hidden md:block"><Stamp/></div>
                  <div className="grid grid-cols-3 gap-6 flex-1">{['Sales Management','Contract Control','General Manager'].map(s=><div key={s} className="text-center"><div className="h-14 border-b border-slate-300 mb-2"/><div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{s}</div></div>)}</div>
                  <div className="rounded-xl p-6 min-w-[240px] shadow-lg flex-shrink-0" style={{background:'#02273b'}}>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>{fmtEN(tots.subtotal)} L.E</span></div>
                      {(q.discountPct||0)>0&&<div className="flex justify-between text-rose-300"><span>Discount ({q.discountPct}%)</span><span>-{fmtEN(tots.discountAmt)} L.E</span></div>}
                      <div className="flex justify-between text-slate-300"><span>VAT ({q.taxPct??14}%)</span><span>{fmtEN(tots.taxAmt)} L.E</span></div>
                      <div className="h-px my-1" style={{background:'rgba(255,255,255,0.15)'}}/>
                      <div className="flex justify-between items-end"><span className="text-xs text-slate-400 uppercase tracking-wider">Grand Total (L.E)</span><span className="text-xl font-bold text-white">{fmtEN(tots.total)}</span></div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 px-10 py-4 flex justify-between items-center bg-slate-50">
                  <div className="flex gap-2"><span className="bg-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded">Confidential</span><span className="bg-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded">{si(q.status).en}</span></div>
                  <div className="text-xs text-slate-400">© {new Date().getFullYear()} {cNameEn} — All Rights Reserved.</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================================================================
          BUILDER FORM
      ================================================================ */}
      {editingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[95vh]">
            <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{background:'#02273b'}}>
              <div className="flex items-center gap-3"><Layers className="w-5 h-5" style={{color:'#86d1ed'}}/><h3 className="font-bold text-white">{isAddMode?'إنشاء عرض سعر جديد':`تعديل: ${editingQuote.number||''}`}</h3></div>
              <button onClick={()=>setEditingQuote(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"><X className="w-6 h-6"/></button>
            </div>

            <div className="overflow-y-auto flex-grow">
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT */}
                <div className="lg:col-span-2 space-y-5">

                  {/* Product Type */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-[#006780]"/>Product Type</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[{key:'galvanized',label:'Galvanized Sheet',sub:'صاج مجلفن',icon:'💿'},{key:'black',label:'Black Sheet Metal',sub:'صاج أسود',icon:'⬛'},{key:'general',label:'General',sub:'عام',icon:'📦'}].map(t=>(
                        <button key={t.key} type="button" onClick={()=>handleProductTypeChange(t.key)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${formProductType===t.key?'border-[#006780] bg-[#006780]/5 shadow-sm':'border-slate-200 hover:border-slate-300'}`}>
                          <span className="text-2xl">{t.icon}</span>
                          <div><p className={`text-xs font-bold ${formProductType===t.key?'text-[#02273b]':'text-slate-700'}`}>{t.label}</p><p className="text-[10px] text-slate-400">{t.sub}</p></div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                    <h4 className="font-bold text-xs text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-[#006780]"/>Quotation Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Reference No.</label><input type="text" value={formNumber} onChange={e=>setFormNumber(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white font-mono"/></div>
                      <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Client (CRM)</label><select value={formClientId} onChange={e=>handleClientSelect(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white"><option value="">— Select Client —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name} — {c.company||'Individual'}</option>)}</select></div>
                      <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Client Name</label><input type="text" value={formClientName} onChange={e=>setFormClientName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white"/></div>
                      <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Attn.</label><input type="text" value={formClientContact} onChange={e=>setFormClientContact(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white"/></div>
                      <div className="sm:col-span-2"><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Project Name</label><input type="text" value={formProjectName} onChange={e=>setFormProjectName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white"/></div>
                      <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Issue Date</label><input type="date" value={formDate} onChange={e=>setFormDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white"/></div>
                      <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Valid Until</label><input type="date" value={formValidUntil} onChange={e=>setFormValidUntil(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white"/></div>
                    </div>
                  </div>

                  {/* Section I Items */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-bold text-xs text-slate-700 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-[#006780]"/>I. Primary Fabrication Items</h4>
                      <button type="button" onClick={handleAddItem} className="text-xs text-white font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{background:'#006780'}}><PlusCircle className="w-3.5 h-3.5"/>Add Item</button>
                    </div>
                    <div className="space-y-4">
                      {formItems.map((item,idx)=>{
                        const img=products.find(p=>p.id===item.productId)?.image||item.image||'';
                        return <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          {img&&<div className="h-28 overflow-hidden border-b border-slate-100"><img src={img} alt="" className="w-full h-full object-cover object-center"/></div>}
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                              <div className="sm:col-span-2"><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Product</label><select value={item.productId} onChange={e=>handleItemChange(idx,'productId',e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780]">{products.filter(p=>p.active!==false).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                              <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Qty ({item.unitType})</label><input type="number" value={item.qty||''} onChange={e=>handleItemChange(idx,'qty',parseFloat(e.target.value)||0)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780]" min="0" step="0.001"/></div>
                              <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Rate (L.E)</label><input type="number" value={item.unitPrice||''} onChange={e=>handleItemChange(idx,'unitPrice',parseFloat(e.target.value)||0)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780]" min="0" step="0.01"/></div>
                            </div>
                            <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Document Title</label><input type="text" value={item.itemTitle||''} onChange={e=>handleItemChange(idx,'itemTitle',e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] font-semibold uppercase" placeholder="RECTANGULAR GALVANIZED SHEET METAL DUCTS"/></div>
                            <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Description</label><input type="text" value={item.itemDesc||''} onChange={e=>handleItemChange(idx,'itemDesc',e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780]"/></div>
                            <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Technical Note</label><textarea value={item.techNotes||''} onChange={e=>handleItemChange(idx,'techNotes',e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] font-mono" rows="4"/></div>
                            <div className="grid grid-cols-2 gap-3">
                              <div><label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Discount (%)</label><input type="number" value={item.discountPct||''} onChange={e=>handleItemChange(idx,'discountPct',parseFloat(e.target.value)||0)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780]" min="0" max="100"/></div>
                              <div className="flex flex-col justify-end"><span className="text-xs font-bold text-emerald-600">Total: {fmtEN((item.qty||0)*(item.unitPrice||0)*(1-(item.discountPct||0)/100))} L.E</span></div>
                            </div>
                            <div className="flex justify-end"><button type="button" onClick={()=>handleRemoveItem(idx)} className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"><Trash2 className="w-3.5 h-3.5"/>Remove</button></div>
                          </div>
                        </div>;
                      })}
                      {!formItems.length&&<div className="text-center text-xs text-slate-400 py-8 border-2 border-dashed border-slate-200 rounded-xl">No items yet. Click «Add Item».</div>}
                    </div>
                  </div>

                  {/* ── SECTION II — Accessories (with lock) ── */}
                  <div className={`rounded-2xl p-5 border space-y-4 transition-all ${accLocked?'bg-amber-50 border-amber-200':'bg-slate-50 border-slate-100'}`}>
                    <SectionHeader title="II. Specialized Component Index" locked={accLocked} onToggleLock={()=>setAccLocked(l=>!l)}>
                      {!accLocked && <span className="text-[10px] text-slate-400">{formAccessories.length} component(s)</span>}
                    </SectionHeader>

                    {accLocked ? (
                      <div className="flex items-center gap-3 py-6 justify-center">
                        <Lock className="w-8 h-8 text-amber-400"/>
                        <div>
                          <p className="font-bold text-amber-700 text-sm">Section Locked</p>
                          <p className="text-xs text-amber-600">{formAccessories.length} component(s) — click LOCKED to edit</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Product picker */}
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">اضغط لإضافة / حذف:</p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
                            {products.filter(p=>p.active!==false && p.categoryId !== 'cat_galvanized' && p.categoryId !== 'cat_black').map(prod=>{
                              const added=formAccessories.some(a=>a.productId===prod.id);
                              return <button key={prod.id} type="button" onClick={()=>added?handleRemoveAccessory(prod.id):handleAddAccessory(prod)}
                                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-center text-xs transition-all ${added?'border-[#006780] bg-[#006780]/5 text-[#02273b] font-bold':'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                                {prod.image?<div className="w-10 h-10 overflow-hidden rounded bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center"><img src={prod.image} alt="" className="w-full h-full object-contain"/></div>:<div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center"><Package className="w-5 h-5 text-slate-300"/></div>}
                                <span className="leading-tight text-[10px]">{prod.name}</span>
                                {added&&<span className="text-[9px] font-bold text-emerald-600">✓</span>}
                              </button>;
                            })}
                          </div>
                        </div>
                        {/* Editable cards */}
                        {formAccessories.length>0&&<div className="space-y-2 mt-2">
                          {formAccessories.map((acc,idx)=>(
                            <div key={acc.productId} className="bg-white rounded-xl border border-slate-200 p-3">
                              <div className="flex items-start gap-3">
                                {acc.image&&<div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center p-1"><img src={acc.image} alt="" className="max-w-full max-h-full object-contain" style={{mixBlendMode:'multiply'}}/></div>}
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  <div><label className="block text-[9px] font-semibold text-slate-400 uppercase mb-0.5">Name</label><input type="text" value={acc.name} onChange={e=>handleAccChange(idx,'name',e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]"/></div>
                                  <div><label className="block text-[9px] font-semibold text-slate-400 uppercase mb-0.5">Unit Label</label><input type="text" value={acc.unitLabel||''} onChange={e=>handleAccChange(idx,'unitLabel',e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" placeholder="pc, m"/></div>
                                  <div className="col-span-2"><label className="block text-[9px] font-semibold text-slate-400 uppercase mb-0.5">Description</label><input type="text" value={acc.description||''} onChange={e=>handleAccChange(idx,'description',e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" placeholder="Short description..."/></div>
                                  <div><label className="block text-[9px] font-semibold text-slate-400 uppercase mb-0.5">Unit Price (L.E)</label><input type="number" value={acc.unitPrice||''} onChange={e=>handleAccChange(idx,'unitPrice',parseFloat(e.target.value)||0)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" min="0" step="0.01"/></div>
                                  <div className="flex items-end justify-end"><button type="button" onClick={()=>handleRemoveAccessory(acc.productId)} className="flex items-center gap-1 text-[10px] text-rose-500 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50"><Trash2 className="w-3 h-3"/>Delete</button></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>}
                      </>
                    )}
                  </div>

                  {/* ── SECTION III — Supplements (with lock) ── */}
                  <div className={`rounded-2xl p-5 border space-y-4 transition-all ${suppLocked?'bg-amber-50 border-amber-200':'bg-slate-50 border-slate-100'}`}>
                    <SectionHeader title="III. Technical Supplements & Surcharges" locked={suppLocked} onToggleLock={()=>setSuppLocked(l=>!l)}>
                      {!suppLocked && <span className="text-[10px] text-slate-400">{formWorkmanship.length + formTransformation.length} row(s)</span>}
                    </SectionHeader>

                    {suppLocked ? (
                      <div className="flex items-center gap-3 py-6 justify-center">
                        <Lock className="w-8 h-8 text-amber-400"/>
                        <div>
                          <p className="font-bold text-amber-700 text-sm">Section Locked</p>
                          <p className="text-xs text-amber-600">{formWorkmanship.filter(r=>r.desc).length} workmanship + {formTransformation.filter(r=>r.desc).length} transformation rows — click LOCKED to edit</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Workmanship */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#02273b] flex items-center gap-1.5"><span className="w-3 h-px bg-[#02273b] inline-block"/>Assembly Workmanship</h5>
                            <button type="button" onClick={addWkRow} className="text-[10px] font-bold text-[#006780] hover:text-[#02273b] flex items-center gap-1 px-2 py-1 rounded hover:bg-[#006780]/10 transition-all"><PlusCircle className="w-3 h-3"/>Add Row</button>
                          </div>
                          <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full border-collapse text-xs">
                              <thead><tr className="bg-slate-100 border-b border-slate-200"><th className="py-2 px-3 text-left text-[9px] font-bold uppercase text-slate-400">Description</th><th className="py-2 px-3 text-right text-[9px] font-bold uppercase text-slate-400">Price (L.E)</th><th className="w-8"></th></tr></thead>
                              <tbody>
                                {formWorkmanship.map((row)=>(
                                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                    <td className="px-2 py-1.5"><input value={row.desc} onChange={e=>changeWk(row.id,'desc',e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780] bg-white" placeholder="Round cut duct..."/></td>
                                    <td className="px-2 py-1.5 w-24"><input value={row.price} onChange={e=>changeWk(row.id,'price',e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780] bg-white text-right" placeholder="0.00"/></td>
                                    <td className="px-1 py-1.5"><button type="button" onClick={()=>removeWkRow(row.id)} className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"><Trash2 className="w-3 h-3"/></button></td>
                                  </tr>
                                ))}
                                {!formWorkmanship.length&&<tr><td colSpan="3" className="py-4 text-center text-[10px] text-slate-400">No rows. Click «Add Row».</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        {/* Transformation */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#02273b] flex items-center gap-1.5"><span className="w-3 h-px bg-[#02273b] inline-block"/>Transformation Surcharges</h5>
                            <button type="button" onClick={addTrRow} className="text-[10px] font-bold text-[#006780] hover:text-[#02273b] flex items-center gap-1 px-2 py-1 rounded hover:bg-[#006780]/10 transition-all"><PlusCircle className="w-3 h-3"/>Add Row</button>
                          </div>
                          <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full border-collapse text-xs">
                              <thead><tr className="bg-slate-100 border-b border-slate-200"><th className="py-2 px-3 text-left text-[9px] font-bold uppercase text-slate-400">Description</th><th className="py-2 px-3 text-right text-[9px] font-bold uppercase text-slate-400">Price (L.E)</th><th className="w-8"></th></tr></thead>
                              <tbody>
                                {formTransformation.map((row)=>(
                                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                    <td className="px-2 py-1.5"><input value={row.desc} onChange={e=>changeTr(row.id,'desc',e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780] bg-white" placeholder="Square to round..."/></td>
                                    <td className="px-2 py-1.5 w-24"><input value={row.price} onChange={e=>changeTr(row.id,'price',e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780] bg-white text-right" placeholder="0.00"/></td>
                                    <td className="px-1 py-1.5"><button type="button" onClick={()=>removeTrRow(row.id)} className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"><Trash2 className="w-3 h-3"/></button></td>
                                  </tr>
                                ))}
                                {!formTransformation.length&&<tr><td colSpan="3" className="py-4 text-center text-[10px] text-slate-400">No rows. Click «Add Row».</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terms */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100"><label className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase">Payment Terms</label><textarea value={formPaymentTerms} onChange={e=>setFormPaymentTerms(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white" rows="3"/></div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100"><label className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase">Notes & Remarks</label><textarea value={formNotes} onChange={e=>setFormNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white" rows="3"/></div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="space-y-4">
                  <div className="rounded-2xl p-5 sticky top-0 space-y-4" style={{background:'#02273b'}}>
                    <h4 className="text-xs font-bold uppercase tracking-wider border-b border-white/10 pb-2" style={{color:'#86d1ed'}}>Financial Summary</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-slate-300"><span>Subtotal:</span><span>{fmtEN(liveTotals.subtotal)} L.E</span></div>
                      <div className="h-px bg-white/10"/>
                      <div><label className="block text-[10px] text-slate-400 mb-1">Discount (%)</label><input type="number" value={formDiscountPct} onChange={e=>setFormDiscountPct(parseFloat(e.target.value)||0)} className="w-full rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none" style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)'}} min="0" max="100"/></div>
                      {liveTotals.discountPct>0&&<div className="flex justify-between text-red-300 text-xs font-semibold"><span>Discount:</span><span>-{fmtEN(liveTotals.discountAmt)} L.E</span></div>}
                      <div><label className="block text-[10px] text-slate-400 mb-1">VAT (%)</label><input type="number" value={formTaxPct} onChange={e=>setFormTaxPct(parseFloat(e.target.value)||0)} className="w-full rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none" style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)'}} min="0" max="100"/></div>
                      <div className="flex justify-between text-slate-300 text-xs"><span>VAT:</span><span>+{fmtEN(liveTotals.taxAmt)} L.E</span></div>
                      <div className="h-px bg-white/10"/>
                      <div className="flex justify-between font-bold text-lg text-emerald-400"><span>Grand Total:</span><span>{fmtEN(liveTotals.total)}</span></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100"><label className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase">Delivery (Business Days)</label><input type="text" value={formDeliveryDays} onChange={e=>setFormDeliveryDays(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-white" placeholder="14-21"/></div>
                  {/* Lock status summary */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Section Lock Status</p>
                    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${accLocked?'bg-amber-100':'bg-slate-100'}`}>
                      <span className="text-xs font-semibold text-slate-700">II. Components</span>
                      {accLocked?<Lock className="w-4 h-4 text-amber-600"/>:<Unlock className="w-4 h-4 text-slate-400"/>}
                    </div>
                    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${suppLocked?'bg-amber-100':'bg-slate-100'}`}>
                      <span className="text-xs font-semibold text-slate-700">III. Supplements</span>
                      {suppLocked?<Lock className="w-4 h-4 text-amber-600"/>:<Unlock className="w-4 h-4 text-slate-400"/>}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center gap-2">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Document Stamp</p>
                    <Stamp/>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
              <button type="button" onClick={()=>setEditingQuote(null)} className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-semibold">إلغاء</button>
              <button type="button" onClick={()=>handleSave(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-sm"><Save className="w-4 h-4"/>Save Draft</button>
              <button type="button" onClick={()=>handleSave(false)} className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold shadow-sm" style={{background:'#006780'}}><Send className="w-4 h-4"/>Save & Send</button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS MODAL */}
      {statusChangingQuote&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{background:'#02273b'}}><h3 className="font-bold text-sm text-white">Change Status — {statusChangingQuote.number}</h3><button onClick={()=>setStatusChangingQuote(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5"/></button></div>
            <div className="p-5 space-y-2">
              {['draft','sent','accepted','rejected','expired'].map(s=>{
                const i=si(s);
                return <button key={s} onClick={()=>handleSetStatus(s)} className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-xs font-semibold transition-all ${statusChangingQuote.status===s?'border-[#006780] bg-[#006780]/5 text-[#02273b]':'border-slate-200 hover:bg-slate-50 text-slate-700'}`}><span>{i.ar}</span><span className={`px-2.5 py-0.5 rounded-full border ${i.cls}`}>{i.en}</span></button>;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
