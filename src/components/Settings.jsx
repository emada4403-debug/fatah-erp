import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Download, Upload, RefreshCw, Info, AlertTriangle } from 'lucide-react';
import { DB } from '../db/db.js';

export default function Settings({ settings, onUpdate }) {
  const [name, setName] = useState(settings.name || '');
  const [nameEn, setNameEn] = useState(settings.nameEn || '');
  const [address, setAddress] = useState(settings.address || '');
  const [addressEn, setAddressEn] = useState(settings.addressEn || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [email, setEmail] = useState(settings.email || '');
  const [taxNo, setTaxNo] = useState(settings.taxNo || '');
  const [currency, setCurrency] = useState(settings.currency || 'جنيه');
  const [defaultMargin, setDefaultMargin] = useState(settings.defaultMargin || 25);
  const [minMargin, setMinMargin] = useState(settings.minMargin || 15);
  const [quoteValidity, setQuoteValidity] = useState(settings.quoteValidity || 30);
  const [paymentTerms, setPaymentTerms] = useState(settings.paymentTerms || '');
  const [monthlyTarget, setMonthlyTarget] = useState(settings.monthlyTarget || 100000);
  const [adminPin, setAdminPin] = useState(settings.adminPin || '');

  // Handle Save settings
  const handleSave = () => {
    const data = {
      name: name.trim(),
      nameEn: nameEn.trim(),
      address: address.trim(),
      addressEn: addressEn.trim(),
      phone: phone.trim(),
      email: email.trim(),
      taxNo: taxNo.trim(),
      currency: currency.trim() || 'جنيه',
      defaultMargin: parseFloat(defaultMargin) || 25,
      minMargin: parseFloat(minMargin) || 15,
      quoteValidity: parseInt(quoteValidity) || 30,
      paymentTerms: paymentTerms.trim(),
      monthlyTarget: parseFloat(monthlyTarget) || 100000,
      adminPin: adminPin.trim(),
    };

    const existing = DB.getAll('settings')[0];
    if (existing) {
      DB.update('settings', existing.id, data);
    } else {
      DB.insert('settings', { id: 'company', ...data });
    }

    onUpdate();
    alert('✅ تم حفظ الإعدادات بنجاح');
  };

  // Export database backup
  const handleExportData = () => {
    const tables = ['products', 'raw_materials', 'categories', 'quotes', 'clients', 'settings', 'price_history', 'deals'];
    const backupData = {};
    tables.forEach(t => {
      backupData[t] = DB.getAll(t);
    });

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fatah_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import database backup
  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        Object.entries(parsed).forEach(([table, records]) => {
          DB.save(table, records);
        });
        onUpdate();
        alert('✅ تم استيراد البيانات الاحتياطية وتحديث النظام بنجاح');
        window.location.reload();
      } catch (err) {
        alert('❌ خطأ: تنسيق الملف غير متوافق أو يحتوي على أخطاء');
      }
    };
    reader.readAsText(file);
  };

  // Reset database backup
  const handleResetData = () => {
    if (window.confirm('⚠️ تحذير: هل أنت متأكد من حذف كافة البيانات الحالية وإعادة تعيين النظام؟ لا يمكن التراجع عن هذا الإجراء!')) {
      const prefix = DB._prefix;
      Object.keys(localStorage)
        .filter(k => k.startsWith(prefix))
        .forEach(k => localStorage.removeItem(k));

      DB.seed();
      onUpdate();
      alert('🔄 تم إعادة تعيين قاعدة البيانات وتهيئة النظام بالبيانات الافتراضية');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">إعدادات النظام والشركة</h2>
        <p className="text-sm text-slate-500">تخصيص البيانات العامة للمصنع، شروط الدفع، والعمليات الاحتياطية لقاعدة البيانات</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4 text-sm">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Info className="w-5 h-5 text-indigo-500" /> معلومات الشركة الأساسية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">اسم المنشأة / المصنع (عربي)</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30"
                  placeholder="اسم مصنعك"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Factory Name (English) — يظهر في عروض الأسعار</label>
                <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30 text-left font-mono"
                  placeholder="Al-Fath Engineering Industries"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">السجل التجاري / الرقم الضريبي</label>
                <input
                  type="text"
                  value={taxNo}
                  onChange={(e) => setTaxNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30"
                  placeholder="123-456-789"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">العنوان والمقر (عربي)</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30"
                  placeholder="المنطقة الصناعية - مدينة العاشر من رمضان"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Address (English) — يظهر في عروض الأسعار</label>
                <input type="text" value={addressEn} onChange={(e) => setAddressEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30 text-left font-mono"
                  placeholder="Industrial Zone, 10th of Ramadan City, Egypt"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30 text-left font-mono"
                  placeholder="02xxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">البريد الإلكتروني للشركة</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30 text-left"
                  placeholder="contact@factory.com"
                />
              </div>
            </div>
          </div>

          {/* Pricing Preferences */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4 text-sm">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <SettingsIcon className="w-5 h-5 text-indigo-500" /> إعدادات عروض الأسعار والتسعير
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">العملة الافتراضية</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30"
                  placeholder="جنيه"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">هامش الربح الافتراضي (%)</label>
                <input
                  type="number"
                  value={defaultMargin}
                  onChange={(e) => setDefaultMargin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">الحد الأدنى للهامش (%)</label>
                <input
                  type="number"
                  value={minMargin}
                  onChange={(e) => setMinMargin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">مدة صلاحية العرض (بالأيام)</label>
                <input
                  type="number"
                  value={quoteValidity}
                  onChange={(e) => setQuoteValidity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">المستهدف البيعي الشهري (جنيه)</label>
                <input
                  type="number"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">شروط الدفع والتسليم الافتراضية</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30"
                  placeholder="مثال: الدفع عند الاستلام نقداً"
                />
              </div>
            </div>
          </div>

          {/* Security PIN settings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4 text-sm">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Save className="w-5 h-5 text-indigo-500" /> إعدادات أمان التكاليف وقفل الخصوصية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">رمز أمان المدير (Admin PIN)</label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30 font-bold"
                  placeholder="اتركه فارغاً لتعطيل القفل"
                  maxLength="8"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  عند تعيين رمز PIN، سيتم قفل تفاصيل تكلفة المنتجات وموديولات الإدارة (التسعير، التقارير، الإعدادات) تلقائياً.
                </span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-sm shadow-indigo-100"
            >
              <Save className="w-4 h-4" /> حفظ كافة الإعدادات
            </button>
          </div>
        </div>

        {/* Database Operations */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4 text-sm">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">💾 العمليات وقاعدة البيانات</h3>

            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors border border-slate-200"
              >
                <span>تصدير نسخة احتياطية</span>
                <Download className="w-4.5 h-4.5" />
              </button>

              <label className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors border border-slate-200 cursor-pointer">
                <span>استيراد نسخة احتياطية</span>
                <Upload className="w-4.5 h-4.5" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>

              <div className="h-px bg-slate-100 my-2"></div>

              <button
                onClick={handleResetData}
                className="w-full flex items-center justify-between px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-colors border border-rose-200"
              >
                <span>إعادة ضبط المصنع</span>
                <RefreshCw className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex gap-2 items-start mt-4 leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-bold">تنبيه أمان البيانات:</span> جميع بيانات هذا النظام يتم تخزينها بالكامل داخل متصفحك الحالي (`localStorage`). يوصى بشدة بتصدير نسخة احتياطية بشكل دوري لتفادي مسح البيانات عن طريق الخطأ أو عند حذف سجل المتصفح.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
