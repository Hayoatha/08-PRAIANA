const sharp = require("sharp");
const path = require("path");

const dir = path.join(__dirname, "..", "public", "img");

const jobs = [
  { in: "logo-color-raw.jpg", out: "logo-color.png", threshold: 18 },
  { in: "logo-dark-raw.png", out: "logo-dark.png", threshold: 12 },
  { in: "logo-icon-raw.png", out: "logo-icon.png", threshold: 12 },
];

async function run() {
  for (const job of jobs) {
    const input = path.join(dir, job.in);
    const output = path.join(dir, job.out);
    const buffer = await sharp(input)
      .trim({ threshold: job.threshold })
      .toBuffer({ resolveWithObject: true });
    await sharp(buffer.data)
      .extend({ top: 20, bottom: 20, left: 20, right: 20, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(output);
    console.log(job.in, "->", job.out, buffer.info.width, buffer.info.height);
  }
}
run().catch((e) => { console.error(e); process.exit(1); });
