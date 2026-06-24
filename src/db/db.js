/**
 * db.js — localStorage CRUD Engine for React
 * يوفر واجهة موحدة لكل العمليات على البيانات
 */

export const DB = {
  _prefix: 'fatah_erp_',

  _key(table) {
    return this._prefix + table;
  },

  getAll(table) {
    try {
      const raw = localStorage.getItem(this._key(table));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error(`DB.getAll(${table}):`, e);
      return [];
    }
  },

  getById(table, id) {
    return this.getAll(table).find(r => r.id === id) || null;
  },

  save(table, records) {
    localStorage.setItem(this._key(table), JSON.stringify(records));
  },

  insert(table, record) {
    const records = this.getAll(table);
    const newRecord = {
      ...record,
      id: record.id || this._genId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    records.push(newRecord);
    this.save(table, records);
    return newRecord;
  },

  update(table, id, data) {
    const records = this.getAll(table);
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return null;
    records[idx] = { ...records[idx], ...data, updatedAt: new Date().toISOString() };
    this.save(table, records);
    return records[idx];
  },

  delete(table, id) {
    const records = this.getAll(table).filter(r => r.id !== id);
    this.save(table, records);
    return true;
  },

  query(table, filterFn) {
    return this.getAll(table).filter(filterFn);
  },

  count(table, filterFn) {
    const all = this.getAll(table);
    return filterFn ? all.filter(filterFn).length : all.length;
  },

  _genId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  },

  // ===== SEED DATA =====
  seed() {
    // Check if old seed exists (using old category 'cat_hvac' as dynamic check)
    const hasOldSeed = this.getAll('categories').some(c => c.id === 'cat_hvac');
    // Check if products seed is missing image assets
    const lacksImages = this.getAll('products').some(p => p.id === 'prod_001' && !p.image);
    // Check if raw materials seed lacks images
    const lacksMatImages = this.getAll('raw_materials').some(m => m.id === 'mat_galv' && !m.image);
    
    if (hasOldSeed || lacksImages || lacksMatImages) {
      // Clear localStorage tables related to seed data to trigger re-seed
      const tablesToClear = ['raw_materials', 'categories', 'products', 'quotes', 'clients', 'settings', 'price_history', 'deals'];
      tablesToClear.forEach(t => localStorage.removeItem(this._key(t)));
    }

    // Only seed if empty
    if (this.getAll('raw_materials').length > 0) return;

    // Raw Materials (أسعار المواد الخام)
    const materials = [
      { id: 'mat_galv', name: 'صاج مجلفن خام', unit: 'كجم', price: 65, lastUpdated: new Date().toISOString(), color: '#cbd5e1', image: '/images/raw_galv.png', isTaxInclusive: false, taxRate: 14 },
      { id: 'mat_black', name: 'صاج أسود خام', unit: 'كجم', price: 55, lastUpdated: new Date().toISOString(), color: '#475569', image: '/images/raw_black.png', isTaxInclusive: false, taxRate: 14 },
      { id: 'mat_al', name: 'ألومنيوم خام', unit: 'كجم', price: 85, lastUpdated: new Date().toISOString(), color: '#94a3b8', image: '/images/raw_al.png', isTaxInclusive: false, taxRate: 14 },
      { id: 'mat_fe', name: 'حديد زاوية', unit: 'كجم', price: 45, lastUpdated: new Date().toISOString(), color: '#78716c', image: '/images/raw_fe.png', isTaxInclusive: false, taxRate: 14 },
      { id: 'mat_ins', name: 'عازل صوف زجاجي', unit: 'م²', price: 90, lastUpdated: new Date().toISOString(), color: '#f59e0b', image: '/images/raw_ins.png', isTaxInclusive: false, taxRate: 14 },
      { id: 'mat_pvc', name: 'خامات PVC', unit: 'كجم', price: 35, lastUpdated: new Date().toISOString(), color: '#6366f1', image: '/images/raw_pvc.png', isTaxInclusive: false, taxRate: 14 },
    ];
    materials.forEach(m => this.insert('raw_materials', m));

    // Categories (أنواع المنتجات)
    const cats = [
      { id: 'cat_galvanized', name: 'صاج مجلفن', icon: '💿' },
      { id: 'cat_black', name: 'صاج اسود', icon: '⬛' },
      { id: 'cat_vd', name: 'فوليوم دامبر', icon: '🎛️' },
      { id: 'cat_outlets', name: 'مخارج هواء', icon: '💨' },
    ];
    cats.forEach(c => this.insert('categories', c));

    // Sample Products
    const products = [
      {
        id: 'prod_001',
        name: 'دكت صاج مجلفن 1.2مم',
        code: 'GD-12',
        categoryId: 'cat_galvanized',
        unitType: 'م²',
        image: '/images/galvanized_duct.png',
        minMarginPct: 20,
        costEngine: {
          rawMaterials: [
            { materialId: 'mat_galv', qty: 9.5, note: 'صاج مجلفن خام' },
            { materialId: 'mat_fe', qty: 1.5, note: 'حديد زاوية للتثبيت' }
          ],
          laborCost: 45,
          overhead: { fixed: 15, variable: 10 },
          operations: [
            { name: 'قص ولحام', cost: 20 },
            { name: 'تشكيل وتثني', cost: 15 },
          ],
        },
        marginPct: 25,
        active: true,
      },
      {
        id: 'prod_002',
        name: 'دكت صاج أسود للمطابخ 1.5مم',
        code: 'BD-15',
        categoryId: 'cat_black',
        unitType: 'م²',
        image: '/images/black_duct.png',
        minMarginPct: 20,
        costEngine: {
          rawMaterials: [
            { materialId: 'mat_black', qty: 12, note: 'صاج أسود خام' },
            { materialId: 'mat_fe', qty: 2.0, note: 'حديد زاوية مقوى' }
          ],
          laborCost: 55,
          overhead: { fixed: 20, variable: 12 },
          operations: [
            { name: 'قطع بلازما', cost: 30 },
            { name: 'لحام مستمر مقوى', cost: 25 },
            { name: 'دهان حراري مقاوم للزيوت', cost: 40 },
          ],
        },
        marginPct: 30,
        active: true,
      },
      {
        id: 'prod_003',
        name: 'فوليوم دامبر يدوي 30×30',
        code: 'VD-3030',
        categoryId: 'cat_vd',
        unitType: 'حتة',
        image: '/images/volume_damper.png',
        minMarginPct: 15,
        costEngine: {
          rawMaterials: [
            { materialId: 'mat_galv', qty: 3.5, note: 'صاج مجلفن شفرات' },
            { materialId: 'mat_al', qty: 0.5, note: 'إطار ألومنيوم' }
          ],
          laborCost: 60,
          overhead: { fixed: 25, variable: 15 },
          operations: [
            { name: 'تجميع شفرات الدامبر', cost: 35 },
            { name: 'تركيب يد التحكم والتروس', cost: 15 },
          ],
        },
        marginPct: 25,
        active: true,
      },
      {
        id: 'prod_004',
        name: 'مخرج هواء جانبي جريلة 20×20',
        code: 'SG-2020',
        categoryId: 'cat_outlets',
        unitType: 'حتة',
        image: '/images/air_grille.png',
        minMarginPct: 15,
        costEngine: {
          rawMaterials: [
            { materialId: 'mat_al', qty: 1.5, note: 'شفرات وإطار ألومنيوم' }
          ],
          laborCost: 25,
          overhead: { fixed: 10, variable: 5 },
          operations: [
            { name: 'كبس وقص زوايا', cost: 15 },
            { name: 'طلاء إلكتروستاتيك أبيض', cost: 20 },
            { name: 'تجميع نهائي وتثبيت شفرات', cost: 10 },
          ],
        },
        marginPct: 25,
        active: true,
      },
    ];
    products.forEach(p => this.insert('products', p));

    // Sample Clients
    const clients = [
      {
        id: 'cli_001',
        name: 'أحمد محمد السيد',
        company: 'شركة الإنشاءات الحديثة',
        phone: '01012345678',
        email: 'ahmed@modern-const.com',
        address: 'القاهرة - مدينة نصر',
        type: 'vip',
        stage: 'deal',
      },
      {
        id: 'cli_002',
        name: 'مهندس خالد عبدالله',
        company: 'مجموعة التطوير العمراني',
        phone: '01098765432',
        email: 'khaled@urban-dev.com',
        address: 'الإسكندرية - سموحة',
        type: 'active',
        stage: 'quote',
      },
      {
        id: 'cli_003',
        name: 'سارة يوسف',
        company: 'مكتب الهندسة المتكاملة',
        phone: '01155443322',
        email: 'sara@integral-eng.com',
        address: 'الجيزة - الشيخ زايد',
        type: 'lead',
        stage: 'contact',
      },
    ];
    clients.forEach(c => this.insert('clients', c));

    // Company Settings
    this.insert('settings', {
      id: 'company',
      name: 'مصنع الفتح للصناعات الهندسية',
      address: 'المنطقة الصناعية - العاشر من رمضان',
      phone: '0501234567',
      email: 'info@fatah-factory.com',
      taxNo: '123456789',
      currency: 'جنيه',
      defaultMargin: 25,
      minMargin: 15,
      quoteValidity: 30,
      paymentTerms: 'الدفع خلال 30 يوم من تاريخ الاستلاف',
    });

    console.log('✅ DB Seeded successfully');
  },

  // ===== PRICE HISTORY =====
  logPriceChange(materialId, oldPrice, newPrice) {
    this.insert('price_history', {
      materialId,
      oldPrice,
      newPrice,
      changedAt: new Date().toISOString(),
    });
  },

  getPriceHistory(materialId, limit = 30) {
    return this.query('price_history', r => r.materialId === materialId)
      .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
      .slice(0, limit);
  },
};
