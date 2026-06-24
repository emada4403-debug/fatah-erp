import React, { useState } from 'react';
import { Search, Plus, Calendar, AlertCircle, Phone, Mail, MapPin, Building, ChevronRight, User, Trash2, Edit, X, Kanban } from 'lucide-react';
import { DB } from '../db/db.js';

export default function CRM({ clients, quotes, deals, onUpdate }) {
  const [activeTab, setActiveTab] = useState('clients'); // clients, pipeline, followups
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState(null); // client object or { id: 'temp' }
  const [editingDeal, setEditingDeal] = useState(null); // deal object or { id: 'temp' }
  const [viewingClient, setViewingClient] = useState(null); // client object
  const [isAddClientMode, setIsAddClientMode] = useState(false);
  const [isAddDealMode, setIsAddDealMode] = useState(false);

  // Client Form States
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientType, setClientType] = useState('lead');
  const [clientStage, setClientStage] = useState('lead');
  const [clientNotes, setClientNotes] = useState('');

  // Deal Form States
  const [dealTitle, setDealTitle] = useState('');
  const [dealClientId, setDealClientId] = useState('');
  const [dealValue, setDealValue] = useState(0);
  const [dealStage, setDealStage] = useState('lead');
  const [dealFollowUpDate, setDealFollowUpDate] = useState('');
  const [dealNotes, setDealNotes] = useState('');

  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' جنيه';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getClientTypeBadge = (type) => {
    const map = {
      lead: { label: 'عميل محتمل', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
      active: { label: 'عميل فعلي', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      vip: { label: 'VIP ⭐', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    };
    const item = map[type] || { label: 'غير محدد', cls: 'bg-slate-50 text-slate-600' };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${item.cls}`}>
        {item.label}
      </span>
    );
  };

  const getStageBadge = (stage) => {
    const map = {
      lead: { label: 'Lead 🎯', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
      contact: { label: 'تواصل 📞', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      quote: { label: 'عرض سعر 📋', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
      negotiation: { label: 'تفاوض 🤝', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
      deal: { label: 'صفقة ✅', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      lost: { label: 'خسارة ❌', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    };
    const item = map[stage] || { label: 'غير محدد', cls: 'bg-slate-50 text-slate-600' };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${item.cls}`}>
        {item.label}
      </span>
    );
  };

  // Open Client Details Viewer
  const handleOpenClientDetails = (c) => {
    setViewingClient(c);
  };

  // Open Add Client Form
  const handleOpenAddClient = () => {
    setIsAddClientMode(true);
    setClientName('');
    setClientCompany('');
    setClientPhone('');
    setClientEmail('');
    setClientAddress('');
    setClientType('lead');
    setClientStage('lead');
    setClientNotes('');
    setEditingClient({ id: 'temp' });
  };

  // Open Edit Client Form
  const handleOpenEditClient = (c) => {
    setIsAddClientMode(false);
    setEditingClient(c);
    setClientName(c.name || '');
    setClientCompany(c.company || '');
    setClientPhone(c.phone || '');
    setClientEmail(c.email || '');
    setClientAddress(c.address || '');
    setClientType(c.type || 'lead');
    setClientStage(c.stage || 'lead');
    setClientNotes(c.notes || '');
  };

  // Save Client
  const handleSaveClient = () => {
    if (!clientName.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }

    const data = {
      name: clientName.trim(),
      company: clientCompany.trim(),
      phone: clientPhone.trim(),
      email: clientEmail.trim(),
      address: clientAddress.trim(),
      type: clientType,
      stage: clientStage,
      notes: clientNotes,
    };

    if (isAddClientMode) {
      DB.insert('clients', data);
    } else {
      DB.update('clients', editingClient.id, data);
    }

    onUpdate();
    setEditingClient(null);
    if (viewingClient && viewingClient.id === editingClient?.id) {
      setViewingClient(DB.getById('clients', viewingClient.id));
    }
  };

  // Delete Client
  const handleDeleteClient = (c) => {
    if (window.confirm(`هل أنت متأكد من حذف العميل "${c.name}"؟`)) {
      DB.delete('clients', c.id);
      // Delete deals of this client too
      const cDeals = deals.filter(d => d.clientId === c.id);
      cDeals.forEach(d => DB.delete('deals', d.id));

      onUpdate();
      setViewingClient(null);
    }
  };

  // Open Add Deal Form
  const handleOpenAddDeal = (stage = 'lead', clientId = '') => {
    setIsAddDealMode(true);
    setDealTitle('');
    setDealClientId(clientId);
    setDealValue(0);
    setDealStage(stage);
    setDealFollowUpDate('');
    setDealNotes('');
    setEditingDeal({ id: 'temp' });
  };

  // Open Edit Deal Form
  const handleOpenEditDeal = (d) => {
    setIsAddDealMode(false);
    setEditingDeal(d);
    setDealTitle(d.title || '');
    setDealClientId(d.clientId || '');
    setDealValue(d.value || 0);
    setDealStage(d.stage || 'lead');
    setDealFollowUpDate(d.followUpDate ? d.followUpDate.split('T')[0] : '');
    setDealNotes(d.notes || '');
  };

  // Save Deal
  const handleSaveDeal = () => {
    if (!dealTitle.trim()) {
      alert('يرجى إدخال عنوان الصفقة');
      return;
    }

    const data = {
      title: dealTitle.trim(),
      clientId: dealClientId,
      value: parseFloat(dealValue) || 0,
      stage: dealStage,
      followUpDate: dealFollowUpDate,
      notes: dealNotes,
    };

    // Update client stage dynamically
    if (dealClientId) {
      DB.update('clients', dealClientId, { stage: dealStage });
    }

    if (isAddDealMode) {
      DB.insert('deals', data);
    } else {
      DB.update('deals', editingDeal.id, data);
    }

    onUpdate();
    setEditingDeal(null);
    if (viewingClient) {
      setViewingClient(DB.getById('clients', viewingClient.id));
    }
  };

  // Delete Deal
  const handleDeleteDeal = (d) => {
    if (window.confirm(`هل تريد حذف الصفقة "${d.title}"؟`)) {
      DB.delete('deals', d.id);
      onUpdate();
      setEditingDeal(null);
    }
  };

  // Filter clients
  const filteredClients = clients.filter(c => {
    return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (c.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (c.phone || '').includes(searchTerm);
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Kanban Pipeline Stages
  const pipelineStages = [
    { id: 'lead', label: 'Lead 🎯', color: 'border-t-amber-500 bg-amber-500/5' },
    { id: 'contact', label: 'تواصل 📞', color: 'border-t-blue-500 bg-blue-500/5' },
    { id: 'quote', label: 'عرض سعر 📋', color: 'border-t-purple-500 bg-purple-500/5' },
    { id: 'negotiation', label: 'تفاوض 🤝', color: 'border-t-cyan-500 bg-cyan-500/5' },
    { id: 'deal', label: 'صفقة ✅', color: 'border-t-emerald-500 bg-emerald-500/5' },
    { id: 'lost', label: 'خسارة ❌', color: 'border-t-rose-500 bg-rose-500/5' },
  ];

  // Followups filters
  const todayStr = new Date().toISOString().split('T')[0];
  const dueFollowups = deals.filter(d => d.followUpDate && d.followUpDate.split('T')[0] <= todayStr);

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">CRM وإدارة المبيعات</h2>
          <p className="text-sm text-slate-500">إدارة العملاء، خط أنابيب الصفقات والمبيعات، ومتابعة جدول الاتصال اليومي</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenAddClient}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" /> إضافة عميل
          </button>
          <button
            onClick={() => handleOpenAddDeal('lead', '')}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" /> إضافة صفقة
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-sm gap-2">
        <button
          onClick={() => setActiveTab('clients')}
          className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'clients' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
          }`}
        >
          دليل العملاء ({clients.length})
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'pipeline' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
          }`}
        >
          خط المبيعات (Pipeline Kanban)
        </button>
        <button
          onClick={() => setActiveTab('followups')}
          className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'followups' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
          }`}
        >
          متابعات اليوم
          {dueFollowups.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {dueFollowups.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Clients Directory */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="relative w-full">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث باسم العميل أو الشركة أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-slate-50/50"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.length ? (
              filteredClients.map((c) => {
                const cQuotes = quotes.filter(q => q.clientId === c.id);
                const cDeals = deals.filter(d => d.clientId === c.id);
                const dealSuccessVal = cDeals.filter(d => d.stage === 'deal').reduce((sum, d) => sum + (d.value || 0), 0);

                return (
                  <div
                    key={c.id}
                    onClick={() => handleOpenClientDetails(c)}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base">
                            {(c.name || '؟')[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{c.name}</h3>
                            {c.company && (
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Building className="w-3.5 h-3.5" /> {c.company}
                              </p>
                            )}
                          </div>
                        </div>
                        {getClientTypeBadge(c.type)}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-500">
                        {c.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {c.phone}</div>}
                        {c.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {c.email}</div>}
                        {c.address && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {c.address}</div>}
                      </div>

                      <div className="h-px bg-slate-50"></div>

                      <div className="flex justify-between items-center text-xs">
                        <div>{getStageBadge(c.stage)}</div>
                        <div className="text-left">
                          <div className="text-slate-400">عروض الأسعار: <span className="font-semibold text-slate-800">{cQuotes.length}</span></div>
                          {dealSuccessVal > 0 && <div className="font-bold text-emerald-600 mt-0.5">{formatCurrency(dealSuccessVal)}</div>}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEditClient(c); }}
                        className="flex-grow bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> تعديل البيانات
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenAddDeal('lead', c.id); }}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                      >
                        + صفقة
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClient(c); }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
                لا يوجد عملاء مسجلين يطابقون شروط البحث
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Sales Kanban Board */}
      {activeTab === 'pipeline' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1200px] h-[70vh]">
            {pipelineStages.map((stage) => {
              const stageDeals = deals.filter(d => d.stage === stage.id);
              const stageVal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

              return (
                <div key={stage.id} className="flex-1 bg-slate-50/70 border border-slate-100 rounded-2xl flex flex-col p-4">
                  {/* Stage Header */}
                  <div className="flex items-center justify-between border-t-2 border-t-indigo-500 pt-2 pb-4">
                    <span className="font-bold text-slate-900 text-xs">{stage.label}</span>
                    <div className="text-left">
                      <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{stageDeals.length}</span>
                      {stageVal > 0 && <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{formatCurrency(stageVal)}</div>}
                    </div>
                  </div>

                  {/* Deals Scrollable Container */}
                  <div className="flex-grow overflow-y-auto space-y-3 pr-1">
                    {stageDeals.map((d) => {
                      const cli = clients.find(c => c.id === d.clientId);
                      const isOverdue = d.followUpDate && new Date(d.followUpDate) < new Date();

                      return (
                        <div
                          key={d.id}
                          onClick={() => handleOpenEditDeal(d)}
                          className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 border-r-4 border-r-indigo-500/20"
                        >
                          <div className="font-bold text-slate-800 text-xs line-clamp-1">{d.title}</div>
                          {cli && <div className="text-[11px] text-slate-400 flex items-center gap-0.5"><User className="w-3 h-3" /> {cli.name}</div>}
                          {d.value > 0 && <div className="text-xs font-bold text-emerald-600">{formatCurrency(d.value)}</div>}

                          {d.followUpDate && (
                            <div className={`text-[10px] flex items-center gap-1 font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>
                              <Calendar className="w-3.5 h-3.5" />
                              {isOverdue && <span>⚠️ متأخرة: </span>}
                              {formatDate(d.followUpDate)}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button
                      onClick={() => handleOpenAddDeal(stage.id, '')}
                      className="w-full py-2 bg-white hover:bg-slate-100 border border-dashed border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> إضافة صفقة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Followups */}
      {activeTab === 'followups' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">المتابعات المعلقة لليوم</h3>
            <p className="text-xs text-slate-400">قائمة الفرص التي تحتاج إلى اتصال أو زيارة أو تقديم عرض سعر طبقاً للجدول الزمني</p>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold">
                  <th className="p-4">عنوان الفرصة</th>
                  <th className="p-4">اسم العميل</th>
                  <th className="p-4">القيمة المالية</th>
                  <th className="p-4">تاريخ المتابعة</th>
                  <th className="p-4">المرحلة الحالية</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dueFollowups.length ? (
                  dueFollowups.map((d) => {
                    const cli = clients.find(c => c.id === d.clientId);
                    const isOverdue = new Date(d.followUpDate) < new Date();
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{d.title}</td>
                        <td className="p-4">{cli ? cli.name : '-'}</td>
                        <td className="p-4 font-semibold text-slate-900">{formatCurrency(d.value)}</td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1 text-xs font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                            {isOverdue && <AlertCircle className="w-4.5 h-4.5" />}
                            {formatDate(d.followUpDate)}
                          </span>
                        </td>
                        <td className="p-4">{getStageBadge(d.stage)}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenEditDeal(d)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors"
                          >
                            تحديث المتابعة
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">
                      ✅ لا توجد متابعات معلقة ومستحقة اليوم
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Client Details Viewer */}
      {viewingClient && (() => {
        const cQuotes = quotes.filter(q => q.clientId === viewingClient.id);
        const cDeals = deals.filter(d => d.clientId === viewingClient.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        const cDealsVal = cDeals.reduce((sum, d) => sum + (d.value || 0), 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold">
                    {(viewingClient.name || '؟')[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{viewingClient.name}</h3>
                    <p className="text-xs text-slate-400">{viewingClient.company || 'عميل فردي'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingClient(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-grow text-sm">
                {/* Contact info grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">📞 تفاصيل الاتصال</h4>
                    {viewingClient.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {viewingClient.phone}</p>}
                    {viewingClient.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {viewingClient.email}</p>}
                    {viewingClient.address && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {viewingClient.address}</p>}
                    <div className="flex gap-2 pt-1">
                      {getClientTypeBadge(viewingClient.type)}
                      {getStageBadge(viewingClient.stage)}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">📊 ملخص النشاط المالي</h4>
                    <div className="flex justify-between"><span>إجمالي عروض الأسعار:</span><span className="font-bold">{cQuotes.length} عرض</span></div>
                    <div className="flex justify-between"><span>إجمالي قيمة الفرص:</span><span className="font-bold text-emerald-600">{formatCurrency(cDealsVal)}</span></div>
                    {viewingClient.notes && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-xs text-slate-400 block mb-0.5">ملاحظات:</span>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{viewingClient.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Opportunities Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">🤝 الصفقات والفرص الحالية</h4>
                    <button
                      onClick={() => handleOpenAddDeal('lead', viewingClient.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-bold"
                    >
                      + صفقة جديدة
                    </button>
                  </div>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                          <th className="p-3">الصفقة</th>
                          <th className="p-3">القيمة المادية</th>
                          <th className="p-3">المرحلة</th>
                          <th className="p-3">تاريخ المتابعة</th>
                          <th className="p-3">ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {cDeals.length ? (
                          cDeals.map((d, i) => (
                            <tr key={i} className="hover:bg-slate-50/30">
                              <td className="p-3">
                                <span className="font-bold text-slate-900">{d.title}</span>
                                <p className="text-[10px] text-slate-400 mt-0.5">تاريخ الإنشاء: {formatDate(d.createdAt)}</p>
                              </td>
                              <td className="p-3 font-semibold text-slate-900">{formatCurrency(d.value)}</td>
                              <td className="p-3">{getStageBadge(d.stage)}</td>
                              <td className="p-3">{d.followUpDate ? formatDate(d.followUpDate) : '-'}</td>
                              <td className="p-3 text-slate-500 max-w-[160px] truncate">{d.notes || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="5" className="p-4 text-center text-slate-400">لا توجد صفقات مسجلة للعميل.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quotes Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">📋 عروض الأسعار السابقة</h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                          <th className="p-3">رقم العرض</th>
                          <th className="p-3">اسم المشروع</th>
                          <th className="p-3">إجمالي قيمة العرض</th>
                          <th className="p-3">حالة العرض</th>
                          <th className="p-3">تاريخ الإنشاء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {cQuotes.length ? (
                          cQuotes.map((q, i) => (
                            <tr key={i} className="hover:bg-slate-50/30">
                              <td className="p-3 font-bold text-indigo-600">{q.number}</td>
                              <td className="p-3">{q.projectName || '-'}</td>
                              <td className="p-3 font-semibold text-slate-900">{formatCurrency(q.total)}</td>
                              <td className="p-3">{getStageBadge(q.status)}</td>
                              <td className="p-3 text-slate-500">{formatDate(q.createdAt)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="5" className="p-4 text-center text-slate-400">لا توجد عروض أسعار مسجلة لهذا العميل.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between flex-shrink-0">
                <button
                  onClick={() => handleDeleteClient(viewingClient)}
                  className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all"
                >
                  حذف العميل نهائياً
                </button>
                <button
                  onClick={() => setViewingClient(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Client Add/Edit Form */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {isAddClientMode ? '👤 إضافة عميل جديد' : '✏️ تعديل بيانات العميل'}
              </h3>
              <button
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">اسم العميل بالكامل</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  placeholder="مثال: م. أحمد عبد العزيز"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">اسم الشركة</label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  placeholder="مثال: شركة الإنشاءات الحديثة"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-left font-mono"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-left"
                    placeholder="client@mail.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">العنوان</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  placeholder="العنوان التفصيلي"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">تصنيف العميل</label>
                  <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="lead">عميل محتمل (Lead)</option>
                    <option value="active">عميل فعلي (Active)</option>
                    <option value="vip">VIP ⭐</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">مرحلة البيع الحالية</label>
                  <select
                    value={clientStage}
                    onChange={(e) => setClientStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="lead">Lead 🎯</option>
                    <option value="contact">تواصل 📞</option>
                    <option value="quote">عرض سعر 📋</option>
                    <option value="negotiation">تفاوض 🤝</option>
                    <option value="deal">صفقة ✅</option>
                    <option value="lost">خسارة ❌</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">ملاحظات العميل العامة</label>
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  rows="3"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setEditingClient(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveClient}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                حفظ البيانات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Deal Add/Edit Form */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {isAddDealMode ? '🤝 إضافة صفقة / فرصة جديدة' : '✏️ تعديل تفاصيل الصفقة'}
              </h3>
              <button
                onClick={() => setEditingDeal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">اسم الصفقة / الفرصة</label>
                <input
                  type="text"
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  placeholder="مثال: توريد 500 كجم ألومنيوم لمبنى أكتوبر"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">مرتبطة بالعميل</label>
                <select
                  value={dealClientId}
                  onChange={(e) => setDealClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold"
                >
                  <option value="">-- اختر عميلاً --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.company || 'فردي'}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">القيمة المالية التقديرية (جنيه)</label>
                  <input
                    type="number"
                    value={dealValue || ''}
                    onChange={(e) => setDealValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-bold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">مرحلة الصفقة الحالية</label>
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold"
                  >
                    <option value="lead">Lead 🎯</option>
                    <option value="contact">تواصل 📞</option>
                    <option value="quote">عرض سعر 📋</option>
                    <option value="negotiation">تفاوض 🤝</option>
                    <option value="deal">صفقة ✅</option>
                    <option value="lost">خسارة ❌</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">تاريخ المتابعة القادم (Follow-up)</label>
                <input
                  type="date"
                  value={dealFollowUpDate}
                  onChange={(e) => setDealFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">تفاصيل وملاحظات الصفقة</label>
                <textarea
                  value={dealNotes}
                  onChange={(e) => setDealNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  rows="3"
                  placeholder="ملاحظات المتابعة والاتصال..."
                />
              </div>
            </div>

            <div className="bg-slate-50 p-5 border-t border-slate-100 flex justify-between">
              {!isAddDealMode ? (
                <button
                  onClick={() => handleDeleteDeal(editingDeal)}
                  className="px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all"
                >
                  حذف الصفقة
                </button>
              ) : <div></div>}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingDeal(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveDeal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  حفظ الصفقة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
