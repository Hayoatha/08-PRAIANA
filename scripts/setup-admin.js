const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const envPath = path.join(__dirname, "..", ".env");
const examplePath = path.join(__dirname, "..", ".env.example");

// Lê a senha sem mostrá-la na tela e sem deixá-la no histórico do terminal.
function perguntarSenha(pergunta) {
  return new Promise((resolve) => {
    process.stdout.write(pergunta);
    const stdin = process.stdin;
    let senha = "";
    stdin.setRawMode && stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const aoDigitar = (c) => {
      if (c === "") process.exit(1); // Ctrl+C
      if (c === "\r" || c === "\n") {
        stdin.setRawMode && stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", aoDigitar);
        process.stdout.write("\n");
        return resolve(senha);
      }
      if (c === "" || c === "\b") senha = senha.slice(0, -1);
      else senha += c;
    };
    stdin.on("data", aoDigitar);
  });
}

function definir(conteudo, chave, valor) {
  const linha = `${chave}=${valor}`;
  const re = new RegExp(`^${chave}=.*$`, "m");
  return re.test(conteudo) ? conteudo.replace(re, () => linha) : `${conteudo.trimEnd()}\n${linha}\n`;
}

async function main() {
  const senha = await perguntarSenha("Nova senha do painel (mínimo 12 caracteres): ");
  if (senha.length < 12) {
    console.error("\nSenha muito curta. Use pelo menos 12 caracteres.\n");
    process.exit(1);
  }
  const confirmacao = await perguntarSenha("Repita a senha: ");
  if (senha !== confirmacao) {
    console.error("\nAs senhas não conferem.\n");
    process.exit(1);
  }

  let conteudo = fs.readFileSync(fs.existsSync(envPath) ? envPath : examplePath, "utf8");

  conteudo = definir(conteudo, "ADMIN_PASS_HASH", bcrypt.hashSync(senha, 12));

  // Trocar a senha também gera um novo segredo de sessão, encerrando logins antigos.
  conteudo = definir(conteudo, "SESSION_SECRET", crypto.randomBytes(32).toString("hex"));

  fs.writeFileSync(envPath, conteudo, { mode: 0o600 });

  console.log("\nSenha configurada em .env (somente o hash foi salvo).");
  console.log("Reinicie o servidor: npm start\n");
}

main();
