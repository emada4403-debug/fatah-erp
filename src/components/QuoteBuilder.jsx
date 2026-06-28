import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Printer, Edit, Eye, RefreshCw, Trash2, X,
  PlusCircle, FileText, Send, Save, ChevronRight, Layers,
  Package, Lock, Unlock, ArrowLeftRight, HelpCircle
} from 'lucide-react';
import { DB } from '../db/db.js';
import { CostEngine } from '../db/costEngine.js';
import html2pdf from 'html2pdf.js';

// Pre-fill default titles and descriptions for duct types
const TYPE_TITLE = { 
  galvanized: 'RECTANGULAR GALVANIZED SHEET METAL DUCTS', 
  black: 'BLACK SHEET METAL DUCTS', 
  outlets: 'AIR OUTLETS, GRILLES & VOLUME DAMPERS',
  general: '' 
};
const TYPE_DESC = { 
  galvanized: 'Supply and manufacturing only of rectangular galvanized sheet metal ducts according to the required specifications and SMACNA.', 
  black: 'Supply and manufacturing of black sheet metal ducts for industrial and kitchen ventilation systems.', 
  outlets: 'Supply and manufacturing of air outlets, grilles, diffusers, and volume dampers according to specifications.',
  general: '' 
};
const TYPE_TECH = {
  galvanized: `1. For slip and drive connection the weight includes slip and drive transverse connection.\n2. For TDF flange connection the price does not include corners and G-clamps.\n3. For TDC flange connection the price does not include corners and G-clamps.\n4. Galvanized ducts gauges will be according to project specifications.\n5. Thickness: according to SMACNA.\n6. Material: Galvanized sheet metals 275 g/m².`,
  black: `1. Supply & manufacturing of black sheet metal ducts for kitchen/industrial ventilation.\n2. Welding: continuous TIG weld, oil and heat resistant.\n3. Surface treatment: heat-resistant paint coating, suitable up to 350°C.\n4. Thickness: according to SMACNA specifications.\n5. Material: Black steel sheet (St37).`,
  outlets: `1. Frames and blades: high quality extruded aluminum profiles.\n2. Dampers: optional opposed blade dampers (OBD) in galvanized steel.\n3. Finish: electrostatic powder coating RAL 9010 (or custom colors).`,
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
  { id: 'tr3', desc: 'Square to round from 22" to 30"', price: '470.05' },
] : [];

const translateSubsection = (name) => {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed === 'صاج مجلفن') return 'GALVANIZED SHEET METAL DUCTS';
  if (trimmed === 'صاج أسود') return 'BLACK SHEET METAL DUCTS';
  if (trimmed === 'مخارج هواء / دمبر' || trimmed === 'مخارج هواء ودامبر' || trimmed === 'مخارج هواء / دمبر الحجمي') return 'AIR OUTLETS & VOLUME DAMPERS';
  if (trimmed === 'عام') return 'GENERAL FABRICATION';
  if (trimmed.startsWith('قسم فرعي جديد #')) {
    return trimmed.replace('قسم فرعي جديد #', 'SUBSECTION #');
  }
  return trimmed.toUpperCase();
};

const translateUnit = (unit) => {
  if (!unit) return 'pc';
  const u = unit.trim().toLowerCase();
  if (u === 'حتة' || u === 'قطعة' || u === 'pc' || u === 'pcs') return 'pc';
  if (u === 'طن' || u === 'ton' || u === 'tons') return 'Ton';
  if (u === 'م²' || u === 'متر مربع' || u === 'm2' || u === 'sqm') return 'sq.m';
  if (u === 'متر' || u === 'متر طولي' || u === 'm' || u === 'meter') return 'm';
  if (u === 'كجم' || u === 'كيلو' || u === 'kg') return 'kg';
  return unit;
};

const calculateDamperPrice = (w, h, u, damperConfig) => {
  const wVal = parseFloat(w) || 0;
  const hVal = parseFloat(h) || 0;
  if (wVal <= 0 || hVal <= 0) return 0;

  const config = damperConfig || {
    w_side: 0.95,
    w_ring: 0.45,
    w_blade: 0.82,
    w_angle: 0.42,
    p_aluminum: 120,
    p_screws: 80,
    p_gear: 8,
    p_handle: 25,
    p_fab: 0.5,
    margin: 20
  };

  let width_cm = 0, height_cm = 0, width_m = 0, height_m = 0, width_inch = 0, height_inch = 0;

  if (u === 'cm') {
    width_cm = wVal;
    height_cm = hVal;
    width_m = wVal / 100;
    height_m = hVal / 100;
    width_inch = wVal / 2.54;
    height_inch = hVal / 2.54;
  } else if (u === 'mm') {
    width_cm = wVal / 10;
    height_cm = hVal / 10;
    width_m = wVal / 1000;
    height_m = hVal / 1000;
    width_inch = (wVal / 10) / 2.54;
    height_inch = (hVal / 10) / 2.54;
  } else if (u === 'inch') {
    width_cm = wVal * 2.54;
    height_cm = hVal * 2.54;
    width_m = (wVal * 2.54) / 100;
    height_m = (hVal * 2.54) / 100;
    width_inch = wVal;
    height_inch = hVal;
  }

  const sideLength_m = (height_cm + 2) / 100;
  const weight_sides = sideLength_m * 2 * config.w_side;
  const weight_rings = width_m * 2 * config.w_ring;
  const n_blades = Math.floor(height_cm / 10);
  const weight_blades = n_blades * width_m * config.w_blade;
  const hasAngle = height_cm > 0 && !Number.isInteger(height_cm / 2);
  const weight_angle = hasAngle ? (2 * config.w_angle * width_m) : 0;

  const n_ribs = width_cm > 70 ? Math.floor(width_cm / 70) : 0;
  const weight_ribs = n_ribs * height_m * config.w_side;
  const extra_gears = n_ribs * n_blades * 2;

  const total_weight = weight_sides + weight_rings + weight_blades + weight_angle + weight_ribs;

  const cost_aluminum = total_weight * config.p_aluminum;
  const cost_screws = 0.045 * config.p_screws;
  const n_gears = (n_blades * 2) + extra_gears;
  const cost_gears = n_gears * config.p_gear;
  const cost_handle = config.p_handle;
  const cost_fab = width_inch * height_inch * config.p_fab;

  const total_cost = cost_aluminum + cost_screws + cost_gears + cost_handle + cost_fab;
  const sale_price = total_cost * (1 + config.margin / 100);

  return sale_price;
};

const mkId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export default function QuoteBuilder({ quotes, clients, products, settings, onUpdate, editingQuote, setEditingQuote, isAddMode, setIsAddMode, defaultProductType }) {
  const clientSectionRef = React.useRef(null);
  const itemsSectionRef = React.useRef(null);
  const extrasSectionRef = React.useRef(null);
  const termsSectionRef = React.useRef(null);
  const previewContainerRef = React.useRef(null);

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
  const [activeBuilderTab, setActiveBuilderTab] = useState('client'); // client, items, extras, terms
  const [expandedItemId, setExpandedItemId] = useState(null);
  
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
      const targetCategory = 
        currentType === 'black' ? 'cat_black' : 
        currentType === 'outlets' ? 'cat_outlets' : 
        currentType === 'galvanized' ? 'cat_galvanized' : 'cat_general';
      const defaultProd = products.find(p => p.categoryId === targetCategory || p.categoryId === 'cat_vd') || products[0];
      
      const isDamper = defaultProd?.categoryId === 'cat_vd';
      const defaultW = isDamper ? 60 : undefined;
      const defaultH = isDamper ? 50 : undefined;
      const defaultU = isDamper ? 'cm' : undefined;
      
      const calc = defaultProd ? (isDamper ? { finalPrice: calculateDamperPrice(60, 50, 'cm', defaultProd.costEngine?.damperConfig) } : CostEngine.calculate(defaultProd)) : null;
      
      const subsectionLabel = 
        currentType === 'black' ? 'صاج أسود' : 
        currentType === 'outlets' ? 'مخارج هواء / دمبر' : 
        currentType === 'general' ? 'عام' : 'صاج مجلفن';
      
      setFormItems([{
        id: mkId(),
        productId: defaultProd ? defaultProd.id : '',
        productName: defaultProd ? defaultProd.name : '',
        itemTitle: defaultProd?.docTitle || TYPE_TITLE[currentType] || (defaultProd ? defaultProd.name.toUpperCase() : ''),
        itemDesc: isDamper 
          ? `${defaultProd.detailedDesc || defaultProd.name} (Size: 60 × 50 cm)`
          : (defaultProd?.detailedDesc || TYPE_DESC[currentType] || (defaultProd ? defaultProd.name : '')),
        qty: 1,
        unitPrice: calc ? parseFloat(calc.finalPrice.toFixed(2)) : 0,
        discountPct: 0,
        techNotes: defaultProd?.techNotes || TYPE_TECH[currentType] || '',
        unitType: defaultProd ? defaultProd.unitType : 'pc',
        subsection: subsectionLabel,
        width: defaultW,
        height: defaultH,
        unit: defaultU
      }]);
      setFormAccessories([]);
      setFormWorkmanship(DEFAULT_WK(currentType).map(r => ({ ...r, id: mkId() })));
      setFormTransformation(DEFAULT_TR(currentType).map(r => ({ ...r, id: mkId() })));
      setAccLocked(false);
      setSuppLocked(false);
    }
  }, [editingQuote, defaultProductType]);

  // Scroll to active section in A4 preview when builder tabs change
  useEffect(() => {
    let target = null;
    if (activeBuilderTab === 'client') target = clientSectionRef.current;
    if (activeBuilderTab === 'items') target = itemsSectionRef.current;
    if (activeBuilderTab === 'extras') target = extrasSectionRef.current;
    if (activeBuilderTab === 'terms') target = termsSectionRef.current;

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [activeBuilderTab]);

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
          itemTitle: prod.docTitle || TYPE_TITLE[type] || prod.name.toUpperCase(),
          itemDesc: prod.detailedDesc || TYPE_DESC[type] || prod.name,
          techNotes: prod.techNotes || TYPE_TECH[type] || '',
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
    
    const targetCategory = 
      formProductType === 'black' ? 'cat_black' : 
      formProductType === 'outlets' ? 'cat_outlets' : 
      formProductType === 'galvanized' ? 'cat_galvanized' : 'cat_general';
    const prod = pool.find(p => p.categoryId === targetCategory || p.categoryId === 'cat_vd') || pool[0];
    
    const isDamper = prod.categoryId === 'cat_vd';
    const defaultW = isDamper ? 60 : undefined;
    const defaultH = isDamper ? 50 : undefined;
    const defaultU = isDamper ? 'cm' : undefined;
    
    const calc = isDamper 
      ? { finalPrice: calculateDamperPrice(60, 50, 'cm', prod.costEngine?.damperConfig) } 
      : CostEngine.calculate(prod);
      
    setFormItems([...formItems, {
      id: mkId(),
      productId: prod.id,
      productName: prod.name,
      itemTitle: prod.docTitle || TYPE_TITLE[formProductType] || prod.name.toUpperCase(),
      itemDesc: isDamper 
        ? `${prod.detailedDesc || prod.name} (Size: 60 × 50 cm)`
        : (prod.detailedDesc || TYPE_DESC[formProductType] || prod.name),
      qty: 1,
      unitPrice: calc ? parseFloat(calc.finalPrice.toFixed(2)) : 0,
      discountPct: 0,
      techNotes: prod.techNotes || TYPE_TECH[formProductType] || '',
      unitType: prod.unitType || 'pc',
      subsection: subsection,
      width: defaultW,
      height: defaultH,
      unit: defaultU
    }]);
  };

  const handleRemoveItem = (id) => setFormItems(formItems.filter(item => item.id !== id));

  const handleItemChange = (id, field, val) => {
    const upd = formItems.map(item => {
      if (item.id === id) {
        if (field === 'productId') {
          const prod = products.find(p => p.id === val);
          if (prod) {
            const isDamper = prod.categoryId === 'cat_vd';
            const defaultW = isDamper ? 60 : undefined;
            const defaultH = isDamper ? 50 : undefined;
            const defaultU = isDamper ? 'cm' : undefined;
            
            const calc = isDamper 
              ? { finalPrice: calculateDamperPrice(60, 50, 'cm', prod.costEngine?.damperConfig) } 
              : CostEngine.calculate(prod);
              
            return {
              ...item,
              productId: prod.id,
              productName: prod.name,
              itemTitle: prod.docTitle || TYPE_TITLE[formProductType] || prod.name.toUpperCase(),
              itemDesc: isDamper 
                ? `${prod.detailedDesc || prod.name} (Size: 60 × 50 cm)`
                : (prod.detailedDesc || TYPE_DESC[formProductType] || prod.name),
              techNotes: prod.techNotes || TYPE_TECH[formProductType] || '',
              unitType: prod.unitType,
              unitPrice: calc ? parseFloat(calc.finalPrice.toFixed(2)) : 0,
              image: prod.image || '',
              width: defaultW,
              height: defaultH,
              unit: defaultU
            };
          } else {
            return {
              ...item,
              productId: '',
              image: '',
              width: undefined,
              height: undefined,
              unit: undefined
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
  const heroImg = products.find(p => p.id === formItems[0]?.productId)?.image || formItems[0]?.image || '';

  const resolveImage = (img) => {
    if (!img) return '';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    return window.location.origin + img;
  };

  const getValidityDays = () => {
    if (!formValidUntil || !formDate) return 15;
    const diffTime = new Date(formValidUntil) - new Date(formDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 15;
  };

  const bannerTitle = 
    formProductType === 'black' ? 'Black Sheet Metal Ducts' : 
    formProductType === 'outlets' ? 'Air Outlets & Volume Dampers' : 
    formProductType === 'general' ? 'General Fabrication' : 'Galvanized Sheet Metal Ducts';
  const bannerImage = formProductType === 'black' 
    ? '/images/black_duct.png' 
    : formProductType === 'outlets' 
      ? '/images/volume_damper.png' 
      : formProductType === 'general' 
        ? '/images/raw_fe.png' 
        : 'https://lh3.googleusercontent.com/aida/AP1WRLt7XEZusx28evOEwYaWsG6FqUqNfCqROQxfSbwBcdSwEFArj3ZRq9_W8a0CQvlk_kpnTUv6tkzizqqGlSUJ0lbmI4Z47AS8HwJZq_l9tew6me4X9PtfjIHg5T5Cp2_vqycAXdQjXZRa1kqjzlM14hCM8CpurBZxYE6cKQk668JC8VMd5eqjRcTc4RIGu1RMGaWPAILlvUbV_wo-D78okXWPxmHnMYW_Je7gSMpRebvZqBUoJiZx1F3iLys';

  // Trigger Print of the A4 layout directly from the current window (popup-blocker immune)
  const handlePrint = () => {
    const originalTitle = document.title;
    const dateStr = formDate || new Date().toISOString().slice(0, 10);
    const cleanedClient = (formClientName || '').replace(/[/\\?%*:|"<>]/g, '-').trim();
    document.title = `${cleanedClient || 'عرض_سعر'}_${formNumber || 'QT'}_${dateStr}`;
    window.print();
    document.title = originalTitle;
  };

  const handleDownloadPDF = () => {
    generatePDF(html2pdf);
  };

  const generatePDF = (html2pdf) => {
    try {
      const exporter = typeof html2pdf === 'function' ? html2pdf : (html2pdf && html2pdf.default) || window.html2pdf;
      if (!exporter) {
        toast.error('مكتبة تصدير PDF غير متوفرة.');
        return;
      }

      const cleanedClient = (formClientName || '').replace(/[/\\?%*:|"<>]/g, '-').trim();
      const dateStr = formDate || new Date().toISOString().slice(0, 10);
      const filename = `${cleanedClient || 'Quotation'}_${formNumber || 'QT'}_${dateStr}.pdf`;

      const element = previewContainerRef.current.querySelector('[dir="ltr"]');
      if (!element) {
        toast.error('لم يتم العثور على عنصر عرض السعر للطباعة.');
        return;
      }

      const opt = {
        margin:       0.15,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          allowTaint: true,
          devicePixelRatio: 1, 
          logging: false 
        },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      exporter().set(opt).from(element.outerHTML).save()
        .then(() => {
          toast.success('تم تحميل ملف PDF بنجاح.');
        })
        .catch(err => {
          console.error('PDF Export Error:', err);
          toast.error('حدث خطأ أثناء حفظ الملف: ' + err.message);
        });
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تصدير PDF: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
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
          <button type="button" onClick={handleDownloadPDF} className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-600/10">
            <FileText className="w-4 h-4"/>تنزيل PDF
          </button>
          <button type="button" onClick={handlePrint} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer" title="طباعة عرض السعر">
            <Printer className="w-4 h-4"/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: INTERACTIVE BUILDER FORM (5/12 width) */}
        <div className="no-print lg:col-span-5 space-y-4 max-h-[80vh] overflow-y-auto pr-1">

          {/* Tab Navigation Header */}
          <div className="flex border border-slate-200/60 mb-2 bg-slate-100 p-1 rounded-xl gap-1">
            <button 
              type="button"
              onClick={() => setActiveBuilderTab('client')}
              className={`flex-grow py-2 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${activeBuilderTab === 'client' ? 'bg-[#006780] text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              👤 العميل
            </button>
            <button 
              type="button"
              onClick={() => {
                setActiveBuilderTab('items');
                if (formItems.length > 0 && !expandedItemId) {
                  setExpandedItemId(formItems[0].id);
                }
              }}
              className={`flex-grow py-2 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${activeBuilderTab === 'items' ? 'bg-[#006780] text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              📦 البنود ({formItems.length})
            </button>
            <button 
              type="button"
              onClick={() => setActiveBuilderTab('extras')}
              className={`flex-grow py-2 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${activeBuilderTab === 'extras' ? 'bg-[#006780] text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              🔩 الإضافات
            </button>
            <button 
              type="button"
              onClick={() => setActiveBuilderTab('terms')}
              className={`flex-grow py-2 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${activeBuilderTab === 'terms' ? 'bg-[#006780] text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              💳 الشروط
            </button>
          </div>

          {/* 2. Client Details */}
          {activeBuilderTab === 'client' && (
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
          )}

          {/* 3. Items and Subsections Builder */}
          {activeBuilderTab === 'items' && (
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
                        const isExpanded = expandedItemId === item.id;
                        const subtotal = (item.qty || 0) * (item.unitPrice || 0);
                        const discAmt = subtotal * ((item.discountPct || 0) / 100);
                        const total = subtotal - discAmt;
                        
                        return (
                          <div key={item.id} className={`bg-white rounded-xl border transition-all ${isExpanded ? 'border-[#006780] ring-1 ring-[#006780]/20 shadow-xs' : 'border-slate-200 hover:border-slate-300 shadow-xs'}`}>
                            
                            {/* Collapsed Header (Always Visible) */}
                            <div 
                              onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                              className="p-3 flex items-center justify-between cursor-pointer select-none gap-3"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                  {idx + 1}
                                </span>
                                <div className="h-10 w-10 overflow-hidden rounded bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
                                  {img ? (
                                    <img src={resolveImage(img)} alt="" className="h-full w-full object-contain" style={{mixBlendMode: 'multiply'}}/>
                                  ) : (
                                    <span className="text-lg">📦</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#02273b] truncate uppercase">
                                    {item.productName || item.itemTitle || 'بند جديد بدون اسم'}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                    {item.qty || 0} {item.unitType || 'طن'} × {fmtEN(item.unitPrice)} جنيه
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-[#006780] bg-[#006780]/5 px-2 py-0.5 rounded-lg">
                                  {fmtEN(total)} ج.م
                                </span>
                                <button 
                                  type="button" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveItem(item.id);
                                  }} 
                                  className="p-1 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                                  title="حذف البند"
                                >
                                  <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                                <div className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90 text-[#006780]' : ''}`}>
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              </div>
                            </div>

                            {/* Expanded Form Fields */}
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/20">
                                {img && (
                                  <div className="h-20 w-full overflow-hidden rounded bg-slate-50 flex items-center justify-center border border-slate-100 mb-2">
                                    <img src={resolveImage(img)} alt="" className="h-full object-contain" style={{mixBlendMode: 'multiply'}}/>
                                  </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div className="sm:col-span-3">
                                    <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">استيراد منتج مسجل (اختياري للتعبئة التلقائية)</label>
                                    <select value={item.productId || ''} onChange={e => handleItemChange(item.id, 'productId', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780] bg-white">
                                      <option value="">-- أدخل البيانات يدوياً / اختر منتجاً للاستيراد --</option>
                                      {products.filter(p => p.active !== false).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                  </div>

                                  {(() => {
                                    if (formProductType !== 'outlets') return null;

                                    const prod = products.find(p => p.id === item.productId);
                                    const isDamper = prod && prod.categoryId === 'cat_vd';

                                    return (
                                      <div className="sm:col-span-3 grid grid-cols-3 gap-2 bg-[#006780]/5 p-3 rounded-xl border border-[#006780]/15 mb-1.5">
                                        <div className="col-span-3 text-[9px] font-bold text-[#006780] mb-0.5">
                                          {isDamper ? 'حساب مقاسات وأبعاد وتكلفة الدمبر الحجمي:' : 'مقاسات وأبعاد مخرج الهواء / الجريلة:'}
                                        </div>
                                        <div>
                                          <label className="block text-[8px] text-slate-500 font-bold mb-0.5">العرض</label>
                                          <input 
                                            type="number" 
                                            value={item.width !== undefined ? item.width : 60} 
                                            onChange={e => {
                                              const w = parseFloat(e.target.value) || 0;
                                              const h = item.height !== undefined ? item.height : 50;
                                              const u = item.unit || 'cm';
                                              
                                              let newPrice = item.unitPrice;
                                              if (isDamper) {
                                                newPrice = calculateDamperPrice(w, h, u, prod.costEngine?.damperConfig);
                                              }
                                              
                                              const baseTitle = prod ? (prod.detailedDesc || prod.name) : (item.productName || 'بند مخارج');
                                              const unitSuffix = u === 'cm' ? 'سم' : u === 'mm' ? 'مم' : 'بوصة';
                                              const desc = `${baseTitle} (مقاس: ${w} × ${h} ${unitSuffix})`;
                                              
                                              const updatedItems = formItems.map(it => it.id === item.id ? {
                                                ...it,
                                                width: w,
                                                unitPrice: isDamper ? parseFloat(newPrice.toFixed(2)) : it.unitPrice,
                                                itemDesc: desc
                                              } : it);
                                              setFormItems(updatedItems);
                                            }} 
                                            className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#006780]" 
                                            placeholder="60"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[8px] text-slate-500 font-bold mb-0.5">الارتفاع</label>
                                          <input 
                                            type="number" 
                                            value={item.height !== undefined ? item.height : 50} 
                                            onChange={e => {
                                              const w = item.width !== undefined ? item.width : 60;
                                              const h = parseFloat(e.target.value) || 0;
                                              const u = item.unit || 'cm';
                                              
                                              let newPrice = item.unitPrice;
                                              if (isDamper) {
                                                newPrice = calculateDamperPrice(w, h, u, prod.costEngine?.damperConfig);
                                              }
                                              
                                              const baseTitle = prod ? (prod.detailedDesc || prod.name) : (item.productName || 'بند مخارج');
                                              const unitSuffix = u === 'cm' ? 'سم' : u === 'mm' ? 'مم' : 'بوصة';
                                              const desc = `${baseTitle} (مقاس: ${w} × ${h} ${unitSuffix})`;
                                              
                                              const updatedItems = formItems.map(it => it.id === item.id ? {
                                                ...it,
                                                height: h,
                                                unitPrice: isDamper ? parseFloat(newPrice.toFixed(2)) : it.unitPrice,
                                                itemDesc: desc
                                              } : it);
                                              setFormItems(updatedItems);
                                            }} 
                                            className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#006780]" 
                                            placeholder="50"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[8px] text-slate-500 font-bold mb-0.5">الوحدة</label>
                                          <select 
                                            value={item.unit || 'cm'} 
                                            onChange={e => {
                                              const w = item.width !== undefined ? item.width : 60;
                                              const h = item.height !== undefined ? item.height : 50;
                                              const u = e.target.value;
                                              
                                              let newPrice = item.unitPrice;
                                              if (isDamper) {
                                                newPrice = calculateDamperPrice(w, h, u, prod.costEngine?.damperConfig);
                                              }
                                              
                                              const baseTitle = prod ? (prod.detailedDesc || prod.name) : (item.productName || 'بند مخارج');
                                              const unitSuffix = u === 'cm' ? 'سم' : u === 'mm' ? 'مم' : 'بوصة';
                                              const desc = `${baseTitle} (مقاس: ${w} × ${h} ${unitSuffix})`;
                                              
                                              const updatedItems = formItems.map(it => it.id === item.id ? {
                                                ...it,
                                                unit: u,
                                                unitPrice: isDamper ? parseFloat(newPrice.toFixed(2)) : it.unitPrice,
                                                itemDesc: desc
                                              } : it);
                                              setFormItems(updatedItems);
                                            }} 
                                            className="w-full px-1 py-1 rounded border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#006780]"
                                          >
                                            <option value="cm">سم</option>
                                            <option value="mm">مليمتر</option>
                                            <option value="inch">بوصة</option>
                                          </select>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  <div className="sm:col-span-2">
                                    <label className="block text-[9px] text-slate-400 font-bold mb-1">اسم البند / المنتج</label>
                                    <input type="text" value={item.productName || ''} onChange={e => handleItemChange(item.id, 'productName', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" placeholder="مثال: دكت صاج مجلفن..."/>
                                  </div>
                                  <div>
                                    <label className="block text-[9px] text-slate-400 font-bold mb-1">الوحدة</label>
                                    <input type="text" value={item.unitType || ''} onChange={e => handleItemChange(item.id, 'unitType', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" placeholder="م²، طن، كجم..."/>
                                  </div>
                                  <div>
                                    <label className="block text-[9px] text-slate-400 font-bold mb-1">الكمية</label>
                                    <input type="number" value={item.qty || ''} onChange={e => handleItemChange(item.id, 'qty', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" min="0" step="0.001"/>
                                  </div>
                                  <div>
                                    <label className="block text-[9px] text-slate-400 font-bold mb-1">سعر الوحدة (جنيه)</label>
                                    <input type="number" value={item.unitPrice || ''} onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" min="0" step="0.01"/>
                                  </div>
                                  <div>
                                    <label className="block text-[9px] text-slate-400 font-bold mb-1">الخصم (%)</label>
                                    <input type="number" value={item.discountPct || ''} onChange={e => handleItemChange(item.id, 'discountPct', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" min="0" max="100"/>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[9px] text-slate-400 font-bold mb-1">عنوان البند في المستند</label>
                                  <input type="text" value={item.itemTitle || ''} onChange={e => handleItemChange(item.id, 'itemTitle', e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]" placeholder="RECTANGULAR GALVANIZED SHEET DUCTS"/>
                                </div>
                                <div>
                                  <label className="block text-[9px] text-slate-400 font-bold mb-1">الوصف التفصيلي</label>
                                  <input type="text" value={item.itemDesc || ''} onChange={e => handleItemChange(item.id, 'itemDesc', e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006780]"/>
                                </div>
                                <div>
                                  <label className="block text-[9px] text-slate-400 font-bold mb-1">ملاحظات فنية ف التقديم</label>
                                  <textarea value={item.techNotes || ''} onChange={e => handleItemChange(item.id, 'techNotes', e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#006780] font-mono" rows="3"/>
                                </div>
                              </div>
                            )}
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
          )}

          {/* 4. Accessories Picker & Supplements Workmanship */}
          {activeBuilderTab === 'extras' && (
            <>
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
                      <label className="block text-[9px] font-bold text-slate-400 mb-1.5 uppercase">اختر منتجاً لإضافته إلى جدول المكونات:</label>
                      <select 
                        value="" 
                        onChange={e => {
                          const prodId = e.target.value;
                          if (!prodId) return;
                          const prod = products.find(p => p.id === prodId);
                          if (prod) handleAddAccessory(prod);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006780] bg-slate-50/50"
                      >
                        <option value="">— اختر منتجاً من المنتجات المتاحة لإضافته —</option>
                        {products
                          .filter(p => p.active !== false && p.categoryId !== 'cat_galvanized' && p.categoryId !== 'cat_black' && !formAccessories.some(a => a.productId === p.id))
                          .map(p => {
                            const price = CostEngine.calculate(p)?.finalPrice || p.priceOverride || 0;
                            return (
                              <option key={p.id} value={p.id}>
                                {p.name} (${price.toFixed(2)})
                              </option>
                            );
                          })
                        }
                      </select>
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
            </>
          )}

          {/* 6. Commercial Terms (Section IV) */}
          {activeBuilderTab === 'terms' && (
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
          )}
        </div>

        {/* RIGHT COLUMN: PREMIUM A4 PRINT DOCUMENT PREVIEW (7/12 width) */}
        <div ref={previewContainerRef} className="lg:col-span-7 bg-slate-100 rounded-2xl p-4 md:p-8 border border-slate-200 shadow-inner max-h-[85vh] overflow-y-auto flex justify-center scroll-smooth">
          <div dir="ltr" className="w-full max-w-[1000px] mx-auto bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant print-shadow-none print-border overflow-hidden flex flex-col justify-between" style={{fontFamily:"'IBM Plex Sans', sans-serif"}}>
            <div className="p-8 md:p-12 text-left">
              {/* Document Header */}
              <div ref={clientSectionRef} className="flex flex-col md:flex-row justify-between items-start mb-16 border-b border-surface-container-high pb-8 gap-4 scroll-mt-8">
                <div className="flex flex-col gap-4">
                  <img 
                    alt="Al-Fath Engineering Industries Logo" 
                    className="h-20 w-auto object-contain" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuArXN-t3d9q_3fbo0qB3itz0xhAYPBY-VMmZYQnQpKv9ctfxF4MBhdI9HJbPGDA56gxSMfFI_xhfWistOwx7E1G3I7gaacsaR-5pCTyxxg_WoEoxH7mJZj3KJt57qP-sKqPlP4gMBXW9YLugctm4i9A1c4G1cfXY1U9Wy3hE6AwhIDIHO8nft8srj9AlcxH3Uqx0QfciBCEQ61DMDiiXeRpv1-HD6NiMoj79IJZZCpw5bLSM9I-6wK6G10rs0M_-V8n61ykqCloVMF3"
                  />
                  <div className="mt-4">
                    <p className="font-label-sm text-outline tracking-wider uppercase mb-1">Client</p>
                    <h2 className="font-headline-md text-on-surface font-bold uppercase">{formClientName || ''}</h2>
                  </div>
                </div>
                <div className="text-right mt-6 md:mt-0 flex flex-col items-end">
                  <h1 className="font-headline-xl text-primary font-bold tracking-tight uppercase mb-2">Quotation</h1>
                  <p className="font-body-md text-on-surface-variant mb-6">Reference: {formNumber}</p>
                  <div className="flex gap-8 text-right">
                    <div>
                      <p className="font-label-sm text-outline tracking-wider uppercase mb-1">Date</p>
                      <p className="font-body-md text-on-surface font-medium">{fmtDateEN(formDate)}</p>
                    </div>
                    {formProjectName && (
                      <div>
                        <p className="font-label-sm text-outline tracking-wider uppercase mb-1">Project</p>
                        <p className="font-body-md text-on-surface font-medium uppercase">{formProjectName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {['galvanized', 'black'].includes(formProductType) && heroImg && (
                <div className="mx-10 mt-6 mb-6 rounded-xl overflow-hidden h-48 border border-surface-container-high">
                  <img src={heroImg} alt="" className="w-full h-full object-cover object-center" />
                </div>
              )}

              {/* I. Primary Fabrication Schedule */}
              <div ref={itemsSectionRef} className="mb-16 scroll-mt-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-surface-container-high flex-1"></div>
                  <h4 class="font-label-sm text-on-surface-variant tracking-widest uppercase">I. Primary Fabrication Schedule</h4>
                  <div className="h-px bg-surface-container-high flex-1"></div>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface border-y border-surface-container-high">
                        <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase w-12">Item</th>
                        {formProductType === 'outlets' && <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase w-28 text-center">Photo</th>}
                        <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase">Description</th>
                        {formProductType === 'outlets' && (
                          <>
                            <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase text-right w-16">Width</th>
                            <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase text-right w-16">Height</th>
                            <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase text-right w-16">Unit</th>
                          </>
                        )}
                        <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase text-right w-16">Qty Unit</th>
                        <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase text-right w-20">Qty</th>
                        <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase text-right w-24">Rate (L.E)</th>
                        <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase text-right w-28">Total (L.E)</th>
                      </tr>
                    </thead>
                    <tbody className="align-top">
                      {uniqueSubsections.map((subSecName, subSecIdx) => {
                        const subItems = liveTotals.items.filter(it => it.subsection === subSecName);
                        return (
                          <React.Fragment key={subSecName}>
                            <tr className="bg-surface border-b border-surface-container-high font-bold">
                              <td colSpan={formProductType === 'outlets' ? 10 : 6} className="py-2.5 px-4 text-xs text-primary uppercase tracking-wider font-extrabold">{translateSubsection(subSecName)}</td>
                            </tr>
                            {subItems.map((it, i) => {
                              const techNotesList = it.techNotes
                                ? it.techNotes.split('\n').map(line => line.trim()).filter(line => line)
                                : [];
                              const itemImage = it.image || products.find(p => p.id === it.productId)?.image || '';
                              return (
                                <tr key={it.id} className="border-b border-surface-container-high">
                                  <td className="py-6 px-4 font-body-md text-on-surface font-medium align-top">
                                    {subSecIdx + 1}.{i + 1}
                                  </td>
                                  {formProductType === 'outlets' && (
                                    <td className="py-4 px-2 align-top text-center w-28">
                                      <div className="h-24 w-24 overflow-hidden rounded-xl bg-surface-container flex items-center justify-center border border-surface-container-high shadow-xs mx-auto">
                                        {itemImage ? (
                                          <img src={resolveImage(itemImage)} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                                        ) : (
                                          <span className="text-3xl">📦</span>
                                        )}
                                      </div>
                                    </td>
                                  )}
                                  <td className="py-6 px-4 align-top">
                                    <p className="font-body-md text-on-surface font-bold mb-2 uppercase">
                                      {it.itemTitle || it.productName}
                                    </p>
                                    {it.itemDesc && (
                                      <p className="font-body-md text-on-surface-variant text-sm mb-4 leading-relaxed">
                                        {it.itemDesc}
                                      </p>
                                    )}
                                    {techNotesList.length > 0 && (
                                      <div className="bg-surface p-4 rounded border border-surface-container-high mt-4">
                                        <p className="font-label-sm text-primary uppercase mb-2">Technical Note:</p>
                                        <ul className="font-body-md text-on-surface-variant text-sm space-y-1 list-none">
                                          {techNotesList.map((line, lineIdx) => {
                                            let formattedLine = line;
                                            if (formattedLine.includes('275 g/m²')) {
                                              const parts = formattedLine.split('275 g/m²');
                                              return (
                                                <li key={lineIdx} className="">
                                                  {parts[0]}
                                                  <strong className="text-error font-medium">275 g/m²</strong>
                                                  {parts[1]}
                                                </li>
                                              );
                                            }
                                            return <li key={lineIdx} className="">{formattedLine}</li>;
                                          })}
                                        </ul>
                                      </div>
                                    )}
                                  </td>
                                  {formProductType === 'outlets' && (
                                    <>
                                      <td className="py-6 px-4 font-body-md text-on-surface text-right align-top">
                                        {it.width !== undefined && it.width !== null ? it.width : '-'}
                                      </td>
                                      <td className="py-6 px-4 font-body-md text-on-surface text-right align-top">
                                        {it.height !== undefined && it.height !== null ? it.height : '-'}
                                      </td>
                                      <td className="py-6 px-4 font-body-md text-on-surface text-right align-top">
                                        {it.unit !== undefined && it.unit !== null ? it.unit : '-'}
                                      </td>
                                    </>
                                  )}
                                  <td className="py-6 px-4 font-body-md text-on-surface text-right align-top">
                                    {translateUnit(it.unitType)}
                                  </td>
                                  <td className="py-6 px-4 font-body-md text-on-surface text-right align-top">
                                    {(it.qty || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-6 px-4 font-body-md text-on-surface text-right align-top">
                                    {fmtEN(it.unitPrice)}
                                  </td>
                                  <td className="py-6 px-4 font-body-md text-on-surface font-bold text-right align-top">
                                    {fmtEN(it.total)}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* II & III. Accessories and Supplements wrapper */}
              <div ref={extrasSectionRef} className="scroll-mt-8">
                {/* II. Specialized Component Index */}
                {formAccessories.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-px bg-surface-container-high flex-1"></div>
                      <h4 className="font-label-sm text-on-surface-variant tracking-widest uppercase">II. Specialized Component Index</h4>
                      <div className="h-px bg-surface-container-high flex-1"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                      {formAccessories.map((a, i) => (
                        <div key={i} className="bg-surface rounded border border-surface-container-high p-4 flex flex-col hover:border-secondary transition-colors">
                          <div className="h-24 bg-surface-container-lowest rounded mb-3 flex items-center justify-center p-2 border border-surface-container">
                            {a.image ? (
                              <img className="h-full object-contain mix-blend-multiply" src={resolveImage(a.image)} alt={a.name} />
                            ) : (
                              <span className="text-2xl">📦</span>
                            )}
                          </div>
                          <h5 className="font-label-sm text-on-surface font-bold mb-1">{a.name}</h5>
                          {a.description ? (
                            <p className="font-body-md text-on-surface-variant text-xs mb-3 flex-1">{a.description}</p>
                          ) : (
                            <div className="flex-1"></div>
                          )}
                          <div className="flex justify-between items-end mt-auto pt-3 border-t border-surface-container-high">
                            <span className="font-label-sm text-outline text-[10px]">UNIT PRICE</span>
                            <span className="font-body-md text-primary font-bold">${fmtEN(a.unitPrice)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* III. Technical Supplements & Surcharges */}
                {(formWorkmanship.filter(r => r.desc).length > 0 || formTransformation.filter(r => r.desc).length > 0) && (
                  <div className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-px bg-surface-container-high flex-1"></div>
                      <h4 className="font-label-sm text-on-surface-variant tracking-widest uppercase">
                        {formAccessories.length > 0 ? 'III' : 'II'}. Technical Supplements & Surcharges
                      </h4>
                      <div className="h-px bg-surface-container-high flex-1"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                      {formWorkmanship.filter(r => r.desc).length > 0 && (
                        <div>
                          <h5 className="font-label-sm text-primary uppercase mb-3 flex items-center gap-2">
                            <span className="w-4 h-px bg-primary"></span> Assembly Workmanship
                          </h5>
                          <table className="w-full text-left text-sm border-collapse">
                            <thead>
                              <tr className="bg-surface border-y border-surface-container-high">
                                <th className="py-2 px-3 font-label-sm text-on-surface-variant font-medium">Description</th>
                                <th className="py-2 px-3 font-label-sm text-on-surface-variant font-medium text-right">Price (L.E)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formWorkmanship.filter(r => r.desc).map((r, idx) => (
                                <tr key={r.id} className={`border-b border-surface-container ${idx % 2 === 1 ? 'bg-surface-bright' : ''}`}>
                                  <td className="py-3 px-3 text-on-surface">{r.desc}</td>
                                  <td className="py-3 px-3 text-on-surface text-right font-medium">{r.price}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {formTransformation.filter(r => r.desc).length > 0 && (
                        <div>
                          <h5 className="font-label-sm text-primary uppercase mb-3 flex items-center gap-2">
                            <span className="w-4 h-px bg-primary"></span> Transformation Surcharges
                          </h5>
                          <table className="w-full text-left text-sm border-collapse">
                            <thead>
                              <tr className="bg-surface border-y border-surface-container-high">
                                <th className="py-2 px-3 font-label-sm text-on-surface-variant font-medium">Description</th>
                                <th className="py-2 px-3 font-label-sm text-on-surface-variant font-medium text-right">Price (L.E)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formTransformation.filter(r => r.desc).map((r, idx) => (
                                <tr key={r.id} className={`border-b border-surface-container ${idx % 2 === 1 ? 'bg-surface-bright' : ''}`}>
                                  <td className="py-3 px-3 text-on-surface">{r.desc}</td>
                                  <td className="py-3 px-3 text-on-surface text-right font-medium">{r.price}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* IV. Commercial Terms */}
              <div ref={termsSectionRef} className="mb-16 bg-surface p-6 rounded border border-surface-container-high text-left scroll-mt-8">
                <h4 className="font-label-sm text-primary tracking-widest uppercase mb-6">IV. Commercial Terms</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="font-label-sm text-outline uppercase mb-2">Payment Structure</p>
                    <p className="font-body-md text-on-surface text-sm whitespace-pre-line">{formPaymentTerms || '—'}</p>
                  </div>
                  <div>
                    <p className="font-label-sm text-outline uppercase mb-2">Delivery Timeline</p>
                    <p className="font-body-md text-on-surface text-sm">Estimated <strong className="font-semibold text-primary">{formDeliveryDays} Business Days</strong> from receipt of advance payment and approved technical drawings.</p>
                  </div>
                  <div>
                    <p className="font-label-sm text-outline uppercase mb-2">Quote Validity</p>
                    <p className="font-body-md text-on-surface text-sm">This quotation remains valid for <strong className="font-semibold text-primary">{getValidityDays()} Calendar Days</strong> from the issue date due to material market volatility.</p>
                  </div>
                </div>
              </div>

              {/* Signatures & Total */}
              <div className="mt-16 pt-8 border-t border-surface-container-high flex flex-col md:flex-row justify-between items-end relative text-left">
                {/* Approved Stamp */}
                <div style={{transform: 'rotate(-12deg)', opacity: 0.7}} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none no-print">
                  <div className="border-4 border-primary text-primary font-headline-md font-bold py-3 px-6 rounded-lg uppercase tracking-widest bg-white/60 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDt2m7o8bhO8VPuO85SZ_iNx3ZA9MkqZnMHW5S8v3G2Ql-qCWwLWgOY0SG_PEnnaWFbLuxKQnCQd14naVxKA83HKXIJq5K5Z10i4Nb_21p0ZU2yomdsP3PmOwKEMqz8JBVUppxnGuuzvBkhCD8ujhJY-1BqwaQL_Gy9y-njZFSqkvGiJuieAMlM-ctygU6JHcDyF8h4ByqD0QpZKryqsqKhV3Fi6sfLmRYJGip-dDRYrEQ2K71BJNkqs5CgQWkOKyWMjuCulNpiQ7L5" alt="Al-Fath Logo" className="w-16 h-auto mix-blend-multiply opacity-90"/>
                    <div className="text-center leading-tight">
                      AL-FATH ENGINEERING<br />
                      <span className="text-lg">APPROVED</span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-2/3 grid grid-cols-3 gap-4 mb-8 md:mb-0">
                  <div className="text-center">
                    <div className="h-16 border-b border-outline-variant mb-2"></div>
                    <p className="font-label-sm text-on-surface-variant text-[10px] uppercase tracking-wider">Sales Management</p>
                  </div>
                  <div className="text-center">
                    <div className="h-16 border-b border-outline-variant mb-2"></div>
                    <p className="font-label-sm text-on-surface-variant text-[10px] uppercase tracking-wider">Contract Control</p>
                  </div>
                  <div className="text-center">
                    <div className="h-16 border-b border-outline-variant mb-2"></div>
                    <p className="font-label-sm text-on-surface-variant text-[10px] uppercase tracking-wider">General Manager</p>
                  </div>
                </div>

                <div className="bg-surface-bright p-6 rounded border border-surface-container-high w-full md:w-auto min-w-[280px]">
                  <div className="flex justify-between items-end mb-4">
                    <span className="font-label-sm text-on-surface-variant uppercase tracking-widest">Grand Total <br /><span className="text-[10px]">(L.E)</span></span>
                    <span className="font-headline-lg text-primary font-bold">{fmtEN(liveTotals.total)}</span>
                  </div>
                  <div className="border-t border-surface-container-high pt-3 flex justify-between items-center">
                    <span className="font-label-sm text-outline text-[10px] uppercase">VAT Inclusive ({formTaxPct}%)</span>
                    <span className="bg-secondary-container text-on-secondary-container font-label-sm px-2 py-1 rounded text-[10px] uppercase">Final Review</span>
                  </div>
                </div>
              </div>

              {/* Footer Notes */}
              <div className="mt-12 flex justify-between items-center border-t border-surface-container pt-4 text-left">
                <div className="flex gap-2">
                  <span className="bg-surface-variant text-on-surface-variant font-label-sm px-2 py-1 rounded text-[10px] uppercase">Confidential</span>
                  <span className="bg-surface-variant text-on-surface-variant font-label-sm px-2 py-1 rounded text-[10px] uppercase">Draft Ver. 4.2</span>
                </div>
                <p className="font-body-md text-outline text-xs text-right">
                  © {new Date().getFullYear()} Industrial Precision Fabrication. All Rights Reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
