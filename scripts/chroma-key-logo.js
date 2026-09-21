const sharp = require("sharp");
const path = require("path");

const dir = path.join(__dirname, "..", "public", "img");
const input = path.join(dir, "logo-color-raw.jpg");
const output = path.join(dir, "logo-color.png");

async function run() {
  const img = sharp(input).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // amostra a cor de fundo a partir do canto superior esquerdo
  const bg = [data[0], data[1], data[2]];

  const softness = 28; // faixa de transição para bordas suaves
  const cutoff = 34; // distância abaixo da qual é considerado fundo

  for (let i = 0; i < data.length; i += channels) {
    const dr = data[i] - bg[0];
    const dg = data[i + 1] - bg[1];
    const db = data[i + 2] - bg[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    let alpha;
    if (dist <= cutoff) {
      alpha = 0;
    } else if (dist >= cutoff + softness) {
      alpha = 255;
    } else {
      alpha = Math.round(((dist - cutoff) / softness) * 255);
    }
    data[i + 3] = alpha;
  }

  const keyed = sharp(data, { raw: { width, height, channels } });
  const { data: trimmedData, info: trimmedInfo } = await keyed
    .trim({ threshold: 10 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  await sharp(trimmedData, { raw: trimmedInfo })
    .extend({ top: 24, bottom: 24, left: 24, right: 24, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(output);

  console.log("logo-color.png (chroma key) gerado em", output);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
