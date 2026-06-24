import React, { useState } from 'react';
import { 
  Plus, Search, Calendar, History, TrendingUp, TrendingDown, 
  ArrowLeftRight, Trash2, Edit3, X, Percent, Check, Upload, Image, ShieldCheck 
} from 'lucide-react';
import { DB } from '../db/db.js';
import { CostEngine } from '../db/costEngine.js';

export default function Pricing({ products, materials, priceHistory, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterialHistory, setSelectedMaterialHistory] = useState(null); // material object
  const [editingMaterial, setEditingMaterial] = useState(null); // null or material object
  const [isAddMaterialMode, setIsAddMaterialMode] = useState(false);

  // Form States for Add/Edit
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('كجم');
  const [formEnteredPrice, setFormEnteredPrice] = useState('');
  const [formIsTaxInclusive, setFormIsTaxInclusive] = useState(false);
  const [formTaxRate, setFormTaxRate] = useState(14);
  const [formImage, setFormImage] = useState('');

  const [bulkMarginValue, setBulkMarginValue] = useState('');

  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' جنيه';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Reset form
  const resetForm = () => {
    setFormName('');
    setFormUnit('كجم');
    setFormEnteredPrice('');
    setFormIsTaxInclusive(false);
    setFormTaxRate(14);
    setFormImage('');
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    resetForm();
    setIsAddMaterialMode(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (m) => {
    setEditingMaterial(m);
    setFormName(m.name || '');
    setFormUnit(m.unit || 'كجم');
    setFormIsTaxInclusive(m.isTaxInclusive || false);
    setFormTaxRate(m.taxRate !== undefined ? m.taxRate : 14);
    setFormImage(m.image || '');

    // If it was tax inclusive, the entered price is the tax inclusive price
    if (m.isTaxInclusive) {
      const taxRate = m.taxRate !== undefined ? m.taxRate : 14;
      const taxInclusivePrice = m.price * (1 + (taxRate / 100));
      setFormEnteredPrice(taxInclusivePrice.toFixed(2));
    } else {
      setFormEnteredPrice(m.price.toFixed(2));
    }
  };

  // Calculate live tax variables
  const getLiveTaxCalculation = () => {
    const entered = parseFloat(formEnteredPrice) || 0;
    const rate = parseFloat(formTaxRate) || 0;
    
    let netPrice = entered;
    let taxAmount = 0;
    let inclusivePrice = entered;

    if (formIsTaxInclusive) {
      netPrice = entered / (1 + (rate / 100));
      taxAmount = entered - netPrice;
    } else {
      // If entered price is net, we can calculate the inclusive price just for display
      inclusivePrice = entered * (1 + (rate / 100));
      taxAmount = inclusivePrice - entered;
    }

    return {
      netPrice,
      taxAmount,
      inclusivePrice
    };
  };

  const liveTax = getLiveTaxCalculation();

  // Save Add/Edit
  const handleSaveMaterial = () => {
    if (!formName.trim()) {
      alert('يرجى إدخال اسم المادة الخام');
      return;
    }
    const entered = parseFloat(formEnteredPrice);
    if (isNaN(entered) || entered <= 0) {
      alert('يرجى إدخال سعر صحيح');
      return;
    }

    const rate = parseFloat(formTaxRate) || 0;
    let netPrice = entered;
    if (formIsTaxInclusive) {
      netPrice = entered / (1 + (rate / 100));
    }

    const data = {
      name: formName.trim(),
      unit: formUnit,
      price: netPrice, // stored as pre-tax price for Cost Engine calculations
      image: formImage,
      isTaxInclusive: formIsTaxInclusive,
      taxRate: rate,
      lastUpdated: new Date().toISOString()
    };

    if (isAddMaterialMode) {
      DB.insert('raw_materials', data);
    } else {
      const oldPrice = editingMaterial.price;
      if (Math.abs(oldPrice - netPrice) > 0.01) {
        DB.logPriceChange(editingMaterial.id, oldPrice, netPrice);
      }
      DB.update('raw_materials', editingMaterial.id, data);
    }

    onUpdate();
    setIsAddMaterialMode(false);
    setEditingMaterial(null);
    resetForm();
  };

  // Delete Material
  const handleDeleteMaterial = (m) => {
    if (window.confirm(`هل أنت متأكد من حذف المادة الخام "${m.name}"؟`)) {
      DB.delete('raw_materials', m.id);
      onUpdate();
    }
  };

  // Bulk Margin Update
  const handleBulkMarginUpdate = () => {
    const val = parseFloat(bulkMarginValue);
    if (isNaN(val) || val < 0) {
      alert('يرجى إدخال قيمة صحيحة');
      return;
    }

    if (window.confirm(`هل أنت متأكد من تحديث هامش الربح لجميع المنتجات (${products.length} منتج) إلى ${val}%؟`)) {
      products.forEach(p => {
        DB.update('products', p.id, { marginPct: val });
      });
      onUpdate();
      setBulkMarginValue('');
      alert('تم تحديث هامش الربح لجميع المنتجات بنجاح');
    }
  };

  // Filter materials
  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">التسعير الديناميكي للمواد الخام</h2>
          <p className="text-sm text-slate-500">تحديث أسعار المعادن وإدارة الضرائب لتنعكس فورياً على تكلفة إنتاجك</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-5 h-5" /> إضافة مادة خام جديدة
        </button>
      </div>

      {/* Control Panel: Search & Bulk Margins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex items-center lg:col-span-2">
          <div className="relative w-full">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم المادة الخام..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-slate-50/50"
            />
          </div>
        </div>

        {/* Bulk Update Margin */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex gap-2 items-center">
          <div className="relative flex-grow">
            <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              placeholder="تحديث الهامش للكل..."
              value={bulkMarginValue}
              onChange={(e) => setBulkMarginValue(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-slate-50/50 font-semibold"
              min="0"
            />
          </div>
          <button
            onClick={handleBulkMarginUpdate}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap shadow-sm cursor-pointer"
          >
            تعديل الكل
          </button>
        </div>
      </div>

      {/* Materials Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.length ? (
          filteredMaterials.map((m) => {
            const hist = priceHistory.filter(h => h.materialId === m.id).sort((a,b) => new Date(b.changedAt) - new Date(a.changedAt));
            const prevPrice = hist.length > 0 ? hist[0].oldPrice : null;
            const changePct = prevPrice ? ((m.price - prevPrice) / prevPrice * 100).toFixed(1) : null;

            // Calculate the tax-inclusive price for display
            const taxRate = m.taxRate !== undefined ? m.taxRate : 14;
            const taxInclusivePrice = m.price * (1 + (taxRate / 100));
            const taxAmount = taxInclusivePrice - m.price;

            return (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-150/80 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
                {/* Material Header Layout (Split Image and Title) */}
                <div className="flex border-b border-slate-100 p-4 gap-4 items-center">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {m.image ? (
                      <img src={m.image} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Image className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">{m.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-650 font-bold">
                        لكل {m.unit}
                      </span>
                      {m.isTaxInclusive && (
                        <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                          شامل ضريبة {taxRate}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Information */}
                <div className="p-4 space-y-3 flex-grow bg-slate-50/20">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold">سعر التكلفة الفعلي (بدون ضريبة)</span>
                      <div className="text-xl font-black text-slate-900 mt-0.5">{formatCurrency(m.price)}</div>
                    </div>

                    {changePct !== null && (
                      <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded border ${
                        parseFloat(changePct) > 0 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : parseFloat(changePct) < 0 
                            ? 'bg-emerald-50 text-emerald-750 border-emerald-250' 
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {parseFloat(changePct) > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {parseFloat(changePct) > 0 ? '+' : ''}{changePct}%
                      </span>
                    )}
                  </div>

                  {/* Tax values display */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                    <div>
                      <span className="text-slate-400 block font-semibold">قيمة ضريبة القيمة المضافة</span>
                      <span className="font-bold text-slate-700">{formatCurrency(taxAmount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">السعر الإجمالي بالضريبة</span>
                      <span className="font-bold text-slate-700">{formatCurrency(taxInclusivePrice)}</span>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-450 font-mono mt-1 text-left">
                    آخر تحديث: {formatDate(m.lastUpdated)}
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="bg-slate-50/70 border-t border-slate-100 px-4 py-2.5 flex items-center justify-end gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="flex-grow bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 hover:border-slate-350 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer text-center"
                  >
                    ✏️ تعديل مادة خام
                  </button>
                  <button
                    onClick={() => setSelectedMaterialHistory(m)}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-250 rounded-xl transition-all cursor-pointer"
                    title="سجل التغييرات"
                  >
                    <History className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteMaterial(m)}
                    className="p-2 bg-white hover:bg-rose-50 border border-slate-250 hover:border-rose-200 rounded-xl transition-all cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-600" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
            لا توجد مواد خام مطابقة لعملية البحث
          </div>
        )}
      </div>

      {/* Impacted Products Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-150 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">تأثير التغييرات على المنتجات المتأثرة</h3>
          <p className="text-xs text-slate-405">قائمة تكاليف وهوامش المنتجات المتأثرة ديناميكياً بأسعار المواد الخام الحالية بدون حساب الضرائب</p>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-semibold">
                <th className="p-4">اسم المنتج</th>
                <th className="p-4">تكلفة الإنتاج الإجمالية (بدون ضريبة)</th>
                <th className="p-4">سعر البيع النهائي المقترح</th>
                <th className="p-4">هامش الربح الحالي</th>
                <th className="p-4">حالة الهامش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {products.length ? (
                products.map((p) => {
                  const calc = CostEngine.calculate(p);
                  if (!calc) return null;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 flex-shrink-0 flex items-center justify-center">
                            {p.image ? (
                              <img src={p.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4.5 h-4.5 text-slate-350" />
                            )}
                          </div>
                          <span className="font-bold text-slate-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-800">{formatCurrency(calc.totalCost)}</td>
                      <td className="p-4 font-bold text-emerald-600">{formatCurrency(calc.finalPrice)}</td>
                      <td className="p-4">
                        <span className={`font-semibold ${calc.marginWarning ? 'text-rose-600 font-bold' : 'text-emerald-650'}`}>
                          {p.marginPct}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded border ${
                          calc.marginWarning ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {calc.marginWarning ? '⚠️ هامش منخفض' : '✅ مقبول'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    لا توجد منتجات مسجلة لعرض بيانات التأثير
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit Material Form (Unified) */}
      {(isAddMaterialMode || editingMaterial) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-base">
                {isAddMaterialMode ? '➕ إضافة مادة خام جديدة' : `✏️ تعديل مادة خام: ${editingMaterial.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsAddMaterialMode(false);
                  setEditingMaterial(null);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* Basic Details */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">اسم المادة الخام</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="مثال: صاج مجلفن"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">وحدة القياس</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
                  >
                    <option value="كجم">كجم (وزن)</option>
                    <option value="متر">متر (طول)</option>
                    <option value="م²">م² (مساحة)</option>
                    <option value="طن">طن</option>
                    <option value="حتة">حتة (وحدة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">سعر الإدخال (جنيه)</label>
                  <input
                    type="number"
                    value={formEnteredPrice}
                    onChange={(e) => setFormEnteredPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Tax Stripping Checkbox & Configuration */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsTaxInclusive}
                    onChange={(e) => setFormIsTaxInclusive(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">السعر المدخل شامل ضريبة القيمة المضافة (VAT)</span>
                    <span className="text-[9px] text-slate-400 block">سيقوم النظام بنزع قيمة الضريبة لحساب التكلفة الفعلية</span>
                  </div>
                </label>

                {formIsTaxInclusive && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 items-center animate-in slide-in-from-top-1 duration-150">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">نسبة ضريبة القيمة المضافة (%)</label>
                      <input
                        type="number"
                        value={formTaxRate}
                        onChange={(e) => setFormTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-bold"
                        min="0"
                        max="100"
                      />
                    </div>
                    {/* Live tax calculations */}
                    <div className="space-y-1.5 pt-1 text-[10px]">
                      <div className="flex justify-between text-slate-500">
                        <span>الضريبة المنتزعة:</span>
                        <span className="font-semibold text-rose-600">-{formatCurrency(liveTax.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-800 font-bold border-t border-slate-150 pt-1">
                        <span>سعر التكلفة الصافي:</span>
                        <span className="text-indigo-600">{formatCurrency(liveTax.netPrice)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Material Image Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500">صورة المادة الخام</label>
                <div className="flex gap-4 items-center">
                  <div className="relative w-20 h-20 bg-slate-50 border border-dashed border-slate-200 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                    {formImage ? (
                      <>
                        <img src={formImage} className="w-full h-full object-cover" alt="" />
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-black/85 text-white p-0.5 rounded-full"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <Image className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <label className="flex-grow cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl border-dashed text-center transition-colors">
                    <span>📸 اختر صورة للمادة الخام</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormImage(reader.result); // Base64
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAddMaterialMode(false);
                  setEditingMaterial(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-slate-250 hover:bg-slate-350 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveMaterial}
                className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-150 flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" /> حفظ المادة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Price History */}
      {selectedMaterialHistory && (() => {
        const hist = priceHistory.filter(h => h.materialId === selectedMaterialHistory.id)
          .sort((a,b) => new Date(b.changedAt) - new Date(a.changedAt));
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <h3 className="font-bold text-base">📊 سجل تغييرات أسعار: {selectedMaterialHistory.name}</h3>
                <button
                  onClick={() => setSelectedMaterialHistory(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {hist.length ? (
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-right border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold">
                          <th className="p-3">تاريخ التعديل</th>
                          <th className="p-3">السعر السابق</th>
                          <th className="p-3">السعر الجديد (صافي)</th>
                          <th className="p-3">التغيير (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {hist.map((h, i) => {
                          const diff = h.newPrice - h.oldPrice;
                          const pct = ((diff / h.oldPrice) * 100).toFixed(1);
                          return (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="p-3 text-xs text-slate-500 font-mono">{formatDate(h.changedAt)}</td>
                              <td className="p-3">{formatCurrency(h.oldPrice)}</td>
                              <td className="p-3 font-bold text-slate-900">{formatCurrency(h.newPrice)}</td>
                              <td className={`p-3 font-bold ${diff >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {diff >= 0 ? '↑' : '↓'} {Math.abs(pct)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    لا توجد تعديلات سابقة مسجلة لهذه المادة الخام.
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100 text-left">
                <button
                  onClick={() => setSelectedMaterialHistory(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-semibold transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
