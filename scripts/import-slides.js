// Uso: node scripts/import-slides.js "C:\caminho\da\pasta\com\01.jpeg ... 05.jpeg"
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const srcDir = process.argv[2];
if (!srcDir || !fs.existsSync(srcDir)) {
  console.error('Uso: node scripts/import-slides.js "<pasta com as 5 fotos>"');
  process.exit(1);
}

const outDir = path.join(__dirname, "..", "public", "img", "slides");
const arquivos = fs
  .readdirSync(srcDir)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .sort()
  .slice(0, 5);

async function run() {
  for (let i = 0; i < arquivos.length; i++) {
    const output = path.join(outDir, `slide-${i + 1}.jpg`);
    // .rotate() aplica a orientação e o JPEG final não carrega metadados (GPS/EXIF).
    await sharp(path.join(srcDir, arquivos[i]))
      .rotate()
      .resize({ width: 1200, height: 1500, fit: "cover", position: "attention" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(output);
    console.log(arquivos[i], "->", `slide-${i + 1}.jpg`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
