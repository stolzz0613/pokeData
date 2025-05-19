import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import pokemon from 'pokemontcgsdk';

// Configura tu API key
pokemon.configure({ apiKey: 'b15c5d63-aa96-46b8-9032-b4c29ddb3f10' });

export default function DeckParser() {
  const [inputText, setInputText] = useState('');
  const [cardItems, setCardItems] = useState([]); // { count, name, set, num, section, imgData, unitPrice }
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
      // 1) Mapea cada ptcgoCode a su id interno usando .where()
      const codes = [...new Set(items.map(i => i.set))];
      const codeToId = {};
      await Promise.all(codes.map(async code => {
        const res = await pokemon.set.where({
          q: `legalities.standard:legal ptcgoCode:${code}`
        });
        // res.data es un array de sets
        const setObj = res.data.find(s => s.ptcgoCode === code);
        if (setObj) codeToId[code] = setObj.id;
      }));

      // 2) Para cada carta, fetch via SDK con set.id y number
      const enriched = await Promise.all(items.map(async item => {
        const setId = codeToId[item.set];
        let sdkCard = null;
        if (setId) {
          const res = await pokemon.card.where({
            q: `set.id:${setId} number:${item.num}`
          });
          sdkCard = res.data[0] || null;
        }

        // unitPrice en dólares
        const unitPrice = sdkCard?.tcgplayer?.prices?.holofoil?.market ?? 0;

        // convierte imagen a Data-URL
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

        return { ...item, imgData, unitPrice };
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
      .then(() => alert('¡Deck copiado al portapapeles!'))
      .catch(() => alert('Error al copiar deck.'));
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

  const total = cardItems
    .reduce((sum, c) => sum + c.unitPrice * c.count, 0)
    .toFixed(2);

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
            {/* Copy icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M16 8l4 4m0 0l-4 4m4-4H8" />
            </svg>
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-green-500 rounded hover:bg-green-600"
            title="Descargar imagen"
          >
            {/* Download icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
            </svg>
          </button>
        </div>
      </div>

      <textarea
        className="w-full h-48 p-2 font-mono text-sm border border-gray-300 rounded"
        placeholder="Pega aquí tu deck list…"
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
              title="Eliminar"
            >
              {/* Delete icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" />
              </svg>
            </button>
            <div className="mb-1 bg-white bg-opacity-80 text-xs py-1">
              ${(c.unitPrice * c.count).toFixed(2)}
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
                No image
              </div>
            )}
            <div className="mt-1 font-bold">{c.count}</div>
            <div className="mt-1 flex justify-center gap-1">
              <button
                onClick={() => updateCount(i, -1)}
                className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
              >
                −
              </button>
              <button
                onClick={() => updateCount(i, +1)}
                className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
