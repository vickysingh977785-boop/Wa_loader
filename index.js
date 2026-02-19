const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    PHONENUMBER_MCC
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startLoader() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, // QR nahi chahiye humein
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // --- PAIRING CODE LOGIC ---
    if (!sock.authState.creds.registered) {
        const phoneNumber = await question("Apna WhatsApp Number daalein (+91 ke saath): ");
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log(`\n🚀 AAPKA PAIRING CODE HAI: ${code}\n`);
        console.log("WhatsApp -> Linked Devices -> Link with Phone Number par ye code daalein.");
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection } = update;
        if (connection === "open") {
            console.log("✅ LOADER CONNECTED!");
            // Yahan se aapka message loop shuru ho jayega
        }
    });
}

startLoader();
