'use client';
import { useEffect, useMemo, useState } from 'react';
import { macrosFromNutrients, kcalFromMacros, defaultGoals, suggestSwap } from '../lib/nutrition';

export default function HomePage() {
  const [q, setQ] = useState('chicken sandwich');
  const [source, setSource] = useState('OFF');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [diary, setDiary] = useState([]);
  const [weight, setWeight] = useState(75);
  const goals = useMemo(() => defaultGoals(weight), [weight]);
  const totals = useMemo(() => diary.reduce((a, it) => ({ protein:a.protein+it.protein, fat:a.fat+it.fat, carbs:a.carbs+it.carbs, energyKcal:a.energyKcal+(it.energyKcal||kcalFromMacros(it)) }), { protein:0, fat:0, carbs:0, energyKcal:0 }), [diary]);

  useEffect(() => { const saved = localStorage.getItem('diary'); if (saved) setDiary(JSON.parse(saved)); }, []);
  useEffect(() => { localStorage.setItem('diary', JSON.stringify(diary)); }, [diary]);

  async function searchFoods(e) {
    e?.preventDefault();
    setLoading(true); setError('');
    try {
      const endpoint = source === 'OFF' ? `/api/off/search?q=${encodeURIComponent(q)}` : `/api/fdc/search?q=${encodeURIComponent(q)}`;
      const r = await fetch(endpoint);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Search failed');
      const normalized = (data.items || []).map(it => {
        if (source === 'OFF') {
          const m = macrosFromNutrients(it.nutriments||{});
          return { id: it.id, name: it.name || 'Unnamed product', brand: it.brand, source: it.source, ...m };
        } else {
          const m = it.nutrients || {};
          return { id: it.id, name: it.name, brand: it.brand, source: it.source, protein: m.protein||0, fat: m.fat||0, carbs: m.carbohydrates||0, energyKcal: m.energy_kcal||0 };
        }
      });
      setItems(normalized);
    } catch (err) { setError(err.message || 'Search failed'); }
    finally { setLoading(false); }
  }
  function addToDiary(it) { setDiary(d => [...d, { name: it.name, source: it.source, protein: it.protein||0, fat: it.fat||0, carbs: it.carbs||0, energyKcal: it.energyKcal||kcalFromMacros(it) }]); }
  function clearDiary() { setDiary([]); }
  useEffect(() => { searchFoods(); }, []);

  return (
    <div className="grid">
      <div className="col-8">
        <div className="card">
          <form onSubmit={searchFoods} style={{display:'flex', gap:12}}>
            <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search foods or meals (e.g., 'Tesco chicken wrap')" />
            <div className="segmented" role="group" aria-label="Source">
              <button type="button" aria-pressed={source==='OFF'} onClick={()=>setSource('OFF')}>OFF</button>
              <button type="button" aria-pressed={source==='FDC'} onClick={()=>setSource('FDC')}>FDC</button>
            </div>
            <button className="btn" disabled={loading}>{loading?'Searching...':'Search'}</button>
          </form>
          {error && <p style={{color:'#ef4444', marginTop:8}}>{error}</p>}
        </div>
        <div style={{height:12}}/>
        <div className="card">
          <h3>Results</h3>
          <table className="table">
            <thead><tr><th>Name</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Kcal</th><th/></tr></thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td>{it.name} <span className="tag">{it.source}</span></td>
                  <td>{(it.protein||0).toFixed(1)} g</td>
                  <td>{(it.carbs||0).toFixed(1)} g</td>
                  <td>{(it.fat||0).toFixed(1)} g</td>
                  <td>{(it.energyKcal||kcalFromMacros(it)).toFixed(0)}</td>
                  <td><button className="btn secondary" onClick={()=>addToDiary(it)}>Add</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length===0 && <p className="small">No results yet. Try another query.</p>}
        </div>
      </div>
      <div className="col-4">
        <div className="card">
          <h3>Goals</h3>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <label className="small">Weight (kg)</label>
            <input type="number" className="input" value={weight} onChange={e=>setWeight(parseInt(e.target.value||'75',10))} style={{maxWidth:120}}/>
          </div>
          <p className="small">Defaults: protein 1.6g/kg, fat 0.8g/kg, ~2000 kcal target; carbs remainder.</p>
          <table className="table"><tbody>
            <tr><td>Protein</td><td>{goals.protein} g</td></tr>
            <tr><td>Carbs</td><td>{goals.carbs} g</td></tr>
            <tr><td>Fat</td><td>{goals.fat} g</td></tr>
            <tr><td>Energy</td><td>{goals.energyKcal} kcal</td></tr>
          </tbody></table>
        </div>
        <div style={{height:12}}/>
        <div className="card">
          <h3>Today’s Diary</h3>
          <table className="table">
            <thead><tr><th>Item</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Kcal</th></tr></thead>
            <tbody>
              {diary.map((d, i) => (
                <tr key={i}>
                  <td title={suggestSwap(d)}>{d.name}</td>
                  <td>{(d.protein||0).toFixed(1)} g</td>
                  <td>{(d.carbs||0).toFixed(1)} g</td>
                  <td>{(d.fat||0).toFixed(1)} g</td>
                  <td>{(d.energyKcal || kcalFromMacros(d)).toFixed(0)}</td>
                </tr>
              ))}
              {diary.length>0 && <tr>
                <td><strong>Total</strong></td>
                <td><strong>{totals.protein.toFixed(1)} g</strong></td>
                <td><strong>{totals.carbs.toFixed(1)} g</strong></td>
                <td><strong>{totals.fat.toFixed(1)} g</strong></td>
                <td><strong>{totals.energyKcal.toFixed(0)}</strong></td>
              </tr>}
            </tbody>
          </table>
          <button className="btn secondary" onClick={clearDiary}>Clear</button>
          <div style={{height:8}}/>
          <p className="small">
            Coaching tip: {totals.energyKcal > goals.energyKcal ? 'You are over target calories; consider a lower-fat swap.' : 'You are within target calories; keep protein high and watch added sugars.'}
          </p>
        </div>
      </div>
    </div>
  );
}
