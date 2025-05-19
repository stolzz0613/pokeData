import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import pokemon from 'pokemontcgsdk';
import {
  ClipboardIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  MinusSmallIcon,
  PlusSmallIcon
} from '@heroicons/react/24/outline';

// Configura tu API key
pokemon.configure({ apiKey: 'b15c5d63-aa96-46b8-9032-b4c29ddb3f10' });

export default function DeckParser() {
  const [inputText, setInputText] = useState('');
  const [cardItems, setCardItems] = useState([]); // enriched items
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const gridRef = useRef(null);

  function parseInput(text) {
    const lines = text.split('\n');
    let currentSection = '';
    const items = [];
    for (let raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const header = line.match(/^([^:]+):\s*\d+/);
      if (header) {
        currentSection = header[1];
        continue;
      }
      const parts = line.split(/\s+/);
      const count = parseInt(parts[0], 10);
      const set = parts[parts.length - 2];
      const num = parseInt(parts[parts.length - 1], 10);
      const name = parts.slice(1, parts.length - 2).join(' ');
      items.push({ count, name, set, num, section: currentSection });
    }
    return items;
  }

  async function handleLoad() {
    setError(null);
    const items = parseInput(inputText);
    if (!items.length) {
      setError('No se detectaron líneas válidas.');
      return;
    }
    setLoading(true);
    try {
      // 1) Obtener precios de limitlesstcg
      const qPrice = items.map(i => `${i.set}~${i.num}`).join(',');
      const resPrice = await fetch(
        `https://limitlesstcg.com/api/labs/cards?q=${encodeURIComponent(qPrice)}`
      );
      if (!resPrice.ok) throw new Error(`HTTP ${resPrice.status}`);
      const priceData = await resPrice.json(); 
      // priceData: [{ set, number, market_price }, ...]

      // 2) Mapear cada ptcgoCode a su id interno
      const codes = [...new Set(items.map(i => i.set))];
      const codeToId = {};
      await Promise.all(codes.map(async code => {
        const resSet = await pokemon.set.where({
          q: `legalities.standard:legal ptcgoCode:${code}`
        });
        const arr = Array.isArray(resSet.data) ? resSet.data : [];
        const setObj = arr.find(s => s.ptcgoCode === code);
        if (setObj) codeToId[code] = setObj.id;
      }));

      // 3) Enriquecer cada item con imagen y precio
      const enriched = await Promise.all(items.map(async item => {
        // precio en centavos
        const priceEntry = priceData.find(
          p => p.set === item.set && p.number === String(item.num)
        );
        const market_price = priceEntry?.market_price ?? 0;

        // buscar carta en SDK
        const setId = codeToId[item.set];
        let sdkCard = null;
        if (setId) {
          const resCard = await pokemon.card.where({
            q: `set.id:${setId} number:${item.num}`
          });
          const arrCard = Array.isArray(resCard.data) ? resCard.data : [];
          sdkCard = arrCard[0] || null;
        }

        // convertir imagen pequeña a Data-URL
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
            imgData = '';
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

  function updateCount(idx, delta) {
    setCardItems(prev =>
      prev.map((c, i) =>
        i === idx ? { ...c, count: Math.max(0, c.count + delta) } : c
      )
    );
  }

  function removeCard(idx) {
    setCardItems(prev => prev.filter((_, i) => i !== idx));
  }

  function handleCopy() {
    const order = ['Pokémon', 'Trainer', 'Energy'];
    const lines = [];
    order.forEach(sec => {
      const group = cardItems.filter(c => c.section === sec);
      if (!group.length) return;
      const total = group.reduce((s, c) => s + c.count, 0);
      lines.push(`${sec}: ${total}`);
      group.forEach(c => {
        lines.push(`${c.count} ${c.name} ${c.set} ${c.num}`);
      });
      lines.push('');
    });
    navigator.clipboard.writeText(lines.join('\n').trim())
      .then(() => {})
      .catch(() => {});
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

  const total = (
    cardItems.reduce((sum, c) => sum + c.market_price * c.count, 0)
    / 100
  ).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Precio total: ${total}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-2 bg-yellow-500 rounded hover:bg-yellow-600"
            title="Copiar deck"
          >
            <ClipboardIcon className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-green-500 rounded hover:bg-green-600"
            title="Descargar imagen"
          >
            <ArrowDownTrayIcon className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>

      <textarea
        className="w-full h-48 p-2 font-mono text-sm border border-gray-300 rounded"
        placeholder="Pega aquí tu decklist…"
        value={inputText}
        onChange={e => setInputText(e.target.value)}
      />

      <button
        onClick={handleLoad}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Cargar cartas
      </button>

      {loading && <p className="mt-2">Cargando…</p>}
      {error && <p className="mt-2 text-red-600">{error}</p>}

      <div
        ref={gridRef}
        className="mt-6 grid grid-cols-4 md:grid-cols-8 gap-4 bg-white p-4 rounded"
      >
        {cardItems.map((c, i) => (
          <div key={`${c.set}-${c.num}`} className="relative text-center">
            <button
              onClick={() => removeCard(i)}
              className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600"
              title="Eliminar carta"
            >
              <TrashIcon className="h-4 w-4 text-white" />
            </button>

            <div className="mb-1 bg-white bg-opacity-80 text-xs py-1">
              ${(c.market_price * c.count / 100).toFixed(2)}
            </div>

            {c.imgData ? (
              <img
                src={c.imgData}
                alt={c.name}
                className={`mx-auto max-w-[136px] max-h-[189px] object-contain ${
                  c.count === 0 ? 'filter grayscale' : ''
                }`}
              />
            ) : (
              <div className="mx-auto w-[136px] h-[189px] bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                Sin imagen
              </div>
            )}

            <div className="mt-1 font-bold">{c.count}</div>
            <div className="mt-1 flex justify-center gap-1">
              <button
                onClick={() => updateCount(i, -1)}
                className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
              >
                <MinusSmallIcon className="h-6 w-6 text-gray-600" />
              </button>
              <button
                onClick={() => updateCount(i, +1)}
                className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
              >
                <PlusSmallIcon className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
