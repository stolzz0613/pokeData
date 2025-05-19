import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas-pro';
import pokemon from 'pokemontcgsdk';
import {
  ClipboardIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  MinusSmallIcon,
  PlusSmallIcon,
  CheckIcon,
  XMarkIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

// Configura tu API key
pokemon.configure({ apiKey: 'b15c5d63-aa96-46b8-9032-b4c29ddb3f10' });

export default function DeckParser() {
  const [inputText, setInputText] = useState('');
  const [cardItems, setCardItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [probabilities, setProbabilities] = useState([]);
  const [anyProbability, setAnyProbability] = useState(0);
  const gridRef = useRef(null);

  function parseInput(text) {
    const lines = text.split('\n');
    let currentSection = '';
    const items = [];
    for (let raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const header = line.match(/^([^:]+):\s*\d+/);
      if (header) { currentSection = header[1]; continue; }
      const parts = line.split(/\s+/);
      const count = parseInt(parts[0], 10);
      const set = parts[parts.length - 2];
      const num = parseInt(parts[parts.length - 1], 10);
      const name = parts.slice(1, parts.length - 2).join(' ');
      items.push({ count, name, set, num, section: currentSection, selected: true });
    }
    return items;
  }

  function comb(n, k) {
    if (k > n || k < 0) return 0;
    let res = 1;
    for (let i = 1; i <= k; i++) res *= (n - k + i) / i;
    return res;
  }

  async function handleLoad() {
    setError(null);
    const items = parseInput(inputText);
    if (!items.length) { setError('No se detectaron líneas válidas.'); return; }
    setLoading(true);
    try {
      const qPrice = items.map(i => `${i.set}~${i.num}`).join(',');
      const resPrice = await fetch(`https://limitlesstcg.com/api/labs/cards?q=${encodeURIComponent(qPrice)}`);
      if (!resPrice.ok) throw new Error(`HTTP ${resPrice.status}`);
      const priceData = await resPrice.json();

      const codes = [...new Set(items.map(i => i.set))];
      const codeToId = {};
      await Promise.all(codes.map(async code => {
        const resSet = await pokemon.set.where({ q: `legalities.standard:legal ptcgoCode:${code}` });
        const arr = Array.isArray(resSet.data) ? resSet.data : [];
        const setObj = arr.find(s => s.ptcgoCode === code);
        if (setObj) codeToId[code] = setObj.id;
      }));

      const enriched = await Promise.all(items.map(async item => {
        const priceEntry = priceData.find(p => p.set === item.set && p.number === String(item.num));
        const market_price = priceEntry?.market_price ?? 0;
        const setId = codeToId[item.set];
        let sdkCard = null;
        if (setId) {
          const resCard = await pokemon.card.where({ q: `set.id:${setId} number:${item.num}` });
          const arr = Array.isArray(resCard.data) ? resCard.data : [];
          sdkCard = arr[0] || null;
        }
        let imgData = '';
        const imageUrl = sdkCard?.images?.small;
        if (imageUrl) {
          try {
            const blob = await fetch(imageUrl).then(r => r.blob());
            imgData = await new Promise(resolve => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          } catch {}
        }
        return { ...item, market_price, imgData };
      }));

      setCardItems(enriched);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(idx) {
    setCardItems(prev =>
      prev.map((c, i) => i === idx ? { ...c, selected: !c.selected } : c)
    );
  }

  function selectAll() {
    setCardItems(prev => prev.map(c => ({ ...c, selected: true })));
  }

  function deselectAll() {
    setCardItems(prev => prev.map(c => ({ ...c, selected: false })));
  }

  function updateCount(idx, delta) {
    setCardItems(prev =>
      prev.map((c, i) =>
        i === idx ? { ...c, count: Math.max(0, c.count + delta) } : c
      )
    );
  }

  function handleCopy() {
    const order = ['Pokémon', 'Trainer', 'Energy'];
    const lines = [];
    order.forEach(sec => {
      const group = cardItems.filter(c => c.section === sec);
      if (!group.length) return;
      const total = group.reduce((s, c) => s + c.count, 0);
      lines.push(`${sec}: ${total}`);
      group.forEach(c => lines.push(`${c.count} ${c.name} ${c.set} ${c.num}`));
      lines.push('');
    });
    navigator.clipboard.writeText(lines.join('\n').trim()).catch(() => {});
  }

  function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  function handleDownload() {
    if (!gridRef.current) return;
    if (isSafari()) {
      html2canvas(gridRef.current, { useCORS: true, backgroundColor: '#fff' })
        .then(canvas => {
          const link = document.createElement('a');
          link.download = 'deck.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        })
        .catch(console.error);
    } else {
      toPng(gridRef.current, { cacheBust: true })
        .then(dataUrl => {
          const link = document.createElement('a');
          link.download = 'deck.png';
          link.href = dataUrl;
          link.click();
        })
        .catch(console.error);
    }
  }

  function handleCalculate() {
    const deckSize = 60;
    const handSize = 7;

    // Probabilidades individuales
    const probs = cardItems
      .filter(c => c.selected)
      .map(c => {
        const k = c.count;
        const p1 = 1 - comb(deckSize - k, handSize) / comb(deckSize, handSize);
        const p2 = comb(k, 2) * (comb(deckSize - k, handSize - 2) / comb(deckSize, handSize));
        return { name: c.name, probabilityOne: p1, probabilityTwo: p2 };
      });

    // Probabilidad de al menos una entre todas seleccionadas
    const totalSelectedCount = cardItems
      .filter(c => c.selected)
      .reduce((sum, c) => sum + c.count, 0);
    const anyProb = 1 - comb(deckSize - totalSelectedCount, handSize) / comb(deckSize, handSize);

    setProbabilities(probs);
    setAnyProbability(anyProb);
    setShowModal(true);
  }

  const total = (cardItems.reduce((sum, c) => sum + c.market_price * c.count, 0) / 100).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-bold">Precio total: ${total}</h2>
        <div className="flex gap-2">
          <button onClick={selectAll} className="px-3 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
            Seleccionar todo
          </button>
          <button onClick={deselectAll} className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Deseleccionar todo
          </button>
          <button onClick={handleCopy} className="p-2 bg-yellow-500 rounded hover:bg-yellow-600" title="Copiar deck">
            <ClipboardIcon className="h-6 w-6 text-white"/>
          </button>
          <button onClick={handleDownload} className="p-2 bg-green-500 rounded hover:bg-green-600" title="Descargar imagen">
            <ArrowDownTrayIcon className="h-6 w-6 text-white"/>
          </button>
        </div>
      </div>

      {/* Input & Controls */}
      <textarea
        className="w-full h-48 p-2 font-mono text-sm border border-gray-300 rounded"
        placeholder="Pega aquí tu decklist…"
        value={inputText}
        onChange={e => setInputText(e.target.value)}
      />
      <div className="mt-2 flex gap-2">
        <button onClick={handleLoad} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Cargar cartas
        </button>
        <button onClick={handleCalculate} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
          Calcular %
        </button>
      </div>
      {loading && <p className="mt-2">Cargando…</p>}
      {error && <p className="mt-2 text-red-600">{error}</p>}

      {/* Grid of Cards */}
      <div ref={gridRef} className="mt-6 grid grid-cols-3 md:grid-cols-8 gap-4 bg-white p-4 rounded">
        {cardItems.map((c, i) => (
          <div key={`${c.set}-${c.num}`} className={`relative text-center ${!c.selected ? 'opacity-50' : ''}`}>
            {/* Selection Toggle */}
            <button
              onClick={() => toggleSelect(i)}
              className={`absolute top-1 left-1 p-1 rounded-full ${c.selected ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 hover:bg-gray-400'}`}
              title={c.selected ? 'Deseleccionar' : 'Seleccionar'}
            >
              {c.selected ? <CheckIcon className="h-4 w-4 text-white"/> : <XMarkIcon className="h-4 w-4 text-white"/>}
            </button>
            {/* Remove */}
            <button
              onClick={() => setCardItems(prev => prev.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600"
              title="Eliminar carta"
            >
              <TrashIcon className="h-4 w-4 text-white"/>
            </button>
            {/* Price */}
            <div className="mb-1 bg-white bg-opacity-80 text-xs py-1">
              ${(c.market_price * c.count / 100).toFixed(2)}
            </div>
            {/* Image */}
            {c.imgData ? (
              <img
                src={c.imgData}
                alt={c.name}
                className={`mx-auto max-w-[100px] md:max-w-[136px] md:max-h-[189px] object-contain ${c.count === 0 ? 'filter grayscale' : ''}`}
              />
            ) : (
              <div className="mx-auto w-[136px] h-[189px] bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                Sin imagen
              </div>
            )}
            {/* Count Controls */}
            <div className="mt-1 font-bold">{c.count}</div>
            <div className="mt-1 flex justify-center gap-1">
              <button
                onClick={() => updateCount(i, -1)}
                className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
              >
                <MinusSmallIcon className="h-6 w-6 text-gray-600"/>
              </button>
              <button
                onClick={() => updateCount(i, +1)}
                className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
              >
                <PlusSmallIcon className="h-6 w-6 text-gray-600"/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full"
            >
              <XCircleIcon className="h-6 w-6 text-gray-600"/>
            </button>
            <h3 className="text-lg font-bold mb-4">Probabilidades primera mano</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {probabilities.map((p, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span>
                    P(≥1): {(p.probabilityOne * 100).toFixed(2)}% | P(=2): {(p.probabilityTwo * 100).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 font-bold text-sm">
              P(alguna seleccionada): {(anyProbability * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
