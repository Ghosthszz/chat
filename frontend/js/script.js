/*************************
 * VARIÁVEIS GLOBAIS
 *************************/
let websocket;
let ytPlayerDiv = null;
let iframeAvancado = false;


const colors = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
];

const user = { id: "", name: "", color: "" };

/*************************
 * DOM ELEMENTS
 *************************/
const login = document.querySelector(".login");
const loginForm = login.querySelector(".login__form");
const loginInput = login.querySelector(".login__input");

const chat = document.querySelector(".chat");
const chatForm = chat.querySelector(".chat__form");
const chatInput = chat.querySelector(".chat__input");
const chatMessages = chat.querySelector(".chat__messages");

/*************************
 * HELPERS
 *************************/
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const scrollScreen = () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

const isSanitizationEnabled = () =>
    new URLSearchParams(window.location.search).get("sanitization") !== "false";

function sanitizeInput(input) {
    if (!isSanitizationEnabled()) return input;

    const forbidden = /<(script|iframe|object|embed|style|link|a|img|h1|h2|h3|h4|h5|h6|div).*?>/gi;
    if (forbidden.test(input)) {
        alert("Atenção: Scripts não são permitidos!");
        return null;
    }
    return input.replace(forbidden, "");
}

const playNotificationSound = () => {
    new Audio("./sounds/aviso.mp3").play().catch(() => {});

    if (Notification.permission === "granted") {
        new Notification("CHAT GHOSTHSZZ_", { body: "Você tem novas mensagens no chat!" });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(p => {
            if (p === "granted") new Notification("CHAT GHOSTHSZZ_", { body: "Você tem novas mensagens no chat!" });
        });
    }
};

/*************************
 * MENSAGENS
 *************************/
const createMessageSelfElement = content => {
    const div = document.createElement("div");
    div.className = "message--self";
    div.innerHTML = content;
    return div;
};

const createMessageOtherElement = (content, sender, color) => {
    const div = document.createElement("div");
    div.className = "message--other";

    const span = document.createElement("span");
    span.className = "message--sender";
    span.style.color = "color";
    span.style.fontSize = '10px'
    span.innerHTML = sender;

    div.appendChild(span);
    div.innerHTML += content;
    return div;
};

/*************************
 * YOUTUBE PLAYER
 *************************/
function criarOuAtualizarPlayer(videoId) {
    if (!ytPlayerDiv) {
        ytPlayerDiv = document.createElement("div");
        ytPlayerDiv.className = "youtube-player";
        document.body.appendChild(ytPlayerDiv);
    }

    const origin = window.location.origin;

    ytPlayerDiv.innerHTML = `
        <iframe
            width="560"
            height="315"
            src="https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${origin}&autoplay=1&mute=1"
            frameborder="0"
            allow="autoplay; encrypted-media"
            allowfullscreen>
        </iframe>
    `;
}

function controlarPlayer(action) {
    if (!ytPlayerDiv) return;

    if (action === "close") {
        ytPlayerDiv.remove();
        ytPlayerDiv = null;
        iframeAvancado = false;
    }

    if (action === "change") {
        iframeAvancado = false;
        abrirModalIframe();
    }
}

function extrairVideoId(url) {
    try {
        const u = new URL(url);
        if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
        if (u.searchParams.get("v")) return u.searchParams.get("v");
    } catch {}
    return null;
}


/*************************
 * MODAL IFRAME
 *************************/
function controlesAvancadosHTML() {
    return `
        <button data-action="pause">⏸ Pausar</button>
        <button data-action="play">▶️ Play</button>
        <button data-action="change">⏭ Trocar</button>
        <button data-action="close">❌ Fechar</button>
    `;
}

function bindControlesAvancados(modal) {
    modal.querySelectorAll("button").forEach(btn => {
        btn.onclick = () => {
            websocket.send(JSON.stringify({
                type: "IFRAME_CONTROL",
                action: btn.dataset.action
            }));
            modal.remove();
        };
    });
}

function abrirModalIframe() {
    const modal = document.createElement("div");
    modal.style = `
        position: fixed; inset:0;
        background: rgba(0,0,0,.7);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000;
    `;

    modal.innerHTML = `
        <div style="background:#212121;padding:20px;border-radius:10px;width:300px;">
            <h3>🎵 Música YouTube</h3>
            ${iframeAvancado ? controlesAvancadosHTML() : `
                <input id="ytLink" placeholder="Link do YouTube" style="width:100%;padding:10px;">
                <button id="playYT" style="width:100%;margin-top:10px">Reproduzir</button>
            `}
        </div>
    `;

    document.body.appendChild(modal);
    modal.onclick = e => e.target === modal && modal.remove();

    if (!iframeAvancado) {
        document.getElementById("playYT").onclick = () => {
            const videoId = extrairVideoId(document.getElementById("ytLink").value);
            if (!videoId) return alert("Link inválido");

            websocket.send(JSON.stringify({ type: "IFRAME_PLAY", videoId }));
            iframeAvancado = true;
            modal.remove();
        };
    } else {
        bindControlesAvancados(modal);
    }
}

/*************************
 * PROCESSAMENTO DE MENSAGENS
 *************************/
const processMessage = ({ data }) => {
    const payload = JSON.parse(data);

    // Player YouTube
    if (payload.type === "IFRAME_PLAY") {
        criarOuAtualizarPlayer(payload.videoId);
        return;
    }

    if (payload.type === "IFRAME_CONTROL") {
        controlarPlayer(payload.action);
        return;
    }

    const { userId, userName, userColor, content } = payload;
    const isCurrentUser = userId === user.id;
    const textContent = content.replace(/<\/?[^>]+(>|$)/g, "").trim();

    // Comandos especiais
    if (textContent.toLowerCase() === "!cp") {
        const overlay = document.createElement("div");
        overlay.style = `position: fixed; inset:0; background: rgba(0,0,0,.8); display:flex;align-items:center;justify-content:center; z-index:9999;`;
        overlay.innerHTML = `<img src="images/jump.gif" style="max-width:90vw; max-height:90vh;"><audio id="jumpAudio" autoplay><source src="sounds/jump.mp3"></audio>`;
        overlay.onclick = () => { overlay.remove(); document.getElementById('jumpAudio')?.pause(); };
        document.body.appendChild(overlay);
        setTimeout(() => { overlay.remove(); document.getElementById('jumpAudio')?.pause(); }, 1500);
        return;
    }

    if (textContent.toLowerCase() === "!mr") {
        const overlay = document.createElement("div");
        overlay.style = `position: fixed; inset:0; background: rgba(0,0,0,.8); display:flex;align-items:center;justify-content:center; z-index:9999;`;
        overlay.innerHTML = `<img src="images/gm.png" style="max-width:90vw; max-height:90vh;"><audio id="jumpAudio" autoplay><source src="sounds/gm.mp3"></audio>`;
        overlay.onclick = () => { overlay.remove(); document.getElementById('jumpAudio')?.pause(); };
        document.body.appendChild(overlay);
        setTimeout(() => { overlay.remove(); }, 5000);
        return;
    }

    // Mensagem normal
    const message = isCurrentUser
        ? createMessageSelfElement(content)
        : createMessageOtherElement(content, userName, userColor);

    chatMessages.appendChild(message);
    scrollScreen();

    if (!isCurrentUser) playNotificationSound();
};

/*************************
 * LOGIN
 *************************/
const handleLogin = event => {
    event.preventDefault();

    user.id = crypto.randomUUID();
    user.name = loginInput.value;
    user.color = getRandomColor();

    login.style.display = "none";
    chat.style.display = "flex";

    websocket = new WebSocket("wss://chat-niha.onrender.com");
    websocket.onmessage = processMessage;

    websocket.onopen = () => {
        websocket.send(JSON.stringify({
            userId: user.id,
            userName: `<div style="display:inline-block;margin-right:10px;"><img src="images/sistema.png" style="width:30px;height:30px;"></div> Sistema`,
            userColor: "#7D5AC1",
            content: `${user.name} entrou no chat!`
        }));
    };
};

/*************************
 * ENVIO DE MENSAGENS
 *************************/
const sendMessage = event => {
    event.preventDefault();

    // Comando especial para abrir modal do YouTube
    if (chatInput.value.trim().toLowerCase() === "!iframe") {
        abrirModalIframe();
        chatInput.value = "";
        return;
    }

    // Sanitização do input
    const sanitized = sanitizeInput(chatInput.value);
    if (sanitized === null) return;

    // Pegar a cor escolhida pelo usuário
const corInput = document.getElementById("corInput");
const userColor = corInput?.value || "#6e40c9";


    // Enviar mensagem pelo WebSocket com a cor selecionada
    websocket.send(JSON.stringify({
        userId: user.id,
        userName: user.name,
        userColor, // cor escolhida pelo usuário
        content: `<h1 style="font-size: 20px; color: ${userColor};">${sanitized}</h1>`
    }));

    // Limpar input
    chatInput.value = "";
};


/*************************
 * ENVIO DE ARQUIVOS
 *************************/
document.getElementById('file')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        let content = "";
        if (file.type.startsWith("image/")) content = `<img src="${reader.result}" style="max-width:200px;">`;
        if (file.type.startsWith("video/")) content = `<video controls style="max-width:200px;"><source src="${reader.result}" type="${file.type}"></video>`;
        websocket.send(JSON.stringify({
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            content
        }));
    };
    reader.readAsDataURL(file);
});

/*************************
 * EVENTOS
 *************************/
loginForm.addEventListener("submit", handleLogin);
chatForm.addEventListener("submit", sendMessage);

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("mousedown", e => {
        if (e.target.id === "img_user") {
            const overlay = document.createElement("div");
            overlay.style = `position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:9999;`;
            overlay.innerHTML = `<img src="${e.target.src}" style="max-width:90vw; max-height:90vh;">`;
            overlay.onclick = () => overlay.remove();
            document.body.appendChild(overlay);
        }

        if (Notification.permission !== "granted") Notification.requestPermission();
    });
});
