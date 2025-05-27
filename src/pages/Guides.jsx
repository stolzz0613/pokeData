import React, { useEffect } from 'react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export default function ZoroarkDarkMasterDeckProfile() {
  // Function to generate and download multi-page PDF with margins
  const handleDownloadPDF = async () => {
    const input = document.getElementById('deck-profile');
    if (!input) return;

    // Render the full height & width of the element into a high-res canvas
    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      width: input.scrollWidth,
      height: input.scrollHeight,
    });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40; // 40pt margin

    // Compute image dimensions inside margins
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const usableHeight = pageHeight - margin * 2;
    const totalPages = Math.ceil(imgHeight / usableHeight);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }
      // Shift the canvas slice up by one page each iteration
      const yOffset = -(usableHeight * page) + margin;
      pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
    }

    pdf.save('Zoroark-Dark-Master-Deck-Profile.pdf');
  };

  // Ensure all images inside #deck-profile load with CORS enabled
  useEffect(() => {
    const imgs = document.querySelectorAll('#deck-profile img');
    imgs.forEach((img) => img.setAttribute('crossOrigin', 'anonymous'));
  }, []);

  return (
    <article id="deck-profile" className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-2xl shadow-lg">
      {/* Header with branding and download */}
      <div className="flex justify-between items-center mb-6">
        <img src="/logo.svg" alt="Brand Logo" className="h-12 w-auto" />
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Download as PDF
        </button>
      </div>

      <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">
        Deck Profile: Zoroark-EX “Dark Master”
      </h1>

      {/* Featured Image */}
      <div className="mb-8 flex justify-center">
        <img
          src="https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/JTG/JTG_185_R_EN_LG.png"
          alt="N's Zoroark-EX"
          className="rounded-lg shadow-md"
          style={{ maxWidth: '300px', height: 'auto' }}
        />
      </div>

      {/* Recent Results */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Recent Results</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Utrecht Special Event: Jan Schäfer placed 5th.</li>
          <li>Seville Special Event: Harvey Sheinman finished top 3.</li>
        </ul>
      </section>

      {/* Deck List */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Deck List</h2>
        <div className="grid grid-cols-2 gap-6 text-gray-600">
          <div>
            <h3 className="text-xl font-medium mb-1">Pokémon (20)</h3>
            <ul className="list-disc list-inside">
              <li>4 Zorua (N)</li>
              <li>4 Zoroark-EX (N)</li>
              <li>3 Darumaka (N)</li>
              <li>2 Darmanitan (N)</li>
              <li>1 Reshiram (N)</li>
              <li>1 Munkidori</li>
              <li>1 Fezandipiti-EX</li>
              <li>1 Ursaluna-EX</li>
              <li>1 Luxray</li>
              <li>1 Pecharunt</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-1">Trainers (17)</h3>
            <ul className="list-disc list-inside">
              <li>4 Arven</li>
              <li>3 Iono</li>
              <li>2 Janine’s Secret</li>
              <li>1 Boss’s Orders</li>
              <li>1 Professor Turo’s Plan</li>
              <li>3 Counter Catcher</li>
              <li>2 N’s Castle</li>
              <li>1 Pokémon League Center</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-1">Tools (14)</h3>
            <ul className="list-disc list-inside">
              <li>3 Buddy Buddy Poffins</li>
              <li>3 Nest Ball</li>
              <li>3 Ultra Ball</li>
              <li>2 Super Rod</li>
              <li>2 Defiance Band</li>
              <li>1 Counter Gain</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-1">Energies (8)</h3>
            <ul className="list-disc list-inside">
              <li>5 Darkness Energy</li>
              <li>3 Triple Acceleration Energy</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Core Strategy */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Core Strategy</h2>
        <p className="text-gray-600">
          “Dark Master” is built around Zoroark-EX’s uncanny ability to dictate the pace of the game. At its core, <strong>Trade</strong> not only replenishes your hand—it lets you aggressively dig for the pieces you need, whether that’s your key Tool cards, Supporters, or the right Basic to evolve. Once you’ve stocked up, <strong>Night Joker</strong> becomes your Swiss Army knife: copying powerful attacks from the bench means you can pivot on a dime, matching your opponent’s threats with their own tools or simply borrowing the best attack available.
        </p>
        <p className="text-gray-600 mt-4">
          The synergy with Pecharunt is deceptively strong: by applying Poison counters to Zoroark-EX, you force your opponent into awkward spots—every Knock Out then translates into extra damage or lingering effects when you slip <strong>Binding Mochi</strong> onto that poisoned EX. This looping interaction not only racks up prize cards faster, it punishes anyone who underestimates your bench presence.
        </p>
        <p className="text-gray-600 mt-4">
          Meanwhile, Darmanitan and Reshiram serve as your heavy hitters when you need reliable, repeatable damage—Darmanitan’s raw output can swing early prizes, and Reshiram’s energy demands are easily met by your dedicated acceleration suite. <strong>N’s PP Up</strong> functions as a dark-patch on steroids, diving into your discard pile to re-energize your attackers exactly when you need them, while <strong>Powerglass</strong> ensures you never run dry by recycling critical Energy for a second or even third attack.
        </p>
        <p className="text-gray-600 mt-4">
          Underneath it all is an engine built for consistency: you’re rarely short on cards, you rarely miss your Energy attachments, and you can always answer the board with the right tool at the right time. It’s this combination of raw draw power, adaptive offense, and efficient recovery that transforms Zoroark-EX from a simple attacker into the true “Dark Master” of the standard format.
        </p>
      </section>

      {/* Key Matchups */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Key Matchups</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Dragapult-EX: Accept an early prize if needed, then swing back with Darmanitan + Night Joker and stall with Counter Catcher.</li>
          <li>Gardevoir ex: Let them evolve their Gardevoir ex, then copy their attack with Night Joker and finish with Darumaka for type advantage.</li>
          <li>Joltik Box: Difficult matchup; Poison with Pecharunt for 130 damage, then KO with Luxray if they miss their Future Booster.</li>
          <li>Goldengo: Mitigate their mass discard with Darmanitan; after they KO your Zoroark, hit back for 360 with Darmanitan and regain tempo with Zoroark.</li>
        </ul>
      </section>

      {/* Illustrative Images */}
      <section className="mb-8 grid grid-cols-3 gap-4">
        <img
          src="https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SFA/SFA_097_R_EN_LG.png"
          alt="Darmanitan"
          className="rounded shadow-md"
        />
        <img
          src="https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/TWM/TWM_165_R_EN_LG.png"
          alt="Pecharunt"
          className="rounded shadow-md"
        />
        <img
          src="https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SSP/SSP_251_R_EN_LG.png"
          alt="Zoroark-EX"
          className="rounded shadow-md"
        />
      </section>

      {/* Potential Additions */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Potential Additions</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li><strong>N’s PP Up:</strong> Accelerate Darkness Energy from discard.</li>
          <li><strong>Powerglass:</strong> Retrieve key Energy from discard.</li>
          <li><strong>Binding Mochi:</strong> Enhance Poison-based strategies.</li>
          <li><strong>Unfair Stamp:</strong> Disrupt your opponent’s hand.</li>
          <li><strong>Technical Machine: Evolution:</strong> Speed up evolutions.</li>
          <li><strong>Night Stretcher:</strong> Recover Pokémon and Energy.</li>
          <li><strong>Reversal Energy:</strong> Flexible Energy option in tight spots.</li>
        </ul>
      </section>
    </article>
  );
}
