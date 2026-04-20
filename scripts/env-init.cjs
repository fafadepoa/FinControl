/**
 * Cria .env a partir de .env.example apenas se .env ainda não existir.
 * Uso: npm run env:init
 */
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const example = path.join(root, ".env.example");
const target = path.join(root, ".env");

if (fs.existsSync(target)) {
  console.log("[env:init] .env já existe — nada foi alterado.");
  process.exit(0);
}

if (!fs.existsSync(example)) {
  console.error("[env:init] Falta .env.example na raiz do projeto.");
  process.exit(1);
}

fs.copyFileSync(example, target);
console.log("[env:init] Criado .env a partir de .env.example. Edite com seus valores reais.");
