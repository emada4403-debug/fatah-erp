import { useState, useEffect } from 'react';
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
  Lock,
  HelpCircle,
  LogOut,
  ChevronDown,
  Layers
} from 'lucide-react';


// Collapsible navigation sub-menu item component
function CollapsibleNavItem({ item, activeTab, onTabChange, setIsSidebarOpen }) {
  const isChildActive = item.subItems.some(sub => sub.id === activeTab);
  const [isOpen, setIsOpen] = useState(isChildActive || activeTab.startsWith('quote_builder'));

  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [activeTab, isChildActive]);

  const ItemIcon = item.icon;

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-155 cursor-pointer ${
          isChildActive
            ? 'bg-slate-800/40 text-[#86d1ed]' 
            : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <ItemIcon className={`w-5 h-5 ${isChildActive ? 'text-[#86d1ed]' : 'text-slate-400'}`} />
          <span>{item.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-205 ${isOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
      </button>
      
      {isOpen && (
        <div className="mr-4 pr-3 border-r border-slate-805/40 space-y-1 mt-1">
          {item.subItems.map((sub) => {
            const isSubActive = sub.id === activeTab;
            return (
              <button
                key={sub.id}
                onClick={() => {
                  onTabChange(sub.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-[11px] font-semibold transition-all duration-155 relative overflow-hidden cursor-pointer ${
                  isSubActive
                    ? 'bg-[#86d1ed] text-[#02273b] font-extrabold shadow-sm'
                    : 'hover:bg-slate-800/30 text-slate-400 hover:text-slate-205'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-[#02273b]' : 'bg-slate-600'}`} />
                <span>{sub.label}</span>
                {isSubActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#02273b]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Layout({ 
  activeTab, 
  onTabChange, 
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
    { 
      id: 'quote_builder', 
      label: 'إنشاء عرض سعر', 
      icon: Layers,
      subItems: [
        { id: 'quote_builder_galvanized', label: 'صاج مجلفن' },
        { id: 'quote_builder_black', label: 'صاج أسود' },
        { id: 'quote_builder_general', label: 'عام / أخرى' }
      ]
    },
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
      <aside className={`fixed top-0 bottom-0 right-0 z-50 w-64 bg-[#031f30] text-slate-300 border-l border-slate-800/80 flex flex-col justify-between transform transition-transform duration-250 lg:translate-x-0 lg:static lg:h-screen ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col flex-grow">
          {/* Sidebar Header (Logo Card) */}
          <div className="flex flex-col items-center pt-8 pb-6 border-b border-slate-800/60 px-6 relative">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-white rounded-2xl p-2 flex flex-col items-center justify-center shadow-md w-24 h-24 mb-3 border border-slate-100">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuArXN-t3d9q_3fbo0qB3itz0xhAYPBY-VMmZYQnQpKv9ctfxF4MBhdI9HJbPGDA56gxSMfFI_xhfWistOwx7E1G3I7gaacsaR-5pCTyxxg_WoEoxH7mJZj3KJt57qP-sKqPlP4gMBXW9YLugctm4i9A1c4G1cfXY1U9Wy3hE6AwhIDIHO8nft8srj9AlcxH3Uqx0QfciBCEQ61DMDiiXeRpv1-HD6NiMoj79IJZZCpw5bLSM9I-6wK6G10rs0M_-V8n61ykqCloVMF3" 
                alt="Al-Fath Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="font-black text-white text-base tracking-wide">الفتح ERP</h1>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">الإدارة الصناعية</p>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
            {visibleNavItems.map((item) => {
              if (item.subItems) {
                return (
                  <CollapsibleNavItem
                    key={item.id}
                    item={item}
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    setIsSidebarOpen={setIsSidebarOpen}
                  />
                );
              }

              const ItemIcon = item.icon;
              const isActive = item.id === activeTab;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-155 relative overflow-hidden cursor-pointer ${
                    isActive 
                      ? 'bg-[#86d1ed] text-[#02273b] font-extrabold shadow-sm' 
                      : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ItemIcon className={`w-5 h-5 ${isActive ? 'text-[#02273b]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#02273b]" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/60 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>الدعم الفني</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer">
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>تسجيل الخروج</span>
          </button>
          <div className="pt-3 text-center text-[9px] text-slate-500 font-medium border-t border-slate-800/30">
            نظام الفتح ERP المتكامل v2.0
          </div>
        </div>
      </aside>

      {/* Main Content Wrap */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0">
          {/* RTL right: Menu & Date widget & Admin status */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-[#006780]" />
              <span>{getTodayArabicDate()}</span>
            </div>
            {hasPin && (
              isAdmin ? (
                <button 
                  onClick={onLock}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold transition-all cursor-pointer"
                  title="خروج الإدارة وتأمين الحسابات"
                >
                  <Lock className="w-3 h-3" />
                  <span>قفل الإدارة</span>
                </button>
              ) : (
                <button 
                  onClick={onUnlock}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold transition-all cursor-pointer animate-pulse"
                  title="تسجيل دخول المدير ورؤية التكاليف"
                >
                  <Lock className="w-3 h-3" />
                  <span>دخول الإدارة</span>
                </button>
              )
            )}
          </div>

          {/* RTL left: Company Title & icons & profile avatar */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">مصنع الفتح للصناعات الهندسية</span>
            
            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
            
            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 relative cursor-pointer" title="البحث">
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 relative cursor-pointer" title="الإشعارات">
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#006780] rounded-full border border-white"></span>
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </button>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300 shadow-sm flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-600" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14.6C14.7,14.6 18.8,15.9 19,18.6A8.5,8.5 0 0,1 12,20A8.5,8.5 0 0,1 5,18.6C5.2,15.9 9.3,14.6 12,14.6Z"/>
              </svg>
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
