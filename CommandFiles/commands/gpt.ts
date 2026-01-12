const axios = require('axios');
const validUrl = require('valid-url');
const fs = require('fs');
const path = require('path');
const ytSearch = require('yt-search');
const { v4: uuidv4 } = require('uuid');

const API_ENDPOINT = "https://shizuai.vercel.app/chat";
const CLEAR_ENDPOINT = "https://shizuai.vercel.app/chat/clear";
const YT_API = "http://65.109.80.126:20409/aryan/yx";
const EDIT_API = "https://gemini-edit-omega.vercel.app/edit";

const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// 📥 Téléchargement de fichier
const downloadFile = async (url, ext) => {
  const filePath = path.join(TMP_DIR, `${uuidv4()}.${ext}`);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filePath, Buffer.from(response.data));
  return filePath;
};

// --- Fonction pour transformer un texte en style 𝑨𝒁 ---
function toAZStyle(text) {
  const azMap = {
    A:'𝑨', B:'𝑩', C:'𝑪', D:'𝑫', E:'𝑬', F:'𝑭', G:'𝑮', H:'𝑯', I:'𝑰', J:'𝑱',
    K:'𝑲', L:'𝑳', M:'𝑴', N:'𝑵', O:'𝑶', P:'𝑷', Q:'𝑸', R:'𝑹', S:'𝑺', T:'𝑻',
    U:'𝑼', V:'𝑽', W:'𝑾', X:'𝑿', Y:'𝒀', Z:'𝒁',
    a:'𝒂', b:'𝒃', c:'𝒄', d:'𝒅', e:'𝒆', f:'𝒇', g:'𝒈', h:'𝒉', i:'𝒊', j:'𝒋',
    k:'𝒌', l:'𝒍', m:'𝒎', n:'𝒏', o:'𝒐', p:'𝒑', q:'𝒒', r:'𝒓', s:'𝒔', t:'𝒕',
    u:'𝒖', v:'𝒗', w:'𝒘', x:'𝒙', y:'𝒚', z:'𝒛',
    '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
    ' ':' '
  };
  return text.split('').map(c => azMap[c] || c).join('');
}

// ♻️ Réinitialiser la conversation
const resetConversation = async (api, event, message) => {
  api.setMessageReaction("♻️", event.messageID, () => {}, true);
  try {
    await axios.delete(`${CLEAR_ENDPOINT}/${event.senderID}`);
    return message.reply(
      "╭═══✨✨✨═══╮\n" +
      "│ ♻️ 𝑪𝑶𝑵𝑽𝑬𝑹𝑺𝑨𝑻𝑰𝑶𝑵 𝑪𝑳𝑬𝑨𝑹𝑬𝑫 ♻️\n" +
      "│ 𝑼𝑰𝑫: " + event.senderID + "\n" +
      "│ 𝑺𝒕𝒂𝒕𝒖𝒔: 𝑺𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚 𝒄𝒍𝒆𝒂𝒓𝒆𝒅\n" +
      "╰═══✨✨✨✨═══╯"
    );
  } catch (error) {
    console.error('❌ Reset Error:', error.message);
    return message.reply(
      "╭═══✨✨✨═══╮\n" +
      "│ ❌ 𝑺𝒀𝑺𝑻𝑬𝑴 𝑬𝑹𝑹𝑶𝑹 ❌\n" +
      "│ 𝑹𝒆𝒔𝒆𝒕 𝒇𝒂𝒊𝒍𝒆𝒅. 𝑻𝒓𝒚 𝒂𝒈𝒂𝒊𝒏 𝒍𝒂𝒕𝒆𝒓\n" +
      "╰═══✨✨✨✨═══╯"
    );
  }
};

// 🎨 Fonction Edit (Gemini-Edit)
const handleEdit = async (api, event, message, args) => {
  const prompt = args.join(" ");
  if (!prompt) return message.reply(
    "╭═══✨✨✨═══╮\n" +
    "│ ❌ 𝑺𝒀𝑵𝑻𝑨𝑿 𝑬𝑹𝑹𝑶𝑹 ❌\n" +
    "│ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒑𝒓𝒐𝒗𝒊𝒅𝒆 𝒂 𝒑𝒓𝒐𝒎𝒑𝒕\n" +
    "│ 𝒆𝒙: .ai edit a beautiful landscape\n" +
    "╰═══✨✨✨✨═══╯"
  );

  api.setMessageReaction("⏳", event.messageID, () => {}, true);
  try {
    const params = { prompt };
    if (event.messageReply?.attachments?.[0]?.url) {
      params.imgurl = event.messageReply.attachments[0].url;
    }

    const res = await axios.get(EDIT_API, { params });

    if (!res.data?.images?.[0]) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply(
        "╭═══✨✨✨═══╮\n" +
        "│ ❌ 𝑰𝑴𝑨𝑮𝑬 𝑬𝑹𝑹𝑶𝑹 ❌\n" +
        "│ 𝑭𝒂𝒊𝒍𝒆𝒅 𝒕𝒐 𝒈𝒆𝒏𝒆𝒓𝒂𝒕𝒆 𝒊𝒎𝒂𝒈𝒆\n" +
        "│ 𝑪𝒉𝒆𝒄𝒌 𝒚𝒐𝒖𝒓 𝒑𝒓𝒐𝒎𝒑𝒕\n" +
        "╰═══✨✨✨✨═══╯"
      );
    }

    const base64Image = res.data.images[0].replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");

    const imagePath = path.join(TMP_DIR, `${Date.now()}.png`);
    fs.writeFileSync(imagePath, buffer);

    api.setMessageReaction("✅", event.messageID, () => {}, true);
    await message.reply({ 
      body: "╭═══✨✨✨═══╮\n" +
            "│ 🎨 𝑰𝑴𝑨𝑮𝑬 𝑮𝑬𝑵𝑬𝑹𝑨𝑻𝑬𝑫 🎨\n" +
            "│ 𝑷𝒓𝒐𝒎𝒑𝒕: " + prompt.substring(0, 40) + (prompt.length > 40 ? "..." : "") + "\n" +
            "│ 𝑺𝒕𝒂𝒕𝒖𝒔: 𝑺𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍\n" +
            "╰═══✨✨✨✨═══╯",
      attachment: fs.createReadStream(imagePath) 
    });
    fs.unlinkSync(imagePath);
  } catch (error) {
    console.error("❌ EDIT API Error:", error.response?.data || error.message);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return message.reply(
      "╭═══✨✨✨═══╮\n" +
      "│ ❌ 𝑨𝑷𝑰 𝑬𝑹𝑹𝑶𝑹 ❌\n" +
      "│ 𝑬𝒅𝒊𝒕 𝒇𝒂𝒊𝒍𝒆𝒅. 𝑻𝒓𝒚 𝒂𝒈𝒂𝒊𝒏 𝒍𝒂𝒕𝒆𝒓\n" +
      "╰═══✨✨✨✨═══╯"
    );
  }
};

// 🎬 Fonction YouTube
const handleYouTube = async (api, event, message, args) => {
  const option = args[0];
  if (!["-v", "-a"].includes(option)) {
    return message.reply(
      "╭═══✨✨✨═══╮\n" +
      "│ 📖 𝑺𝒀𝑵𝑻𝑨𝑿 𝑮𝑼𝑰𝑫𝑬 📖\n" +
      "│ .ai yt -v <search/url>\n" +
      "│ .ai yt -a <search/url>\n" +
      "╰═══✨✨✨✨═══╯"
    );
  }

  const query = args.slice(1).join(" ");
  if (!query) return message.reply(
    "╭═══✨✨✨═══╮\n" +
    "│ ❌ 𝑴𝑰𝑺𝑺𝑰𝑵𝑮 𝑸𝑼𝑬𝑹𝒀 ❌\n" +
    "│ 𝑷𝒓𝒐𝒗𝒊𝒅𝒆 𝒂 𝒔𝒆𝒂𝒓𝒄𝒉 𝒒𝒖𝒆𝒓𝒚 𝒐𝒓 𝑼𝑹𝑳\n" +
    "╰═══✨✨✨✨═══╯"
  );

  const sendFile = async (url, type) => {
    try {
      const { data } = await axios.get(`${YT_API}?url=${encodeURIComponent(url)}&type=${type}`);
      const downloadUrl = data.download_url;
      if (!data.status || !downloadUrl) throw new Error("API failed");
      const filePath = path.join(TMP_DIR, `yt_${Date.now()}.${type}`);
      const writer = fs.createWriteStream(filePath);
      const stream = await axios({ url: downloadUrl, responseType: "stream" });
      stream.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
      
      const downloadType = type === "mp4" ? "🎬 𝑽𝑰𝑫𝑬𝑶" : "🎵 𝑨𝑼𝑫𝑰𝑶";
      await message.reply({ 
        body: "╭═══✨✨✨═══╮\n" +
              `│ ${downloadType}\n` +
              "│ 𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝒄𝒐𝒎𝒑𝒍𝒆𝒕𝒆𝒅\n" +
              "│ 𝑻𝒚𝒑𝒆: " + type.toUpperCase() + "\n" +
              "╰═══✨✨✨✨═══╯",
        attachment: fs.createReadStream(filePath) 
      });
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`${type} error:`, err.message);
      message.reply(
        "╭═══✨✨✨═══╮\n" +
        "│ ❌ 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫 𝑬𝑹𝑹𝑶𝑹 ❌\n" +
        "│ 𝑭𝒂𝒊𝒍𝒆𝒅 𝒕𝒐 𝒅𝒐𝒘𝒏𝒍𝒐𝒂𝒅 " + type.toUpperCase() + "\n" +
        "╰═══✨✨✨✨═══╯"
      );
    }
  };

  if (query.startsWith("http")) return await sendFile(query, option === "-v" ? "mp4" : "mp3");

  try {
    const results = (await ytSearch(query)).videos.slice(0, 6);
    if (results.length === 0) return message.reply(
      "╭═══✨✨✨═══╮\n" +
      "│ ❌ 𝑵𝑶 𝑹𝑬𝑺𝑼𝑳𝑻𝑺 ❌\n" +
      "│ 𝑵𝒐 𝒓𝒆𝒔𝒖𝒍𝒕𝒔 𝒇𝒐𝒖𝒏𝒅 𝒇𝒐𝒓: " + query + "\n" +
      "╰═══✨✨✨✨═══╯"
    );

    let list = "╭═══✨✨✨═══╮\n" +
               "│ 🎬 𝒀𝑶𝑼𝑻𝑼𝑩𝑬 𝑺𝑬𝑨𝑹𝑪𝑯 🎬\n" +
               "│ 𝑸𝒖𝒆𝒓𝒚: " + query + "\n" +
               "╰═══✨✨✨✨═══╯\n\n";
    
    results.forEach((v, i) => {
      list += "╭═══✨✨✨═══╮\n" +
              `│ ${i + 1}. ${v.title.substring(0, 30)}...\n` +
              `│ ⏱️ ${v.timestamp} | 👁️ ${v.views}\n` +
              "╰═══✨✨✨✨═══╯\n";
    });

    const thumbs = await Promise.all(
      results.map(v => axios.get(v.thumbnail, { responseType: "stream" }).then(res => res.data))
    );

    list += "\n╭═══✨✨✨═══╮\n" +
            "│ 📝 𝑰𝑵𝑺𝑻𝑹𝑼𝑪𝑻𝑰𝑶𝑵𝑺\n" +
            "│ 𝑹𝒆𝒑𝒍𝒚 𝒘𝒊𝒕𝒉 𝒏𝒖𝒎𝒃𝒆𝒓 (1-6)\n" +
            "╰═══✨✨✨✨═══╯";

    api.sendMessage(
      { body: list, attachment: thumbs },
      event.threadID,
      (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "ai",
          messageID: info.messageID,
          author: event.senderID,
          results,
          type: option
        });
      },
      event.messageID
    );
  } catch (err) {
    console.error("YouTube error:", err.message);
    message.reply(
      "╭═══✨✨✨═══╮\n" +
      "│ ❌ 𝒀𝑶𝑼𝑻𝑼𝑩𝑬 𝑬𝑹𝑹𝑶𝑹 ❌\n" +
      "│ 𝑭𝒂𝒊𝒍𝒆𝒅 𝒕𝒐 𝒔𝒆𝒂𝒓𝒄𝒉 𝒀𝒐𝒖𝑻𝒖𝒃𝒆\n" +
      "╰═══✨✨✨✨═══╯"
    );
  }
};

// 🧠 Fonction IA principale
const handleAIRequest = async (api, event, userInput, message, isReply = false) => {
  const args = userInput.split(" ");
  const first = args[0]?.toLowerCase();

  if (["edit", "-e"].includes(first)) {
    return await handleEdit(api, event, message, args.slice(1));
  }

  if (["youtube", "yt", "ytb"].includes(first)) {
    return await handleYouTube(api, event, message, args.slice(1));
  }

  const userId = event.senderID;
  let messageContent = userInput;
  let imageUrl = null;

  api.setMessageReaction("⏳", event.messageID, () => {}, true);

  const urlMatch = messageContent.match(/(https?:\/\/[^\s]+)/)?.[0];
  if (urlMatch && validUrl.isWebUri(urlMatch)) {
    imageUrl = urlMatch;
    messageContent = messageContent.replace(urlMatch, '').trim();
  }

  if (!messageContent && !imageUrl) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return message.reply(
      "╭═══✨✨✨═══╮\n" +
      "│ ❌ 𝑴𝑰𝑺𝑺𝑰𝑵𝑮 𝑴𝑬𝑺𝑺𝑨𝑮𝑬 ❌\n" +
      "│ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒑𝒓𝒐𝒗𝒊𝒅𝒆 𝒂 𝒎𝒆𝒔𝒔𝒂𝒈𝒆\n" +
      "╰═══✨✨✨✨═══╯"
    );
  }

  try {
    const response = await axios.post(API_ENDPOINT, { uid: userId, message: messageContent, image_url: imageUrl });
    const { reply: textReply, image_url: genImageUrl } = response.data;

    let finalReply = textReply || '✅ AI Response:';
    finalReply = finalReply
      .replace(/🎀\s*𝗦𝗵𝗶𝘇𝘂/gi, '🎀★TRØN†ARËS†HELLD★')
      .replace(/Shizu/gi, 'TRØN ARËS')
      .replace(/Christuska/gi, 'TRØN ARËS')
      .replace(/Aryan Chauhan/gi, 'TRØN ARËS')
      .replace(/Christus/gi, 'TRØN ARËS');

    // Découper la réponse en plusieurs blocs si nécessaire
    const replyChunks = [];
    const maxLength = 300;
    for (let i = 0; i < finalReply.length; i += maxLength) {
      replyChunks.push(finalReply.substring(i, i + maxLength));
    }

    const attachments = [];
    if (genImageUrl) {
      attachments.push(fs.createReadStream(await downloadFile(genImageUrl, 'jpg')));
    }

    let formattedReply = "╭═══✨✨✨═══╮\n" +
                         "│ ⚡ 𝑻𝑹Ø𝑵 𝑨𝑹Ë𝑺 𝑨𝑰 ⚡\n" +
                         "│ 𝑼𝑰𝑫: " + userId + "\n" +
                         "╰═══✨✨✨✨═══╯\n\n";

    // Premier bloc de réponse
    formattedReply += "╭═══✨✨✨═══╮\n" +
                      "│ 🧠 𝑵𝑬𝑼𝑹𝑨𝑳 𝑹𝑬𝑺𝑷𝑶𝑵𝑺𝑬\n" +
                      "│ " + toAZStyle(replyChunks[0]) + "\n" +
                      "╰═══✨✨✨✨═══╯";

    // Blocs supplémentaires si nécessaire
    for (let i = 1; i < replyChunks.length; i++) {
      formattedReply += "\n\n╭═══✨✨✨═══╮\n" +
                        "│ 📝 𝑪𝑶𝑵𝑻𝑰𝑵𝑼𝑬𝑫\n" +
                        "│ " + toAZStyle(replyChunks[i]) + "\n" +
                        "╰═══✨✨✨✨═══╯";
    }

    if (imageUrl) {
      formattedReply += "\n\n╭═══✨✨✨═══╮\n" +
                        "│ 🖼️ 𝑰𝑴𝑨𝑮𝑬 𝑫𝑬𝑻𝑬𝑪𝑻𝑬𝑫\n" +
                        "│ 𝑰𝒎𝒂𝒈𝒆 𝒑𝒓𝒐𝒄𝒆𝒔𝒔𝒊𝒏𝒈 𝒄𝒐𝒎𝒑𝒍𝒆𝒕𝒆\n" +
                        "╰═══✨✨✨✨═══╯";
    }

    const sentMessage = await message.reply({
      body: formattedReply,
      attachment: attachments.length > 0 ? attachments : undefined
    });

    global.GoatBot.onReply.set(sentMessage.messageID, {
      commandName: 'ai',
      messageID: sentMessage.messageID,
      author: userId
    });

    api.setMessageReaction("✅", event.messageID, () => {}, true);
  } catch (error) {
    console.error("❌ API Error:", error.message);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    message.reply(
      "╭═══✨✨✨═══╮\n" +
      "│ ❌ 𝑨𝑰 𝑬𝑹𝑹𝑶𝑹 ❌\n" +
      "│ " + error.message.substring(0, 50) + "\n" +
      "╰═══✨✨✨✨═══╯"
    );
  }
};

module.exports = {
  config: {
    name: 'gpt',
    version: '6.0',
    author: 'TRØN ARËS',
    role: 0,
    category: '⚡ ai',
    longDescription: { en: 'TRØN ARËS Neural Network: Advanced AI with Image Generation, YouTube Downloads, and Image Editing' },
    guide: {
      en: 
      "╭═══✨✨✨═══╮\n" +
      "│ ⚡ 𝑨𝑰 𝑪𝑶𝑴𝑴𝑨𝑵𝑫𝑺 ⚡\n" +
      "╰═══✨✨✨✨═══╯\n\n" +
      "╭═══✨✨✨═══╮\n" +
      "│ 🎁 .ai <message>\n" +
      "│ 🧠 𝑪𝒉𝒂𝒕 𝒘𝒊𝒕𝒉 𝑨𝑰\n" +
      "╰═══✨✨✨✨═══╯\n\n" +
      "╭═══✨✨✨═══╮\n" +
      "│ 🎁 .ai edit <prompt>\n" +
      "│ 🎨 𝑰𝒎𝒂𝒈𝒆 𝑮𝒆𝒏/𝑬𝒅𝒊𝒕\n" +
      "╰═══✨✨✨✨═══╯\n\n" +
      "╭═══✨✨✨═══╮\n" +
      "│ 🎁 .ai yt -v <query>\n" +
      "│ 🎬 𝑽𝒊𝒅𝒆𝒐 𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅\n" +
      "╰═══✨✨✨✨═══╯\n\n" +
      "╭═══✨✨✨═══╮\n" +
      "│ 🎁 .ai yt -a <query>\n" +
      "│ 🎵 𝑨𝒖𝒅𝒊𝒐 𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅\n" +
      "╰═══✨✨✨✨═══╯\n\n" +
      "╭═══✨✨✨═══╮\n" +
      "│ 🎁 .ai clear\n" +
      "│ ♻️ 𝑹𝒆𝒔𝒆𝒕 𝑪𝒐𝒏𝒗𝒆𝒓𝒔𝒂𝒕𝒊𝒐𝒏\n" +
      "╰═══✨✨✨✨═══╯"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const userInput = args.join(' ').trim();
    if (!userInput) return message.reply(
      "╭═══✨✨✨═══╮\n" +
      "│ ❌ 𝑴𝑰𝑺𝑺𝑰𝑵𝑮 𝑰𝑵𝑷𝑼𝑻 ❌\n" +
      "│ 𝑬𝒏𝒕𝒆𝒓 𝒂 𝒎𝒆𝒔𝒔𝒂𝒈𝒆\n" +
      "│ 𝒆𝒙: .ai hello\n" +
      "╰═══✨✨✨✨═══╯"
    );
    if (['clear', 'reset'].includes(userInput.toLowerCase())) {
      return await resetConversation(api, event, message);
    }
    return await handleAIRequest(api, event, userInput, message);
  },

  onReply: async function ({ api, event, Reply, message }) {
    if (event.senderID !== Reply.author) return;
    const userInput = event.body?.trim();
    if (!userInput) return;
    if (['clear', 'reset'].includes(userInput.toLowerCase())) {
      return await resetConversation(api, event, message);
    }
    if (Reply.results && Reply.type) {
      const idx = parseInt(userInput);
      const list = Reply.results;
      if (isNaN(idx) || idx < 1 || idx > list.length)
        return message.reply(
          "╭═══✨✨✨═══╮\n" +
          "│ ❌ 𝑰𝑵𝑽𝑨𝑳𝑰𝑫 𝑺𝑬𝑳𝑬𝑪𝑻𝑰𝑶𝑵 ❌\n" +
          "│ 𝑼𝒔𝒆 𝒏𝒖𝒎𝒃𝒆𝒓𝒔 1-6\n" +
          "╰═══✨✨✨✨═══╯"
        );
      const selected = list[idx - 1];
      const type = Reply.type === "-v" ? "mp4" : "mp3";
      const fileUrl = `${YT_API}?url=${encodeURIComponent(selected.url)}&type=${type}`;
      try {
        const { data } = await axios.get(fileUrl);
        const downloadUrl = data.download_url;
        const filePath = await downloadFile(downloadUrl, type);
        
        const downloadType = type === "mp4" ? "🎬 𝑽𝑰𝑫𝑬𝑶" : "🎵 𝑨𝑼𝑫𝑰𝑶";
        await message.reply({ 
          body: "╭═══✨✨✨═══╮\n" +
                `│ ${downloadType}\n` +
                `│ ${selected.title.substring(0, 30)}...\n` +
                `│ ⏱️ ${selected.timestamp}\n` +
                "╰═══✨✨✨✨═══╯",
          attachment: fs.createReadStream(filePath) 
        });
        fs.unlinkSync(filePath);
      } catch {
        message.reply(
          "╭═══✨✨✨═══╮\n" +
          "│ ❌ 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫 𝑬𝑹𝑹𝑶𝑹 ❌\n" +
          "│ 𝑭𝒂𝒊𝒍𝒆𝒅 𝒕𝒐 𝒅𝒐𝒘𝒏𝒍𝒐𝒂𝒅\n" +
          "╰═══✨✨✨✨═══╯"
        );
      }
    } else {
      return await handleAIRequest(api, event, userInput, message, true);
    }
  },

  onChat: async function ({ api, event, message }) {
    const body = event.body?.trim();
    if (!body?.toLowerCase().startsWith('ai ')) return;
    const userInput = body.slice(3).trim();
    if (!userInput) return;
    return await handleAIRequest(api, event, userInput, message);
  }
};
  
