import React, { useState, useRef, useEffect } from 'react';
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

// Configure your API key
pokemon.configure({ apiKey: 'b15c5d63-aa96-46b8-9032-b4cb29ddb3f10' });

export default function DeckBuilder() {
  const [inputText, setInputText] = useState('');
  const [cardItems, setCardItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [probabilities, setProbabilities] = useState([]);
  const [anyProbability, setAnyProbability] = useState(0);
  const [showPrices, setShowPrices] = useState(true);
  const [randomHand, setRandomHand] = useState([]);
  const gridRef = useRef(null);

  // When modal opens, generate an initial random hand
  useEffect(() => {
    if (showModal) generateRandomHand();
  }, [showModal]);

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
    if (!items.length) { setError('No valid lines detected.'); return; }
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
          } catch {
            console.error(`Error fetching image for ${item.name}:`, error);
          }
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
    setCardItems(prev => prev.map((c, i) => i === idx ? { ...c, selected: !c.selected } : c));
  }
  function selectAll() { setCardItems(prev => prev.map(c => ({ ...c, selected: true })))}
  function deselectAll() { setCardItems(prev => prev.map(c => ({ ...c, selected: false })))}
  function updateCount(idx, delta) { setCardItems(prev => prev.map((c, i) => i === idx ? { ...c, count: Math.max(0, c.count + delta) } : c)); }

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

  function isSafari() { return /^((?!chrome|android).)*safari/i.test(navigator.userAgent); }

  function handleDownload() {
    if (!gridRef.current) return;
    const downloadImage = canvas => {
      const link = document.createElement('a');
      link.download = 'deck.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    if (isSafari()) {
      html2canvas(gridRef.current, { useCORS: true, backgroundColor: '#fff' })
        .then(downloadImage).catch(console.error);
    } else {
      toPng(gridRef.current, { cacheBust: true })
        .then(dataUrl => downloadImage({ toDataURL: () => dataUrl })).catch(console.error);
    }
  }

  function handleCalculate() {
    const deckSize = 60;
    const handSize = 7;
    const probs = cardItems
      .filter(c => c.selected)
      .map(c => {
        const k = c.count;
        const p1 = 1 - comb(deckSize - k, handSize) / comb(deckSize, handSize);
        const p2 = comb(k, 2) * (comb(deckSize - k, handSize - 2) / comb(deckSize, handSize));
        return { name: c.name, probabilityOne: p1, probabilityTwo: p2 };
      });
    const totalSelectedCount = cardItems.filter(c => c.selected).reduce((sum, c) => sum + c.count, 0);
    const anyProb = 1 - comb(deckSize - totalSelectedCount, handSize) / comb(deckSize, handSize);
    setProbabilities(probs);
    setAnyProbability(anyProb);
    setShowModal(true);
  }

  // Generate a random 7-card hand based on current counts
  function generateRandomHand() {
    const deckArray = cardItems.flatMap(card => Array(card.count).fill(card));
    for (let i = deckArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckArray[i], deckArray[j]] = [deckArray[j], deckArray[i]];
    }
    setRandomHand(deckArray.slice(0, 7));
  }

  const total = (cardItems.reduce((sum, c) => sum + c.market_price * c.count, 0) / 100).toFixed(2);

  return (
    <><header className="flex shadow p-4 px-12 mb-6 justify-between" style={{ backgroundColor: '#0065B0' }}>
      <h2 className="text-2xl text-white font-bungee">
        Deck Builder
      </h2>
      <a href='' className="text-2xl text-white font-bungee cursor-pointer"> Home</a>
    </header><div className="max-w-7xl mx-auto p-6 rounded-lg">
        <section className="space-y-2 mb-6">
          <h1 className="text-3xl font-semibold text-blue-700 font-baloo-2">Pokémon TCG Deck Builder</h1>
          <p className="text-gray-600 text-center my-12">Import your deck list, check live prices, and calculate opening hand odds.</p>
        </section>

        <div className="flex flex-wrap justify-between items-center mb-6">
          <div className="flex items-center gap-4 font-baloo-2">
            {showPrices && (
              <span className="text-xl font-medium text-gray-700">Total: ${total}</span>
            )}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showPrices}
                onChange={() => setShowPrices(!showPrices)} />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
            <span className="text-gray-700">{showPrices ? 'Hide Prices' : 'Show Prices'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={selectAll} className="px-4 py-2 border border-indigo-500 text-indigo-500 rounded-lg hover:bg-indigo-50 font-bungee">Select All</button>
            <button onClick={deselectAll} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 font-bungee">Deselect All</button>
            <button onClick={handleCopy} className="p-2 border border-yellow-500 text-yellow-500 rounded-lg hover:bg-yellow-50" title="Copy deck"><ClipboardIcon className="h-5 w-5" /></button>
            <button onClick={handleDownload} className="p-2 border border-green-500 text-green-500 rounded-lg hover:bg-green-50" title="Download image"><ArrowDownTrayIcon className="h-5 w-5" /></button>
          </div>
        </div>

        <textarea
          className="w-full h-48 p-3 bg-white border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 mb-4"
          placeholder="Paste deck list here..."
          value={inputText}
          onChange={e => setInputText(e.target.value)} />

        <div className="flex gap-4 mb-4">
          <button onClick={handleLoad} className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-bungee cursor-pointer">Load Cards</button>
          <button onClick={handleCalculate} className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-bungee cursor-pointer">Calculate Odds</button>
        </div>

        {loading && <p className="text-gray-500 mb-4">Loading...</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-4 mb-6">
          {cardItems.map((c, i) => (
            <div key={`${c.set}-${c.num}`} className={`relative bg-white rounded-lg p-2 text-center ${!c.selected ? 'opacity-50' : ''}`}>
              <button
                onClick={() => toggleSelect(i)}
                className={`absolute top-1 left-1 p-1 rounded-full ${c.selected ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 hover:bg-gray-400'}`}
                title={c.selected ? 'Deseleccionar' : 'Seleccionar'}
              >
                {c.selected ? <CheckIcon className="h-4 w-4 text-white" /> : <XMarkIcon className="h-4 w-4 text-white" />}
              </button>
              <button onClick={() => setCardItems(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full">
                <TrashIcon className="h-4 w-4" />
              </button>
              {showPrices && (
                <div className="mb-1 text-sm text-gray-700">${(c.market_price * c.count / 100).toFixed(2)}</div>
              )}
              {c.imgData ? (
                <img src={c.imgData} alt={c.name} className={`mx-auto mb-1 max-h-32 object-contain ${c.count === 0 ? 'filter grayscale' : ''}`} />
              ) : (
                <div className="mx-auto mb-1 h-32 w-full bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
              )}
              <div className="font-medium text-gray-800 mb-1">{c.count}</div>
              <div className="flex justify-center gap-2">
                <button onClick={() => updateCount(i, -1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">
                  <MinusSmallIcon className="h-4 w-4 text-gray-600" />
                </button>
                <button onClick={() => updateCount(i, 1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">
                  <PlusSmallIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <XCircleIcon className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Opening Hand Odds & Random Simulation</h3>

            <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
              {probabilities.map((p, idx) => (
                <div key={idx} className="flex justify-between text-gray-700 text-sm">
                  <span>{p.name}</span>
                  <span>P(≥1): {(p.probabilityOne * 100).toFixed(1)}% | P(=2): {(p.probabilityTwo * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div className="text-gray-800 font-medium mb-4">Any selected card: {(anyProbability * 100).toFixed(1)}%</div>

            {/* Random Hand Section with images */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Random 7-Card Hand</h4>
              <div className="flex flex-wrap gap-3 mb-3 justify-center">
                {randomHand.map((c, idx) => (
                  <div key={idx} className="flex flex-col items-center w-20">
                    {c.imgData ? (
                      <img src={c.imgData} alt={c.name} className="h-24 w-auto object-contain rounded" />
                    ) : (
                      <div className="h-24 w-full bg-gray-100 flex items-center justify-center text-gray-400 rounded">No Image</div>
                    )}
                    <span className="text-xs text-gray-700 mt-1 text-center">{c.name}</span>
                  </div>
                ))}
              </div>
              <button onClick={generateRandomHand} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Regenerate Hand
              </button>
            </div>
          </div>
        </div>
      )}
      </div></>
  );
}