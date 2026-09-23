const fs = require("fs");
const path = require("path");

// Em produção (Render), DATA_DIR aponta para o disco persistente, para o
// catálogo sobreviver a cada deploy. Sem essa variável, usa a pasta local
// do projeto (bom para desenvolvimento, mas apagado a cada deploy).
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "products.json");

function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
}

function getAll() {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Escrita atômica: grava em arquivo temporário e renomeia, evitando
// corromper products.json se o processo cair no meio da gravação.
function saveAll(products) {
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(products, null, 2), "utf8");
  fs.renameSync(tmp, DATA_FILE);
}

function getPublic() {
  return getAll()
    .filter((p) => p.ativo)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function getById(id) {
  return getAll().find((p) => p.id === id);
}

function create(product) {
  const products = getAll();
  products.push(product);
  saveAll(products);
  return product;
}

function update(id, changes) {
  const products = getAll();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...changes };
  saveAll(products);
  return products[idx];
}

function remove(id) {
  const products = getAll();
  const filtered = products.filter((p) => p.id !== id);
  saveAll(filtered);
  return filtered.length !== products.length;
}

module.exports = { getAll, getPublic, getById, create, update, remove, saveAll };
