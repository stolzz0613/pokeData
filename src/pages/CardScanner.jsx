// Scanner.jsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import Tesseract, { PSM } from 'tesseract.js';
import pokemon from 'pokemontcgsdk';
import './Scanner.css';

export default function Scanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanInterval = useRef(null);

  // Estados para OCR y búsqueda
  const [rawDetectedName, setRawDetectedName] = useState('');
  const [processedName, setProcessedName] = useState('');
  const [longestWord, setLongestWord] = useState('');
  const [cards, setCards] = useState([]);
  const [error, setError] = useState(null);
  const [cardDatabase, setCardDatabase] = useState([]);
  const [matchedKeys, setMatchedKeys] = useState([]);

  // 1) Cargar la base de datos local de cartas
  useEffect(() => {
    fetch("/card_database.json")
      .then((r) => r.json())
      .then(setCardDatabase)
      .catch(() => setCardDatabase([]));
  }, []);

  // Función para determinar si una carta es Secret Rare (para ordenar)
  function isCardSecretRare(card) {
    const number = parseInt(card.number) || 0;
    const setTotal = parseInt(card?.set?.printed_total) || 0;
    return setTotal > 1 && number > setTotal;
  }

  // 2) Generar el mapping { nombre_sin_prefijos: [id1, id2, ...], ... }
  const cardNameToIDs = useMemo(() => {
    const result = {};
    Object.keys(cardDatabase).forEach((id) => {
      const card = cardDatabase[id];
      if (['A', 'B', 'C', 'D', 'E', 'F'].includes(card.regulation_mark)) {
        return;
      }
      const name = card.name_without_prefix_and_postfix;
      if (!result[name]) result[name] = [];
      result[name].push(id);
    });
    Object.keys(result).forEach((name) => {
      result[name].sort((a, b) =>
        isCardSecretRare(cardDatabase[a]) - isCardSecretRare(cardDatabase[b])
      );
    });
    return result;
  }, [cardDatabase]);

  // Debug: mostrar mapping en consola
  useEffect(() => {
    console.log('Card name to IDs mapping:', cardNameToIDs);
  }, [cardNameToIDs]);

  // 3) Configurar la API de PokéTCG SDK y encender cámara
  useEffect(() => {
    const apiKey = 'b15c5d63-aa96-46b8-9032-b4cb29ddb3f10';
    pokemon.configure({ apiKey });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.setAttribute('playsinline', '');
          video.play();
        }
      })
      .catch(() => setError('No se pudo acceder a la cámara.'));

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 4) Limpiar texto de OCR
  const cleanText = (str) => {
    if (!str) return '';
    return str
      .replace(/\r?\n|\r/g, ' ')
      .replace(/[^A-Za-z0-9\s]/g, '')
      .trim();
  };

  // 5) Región de interés: 15% superior del video
  const getViewport = () => {
    const video = videoRef.current;
    if (!video) return { sx: 0, sy: 0, sw: 0, sh: 0, dw: 0, dh: 0 };
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    return {
      sx: 0,
      sy: 0,
      sw: vw,
      sh: vh * 0.15,
      dw: vw,
      dh: vh * 0.15,
    };
  };

  // 8) Buscar cartas una vez hay matchedKeys
  const handleSearchCards = async (keys) => {
    setError(null);
    setCards([]);

    const allIds = keys.flatMap((key) => cardNameToIDs[key] || []);
    if (allIds.length === 0) {
      setError('No se encontraron IDs para las claves detectadas.');
      return;
    }

    try {
      const fetchPromises = allIds.map((id) =>
        pokemon.card.where({ q: `id:${id}` }).then((resp) => resp.data[0])
      );
      const cardsData = await Promise.all(fetchPromises);
      const validCards = cardsData.filter((c) => c != null);
      if (validCards.length === 0) {
        setError('No se pudieron recuperar los datos de las cartas.');
      } else {
        setCards(validCards);
      }
    } catch {
      setError('Error al buscar cartas por key.');
    }
  };

  // 6) Función OCR: detectar cada segundo hasta coincidencia
  const handleDetectName = async () => {
    if (matchedKeys.length > 0) return; // Ya hay coincidencia

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    const ctx = canvas.getContext('2d');
    const { sx, sy, sw, sh, dw, dh } = getViewport();
    canvas.width = dw;
    canvas.height = dh;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, dw, dh);

    try {
      const imageDataUrl = canvas.toDataURL('image/png');
      const img = new Image();
      img.src = imageDataUrl;
      await img.decode();

      const {
        data: { text },
      } = await Tesseract.recognize(img, 'eng', {
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });

      const cleaned = cleanText(text);
      if (cleaned.length < 2) return;

      setRawDetectedName(cleaned);
      const noDigits = cleaned.replace(/[0-9]/g, '');
      const trimmed = noDigits.trim();
      setProcessedName(trimmed);

      // Encontrar la palabra más larga
      const words = trimmed
        .split(' ')
        .map((w) => w.trim())
        .filter((w) => w.length > 0);
      if (words.length > 0) {
        let longest = words[0];
        for (const w of words) {
          if (w.length > longest.length) longest = w;
        }
        setLongestWord(longest);
      }

      // 7) Verificar coincidencia con keys
      const lowerProcessed = trimmed.toLowerCase();
      const foundKeys = Object.keys(cardNameToIDs).filter((key) =>
        lowerProcessed.includes(key.toLowerCase())
      );

      if (foundKeys.length > 0) {
        setMatchedKeys(foundKeys);
        // Detener escaneo automático
        if (scanInterval.current) {
          clearInterval(scanInterval.current);
          scanInterval.current = null;
        }
        // Buscar cartas inmediatamente
        handleSearchCards(foundKeys);
      }
    } catch {
      console.error('Error al reconocer el texto.');
    }
  };

  // 9) Iniciar OCR automático cada 1 segundo
  useEffect(() => {
    scanInterval.current = setInterval(() => {
      handleDetectName();
    }, 1000);

    return () => {
      if (scanInterval.current) clearInterval(scanInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardNameToIDs]);

  return (
    <div className="scanner-container">
      <div className="video-container">
        <video ref={videoRef} className="video-feed" />
        <div className="viewport-overlay">
          <div className="viewport-name" />
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="instructions">
        <p>
          Enfoca el <strong>nombre del Pokémon</strong> dentro del recuadro amarillo. 
          El reconocimiento se intentará automáticamente cada segundo hasta que 
          alguna clave coincida, momento en el cual se buscarán las cartas.
        </p>
      </div>

      {error && <p className="error-message">{error}</p>}

      {rawDetectedName && (
        <div className="results">
          <div>
            <strong>Raw OCR:</strong> {rawDetectedName}
          </div>
        </div>
      )}

      {processedName && (
        <div className="results">
          <div>
            <strong>Procesado (sin dígitos):</strong> {processedName}
          </div>
          {longestWord && (
            <div style={{ marginTop: 4 }}>
              <strong>Palabra más larga:</strong> {longestWord}
            </div>
          )}
        </div>
      )}

      {matchedKeys.length > 0 && (
        <div className="results">
          <div>
            <strong>Claves encontradas en la base de datos:</strong>
            <ul>
              {matchedKeys.map((key) => (
                <li key={key}>
                  {key} (IDs: {cardNameToIDs[key].join(', ')})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {cards.length > 0 && (
        <div className="card-results">
          <h3>Cartas encontradas:</h3>
          <div className="cards-grid">
            {cards.map((card) => {
              const tcgUrl = card.tcgplayer?.url || '#';
              const tntSearch = `${card.number}/${card.set.printedTotal}`;
              const tntUrl = `https://www.trollandtoad.com/category.php?selected-cat=0&search-words=${encodeURIComponent(
                tntSearch
              )}`;

              return (
                <div key={card.id} className="card-item">
                  <a
                    href={tcgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    {card.images.small && <img src={card.images.small} alt={card.name} />}
                    <div className="card-name">{card.name}</div>
                    {card.tcgplayer && card.tcgplayer.prices ? (
                      <div className="card-price">
                        <strong>Precio TCGplayer:</strong>{' '}
                        {card.tcgplayer.prices.normal
                          ? `$${card.tcgplayer.prices.normal.mid?.toFixed(2) ??
                              card.tcgplayer.prices.normal.low?.toFixed(2)}`
                          : card.tcgplayer.prices.holofoil
                          ? `$${card.tcgplayer.prices.holofoil.mid?.toFixed(2) ??
                              card.tcgplayer.prices.holofoil.low?.toFixed(2)}`
                          : '—'}
                      </div>
                    ) : (
                      <div className="card-price">
                        <strong>Precio TCGplayer:</strong> No disponible
                      </div>
                    )}
                  </a>
                  <a
                    href={tntUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tnt-link"
                    style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      textDecoration: 'none',
                      color: '#1a73e8',
                    }}
                  >
                    Troll and Toad
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
