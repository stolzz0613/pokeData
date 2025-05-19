import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';

export default function DeckParser() {
  const [inputText, setInputText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [apiCards, setApiCards] = useState([]);  // will hold cards with imgData
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

      const headerMatch = line.match(/^([^:]+):\s*(\d+)/);
      if (headerMatch) {
        currentSection = headerMatch[1]; // "Pokémon", "Trainer", "Energy"
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
    setParsed(items);
    if (!items.length) {
      setError('No se detectaron líneas válidas.');
      return;
    }

    setLoading(true);
    try {
      // 1) fetch card data from API
      const q = items.map(c => `${c.set}~${c.num}`).join(',');
      const res = await fetch(`https://limitlesstcg.com/api/labs/cards?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // 2) for each card, fetch the image and convert to Data-URL
      const cardsWithData = await Promise.all(
        data.map(async card => {
          const padded = card.number.padStart(3, '0');
          const imgUrl = `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${card.set}/${card.set}_${padded}_R_EN_XS.png`;
          const blob = await fetch(imgUrl).then(r => r.blob());
          const imgData = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          return { ...card, imgData };
        })
      );

      setApiCards(cardsWithData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateCount(index, delta) {
    setParsed(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, count: Math.max(0, item.count + delta) } : item
      )
    );
  }

  function removeCard(index) {
    setParsed(prev => prev.filter((_, i) => i !== index));
  }

  function handleCopy() {
    const sectionsOrder = ['Pokémon', 'Trainer', 'Energy'];
    const lines = [];

    sectionsOrder.forEach(sec => {
      const sectionItems = parsed.filter(i => i.section === sec);
      if (!sectionItems.length) return;
      const total = sectionItems.reduce((sum, i) => sum + i.count, 0);
      lines.push(`${sec}: ${total}`);
      sectionItems.forEach(i => {
        lines.push(`${i.count} ${i.name} ${i.set} ${i.num}`);
      });
      lines.push('');
    });

    const deckText = lines.join('\n').trim();
    navigator.clipboard.writeText(deckText)
      .then(() => alert('¡Deck copiado al portapapeles!'))
      .catch(() => alert('Error al copiar deck.'));
  }

  function handleDownload() {
    if (!gridRef.current) return;
    toPng(gridRef.current, { cacheBust: true })
      .then(dataUrl => {
        const link = document.createElement('a');
        link.download = 'deck.png';
        link.href = dataUrl;
        link.click();
      })
      .catch(err => console.error('Error generando imagen:', err));
  }

  // calculate total price in dollars
  const totalCents = parsed.reduce((sum, item) => {
    const card = apiCards.find(c => c.set === item.set && c.number === String(item.num));
    return sum + (card?.market_price ?? 0) * item.count;
  }, 0);
  const totalSum = (totalCents / 100).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Precio total del mazo: ${totalSum}</h2>
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
        placeholder="Pega aquí tu lista completa..."
        value={inputText}
        onChange={e => setInputText(e.target.value)}
      />

      <button
        onClick={handleLoad}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Cargar cartas
      </button>

      {loading && <p className="mt-2">Cargando cartas…</p>}
      {error && <p className="mt-2 text-red-600">{error}</p>}

      <div
        ref={gridRef}
        className="mt-4 grid grid-cols-4 md:grid-cols-8 gap-4 bg-white p-4 rounded"
        style={{ backgroundColor: '#ffffff', color: '#000000' }}
      >
        {parsed.map((item, index) => {
          const card = apiCards.find(c => c.set === item.set && c.number === String(item.num));
          const totalPrice = ((card?.market_price ?? 0) * item.count / 100).toFixed(2);
          return (
            <div key={`${item.set}-${item.num}`} className="relative text-center">
              {/* Remove button */}
              <button
                onClick={() => removeCard(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600"
                title="Eliminar carta"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" />
                </svg>
              </button>

              {/* Total price for this card */}
              <div className="mb-1 bg-white bg-opacity-80 text-xs py-1">
                ${totalPrice}
              </div>

              {/* Render the Data-URL image */}
              <img
                src={card?.imgData}
                alt={card?.name ?? 'No encontrada'}
                className={`mx-auto max-w-[136px] max-h-[189px] object-contain ${
                  item.count === 0 ? 'filter grayscale' : ''
                }`}
              />

              <div className="mt-1 font-bold">{item.count}</div>

              <div className="mt-1 flex justify-center gap-1">
                <button
                  onClick={() => updateCount(index, -1)}
                  className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                >
                  −
                </button>
                <button
                  onClick={() => updateCount(index, +1)}
                  className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
