const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const crypto = require("crypto");

const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");

const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter(req, file, cb) {
    if (TIPOS_PERMITIDOS.has(file.mimetype)) return cb(null, true);
    cb(new Error("Formato de imagem não suportado. Use JPG, PNG ou WEBP."));
  },
});

// Lê o conteúdo real da imagem (não confia na extensão), corrige a orientação,
// limita o tamanho e regrava como JPEG, o que remove metadados como GPS/EXIF.
async function processarImagens(files) {
  for (const file of files) {
    const nome = `${crypto.randomBytes(16).toString("hex")}.jpg`;
    await sharp(file.buffer, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(UPLOAD_DIR, nome));
    file.filename = nome;
    file.buffer = undefined;
  }
}

function uploadImagens(req, res, cb) {
  multerUpload.array("imagens", 6)(req, res, async (err) => {
    if (err) return cb(err);
    try {
      await processarImagens(req.files || []);
      cb(null);
    } catch {
      cb(new Error("Arquivo de imagem inválido ou corrompido."));
    }
  });
}

module.exports = { uploadImagens, UPLOAD_DIR };
