export function macrosFromNutrients(nutrients) {
  const get = (k, fallback=0) => {
    const v = Number(nutrients?.[k] ?? nutrients?.[k.toLowerCase()] ?? fallback);
    return Number.isFinite(v) ? v : fallback;
  };
  const protein = get('protein') || get('proteins') || get('proteins_100g') || get('protein_g');
  const fat = get('fat') || get('fat_total_g') || get('fat_g') || get('fat_100g');
  const carbs = get('carbohydrates') || get('carbohydrates_total_g') || get('carbs') || get('carbohydrates_100g');
  const energyKcal = get('energy-kcal') || get('energy-kcal_100g') || get('energy_kcal') || get('calories');
  return { protein: +(protein||0), fat: +(fat||0), carbs: +(carbs||0), energyKcal: +(energyKcal||0) };
}
export function kcalFromMacros({ protein=0, fat=0, carbs=0 }) {
  return protein*4 + carbs*4 + fat*9;
}
export function defaultGoals(weightKg=75) {
  const protein = +(1.6 * weightKg).toFixed(0);
  const fat = +(0.8 * weightKg).toFixed(0);
  const kcal = 2000;
  const carbs = Math.max(0, Math.round((kcal - (protein*4 + fat*9))/4));
  return { protein, fat, carbs, energyKcal: kcal };
}
export function suggestSwap(entry) {
  const name = (entry?.name || '').toLowerCase();
  if (name.includes('crisps') || name.includes('chips')) return 'Try air-popped popcorn or baked crisps to cut fat.';
  if (name.includes('cola') || name.includes('soda')) return 'Swap to diet/zero sugar soda or sparkling water with citrus.';
  if (name.includes('fried')) return 'Opt for grilled/roasted instead of fried to reduce calories.';
  if (name.includes('chocolate')) return 'Try dark chocolate (70%+) and smaller portion.';
  if (name.includes('white bread')) return 'Swap to wholegrain bread for more fibre.';
  return 'Consider a portion tweak or a higher-protein alternative.';
}
