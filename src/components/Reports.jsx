import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, Award, DollarSign, Users, CheckCircle, Percent } from 'lucide-react';
import { CostEngine } from '../db/costEngine.js';
import { DB } from '../db/db.js';

export default function Reports({ quotes, clients, products, deals, materials, priceHistory, settings }) {
  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ' + (settings.currency || 'جنيه');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // 1. Summary Numbers
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
  const acceptedVal = acceptedQuotes.reduce((sum, q) => sum + (q.total || 0), 0);
  const convRate = quotes.length > 0 ? ((acceptedQuotes.length / quotes.length) * 100).toFixed(1) : '0';
  const pipelineVal = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const closedDealsCount = deals.filter(d => d.stage === 'deal').length;

  // 2. Chart data: Quotes status
  const statuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
  const statusLabels = { draft: 'مسودة', sent: 'مرسل', accepted: 'مقبول', rejected: 'مرفوض', expired: 'منتهي' };
  const statusColors = { draft: '#64748b', sent: '#3b82f6', accepted: '#10b981', rejected: '#ef4444', expired: '#f59e0b' };

  const quoteStatusData = statuses.map(s => ({
    name: statusLabels[s],
    count: quotes.filter(q => q.status === s).length,
    value: quotes.filter(q => q.status === s).reduce((sum, q) => sum + (q.total || 0), 0),
    color: statusColors[s]
  })).filter(item => item.count > 0);

  // 3. Top selling products
  const productCount = {};
  const productRevenue = {};
  quotes.forEach(q => {
    (q.items || []).forEach(item => {
      if (!item.productId) return;
      productCount[item.productId] = (productCount[item.productId] || 0) + (item.qty || 0);
      productRevenue[item.productId] = (productRevenue[item.productId] || 0) + (item.total || 0);
    });
  });

  const topProductsList = Object.entries(productCount)
    .map(([pid, qty]) => {
      const prod = products.find(p => p.id === pid);
      return {
        id: pid,
        name: prod ? prod.name : 'منتج غير محدد',
        qty,
        revenue: productRevenue[pid] || 0
      };
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxQty = topProductsList.length > 0 ? topProductsList[0].qty : 1;

  // 4. Margins breakdown
  const marginProducts = products.map(p => {
    const calc = CostEngine.calculate(p);
    return {
      name: p.name,
      code: p.code || '',
      totalCost: calc ? calc.totalCost : 0,
      finalPrice: calc ? calc.finalPrice : 0,
      marginPct: p.marginPct,
      minMarginPct: p.minMarginPct,
      warning: calc ? calc.marginWarning : false
    };
  });

  // 5. Client values
  const clientStatsList = clients.map(c => {
    const cQuotes = quotes.filter(q => q.clientId === c.id);
    const cDeals = deals.filter(d => d.clientId === c.id && d.stage === 'deal');
    const totalVal = cDeals.reduce((sum, d) => sum + (d.value || 0), 0) +
                     cQuotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + (q.total || 0), 0);
    return {
      name: c.name,
      company: c.company || 'فردي',
      type: c.type,
      quotesCount: cQuotes.length,
      dealsCount: cDeals.length,
      totalVal
    };
  }).sort((a,b) => b.totalVal - a.totalVal).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 text-center">
          <span className="text-slate-400 text-xs font-semibold block">إجمالي عروض الأسعار</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{quotes.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 text-center">
          <span className="text-slate-400 text-xs font-semibold block">قيمة المقبول</span>
          <span className="text-sm font-black text-emerald-600 mt-1 block truncate">{formatCurrency(acceptedVal)}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 text-center">
          <span className="text-slate-400 text-xs font-semibold block">معدل تحويل العروض</span>
          <span className="text-xl font-black text-indigo-600 mt-1 block">{convRate}%</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 text-center">
          <span className="text-slate-400 text-xs font-semibold block">خط المبيعات (Pipeline)</span>
          <span className="text-sm font-black text-slate-900 mt-1 block truncate">{formatCurrency(pipelineVal)}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 text-center">
          <span className="text-slate-400 text-xs font-semibold block">إجمالي العملاء</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{clients.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 text-center">
          <span className="text-slate-400 text-xs font-semibold block">الصفقات المغلقة</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{closedDealsCount}</span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quote Status Bar Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">توزيع العروض حسب الحالة</h3>
          {quoteStatusData.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quoteStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ direction: 'rtl', borderRadius: '12px', border: '1px solid #f1f5f9' }}
                    formatter={(value, name) => [value, name === 'count' ? 'العدد' : 'القيمة']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={35}>
                    {quoteStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              لا توجد عروض أسعار مسجلة
            </div>
          )}
        </div>

        {/* Financial Pie Chart (Revenues Shares) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">مشاركة الإيرادات المالية</h3>
          {quoteStatusData.length ? (
            <div className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quoteStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {quoteStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ direction: 'rtl' }} formatter={(val) => formatCurrency(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-2 text-xs">
                {quoteStatusData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="flex items-center gap-1.5 font-bold text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                      {item.name}
                    </span>
                    <span className="font-semibold text-slate-900">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              لا توجد عروض أسعار مسجلة
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Top Selling & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">أكثر المنتجات طلباً</h3>
            <p className="text-xs text-slate-400">المنتجات الأكثر مبيعاً طبقاً للكميات المسجلة في العروض</p>
          </div>

          <div className="space-y-4">
            {topProductsList.length ? (
              topProductsList.map((item, idx) => {
                const pct = ((item.qty / maxQty) * 100).toFixed(0);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">{item.name}</span>
                      <span className="text-slate-500">{item.qty} وحدة — <strong className="text-emerald-600">{formatCurrency(item.revenue)}</strong></span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">
                لا توجد مبيعات مسجلة حتى الآن
              </div>
            )}
          </div>
        </div>

        {/* Top Clients by Value */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">أبرز العملاء مبيعات</h3>
            <p className="text-xs text-slate-400">العملاء ذوي القيمة المالية الأعلى من عروض المبيعات المقبولة والصفقات</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="p-3">العميل</th>
                  <th className="p-3">الشركة</th>
                  <th className="p-3">العروض</th>
                  <th className="p-3">الصفقات</th>
                  <th className="p-3">إجمالي القيمة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {clientStatsList.length ? (
                  clientStatsList.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">{c.name}</td>
                      <td className="p-3 text-slate-500">{c.company}</td>
                      <td className="p-3 font-semibold">{c.quotesCount}</td>
                      <td className="p-3 font-semibold">{c.dealsCount}</td>
                      <td className="p-3 font-bold text-emerald-600">{formatCurrency(c.totalVal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="p-4 text-center text-slate-400">لا توجد إحصائيات للعملاء.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Margins Analysis */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">تحليل هامش الربح بالمنتج</h3>
          <p className="text-xs text-slate-400">مقارنة التكلفة الانتاجية وسعر البيع وهوامش الربح مع تنبيه الهامش المنخفض</p>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                <th className="p-4">المنتج</th>
                <th className="p-4">كود المنتج</th>
                <th className="p-4">تكلفة الإنتاج</th>
                <th className="p-4">سعر البيع المقترح</th>
                <th className="p-4">هامش الربح</th>
                <th className="p-4">الحد الأدنى</th>
                <th className="p-4">التنبيه</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {marginProducts.length ? (
                marginProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{p.name}</td>
                    <td className="p-4 font-mono text-slate-400">{p.code || '-'}</td>
                    <td className="p-4 font-medium">{formatCurrency(p.totalCost)}</td>
                    <td className="p-4 font-bold text-emerald-600">{formatCurrency(p.finalPrice)}</td>
                    <td className="p-4">
                      <span className={`font-semibold ${p.warning ? 'text-rose-600 font-bold' : 'text-emerald-600'}`}>{p.marginPct}%</span>
                    </td>
                    <td className="p-4 text-slate-400">{p.minMarginPct}%</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-semibold border ${
                        p.warning ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {p.warning ? '⚠️ منخفض' : '✅ مقبول'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="p-4 text-center text-slate-400">لا توجد منتجات مسجلة.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
