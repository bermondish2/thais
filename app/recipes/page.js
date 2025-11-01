'use client';
import { useEffect, useMemo, useState } from 'react';
import { macrosFromNutrients, kcalFromMacros } from '../../lib/nutrition';

function gramsFromLine(line) {
  const m = line.match(/(\d+(?:\.\d+)?)\s*(g|gram|grams|kg|ml|l|tbsp|tsp|cup|cups)?/i);
  if (!m) return 100;
  const qty = parseFloat(m[1]);
  const unit = (m[2]||'g').toLowerCase();
  const table = { g:1, gram:1, grams:1, kg:1000, ml:1, l:1000, tbsp:15, tsp:5, cup:240, cups:240 };
  return Math.round(qty * (table[unit] || 1));
}

export default function RecipesPage() {
  const [text, setText] = useState('200g chicken breast\n1 tbsp olive oil\n100g pasta\n80g tomato sauce');
  const [lines, setLines] = useState([]);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState({});
  const [choice, setChoice] = useState({});
  const [grams, setGrams] = useState({});
  const [servings, setServings] = useState(2);

  const selectedItems = useMemo(() => lines.map((_, i) => (results[i]||[])[choice[i] ?? 0]), [results, choice, lines]);

  const totals = useMemo(() => lines.reduce((acc, _, i) => {
    const g = grams[i] ?? gramsFromLine(lines[i] || '');
    const item = selectedItems[i];
    if (item) {
      const protein = (item.protein||0) * (g/100);
      const carbs = (item.carbs||0) * (g/100);
      const fat = (item.fat||0) * (g/100);
      const energyKcal = (item.energyKcal||kcalFromMacros({protein,carbs,fat}));
      acc.protein += protein; acc.carbs += carbs; acc.fat += fat; acc.energyKcal += energyKcal;
    }
    return acc;
  }, { protein:0, carbs:0, fat:0, energyKcal:0 }), [lines, grams, selectedItems]);

  const perServing = useMemo(() => ({
    protein: totals.protein / Math.max(1, servings),
    carbs: totals.carbs / Math.max(1, servings),
    fat: totals.fat / Math.max(1, servings),
    energyKcal: totals.energyKcal / Math.max(1, servings),
  }), [totals, servings]);

  async function analyze() {
    const arr = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
    setLines(arr);
    setSearching(true);
    const res = {};
    for (let i=0;i<arr.length;i++) {
      const q = encodeURIComponent(arr[i].replace(/\d+(?:\.\d+)?\s*\w*/,'').trim() || arr[i]);
      const r = await fetch(`/api/off/search?q=${q}&pageSize=5`);
      const data = await r.json();
      const items = (data.items||[]).map(it => {
        const m = macrosFromNutrients(it.nutriments||{});
        return { id: it.id, name: it.name || 'Unnamed', brand: it.brand || '', source: 'OFF', protein: m.protein||0, carbs: m.carbs||0, fat: m.fat||0, energyKcal: m.energyKcal||0 };
      });
      res[i] = items;
    }
    setResults(res);
    setSearching(false);
  }
  useEffect(() => { analyze(); }, []);

  function addToDiary() {
    const entry = { name: `Recipe (${servings} servings)`, source: 'RECIPE', ...perServing };
    const current = JSON.parse(localStorage.getItem('diary')||'[]');
    current.push(entry);
    localStorage.setItem('diary', JSON.stringify(current));
    alert('Per-serving nutrition added to diary.');
  }

  return (
    <div className="grid">
      <div className="col-8">
        <div className="card">
          <h3>Recipe analysis</h3>
          <p className="small">Paste ingredients, one per line. We will match each to Open Food Facts and estimate macros. Adjust matches and grams if needed.</p>
          <textarea className="input" rows={8} value={text} onChange={e=>setText(e.target.value)} />
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <button className="btn" onClick={analyze} disabled={searching}>{searching?'Analyzing…':'Analyze'}</button>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <label className="small">Servings</label>
              <input type="number" className="input" style={{maxWidth:100}} value={servings} onChange={e=>setServings(parseInt(e.target.value||'1',10))}/>
            </div>
          </div>
        </div>
        <div style={{height:12}}/>
        {lines.map((ln, idx) => (
          <div className="card" key={idx}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <strong>Ingredient {idx+1}:</strong> <span className="small">{ln}</span>
            </div>
            <div style={{display:'flex', gap:8, marginTop:8}}>
              <label className="small">Grams</label>
              <input type="number" className="input" style={{maxWidth:120}} value={grams[idx] ?? gramsFromLine(ln)} onChange={e=>setGrams(g => ({...g, [idx]: parseInt(e.target.value||'0',10)}))} />
            </div>
            <div style={{marginTop:8}}>
              <label className="small">Match</label>
              <select className="select" value={choice[idx] ?? 0} onChange={e=>setChoice(c => ({...c, [idx]: parseInt(e.target.value,10)}))}>
                {(results[idx]||[]).map((it, i) => (
                  <option key={i} value={i}>
                    {it.name} {it.brand?`· ${it.brand}`:''} — P:{(it.protein||0).toFixed(1)}/C:{(it.carbs||0).toFixed(1)}/F:{(it.fat||0).toFixed(1)} per 100g
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
      <div className="col-4">
        <div className="card">
          <h3>Totals</h3>
          <table className="table"><tbody>
            <tr><td>Protein</td><td>{totals.protein.toFixed(1)} g</td></tr>
            <tr><td>Carbs</td><td>{totals.carbs.toFixed(1)} g</td></tr>
            <tr><td>Fat</td><td>{totals.fat.toFixed(1)} g</td></tr>
            <tr><td>Energy</td><td>{totals.energyKcal.toFixed(0)} kcal</td></tr>
          </tbody></table>
        </div>
        <div style={{height:12}}/>
        <div className="card">
          <h3>Per serving ({servings})</h3>
          <table className="table"><tbody>
            <tr><td>Protein</td><td>{perServing.protein.toFixed(1)} g</td></tr>
            <tr><td>Carbs</td><td>{perServing.carbs.toFixed(1)} g</td></tr>
            <tr><td>Fat</td><td>{perServing.fat.toFixed(1)} g</td></tr>
            <tr><td>Energy</td><td>{perServing.energyKcal.toFixed(0)} kcal</td></tr>
          </tbody></table>
          <button className="btn secondary" onClick={addToDiary}>Add per serving to diary</button>
          <p className="small">OFF values are typically per 100g; grams parser is heuristic—adjust grams/matches for accuracy.</p>
        </div>
      </div>
    </div>
  );
}
