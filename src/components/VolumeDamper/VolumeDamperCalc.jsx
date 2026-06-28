import React, { useState, useEffect } from 'react';
import { useDamperCalc } from './useDamperCalc';
import { damperStorage } from './damperStorage';
import { 
  Calculator, 
  Save, 
  Settings2, 
  Scale, 
  Layers, 
  Wrench, 
  TrendingUp, 
  AlertTriangle,
  Info,
  Sliders,
  DollarSign
} from 'lucide-react';
import { toast } from '../Toast.jsx';

export default function VolumeDamperCalc() {
  // Dimension state
  const [width, setWidth] = useState('60');
  const [height, setHeight] = useState('50');
  const [unit, setUnit] = useState('cm');

  // Config state (pre-filled from localStorage or default)
  const [config, setConfig] = useState({
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
  });

  // Load config on mount
  useEffect(() => {
    const saved = damperStorage.load();
    setConfig(saved);
  }, []);

  // Update specific config item
  const handleConfigChange = (key, value) => {
    const numVal = value === '' ? '' : parseFloat(value);
    setConfig(prev => ({
      ...prev,
      [key]: numVal
    }));
  };

  // Save current prices/weights as default
  const handleSaveDefaults = () => {
    // Validate inputs are positive numbers before saving
    const invalidKeys = Object.entries(config).filter(([_, val]) => val === '' || isNaN(val) || val < 0);
    if (invalidKeys.length > 0) {
      toast.error('❌ يرجى إدخال قيم صالحة وموجبة لجميع الأوزان والأسعار قبل الحفظ.');
      return;
    }

    const success = damperStorage.save(config);
    if (success) {
      toast.success('💾 تم حفظ الأوزان والأسعار الافتراضية بنجاح.');
    } else {
      toast.error('❌ حدث خطأ أثناء حفظ الإعدادات الافتراضية.');
    }
  };

  // Dynamic calculations
  const calc = useDamperCalc({
    width,
    height,
    unit,
    config
  });

  // Dimension display texts for info
  const dimensionInfoText = () => {
    if (!width || !height) return '';
    return `أبعاد التصنيع الفعلية: ${calc.width_cm.toFixed(1)} × ${calc.height_cm.toFixed(1)} سم | ${(calc.width_inch).toFixed(2)} × ${(calc.height_inch).toFixed(2)} بوصة`;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-[#03273e] to-[#043352] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#86d1ed]/20 p-3 rounded-xl border border-[#86d1ed]/30">
            <Calculator className="w-8 h-8 text-[#86d1ed]" />
          </div>
          <div>
            <h2 className="text-xl font-black">حاسبة تكاليف الدمبر الحجمي (Volume Damper)</h2>
            <p className="text-xs text-slate-300 font-semibold mt-1">حساب أوزان وتكاليف تصنيع الدمبر بناءً على المقاسات الفعلية للعميل مع تحديث فوري للتسعير</p>
          </div>
        </div>
        
        {/* Save Default configuration */}
        <button
          onClick={handleSaveDefaults}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#86d1ed] hover:bg-[#6ec2e2] text-[#02273b] hover:scale-[1.02] text-xs font-black rounded-xl shadow-md transition-all cursor-pointer self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>حفظ كإعدادات افتراضية</span>
        </button>
      </div>

      {/* Main Grid: Inputs on right/left, Results & Breakdown on opposite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Inputs Column */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dimensions Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-5 h-5 text-[#006780]" />
              <h3 className="font-bold text-sm text-slate-800">أبعاد العميل المطلوبة</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Width Input */}
              <div className="col-span-1 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">العرض</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full text-center px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006780] font-bold text-base text-slate-800"
                  placeholder="0"
                  min="0"
                  step="any"
                />
              </div>

              {/* Height Input */}
              <div className="col-span-1 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">الارتفاع</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full text-center px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006780] font-bold text-base text-slate-800"
                  placeholder="0"
                  min="0"
                  step="any"
                />
              </div>

              {/* Unit Selector */}
              <div className="col-span-1 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">الوحدة</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-center px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006780] font-bold text-xs text-slate-800"
                >
                  <option value="cm">سم (cm)</option>
                  <option value="mm">مليمتر (mm)</option>
                  <option value="inch">بوصة (inch)</option>
                </select>
              </div>
            </div>

            {/* Live Dimension Alert and Translation */}
            {width && height && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-2 text-[11px] text-slate-500 font-semibold leading-relaxed">
                <Info className="w-4 h-4 text-[#006780] shrink-0" />
                <span>{dimensionInfoText()}</span>
              </div>
            )}

            {/* Warning Badge when width > 70 cm */}
            {calc.width_cm > 70 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 flex items-start gap-2.5 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs font-bold space-y-1">
                  <p>تنبيه: العرض تجاوز الحد المسموح (70 سم)</p>
                  <p className="text-[10px] text-amber-700 font-medium">تم تلقائياً تفعيل تركيب أعصاب التقوية (عدد: {calc.n_ribs}) وزيادة التروس الإضافية (عدد: {calc.extra_gears} تروس إضافية) لتدعيم الهيكل.</p>
                </div>
              </div>
            )}
          </div>

          {/* Configuration weights & prices */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Settings2 className="w-5 h-5 text-[#006780]" />
              <h3 className="font-bold text-sm text-slate-800">أوزان قطاعات الألومنيوم (كجم / متر طولي)</h3>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* w_side */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">وزن الجنب (w_side)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.w_side}
                    onChange={(e) => handleConfigChange('w_side', e.target.value)}
                    className="w-full text-right pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006780] text-xs font-bold text-slate-700"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">كجم/م</span>
                </div>
              </div>

              {/* w_ring */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">وزن الحلق (w_ring)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.w_ring}
                    onChange={(e) => handleConfigChange('w_ring', e.target.value)}
                    className="w-full text-right pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006780] text-xs font-bold text-slate-700"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">كجم/م</span>
                </div>
              </div>

              {/* w_blade */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">وزن الريشة (w_blade)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.w_blade}
                    onChange={(e) => handleConfigChange('w_blade', e.target.value)}
                    className="w-full text-right pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006780] text-xs font-bold text-slate-700"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">كجم/م</span>
                </div>
              </div>

              {/* w_angle */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">وزن الزاوية (w_angle)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.w_angle}
                    onChange={(e) => handleConfigChange('w_angle', e.target.value)}
                    className="w-full text-right pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006780] text-xs font-bold text-slate-700"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">كجم/م</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pb-3 pt-2 border-b border-slate-100">
              <DollarSign className="w-5 h-5 text-[#006780]" />
              <h3 className="font-bold text-sm text-slate-800">أسعار المواد وتكلفة المصنعية</h3>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Aluminum price per kg */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">سعر الألومنيوم / كجم</label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.p_aluminum}
                    onChange={(e) => handleConfigChange('p_aluminum', e.target.value)}
                    className="w-full text-right pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006780] text-xs font-bold text-slate-700"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">جنيه</span>
                </div>
              </div>

              {/* Screw price per kg */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">سعر المسامير / كجم</label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.p_screws}
                    onChange={(e) => handleConfigChange('p_screws', e.target.value)}
                    className="w-full text-right pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006780] text-xs font-bold text-slate-700"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">جنيه</span>
                </div>
              </div>

              {/* Gear price per piece */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">سعر الترس / قطعة</label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.p_gear}
                    onChange={(e) => handleConfigChange('p_gear', e.target.value)}
                    className="w-full text-right pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006780] text-xs font-bold text-slate-700"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">جنيه</span>
                </div>
              </div>

              {/* Handle kit price */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">سعر طقم اليد / قطعة</label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.p_handle}
                    onChange={(e) => handleConfigChange('p_handle', e.target.value)}
                    className="w-full text-right pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006780] text-xs font-bold text-slate-700"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">جنيه</span>
                </div>
              </div>

              {/* Fabrication cost per inch2 */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">المصنعية / بوصة مربعة</label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.p_fab}
                    onChange={(e) => handleConfigChange('p_fab', e.target.value)}
                    className="w-full text-right pl-11 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006780] text-xs font-bold text-slate-700"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-400">جنيه/بوصة²</span>
                </div>
              </div>

              {/* Margin */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">نسبة هامش الربح</label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.margin}
                    onChange={(e) => handleConfigChange('margin', e.target.value)}
                    className="w-full text-right pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006780] text-xs font-bold text-slate-700"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results & Cost Breakdown Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Summary Weights & Quantities Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total Aluminum Weight */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] font-bold block uppercase tracking-wider">إجمالي وزن الألومنيوم</span>
                <span className="text-2xl font-black text-indigo-900 block">{calc.total_weight.toFixed(3)}</span>
                <span className="text-[10px] text-indigo-700 font-semibold">كجم للوحدة</span>
              </div>
              <div className="bg-indigo-500/10 p-3 rounded-xl">
                <Scale className="w-6 h-6 text-indigo-600" />
              </div>
            </div>

            {/* Main Components Quantities */}
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 border border-cyan-100 rounded-2xl p-5 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] font-bold block uppercase tracking-wider">مكونات الهيكل</span>
                <div className="text-xs font-bold text-slate-700 space-y-1 mt-1">
                  <p>الريش: <span className="text-cyan-800 font-black text-sm">{calc.n_blades}</span> قطعة</p>
                  <p>الأعصاب: <span className="text-cyan-800 font-black text-sm">{calc.n_ribs}</span> قطعة</p>
                </div>
              </div>
              <div className="bg-cyan-500/10 p-3 rounded-xl">
                <Layers className="w-6 h-6 text-cyan-600" />
              </div>
            </div>

            {/* Gears Summary */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-100 rounded-2xl p-5 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] font-bold block uppercase tracking-wider">إجمالي التروس</span>
                <span className="text-2xl font-black text-teal-900 block">{calc.n_gears}</span>
                <span className="text-[10px] text-teal-700 font-semibold">{calc.extra_gears > 0 ? `(منها ${calc.extra_gears} إضافية للأعصاب)` : 'بدون أعصاب إضافية'}</span>
              </div>
              <div className="bg-teal-500/10 p-3 rounded-xl">
                <Wrench className="w-6 h-6 text-teal-600" />
              </div>
            </div>

          </div>

          {/* Cost Breakdown Table Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">جدول تفصيل تكاليف الإنتاج والتصنيع</h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">تحديث لحظي</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="p-4 text-xs font-black text-slate-500 w-1/3">عنصر التكلفة</th>
                    <th className="p-4 text-xs font-black text-slate-500">طريقة الحساب والتفاصيل</th>
                    <th className="p-4 text-xs font-black text-slate-500 text-left">التكلفة (جنيه)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {/* Aluminum Parts */}
                  <tr>
                    <td className="p-4 font-bold text-slate-800">شاسيه وقطاعات الألومنيوم</td>
                    <td className="p-4 text-slate-500 space-y-1">
                      <p className="font-medium">
                        الجنب: {calc.weight_sides.toFixed(3)} كجم | الحلق: {calc.weight_rings.toFixed(3)} كجم | الريش: {calc.weight_blades.toFixed(3)} كجم
                      </p>
                      {calc.hasAngle && (
                        <p className="text-[#006780] font-semibold">
                          + زاوية إضافية: {calc.weight_angle.toFixed(3)} كجم (الارتفاع فردي)
                        </p>
                      )}
                      {calc.n_ribs > 0 && (
                        <p className="text-amber-700 font-semibold">
                          + أعصاب تقوية: {calc.weight_ribs.toFixed(3)} كجم (العرض &gt; 70سم)
                        </p>
                      )}
                      <p className="text-slate-400 text-[10px]">
                        الوزن الإجمالي: {calc.total_weight.toFixed(3)} كجم × {config.p_aluminum} جنيه / كجم
                      </p>
                    </td>
                    <td className="p-4 font-black text-slate-700 text-left">
                      {calc.cost_aluminum.toFixed(2)}
                    </td>
                  </tr>

                  {/* Screws */}
                  <tr>
                    <td className="p-4 font-bold text-slate-800">مسامير التجميع</td>
                    <td className="p-4 text-slate-500">
                      ثابت افتراضي للدمبر: 0.045 كجم مسمار × {config.p_screws} جنيه / كجم
                    </td>
                    <td className="p-4 font-black text-slate-700 text-left">
                      {calc.cost_screws.toFixed(2)}
                    </td>
                  </tr>

                  {/* Gears */}
                  <tr>
                    <td className="p-4 font-bold text-slate-800">التروس البلاستيكية</td>
                    <td className="p-4 text-slate-500">
                      عدد التروس: {calc.n_gears} ترس × {config.p_gear} جنيه للقطعة
                      <p className="text-[10px] text-slate-400">({calc.n_blades * 2} للريش الأساسية + {calc.extra_gears} للأعصاب المزدوجة)</p>
                    </td>
                    <td className="p-4 font-black text-slate-700 text-left">
                      {calc.cost_gears.toFixed(2)}
                    </td>
                  </tr>

                  {/* Handle Kit */}
                  <tr>
                    <td className="p-4 font-bold text-slate-800">طقم اليد ومحور التوجيه</td>
                    <td className="p-4 text-slate-500">
                      مجموعة تحكم وتشغيل (طقم كامل للوحدة)
                    </td>
                    <td className="p-4 font-black text-slate-700 text-left">
                      {calc.cost_handle.toFixed(2)}
                    </td>
                  </tr>

                  {/* Fabrication */}
                  <tr>
                    <td className="p-4 font-bold text-slate-800">أجور مصنعية وتجميع</td>
                    <td className="p-4 text-slate-500">
                      المساحة بالبوصة²: {(calc.width_inch * calc.height_inch).toFixed(2)} بوصة² × {config.p_fab} جنيه
                      <p className="text-[10px] text-slate-400">(عرض: {calc.width_inch.toFixed(2)} بوصة × ارتفاع: {calc.height_inch.toFixed(2)} بوصة)</p>
                    </td>
                    <td className="p-4 font-black text-slate-700 text-left">
                      {calc.cost_fab.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary Card */}
          <div className="bg-gradient-to-br from-[#03273e] to-[#011420] text-white rounded-2xl shadow-lg p-6 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-700/50">
              <TrendingUp className="w-5 h-5 text-[#86d1ed]" />
              <h3 className="font-bold text-sm">التسعير النهائي للعميل</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-700/50">
              {/* Total cost */}
              <div className="space-y-1">
                <span className="text-slate-400 text-xs font-semibold block">إجمالي تكلفة تصنيع المكونات</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-100">{calc.total_cost.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 font-bold">جنيه</span>
                </div>
                <p className="text-[10px] text-slate-400">التكلفة الفعلية للمصنع بدون احتساب الربح</p>
              </div>

              {/* Sale Price after margin */}
              <div className="space-y-1 sm:pr-6">
                <span className="text-[#86d1ed] text-xs font-bold block">سعر البيع النهائي المقترح</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#86d1ed]">{calc.sale_price.toFixed(2)}</span>
                  <span className="text-sm text-[#86d1ed] font-bold">جنيه</span>
                </div>
                <p className="text-[10px] text-emerald-400 font-semibold">
                  هامش الربح المطبق: {config.margin}% (+{(calc.sale_price - calc.total_cost).toFixed(2)} جنيه)
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
