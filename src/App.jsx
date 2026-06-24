import React, { useState, useEffect } from 'react';
import { DB } from './db/db.js';
import Layout from './components/Layout.jsx';
import Dashboard from './components/Dashboard.jsx';
import Products from './components/Products.jsx';
import Pricing from './components/Pricing.jsx';
import Quotes from './components/Quotes.jsx';
import CRM from './components/CRM.jsx';
import Reports from './components/Reports.jsx';
import Settings from './components/Settings.jsx';
import { Lock, X, ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [settings, setSettings] = useState({});
  const [priceHistory, setPriceHistory] = useState([]);

  // Admin Protection State
  const [isAdmin, setIsAdmin] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pendingTab, setPendingTab] = useState(null);
  const [pinError, setPinError] = useState(false);

  // Initialize DB and state on first load
  useEffect(() => {
    DB.seed();
    syncData();

    // Check hash for direct navigation
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const s = DB.getAll('settings')[0] || {};
    const hasPin = !!s.adminPin;
    const sessionUnlocked = sessionStorage.getItem('fatah_erp_is_admin') === 'true';
    const isRestricted = ['pricing', 'reports', 'settings'].includes(hash);

    if (isRestricted && hasPin && !sessionUnlocked) {
      // Default restricted navigation to dashboard if locked on reload
      setActiveTab('dashboard');
      window.location.hash = 'dashboard';
    } else {
      setActiveTab(hash);
    }

    const handleHashChange = () => {
      const h = window.location.hash.replace('#', '') || 'dashboard';
      const currentSettings = DB.getAll('settings')[0] || {};
      const currentUnlocked = sessionStorage.getItem('fatah_erp_is_admin') === 'true';
      const currentRestricted = ['pricing', 'reports', 'settings'].includes(h);

      if (currentRestricted && currentSettings.adminPin && !currentUnlocked) {
        setPendingTab(h);
        setShowPinModal(true);
        setPinInput('');
        setPinError(false);
        // keep current hash
        window.location.hash = activeTab;
      } else {
        setActiveTab(h);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  // Synchronize React state with DB (localStorage)
  const syncData = () => {
    setProducts(DB.getAll('products'));
    setMaterials(DB.getAll('raw_materials'));
    setCategories(DB.getAll('categories'));
    setQuotes(DB.getAll('quotes'));
    setClients(DB.getAll('clients'));
    setDeals(DB.getAll('deals'));
    setPriceHistory(DB.getAll('price_history'));
    
    const s = DB.getAll('settings')[0] || {
      name: 'مصنع الفتح للصناعات المعدنية',
      currency: 'جنيه'
    };
    setSettings(s);

    // Check PIN session
    if (s.adminPin) {
      const sessionUnlocked = sessionStorage.getItem('fatah_erp_is_admin') === 'true';
      setIsAdmin(sessionUnlocked);
    } else {
      setIsAdmin(true); // Unlocked if no pin is set
    }
  };

  // Change tab helper
  const handleTabChange = (tabId) => {
    const hasPin = !!settings.adminPin;
    const isRestricted = ['pricing', 'reports', 'settings'].includes(tabId);
    
    if (isRestricted && hasPin && !isAdmin) {
      setPendingTab(tabId);
      setShowPinModal(true);
      setPinInput('');
      setPinError(false);
    } else {
      setActiveTab(tabId);
      window.location.hash = tabId;
    }
  };

  // Lock Admin Mode
  const handleLock = () => {
    sessionStorage.setItem('fatah_erp_is_admin', 'false');
    setIsAdmin(false);
    setActiveTab('dashboard');
    window.location.hash = 'dashboard';
  };

  // Open login unlock dialog manually
  const handleTriggerUnlock = () => {
    setPendingTab(null);
    setShowPinModal(true);
    setPinInput('');
    setPinError(false);
  };

  // Submit PIN Unlock
  const handleUnlockSubmit = (e) => {
    if (e) e.preventDefault();
    if (pinInput === settings.adminPin) {
      sessionStorage.setItem('fatah_erp_is_admin', 'true');
      setIsAdmin(true);
      setShowPinModal(false);
      setPinError(false);
      if (pendingTab) {
        setActiveTab(pendingTab);
        window.location.hash = pendingTab;
        setPendingTab(null);
      }
    } else {
      setPinError(true);
    }
  };

  // Render active view
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            quotes={quotes}
            clients={clients}
            products={products}
            deals={deals}
            materials={materials}
            priceHistory={priceHistory}
            settings={settings}
            isAdmin={isAdmin}
            onViewDetails={handleTabChange}
          />
        );
      case 'products':
        return (
          <Products
            products={products}
            materials={materials}
            categories={categories}
            isAdmin={isAdmin}
            onUpdate={syncData}
          />
        );
      case 'pricing':
        return (
          <Pricing
            products={products}
            materials={materials}
            priceHistory={priceHistory}
            onUpdate={syncData}
          />
        );
      case 'quotes':
        return (
          <Quotes
            quotes={quotes}
            clients={clients}
            products={products}
            settings={settings}
            onUpdate={syncData}
          />
        );
      case 'crm':
        return (
          <CRM
            clients={clients}
            quotes={quotes}
            deals={deals}
            onUpdate={syncData}
          />
        );
      case 'reports':
        return (
          <Reports
            quotes={quotes}
            clients={clients}
            products={products}
            deals={deals}
            materials={materials}
            priceHistory={priceHistory}
            settings={settings}
          />
        );
      case 'settings':
        return (
          <Settings
            settings={settings}
            onUpdate={syncData}
          />
        );
      default:
        return <div className="text-center py-10">الصفحة المطلوبة غير موجودة</div>;
    }
  };

  return (
    <div className="relative">
      <Layout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        settings={settings}
        isAdmin={isAdmin}
        hasPin={!!settings.adminPin}
        onLock={handleLock}
        onUnlock={handleTriggerUnlock}
      >
        {renderView()}
      </Layout>

      {/* Modal: Enter PIN code to unlock */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Lock className="w-4.5 h-4.5 text-indigo-400" /> رمز التحقق مطلوب
              </h3>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPendingTab(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUnlockSubmit} className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  هذا القسم محمي بقفل أمان المصنع. يرجى إدخال رمز PIN للمدير لعرض تكاليف التصنيع والإحصائيات.
                </p>
              </div>

              <div>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className={`w-full text-center px-4 py-2.5 rounded-xl border font-bold text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    pinError ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'
                  }`}
                  placeholder="••••"
                  maxLength="8"
                  autoFocus
                />
                {pinError && (
                  <span className="text-[10px] text-rose-600 font-bold block text-center mt-1">
                    ❌ رمز PIN غير صحيح! يرجى المحاولة مجدداً.
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPendingTab(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  تأكيد الرمز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
