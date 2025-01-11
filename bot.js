const { default: makeWASocket, DisconnectReason } = require("@adiwajshing/baileys");
const axios = require("axios");
const { exec } = require("child_process");

const startBot = () => {
    const sock = makeWASocket();
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const messageContent = msg.message.conversation || "";

        if (messageContent.startsWith("!ping")) {
            await sock.sendMessage(from, { text: "TenshiBot is alive! 🏓" });
        }

        if (messageContent.startsWith("!ask")) {
            const question = messageContent.replace("!ask", "").trim();
            try {
                const response = await axios.post(
                    "https://api.openai.com/v1/completions",
                    {
                        model: "text-davinci-003",
                        prompt: question,
                        max_tokens: 150,
                    },
                    {
                        headers: {
                            "Authorization": `Bearer YOUR_OPENAI_API_KEY`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                const answer = response.data.choices[0].text.trim();
                await sock.sendMessage(from, { text: `🤖 AI says: ${answer}` });
            } catch (err) {
                await sock.sendMessage(from, { text: "❌ AI request failed." });
            }
        }
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
            startBot();
        } else if (connection === "open") {
            console.log("TenshiBot is online!");
        }
    });
};

startBot();
