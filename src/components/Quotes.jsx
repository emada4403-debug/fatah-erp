import React, { useState, useEffect } from 'react';
import { Search, Plus, Printer, Edit, Eye, RefreshCw, Trash2, X, PlusCircle, Calendar, AlertTriangle } from 'lucide-react';
import { DB } from '../db/db.js';
import { CostEngine } from '../db/costEngine.js';

export default function Quotes({ quotes, clients, products, settings, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(''); // '' means All
  const [viewingQuote, setViewingQuote] = useState(null); // quote object
  const [editingQuote, setEditingQuote] = useState(null); // quote object or { id: 'temp' }
  const [isAddMode, setIsAddMode] = useState(false);
  const [statusChangingQuote, setStatusChangingQuote] = useState(null); // quote object

  // Form States
  const [formNumber, setFormNumber] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formProjectName, setFormProjectName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formValidUntil, setFormValidUntil] = useState('');
  const [formPaymentTerms, setFormPaymentTerms] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDiscountPct, setFormDiscountPct] = useState(0);
  const [formItems, setFormItems] = useState([]); // [{ productId, note, qty, unitPrice, discountPct }]

  // Generate unique ID
  const genId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (settings.currency || 'جنيه');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: { label: 'مسودة', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
      sent: { label: 'مرسل', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      accepted: { label: 'مقبول', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      rejected: { label: 'مرفوض', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
      expired: { label: 'منتهي', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    };
    const item = map[status] || { label: 'غير محدد', cls: 'bg-slate-100 text-slate-600' };
    return (
      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${item.cls}`}>
        {item.label}
      </span>
    );
  };

  // Helper: auto generate quote number
  const genQuoteNumber = () => {
    const count = quotes.length + 1;
    const year = new Date().getFullYear();
    return `Q-${year}-${String(count).padStart(4, '0')}`;
  };

  // Helper: date add
  const dateAdd = (dateStr, days) => {
    const d = new Date(dateStr || new Date());
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const today = () => new Date().toISOString().split('T')[0];

  // Open Add Form
  const handleOpenAdd = () => {
    setIsAddMode(true);
    const num = genQuoteNumber();
    const dateToday = today();
    const validity = dateAdd(dateToday, parseInt(settings.quoteValidity) || 30);

    setFormNumber(num);
    setFormClientId('');
    setFormClientName('');
    setFormProjectName('');
    setFormDate(dateToday);
    setFormValidUntil(validity);
    setFormPaymentTerms(settings.paymentTerms || '');
    setFormNotes('');
    setFormDiscountPct(0);
    setFormItems([]);

    setEditingQuote({ id: 'temp' });
  };

  // Open Edit Form
  const handleOpenEdit = (q) => {
    setIsAddMode(false);
    setEditingQuote(q);

    setFormNumber(q.number || '');
    setFormClientId(q.clientId || '');
    setFormClientName(q.clientName || '');
    setFormProjectName(q.projectName || '');
    setFormDate(q.date ? q.date.split('T')[0] : '');
    setFormValidUntil(q.validUntil ? q.validUntil.split('T')[0] : '');
    setFormPaymentTerms(q.paymentTerms || '');
    setFormNotes(q.notes || '');
    setFormDiscountPct(q.discountPct || 0);

    // Map items
    setFormItems(q.items || []);
  };

  // Client selection in form
  const handleClientSelect = (clientId) => {
    const cli = clients.find(c => c.id === clientId);
    if (cli) {
      setFormClientId(cli.id);
      setFormClientName(cli.name);
    } else {
      setFormClientId('');
      setFormClientName('');
    }
  };

  // Item management in form
  const handleAddItemRow = () => {
    const activeProducts = products.filter(p => p.active !== false);
    if (!activeProducts.length) {
      alert('لا توجد منتجات نشطة لإضافتها');
      return;
    }
    const firstProd = activeProducts[0];
    const calc = CostEngine.calculate(firstProd);
    setFormItems([...formItems, {
      productId: firstProd.id,
      productName: firstProd.name,
      unitType: firstProd.unitType,
      qty: 1,
      unitPrice: calc ? calc.finalPrice : 0,
      discountPct: 0,
      note: ''
    }]);
  };

  const handleRemoveItemRow = (idx) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...formItems];
    if (field === 'productId') {
      const prod = products.find(p => p.id === val);
      if (prod) {
        const calc = CostEngine.calculate(prod);
        updated[idx].productId = prod.id;
        updated[idx].productName = prod.name;
        updated[idx].unitType = prod.unitType;
        updated[idx].unitPrice = calc ? calc.finalPrice : 0;
      }
    } else {
      updated[idx][field] = val;
    }
    setFormItems(updated);
  };

  // Calculate live quote totals
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
    const finalTotal = subtotal - quoteDiscountAmt;

    return {
      items: computedItems,
      subtotal,
      discountPct: parseFloat(formDiscountPct) || 0,
      discountAmt: quoteDiscountAmt,
      total: finalTotal
    };
  };

  const liveTotals = getLiveQuoteTotals();

  // Save Quote
  const handleSaveQuote = () => {
    if (!formClientName) {
      alert('يرجى اختيار عميل');
      return;
    }
    if (!formItems.length) {
      alert('يرجى إضافة منتج واحد على الأقل');
      return;
    }

    const totals = getLiveQuoteTotals();
    const data = {
      number: formNumber || genQuoteNumber(),
      clientId: formClientId,
      clientName: formClientName,
      projectName: formProjectName.trim(),
      date: formDate || today(),
      validUntil: formValidUntil || dateAdd(formDate, 30),
      paymentTerms: formPaymentTerms,
      notes: formNotes,
      items: totals.items,
      subtotal: totals.subtotal,
      discountPct: totals.discountPct,
      discountAmt: totals.discountAmt,
      total: totals.total,
    };

    if (isAddMode) {
      DB.insert('quotes', { ...data, status: 'draft' });
    } else {
      const prev = DB.getById('quotes', editingQuote.id);
      DB.update('quotes', editingQuote.id, { ...data, status: prev?.status || 'draft' });
    }

    onUpdate();
    setEditingQuote(null);
  };

  // Set Status
  const handleSetStatus = (status) => {
    DB.update('quotes', statusChangingQuote.id, { status });
    onUpdate();
    setStatusChangingQuote(null);
  };

  // Delete Quote
  const handleDeleteQuote = (q) => {
    if (window.confirm(`هل أنت متأكد من حذف عرض السعر "${q.number}"؟`)) {
      DB.delete('quotes', q.id);
      onUpdate();
    }
  };

  // Print Quote
  const handlePrint = (q) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = (q.items || []).map((item, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>
          <strong>${item.productName}</strong>
          ${item.note ? `<br><span style="color:#64748b;font-size:12px">${item.note}</span>` : ''}
        </td>
        <td style="text-align:center">${item.unitType || '-'}</td>
        <td style="text-align:center">${(item.qty || 0).toLocaleString('ar-EG')}</td>
        <td style="text-align:left">${(item.unitPrice || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه</td>
        <td style="text-align:center">${item.discountPct || 0}%</td>
        <td style="text-align:left"><strong>${(item.total || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه</strong></td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>عرض سعر ${q.number}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; padding: 20mm; color: #1a1a1a; background: white; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #6366f1; margin-bottom: 24px; }
          .company-name { font-size: 22px; font-weight: 900; color: #4f46e5; }
          .company-info { font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.6; }
          .doc-title { text-align: left; }
          .doc-title h2 { font-size: 20px; font-weight: 800; color: #1e293b; }
          .doc-number { font-size: 14px; color: #6366f1; font-weight: 700; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
          .meta-box h4 { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; }
          .meta-box p { font-size: 13px; color: #1e293b; font-weight: 600; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; }
          thead { background: #4f46e5; color: white; }
          th { padding: 10px 12px; text-align: right; font-weight: 700; font-size: 12px; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
          tbody tr:nth-child(even) { background: #f8fafc; }
          .totals { display: flex; justify-content: flex-start; margin-bottom: 24px; }
          .totals-box { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; min-width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; border-bottom: 1px solid #e2e8f0; }
          .total-row:last-child { border-bottom: none; padding-top: 10px; font-size: 16px; font-weight: 800; color: #4f46e5; }
          .terms-box { background: #f8fafc; border: 1px solid #e2e8f0; border-right: 4px solid #6366f1; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
          .terms-box h4 { font-size: 11px; font-weight: 700; color: #6366f1; margin-bottom: 6px; }
          .terms-box p { font-size: 13px; color: #475569; line-height: 1.6; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; padding-top: 16px; border-top: 1px solid #e2e8f0; margin-top: 24px; }
          .stamp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
          .stamp-box { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; min-height: 80px; }
          .stamp-box label { display: block; font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 8px; }
          @media print {
            body { padding: 15mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">${settings.name || 'مصنع الفتح'}</div>
            <div class="company-info">
              ${settings.address || ''}<br>
              📞 ${settings.phone || ''} | ✉️ ${settings.email || ''}<br>
              السجل الضريبي: ${settings.taxNo || ''}
            </div>
          </div>
          <div class="doc-title">
            <h2>عرض سعر</h2>
            <div class="doc-number">${q.number}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-box">
            <h4>العميل</h4>
            <p>${q.clientName}<br>
            ${q.projectName ? q.projectName : ''}</p>
          </div>
          <div class="meta-box">
            <h4>تفاصيل العرض</h4>
            <p>
              تاريخ الإصدار: ${formatDate(q.date)}<br>
              صالح حتى: ${formatDate(q.validUntil)}<br>
              ${q.paymentTerms ? 'شروط الدفع: ' + q.paymentTerms : ''}
            </p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:40px;text-align:center">#</th>
              <th>المنتج / الوصف</th>
              <th style="width:60px;text-align:center">الوحدة</th>
              <th style="width:70px;text-align:center">الكمية</th>
              <th style="width:100px;text-align:left">سعر الوحدة</th>
              <th style="width:60px;text-align:center">خصم%</th>
              <th style="width:110px;text-align:left">الإجمالي</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div class="totals">
          <div class="totals-box">
            <div class="total-row"><span>الإجمالي قبل الخصم</span><span>${(q.subtotal || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه</span></div>
            ${q.discountPct ? `<div class="total-row" style="color:#dc2626"><span>خصم إجمالي (${q.discountPct}%)</span><span>- ${(q.discountAmt || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه</span></div>` : ''}
            <div class="total-row"><span>الإجمالي النهائي</span><span>${(q.total || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه</span></div>
          </div>
        </div>

        ${q.notes ? `
        <div class="terms-box">
          <h4>ملاحظات</h4>
          <p>${q.notes}</p>
        </div>` : ''}

        ${q.paymentTerms ? `
        <div class="terms-box">
          <h4>شروط الدفع</h4>
          <p>${q.paymentTerms}</p>
        </div>` : ''}

        <div class="stamp-grid">
          <div class="stamp-box"><label>توقيع وختم المورد</label></div>
          <div class="stamp-box"><label>توقيع وختم العميل</label></div>
        </div>

        <div class="footer">
          تم إنشاء هذا العرض بواسطة نظام ${settings.name || 'مصنع الفتح'} | ${formatDate(new Date().toISOString())}
        </div>

        <script>window.onload = () => window.print();<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter quotes list
  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab ? q.status === activeTab : true;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">إدارة عروض الأسعار</h2>
          <p className="text-sm text-slate-500">إنشاء وتصميم عروض الأسعار وإصدار مستندات الطباعة للعملاء</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" /> إنشاء عرض سعر جديد
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-sm gap-2">
        <button
          onClick={() => setActiveTab('')}
          className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === '' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          كل العروض ({quotes.length})
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'draft' ? 'border-slate-600 text-slate-700' : 'border-transparent text-slate-500'
          }`}
        >
          مسودات ({quotes.filter(q => q.status === 'draft').length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'sent' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
          }`}
        >
          مرسلة ({quotes.filter(q => q.status === 'sent').length})
        </button>
        <button
          onClick={() => setActiveTab('accepted')}
          className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'accepted' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'
          }`}
        >
          مقبولة ({quotes.filter(q => q.status === 'accepted').length})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'rejected' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500'
          }`}
        >
          مرفوضة ({quotes.filter(q => q.status === 'rejected').length})
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'expired' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500'
          }`}
        >
          منتهية ({quotes.filter(q => q.status === 'expired').length})
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="relative w-full">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث برقم العرض أو اسم العميل أو المشروع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-slate-50/50"
          />
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-semibold">
                <th className="p-4">رقم العرض</th>
                <th className="p-4">العميل</th>
                <th className="p-4">اسم المشروع</th>
                <th className="p-4">الإجمالي النهائي</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">تاريخ الانتهاء</th>
                <th className="p-4">تاريخ الإنشاء</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredQuotes.length ? (
                filteredQuotes.map((q) => {
                  return (
                    <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-indigo-600">{q.number}</td>
                      <td className="p-4">{q.clientName}</td>
                      <td className="p-4 text-slate-500">{q.projectName || '-'}</td>
                      <td className="p-4 font-bold text-slate-900">{formatCurrency(q.total)}</td>
                      <td className="p-4">{getStatusBadge(q.status)}</td>
                      <td className="p-4 text-xs text-slate-500">{formatDate(q.validUntil)}</td>
                      <td className="p-4 text-xs text-slate-500">{formatDate(q.createdAt)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingQuote(q)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="عرض تفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(q)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(q)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                            title="طباعة"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setStatusChangingQuote(q)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="تغيير الحالة"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuote(q)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    لا توجد عروض أسعار مسجلة في هذا القسم حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Quote Invoice */}
      {viewingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg">عرض سعر: {viewingQuote.number}</h3>
                {getStatusBadge(viewingQuote.status)}
              </div>
              <button
                onClick={() => setViewingQuote(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-grow">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">معلومات العميل</h4>
                  <p className="font-bold text-slate-800">{viewingQuote.clientName}</p>
                  {viewingQuote.projectName && <p className="text-slate-500 mt-1">المشروع: {viewingQuote.projectName}</p>}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">التواريخ والشروط</h4>
                  <p className="text-slate-600">تاريخ الإصدار: {formatDate(viewingQuote.date)}</p>
                  <p className="text-slate-600 mt-1">صلاحية العرض: {formatDate(viewingQuote.validUntil)}</p>
                  {viewingQuote.paymentTerms && <p className="text-slate-500 mt-1">شروط الدفع: {viewingQuote.paymentTerms}</p>}
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="p-3">#</th>
                      <th className="p-3">المنتج</th>
                      <th className="p-3">الوحدة</th>
                      <th className="p-3">الكمية</th>
                      <th className="p-3">سعر الوحدة</th>
                      <th className="p-3">خصم البند</th>
                      <th className="p-3">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(viewingQuote.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/20">
                        <td className="p-3 text-slate-400">{idx + 1}</td>
                        <td className="p-3">
                          <span className="font-bold">{item.productName}</span>
                          {item.note && <p className="text-xs text-slate-400 mt-0.5">{item.note}</p>}
                        </td>
                        <td className="p-3 text-xs">{item.unitType}</td>
                        <td className="p-3 font-semibold">{(item.qty || 0).toLocaleString('ar-EG')}</td>
                        <td className="p-3">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-3 text-xs text-rose-600 font-bold">{item.discountPct || 0}%</td>
                        <td className="p-3 font-bold text-slate-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 items-start">
                <div className="flex-grow max-w-md">
                  {viewingQuote.notes && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-1">
                      <h5 className="font-bold text-slate-500">ملاحظات إضافية:</h5>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{viewingQuote.notes}</p>
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-width-[280px] w-full sm:w-auto space-y-2 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>الإجمالي قبل الخصم:</span>
                    <span>{formatCurrency(viewingQuote.subtotal)}</span>
                  </div>
                  {viewingQuote.discountPct > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>خصم إجمالي ({viewingQuote.discountPct}%):</span>
                      <span>-{formatCurrency(viewingQuote.discountAmt)}</span>
                    </div>
                  )}
                  <div className="h-px bg-slate-200 my-1"></div>
                  <div className="flex justify-between font-bold text-indigo-600 text-base">
                    <span>الإجمالي النهائي:</span>
                    <span>{formatCurrency(viewingQuote.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
              <button
                onClick={() => handlePrint(viewingQuote)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" /> طباعة الآن
              </button>
              <button
                onClick={() => setViewingQuote(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-semibold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Quote Form */}
      {editingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-lg">
                {isAddMode ? '📋 إنشاء عرض سعر جديد' : `✏️ تعديل عرض السعر: ${editingQuote.number}`}
              </h3>
              <button
                onClick={() => setEditingQuote(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto flex-grow">
              {/* Form Input Columns */}
              <div className="lg:col-span-2 space-y-6">
                {/* Meta details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4 text-sm">
                  <h4 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">بيانات العرض الأساسية</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">رقم عرض السعر</label>
                      <input
                        type="text"
                        value={formNumber}
                        onChange={(e) => setFormNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        placeholder="Q-YYYY-XXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">اختيار العميل</label>
                      <select
                        value={formClientId}
                        onChange={(e) => handleClientSelect(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold"
                      >
                        <option value="">-- اختر عميلاً من القائمة --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name} — {c.company || 'شخصي'}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">اسم المشروع</label>
                      <input
                        type="text"
                        value={formProjectName}
                        onChange={(e) => setFormProjectName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        placeholder="مثال: توريد شبكة التكييف المركزي"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">تاريخ الإصدار</label>
                        <input
                          type="date"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">صالح حتى</label>
                        <input
                          type="date"
                          value={formValidUntil}
                          onChange={(e) => setFormValidUntil(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Builder */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-sm font-bold text-slate-700">📦 بنود عرض السعر</h4>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" /> إضافة بند جديد
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded-xl border border-slate-150 relative">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-grow">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">المنتج</label>
                            <select
                              value={item.productId}
                              onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
                            >
                              {products.filter(p => p.active !== false).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">الكمية ({item.unitType})</label>
                            <input
                              type="number"
                              value={item.qty || ''}
                              onChange={(e) => handleItemChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              min="0"
                              step="0.001"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">سعر الوحدة (ج)</label>
                            <input
                              type="number"
                              value={item.unitPrice || ''}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">ملاحظات البند</label>
                            <input
                              type="text"
                              value={item.note || ''}
                              onChange={(e) => handleItemChange(idx, 'note', e.target.value)}
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="مواصفات خاصة بالبند"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">خصم البند (%)</label>
                            <input
                              type="number"
                              value={item.discountPct || ''}
                              onChange={(e) => handleItemChange(idx, 'discountPct', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div className="flex flex-col justify-end text-left sm:pr-4">
                            <span className="text-[10px] text-slate-400">الإجمالي:</span>
                            <span className="text-xs font-bold text-emerald-600">
                              {formatCurrency((item.qty || 0) * (item.unitPrice || 0) * (1 - (item.discountPct || 0) / 100))}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded self-end mb-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {!formItems.length && (
                      <div className="text-center text-xs text-slate-400 py-4">لا توجد بنود مضافة بعد. يرجى الضغط على "إضافة بند جديد".</div>
                    )}
                  </div>
                </div>

                {/* Additional Text Areas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <label className="block text-xs font-semibold text-slate-500">💳 شروط الدفع والتسليم</label>
                    <textarea
                      value={formPaymentTerms}
                      onChange={(e) => setFormPaymentTerms(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      rows="3"
                      placeholder="مثال: دفعة مقدمة 50% والباقي عند الاستلام..."
                    />
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <label className="block text-xs font-semibold text-slate-500">📝 ملاحظات إضافية ومواصفات عامة</label>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      rows="3"
                      placeholder="ملاحظات تظهر في أسفل مستند عرض السعر..."
                    />
                  </div>
                </div>
              </div>

              {/* Live Quotation Summary Bar */}
              <div className="space-y-6">
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 sticky top-0">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-2">🧮 الحساب المالي التلقائي (Invoice Engine)</h4>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>إجمالي البنود:</span>
                      <span>{formatCurrency(liveTotals.subtotal)}</span>
                    </div>

                    <div className="h-px bg-slate-800 my-2"></div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">الخصم الإضافي النهائي (%)</label>
                      <input
                        type="number"
                        value={formDiscountPct}
                        onChange={(e) => setFormDiscountPct(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none text-white font-bold"
                        min="0"
                        max="100"
                      />
                    </div>

                    {liveTotals.discountPct > 0 && (
                      <div className="flex justify-between text-rose-400 font-semibold">
                        <span>قيمة الخصم النهائي:</span>
                        <span>-{formatCurrency(liveTotals.discountAmt)}</span>
                      </div>
                    )}

                    <div className="h-px bg-slate-800 my-2"></div>
                    <div className="flex justify-between font-bold text-lg text-emerald-400">
                      <span>الإجمالي النهائي:</span>
                      <span>{formatCurrency(liveTotals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditingQuote(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-semibold transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveQuote}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                حفظ كمسودة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Change Status */}
      {statusChangingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">تغيير حالة عرض السعر</h3>
              <button
                onClick={() => setStatusChangingQuote(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-400">اختر الحالة الجديدة لعرض السعر <span className="font-bold text-slate-700">{statusChangingQuote.number}</span>:</p>
              <div className="grid grid-cols-1 gap-2">
                {['draft', 'sent', 'accepted', 'rejected', 'expired'].map((s) => {
                  const labels = { draft: 'مسودة', sent: 'مرسل', accepted: 'مقبول', rejected: 'مرفوض', expired: 'منتهي' };
                  return (
                    <button
                      key={s}
                      onClick={() => handleSetStatus(s)}
                      className={`flex items-center justify-between px-4 py-2.5 border rounded-xl text-xs font-semibold transition-colors ${
                        statusChangingQuote.status === s 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{labels[s]}</span>
                      {getStatusBadge(s)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
