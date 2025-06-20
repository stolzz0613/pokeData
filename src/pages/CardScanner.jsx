// Scanner.jsx
import React, { useRef, useState, useEffect, useMemo } from "react";
import Tesseract, { PSM } from "tesseract.js";
import pokemon from "pokemontcgsdk";
import "./Scanner.css";

export default function Scanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanInterval = useRef(null);

  // Estados para OCR y búsqueda
  const [rawDetectedName, setRawDetectedName] = useState("");
  const [processedName, setProcessedName] = useState("");
  const [longestWord, setLongestWord] = useState("");
  const [cards, setCards] = useState([]);
  const [error, setError] = useState(null);
  const [cardDatabase, setCardDatabase] = useState([]);
  const [matchedKeys, setMatchedKeys] = useState([]);
  const [scanIntervalMs, setScanIntervalMs] = useState(1000);

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
      if (["A", "B", "C", "D", "E", "F"].includes(card.regulation_mark)) {
        return;
      }
      const name = card.name_without_prefix_and_postfix;
      if (!result[name]) result[name] = [];
      result[name].push(id);
    });
    Object.keys(result).forEach((name) => {
      result[name].sort(
        (a, b) =>
          isCardSecretRare(cardDatabase[a]) - isCardSecretRare(cardDatabase[b])
      );
    });
    return result;
  }, [cardDatabase]);

  useEffect(() => {
    const apiKey = "b15c5d63-aa96-46b8-9032-b4cb29ddb3f10";
    pokemon.configure({ apiKey });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.setAttribute("playsinline", "");
          video.play();
        }
      })
      .catch(() => setError("No se pudo acceder a la cámara."));

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [matchedKeys]);

  // 4) Limpiar texto de OCR
  const cleanText = (str) => {
    if (!str) return "";
    return str
      .replace(/\r?\n|\r/g, " ")
      .replace(/[^A-Za-z0-9\s]/g, "")
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
      setError("No se encontraron IDs para las claves detectadas.");
      return;
    }

    try {
      const fetchPromises = allIds.map((id) =>
        pokemon.card.where({ q: `id:${id}` }).then((resp) => resp.data[0])
      );
      const cardsData = await Promise.all(fetchPromises);
      const validCards = cardsData.filter((c) => c != null);
      if (validCards.length === 0) {
        setError("No se pudieron recuperar los datos de las cartas.");
      } else {
        setCards(validCards);
      }
    } catch {
      setError("Error al buscar cartas por key.");
    }
  };

  const handleDetectName = async () => {
    // Si ya hay claves encontradas, no seguimos
    if (matchedKeys.length > 0) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    const ctx = canvas.getContext("2d");
    const { sx, sy, sw, sh, dw, dh } = getViewport();
    canvas.width = dw;
    canvas.height = dh;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, dw, dh);

    let imageDataUrl;
    try {
      imageDataUrl = canvas.toDataURL("image/png");
    } catch (err) {
      console.error("Error al crear data URL del canvas:", err);
      return;
    }

    const img = new Image();
    img.src = imageDataUrl;

    try {
      await img.decode();
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      console.error("Error al decodificar la imagen:", err);
      return;
    }

    let ocrResult;
    try {
      ocrResult = await Tesseract.recognize(img, "eng", {
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      console.error("Error al reconocer el texto con Tesseract:", err);
      return;
    }

    // 4) Procesar el texto si todo salió bien
    const rawText = ocrResult.data?.text ?? "";
    const cleaned = cleanText(rawText);
    if (cleaned.length < 2) return;

    setRawDetectedName(cleaned);
    const noDigits = cleaned.replace(/[0-9]/g, "");
    const trimmed = noDigits.trim();
    setProcessedName(trimmed);

    // Encontrar la palabra más larga
    const words = trimmed
      .split(" ")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    if (words.length > 0) {
      let longest = words[0];
      for (const w of words) {
        if (w.length > longest.length) longest = w;
      }
      setLongestWord(longest);
    }

    // 5) Buscar coincidencias en el map de nombres
    const lowerProcessed = trimmed.toLowerCase();
    const foundKeys = Object.keys(cardNameToIDs).filter((key) =>
      lowerProcessed.includes(key.toLowerCase())
    );

    if (foundKeys.length > 0) {
      setScanIntervalMs(60000);
      alert(`¡Coincidencia encontrada! Claves: ${foundKeys.join(", ")}`);
      setMatchedKeys(foundKeys);

      // Detener escaneo
      if (scanInterval.current) {
        clearInterval(scanInterval.current);
        scanInterval.current = null;
      }
      // Buscar cartas inmediatamente
      handleSearchCards(foundKeys);
    }
  };

  useEffect(() => {
    if (scanInterval.current) {
      clearInterval(scanInterval.current);
    }
    scanInterval.current = setInterval(() => {
      handleDetectName();
    }, scanIntervalMs);

    return () => {
      if (scanInterval.current) {
        clearInterval(scanInterval.current);
        scanInterval.current = null;
      }
    };
  }, [cardNameToIDs, scanIntervalMs]);

  const handleNewSearch = () => {
    setRawDetectedName("");
    setProcessedName("");
    setLongestWord("");
    setMatchedKeys([]);
    setCards([]);
    setError(null);
    setScanIntervalMs(1000);

    if (scanInterval.current) {
      clearInterval(scanInterval.current);
      scanInterval.current = null;
    }

    scanInterval.current = setInterval(() => {
      handleDetectName();
    }, 1000);
  };

  return (
    <>
      <header
        className="flex shadow p-4 px-4 md:px-12 mb-6 justify-between"
        style={{ backgroundColor: "#0065B0" }}
      >
        <h2 className="text-2xl text-white font-bungee">Scanner</h2>
        <a href="" className="text-2xl text-white font-bungee cursor-pointer">
          {" "}
          Home
        </a>
      </header>
      <div className="scanner-container p-12">
        <div className="video-container">
          <video ref={videoRef} className="video-feed" />
          <div className="viewport-overlay">
            <div className="viewport-name" />
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div className="instructions">
          <p>
            Enfoca el <strong>nombre del Pokémon</strong> dentro del recuadro
            amarillo. El reconocimiento se intentará automáticamente.
          </p>
        </div>

        {/* Botón para nueva búsqueda */}
        {matchedKeys.length > 0 && (
          <div style={{ margin: "12px 0" }}>
            <button
              onClick={handleNewSearch}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50 font-bungee cursor-pointer"
            >
              Nueva búsqueda
            </button>
          </div>
        )}

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
                    {key} (IDs: {cardNameToIDs[key].join(", ")})
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
                // Padding a 3 dígitos para card.number
                const numberString = card.number.toString().padStart(3, "0");
                const tntSearch = `${numberString}/${card.set.printedTotal}`;

                const tcgUrl = card.tcgplayer?.url || "#";
                const tntUrl = `https://www.trollandtoad.com/category.php?selected-cat=0&search-words=${encodeURIComponent(
                  tntSearch
                )}`;

                return (
                  <div key={card.id} className="card-item text-center">
                    <a
                      href={tcgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      {card.images.small && (
                        <img src={card.images.small} alt={card.name} />
                      )}
                      <div className="card-name">{card.name}</div>
                      {card.tcgplayer && card.tcgplayer.prices ? (
                        <div className="card-price">
                          <strong>TCGplayer:</strong>{" "}
                          {card.tcgplayer.prices.normal
                            ? `$${
                                card.tcgplayer.prices.normal.mid?.toFixed(2) ??
                                card.tcgplayer.prices.normal.low?.toFixed(2)
                              }`
                            : card.tcgplayer.prices.holofoil
                            ? `$${
                                card.tcgplayer.prices.holofoil.mid?.toFixed(
                                  2
                                ) ??
                                card.tcgplayer.prices.holofoil.low?.toFixed(2)
                              }`
                            : "—"}
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
                        display: "inline-block",
                        marginTop: "8px",
                        textDecoration: "none",
                        color: "#1a73e8",
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
    </>
  );
}
