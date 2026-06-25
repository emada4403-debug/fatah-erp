import React, { useState } from 'react';
import { 
  Search, Plus, Trash2, Edit2, Eye, DollarSign, Hammer, BarChart, Settings, 
  X, PlusCircle, LayoutGrid, List, Package, Upload, Image, ArrowRight, Percent, Check, AlertTriangle,
  Calculator
} from 'lucide-react';
import { CostEngine } from '../db/costEngine.js';
import { DB } from '../db/db.js';
import { toast } from './Toast.jsx';
import { confirmModal } from './ConfirmModal.jsx';

export default function Products({ products, materials, categories, isAdmin, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [activeFormTab, setActiveFormTab] = useState('info'); // 'info', 'materials', 'operations'
  
  const [editingProduct, setEditingProduct] = useState(null); // null or product object
  const [costBreakdownProduct, setCostBreakdownProduct] = useState(null); // for showing breakdown modal
  const [isAddMode, setIsAddMode] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formUnit, setFormUnit] = useState('حتة');
  const [formMargin, setFormMargin] = useState(25);
  const [formMinMargin, setFormMinMargin] = useState(15);
  const [formActive, setFormActive] = useState(true);
  const [formImage, setFormImage] = useState('');

  const [formLabor, setFormLabor] = useState(0);
  const [formOverheadFixed, setFormOverheadFixed] = useState(0);
  const [formOverheadVar, setFormOverheadVar] = useState(0);

  const [formMaterials, setFormMaterials] = useState([]); // [{ materialId, qty, note }]
  const [formOperations, setFormOperations] = useState([]); // [{ name, cost }]

  // New cost segregation & BEP states
  const [formSellingPrice, setFormSellingPrice] = useState('');
  const [formProductionTons, setFormProductionTons] = useState(30);
  const [formDirectSalaries, setFormDirectSalaries] = useState(140000);
  const [formDirectSalariesAlloc, setFormDirectSalariesAlloc] = useState(80);
  const [formIndirectSalaries, setFormIndirectSalaries] = useState(50000);
  const [formIndirectSalariesAlloc, setFormIndirectSalariesAlloc] = useState(80);
  const [formRent, setFormRent] = useState(40000);
  const [formRentAlloc, setFormRentAlloc] = useState(80);
  const [formElectricity, setFormElectricity] = useState(15000);
  const [formElectricityAlloc, setFormElectricityAlloc] = useState(80);
  const [formTips, setFormTips] = useState(5000);
  const [formTipsAlloc, setFormTipsAlloc] = useState(80);
  const [formWater, setFormWater] = useState(5000);
  const [formWaterAlloc, setFormWaterAlloc] = useState(80);

  // Scrap states
  const [formUseScrap, setFormUseScrap] = useState(false);
  const [formScrapPct, setFormScrapPct] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formScrapSellingPrice, setFormScrapSellingPrice] = useState('');

  // Reset form helper
  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormCategory(categories[0]?.id || '');
    setFormUnit('حتة');
    setFormMargin(25);
    setFormMinMargin(15);
    setFormActive(true);
    setFormImage('');
    setFormLabor(0);
    setFormOverheadFixed(0);
    setFormOverheadVar(0);
    setFormMaterials([]);
    setFormOperations([]);
    setActiveFormTab('info');
    
    // reset BEP & Selling Price fields
    setFormSellingPrice('');
    setFormProductionTons(30);
    setFormDirectSalaries(140000);
    setFormDirectSalariesAlloc(80);
    setFormIndirectSalaries(50000);
    setFormIndirectSalariesAlloc(80);
    setFormRent(40000);
    setFormRentAlloc(80);
    setFormElectricity(15000);
    setFormElectricityAlloc(80);
    setFormTips(5000);
    setFormTipsAlloc(80);
    setFormWater(5000);
    setFormWaterAlloc(80);
    
    // reset scrap settings
    setFormUseScrap(false);
    setFormScrapPct('');
    setFormPurchasePrice('');
    setFormScrapSellingPrice('');
  };

  // Open Add Form
  const handleOpenAdd = () => {
    if (!isAdmin) return;
    resetForm();
    setIsAddMode(true);
    setEditingProduct({ id: 'temp' });
  };

  // Open Edit Form
  const handleOpenEdit = (p) => {
    if (!isAdmin) return;
    setIsAddMode(false);
    setEditingProduct(p);

    setFormName(p.name || '');
    setFormCode(p.code || '');
    setFormCategory(p.categoryId || '');
    setFormUnit(p.unitType || 'حتة');
    setFormMargin(p.marginPct || 25);
    setFormMinMargin(p.minMarginPct || 15);
    setFormActive(p.active !== false);
    setFormImage(p.image || '');

    setFormSellingPrice(p.sellingPrice !== undefined && p.sellingPrice !== null ? p.sellingPrice : '');

    const ce = p.costEngine || {};
    // Use raw user-entered inputs if saved (vs the embedded computed value)
    const bepRaw = ce.bepConfig || {};
    setFormLabor(bepRaw.rawLaborInput !== undefined ? bepRaw.rawLaborInput : (ce.laborCost || 0));
    setFormOverheadFixed(bepRaw.rawOverheadFixedInput !== undefined ? bepRaw.rawOverheadFixedInput : (ce.overhead?.fixed || 0));
    setFormOverheadVar(ce.overhead?.variable || 0);

    setFormMaterials(ce.rawMaterials || []);
    setFormOperations(ce.operations || []);
    setActiveFormTab('info');

    // Load BEP config if exists
    const bep = ce.bepConfig || {};
    setFormProductionTons(bep.productionTons !== undefined ? bep.productionTons : 30);
    setFormDirectSalaries(bep.directSalaries !== undefined ? bep.directSalaries : 140000);
    setFormDirectSalariesAlloc(bep.directSalariesAlloc !== undefined ? bep.directSalariesAlloc : 80);
    setFormIndirectSalaries(bep.indirectSalaries !== undefined ? bep.indirectSalaries : 50000);
    setFormIndirectSalariesAlloc(bep.indirectSalariesAlloc !== undefined ? bep.indirectSalariesAlloc : 80);
    setFormRent(bep.rent !== undefined ? bep.rent : 40000);
    setFormRentAlloc(bep.rentAlloc !== undefined ? bep.rentAlloc : 80);
    setFormElectricity(bep.electricity !== undefined ? bep.electricity : 15000);
    setFormElectricityAlloc(bep.electricityAlloc !== undefined ? bep.electricityAlloc : 80);
    setFormTips(bep.tips !== undefined ? bep.tips : 5000);
    setFormTipsAlloc(bep.tipsAlloc !== undefined ? bep.tipsAlloc : 80);
    setFormWater(bep.water !== undefined ? bep.water : 5000);
    setFormWaterAlloc(bep.waterAlloc !== undefined ? bep.waterAlloc : 80);

    // Load scrap settings
    const scrap = ce.scrapConfig || {};
    setFormUseScrap(scrap.useScrap || false);
    setFormScrapPct(scrap.scrapPct !== undefined ? scrap.scrapPct : '');
    setFormPurchasePrice(scrap.purchasePrice !== undefined ? scrap.purchasePrice : '');
    setFormScrapSellingPrice(scrap.scrapSellingPrice !== undefined ? scrap.scrapSellingPrice : '');
  };

  // Handle Add Material Row
  const handleAddMaterialRow = () => {
    setFormMaterials([...formMaterials, { materialId: materials[0]?.id || '', qty: 0, note: '' }]);
  };

  // Handle Remove Material Row
  const handleRemoveMaterialRow = (idx) => {
    setFormMaterials(formMaterials.filter((_, i) => i !== idx));
  };

  // Handle Change Material Row
  const handleChangeMaterialRow = (idx, field, val) => {
    const updated = [...formMaterials];
    updated[idx][field] = val;
    setFormMaterials(updated);
  };

  // Handle Add Operation Row
  const handleAddOperationRow = () => {
    setFormOperations([...formOperations, { name: '', cost: 0 }]);
  };

  // Handle Remove Operation Row
  const handleRemoveOperationRow = (idx) => {
    setFormOperations(formOperations.filter((_, i) => i !== idx));
  };

  // Handle Change Operation Row
  const handleChangeOperationRow = (idx, field, val) => {
    const updated = [...formOperations];
    updated[idx][field] = val;
    setFormOperations(updated);
  };

  // Calculate live statistics for editing product
  const getLiveCalculation = () => {
    // For galvanized/black products: compute per-unit share of monthly factory costs
    let factoryLaborPerUnit = 0;
    let factoryOverheadPerUnit = 0;

    if (['cat_galvanized', 'cat_black'].includes(formCategory)) {
      const targetKg = (formProductionTons || 30) * 1000;

      // Estimate unitWeightKg from materials (same logic as BEP modal)
      let unitWeightKg = 0;
      formMaterials.filter(m => m.materialId).forEach(item => {
        const mat = materials.find(m => m.id === item.materialId);
        if (mat && (mat.unit === 'كجم' || item.materialId.includes('galv') || item.materialId.includes('black') || item.materialId.includes('fe'))) {
          unitWeightKg += (item.qty || 0);
        }
      });
      if (unitWeightKg <= 0) unitWeightKg = 2.5; // fallback for m² products

      // Allocated monthly direct salaries → per unit (labor)
      const allocDirectSal = (formDirectSalaries || 0) * ((formDirectSalariesAlloc || 0) / 100);
      factoryLaborPerUnit = targetKg > 0 ? (allocDirectSal / targetKg) * unitWeightKg : 0;

      // Allocated monthly indirect costs → per unit (overhead)
      const allocIndirectSal = (formIndirectSalaries || 0) * ((formIndirectSalariesAlloc || 0) / 100);
      const allocRent        = (formRent || 0)        * ((formRentAlloc || 0) / 100);
      const allocElec        = (formElectricity || 0) * ((formElectricityAlloc || 0) / 100);
      const allocWater       = (formWater || 0)       * ((formWaterAlloc || 0) / 100);
      const allocTips        = (formTips || 0)        * ((formTipsAlloc || 0) / 100);
      const totalIndirect    = allocIndirectSal + allocRent + allocElec + allocWater + allocTips;
      factoryOverheadPerUnit = targetKg > 0 ? (totalIndirect / targetKg) * unitWeightKg : 0;
    }

    const tempProduct = {
      sellingPrice: parseFloat(formSellingPrice) > 0 ? parseFloat(formSellingPrice) : null,
      marginPct: parseFloat(formMargin) || 0,
      minMarginPct: parseFloat(formMinMargin) || 0,
      costEngine: {
        rawMaterials: formMaterials.filter(m => m.materialId),
        scrapConfig: {
          useScrap: formUseScrap,
          scrapPct: parseFloat(formScrapPct) || 0,
          purchasePrice: parseFloat(formPurchasePrice) || 0,
          scrapSellingPrice: parseFloat(formScrapSellingPrice) || 0,
        },
        laborCost: (parseFloat(formLabor) || 0) + factoryLaborPerUnit,
        overhead: {
          fixed: (parseFloat(formOverheadFixed) || 0) + factoryOverheadPerUnit,
          variable: parseFloat(formOverheadVar) || 0,
        },
        operations: formOperations.filter(op => op.name),
      },
    };
    return CostEngine.calculate(tempProduct) || {
      rawTotal: 0,
      laborCost: 0,
      overheadTotal: 0,
      opsTotal: 0,
      totalCost: 0,
      finalPrice: 0,
      marginWarning: false,
    };
  };

  const liveCalc = getLiveCalculation();

  // Save Product
  const handleSave = () => {
    if (!formName.trim()) {
      toast.error('يرجى إدخال اسم المنتج');
      return;
    }

    // For galvanized/black: compute factory per-unit allocation to embed into unit cost
    let savedLaborPerUnit = parseFloat(formLabor) || 0;
    let savedOverheadFixed = parseFloat(formOverheadFixed) || 0;

    if (['cat_galvanized', 'cat_black'].includes(formCategory)) {
      const targetKg = (parseFloat(formProductionTons) || 30) * 1000;

      // Estimate unitWeightKg from materials
      let unitWeightKg = 0;
      formMaterials.filter(m => m.materialId).forEach(item => {
        const mat = materials.find(m => m.id === item.materialId);
        if (mat && (mat.unit === 'كجم' || item.materialId.includes('galv') || item.materialId.includes('black') || item.materialId.includes('fe'))) {
          unitWeightKg += (item.qty || 0);
        }
      });
      if (unitWeightKg <= 0) unitWeightKg = 2.5;

      // Direct salaries per unit → adds to laborCost
      const allocDirectSal = (parseFloat(formDirectSalaries) || 0) * ((parseFloat(formDirectSalariesAlloc) || 0) / 100);
      const factoryLaborPerUnit = targetKg > 0 ? (allocDirectSal / targetKg) * unitWeightKg : 0;

      // Indirect costs per unit → adds to overhead.fixed
      const allocIndirectSal = (parseFloat(formIndirectSalaries) || 0) * ((parseFloat(formIndirectSalariesAlloc) || 0) / 100);
      const allocRent        = (parseFloat(formRent)         || 0) * ((parseFloat(formRentAlloc) || 0) / 100);
      const allocElec        = (parseFloat(formElectricity)  || 0) * ((parseFloat(formElectricityAlloc) || 0) / 100);
      const allocWater       = (parseFloat(formWater)        || 0) * ((parseFloat(formWaterAlloc) || 0) / 100);
      const allocTips        = (parseFloat(formTips)         || 0) * ((parseFloat(formTipsAlloc) || 0) / 100);
      const totalIndirect    = allocIndirectSal + allocRent + allocElec + allocWater + allocTips;
      const factoryOverheadPerUnit = targetKg > 0 ? (totalIndirect / targetKg) * unitWeightKg : 0;

      savedLaborPerUnit   += factoryLaborPerUnit;
      savedOverheadFixed  += factoryOverheadPerUnit;
    }

    const data = {
      name: formName.trim(),
      code: formCode.trim(),
      categoryId: formCategory,
      unitType: formUnit,
      marginPct: parseFloat(formMargin) || 0,
      minMarginPct: parseFloat(formMinMargin) || 0,
      active: formActive,
      image: formImage,
      sellingPrice: parseFloat(formSellingPrice) > 0 ? parseFloat(formSellingPrice) : null,
      costEngine: {
        rawMaterials: formMaterials.filter(m => m.materialId && parseFloat(m.qty) > 0),
        scrapConfig: {
          useScrap: formUseScrap,
          scrapPct: parseFloat(formScrapPct) || 0,
          purchasePrice: parseFloat(formPurchasePrice) || 0,
          scrapSellingPrice: parseFloat(formScrapSellingPrice) || 0,
        },
        laborCost: savedLaborPerUnit,
        overhead: {
          fixed: savedOverheadFixed,
          variable: parseFloat(formOverheadVar) || 0,
        },
        operations: formOperations.filter(op => op.name.trim() && parseFloat(op.cost) > 0),
        bepConfig: {
          productionTons: parseFloat(formProductionTons) || 30,
          directSalaries: parseFloat(formDirectSalaries) || 140000,
          directSalariesAlloc: parseFloat(formDirectSalariesAlloc) || 80,
          indirectSalaries: parseFloat(formIndirectSalaries) || 50000,
          indirectSalariesAlloc: parseFloat(formIndirectSalariesAlloc) || 80,
          rent: parseFloat(formRent) || 40000,
          rentAlloc: parseFloat(formRentAlloc) || 80,
          electricity: parseFloat(formElectricity) || 15000,
          electricityAlloc: parseFloat(formElectricityAlloc) || 80,
          tips: parseFloat(formTips) || 5000,
          tipsAlloc: parseFloat(formTipsAlloc) || 80,
          water: parseFloat(formWater) || 5000,
          waterAlloc: parseFloat(formWaterAlloc) || 80,
          // Stored raw inputs for form reload (separate from the computed embedded amounts)
          rawLaborInput: parseFloat(formLabor) || 0,
          rawOverheadFixedInput: parseFloat(formOverheadFixed) || 0,
        }
      },
    };

    if (isAddMode) {
      DB.insert('products', data);
      toast.success(`🎉 تم إضافة المنتج الجديد "${data.name}" بنجاح`);
    } else {
      DB.update('products', editingProduct.id, data);
      toast.success(`📝 تم تحديث بيانات المنتج "${data.name}" بنجاح`);
    }

    onUpdate();
    setEditingProduct(null);
  };

  // Delete Product
  const handleDelete = async (p) => {
    if (!isAdmin) return;
    const confirmed = await confirmModal.show({
      title: 'حذف المنتج',
      message: `هل أنت متأكد من رغبتك في حذف المنتج "${p.name}"؟ سيتم حذفه من قاعدة البيانات نهائياً.`
    });
    if (confirmed) {
      DB.delete('products', p.id);
      onUpdate();
      toast.success(`🗑️ تم حذف المنتج "${p.name}" بنجاح`);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (p.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory ? p.categoryId === selectedCategory : true;
    return matchSearch && matchCat;
  });

  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' جنيه';
  };

  const formatEGP = formatCurrency;

  return (
    <div className="space-y-0">

      {/* ══ HERO HEADER ══ */}
      <div className="relative rounded-3xl overflow-hidden mb-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-700/50 shadow-2xl">
        {/* Background mesh */}
        <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0ea5e9 0%, transparent 40%)'}} />
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center">
                  <Package className="w-4 h-4 text-indigo-300" />
                </div>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Product Management</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-1">كتالوج المنتجات</h2>
              <p className="text-sm text-slate-400">إدارة منتجات المصنع · هياكل التكلفة · التسعير الاحترافي</p>
            </div>

            {/* Stats chips */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center min-w-[80px]">
                <div className="text-xl font-black text-white">{products.length}</div>
                <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">منتج</div>
              </div>
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center min-w-[80px]">
                <div className="text-xl font-black text-emerald-400">{products.filter(p => p.active).length}</div>
                <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">نشط</div>
              </div>
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center min-w-[80px]">
                <div className="text-xl font-black text-sky-400">{categories.length}</div>
                <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">تصنيف</div>
              </div>
            </div>
          </div>

          {/* Controls row */}
          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0 max-w-md">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث باسم المنتج أو الكود..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 text-sm backdrop-blur-sm"
              />
            </div>

            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 text-sm backdrop-blur-sm min-w-[160px]"
            >
              <option value="" className="bg-slate-800">كل التصنيفات</option>
              {categories.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-800">{c.icon} {c.name}</option>
              ))}
            </select>

            {/* View toggles */}
            <div className="bg-white/8 border border-white/15 p-1 rounded-xl flex backdrop-blur-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                title="عرض الشبكة"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                title="عرض الجدول"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Add button */}
            {isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> إضافة منتج
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ GRID VIEW ══ */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.length ? (
            filteredProducts.map((p) => {
              const calc = CostEngine.calculate(p);
              const cat = categories.find(c => c.id === p.categoryId);
              const margin = calc?.margin ?? p.marginPct;
              const isWarning = calc?.marginWarning;

              return (
                <div key={p.id} className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 overflow-hidden flex flex-col cursor-default">

                  {/* Top glow line */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center overflow-hidden">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center">
                        <Package className="w-14 h-14 text-slate-300 group-hover:scale-110 group-hover:text-indigo-300 transition-all duration-300" />
                      </div>
                    )}

                    {/* Gradient overlay on image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Badges */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="bg-white/95 backdrop-blur-sm text-[9px] font-bold px-2 py-1 rounded-lg border border-slate-100 shadow-sm text-slate-700 flex items-center gap-1">
                        {cat ? `${cat.icon} ${cat.name}` : '—'}
                      </span>
                    </div>
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${p.active ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-rose-500/90 text-white border-rose-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-white animate-pulse' : 'bg-white/60'}`} />
                        {p.active ? 'نشط' : 'معطل'}
                      </span>
                    </div>

                    {/* Quick actions overlay */}
                    {isAdmin && (
                      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                        <button onClick={() => setCostBreakdownProduct(p)} className="bg-white/95 backdrop-blur-sm text-indigo-600 p-1.5 rounded-lg shadow-md hover:bg-indigo-600 hover:text-white transition-all" title="تفاصيل التكلفة">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleOpenEdit(p)} className="bg-white/95 backdrop-blur-sm text-blue-600 p-1.5 rounded-lg shadow-md hover:bg-blue-600 hover:text-white transition-all" title="تعديل">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p)} className="bg-white/95 backdrop-blur-sm text-rose-500 p-1.5 rounded-lg shadow-md hover:bg-rose-600 hover:text-white transition-all" title="حذف">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-grow space-y-3">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.code || '—'}</p>
                    </div>

                    {/* Price row */}
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[9px] text-slate-400 font-semibold mb-0.5">سعر البيع</div>
                        <div className="text-sm font-black text-emerald-600">{calc ? formatCurrency(calc.finalPrice) : '—'}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-[9px] text-slate-400 font-semibold mb-0.5">الوحدة</div>
                        <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg font-bold">لكل {p.unitType}</span>
                      </div>
                    </div>

                    {/* Admin cost strip */}
                    {isAdmin && calc && (
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-semibold">تكلفة الإنتاج</span>
                          <span className="font-black text-slate-800">{formatCurrency(calc.totalCost)}</span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-slate-500 font-semibold">هامش الربح</span>
                          <span className={`font-black flex items-center gap-1 ${isWarning ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isWarning && <AlertTriangle className="w-3 h-3" />}
                            {Math.round(margin)}%
                          </span>
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isWarning ? 'bg-rose-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer actions (non-hover fallback for touch) */}
                  {isAdmin && (
                    <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-end gap-1 bg-slate-50/50 sm:hidden">
                      <button onClick={() => setCostBreakdownProduct(p)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg transition-all"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleOpenEdit(p)} className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold">لا توجد منتجات مطابقة</p>
              <p className="text-slate-300 text-sm mt-1">جرب تغيير كلمة البحث أو التصنيف</p>
            </div>
          )}
        </div>

      ) : (
        /* ══ TABLE VIEW ══ */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Table header bar */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-5 py-3.5 flex items-center gap-2 border-b border-slate-700">
            <List className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white">قائمة المنتجات</span>
            <span className="mr-auto bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
              {filteredProducts.length} منتج
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wide">
                  <th className="px-5 py-3.5">المنتج</th>
                  <th className="px-5 py-3.5">التصنيف</th>
                  <th className="px-5 py-3.5">وحدة البيع</th>
                  {isAdmin && <th className="px-5 py-3.5">تكلفة الإنتاج</th>}
                  <th className="px-5 py-3.5">سعر البيع</th>
                  {isAdmin && <th className="px-5 py-3.5">هامش الربح</th>}
                  <th className="px-5 py-3.5">الحالة</th>
                  {isAdmin && <th className="px-5 py-3.5 text-center">إجراءات</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.length ? (
                  filteredProducts.map((p, idx) => {
                    const calc = CostEngine.calculate(p);
                    const cat = categories.find(c => c.id === p.categoryId);
                    const isWarning = calc?.marginWarning;
                    return (
                      <tr key={p.id} className={`hover:bg-indigo-50/30 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                              {p.image ? (
                                <img src={p.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-300" />
                              )}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">{p.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 bg-slate-100 px-1.5 py-0.5 rounded inline-block">{p.code || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {cat ? `${cat.icon} ${cat.name}` : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                            {p.unitType}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-3.5">
                            <span className="font-black text-slate-700 text-sm">{calc ? formatCurrency(calc.totalCost) : '—'}</span>
                          </td>
                        )}
                        <td className="px-5 py-3.5">
                          <span className="font-black text-emerald-600 text-sm">{calc ? formatCurrency(calc.finalPrice) : '—'}</span>
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-14 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isWarning ? 'bg-rose-400' : 'bg-emerald-400'}`}
                                  style={{ width: `${Math.min(100, Math.max(0, calc?.margin ?? p.marginPct))}%` }}
                                />
                              </div>
                              <span className={`text-xs font-black flex items-center gap-0.5 ${isWarning ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isWarning && <AlertTriangle className="w-3 h-3" />}
                                {Math.round(calc?.margin ?? p.marginPct)}%
                              </span>
                            </div>
                          </td>
                        )}
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 w-fit ${p.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
                            {p.active ? 'نشط' : 'معطل'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => setCostBreakdownProduct(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-transparent hover:border-indigo-100" title="تفاصيل التكلفة">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleOpenEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100" title="تعديل">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(p)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100" title="حذف">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? "8" : "5"} className="px-5 py-14 text-center">
                      <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 font-semibold">لا توجد منتجات مطابقة</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* Modal: Cost Breakdown Details */}
      {costBreakdownProduct && (() => {
        const calc = CostEngine.calculate(costBreakdownProduct);
        const isBepApplicable = ['cat_galvanized', 'cat_black'].includes(costBreakdownProduct.categoryId);
        const formatShortEGP = (val) => {
          return (val || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 3 }) + ' ج';
        };

        // BEP calculations if applicable
        let bepTons = 0;
        let bepValue = 0;
        let sellingPricePerTon = 0;
        let variableCostPerTon = 0;
        let contributionMarginPerTon = 0;
        let totalMonthlyFixedCosts = 0;
        let targetTons = 30;
        let allocatedDirectSalaries = 0;
        let allocatedIndirectSalaries = 0;
        let allocatedRent = 0;
        let allocatedElectricity = 0;
        let allocatedWater = 0;
        let allocatedTips = 0;
        let directMaterialsCost = 0;
        let directOpsCost = 0;
        let totalDirectCosts = 0;
        let totalIndirectCosts = 0;
        let netProfitAtTarget = 0;
        let marginOfSafety = 0;
        let unitsPerTon = 0;
        let unitWeightKg = 0;
        let indirectVarOverheadCost = 0;
        let indirectFixedOverheadCost = 0;
        let unitRawCost = 0;
        let unitOpsCost = 0;
        let unitVarOverhead = 0;

        if (isBepApplicable && calc) {
          // Weight calculation
          const rawMaterialsList = costBreakdownProduct.costEngine?.rawMaterials || [];
          rawMaterialsList.forEach(item => {
            const mat = materials.find(m => m.id === item.materialId);
            if (mat && (mat.unit === 'كجم' || mat.id.includes('galv') || mat.id.includes('black') || mat.id.includes('fe'))) {
              unitWeightKg += (item.qty || 0);
            }
          });
          if (unitWeightKg <= 0) {
            unitWeightKg = costBreakdownProduct.unitType === 'م²' ? 11 : 10;
          }

          unitsPerTon = 1000 / unitWeightKg;
          const unitSellingPrice = costBreakdownProduct.sellingPrice || calc.finalPrice || 0;
          sellingPricePerTon = unitSellingPrice * unitsPerTon;

          const bep = costBreakdownProduct.costEngine?.bepConfig || {
            productionTons: 30,
            directSalaries: 140000,
            directSalariesAlloc: 80,
            indirectSalaries: 50000,
            indirectSalariesAlloc: 80,
            rent: 40000,
            rentAlloc: 80,
            electricity: 15000,
            electricityAlloc: 80,
            water: 5000,
            waterAlloc: 80,
            tips: 5000,
            tipsAlloc: 80,
          };

          targetTons = bep.productionTons || 30;

          allocatedDirectSalaries = bep.directSalaries * (bep.directSalariesAlloc / 100);
          allocatedIndirectSalaries = bep.indirectSalaries * (bep.indirectSalariesAlloc / 100);
          allocatedRent = bep.rent * (bep.rentAlloc / 100);
          allocatedElectricity = bep.electricity * (bep.electricityAlloc / 100);
          allocatedWater = (bep.water !== undefined ? bep.water : 5000) * ((bep.waterAlloc !== undefined ? bep.waterAlloc : 80) / 100);
          allocatedTips = bep.tips * (bep.tipsAlloc / 100);

          totalMonthlyFixedCosts = allocatedDirectSalaries + allocatedIndirectSalaries + allocatedRent + allocatedElectricity + allocatedWater + allocatedTips;

          unitRawCost = calc.rawTotal || 0;
          unitOpsCost = calc.opsTotal || 0;
          unitVarOverhead = costBreakdownProduct.costEngine?.overhead?.variable || 0;
          const variableCostPerUnit = unitRawCost + unitOpsCost + unitVarOverhead;
          variableCostPerTon = variableCostPerUnit * unitsPerTon;

          contributionMarginPerTon = sellingPricePerTon - variableCostPerTon;

          if (contributionMarginPerTon > 0) {
            bepTons = totalMonthlyFixedCosts / contributionMarginPerTon;
            bepValue = bepTons * sellingPricePerTon;
          }

          const totalRevenueAtTarget = sellingPricePerTon * targetTons;
          const totalVariableCostAtTarget = variableCostPerTon * targetTons;
          netProfitAtTarget = totalRevenueAtTarget - (totalMonthlyFixedCosts + totalVariableCostAtTarget);
          marginOfSafety = targetTons > bepTons && targetTons > 0 ? ((targetTons - bepTons) / targetTons) * 100 : 0;

          // Direct Costs
          directMaterialsCost = unitRawCost * unitsPerTon * targetTons;
          directOpsCost = unitOpsCost * unitsPerTon * targetTons;
          const scrapMonthlyTotal = (calc.scrapCost || 0) * unitsPerTon * targetTons;
          totalDirectCosts = allocatedDirectSalaries + directMaterialsCost + directOpsCost + scrapMonthlyTotal;

          // Indirect Costs
          indirectVarOverheadCost = unitVarOverhead * unitsPerTon * targetTons;
          indirectFixedOverheadCost = (costBreakdownProduct.costEngine?.overhead?.fixed || 0) * unitsPerTon * targetTons;
          totalIndirectCosts = allocatedIndirectSalaries + allocatedRent + allocatedElectricity + allocatedWater + allocatedTips + indirectVarOverheadCost + indirectFixedOverheadCost;
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              <div className="bg-gradient-to-r from-slate-950 to-slate-900 text-white p-5 flex items-center justify-between flex-shrink-0 border-b border-slate-800/80">
                <div>
                  <h3 className="font-black text-lg text-white">{costBreakdownProduct.name}</h3>
                  <span className="text-[10px] bg-slate-850 text-slate-350 border border-slate-750 px-2.5 py-1 rounded-lg mt-1 inline-block font-medium">
                    وحدة البيع: {costBreakdownProduct.unitType} {isBepApplicable && `(الوزن المقدر: ${unitWeightKg.toFixed(1)} كجم/وحدة)`}
                  </span>
                </div>
                <button
                  onClick={() => setCostBreakdownProduct(null)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-grow bg-slate-900/30">
                {isBepApplicable ? (
                  // Bep & Cost Segregation analysis view
                  <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-right">
                      <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-2xl hover:border-slate-800 transition-all">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">التكاليف الثابتة المخصصة</span>
                        <span className="text-xs font-black text-white block">{formatCurrency(totalMonthlyFixedCosts)}</span>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-2xl hover:border-slate-800 transition-all">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">التكلفة المتغيرة للطن</span>
                        <span className="text-xs font-black text-white block">{formatEGP(variableCostPerTon)}</span>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-2xl hover:border-slate-800 transition-all">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">حجم التعادل</span>
                        <span className="text-xs font-black text-rose-450 block">
                          {contributionMarginPerTon > 0 ? `${bepTons.toFixed(2)} طن` : 'غير ممكن'}
                        </span>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-2xl hover:border-slate-800 transition-all">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">صافي الأرباح المتوقعة</span>
                        <span className={`text-xs font-black block mt-1 ${netProfitAtTarget >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatEGP(netProfitAtTarget)}
                        </span>
                      </div>
                    </div>

                    {/* Contribution Margin & Margin of safety */}
                    <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-850 text-xs text-slate-350 leading-relaxed text-right space-y-1.5">
                      <div>
                        <strong>هامش المساهمة للطن:</strong> <span className={contributionMarginPerTon > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{formatEGP(contributionMarginPerTon)}</span> (سعر بيع الطن {formatEGP(sellingPricePerTon)} - التكلفة المتغيرة للطن {formatEGP(variableCostPerTon)})
                      </div>
                      {contributionMarginPerTon > 0 && (
                        <div>
                          <strong>حد الأمان المحاسبي:</strong> <span className="text-indigo-400 font-bold">{marginOfSafety.toFixed(1)}%</span> (مستوى حماية الأرباح عند طاقة إنتاجية {targetTons} طن)
                        </div>
                      )}
                    </div>

                    {/* Side-by-Side Cost Segregation Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-right text-[11px]">
                      {/* Direct Costs Table */}
                      <div className="bg-indigo-950/10 border border-indigo-900/30 rounded-2xl p-4 space-y-3 shadow-inner">
                        <h4 className="font-bold text-indigo-400 border-b border-indigo-900/20 pb-2 mb-2 text-xs">التكاليف المباشرة (Direct Costs)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse">
                            <thead>
                              <tr className="border-b border-indigo-950/50 text-indigo-300 font-bold">
                                <th className="pb-2 text-right">البند</th>
                                <th className="pb-2 text-left">شهرياً (التارجت)</th>
                                <th className="pb-2 text-left">نصيب الكيلو</th>
                                <th className="pb-2 text-left">نصيب الـ {costBreakdownProduct.unitType}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-950/20 text-slate-300">
                              <tr className="hover:bg-indigo-950/20 transition-colors">
                                <td className="py-2.5 text-slate-200 font-medium">مرتبات مباشرة</td>
                                <td className="py-2.5 text-left font-mono">{formatEGP(allocatedDirectSalaries)}</td>
                                <td className="py-2.5 text-left font-mono">{formatShortEGP(allocatedDirectSalaries / (targetTons * 1000))}</td>
                                <td className="py-2.5 text-left font-mono">{formatShortEGP((allocatedDirectSalaries / (targetTons * 1000)) * unitWeightKg)}</td>
                              </tr>
                              <tr className="hover:bg-indigo-950/20 transition-colors">
                                <td className="py-2.5 text-slate-200 font-medium">المواد الخام والحديد</td>
                                <td className="py-2.5 text-left font-mono">{formatEGP(directMaterialsCost)}</td>
                                <td className="py-2.5 text-left font-mono">{formatShortEGP(unitRawCost / unitWeightKg)}</td>
                                <td className="py-2.5 text-left font-mono">{formatShortEGP(unitRawCost)}</td>
                              </tr>
                              <tr className="hover:bg-indigo-950/20 transition-colors">
                                <td className="py-2.5 text-slate-200 font-medium">عمليات التشغيل المباشرة</td>
                                <td className="py-2.5 text-left font-mono">{formatEGP(directOpsCost)}</td>
                                <td className="py-2.5 text-left font-mono">{formatShortEGP(unitOpsCost / unitWeightKg)}</td>
                                <td className="py-2.5 text-left font-mono">{formatShortEGP(unitOpsCost)}</td>
                              </tr>
                              {costBreakdownProduct.costEngine?.scrapConfig?.useScrap && (
                                <tr className="hover:bg-indigo-950/20 transition-colors text-rose-350">
                                  <td className="py-2.5 font-medium">تكلفة الهالك والفاقد</td>
                                  <td className="py-2.5 text-left font-mono">{formatEGP((calc.scrapCost || 0) * unitsPerTon * targetTons)}</td>
                                  <td className="py-2.5 text-left font-mono">{formatShortEGP((calc.scrapCost || 0) / unitWeightKg)}</td>
                                  <td className="py-2.5 text-left font-mono">{formatShortEGP(calc.scrapCost || 0)}</td>
                                </tr>
                              )}
                              <tr className="font-bold text-indigo-400 bg-indigo-950/30 border-t border-indigo-900/50">
                                <td className="py-2.5">إجمالي المباشرة</td>
                                <td className="py-2.5 text-left font-mono">{formatEGP(totalDirectCosts)}</td>
                                <td className="py-2.5 text-left font-mono">{formatShortEGP(totalDirectCosts / (targetTons * 1000))}</td>
                                <td className="py-2.5 text-left font-mono">{formatShortEGP((totalDirectCosts / (targetTons * 1000)) * unitWeightKg)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Indirect Costs Table */}
                      <div className="bg-amber-950/10 border border-amber-900/30 rounded-2xl p-4 space-y-3 shadow-inner">
                        <h4 className="font-bold text-amber-400 border-b border-amber-900/20 pb-2 mb-2 text-xs">التكاليف غير المباشرة (Indirect Costs)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse">
                            <thead>
                              <tr className="border-b border-amber-950/50 text-amber-300 font-bold">
                                <th className="pb-2 text-right">البند</th>
                                <th className="pb-2 text-left">شهرياً (التارجت)</th>
                                <th className="pb-2 text-left">نصيب الكيلو</th>
                                <th className="pb-2 text-left">نصيب الـ {costBreakdownProduct.unitType}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-950/20 text-slate-300">
                              <tr className="hover:bg-amber-950/20 transition-colors">
                                <td className="py-2 text-slate-200 font-medium">مرتبات غير مباشرة</td>
                                <td className="py-2 text-left font-mono">{formatEGP(allocatedIndirectSalaries)}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP(allocatedIndirectSalaries / (targetTons * 1000))}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP((allocatedIndirectSalaries / (targetTons * 1000)) * unitWeightKg)}</td>
                              </tr>
                              <tr className="hover:bg-amber-950/20 transition-colors">
                                <td className="py-2 text-slate-200 font-medium">الإيجار المخصص</td>
                                <td className="py-2 text-left font-mono">{formatEGP(allocatedRent)}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP(allocatedRent / (targetTons * 1000))}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP((allocatedRent / (targetTons * 1000)) * unitWeightKg)}</td>
                              </tr>
                              <tr className="hover:bg-amber-950/20 transition-colors">
                                <td className="py-2 text-slate-200 font-medium">الكهرباء المخصصة</td>
                                <td className="py-2 text-left font-mono">{formatEGP(allocatedElectricity)}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP(allocatedElectricity / (targetTons * 1000))}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP((allocatedElectricity / (targetTons * 1000)) * unitWeightKg)}</td>
                              </tr>
                              <tr className="hover:bg-amber-950/20 transition-colors">
                                <td className="py-2 text-slate-200 font-medium">المياه المخصصة</td>
                                <td className="py-2 text-left font-mono">{formatEGP(allocatedWater)}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP(allocatedWater / (targetTons * 1000))}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP((allocatedWater / (targetTons * 1000)) * unitWeightKg)}</td>
                              </tr>
                              <tr className="hover:bg-amber-950/20 transition-colors">
                                <td className="py-2 text-slate-200 font-medium">إكراميات ونثريات</td>
                                <td className="py-2 text-left font-mono">{formatEGP(allocatedTips)}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP(allocatedTips / (targetTons * 1000))}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP((allocatedTips / (targetTons * 1000)) * unitWeightKg)}</td>
                              </tr>
                              <tr className="hover:bg-amber-950/20 transition-colors">
                                <td className="py-2 text-slate-200 font-medium">صناعية غ.م متغيرة</td>
                                <td className="py-2 text-left font-mono">{formatEGP(indirectVarOverheadCost)}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP(unitVarOverhead / unitWeightKg)}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP(unitVarOverhead)}</td>
                              </tr>
                              <tr className="hover:bg-amber-950/20 transition-colors">
                                <td className="py-2 text-slate-200 font-medium">صناعية غ.م ثابتة</td>
                                <td className="py-2 text-left font-mono">{formatEGP(indirectFixedOverheadCost)}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP((costBreakdownProduct.costEngine?.overhead?.fixed || 0) / unitWeightKg)}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP(costBreakdownProduct.costEngine?.overhead?.fixed || 0)}</td>
                              </tr>
                              <tr className="font-bold text-amber-400 bg-amber-950/30 border-t border-amber-900/50">
                                <td className="py-2">إجمالي غ.المباشرة</td>
                                <td className="py-2 text-left font-mono">{formatEGP(totalIndirectCosts)}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP(totalIndirectCosts / (targetTons * 1000))}</td>
                                <td className="py-2 text-left font-mono">{formatShortEGP((totalIndirectCosts / (targetTons * 1000)) * unitWeightKg)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Original basic breakdown view for other categories
                  <div className="space-y-6">
                    {calc?.marginWarning && (
                      <div className="bg-amber-950/40 border border-amber-900/50 text-amber-300 p-4 rounded-2xl text-xs flex gap-2 items-center">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>تحذير: هامش الربح الحالي ({calc.margin.toFixed(1)}%) أقل من الحد الأدنى المطلوب للمنتج ({calc.minMargin}%).</span>
                      </div>
                    )}

                    {/* Raw Materials Section */}
                    <div className="space-y-2 text-right">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">🧱 المواد الخام المستخدمة</h4>
                      <div className="bg-slate-950/30 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-850/80">
                        {calc?.rawBreakdown.length ? (
                          calc.rawBreakdown.map((r, i) => (
                            <div key={i} className="flex justify-between py-2.5 first:pt-0 last:pb-0 text-sm">
                              <span className="text-slate-300">{r.matName} <span className="text-xs text-slate-500">({r.qty} × {r.unitCost}ج)</span></span>
                              <span className="font-semibold text-white">{formatCurrency(r.total)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-xs text-slate-500 py-2">لا توجد مواد خام مضافة</div>
                        )}
                        <div className="flex justify-between pt-2.5 text-sm font-bold text-white border-t border-slate-850/60 mt-1">
                          <span>إجمالي المواد الخام</span>
                          <span className="text-indigo-400">{formatCurrency(calc?.rawTotal)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Overhead / Labor Section */}
                    <div className="space-y-2 text-right">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">👷 التكاليف التشغيلية والعمالة</h4>
                      <div className="bg-slate-950/30 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-350">عمالة مباشرة</span>
                          <span className="font-semibold text-white">{formatCurrency(calc?.laborCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-350">مصاريف صناعية غير مباشرة (ثابتة)</span>
                          <span className="font-semibold text-white">{formatCurrency(costBreakdownProduct.costEngine?.overhead?.fixed)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-350">مصاريف صناعية غير مباشرة (متغيرة)</span>
                          <span className="font-semibold text-white">{formatCurrency(costBreakdownProduct.costEngine?.overhead?.variable)}</span>
                        </div>
                      </div>
                    </div>

                    {costBreakdownProduct.costEngine?.scrapConfig?.useScrap && (
                      <div className="space-y-2 text-right">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">♻️ الهالك والفاقد</h4>
                        <div className="bg-slate-950/30 border border-slate-800 rounded-2xl p-4 text-sm flex justify-between">
                          <span className="text-rose-300 font-medium">تكلفة الهالك المضافة ({costBreakdownProduct.costEngine.scrapConfig.scrapPct}% الهالك)</span>
                          <span className="font-semibold text-rose-400">+{formatCurrency(calc?.scrapCost)}</span>
                        </div>
                      </div>
                    )}

                    {/* Operations Section */}
                    {costBreakdownProduct.costEngine?.operations?.length > 0 && (
                      <div className="space-y-2 text-right">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">⚙️ عمليات التصنيع والتشغيل</h4>
                        <div className="bg-slate-950/30 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-850/80 text-sm">
                          {costBreakdownProduct.costEngine.operations.map((op, i) => (
                            <div key={i} className="flex justify-between py-2.5 first:pt-0 last:pb-0 text-sm">
                              <span className="text-slate-350">{op.name}</span>
                              <span className="font-semibold text-white">{formatCurrency(op.cost)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total Costs Box */}
                    <div className="border border-slate-800 rounded-2xl p-5 space-y-2 bg-gradient-to-br from-slate-950 to-slate-900 text-white text-right font-semibold shadow-lg">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>إجمالي تكلفة الإنتاج</span>
                        <span className="font-mono">{formatCurrency(calc?.totalCost)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>هامش الربح ({calc?.margin.toFixed(1)}%)</span>
                        <span className="font-mono">{formatCurrency(calc ? (calc.finalPrice - calc.totalCost) : 0)}</span>
                      </div>
                      <div className="h-px bg-slate-800 my-1.5"></div>
                      <div className="flex justify-between font-bold text-lg text-emerald-400">
                        <span>سعر البيع النهائي</span>
                        <span className="font-mono text-xl">{formatCurrency(calc?.finalPrice)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-950/50 p-4 border-t border-slate-800 text-left flex-shrink-0">
                <button
                  onClick={() => setCostBreakdownProduct(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-sm font-semibold transition-all border border-slate-750 cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Add / Edit Product Form */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-950 to-slate-900 text-white p-5 flex items-center justify-between flex-shrink-0 border-b border-slate-800/85">
              <div className="flex items-center gap-3">
                <h3 className="font-black text-lg text-white">
                  {isAddMode ? '➕ إضافة منتج جديد للكتالوج' : `✏️ تعديل المنتج: ${editingProduct.name}`}
                </h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700/50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body: Split Columns */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto flex-grow bg-slate-900/10">
              {/* Right Side: Tabbed Inputs Form (2 Columns) */}
              <div className="lg:col-span-2 flex flex-col space-y-4">
                {/* Form Tabs */}
                <div className="bg-slate-950/40 p-1.5 rounded-2xl flex gap-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('info')}
                    className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
                      activeFormTab === 'info'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/15'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                    }`}
                  >
                    📝 بيانات المنتج الأساسية
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('materials')}
                    className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
                      activeFormTab === 'materials'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/15'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                    }`}
                  >
                    🧱 المكونات والخامات ({formMaterials.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('operations')}
                    className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
                      activeFormTab === 'operations'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/15'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                    }`}
                  >
                    👷 العمالة والتشغيل
                  </button>
                </div>

                {/* Tab Content Box */}
                <div className="bg-slate-950/20 rounded-3xl p-6 border border-slate-800/80 shadow-xl flex-grow space-y-6">
                  {activeFormTab === 'info' && (
                    <div className="space-y-5 animate-in fade-in duration-150 text-right">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5">اسم المنتج</label>
                          <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white placeholder-slate-600 focus:border-indigo-500 transition-all text-right"
                            placeholder="مثال: دكت صاج مجلفن"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5">كود المنتج</label>
                          <input
                            type="text"
                            value={formCode}
                            onChange={(e) => setFormCode(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white placeholder-slate-650 focus:border-indigo-500 transition-all font-mono"
                            placeholder="مثال: GD-12"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5">التصنيف</label>
                          <select
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'left 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingLeft: '2.5rem' }}
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.icon} {c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5">وحدة القياس / البيع</label>
                          <select
                            value={formUnit}
                            onChange={(e) => setFormUnit(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'left 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingLeft: '2.5rem' }}
                          >
                            <option value="حتة" className="bg-slate-900 text-white">حتة (وحدة)</option>
                            <option value="كجم" className="bg-slate-900 text-white">كجم (وزن)</option>
                            <option value="متر" className="bg-slate-900 text-white">متر (طول)</option>
                            <option value="م²" className="bg-slate-900 text-white">متر مربع (مساحة)</option>
                            <option value="طن" className="bg-slate-900 text-white">طن</option>
                          </select>
                        </div>
                      </div>

                      {/* Image Upload Area */}
                      <div className="border-t border-slate-800 pt-4 space-y-3">
                        <label className="block text-xs font-semibold text-slate-400">صورة المنتج</label>
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                          <div className="relative w-28 h-28 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner">
                            {formImage ? (
                              <>
                                <img src={formImage} className="w-full h-full object-cover" alt="" />
                                <button
                                  type="button"
                                  onClick={() => setFormImage('')}
                                  className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full transition-all"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <div className="text-center space-y-1">
                                <Image className="w-8 h-8 text-slate-700 mx-auto" />
                                <span className="text-[9px] text-slate-500 font-bold block">لا توجد صورة</span>
                              </div>
                            )}
                          </div>
                          
                          <label className="flex-grow w-full cursor-pointer bg-slate-950/40 border-2 border-dashed border-slate-800 hover:bg-slate-950 hover:border-slate-750 rounded-2xl p-6 text-center transition-all">
                            <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
                            <span className="text-xs font-bold text-slate-300 block">اضغط هنا أو اسحب صورة لرفعها</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5 font-medium">صيغ الصور المدعومة: PNG, JPG (الحد الأقصى: 1 ميجابايت)</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  if (file.size > 1024 * 1024) {
                                    toast.error('حجم الصورة كبير جداً! يرجى اختيار صورة أقل من 1 ميجابايت.');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setFormImage(reader.result); // Base64 string
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Scrap Settings Area */}
                      <div className="border-t border-slate-800 pt-4 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formUseScrap}
                            onChange={(e) => setFormUseScrap(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-5 h-5 bg-slate-950 border-slate-800 cursor-pointer"
                          />
                          <div>
                            <span className="text-sm font-bold text-slate-200 block">تفعيل حساب الهالك والفاقد في التكلفة</span>
                            <span className="text-[10px] text-slate-550 block">للمنتجات التي تُباع بالوزن أو تحتسب لها نسبة هالك صاج وتُباع خردة</span>
                          </div>
                        </label>

                        {formUseScrap && (
                          <div className="bg-slate-955 border border-slate-850 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200 text-right">
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex justify-between">
                                <span>نسبة الهالك (%)</span>
                                {formScrapPct && (
                                  <span className="text-[10px] text-indigo-400 font-mono">({((parseFloat(formScrapPct) || 0) / 100 * 1000).toFixed(0)} جرام / كجم)</span>
                                )}
                              </label>
                              <input
                                type="number"
                                value={formScrapPct}
                                onChange={(e) => setFormScrapPct(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white font-bold font-mono"
                                placeholder="مثال: 8"
                                step="0.01"
                                min="0"
                              />
                            </div>
                            
                            {(() => {
                              const mainMatId = formMaterials[0]?.materialId;
                              const mainMat = materials.find(m => m.id === mainMatId);
                              const autoPrice = mainMat ? mainMat.price : 0;
                              const matName = mainMat ? mainMat.name : 'لم يتم اختيار خامة بعد';
                              return (
                                <div>
                                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex justify-between">
                                    <span>سعر شراء الخام (تلقائي)</span>
                                    <span className="text-[9px] text-slate-500 truncate max-w-[120px]" title={matName}>({matName})</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={mainMat ? `${autoPrice} ج/كجم` : 'اختر خامة في BOM أولاً'}
                                    disabled
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 text-sm bg-slate-950/40 text-slate-500 font-bold font-mono text-center cursor-not-allowed"
                                  />
                                </div>
                              );
                            })()}

                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">سعر بيع الخردة (جنيه/كجم)</label>
                              <input
                                type="number"
                                value={formScrapSellingPrice}
                                onChange={(e) => setFormScrapSellingPrice(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white font-bold font-mono"
                                placeholder="مثال: 20"
                                step="0.01"
                                min="0"
                              />
                            </div>

                            {(() => {
                              const mainMatId = formMaterials[0]?.materialId;
                              const mainMat = materials.find(m => m.id === mainMatId);
                              const autoPrice = mainMat ? mainMat.price : 0;
                              const pct = parseFloat(formScrapPct) || 0;
                              const sellPrice = parseFloat(formScrapSellingPrice) || 0;
                              const scrapLossPerKg = (pct / 100) * (autoPrice - sellPrice);
                              
                              if (pct && autoPrice && sellPrice) {
                                return (
                                  <div className="sm:col-span-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-3 text-xs text-indigo-300 flex justify-between items-center">
                                    <span>
                                      💡 صافي تكلفة الهالك المضافة للكيلو: 
                                    </span>
                                    <span className="font-bold text-sm font-mono text-emerald-450">
                                      +{scrapLossPerKg.toFixed(2)} ج/كجم
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Status and Limits */}
                      <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex gap-4 items-center w-full sm:w-auto">
                          {['cat_galvanized', 'cat_black'].includes(formCategory) ? (
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">سعر البيع الفعلي للوحدة (جنيه)</label>
                              <input
                                type="number"
                                value={formSellingPrice}
                                onChange={(e) => setFormSellingPrice(parseFloat(e.target.value) || '')}
                                className="w-44 px-4 py-2.5 rounded-xl border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-955 text-white font-bold"
                                placeholder="سعر البيع المباشر"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">هامش الربح المطلوب (%)</label>
                              <input
                                type="number"
                                value={formMargin}
                                onChange={(e) => setFormMargin(parseFloat(e.target.value) || 0)}
                                className="w-36 px-4 py-2.5 rounded-xl border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-955 text-white font-bold"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5">الحد الأدنى لهامش الربح المطلوب (%)</label>
                            <input
                              type="number"
                              value={formMinMargin}
                              onChange={(e) => setFormMinMargin(parseFloat(e.target.value) || 0)}
                              className="w-36 px-4 py-2.5 rounded-xl border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-955 text-white font-bold"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formActive}
                            onChange={(e) => setFormActive(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-5 h-5 bg-slate-950 border-slate-800 cursor-pointer"
                          />
                          <div>
                            <span className="text-sm font-bold text-slate-200 block">تفعيل المنتج في عروض الأسعار</span>
                            <span className="text-[10px] text-slate-500 block">سوف يظهر للمندوبين عند إنشاء عروض أسعار جديدة</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {activeFormTab === 'materials' && (
                    <div className="space-y-4 animate-in fade-in duration-150 text-right">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-200">🧱 خامات ومكونات المنتج الأساسية</h4>
                          <p className="text-[10px] text-slate-500">حدد الخامات المطلوبة والكمية لكل وحدة إنتاج</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddMaterialRow}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 bg-indigo-950/30 px-3.5 py-2 rounded-xl border border-indigo-900/50 hover:bg-indigo-950/50 cursor-pointer transition-all"
                        >
                          <PlusCircle className="w-4 h-4" /> إضافة خامة جديدة
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                        {formMaterials.map((row, idx) => {
                          const mat = materials.find(m => m.id === row.materialId);
                          const totalCost = mat ? (parseFloat(row.qty) || 0) * mat.price : 0;
                          return (
                            <div key={idx} className="flex gap-2.5 items-center bg-slate-955 p-3 rounded-2xl border border-slate-850 hover:border-slate-800 transition-colors">
                              <select
                                value={row.materialId}
                                onChange={(e) => handleChangeMaterialRow(idx, 'materialId', e.target.value)}
                                className="flex-[2] px-3 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white font-semibold cursor-pointer"
                              >
                                <option value="" className="bg-slate-900 text-white">-- اختر الخامة --</option>
                                {materials.map(m => (
                                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">{m.name} ({m.price}ج/{m.unit})</option>
                                ))}
                              </select>
                              <div className="flex-[1] min-w-[75px]">
                                <input
                                  type="number"
                                  value={row.qty || ''}
                                  onChange={(e) => handleChangeMaterialRow(idx, 'qty', parseFloat(e.target.value) || 0)}
                                  className="w-full px-3 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white font-bold"
                                  placeholder="الكمية"
                                  min="0"
                                  step="0.001"
                                />
                              </div>
                              <span className="text-[10px] text-slate-500 font-bold flex-shrink-0 min-w-[30px] text-center">
                                {mat?.unit || 'وحدة'}
                              </span>
                              <input
                                type="text"
                                value={row.note || ''}
                                onChange={(e) => handleChangeMaterialRow(idx, 'note', e.target.value)}
                                className="flex-[1.5] px-3 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white"
                                placeholder="ملاحظة"
                              />
                              <div className="text-left font-bold text-xs text-slate-300 min-w-[75px] pl-1 font-mono">
                                {formatCurrency(totalCost)}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMaterialRow(idx)}
                                className="p-2 text-slate-500 hover:text-rose-450 hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-900/40"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                        {!formMaterials.length && (
                          <div className="text-center text-xs text-slate-500 py-12 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-950/20">
                            🧱 لا توجد مواد خام مرتبطة بهذا المنتج حالياً. اضغط على زر "إضافة خامة جديدة" بالأعلى لإدراج الخامات.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeFormTab === 'operations' && (
                    <div className="space-y-5 animate-in fade-in duration-150 text-right">
                      {/* Operation Costs & Routing */}
                      <div className="bg-slate-955 rounded-2xl p-4 border border-slate-850 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">⚙️ خطة العمليات التشغيلية (Routing)</h4>
                            <p className="text-[9px] text-slate-500">حدد تكلفة كل عملية صناعية منفصلة (مثل: طلاء، لحام، كبس)</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddOperationRow}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 bg-indigo-950/30 px-3 py-1.5 rounded-xl border border-indigo-900/50 hover:bg-indigo-950/50 cursor-pointer transition-all"
                          >
                            <PlusCircle className="w-4.5 h-4.5" /> إضافة عملية
                          </button>
                        </div>

                        <div className="space-y-2 max-h-[25vh] overflow-y-auto pr-1">
                          {formOperations.map((row, idx) => (
                            <div key={idx} className="flex gap-2.5 items-center">
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => handleChangeOperationRow(idx, 'name', e.target.value)}
                                className="flex-[2] px-3 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white font-semibold text-right"
                                placeholder="اسم العملية (مثال: لحام، تجميع)"
                              />
                              <input
                                type="number"
                                value={row.cost || ''}
                                onChange={(e) => handleChangeOperationRow(idx, 'cost', parseFloat(e.target.value) || 0)}
                                className="flex-[1] px-3 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white font-bold"
                                placeholder="التكلفة"
                                min="0"
                                step="0.01"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveOperationRow(idx)}
                                className="p-2 text-slate-500 hover:text-rose-455 hover:bg-rose-955/30 rounded-xl cursor-pointer transition-all border border-transparent hover:border-rose-900/40"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {!formOperations.length && (
                            <div className="text-center text-[11px] text-slate-500 py-4">لا توجد عمليات مخصصة مضافة.</div>
                          )}
                        </div>
                      </div>

                      {/* Operational Overheads */}
                      <div className="bg-slate-955 rounded-2xl p-4 border border-slate-850 space-y-4">
                        <h4 className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">👷 العمالة المباشرة والمصاريف غير المباشرة</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">تكلفة العمالة المباشرة (جنيه)</label>
                            <input
                              type="number"
                              value={formLabor || ''}
                              onChange={(e) => setFormLabor(parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white font-bold font-mono"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">مصاريف غير مباشرة ثابتة (F.O)</label>
                            <input
                              type="number"
                              value={formOverheadFixed || ''}
                              onChange={(e) => setFormOverheadFixed(parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white font-bold font-mono"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">مصاريف غير مباشرة متغيرة (V.O)</label>
                            <input
                              type="number"
                              value={formOverheadVar || ''}
                              onChange={(e) => setFormOverheadVar(parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950 text-white font-bold font-mono"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Factory costs and allocations for BEP calculation */}
                      {['cat_galvanized', 'cat_black'].includes(formCategory) && (
                        <div className="bg-gradient-to-br from-slate-955 to-indigo-955/40 rounded-3xl p-5 border border-slate-800 shadow-lg space-y-5 mt-4">
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-900/30">
                                <Calculator className="w-4 h-4 text-indigo-400" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white">مصاريف المصنع الشهرية</h4>
                                <p className="text-[10px] text-slate-500">لحساب نقطة التعادل ونصيب الكيلو</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                              <span className="text-[10px] text-slate-400 font-bold">حجم إنتاج التارجت:</span>
                              <input
                                type="number"
                                value={formProductionTons}
                                onChange={(e) => setFormProductionTons(parseFloat(e.target.value) || 0)}
                                className="w-16 bg-transparent text-emerald-400 font-black text-sm text-center focus:outline-none border-none focus:ring-0"
                              />
                              <span className="text-[10px] text-slate-400 font-bold">طن</span>
                            </div>
                          </div>

                          {/* Two column layout */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                            {/* Direct Costs Section */}
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-1.5 mb-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">التكاليف المباشرة</span>
                              </div>

                              {/* Table header */}
                              <div className="grid grid-cols-[1fr_5.5rem_3.5rem] gap-2 px-2 pb-1 border-b border-slate-800/80 text-[9px] font-bold text-slate-550 uppercase">
                                <span>البند</span>
                                <span className="text-left">القيمة (جنيه)</span>
                                <span className="text-center">تحميل %</span>
                              </div>

                              {/* Row: Direct Salaries */}
                              <div className="grid grid-cols-[1fr_5.5rem_3.5rem] gap-2 items-center bg-indigo-950/10 border border-indigo-900/30 rounded-xl px-3 py-2.5 hover:bg-indigo-950/20 hover:border-indigo-900/50 transition-all">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">👤</span>
                                  <div>
                                    <span className="text-[11px] font-bold text-white block">مرتبات مباشرة</span>
                                    <span className="text-[9px] text-slate-500">إجمالي رواتب العمال</span>
                                  </div>
                                </div>
                                <input
                                  type="number"
                                  value={formDirectSalaries}
                                  onChange={(e) => setFormDirectSalaries(parseFloat(e.target.value) || 0)}
                                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-right font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                                />
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    value={formDirectSalariesAlloc}
                                    onChange={(e) => setFormDirectSalariesAlloc(parseFloat(e.target.value) || 0)}
                                    className="bg-slate-950 border border-slate-850 rounded-lg px-1 py-1.5 text-xs text-center font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Indirect Costs Section */}
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-1.5 mb-2">
                                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">التكاليف غير المباشرة</span>
                              </div>

                              {/* Table header */}
                              <div className="grid grid-cols-[1fr_5.5rem_3.5rem] gap-2 px-2 pb-1 border-b border-slate-800/80 text-[9px] font-bold text-slate-550 uppercase">
                                <span>البند</span>
                                <span className="text-left">القيمة (جنيه)</span>
                                <span className="text-center">تحميل %</span>
                              </div>

                              {/* Row: Indirect Salaries */}
                              <div className="grid grid-cols-[1fr_5.5rem_3.5rem] gap-2 items-center bg-amber-950/10 border border-amber-900/30 rounded-xl px-3 py-2.5 hover:bg-amber-950/20 hover:border-amber-900/50 transition-all">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">👥</span>
                                  <div>
                                    <span className="text-[11px] font-bold text-white block">مرتبات غير مباشرة</span>
                                    <span className="text-[9px] text-slate-500">إداريين وإشراف</span>
                                  </div>
                                </div>
                                <input
                                  type="number"
                                  value={formIndirectSalaries}
                                  onChange={(e) => setFormIndirectSalaries(parseFloat(e.target.value) || 0)}
                                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-right font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                />
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    value={formIndirectSalariesAlloc}
                                    onChange={(e) => setFormIndirectSalariesAlloc(parseFloat(e.target.value) || 0)}
                                    className="bg-slate-950 border border-slate-850 rounded-lg px-1 py-1.5 text-xs text-center font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                  />
                                </div>
                              </div>

                              {/* Row: Rent */}
                              <div className="grid grid-cols-[1fr_5.5rem_3.5rem] gap-2 items-center bg-slate-900/40 border border-slate-850 rounded-xl px-3 py-2.5 hover:bg-slate-900/60 hover:border-slate-800 transition-all">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">🏭</span>
                                  <div>
                                    <span className="text-[11px] font-bold text-white block">إيجار المصنع</span>
                                    <span className="text-[9px] text-slate-500">شهرياً</span>
                                  </div>
                                </div>
                                <input
                                  type="number"
                                  value={formRent}
                                  onChange={(e) => setFormRent(parseFloat(e.target.value) || 0)}
                                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-right font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                />
                                <input
                                  type="number"
                                  value={formRentAlloc}
                                  onChange={(e) => setFormRentAlloc(parseFloat(e.target.value) || 0)}
                                  className="bg-slate-950 border border-slate-855 rounded-lg px-1 py-1.5 text-xs text-center font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                />
                              </div>

                              {/* Row: Electricity */}
                              <div className="grid grid-cols-[1fr_5.5rem_3.5rem] gap-2 items-center bg-slate-900/40 border border-slate-855 rounded-xl px-3 py-2.5 hover:bg-slate-900/60 hover:border-slate-800 transition-all">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">⚡</span>
                                  <div>
                                    <span className="text-[11px] font-bold text-white block">كهرباء</span>
                                    <span className="text-[9px] text-slate-500">شهرياً</span>
                                  </div>
                                </div>
                                <input
                                  type="number"
                                  value={formElectricity}
                                  onChange={(e) => setFormElectricity(parseFloat(e.target.value) || 0)}
                                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-right font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                />
                                <input
                                  type="number"
                                  value={formElectricityAlloc}
                                  onChange={(e) => setFormElectricityAlloc(parseFloat(e.target.value) || 0)}
                                  className="bg-slate-950 border border-slate-855 rounded-lg px-1 py-1.5 text-xs text-center font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                />
                              </div>

                              {/* Row: Water */}
                              <div className="grid grid-cols-[1fr_5.5rem_3.5rem] gap-2 items-center bg-slate-900/40 border border-slate-855 rounded-xl px-3 py-2.5 hover:bg-slate-900/60 hover:border-slate-800 transition-all">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">💧</span>
                                  <div>
                                    <span className="text-[11px] font-bold text-white block">مياه</span>
                                    <span className="text-[9px] text-slate-500">شهرياً</span>
                                  </div>
                                </div>
                                <input
                                  type="number"
                                  value={formWater}
                                  onChange={(e) => setFormWater(parseFloat(e.target.value) || 0)}
                                  className="bg-slate-955 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-right font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                />
                                <input
                                  type="number"
                                  value={formWaterAlloc}
                                  onChange={(e) => setFormWaterAlloc(parseFloat(e.target.value) || 0)}
                                  className="bg-slate-955 border border-slate-855 rounded-lg px-1 py-1.5 text-xs text-center font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                />
                              </div>

                              {/* Row: Tips */}
                              <div className="grid grid-cols-[1fr_5.5rem_3.5rem] gap-2 items-center bg-slate-900/40 border border-slate-855 rounded-xl px-3 py-2.5 hover:bg-slate-900/60 hover:border-slate-800 transition-all">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">🎁</span>
                                  <div>
                                    <span className="text-[11px] font-bold text-white block">إكراميات</span>
                                    <span className="text-[9px] text-slate-500">ونثريات شهرياً</span>
                                  </div>
                                </div>
                                <input
                                  type="number"
                                  value={formTips}
                                  onChange={(e) => setFormTips(parseFloat(e.target.value) || 0)}
                                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-right font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                />
                                <input
                                  type="number"
                                  value={formTipsAlloc}
                                  onChange={(e) => setFormTipsAlloc(parseFloat(e.target.value) || 0)}
                                  className="bg-slate-955 border border-slate-855 rounded-lg px-1 py-1.5 text-xs text-center font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Legend */}
                          <div className="flex items-center gap-4 text-[9px] text-slate-500 border-t border-slate-800/80 pt-3">
                            <span className="flex items-center gap-1"><span className="text-emerald-400 font-bold">%</span> نسبة التحميل على هذا المنتج</span>
                            <span className="flex items-center gap-1"><span className="text-indigo-400">÷</span> تُقسّم على التارجت بالطن × 1000 لنصيب الكيلو</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Left Side: Live Cost Simulator sticky panel (1 Column) */}
              <div className="lg:col-span-1">
                <div className="bg-slate-950 text-white rounded-3xl p-6 border border-slate-800/80 space-y-6 sticky top-0 shadow-2xl shadow-black/30">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-850 pb-2.5 flex items-center gap-2">
                      <BarChart className="w-4 h-4 text-indigo-400" /> محاكاة التكلفة الحية (Live Cost Engine)
                    </h4>
                  </div>

                  {/* Calculations Details */}
                  <div className="space-y-4 text-xs text-right">
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span className="font-mono">{formatCurrency(liveCalc.rawTotal)}</span>
                        <span>خامات ومواد خام:</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, liveCalc.totalCost > 0 ? (liveCalc.rawTotal / liveCalc.totalCost) * 100 : 0)}%` }}
                        ></div>
                      </div>
                    </div>

                    {formUseScrap && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span className="font-mono text-rose-400">+{formatCurrency(liveCalc.scrapCost)}</span>
                          <span>تكلفة الهالك والفاقد:</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-rose-600 to-rose-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, liveCalc.totalCost > 0 ? (liveCalc.scrapCost / liveCalc.totalCost) * 100 : 0)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span className="font-mono">{formatCurrency(liveCalc.laborCost)}</span>
                        <span className="flex items-center gap-1">
                          {['cat_galvanized', 'cat_black'].includes(formCategory) && (
                            <span className="text-[8px] bg-sky-955 text-sky-400 border border-sky-900/60 px-1.5 py-0.5 rounded-md font-bold">+ مرتبات</span>
                          )}
                          العمالة المباشرة:
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-sky-600 to-sky-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, liveCalc.totalCost > 0 ? (liveCalc.laborCost / liveCalc.totalCost) * 100 : 0)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span className="font-mono">{formatCurrency(liveCalc.opsTotal)}</span>
                        <span>عمليات التشغيل:</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, liveCalc.totalCost > 0 ? (liveCalc.opsTotal / liveCalc.totalCost) * 100 : 0)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span className="font-mono">{formatCurrency(liveCalc.overheadTotal)}</span>
                        <span className="flex items-center gap-1">
                          {['cat_galvanized', 'cat_black'].includes(formCategory) && (
                            <span className="text-[8px] bg-amber-955 text-amber-400 border border-amber-900/60 px-1.5 py-0.5 rounded-md font-bold">+ مصاريف مصنع</span>
                          )}
                          المصاريف الصناعية:
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, liveCalc.totalCost > 0 ? (liveCalc.overheadTotal / liveCalc.totalCost) * 100 : 0)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-850 my-2"></div>

                    <div className="flex justify-between font-bold text-slate-350 text-sm">
                      <span className="font-mono">{formatCurrency(liveCalc.totalCost)}</span>
                      <span>إجمالي تكلفة الإنتاج:</span>
                    </div>

                    <div className="h-px bg-slate-850 my-2"></div>

                    {['cat_galvanized', 'cat_black'].includes(formCategory) ? (
                      <div className="space-y-4">
                        {/* Direct Selling Price Input */}
                        <div className="space-y-1.5 bg-slate-900/50 p-4 rounded-2xl border border-slate-850 text-right">
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">سعر البيع الفعلي (جنيه)</label>
                          <input
                            type="number"
                            value={formSellingPrice}
                            onChange={(e) => setFormSellingPrice(parseFloat(e.target.value) || '')}
                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-left font-mono"
                            placeholder="أدخل سعر البيع للوحدة"
                          />
                        </div>

                        {/* Live BEP and Operating Profit stats */}
                        {(() => {
                          let liveWeightKg = 0;
                          formMaterials.forEach(item => {
                            const mat = materials.find(m => m.id === item.materialId);
                            if (mat && (mat.unit === 'كجم' || mat.id.includes('galv') || mat.id.includes('black') || mat.id.includes('fe'))) {
                              liveWeightKg += (parseFloat(item.qty) || 0);
                            }
                          });
                          if (liveWeightKg <= 0) liveWeightKg = formUnit === 'م²' ? 11 : 10;
                          const liveUnitsPerTon = 1000 / liveWeightKg;

                          const liveSellingPrice = parseFloat(formSellingPrice) || 0;
                          const liveSellingPricePerTon = liveSellingPrice * liveUnitsPerTon;

                          const liveAllocDirectSalaries = (parseFloat(formDirectSalaries) || 0) * ((parseFloat(formDirectSalariesAlloc) || 0) / 100);
                          const liveAllocIndirectSalaries = (parseFloat(formIndirectSalaries) || 0) * ((parseFloat(formIndirectSalariesAlloc) || 0) / 100);
                          const liveAllocRent = (parseFloat(formRent) || 0) * ((parseFloat(formRentAlloc) || 0) / 100);
                          const liveAllocElectricity = (parseFloat(formElectricity) || 0) * ((parseFloat(formElectricityAlloc) || 0) / 100);
                          const liveAllocWater = (parseFloat(formWater) || 0) * ((parseFloat(formWaterAlloc) || 0) / 100);
                          const liveAllocTips = (parseFloat(formTips) || 0) * ((parseFloat(formTipsAlloc) || 0) / 100);
                          const liveTotalFixedCosts = liveAllocDirectSalaries + liveAllocIndirectSalaries + liveAllocRent + liveAllocElectricity + liveAllocWater + liveAllocTips;

                          const liveRawCost = liveCalc.rawTotal || 0;
                          const liveOpsCost = liveCalc.opsTotal || 0;
                          const liveVarOverhead = parseFloat(formOverheadVar) || 0;
                          const liveVarCostPerUnit = liveRawCost + liveOpsCost + liveVarOverhead;
                          const liveVarCostPerTon = liveVarCostPerUnit * liveUnitsPerTon;

                          const liveCMPerTon = liveSellingPricePerTon - liveVarCostPerTon;
                          let liveBepTons = 0;
                          if (liveCMPerTon > 0) {
                            liveBepTons = liveTotalFixedCosts / liveCMPerTon;
                          }

                          const liveTargetTons = parseFloat(formProductionTons) || 30;
                          const liveRevenueAtTarget = liveSellingPricePerTon * liveTargetTons;
                          const liveCostAtTarget = liveTotalFixedCosts + (liveVarCostPerTon * liveTargetTons);
                          const liveProfitAtTarget = liveRevenueAtTarget - liveCostAtTarget;

                          return (
                            <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-850 text-right">
                              <div className="flex justify-between font-bold text-slate-350">
                                <span className={liveCMPerTon <= 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                                  {liveCMPerTon <= 0 ? 'مستحيلة (سعر منخفض)' : `${liveBepTons.toFixed(2)} طن`}
                                </span>
                                <span>نقطة التعادل:</span>
                              </div>
                              <div className="flex justify-between font-bold text-slate-350 border-t border-slate-850/50 pt-2.5">
                                <span className={liveProfitAtTarget >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-455'}>
                                  {formatCurrency(liveProfitAtTarget)}
                                </span>
                                <span>صافي أرباح التشغيل:</span>
                              </div>
                              <div className="text-[9px] text-slate-500 leading-normal text-right">
                                * محسوبة على طاقة إنتاجية {liveTargetTons} طن شهرياً.
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Margin interactive Slider */}
                        <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-850">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                            <div className="flex items-center gap-1 font-mono">
                              <span>%</span>
                              <input 
                                type="number"
                                value={formMargin}
                                onChange={(e) => setFormMargin(parseFloat(e.target.value) || 0)}
                                className="w-12 bg-slate-950 border border-slate-800 text-white rounded px-1.5 py-0.5 text-center text-xs font-bold focus:outline-none"
                                min="1"
                                max="99"
                              />
                            </div>
                            <span>هامش الربح المطلوب (%)</span>
                          </div>
                          <input 
                            type="range"
                            min="5"
                            max="80"
                            value={formMargin}
                            onChange={(e) => setFormMargin(parseInt(e.target.value))}
                            className="w-full accent-indigo-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                            <span>80% هامش</span>
                            <span>5% هامش</span>
                          </div>
                        </div>

                        <div className="flex justify-between text-slate-350">
                          <span className="font-bold text-emerald-400 font-mono">+{formatCurrency(liveCalc.finalPrice - liveCalc.totalCost)}</span>
                          <span>الربح المالي ({liveCalc.margin.toFixed(1)}%):</span>
                        </div>

                        <div className="h-px bg-slate-850 my-2"></div>

                        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-850 space-y-1 text-center bg-gradient-to-br from-slate-900 to-indigo-950/20">
                          <span className="text-[10px] text-slate-500 block font-bold">سعر البيع النهائي المقترح</span>
                          <span className="text-xl font-black text-emerald-400 block tracking-tight">
                            {formatCurrency(liveCalc.finalPrice)}
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">لكل وحدة قياس ({formUnit})</span>
                        </div>
                      </div>
                    )}

                    {liveCalc.marginWarning && !['cat_galvanized', 'cat_black'].includes(formCategory) && (
                      <div className="bg-rose-950/80 border border-rose-900 text-rose-300 p-3 rounded-xl text-[10px] flex gap-2 items-center animate-pulse">
                        <AlertTriangle className="w-4.5 h-4.5 text-rose-400 flex-shrink-0" />
                        <span>تنبيه: هامش الربح الحالي أقل من الحد الأدنى المقبول ({formMinMargin}%)!</span>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
              <div className="text-xs text-slate-400">
                آخر تحديث للعملية: {new Date().toLocaleDateString('ar-EG')}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> حفظ المنتج في الكتالوج
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
