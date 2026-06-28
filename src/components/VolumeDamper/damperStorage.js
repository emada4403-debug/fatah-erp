import { DB } from '../../db/db.js';

export const DEFAULT_VD_CONFIG = {
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
};

export const damperStorage = {
  load: () => {
    try {
      const products = DB.getAll('products');
      const vdProd = products.find(p => p.categoryId === 'cat_vd' || p.id === 'prod_003');
      if (vdProd && vdProd.costEngine && vdProd.costEngine.damperConfig) {
        const parsed = vdProd.costEngine.damperConfig;
        const config = {};
        Object.keys(DEFAULT_VD_CONFIG).forEach(key => {
          config[key] = parsed[key] !== undefined && parsed[key] !== null ? Number(parsed[key]) : DEFAULT_VD_CONFIG[key];
        });
        return config;
      }
    } catch (e) {
      console.error("Error loading damper config from database", e);
    }
    return { ...DEFAULT_VD_CONFIG };
  },

  save: (config) => {
    try {
      const products = DB.getAll('products');
      const vdProd = products.find(p => p.categoryId === 'cat_vd' || p.id === 'prod_003');
      if (vdProd) {
        const updatedCostEngine = {
          ...(vdProd.costEngine || {}),
          damperConfig: config
        };
        DB.update('products', vdProd.id, { costEngine: updatedCostEngine });
        return true;
      }
    } catch (e) {
      console.error("Error saving damper config to database", e);
    }
    return false;
  }
};
