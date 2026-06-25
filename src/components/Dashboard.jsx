import React from 'react';
import { 
  Users, 
  Package, 
  DollarSign, 
  Clock, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  CheckSquare, 
  ChevronLeft, 
  Zap, 
  FileText, 
  UserPlus, 
  PlusCircle, 
  Database,
  Target,
  Activity,
  Award,
  AlertCircle,
  ArrowLeftRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { CostEngine } from '../db/costEngine.js';

export default function Dashboard({ 
  quotes, 
  clients, 
  products, 
  deals = [], 
  materials = [], 
  priceHistory = [], 
  settings = {}, 
  isAdmin,
  onViewDetails 
}) {

  // Helpers
  const todayStr = new Date().toISOString().split('T')[0];
  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ' + (settings.currency || 'جنيه');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = new Date() - new Date(dateStr);
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffHrs < 24) return `منذ ${diffHrs} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  // Math Calculations
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
  const acceptedVal = acceptedQuotes.reduce((sum, q) => sum + (q.total || 0), 0);
  const pendingCount = quotes.filter(q => q.status === 'sent').length;
  const draftCount = quotes.filter(q => q.status === 'draft').length;

  // 1. OPTION 1: Monthly Sales Target
  const monthlyTarget = parseFloat(settings.monthlyTarget) || 100000;
  const now = new Date();
  const currentMonthQuotes = acceptedQuotes.filter(q => {
    if (!q.createdAt) return false;
    const d = new Date(q.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const currentMonthSales = currentMonthQuotes.reduce((sum, q) => sum + (q.total || 0), 0);
  const targetPercent = Math.min(parseFloat(((currentMonthSales / monthlyTarget) * 100).toFixed(1)), 100);

  // 2. OPTION 4: Win-Rate Funnel Data (Deals)
  const wonDeals = deals.filter(d => d.stage === 'deal');
  const lostDeals = deals.filter(d => d.stage === 'lost');
  const openDeals = deals.filter(d => d.stage !== 'deal' && d.stage !== 'lost');

  const winRate = (wonDeals.length + lostDeals.length) > 0
    ? ((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100).toFixed(0)
    : '0';

  const dealDistributionData = [
    { name: 'صفقات ناجحة', value: wonDeals.length, color: '#10b981' },
    { name: 'صفقات خاسرة', value: lostDeals.length, color: '#ef4444' },
    { name: 'فرص جارية', value: openDeals.length, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  // 3. OPTION 5: Weekly Raw Material Volatility Tracker
  const getWeeklyVolatility = (mId, currentPrice) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const hist = priceHistory
      .filter(h => h.materialId === mId && new Date(h.changedAt) >= sevenDaysAgo)
      .sort((a,b) => new Date(a.changedAt) - new Date(b.changedAt)); // oldest first
    
    if (!hist.length) return 0;
    const oldestPrice = hist[0].oldPrice;
    return parseFloat((((currentPrice - oldestPrice) / oldestPrice) * 100).toFixed(1));
  };

  const materialsWithVolatility = materials.map(m => {
    const vol = getWeeklyVolatility(m.id, m.price);
    return { ...m, vol };
  });

  // 4. OPTION 3: Recent Activities Feed
  const getRecentActivities = () => {
    const activities = [];

    // Add quotes activities
    quotes.slice(-5).forEach(q => {
      activities.push({
        type: 'quote',
        title: 'عرض سعر جديد',
        desc: `تم إنشاء عرض السعر ${q.number} للعميل ${q.clientName} بقيمة ${formatCurrency(q.total)}`,
        date: q.createdAt,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-100'
      });
    });

    // Add price history changes
    priceHistory.slice(-5).forEach(h => {
      const mat = materials.find(m => m.id === h.materialId);
      const diff = h.newPrice - h.oldPrice;
      activities.push({
        type: 'price',
        title: 'تعديل أسعار خامات',
        desc: `تحديث سعر مادة ${mat ? mat.name : 'خام'} من ${h.oldPrice}ج إلى ${h.newPrice}ج (${diff >= 0 ? '+' : ''}${diff}ج)`,
        date: h.changedAt,
        color: diff >= 0 ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'
      });
    });

    // Add deals activities
    deals.filter(d => d.stage === 'deal').slice(-5).forEach(d => {
      activities.push({
        type: 'deal',
        title: 'إغلاق صفقة بنجاح 🎉',
        desc: `تم الفوز بصفقة "${d.title}" بقيمة ${formatCurrency(d.value)}`,
        date: d.createdAt,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
      });
    });

    // Sort by date descending
    return activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  };

  const recentActivities = getRecentActivities();

  // 5. Chart: Monthly Sales Volume
  const getChartData = () => {
    const monthlyData = {};
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' });
      monthlyData[label] = 0;
    }
    acceptedQuotes.forEach(q => {
      if (!q.createdAt) return;
      const qDate = new Date(q.createdAt);
      const label = qDate.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' });
      if (monthlyData[label] !== undefined) {
        monthlyData[label] += q.total || 0;
      }
    });
    return Object.entries(monthlyData).map(([name, sales]) => ({ name, sales }));
  };

  const salesChartData = getChartData();

  // 6. CRM due followups
  const dueFollowups = deals.filter(d => d.followUpDate && d.followUpDate.split('T')[0] <= todayStr);

  // 7. Margin warnings
  const marginWarnings = products.filter(p => p.active !== false).map(p => {
    const calc = CostEngine.calculate(p);
    return { name: p.name, margin: p.marginPct, minMargin: p.minMarginPct, warning: calc ? calc.marginWarning : false };
  }).filter(p => p.warning);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-slate-950/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

        <div className="space-y-2 relative z-10">
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-800 px-3 py-1 rounded-full">نظام الفتح الذكي ERP</span>
          <h2 className="text-2xl md:text-3xl font-black">{settings.name || 'مصنع الفتح للصناعات الهندسية'}</h2>
          <p className="text-sm text-slate-400">مرحباً بك مجدداً. إليك نظرة عامة شاملة على أداء الإنتاج، عروض الأسعار، وحالة المبيعات اليوم.</p>
        </div>

        <div className="flex gap-2 relative z-10 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-semibold block">إجمالي صفقات الأنابيب</span>
            <span className="text-sm font-extrabold text-indigo-400 mt-0.5 block">{formatCurrency(deals.reduce((sum, d) => sum + (d.value || 0), 0))}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold block">إجمالي المقبول</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900 block truncate">{formatCurrency(acceptedVal)}</span>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">من خلال {acceptedQuotes.length} عروض مقبولة</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold block">العملاء والشركات</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900 block">{clients.length} عميل</span>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">
              منهم {clients.filter(c => c.type === 'vip').length} VIP ⭐
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold block">المنتجات النشطة</span>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900 block">{products.length} product</span>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">
              {products.filter(p => p.active !== false).length} نشط حالياً
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold block">العروض المعلقة</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900 block">{pendingCount + draftCount} عرض</span>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">
              {pendingCount} مرسلة و {draftCount} مسودات
            </span>
          </div>
        </div>
      </div>

      {/* Row 1: Target Goal & Win Rate Side-by-Side with Sales Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Targets & Win Rates */}
        <div className="space-y-6 lg:col-span-1">
          {/* Sales Target Goal Card (Option 1) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4.5 h-4.5 text-indigo-500" /> هدف المبيعات الشهري
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">{formatDate(new Date())}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-sm font-semibold text-slate-400 block">المبيعات المحققة</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">{formatCurrency(currentMonthSales)}</span>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {targetPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${targetPercent}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-[10px] text-slate-400 pt-1 font-medium">
                <span>الهدف الشهري: {formatCurrency(monthlyTarget)}</span>
                <span>المتبقي: {formatCurrency(Math.max(monthlyTarget - currentMonthSales, 0))}</span>
              </div>
            </div>
          </div>

          {/* CRM Conversion Win-Rate Chart (Option 4) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4.5 h-4.5 text-emerald-500" /> نسبة نجاح الصفقات (Win-Rate)
              </h3>
              <span className="text-xs font-bold text-emerald-600">{winRate}% نسبة نجاح</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="w-24 h-24 relative flex-shrink-0">
                {dealDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dealDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={45}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {dealDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full rounded-full border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400">لا توجد صفقات</div>
                )}
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xs font-black text-slate-800">{wonDeals.length}</span>
                  <span className="text-[8px] text-slate-400 font-bold">رابحة</span>
                </div>
              </div>

              <div className="flex-grow space-y-1.5 text-[10px]">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="flex items-center gap-1 font-bold text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> صفقات رابحة
                  </span>
                  <span className="font-extrabold text-slate-900">{wonDeals.length}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="flex items-center gap-1 font-bold text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> صفقات خاسرة
                  </span>
                  <span className="font-extrabold text-slate-900">{lostDeals.length}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="flex items-center gap-1 font-bold text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> فرص بيع جارية
                  </span>
                  <span className="font-extrabold text-slate-900">{openDeals.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Area Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 lg:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">مبيعات الأشهر الأخيرة</h3>
            <p className="text-xs text-slate-400">حجم مبيعات عروض الأسعار المقبولة المكتملة شهرياً</p>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ direction: 'rtl', borderRadius: '12px' }} formatter={(val) => formatCurrency(val)} />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Quick Shortcuts Box */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">⚡ روابط الوصول والعمليات السريعة</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => onViewDetails('quotes')}
            className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-150 hover:border-indigo-200 rounded-xl transition-all text-right group cursor-pointer"
          >
            <div>
              <span className="text-slate-500 group-hover:text-indigo-600 font-bold text-xs block">عروض الأسعار</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">إنشاء عرض جديد</span>
            </div>
            <FileText className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </button>

          <button 
            onClick={() => onViewDetails('crm')}
            className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-150 hover:border-indigo-200 rounded-xl transition-all text-right group cursor-pointer"
          >
            <div>
              <span className="text-slate-500 group-hover:text-indigo-600 font-bold text-xs block">العملاء والصفقات</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">إضافة فرصة بيع</span>
            </div>
            <UserPlus className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </button>

          <button 
            onClick={() => onViewDetails('pricing')}
            className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-150 hover:border-indigo-200 rounded-xl transition-all text-right group cursor-pointer"
          >
            <div>
              <span className="text-slate-500 group-hover:text-indigo-600 font-bold text-xs block">تسعير المعادن</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">تحديث أسعار اليوم</span>
            </div>
            <PlusCircle className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </button>

          <button 
            onClick={() => onViewDetails('settings')}
            className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-150 hover:border-indigo-200 rounded-xl transition-all text-right group cursor-pointer"
          >
            <div>
              <span className="text-slate-500 group-hover:text-indigo-600 font-bold text-xs block">نسخ احتياطي</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">تصدير ملف backup</span>
            </div>
            <Database className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Row 2: Weekly Price Volatility, CRM Due Today & Margin Warnings */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
        
        {/* Weekly Price Volatility Tracker (Option 5) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-amber-500" /> تذبذب أسعار المعادن أسبوعياً
              </h3>
              <p className="text-[10px] text-slate-400">التغير المئوي للخامات آخر 7 أيام</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto space-y-2 pr-1">
            {materialsWithVolatility.length ? (
              materialsWithVolatility.map((m) => {
                const impactType = m.vol > 0 ? 'up' : m.vol < 0 ? 'down' : 'stable';
                return (
                  <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{m.name}</span>
                      <span className="text-[10px] text-slate-400">سعر اليوم: {formatCurrency(m.price)} / {m.unit}</span>
                    </div>
                    <div className="text-left font-bold text-xs">
                      {impactType === 'stable' ? (
                        <span className="text-slate-400 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded">مستقر</span>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded flex items-center gap-0.5 border ${
                          impactType === 'up' 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {impactType === 'up' ? '+' : ''}{m.vol}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-xs text-slate-400 py-6">لا توجد مواد خام مسجلة.</div>
            )}
          </div>
        </div>

        {/* Due Followups checklist */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-5 h-5 text-indigo-500" /> متابعات واتصالات اليوم
            </h3>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{dueFollowups.length} معلقة</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto space-y-2 pr-1">
            {dueFollowups.length ? (
              dueFollowups.map((d) => {
                const cli = clients.find(c => c.id === d.clientId);
                return (
                  <div key={d.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50/50 px-1 rounded-lg transition-colors cursor-pointer" onClick={() => onViewDetails('crm')}>
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">{d.title}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{cli ? cli.name : 'عميل غير محدد'}</span>
                    </div>
                    <div className="text-left flex flex-col items-end">
                      <span className="font-bold text-slate-700 text-xs">{formatCurrency(d.value)}</span>
                      <span className="text-[9px] font-semibold text-rose-600 mt-0.5">مستحق المتابعة</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-xs text-slate-400 py-10">
                ✅ لا توجد اتصالات أو متابعات معلقة ومستحقة اليوم.
              </div>
            )}
          </div>
        </div>

        {/* Low Profit Margin Alerts */}
        {isAdmin && (
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-rose-500" /> تنبيهات انخفاض هامش الربح
            </h3>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto space-y-2 pr-1">
              {marginWarnings.length ? (
                marginWarnings.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs" onClick={() => onViewDetails('products')}>
                    <div>
                      <span className="font-bold text-slate-800 block">{item.name}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">الحد الأدنى المقبول: {item.minMargin}%</span>
                    </div>
                    <div className="text-left bg-rose-50 text-rose-700 border border-rose-100 rounded-lg px-3 py-1 font-bold">
                      {item.margin}% ربح
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-emerald-600 bg-emerald-50/50 border border-emerald-100 p-8 rounded-xl flex flex-col items-center justify-center gap-2">
                  <Zap className="w-6 h-6 text-emerald-500" />
                  <span>ممتاز! كل المنتجات تحقق هامش ربح أعلى من الحد الأدنى.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Activities Timeline & Recent Quotes Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activities Timeline (Option 3) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-indigo-500" /> سجل النشاط الزمني الأخير
          </h3>

          <div className="space-y-4 relative pr-4 border-r border-slate-100 max-h-[350px] overflow-y-auto">
            {recentActivities.length ? (
              recentActivities.map((act, idx) => (
                <div key={idx} className="relative space-y-1">
                  {/* Timeline point */}
                  <span className="absolute -right-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-white ring-2 ring-indigo-500/20"></span>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{act.title}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{formatTimeAgo(act.date)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">{act.desc}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-slate-400 py-10">لا توجد أنشطة سابقة مسجلة.</div>
            )}
          </div>
        </div>

        {/* Recent Quotes Table */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">آخر عروض الأسعار المنشأة</h3>
              <p className="text-xs text-slate-400">تحديثات فورية لحالات عروض الأسعار الأخيرة</p>
            </div>
            <button
              onClick={() => onViewDetails('quotes')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-0.5"
            >
              إدارة العروض <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-semibold">
                  <th className="p-3">رقم العرض</th>
                  <th className="p-3">اسم العميل</th>
                  <th className="p-3">قيمة العرض</th>
                  <th className="p-3">حالة العرض</th>
                  <th className="p-3">تاريخ الإنشاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {quotes.slice(-5).reverse().map((q, idx) => {
                  const map = {
                    draft: { label: 'مسودة', cls: 'bg-slate-50 text-slate-600 border-slate-150' },
                    sent: { label: 'مرسل', cls: 'bg-blue-50 text-blue-700 border-blue-150' },
                    accepted: { label: 'مقبول', cls: 'bg-emerald-50 text-emerald-700 border-emerald-150' },
                    rejected: { label: 'مرفوض', cls: 'bg-rose-50 text-rose-700 border-rose-150' },
                    expired: { label: 'منتهي', cls: 'bg-amber-50 text-amber-700 border-amber-150' },
                  };
                  const badge = map[q.status] || { label: 'غير محدد', cls: 'bg-slate-50' };

                  return (
                    <tr key={idx} className="hover:bg-slate-50/30 animate-in fade-in duration-150">
                      <td className="p-3 font-bold text-indigo-600">{q.number}</td>
                      <td className="p-3">{q.clientName}</td>
                      <td className="p-3 font-bold text-slate-900">{formatCurrency(q.total)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{formatDate(q.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
