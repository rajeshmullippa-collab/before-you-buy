// Ingredient knowledge base: which actives address which YouCam skin concerns.
// Strength: 3 = well-evidenced primary active, 2 = good supporting active, 1 = mild help.
// Keys of `targets` are YouCam SD action names.
export const CONCERN_LABELS = {
  acne: 'Acne', redness: 'Redness', oiliness: 'Oiliness', pore: 'Pores', texture: 'Texture',
  wrinkle: 'Fine lines', age_spot: 'Dark spots', radiance: 'Dullness', moisture: 'Dehydration',
  dark_circle_v2: 'Dark circles', eye_bag: 'Eye bags', firmness: 'Firmness'
};

export const ACTIVES = [
  { name: 'Salicylic acid (BHA)', match: ['salicylic acid', 'bha', 'betaine salicylate', 'willow bark'], targets: { acne: 3, pore: 3, oiliness: 2, texture: 2 } },
  { name: 'Benzoyl peroxide', match: ['benzoyl peroxide'], targets: { acne: 3 } },
  { name: 'Adapalene / retinoids', match: ['adapalene', 'retinol', 'retinal', 'retinaldehyde', 'retinyl', 'hydroxypinacolone retinoate', 'tretinoin'], targets: { wrinkle: 3, texture: 3, acne: 2, pore: 2, age_spot: 2, firmness: 2 } },
  { name: 'Bakuchiol', match: ['bakuchiol'], targets: { wrinkle: 2, texture: 1, acne: 1, firmness: 1 } },
  { name: 'Azelaic acid', match: ['azelaic acid', 'potassium azeloyl diglycinate'], targets: { acne: 3, redness: 3, age_spot: 2, texture: 1 } },
  { name: 'Niacinamide', match: ['niacinamide', 'nicotinamide'], targets: { oiliness: 3, pore: 2, redness: 2, age_spot: 2, acne: 2, radiance: 1, moisture: 1 } },
  { name: 'Zinc PCA', match: ['zinc pca', 'zinc gluconate', 'zinc oxide'], targets: { oiliness: 2, acne: 2, redness: 1 } },
  { name: 'Sulfur', match: ['sulfur', 'sulphur'], targets: { acne: 2, oiliness: 1 } },
  { name: 'Tea tree oil', match: ['melaleuca alternifolia', 'tea tree'], targets: { acne: 1 } },
  { name: 'Clay', match: ['kaolin', 'bentonite', 'clay'], targets: { oiliness: 2, pore: 1 } },
  { name: 'Glycolic acid (AHA)', match: ['glycolic acid'], targets: { texture: 3, radiance: 3, age_spot: 2, pore: 1, wrinkle: 1 } },
  { name: 'Lactic acid (AHA)', match: ['lactic acid'], targets: { texture: 2, radiance: 2, moisture: 1, age_spot: 1 } },
  { name: 'Mandelic acid (AHA)', match: ['mandelic acid'], targets: { texture: 2, acne: 1, age_spot: 1, radiance: 1 } },
  { name: 'PHA (gluconolactone)', match: ['gluconolactone', 'lactobionic acid'], targets: { texture: 2, moisture: 1, radiance: 1 } },
  { name: 'Vitamin C', match: ['ascorbic acid', 'ascorbyl', 'ascorbate', 'ethyl ascorbic', 'vitamin c'], targets: { radiance: 3, age_spot: 3, wrinkle: 1, firmness: 1 } },
  { name: 'Tranexamic acid', match: ['tranexamic acid'], targets: { age_spot: 3, redness: 1 } },
  { name: 'Alpha arbutin', match: ['arbutin'], targets: { age_spot: 3 } },
  { name: 'Kojic acid', match: ['kojic acid'], targets: { age_spot: 2 } },
  { name: 'Licorice root', match: ['glycyrrhiza', 'licorice', 'dipotassium glycyrrhizate'], targets: { age_spot: 2, redness: 2 } },
  { name: 'Centella asiatica', match: ['centella', 'madecassoside', 'asiaticoside', 'cica'], targets: { redness: 3, moisture: 1 } },
  { name: 'Allantoin', match: ['allantoin'], targets: { redness: 1, texture: 1 } },
  { name: 'Panthenol (B5)', match: ['panthenol'], targets: { redness: 2, moisture: 2 } },
  { name: 'Green tea / EGCG', match: ['camellia sinensis', 'green tea', 'egcg'], targets: { redness: 2, oiliness: 1 } },
  { name: 'Oat (colloidal)', match: ['avena sativa', 'colloidal oatmeal'], targets: { redness: 2, moisture: 1 } },
  { name: 'Hyaluronic acid', match: ['hyaluronic acid', 'sodium hyaluronate', 'hyaluronate'], targets: { moisture: 3, wrinkle: 1 } },
  { name: 'Glycerin', match: ['glycerin', 'glycerol'], targets: { moisture: 2 } },
  { name: 'Ceramides', match: ['ceramide'], targets: { moisture: 3, redness: 1 } },
  { name: 'Squalane', match: ['squalane'], targets: { moisture: 2 } },
  { name: 'Urea', match: ['urea'], targets: { moisture: 2, texture: 1 } },
  { name: 'Peptides', match: ['peptide', 'palmitoyl', 'matrixyl', 'argireline', 'acetyl hexapeptide', 'copper tripeptide'], targets: { wrinkle: 2, firmness: 3, eye_bag: 1 } },
  { name: 'Caffeine', match: ['caffeine'], targets: { eye_bag: 3, dark_circle_v2: 2 } },
  { name: 'Vitamin K', match: ['phytonadione', 'vitamin k'], targets: { dark_circle_v2: 2 } },
  { name: 'Resveratrol', match: ['resveratrol'], targets: { radiance: 1, wrinkle: 1 } }
];

// Things that work against a concern. Penalty weight 1–3.
export const CAUTIONS = [
  { name: 'Fragrance', match: ['fragrance', 'parfum', 'linalool', 'limonene', 'citral', 'geraniol', 'eugenol'], against: { redness: 2, acne: 1 }, why: 'Fragrance is a common irritant for reactive, red skin.' },
  { name: 'Essential oils', match: ['lavandula', 'lavender oil', 'peppermint', 'mentha piperita', 'citrus aurantium', 'eucalyptus'], against: { redness: 2 }, why: 'Essential oils can trigger redness and sensitivity.' },
  { name: 'Drying alcohol', match: ['alcohol denat', 'denatured alcohol', 'sd alcohol', 'isopropyl alcohol'], against: { moisture: 2, redness: 2 }, why: 'High-up drying alcohols can strip a weak moisture barrier.' },
  { name: 'Pore-clogging oils & esters', match: ['coconut oil', 'cocos nucifera', 'isopropyl myristate', 'isopropyl palmitate', 'cocoa butter', 'theobroma cacao', 'lanolin', 'algae extract', 'laureth-4'], against: { acne: 3, pore: 2, oiliness: 1 }, why: 'Rated comedogenic: can clog pores and feed breakouts.' },
  { name: 'Heavy occlusives', match: ['petrolatum', 'mineral oil', 'paraffinum liquidum', 'shea butter', 'butyrospermum parkii'], against: { oiliness: 1, acne: 1 }, why: 'Rich occlusives can feel heavy on oily, breakout-prone skin.' }
];

export function parseIngredients(text) {
  return text
    .replace(/\(.*?\)/g, m => m.replace(/,/g, ' ')) // keep parenthetical names together
    .split(/[,\n;•·]+/)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

// Earlier ingredients are present in higher amounts; weight them more.
function positionWeight(idx, total) {
  if (idx < 5) return 1;
  if (idx < Math.max(10, total * 0.5)) return 0.8;
  return 0.6; // actives are often effective at low %, so never discount to zero
}

export function findMatches(list, table) {
  const found = [];
  table.forEach(entry => {
    const idx = list.findIndex(ing => entry.match.some(m => ing.includes(m)));
    if (idx !== -1) found.push({ ...entry, position: idx, weight: positionWeight(idx, list.length), raw: list[idx] });
  });
  return found;
}

// concerns: [{ key, severity (0–100, higher = worse) }] sorted most severe first.
export function scoreProduct(ingredientText, concerns) {
  const list = parseIngredients(ingredientText);
  const actives = findMatches(list, ACTIVES);
  const cautions = findMatches(list, CAUTIONS);
  const top = concerns.slice(0, 4);
  const totalSev = top.reduce((s, c) => s + c.severity, 0) || 1;

  const perConcern = top.map(c => {
    let coverage = 0; const by = [];
    actives.forEach(a => {
      const st = a.targets[c.key];
      if (st) { coverage += st * a.weight; by.push(a.name); }
    });
    let penalty = 0; const hurt = [];
    cautions.forEach(x => {
      const p = x.against[c.key];
      if (p) { penalty += p * x.weight; hurt.push(x.name); }
    });
    const cov = Math.min(1, coverage / 4); // a strong active plus support fully covers a concern
    const pen = Math.min(1, penalty / 3);
    return { ...c, coverage: cov, penalty: pen, by, hurt };
  });

  const raw = perConcern.reduce((s, c) => s + c.severity * (c.coverage - 0.6 * c.penalty), 0) / totalSev;
  const score = Math.max(0, Math.min(100, Math.round(raw * 100)));
  const verdict = score >= 65 ? { label: 'Good match', tone: 'good', text: 'Its actives go after your top concerns.' }
    : score >= 35 ? { label: 'Partial match', tone: 'mid', text: 'Helps some of your concerns, misses others.' }
    : { label: 'Poor match', tone: 'bad', text: 'Little here targets what your scan found.' };
  return { score, verdict, perConcern, actives, cautions, count: list.length };
}
