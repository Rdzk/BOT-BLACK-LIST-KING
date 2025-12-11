function capitalizeNome(nome) {
  return nome
    .split(" ")
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}


const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const TOKEN = process.env.DISCORD_TOKEN;

// --------------------------
// CARREGAR BANCO DE NOMES
// --------------------------
let nomes = [];
if (fs.existsSync("nomes.json")) {
  nomes = JSON.parse(fs.readFileSync("nomes.json"));
}

// --------------------------
// CLIENT DISCORD
// --------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// -------------------------------------
// CONFIG DE CARGOS
// -------------------------------------

// STAFF (pode usar TODOS os comandos)
const CARGOS_PERMITIDOS = ["・Diretor", "・Sup", "・Gerente", "./"];

// Membro recebe alerta, mas não usa comandos
const CARGO_ALERTA = "・Membros";

// Verificar STAFF
function usuarioTemCargo(member) {
  return member.roles.cache.some(role => CARGOS_PERMITIDOS.includes(role.name));
}

// Verificar se é Membro
function usuarioPodeReceberAlerta(member) {
  return member.roles.cache.some(role => role.name === CARGO_ALERTA);
}

client.once("ready", () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

// -------------------------------------
// SISTEMA DE MENSAGENS
// -------------------------------------
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // ---------------------------
  // COMANDO: !add
  // ---------------------------
  if (content.startsWith("!add ")) {
    if (!usuarioTemCargo(message.member))
      return message.channel.send("❌ Você não tem permissão para usar este comando.");

    const nome = message.content.slice(5).trim().toLowerCase();

    if (!nomes.includes(nome)) {
      nomes.push(nome);
      fs.writeFileSync("nomes.json", JSON.stringify(nomes, null, 2));
      message.channel.send(`✔️ Nome **${nome}** adicionado ao banco.`);
    } else {
      message.channel.send(`⚠️ O nome **${nome}** já está no banco.`);
    }
    return;
  }

  // ---------------------------
  // COMANDO: !remove
  // ---------------------------
  if (content.startsWith("!remove ")) {
    if (!usuarioTemCargo(message.member))
      return message.channel.send("❌ Você não tem permissão para usar este comando.");

    const nomeInput = message.content.slice(8).trim().toLowerCase();
    const nomeIndex = nomes.findIndex(n => n.toLowerCase() === nomeInput);

    if (nomeIndex !== -1) {
      const nomeRemovido = nomes[nomeIndex];
      nomes.splice(nomeIndex, 1);
      fs.writeFileSync("nomes.json", JSON.stringify(nomes, null, 2));

      message.channel.send(`🗑️ O nome **${nomeRemovido}** foi removido do banco.`);
    } else {
      message.channel.send(`❌ O nome **${nomeInput}** não existe no banco.`);
    }
    return;
  }

  // ---------------------------
  // COMANDO: !removeallnames
  // ---------------------------
  if (content === "!removeallnames") {
    if (!usuarioTemCargo(message.member))
      return message.channel.send("❌ Você não tem permissão para usar este comando.");

    nomes = [];
    fs.writeFileSync("nomes.json", JSON.stringify(nomes, null, 2));
    return message.channel.send("🧹 Todos os nomes foram removidos!");
  }

  // ---------------------------
  // COMANDO: !lista
  // ---------------------------
  if (content === "!lista") {
    if (!usuarioTemCargo(message.member))
      return message.channel.send("❌ Você não tem permissão para usar este comando.");

    if (nomes.length === 0) {
      return message.channel.send("📭 O banco de dados está vazio!");
    }

    return message.channel.send(
      `📌 **Nomes na Blacklist:**\n${nomes.map(n => `- ${n}`).join("\n")}`
    );
  }

  // ---------------------------
  // COMANDO: !localizar
  // ---------------------------
  if (content.startsWith("!localizar ")) {
    if (!usuarioTemCargo(message.member))
      return message.channel.send("❌ Você não tem permissão para usar este comando.");

    const nomeProcurado = message.content.slice(11).trim().toLowerCase();

    const encontrado = nomes.some(n => n.toLowerCase() === nomeProcurado);

    if (encontrado) {
      return message.channel.send(`🔎 O nome **${nomeProcurado}** está no banco.`);
    } else {
      return message.channel.send(`❌ O nome **${nomeProcurado}** NÃO está no banco.`);
    }
  }

  // ---------------------------
  // COMANDO: !comandos
  // ---------------------------
  if (content === "!comandos") {
    if (!usuarioTemCargo(message.member))
      return message.channel.send("❌ Você não tem permissão para usar este comando.");

    const comandosTxt = `
📜 **COMANDOS DISPONÍVEIS**

**!add nome** – Adiciona um nome ao banco  
**!remove nome** – Remove um nome do banco  
**!removeallnames** – Limpa o banco inteiro  
**!lista** – Mostra todos os nomes  
**!localizar nome** – Procura um nome específico  
**!comandos** – Mostra esta lista
    `;

    return message.channel.send(comandosTxt);
  }

  // ---------------------------
//  SISTEMA DE ALERTA DA BLACKLIST
// ---------------------------

for (const nome of nomes) {
    if (message.content.toLowerCase().includes(nome.toLowerCase())) {

        // STAFF recebe alerta
        if (usuarioTemCargo(message.member)) {
            message.channel.send(`⚠️ O nome **${capitalizeNome(nome)}** está no banco de dados!`);
            break;
        }

        // ・Membros também recebe alerta
        if (usuarioPodeReceberAlerta(message.member)) {
            message.channel.send(`⚠️ O nome **${capitalizeNome(nome)}** está no banco de dados!`);
            break;
        }

        // Quem NÃO tem cargo → nada acontece
        break;
    }
}
});

// --------------------------
// LOGIN DO BOT
// --------------------------
if (!TOKEN) {
  console.error("Erro: DISCORD_TOKEN não foi definido no .env!");
  process.exit(1);
}

client.login(TOKEN);

client.on("messageCreate", (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();

    // --- COMANDO !corrigir ---
    if (content === "!corrigir") {

        // Corrige todos os nomes existentes no JSON
        nomes = nomes.map(nome =>
            nome
                .split(" ")
                .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
                .join(" ")
        );

        fs.writeFileSync("nomes.json", JSON.stringify(nomes, null, 2));

        message.channel.send("✅ Todos os nomes foram corrigidos com letra maiúscula!");
        return;
    }

    // ... RESTO DOS COMANDOS DO BOT AQUI ...
});

