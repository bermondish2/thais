'use client';
import { useEffect, useRef, useState } from 'react';
import { macrosFromNutrients, kcalFromMacros } from '../../lib/nutrition';

export default function ScanPage() {
  const videoRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [supported, setSupported] = useState(false);
  const [detector, setDetector] = useState(null);
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const ok = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    setSupported(ok);
    if (ok) setDetector(new window.BarcodeDetector({ formats: ['ean_13','ean_8','upc_e','upc_a','code_128'] }));
  }, []);

  async function start() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
        tick();
      }
    } catch (e) { setError(e.message || 'Camera access failed'); }
  }
  function stop() {
    if (videoRef.current && videoRef.current.srcObject) {
      for (const track of videoRef.current.srcObject.getTracks()) track.stop();
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  }
  async function tick() {
    if (!streaming) return;
    await new Promise(r => setTimeout(r, 200));
    try {
      if (detector && videoRef.current) {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const value = barcodes[0].rawValue || barcodes[0].rawValue;
          if (value) { stop(); onBarcode(value); return; }
        }
      }
    } catch (e) { /* ignore */ }
    requestAnimationFrame(tick);
  }
  async function onBarcode(code) {
    setBarcode(code); setError(''); setProduct(null);
    try {
      const r = await fetch(`/api/off/product/${encodeURIComponent(code)}`);
      const data = await r.json();
      if (data && data.product) setProduct(data.product);
      else setError('No product found for barcode');
    } catch (e) { setError(e.message || 'Lookup failed'); }
  }
  function addToDiaryFromProduct(p) {
    const n = p?.nutriments || {};
    const m = macrosFromNutrients(n);
    const entry = { name: `${p.product_name || 'Product'} (${barcode})`, source: 'OFF', protein: m.protein||0, carbs: m.carbs||0, fat: m.fat||0, energyKcal: m.energyKcal || kcalFromMacros(m) };
    const current = JSON.parse(localStorage.getItem('diary')||'[]');
    current.push(entry);
    localStorage.setItem('diary', JSON.stringify(current));
    alert('Product added to diary (per 100g). Adjust portion if needed.');
  }

  return (
    <div className="grid">
      <div className="col-8">
        <div className="card">
          <h3>Scan a barcode</h3>
          <p className="small">Uses your camera to detect barcodes (EAN/UPC) and fetches product nutrition from Open Food Facts.</p>
          {!supported && <p className="small" style={{color:'#f59e0b'}}>Your browser doesn’t support the native Barcode Detector API. Try Chrome/Edge on Android, or enter a barcode below.</p>}
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <video ref={videoRef} style={{width:'100%', maxHeight:360, background:'#000', borderRadius:10}} playsInline muted />
            <div style={{display:'flex', gap:8}}>
              <button className="btn" onClick={start} disabled={!supported || streaming}>{streaming?'Scanning…':'Start scan'}</button>
              <button className="btn secondary" onClick={stop} disabled={!streaming}>Stop</button>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <label className="small">Or enter barcode manually</label>
            <div style={{display:'flex', gap:8}}>
              <input className="input" placeholder="e.g. 5000159484695" value={barcode} onChange={e=>setBarcode(e.target.value)} />
              <button className="btn secondary" onClick={()=>onBarcode(barcode)} disabled={!barcode}>Lookup</button>
            </div>
          </div>
          {error && <p style={{color:'#ef4444'}}>{error}</p>}
        </div>
        {product && <div style={{height:12}}/>}
        {product && (
          <div className="card">
            <h3>{product.product_name || 'Product'} <span className="tag">OFF</span></h3>
            <p className="small">{product.brands} · {product.countries}</p>
            <table className="table"><tbody>
              <tr><td>Protein (100g)</td><td>{(product.nutriments?.proteins_100g ?? 0).toFixed(1)} g</td></tr>
              <tr><td>Carbs (100g)</td><td>{(product.nutriments?.carbohydrates_100g ?? 0).toFixed(1)} g</td></tr>
              <tr><td>Fat (100g)</td><td>{(product.nutriments?.fat_100g ?? 0).toFixed(1)} g</td></tr>
              <tr><td>Energy</td><td>{(product.nutriments?.['energy-kcal_100g'] ?? product.nutriments?.energy_kcal ?? 0).toFixed(0)} kcal</td></tr>
            </tbody></table>
            <button className="btn" onClick={()=>addToDiaryFromProduct(product)}>Add (per 100g) to diary</button>
            <p className="small">Tip: After adding, adjust portion size in the diary entry.</p>
          </div>
        )}
      </div>
      <div className="col-4">
        <div className="card">
          <h3>How it works</h3>
          <ol>
            <li>Grant camera permission</li>
            <li>We use <code>BarcodeDetector</code> to read the code</li>
            <li>We call <code>/api/off/product/&lt;barcode&gt;</code> to fetch nutrition</li>
          </ol>
          <p className="small">If detection isn’t supported, enter the barcode manually.</p>
        </div>
      </div>
    </div>
  );
}
