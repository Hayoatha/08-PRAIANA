const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "public", "img", "slides");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const PALETTES = [
  { a: "#8a9270", b: "#5c6349", wave: "#f3ede2" },
  { a: "#b98a5f", b: "#8f6543", wave: "#f3ede2" },
  { a: "#737b5c", b: "#454a35", wave: "#e9dcc6" },
  { a: "#c79b70", b: "#a97a54", wave: "#f7f2e8" },
  { a: "#9aa17e", b: "#6b7053", wave: "#f3ede2" },
];

function wavePath(seed, waveColor) {
  const y1 = 620 + seed * 8;
  const y2 = 700 + seed * 6;
  return `
    <path d="M-50,${y1} C150,${y1 - 90} 300,${y1 + 90} 500,${y1} C700,${y1 - 90} 850,${y1 + 60} 1000,${y1 - 20}"
      fill="none" stroke="${waveColor}" stroke-width="10" opacity="0.55"/>
    <path d="M-50,${y2} C180,${y2 - 70} 320,${y2 + 70} 520,${y2} C720,${y2 - 80} 860,${y2 + 50} 1000,${y2 - 10}"
      fill="none" stroke="${waveColor}" stroke-width="7" opacity="0.4"/>
  `;
}

function silhouette() {
  return `
    <g opacity="0.16" fill="#ffffff">
      <ellipse cx="450" cy="430" rx="140" ry="170"/>
      <path d="M310,560 C310,480 590,480 590,560 L610,900 C610,950 550,980 450,980 C350,980 290,950 290,900 Z"/>
    </g>
  `;
}

function svgFor(idx) {
  const p = PALETTES[idx % PALETTES.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1125" width="900" height="1125">
  <defs>
    <linearGradient id="bg${idx}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.a}"/>
      <stop offset="100%" stop-color="${p.b}"/>
    </linearGradient>
  </defs>
  <rect width="900" height="1125" fill="url(#bg${idx})"/>
  ${silhouette()}
  ${wavePath(idx, p.wave)}
  <text x="30" y="45" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" opacity="0.5">imagem ilustrativa</text>
</svg>`;
}

for (let i = 0; i < 5; i++) {
  const file = path.join(outDir, `slide-${i + 1}.svg`);
  fs.writeFileSync(file, svgFor(i), "utf8");
  console.log("gerado", file);
}
