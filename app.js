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

// --------------------------
// CARREGAR BANCO DE NOMES
// --------------------------
let nomes = [];
if (fs.existsSync("nomes.json")) {
  nomes = JSON.parse(fs.readFileSync("nomes.json"));
}

// -------------------------------------
// CONFIG DE CARGOS
// -------------------------------------
const CARGOS_PERMITIDOS = ["・Diretor", "・Sup", "・Gerente", "./"];
const CARGO_ALERTA = "・Membros";

function usuarioTemCargo(member) {
  return member.roles.cache.some(role =>
    CARGOS_PERMITIDOS.includes(role.name)
  );
}

function usuarioPodeReceberAlerta(member) {
  return member.roles.cache.some(role =>
    role.name === CARGO_ALERTA
  );
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
  // !add
  // ---------------------------
  if (content.startsWith("!add ")) {
    if (!usuarioTemCargo(message.member))
      return message.channel.send("❌ Você não tem permissão para usar este comando.");

    const nome = message.content.slice(5).trim().toLowerCase();

    if (!nomes.includes(nome)) {
      nomes.push(nome);
      fs.writeFileSync("nomes.json", JSON.stringify(nomes, null, 2));
      return message.channel.send(`✔️ Nome **${nome}** adicionado ao banco.`);
    } else {
      return message.channel.send(`⚠️ O nome **${nome}** já está no banco.`);
    }
  }

  // ---------------------------
  // !remove
  // ---------------------------
  if (content.startsWith("!remove ")) {
    if (!usuarioTemCargo(message.member))
      return message.channel.send("❌ Você não tem permissão.");

    const nomeInput = message.content.slice(8).trim().toLowerCase();
    const idx = nomes.findIndex(n => n.toLowerCase() === nomeInput);

    if (idx !== -1) {
      const removido = nomes[idx];
      nomes.splice(idx, 1);
      fs.writeFileSync("nomes.json", JSON.stringify(nomes, null, 2));
      return message.channel.send(`🗑️ O nome **${removido}** foi removido.`);
    } else {
      return message.channel.send(`❌ O nome **${nomeInput}** não existe.`);
    }
  }

  // ---------------------------
  // !removeallnames
  // ---------------------------
  if (content === "!removeallnames") {
    if (!usuarioTemCargo(message.member))
      return message.channel.send("❌ Você não tem permissão.");

    nomes = [];
    fs.writeFileSync("nomes.json", JSON.stringify(nomes, null, 2));
    return message.channel.send("🧹 Todos os nomes foram removidos!");
  }

  // ---------------------------
  // !lista
  // ---------------------------
  if (content === "!lista") {
    if (!usuarioTemCargo(message.member))
      return message.channel.send("❌ Você não tem permissão.");

    if (nomes.length === 0)
      return message.channel.send("📭 Banco vazio!");

    return message.channel.send(
      `📌 **Nomes na Blacklist:**\n${nomes.map(n => `- ${n}`).join("\n")}`
    );
  }

  // ---------------------------
  // !localizar
  // ---------------------------
  if (content.startsWith("!localizar ")) {
    if (!usuarioTemCargo(message.member))
      return message.channel.send("❌ Sem permissão.");

    const alvo = message.content.slice(11).trim().toLowerCase();

    const existe = nomes.some(n => n.toLowerCase() === alvo);

    if (existe)
      return message.channel.send(`🔎 O nome **${alvo}** está no banco.`);

    return message.channel.send(`❌ O nome **${alvo}** NÃO está no banco.`);
  }

  // ---------------------------
  // !comandos
  // ---------------------------
  if (content === "!comandos") {
    if (!usuarioTemCargo(message.member))
      return message.channel.send("❌ Sem permissão.");

    return message.channel.send(`
📜 **COMANDOS DISPONÍVEIS**

!add nome  
!remove nome  
!removeallnames  
!lista  
!localizar nome  
!comandos  
!corrigir
    `);
  }

  // ---------------------------
  // !corrigir
  // ---------------------------
  if (content === "!corrigir") {
    if (!usuarioTemCargo(message.member))
      return message.channel.send("❌ Sem permissão.");

    nomes = nomes.map(capitalizeNome);
    fs.writeFileSync("nomes.json", JSON.stringify(nomes, null, 2));

    return message.channel.send("✅ Todos os nomes foram corrigidos!");
  }

  // ---------------------------
  // ALERTA DE BLACKLIST
  // ---------------------------
  for (const nome of nomes) {
    if (content.includes(nome.toLowerCase())) {

      if (usuarioTemCargo(message.member) || usuarioPodeReceberAlerta(message.member)) {
        message.channel.send(`⚠️ O nome **${capitalizeNome(nome)}** está no banco!`);
      }

      break;
    }
  }
});

// --------------------------
// LOGIN DO BOT
// --------------------------
client.login(TOKEN);
