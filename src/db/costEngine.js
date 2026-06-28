import { DB } from './db.js';

export const CostEngine = {
    calculate(product) {
          if (!product) return null;
          if (product.priceOverride !== undefined && product.priceOverride !== null && product.priceOverride > 0) {
            return {
              rawTotal: 0,
              rawBreakdown: [],
              laborCost: 0,
              overheadTotal: 0,
              opsTotal: 0,
              scrapCost: 0,
              totalCost: product.priceOverride,
              margin: 0,
              finalPrice: product.priceOverride,
              marginWarning: false,
              minMargin: 0
            };
          }
          if (!product.costEngine) return null;
          const ce = product.costEngine;
          const materials = DB.getAll('raw_materials');

          // If product is a Volume Damper with damperConfig, calculate dynamically for standard 60x50 cm size
          if (ce.damperConfig || product.categoryId === 'cat_vd') {
            const config = ce.damperConfig || {
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
            
            // Standard size for display in catalog: 60x50 cm
            const wVal = 60;
            const hVal = 50;
            const width_cm = wVal;
            const height_cm = hVal;
            const width_m = wVal / 100;
            const height_m = hVal / 100;
            const width_inch = wVal / 2.54;
            const height_inch = hVal / 2.54;

            const sideLength_m = (height_cm + 2) / 100;
            const weight_sides = sideLength_m * 2 * config.w_side;
            const weight_rings = width_m * 2 * config.w_ring;
            const n_blades = Math.floor(height_cm / 10);
            const weight_blades = n_blades * width_m * config.w_blade;
            const hasAngle = height_cm > 0 && !Number.isInteger(height_cm / 2);
            const weight_angle = hasAngle ? (2 * config.w_angle * width_m) : 0;

            const n_ribs = width_cm > 70 ? Math.floor(width_cm / 70) : 0;
            const weight_ribs = n_ribs * height_m * config.w_side;
            const extra_gears = n_ribs * n_blades * 2;

            const total_weight = weight_sides + weight_rings + weight_blades + weight_angle + weight_ribs;

            const cost_aluminum = total_weight * config.p_aluminum;
            const cost_screws = 0.045 * config.p_screws;
            const n_gears = (n_blades * 2) + extra_gears;
            const cost_gears = n_gears * config.p_gear;
            const cost_handle = config.p_handle;
            const cost_fab = width_inch * height_inch * config.p_fab;

            const totalCost = cost_aluminum + cost_screws + cost_gears + cost_handle + cost_fab;
            const marginPct = config.margin !== undefined ? config.margin : (product.marginPct || 20);
            const finalPrice = totalCost * (1 + marginPct / 100);

            return {
              rawTotal: cost_aluminum,
              rawBreakdown: [],
              laborCost: cost_fab,
              overheadTotal: cost_handle + cost_screws,
              opsTotal: cost_gears,
              scrapCost: 0,
              totalCost,
              margin: marginPct,
              finalPrice,
              marginWarning: marginPct < (product.minMarginPct || 0),
              minMargin: product.minMarginPct || 0
            };
          }

      // Raw materials cost
      let rawTotal = 0;
          const rawBreakdown = (ce.rawMaterials || []).map(item => {
                  const mat = materials.find(m => m.id === item.materialId);
                  let unitCost = mat ? mat.price : 0;
                  if (mat && mat.isTaxInclusive === false) {
                            const taxRate = mat.taxRate !== undefined ? mat.taxRate : 14;
                            unitCost = unitCost * (1 + taxRate / 100);
                  }
                  const total = unitCost * (item.qty || 0);
                  rawTotal += total;
                  return {
                            ...item,
                            unitCost,
                            total,
                            matName: mat ? mat.name : '\u063a\u064a\u0631 \u0645\u062d\u062f\u062f'
                  };
          });

      // Operations cost
      const opsTotal = (ce.operations || []).reduce((s, op) => s + (op.cost || 0), 0);

      // Overhead
      const overheadTotal = (ce.overhead?.fixed || 0) + (ce.overhead?.variable || 0);

      // Labor
      const laborCost = ce.laborCost || 0;

      // Scrap and loss cost calculation
      let scrapCost = 0;
          const scrapConfig = ce.scrapConfig || {};
          if (scrapConfig.useScrap) {
                  const scrapPct = scrapConfig.scrapPct || 0;
                  const scrapSellingPrice = scrapConfig.scrapSellingPrice || 0;

            // Determine purchase price from first raw material in BOM
            let purchasePrice = 0;
                  if (ce.rawMaterials && ce.rawMaterials.length > 0) {
                            const firstMatId = ce.rawMaterials[0].materialId;
                            const firstMat = materials.find(m => m.id === firstMatId);
                            if (firstMat) {
                                        purchasePrice = firstMat.price || 0;
                                        if (firstMat.isTaxInclusive === false) {
                                                      const taxRate = firstMat.taxRate !== undefined ? firstMat.taxRate : 14;
                                                      purchasePrice = purchasePrice * (1 + taxRate / 100);
                                        }
                            }
                  }

            // Calculate unit weight
            let unitWeightKg = 0;
                  if (product.unitType === '\u0643\u062c\u0645') {
                            unitWeightKg = 1;
                  } else {
                            (ce.rawMaterials || []).forEach(item => {
                                        const mat = materials.find(m => m.id === item.materialId);
                                        if (mat && (mat.unit === '\u0643\u062c\u0645' || item.materialId.includes('galv') || item.materialId.includes('black') || item.materialId.includes('fe'))) {
                                                      unitWeightKg += (item.qty || 0);
                                        }
                            });
                            if (unitWeightKg <= 0) {
                                        unitWeightKg = product.unitType === '\u0645\u00b2' ? 11 : 10;
                            }
                  }

            const scrapCostPerKg = (scrapPct / 100) * (purchasePrice - scrapSellingPrice);
                  scrapCost = scrapCostPerKg * unitWeightKg;
          }

      // Total cost
      const totalCost = rawTotal + laborCost + overheadTotal + opsTotal + scrapCost;

      // Price with margin or direct selling price
      const finalPrice = (product.sellingPrice !== undefined && product.sellingPrice !== null && product.sellingPrice > 0) ? product.sellingPrice : totalCost * (1 + (product.marginPct || 0) / 100);

      const margin = (product.sellingPrice !== undefined && product.sellingPrice !== null && product.sellingPrice > 0) ? (totalCost > 0 ? ((product.sellingPrice - totalCost) / totalCost * 100) : 0) : (product.marginPct || 0);

      // Margin warning
      const minMargin = product.minMarginPct || 0;
          const marginWarning = margin < minMargin;

      return {
              rawTotal,
              rawBreakdown,
              laborCost,
              overheadTotal,
              opsTotal,
              scrapCost,
              totalCost,
              margin,
              finalPrice,
              marginWarning,
              minMargin,
      };
    },

    calcQuoteItem(product, qty, discountPct = 0) {
          const result = this.calculate(product);
          if (!result) return null;
          const unitPrice = result.finalPrice;
          const subtotal = unitPrice * qty;
          const discountAmt = subtotal * (discountPct / 100);
          const total = subtotal - discountAmt;
          return {
                  ...result,
                  unitPrice,
                  qty,
                  subtotal,
                  discountPct,
                  discountAmt,
                  total
          };
    },
};
