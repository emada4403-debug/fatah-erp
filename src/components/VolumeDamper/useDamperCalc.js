import { useMemo } from 'react';

/**
 * Custom hook for Volume Damper cost calculations
 * 
 * @param {Object} params
 * @param {number|string} params.width - Width of the damper
 * @param {number|string} params.height - Height of the damper
 * @param {string} params.unit - Unit of dimensions ('cm' | 'm' | 'inch')
 * @param {Object} params.config - Configuration containing weights and unit prices
 */
export function useDamperCalc({ width, height, unit, config }) {
  return useMemo(() => {
    const wVal = parseFloat(width) || 0;
    const hVal = parseFloat(height) || 0;

    // 1. Convert dimensions internally
    let width_cm = 0;
    let height_cm = 0;
    let width_m = 0;
    let height_m = 0;
    let width_inch = 0;
    let height_inch = 0;

    if (unit === 'cm') {
      width_cm = wVal;
      height_cm = hVal;
      width_m = wVal / 100;
      height_m = hVal / 100;
      width_inch = wVal / 2.54;
      height_inch = hVal / 2.54;
    } else if (unit === 'mm') {
      width_cm = wVal / 10;
      height_cm = hVal / 10;
      width_m = wVal / 1000;
      height_m = hVal / 1000;
      width_inch = (wVal / 10) / 2.54;
      height_inch = (hVal / 10) / 2.54;
    } else if (unit === 'inch') {
      width_cm = wVal * 2.54;
      height_cm = hVal * 2.54;
      width_m = (wVal * 2.54) / 100;
      height_m = (hVal * 2.54) / 100;
      width_inch = wVal;
      height_inch = hVal;
    }

    // Extract configurations
    const w_side = parseFloat(config.w_side) || 0;
    const w_ring = parseFloat(config.w_ring) || 0;
    const w_blade = parseFloat(config.w_blade) || 0;
    const w_angle = parseFloat(config.w_angle) || 0;
    
    const p_aluminum = parseFloat(config.p_aluminum) || 0;
    const p_screws = parseFloat(config.p_screws) || 0;
    const p_gear = parseFloat(config.p_gear) || 0;
    const p_handle = parseFloat(config.p_handle) || 0;
    const p_fab = parseFloat(config.p_fab) || 0;
    const margin = parseFloat(config.margin) || 0;

    // 2. Side Weight
    // sideLength_m = (height_cm + 2) / 100
    // weight_sides = sideLength_m * 2 * w_side
    const sideLength_m = (height_cm + 2) / 100;
    const weight_sides = sideLength_m * 2 * w_side;

    // 3. Ring Weight
    // weight_rings = width_m * 2 * w_ring
    const weight_rings = width_m * 2 * w_ring;

    // 4. Blades
    // n_blades = Math.floor(height_cm / 10)
    // weight_blades = n_blades * width_m * w_blade
    const n_blades = Math.floor(height_cm / 10);
    const weight_blades = n_blades * width_m * w_blade;

    // If (height_cm / 2) is NOT a whole integer -> add angle (زاوية)
    // weight_angle = 2 * w_angle * width_m
    const hasAngle = height_cm > 0 && !Number.isInteger(height_cm / 2);
    const weight_angle = hasAngle ? (2 * w_angle * width_m) : 0;

    // 5. Rib (عصب) - only if width_cm > 70
    // Same weight as Side, only used when width > 70 cm
    // n_ribs = Math.floor(width_cm / 70)
    // weight_ribs = n_ribs * height_m * w_rib  (where w_rib = w_side)
    // extra_gears = n_ribs * n_blades * 2
    const n_ribs = width_cm > 70 ? Math.floor(width_cm / 70) : 0;
    const weight_ribs = n_ribs * height_m * w_side;
    const extra_gears = n_ribs * n_blades * 2;

    // 6. Total aluminum weight
    const total_weight = weight_sides + weight_rings + weight_blades + weight_angle + weight_ribs;

    // 7. Costs and Accessories
    const cost_aluminum = total_weight * p_aluminum;
    const cost_screws = 0.045 * p_screws;
    
    const n_gears = (n_blades * 2) + extra_gears;
    const cost_gears = n_gears * p_gear;
    const cost_handle = p_handle; // 1 kit always
    
    const cost_fab = width_inch * height_inch * p_fab;

    // 8. Final Pricing
    const total_cost = cost_aluminum + cost_screws + cost_gears + cost_handle + cost_fab;
    const sale_price = total_cost * (1 + margin / 100);

    return {
      // Dimensions
      width_cm,
      height_cm,
      width_m,
      height_m,
      width_inch,
      height_inch,

      // Component outputs
      sideLength_m,
      weight_sides,
      weight_rings,
      n_blades,
      weight_blades,
      hasAngle,
      weight_angle,
      n_ribs,
      weight_ribs,
      extra_gears,

      // Totals & Costs
      total_weight,
      cost_aluminum,
      cost_screws,
      n_gears,
      cost_gears,
      cost_handle,
      cost_fab,
      total_cost,
      sale_price
    };
  }, [width, height, unit, config]);
}
