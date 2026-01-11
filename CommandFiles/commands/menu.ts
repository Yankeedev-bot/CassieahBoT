// @ts-check
import {
  extractCommandRole,
  toTitleCase,
  UNISpectra,
} from "@cassidy/unispectra";
import { ShopClass } from "@cass-plugins/shopV2";
import stringSimilarity from "string-similarity";

export const meta: CommandMeta = {
  name: "menu",
  author: "꒰🍿˖°❗◯⃝🫟🎬TRØN†ARËS†BØT🍿⃤ ⃧🍧❓°˖ 🎟️ ꒱",
  description:
    "Acts as a central hub, like a Start Menu, providing users with an overview of available commands, their functionalities, and access to specific command details. Helps users quickly navigate the bot's features.",
  version: "3.1.1",
  usage: "{prefix}{name} [commandName]",
  category: "System",
  role: 0,
  waitingTime: 0.1,
  requirement: "3.0.0",
  icon: "🧰",
  otherNames: ["start", "help"],
};

export const style: CommandStyle = {
  title: "🎄💙 *GURA CHRISTMAS MENU* 💙🎄",
  titleFont: "none",
  contentFont: "none",
};

const basicCommands = {
  register: "Change your username.",
  items: "List and use **items** from your inventory.",
  gift: "Collect your hourly free gift/rewards.",
  bal: "Check your virtual **money**, collectibles, battlepoints, and ranks.",
  bank: "Store other **items** and **money** in an isolated bank.",
  active: "See **active** users.",
  streak: "Collect your **daily** bonus/streak.",
  vault: "Extra **storage** for your items.",
  bag: "Another extra **storage** for your items.",
  rank: "View your **EXP**.",
  ratings: "View and write a **ratings & review**",
  report: "Report **something** to an admin.",
  trade: "**Buy & Sell** items.",
  uid: "View your UNIQUE User ID.",
  pet: "Buy, feed, and **earn** from your pets!",
  rosashop: "Buy something **pet** related.",
  garden: "Grow a **Garden** here!",
  arena: "AI or PvP Pet Tournament, where you can **earn**!",
  mtls: "Create, buy, convert your **money** to a **mint**, (Not a **stock system** BTW.)",
};

// Fonction pour créer une boîte de commandes
const createCommandBox = (title, commands, showPrefix = false, prefix = "") => {
  if (!commands || commands.length === 0) return "";
  
  const maxCommandsPerBox = 10;
  let result = "";
  
  // Diviser les commandes en groupes si nécessaire
  const commandGroups = [];
  for (let i = 0; i < commands.length; i += maxCommandsPerBox) {
    commandGroups.push(commands.slice(i, i + maxCommandsPerBox));
  }
  
  commandGroups.forEach((group, groupIndex) => {
    let boxTitle = title;
    if (commandGroups.length > 1) {
      boxTitle = `${title} (${groupIndex + 1}/${commandGroups.length})`;
    }
    
    result += `╭═══✨✨✨═══╮\n`;
    result += `│ ${boxTitle}\n`;
    
    group.forEach(command => {
      const cmdName = showPrefix ? `${prefix}${command.name}` : command.name;
      const cmdDisplay = command.isAllowed ? `🎁 *${cmdName}*` : `🎁 ${cmdName}`;
      const priceInfo = command.shopPrice > 0 ? ` - $${command.shopPrice} ${command.status}` : "";
      result += `│ ${cmdDisplay}${priceInfo}\n`;
    });
    
    result += `╰═══✨✨✨✨═══╯\n\n`;
  });
  
  return result;
};

// Fonction pour créer l'en-tête
const createHeader = (userName) => {
  return `╭═══✨✨✨═══╮\n│ 🎄💙 *TRON MENU SYSTEM* 💙🎄\n│ Usuario: *${userName || "Guest"}*\n│ Bot: *TRØN†ARËS†BØT*\n│ Creador: *꒰🍿˖°❗◯⃝🫟🎬TRØN†ARËS†BØT🍿⃤ ⃧🍧❓°˖ 🎟️ ꒱*\n╰═══✨✨✨✨═══╯\n\n`;
};

// Fonction pour créer le pied de page
const createFooter = (totalCommands, totalCategories, status = "Operational") => {
  return `╭═══✨✨✨═══╮\n│ 🎅 *TRON ARES SYSTEM* 🌊\n│ 📊 Total Commands: ${totalCommands}\n│ 📂 Categories: ${totalCategories}\n│ ⚡ Status: ${status}\n│ 🍿🎬 ꒰TRØN†ARËS†BØT꒱ está orgulloso de ti.\n╰═══✨✨✨✨═══╯`;
};

export async function entry({
  input,
  output,
  prefix,
  commandName,
  commandName: cmdn,
  money,
  multiCommands,
  InputRoles,
}: CommandContext) {
  const commands = multiCommands.toUnique((i) => i.meta?.name);
  const args = input.arguments;
  const { logo: icon } = global.Cassidy;
  const { shopInv, money: userMoney } = await money.queryItem(
    input.senderID,
    "shopInv",
    "money"
  );
  const shop = new ShopClass(shopInv);

  // Récupérer le nom d'utilisateur
  const userName = input.senderName || "User";
  const botName = "TRØN†ARËS†BØT";
  const creator = "꒰🍿˖°❗◯⃝🫟🎬TRØN†ARËS†BØT🍿⃤ ⃧🍧❓°˖ 🎟️ ꒱";

  // Mode "all" - Afficher toutes les commandes dans le nouveau style
  if (
    String(args[0]).toLowerCase() === "all" ||
    (!args[0] && !Cassidy.allowGames)
  ) {
    const categorizedCommands: Record<string, CassidySpectra.CassidyCommand[]> =
      commands.values().reduce((categories, command) => {
        const category = command.meta.category || "Miscellaneous";
        if (!categories[category]) categories[category] = [];
        categories[category].push(command);
        return categories;
      }, {});

    // Préparer les commandes avec leurs informations
    let allCommandsInfo = [];
    let totalAllowedCommands = 0;

    for (const [category, catCommands] of Object.entries(categorizedCommands)) {
      const commandInfos = await Promise.all(
        catCommands.map(async (command) => {
          const { name, icon: cmdIcon, shopPrice = 0 } = command.meta;
          const role = await extractCommandRole(command);
          
          const isAllowed =
            (!shopPrice || shop.isUnlocked(name)) && input.hasRole(role);
          
          if (isAllowed) totalAllowedCommands++;
          
          const status = shop.isUnlocked(name)
            ? "✅"
            : shop.canPurchase(name, userMoney)
            ? "💰"
            : "❌";

          return {
            name,
            icon: cmdIcon,
            shopPrice,
            isAllowed,
            status
          };
        })
      );

      allCommandsInfo.push({
        category,
        commands: commandInfos
      });
    }

    // Trier les catégories par priorité
    const dontPrio: CassidySpectra.CommandTypes[] = ["arl_g", "cplx_g"];
    const getSumPrioIndex = (commands: CassidySpectra.CassidyCommand[]) => {
      if (!commands.length) return 0;
      return commands.reduce((sum, cmd) => {
        const idx = dontPrio.indexOf(cmd.meta.cmdType) * 5;
        return sum + (idx === -1 ? 0 : -idx);
      }, 0);
    };

    allCommandsInfo.sort((a, b) => {
      const aCommands = categorizedCommands[a.category];
      const bCommands = categorizedCommands[b.category];
      const aPrio = getSumPrioIndex(aCommands);
      const bPrio = getSumPrioIndex(bCommands);
      if (aPrio !== bPrio) return aPrio - bPrio;
      return a.category.localeCompare(b.category);
    });

    // Construire la réponse dans le nouveau style
    let result = createHeader(userName);

    // Ajouter chaque catégorie comme une boîte séparée
    allCommandsInfo.forEach(({ category, commands: catCommands }) => {
      // Filtrer seulement les commandes accessibles pour l'affichage
      const displayCommands = catCommands.filter(cmd => cmd.isAllowed);
      
      if (displayCommands.length > 0) {
        result += createCommandBox(category, displayCommands, true, prefix);
      }
    });

    // Ajouter le pied de page
    result += createFooter(commands.size, allCommandsInfo.length);

    return output.replyStyled(result, {
      ...style,
      content: {
        text_font: "monospace"
      }
    });

  } else if (
    String(args[0]).toLowerCase() === "search" ||
    String(args[0]).toLowerCase() === "find"
  ) {
    // Mode recherche - Garder l'ancien style pour la recherche
    const searchStr = String(args[1] || "");
    if (!searchStr) {
      return output.reply(
        `🔎 Search a **command** by putting a search keyword as argument.\n\n**EXAMPLE**: ${prefix}${commandName} search shop`
      );
    }
    
    const getSortedFinds = <T>(
      search: string,
      candidates: { tokens: string[]; data: T }[]
    ) => {
      const results = candidates
        .map((candidate) => {
          const scores = candidate.tokens.map((t) =>
            stringSimilarity.compareTwoStrings(search.toLowerCase(), t)
          );
          const scoreSum = scores.reduce((acc, score) => score + acc, 0);
          const mean = scoreSum / scores.length;
          return {
            candidate,
            scoreWhole: stringSimilarity.compareTwoStrings(
              search.toLowerCase(),
              candidate.tokens.join("\n").toLowerCase()
            ),
            scoreMean: mean,
            score: scoreSum,
            data: candidate.data,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      return results;
    };
    
    const cmds = commands.values().map((command) => {
      const { meta: { ...meta } } = command;
      meta.seo ??= [];
      meta.otherNames ??= [];
      meta.description ??= "";
      meta.usage ??= "";
      meta.category ??= "";
      meta.usage = meta.usage.replaceAll("{prefix}", "");
      meta.usage = meta.usage.replaceAll("{name}", "");
      const combined = `${meta.category} ${meta.name} ${meta.otherNames.join(" ")} ${meta.name} ${meta.otherNames.join(" ")} ${meta.name} ${meta.otherNames.join(" ")} ${meta.name} ${meta.otherNames.join(" ")} ${meta.name} ${meta.otherNames.join(" ")} ${meta.name} ${meta.otherNames.join(" ")} ${meta.description} ${meta.usage} ${meta.seo.join(" ")} ${meta.seo.join(" ")} ${meta.seo.join(" ")} ${meta.seo.join(" ")} ${meta.seo.join(" ")} ${meta.seo.join(" ")} ${meta.seo.join(" ")} ${meta.seo.join(" ")}`;
      const split = combined.split(/\s+/);

      return { ...command, meta, searchStr: combined, split };
    });
    
    const results = getSortedFinds(
      searchStr,
      cmds.map((i) => ({
        tokens: i.split,
        data: i,
      }))
    );
    
    return output.reply(
      `🔎 **Search Results** (${results.length})\n${UNISpectra.standardLine}\n${
        results.length === 0
          ? `❓ No Results.`
          : results
              .map((i) => ({ ...i.data.meta, i }))
              .map(
                (i) =>
                  `${i.icon ?? "📁"} ${prefix}**${i.name}**${
                    i.otherNames.length > 0
                      ? `\nAliases: **${i.otherNames.join(", ")}**`
                      : ""
                  }\n${UNISpectra.arrowFromT} ${
                    i.description ?? "No Description"
                  }`
              )
              .join(`\n${UNISpectra.standardLine}\n`)
      }`
    );

  } else if (String(args[0]).toLowerCase() === "basics") {
    // Mode basics - Nouveau style
    const entries = Object.entries(basicCommands);
    const filteredEntries = await Promise.all(
      entries.map(async (i) => {
        const command = multiCommands.getOne(i[0]);
        if (!command) return null;
        const role = await extractCommandRole(command);
        const isAllowed = input.hasRole(role);
        return isAllowed ? i : null;
      })
    );

    const validEntries = filteredEntries.filter(Boolean);
    
    // Créer l'en-tête
    let result = createHeader(userName);
    
    // Ajouter la section des commandes basiques
    result += `╭═══✨✨✨═══╮\n`;
    result += `│ 📚 *BASICS FOR BEGINNERS*\n`;
    
    validEntries.forEach((i: any) => {
      const command = multiCommands.getOne(i[0]);
      const cmdIcon = command?.meta?.icon || "📁";
      result += `│ ${cmdIcon} ${prefix}${i[0]} - ${i[1]}\n`;
    });
    
    result += `╰═══✨✨✨✨═══╯\n\n`;
    
    // Ajouter des conseils
    result += `╭═══✨✨✨═══╮\n`;
    result += `│ 💡 *TIPS & GUIDES*\n`;
    result += `│ Use prefix before commands\n`;
    result += `│ Example: "${prefix}gift"\n`;
    result += `│ Item key is inside brackets\n`;
    result += `│ Example: [shadowCoin]\n`;
    result += `╰═══✨✨✨✨═══╯\n\n`;
    
    // Ajouter le pied de page
    result += createFooter(commands.size, "Multiple");
    
    return output.replyStyled(result, {
      ...style,
      content: {
        text_font: "monospace"
      }
    });

  } else if (args.length > 0 && isNaN(parseInt(args[0]))) {
    // Détails d'une commande spécifique
    const cmdName = args[0];
    const commandsFound = multiCommands
      .getMap(cmdName)
      .toUnique((i) => i.meta.name)
      .values();
    
    if (commandsFound.length > 0) {
      const command = commandsFound[0];
      const {
        name,
        description,
        otherNames = [],
        usage,
        category = "None",
        waitingTime = 5,
        author = "Unknown",
        shopPrice = 0,
        icon: cmdIcon = "📄",
        version = "N/A",
        requirement = "N/A",
      } = command.meta;
      
      const role = await extractCommandRole(command, true, input.tid);
      const status = shop.isUnlocked(name)
        ? "✅ Unlocked"
        : shop.canPurchase(name, userMoney)
        ? "💰 Buyable"
        : "🔒 Locked";
      
      // Créer l'affichage détaillé dans le nouveau style
      let result = createHeader(userName);
      
      result += `╭═══✨✨✨═══╮\n`;
      result += `│ 🔍 *COMMAND DETAILS*\n`;
      result += `│ Name: ${prefix}${name}\n`;
      result += `│ Icon: ${cmdIcon}\n`;
      result += `│ Category: ${category}\n`;
      result += `│ Status: ${status}\n`;
      result += `╰═══✨✨✨✨═══╯\n\n`;
      
      result += `╭═══✨✨✨═══╮\n`;
      result += `│ 📝 *INFORMATION*\n`;
      result += `│ Description: ${description}\n`;
      result += `│ Aliases: ${otherNames.length ? otherNames.join(", ") : "None"}\n`;
      result += `│ Author: ${author}\n`;
      result += `│ Version: ${version}\n`;
      result += `╰═══✨✨✨✨═══╯\n\n`;
      
      result += `╭═══✨✨✨═══╮\n`;
      result += `│ ⚙️ *USAGE & SETTINGS*\n`;
      result += `│ Usage: ${usage.replace(/{prefix}/g, prefix).replace(/{name}/g, name)}\n`;
      result += `│ Cooldown: ${waitingTime}s\n`;
      result += `│ Role Required: ${typeof role === "number" ? role : "None"}\n`;
      result += `│ Requirement: ${requirement}\n`;
      result += `│ Price: ${shopPrice ? `$${shopPrice}` : "Free"}\n`;
      result += `╰═══✨✨✨✨═══╯`;
      
      return output.replyStyled(result, {
        ...style,
        content: {
          text_font: "monospace"
        }
      });
    } else {
      return output.reply(
        `╭═══✨✨✨═══╮\n│ ❌ *COMMAND NOT FOUND*\n│ Command "${cmdName}" doesn't exist\n│ Try: ${prefix}${cmdn} search ${cmdName}\n╰═══✨✨✨✨═══╯`
      );
    }

  } else if (!isNaN(parseInt(args[0])) && args[0]) {
    // Mode pagination
    const pageNum = parseInt(args[0]);
    const itemsPerPage = 5;
    
    const categorizedCommands: Record<string, CassidySpectra.CassidyCommand[]> =
      commands.values().reduce((categories, command) => {
        const category = command.meta.category || "Miscellaneous";
        if (!categories[category]) categories[category] = [];
        categories[category].push(command);
        return categories;
      }, {});
    
    const categoryList = Object.keys(categorizedCommands);
    const totalPages = Math.ceil(categoryList.length / itemsPerPage);
    let currentPage = pageNum;
    
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = currentPage * itemsPerPage;
    const pageCategories = categoryList.slice(startIndex, endIndex);
    
    let result = createHeader(userName);
    
    result += `╭═══✨✨✨═══╮\n`;
    result += `│ 📄 *PAGE ${currentPage} OF ${totalPages}*\n`;
    result += `│ Categories on this page:\n`;
    pageCategories.forEach(cat => {
      result += `│ • ${cat} (${categorizedCommands[cat].length})\n`;
    });
    result += `╰═══✨✨✨✨═══╯\n\n`;
    
    // Afficher les catégories de cette page
    for (const category of pageCategories) {
      const catCommands = await Promise.all(
        categorizedCommands[category].map(async (command) => {
          const { name, shopPrice = 0 } = command.meta;
          const role = await extractCommandRole(command);
          const isAllowed =
            (!shopPrice || shop.isUnlocked(name)) && input.hasRole(role);
          
          const status = shop.isUnlocked(name)
            ? "✅"
            : shop.canPurchase(name, userMoney)
            ? "💰"
            : "❌";
          
          return {
            name,
            shopPrice,
            isAllowed,
            status
          };
        })
      );
      
      const displayCommands = catCommands.filter(cmd => cmd.isAllowed);
      if (displayCommands.length > 0) {
        result += createCommandBox(category, displayCommands, true, prefix);
      }
    }
    
    // Navigation
    result += `╭═══✨✨✨═══╮\n`;
    result += `│ 🧭 *NAVIGATION*\n`;
    if (currentPage > 1) {
      result += `│ Prev: ${prefix}${cmdn} ${currentPage - 1}\n`;
    }
    if (currentPage < totalPages) {
      result += `│ Next: ${prefix}${cmdn} ${currentPage + 1}\n`;
    }
    result += `│ All: ${prefix}${cmdn} all\n`;
    result += `│ Basics: ${prefix}${cmdn} basics\n`;
    result += `╰═══✨✨✨✨═══╯\n\n`;
    
    result += createFooter(commands.size, categoryList.length);
    
    return output.replyStyled(result, {
      ...style,
      content: {
        text_font: "monospace"
      }
    });

  } else {
    // Vue par défaut - style simplifié
    const entries = Object.entries(basicCommands);
    const filteredEntries = await Promise.all(
      entries.map(async (i) => {
        const command = multiCommands.getOne(i[0]);
        if (!command) return null;
        const role = await extractCommandRole(command);
        const isAllowed = input.hasRole(role);
        return isAllowed ? i : null;
      })
    );

    const validEntries = filteredEntries.filter(Boolean);
    
    let result = createHeader(userName);
    
    // Commandes basiques
    result += `╭═══✨✨✨═══╮\n`;
    result += `│ ✅ *BASIC COMMANDS*\n`;
    
    validEntries.forEach((i: any, index) => {
      if (index < 8) { // Limiter à 8 commandes pour la vue par défaut
        const command = multiCommands.getOne(i[0]);
        const cmdIcon = command?.meta?.icon || "📁";
        result += `│ ${cmdIcon} ${prefix}${i[0]}\n`;
      }
    });
    
    if (validEntries.length > 8) {
      result += `│ ... and ${validEntries.length - 8} more\n`;
    }
    
    result += `╰═══✨✨✨✨═══╯\n\n`;
    
    // Options de navigation
    result += `╭═══✨✨✨═══╮\n`;
    result += `│ 🧭 *QUICK NAVIGATION*\n`;
    result += `│ View all: ${prefix}${cmdn} all\n`;
    result += `│ Search: ${prefix}${cmdn} search <text>\n`;
    result += `│ Basics: ${prefix}${cmdn} basics\n`;
    result += `│ Page 2: ${prefix}${cmdn} 2\n`;
    result += `╰═══✨✨✨✨═══╯\n\n`;
    
    result += createFooter(commands.size, "Multiple");
    
    return output.replyStyled(result, {
      ...style,
      content: {
        text_font: "monospace"
      }
    });
  }
  }
