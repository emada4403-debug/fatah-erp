/**
 * db.js — Local-First + Supabase Sync Engine for React
 * يوفر واجهة موحدة لكل العمليات على البيانات مع المزامنة السحابية
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

export const DB = {
  _prefix: 'fatah_erp_',

  _key(table) {
    return this._prefix + table;
  },

  isSupabaseConfigured() {
    return isSupabaseConfigured;
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

  // Overwrite the entire table (useful for backup import)
  async save(table, records) {
    localStorage.setItem(this._key(table), JSON.stringify(records));
    if (isSupabaseConfigured) {
      try {
        if (records && records.length > 0) {
          const { error } = await supabase.from(table).upsert(records);
          if (error) {
            console.error(`DB.save Cloud Sync Upsert Error (${table}):`, error);
          }
        }
      } catch (e) {
        console.error(`DB.save Cloud Sync Exception (${table}):`, e);
      }
    }
  },

  insert(table, record) {
    const records = this.getAll(table);
    const newRecord = {
      ...record,
      id: record.id || this._genId(),
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: record.updatedAt || new Date().toISOString(),
    };
    records.push(newRecord);
    localStorage.setItem(this._key(table), JSON.stringify(records));

    // Cloud push
    if (isSupabaseConfigured && supabase) {
      try {
        supabase.from(table).insert(newRecord)
          .catch(e => console.error(`DB.insert Cloud Sync Error (${table}):`, e));
      } catch (e) {
        console.error(`DB.insert Cloud Sync Exception (${table}):`, e);
      }
    }

    return newRecord;
  },

  update(table, id, data) {
    const records = this.getAll(table);
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return null;
    
    const updatedRecord = { 
      ...records[idx], 
      ...data, 
      updatedAt: new Date().toISOString() 
    };
    records[idx] = updatedRecord;
    localStorage.setItem(this._key(table), JSON.stringify(records));

    // Cloud push
    if (isSupabaseConfigured && supabase) {
      try {
        supabase.from(table).update(data).eq('id', id)
          .catch(e => console.error(`DB.update Cloud Sync Error (${table}):`, e));
      } catch (e) {
        console.error(`DB.update Cloud Sync Exception (${table}):`, e);
      }
    }

    return updatedRecord;
  },

  delete(table, id) {
    const records = this.getAll(table).filter(r => r.id !== id);
    localStorage.setItem(this._key(table), JSON.stringify(records));

    // Cloud push
    if (isSupabaseConfigured && supabase) {
      try {
        supabase.from(table).delete().eq('id', id)
          .catch(e => console.error(`DB.delete Cloud Sync Error (${table}):`, e));
      } catch (e) {
        console.error(`DB.delete Cloud Sync Exception (${table}):`, e);
      }
    }

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
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  },

  // Pull latest data from Supabase to LocalStorage (with merge logic to prevent wiping local data)
  async syncFromCloud() {
    if (!isSupabaseConfigured) return false;
    try {
      const tables = ['categories', 'raw_materials', 'products', 'clients', 'settings', 'price_history', 'deals', 'quotes'];
      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
          console.error(`DB.syncFromCloud Error fetching ${table}:`, error.message || error, error.details, error.hint);
          continue;
        }
        if (data) {
          const localRecords = this.getAll(table);
          
          if (data.length === 0) {
            // Cloud has no records for this table, keep local records and do not overwrite
            continue;
          }

          // Merge local and cloud records based on ID and updatedAt
          const merged = [...localRecords];
          data.forEach(cloudRec => {
            const idx = merged.findIndex(r => r.id === cloudRec.id);
            if (idx === -1) {
              merged.push(cloudRec);
            } else {
              const localUpdate = merged[idx].updatedAt || merged[idx].createdAt || '';
              const cloudUpdate = cloudRec.updatedAt || cloudRec.createdAt || '';
              if (!localUpdate || new Date(cloudUpdate) > new Date(localUpdate)) {
                merged[idx] = cloudRec;
              }
            }
          });

          localStorage.setItem(this._key(table), JSON.stringify(merged));
        }
      }
      return true;
    } catch (e) {
      console.error('DB.syncFromCloud Exception:', e);
      return false;
    }
  },

  // Push all local data to Supabase
  async syncToCloud() {
    if (!isSupabaseConfigured) return false;
    try {
      const tables = ['categories', 'raw_materials', 'products', 'clients', 'settings', 'price_history', 'deals', 'quotes'];
      for (const table of tables) {
        const records = this.getAll(table);
        if (records && records.length > 0) {
          const { error } = await supabase.from(table).upsert(records);
          if (error) {
            console.error(`DB.syncToCloud Error uploading ${table}:`, error.message || error, error.details, error.hint);
            return false;
          }
        }
      }
      return true;
    } catch (e) {
      console.error('DB.syncToCloud Exception:', e);
      return false;
    }
  },

  // ===== SEED DATA =====
  seed() {
    // Check if old seed exists (using old category 'cat_hvac' as dynamic check)
    const hasOldSeed = this.getAll('categories').some(c => c.id === 'cat_hvac');
    // Check if products seed is missing image assets
    const lacksImages = this.getAll('products').some(p => p.id === 'prod_001' && !p.image);
    // Check if raw materials seed lacks images
    const lacksMatImages = this.getAll('raw_materials').some(m => m.id === 'mat_galv' && !m.image);
    // Check if new seed for accessories is missing
    const lacksAccessories = !this.getAll('products').some(p => p.id === 'prod_tdf_corner');
    // Check if volume damper lacks damperConfig
    const lacksDamperConfig = !this.getAll('products').some(p => p.id === 'prod_003' && p.costEngine?.damperConfig);
    
    if (hasOldSeed || lacksImages || lacksMatImages || lacksAccessories || lacksDamperConfig) {
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
      { id: 'cat_accessories', name: 'إكسسوارات ومكونات الفلنجة', icon: '🔩' },
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
        name: 'فوليوم دامبر يدوي',
        code: 'VD-AL',
        categoryId: 'cat_vd',
        unitType: 'حتة',
        image: '/images/volume_damper.png',
        minMarginPct: 15,
        costEngine: {
          damperConfig: {
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
          }
        },
        marginPct: 20,
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
      {
        id: 'prod_tdf_corner',
        name: 'TDF-CORNER',
        code: 'TDF-C',
        categoryId: 'cat_accessories',
        unitType: 'pc',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABhTWmhfG6oQ-RpJDovEji_FoXEJw-HiLhPR1r6s-OgFWbfIa_28XwH9cffalnsk1JKLVIU5k_wywbUWF70NoyhqAkl4UgX8fHeckTbQE_bSr6r4knt8C8LKk9Mrlpt_eRP9EFAqru-Q26L-TjOp7xg_7e5Ci5gfMBMIuqglOqz5kh0N3ul-pWBx8buq4GnIkpxGl1OPtckONlH2Rz5P8Ua9G6MD6cuTh9xFQY1-CY4MV3OPseVscCjSXYTGFa_nuQVOeMIgN6GPkB',
        minMarginPct: 10,
        marginPct: 0,
        priceOverride: 4.85,
        active: true
      },
      {
        id: 'prod_tdc_flange',
        name: 'TDC-FLANGE-35',
        code: 'TDC-F35',
        categoryId: 'cat_accessories',
        unitType: 'pc',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPrX3D1sXh-54TzGmSze-3GkM0QqW6_PLqmg9gQv2YsOpPcW22xQz_B-Pr26YN58xlpvDREEY2TUAcyyyyYwDtLamiatbeDmd6otIi2vv4XLceI2ncaDN6qA6_if9S6PyevASsyiXEEfx8m3_AshT8iaB3mEYc6lOH75S8JSegJU8BfdJLWlcsncW66eCh1sHArxtPTjEmj7WjXXWk_pk9bU8otSwHRjtAdVzK5mIqntMjpqKf9AG4ezHSYp7TdtmtNzJsOBFfUShd',
        minMarginPct: 10,
        marginPct: 0,
        priceOverride: 12.40,
        active: true
      },
      {
        id: 'prod_g_clamp',
        name: 'G-CLAMP',
        code: 'G-CLAMP',
        categoryId: 'cat_accessories',
        unitType: 'pc',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJCy0TSqE7YBdf7j45z-WDgP9SA2qCX3NHxRCZhcUSE8iC6_9vECIjcEH5JoY9OG47ReOowB0MaarDg13V8N_LXhd2CVKkuyKDAwrz8QC-_ScM0Fk1d6XsGX6ciGkHPLoNJhgtOSoDlFpaytvuwFBjYfMfR9CIBmBqkci2bIiebClzWhCGGlMRIaAjBjBb9EWl7KOzyvSlfQ9rWenIFVxNLODvkInuZvIlt0Z8obp4bYWqYI-P8i-s_hm5v5NK-7oHf4AOX9uLdsO0',
        minMarginPct: 10,
        marginPct: 0,
        priceOverride: 2.15,
        active: true
      },
      {
        id: 'prod_flex_duct',
        name: 'FLEXIBLE DUCT (PU)',
        code: 'FLEX-PU',
        categoryId: 'cat_accessories',
        unitType: 'M',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwKam2fpuEvle2NLZAdizSbEEAF2H4zCnMBRhaI7oUGohEptGo97J7DDkuIXkYbDMv7a6d2LUQ3ijugPLiD2nv90FxHlrptJNKfluitE44KfjuCyNhrSEbwABjInuOcnwcmfSm3BmnUadKwzz8-aPRsruuLY5f3ZVy6zt_KmUvtPh0aHuJLZkFpfab4UdyySvkozqL_fZQ6HXvsV-aIuJmMEQmDtxxTxvfZS-KzbM0D7eQls0yfhNvqJBamALc419DhFPI5odzQ6DX',
        minMarginPct: 10,
        marginPct: 0,
        priceOverride: 45.00,
        active: true
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
      nameEn: 'Al-Fath Engineering Industries',
      address: 'المنطقة الصناعية - العاشر من رمضان',
      addressEn: 'Industrial Zone, 10th of Ramadan City, Egypt',
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
