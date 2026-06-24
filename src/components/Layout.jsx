import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  Calendar,
  Lock
} from 'lucide-react';

export default function Layout({ 
  activeTab, 
  onTabChange, 
  settings, 
  isAdmin, 
  hasPin, 
  onLock, 
  onUnlock, 
  children 
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'products', label: 'إدارة المنتجات', icon: Package },
    { id: 'pricing', label: 'التسعير الديناميكي', icon: TrendingUp },
    { id: 'quotes', label: 'عروض الأسعار', icon: FileText },
    { id: 'crm', label: 'إدارة العملاء CRM', icon: Users },
    { id: 'reports', label: 'التقارير والتحليلات', icon: BarChart3 },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings },
  ];

  // Filter restricted tabs if protected and locked
  const restrictedTabs = ['pricing', 'reports', 'settings'];
  const visibleNavItems = navItems.filter(item => {
    if (restrictedTabs.includes(item.id)) {
      return !hasPin || isAdmin;
    }
    return true;
  });

  const activeItem = navItems.find(item => item.id === activeTab) || navItems[0];
  const IconComponent = activeItem.icon;

  const getTodayArabicDate = () => {
    return new Date().toLocaleDateString('ar-EG', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans rtl-grid text-slate-800">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 bottom-0 right-0 z-50 w-64 bg-slate-900 text-slate-300 border-l border-slate-800 flex flex-col justify-between transform transition-transform duration-250 lg:translate-x-0 lg:static lg:h-screen ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col flex-grow">
          {/* Sidebar Header (Logo) */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base">ف</div>
              <span className="font-extrabold text-white text-base truncate">{settings.name || 'مصنع الفتح'}</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
            {visibleNavItems.map((item) => {
              const ItemIcon = item.icon;
              const isActive = item.id === activeTab;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-bold' 
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ItemIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 text-center text-[10px] text-slate-500 font-medium">
          نظام الفتح ERP المتكامل v2.0
        </div>
      </aside>

      {/* Main Content Wrap */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-slate-800 font-bold text-sm">
              <IconComponent className="w-5 h-5 text-indigo-500" />
              <span>{activeItem.label}</span>
            </div>
          </div>

          {/* Admin Lock / Date Widget */}
          <div className="flex items-center gap-2">
            {hasPin && (
              isAdmin ? (
                <button 
                  onClick={onLock}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer"
                  title="خروج الإدارة وتأمين الحسابات"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">قفل لوحة الإدارة</span>
                </button>
              ) : (
                <button 
                  onClick={onUnlock}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer animate-pulse"
                  title="تسجيل دخول المدير ورؤية التكاليف"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>دخول الإدارة</span>
                </button>
              )
            )}

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>{getTodayArabicDate()}</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow p-6 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
