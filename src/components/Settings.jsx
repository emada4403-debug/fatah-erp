import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Download, Upload, RefreshCw, Info, AlertTriangle, Cloud, Database, Copy, Check, ExternalLink, HelpCircle, Key } from 'lucide-react';
import { DB } from '../db/db.js';
import { toast } from './Toast.jsx';
import { confirmModal } from './ConfirmModal.jsx';
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from '../db/supabaseClient.js';

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

  // Supabase dynamic config state
  const [dbUrl, setDbUrl] = useState(supabaseUrl || '');
  const [dbKey, setDbKey] = useState(supabaseAnonKey || '');
  const [showSqlInstructions, setShowSqlInstructions] = useState(false);
  const [isSyncingToCloud, setIsSyncingToCloud] = useState(false);
  const [isSyncingFromCloud, setIsSyncingFromCloud] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

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
    toast.success('✅ تم حفظ الإعدادات بنجاح');
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
        toast.success('✅ تم استيراد البيانات الاحتياطية وتحديث النظام بنجاح');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        toast.error('❌ خطأ: تنسيق الملف غير متوافق أو يحتوي على أخطاء');
      }
    };
    reader.readAsText(file);
  };

  // Reset database backup
  const handleResetData = async () => {
    const confirmed = await confirmModal.show({
      title: 'إعادة تعيين النظام',
      message: 'تحذير: هل أنت متأكد من حذف كافة البيانات الحالية وإعادة تعيين النظام بالكامل؟ لا يمكن التراجع عن هذا الإجراء!'
    });
    if (confirmed) {
      const prefix = DB._prefix;
      Object.keys(localStorage)
        .filter(k => k.startsWith(prefix))
        .forEach(k => localStorage.removeItem(k));

      DB.seed();
      onUpdate();
      toast.success('🔄 تم إعادة تعيين قاعدة البيانات وتهيئة النظام بالبيانات الافتراضية');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  // Save Supabase credentials
  const handleSaveCloudConfig = () => {
    const trimmedUrl = dbUrl.trim();
    const trimmedKey = dbKey.trim();
    
    if (trimmedUrl && !trimmedUrl.startsWith('http')) {
      toast.error('❌ يرجى إدخال رابط صحيح لـ Supabase URL يبدأ بـ https://');
      return;
    }

    if ((trimmedUrl && !trimmedKey) || (!trimmedUrl && trimmedKey)) {
      toast.error('❌ يجب إدخال كلاً من الرابط ومفتاح الوصول معاً');
      return;
    }

    if (!trimmedUrl && !trimmedKey) {
      localStorage.removeItem('fatah_erp_supabase_url');
      localStorage.removeItem('fatah_erp_supabase_key');
      toast.success('🔌 تم إزالة إعدادات الربط السحابي والرجوع للوضع المحلي');
    } else {
      localStorage.setItem('fatah_erp_supabase_url', trimmedUrl);
      localStorage.setItem('fatah_erp_supabase_key', trimmedKey);
      toast.success('⚙️ تم حفظ إعدادات الاتصال السحابي بنجاح');
    }
    
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // Upload local data to Cloud
  const handleUploadToCloud = async () => {
    if (!isSupabaseConfigured) {
      toast.error('❌ يرجى تكوين وحفظ إعدادات الاتصال بالسحابة أولاً');
      return;
    }
    const confirmed = await confirmModal.show({
      title: 'رفع البيانات إلى السحابة',
      message: 'هل أنت متأكد من رفع كافة البيانات المحلية واستبدال/تحديث البيانات في جداول Supabase؟ يفضل تشغيل كود تهيئة الجداول في Supabase SQL Editor أولاً.'
    });
    if (!confirmed) return;

    setIsSyncingToCloud(true);
    const success = await DB.syncToCloud();
    setIsSyncingToCloud(false);

    if (success) {
      toast.success('🚀 تم رفع ومزامنة كافة البيانات المحلية إلى السحابة بنجاح');
    } else {
      toast.error('❌ فشل رفع البيانات. تأكد من تهيئة الجداول في قاعدة البيانات وإعطاء الصلاحيات اللازمة');
    }
  };

  // Download Cloud data to Local
  const handleDownloadFromCloud = async () => {
    if (!isSupabaseConfigured) {
      toast.error('❌ يرجى تكوين وحفظ إعدادات الاتصال بالسحابة أولاً');
      return;
    }
    const confirmed = await confirmModal.show({
      title: 'تحميل البيانات من السحابة',
      message: 'تحذير: سيتم سحب البيانات من السحابة واستبدال كافة البيانات المحلية الحالية في هذا المتصفح. هل تود الاستمرار؟'
    });
    if (!confirmed) return;

    setIsSyncingFromCloud(true);
    const success = await DB.syncFromCloud();
    setIsSyncingFromCloud(false);

    if (success) {
      toast.success('📥 تم تحميل ومزامنة البيانات من السحابية وتحديث النظام بنجاح');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      toast.error('❌ فشل تحميل البيانات من السحابة. تأكد من أن الجداول ممتلئة وصحة الصلاحيات');
    }
  };

  const sqlCode = `-- 1. إنشاء الجداول الثمانية لسيستم الفتح
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.raw_materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT,
    price NUMERIC,
    "lastUpdated" TIMESTAMPTZ DEFAULT NOW(),
    color TEXT,
    image TEXT,
    "isTaxInclusive" BOOLEAN DEFAULT FALSE,
    "taxRate" NUMERIC DEFAULT 14,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    "categoryId" TEXT,
    "unitType" TEXT,
    image TEXT,
    "minMarginPct" NUMERIC DEFAULT 0,
    "marginPct" NUMERIC DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    "priceOverride" NUMERIC,
    "sellingPrice" NUMERIC,
    "costEngine" JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    type TEXT,
    stage TEXT,
    notes TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    name TEXT,
    "nameEn" TEXT,
    address TEXT,
    "addressEn" TEXT,
    phone TEXT,
    email TEXT,
    "taxNo" TEXT,
    currency TEXT DEFAULT 'جنيه',
    "defaultMargin" NUMERIC DEFAULT 25,
    "minMargin" NUMERIC DEFAULT 15,
    "quoteValidity" INTEGER DEFAULT 30,
    "paymentTerms" TEXT,
    "monthlyTarget" NUMERIC DEFAULT 100000,
    "adminPin" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.price_history (
    id TEXT PRIMARY KEY,
    "materialId" TEXT,
    "oldPrice" NUMERIC,
    "newPrice" NUMERIC,
    "changedAt" TIMESTAMPTZ DEFAULT NOW(),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    "clientId" TEXT,
    value NUMERIC DEFAULT 0,
    stage TEXT,
    "followUpDate" TEXT,
    notes TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quotes (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL,
    "productType" TEXT,
    "clientId" TEXT,
    "clientName" TEXT,
    "clientContact" TEXT,
    "projectName" TEXT,
    date TEXT,
    "validUntil" TEXT,
    "paymentTerms" TEXT,
    "deliveryDays" TEXT,
    notes TEXT,
    items JSONB,
    accessories JSONB,
    workmanship JSONB,
    transformation JSONB,
    "accLocked" BOOLEAN DEFAULT FALSE,
    "suppLocked" BOOLEAN DEFAULT FALSE,
    subtotal NUMERIC DEFAULT 0,
    "discountPct" NUMERIC DEFAULT 0,
    "discountAmt" NUMERIC DEFAULT 0,
    "taxPct" NUMERIC DEFAULT 0,
    "taxAmt" NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. تفعيل سياسات الوصول العام (RLS Permissive Policies) للربط المباشر
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access raw_materials" ON public.raw_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access price_history" ON public.price_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access deals" ON public.deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access quotes" ON public.quotes FOR ALL USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    toast.success('📋 تم نسخ كود SQL بنجاح');
    setTimeout(() => setCopiedSql(false), 2000);
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

        {/* Database Operations & Cloud Sync */}
        <div className="space-y-6">
          {/* Local Database Operations */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4 text-sm">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" /> العمليات وقاعدة البيانات المحلية
            </h3>

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

          {/* Supabase Cloud Sync */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4 text-sm">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-500" /> المزامنة السحابية (Supabase)
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Supabase URL</label>
                <input
                  type="text"
                  value={dbUrl}
                  onChange={(e) => setDbUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30 text-left font-mono"
                  placeholder="https://your-project.supabase.co"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Supabase Anon Key</label>
                <input
                  type="password"
                  value={dbKey}
                  onChange={(e) => setDbKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30 text-left font-mono"
                  placeholder="eyJhbGciOiJIUzI1Ni..."
                />
              </div>

              <button
                onClick={handleSaveCloudConfig}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                <Key className="w-4 h-4" />
                <span>حفظ إعدادات الاتصال</span>
              </button>

              {isSupabaseConfigured && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 justify-center bg-emerald-50 py-1.5 rounded-lg">
                    ● الاتصال بالسحابة نشط ومفعّل
                  </span>
                  
                  <button
                    onClick={handleUploadToCloud}
                    disabled={isSyncingToCloud}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl transition-colors"
                  >
                    <span>{isSyncingToCloud ? 'جاري الرفع...' : 'رفع البيانات المحلية للسحابة'}</span>
                    <Upload className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleDownloadFromCloud}
                    disabled={isSyncingFromCloud}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-bold rounded-xl transition-colors"
                  >
                    <span>{isSyncingFromCloud ? 'جاري التحميل...' : 'تحميل البيانات من السحابة'}</span>
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => setShowSqlInstructions(!showSqlInstructions)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <HelpCircle className="w-4 h-4" />
                  {showSqlInstructions ? 'إخفاء تعليمات SQL تهيئة الجداول' : 'عرض تعليمات SQL تهيئة الجداول'}
                </button>

                {showSqlInstructions && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      انسخ هذا الكود وقم بتشغيله في قسم SQL Editor بموقع Supabase لتهيئة الجداول:
                    </p>
                    <div className="relative">
                      <pre className="w-full max-h-48 overflow-y-auto p-3 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono leading-normal dir-ltr text-left">
                        {sqlCode}
                      </pre>
                      <button
                        onClick={handleCopySql}
                        className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
                        title="نسخ كود SQL"
                      >
                        {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
