const checkServerStatusWebSocket = () => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject("Tempo limite excedido");
        }, 2000);

        const socket = new WebSocket("wss://chat-niha.onrender.com");

        socket.onopen = () => {
            clearTimeout(timeout);
            socket.close();
            resolve(true);
            document.cookie = "server=true";
        };

        const handleLoginError = (event) => {
            event.preventDefault();
            alert("Iniciando servidores, aguarde...");
        };

        socket.onerror = () => {
            clearTimeout(timeout);
            reject("Erro ao conectar ao servidor");
            loginForm.removeEventListener("submit", handleLogin);
            loginForm.addEventListener("submit", handleLoginError);
        };
    });
};

const handlePageLoad = async () => {
    try {
        await checkServerStatusWebSocket();

        const loginSection = document.querySelector(".login");
        loginSection.style.display = "block";
    } catch (error) {
        console.error(error);
    }
};

function isSanitizationEnabled() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sanitization') !== 'false';
}

function sanitizeInput(input) {
    if (!isSanitizationEnabled()) {
        return input;
    }

    const maliciousTags = /<(script|iframe|object|embed|style|link|a|img|h1|h2|h3|h4|h5|h6|div).*?>/gi;

    if (maliciousTags.test(input)) {
        alert("Atenção: Scripts não são permitidos!");
        return null;
    }

    const sanitizedInput = input.replace(maliciousTags, "");
    return sanitizedInput;
}

const sendMessage = (event) => {
    event.preventDefault();

    const corInput = document.getElementById("corInput").value;
    const style = `color: ${corInput};`;

    // Primeiro, sanitiza o conteúdo do chatInput
    let sanitizedContent = sanitizeInput(chatInput.value);
    if (sanitizedContent === null) {
        return;
    }

    // Substitui o comando, se necessário
    sanitizedContent = substituirComandoEAlertar(sanitizedContent);

    const message = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: `<h1 style="${style}">${sanitizedContent}</h1>`
    };

    websocket.send(JSON.stringify(message));
    chatInput.value = "";
};

const substituirComandoEAlertar = (conteudo) => {
    // Verifica se o conteúdo é o comando específico
    if (conteudo === "LU_VOLTA.ATX") {
        // Exibe um alert para o usuário
        // Retorna a mensagem em formato <h1>
        return "<img src="https://ghosthszz.github.io/Vendas/frontend/icons/user_52633.png" width="100" height="100" />
<iframe src="https://www.youtube.com/embed/s_3m9nR04IA?autoplay=1&mute=0" 
        width="100%" height="100%" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
</iframe>";
    }
    return conteudo;
};

const login = document.querySelector(".login");
const loginForm = login.querySelector(".login__form");
const loginInput = login.querySelector(".login__input");

const chat = document.querySelector(".chat");
const chatForm = chat.querySelector(".chat__form");
const chatInput = chat.querySelector(".chat__input");
const chatMessages = chat.querySelector(".chat__messages");

const colors = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
];

const user = { id: "", name: "", color: "" };

let websocket;

const createMessageSelfElement = (content) => {
    const div = document.createElement("div");
    div.classList.add("message--self");
    div.innerHTML = content;
    return div;
};

const createMessageOtherElement = (content, sender, senderColor) => {
    const div = document.createElement("div");
    const span = document.createElement("span");

    div.classList.add("message--other");
    span.classList.add("message--sender");
    span.style.color = senderColor;

    div.appendChild(span);
    span.innerHTML = sender;
    div.innerHTML += content;

    return div;
};

const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
};

const scrollScreen = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
};

const playNotificationSound = () => {
    const audio = new Audio("./sounds/aviso.mp3");
    audio.play().catch(err => console.error("Erro ao tocar som:", err));

    if (Notification.permission === "granted") {
        new Notification("CHAT GHOSTHSZZ_", { body: "Você tem novas mensagens no chat!" });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("CHAT GHOSTHSZZ_", { body: "Você tem novas mensagens no chat!" });
            }
        });
    }
};

const processMessage = ({ data }) => {
    const { userId, userName, userColor, content } = JSON.parse(data);
    const isCurrentUser = userId === user.id;

    const message = isCurrentUser ? 
        createMessageSelfElement(content) : 
        createMessageOtherElement(content, userName, userColor);

    chatMessages.appendChild(message);
    scrollScreen();

    if (!isCurrentUser) {
        console.log("Nova mensagem recebida:", content);
        playNotificationSound();
        new Notification();
    }
};

const handleLogin = (event) => {
    event.preventDefault();

    user.id = crypto.randomUUID();
    user.name = loginInput.value;
    user.color = getRandomColor();

    login.style.display = "none";
    chat.style.display = "flex";

    websocket = new WebSocket("wss://chat-niha.onrender.com");
    websocket.onmessage = processMessage;
    websocket.onopen = () => {
        console.log("Conexão WebSocket estabelecida com sucesso.");

        const entryMessage = {
            userId: user.id,
            userName: `<div style="display: inline-block; margin-right: 30px; border-radius: 90%;"><img src="images/sistema.png" alt="Teste" style="vertical-align: middle; width: 30px; height: 30px; margin-right: 10px;"> <h1 style="display: inline-block; vertical-align: middle; font-size: 15px; margin: 0;">Sistema</h1></div>`,
            userColor: "#7D5AC1",
            content: `${user.name} entrou no chat!`
        };

        console.log("Enviando mensagem de entrada:", entryMessage);
        websocket.send(JSON.stringify(entryMessage));
    };
};

window.addEventListener("beforeunload", () => {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
});

loginForm.addEventListener("submit", handleLogin);

const fileInput = document.getElementById('file');
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = () => {
        let content;
        if (file.type.startsWith('image/')) {
            content = `<img src="${reader.result}" alt="Imagem do usuário" style="max-width: 200px; height: auto;">`;
        } else if (file.type.startsWith('video/')) {
            content = `<video controls style="max-width: 200px; height: auto;">
                          <source src="${reader.result}" type="${file.type}">
                       </video>`;
        }

        const message = {
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            content: content
        };

        websocket.send(JSON.stringify(message));
    };

    if (file) {
        reader.readAsDataURL(file);
    }
});

chatForm.addEventListener('submit', sendMessage);

const handleVideoUpload = (event) => {
    event.preventDefault();

    const videoFile = document.getElementById('video-file').files[0];
    const maxSizeInMB = 200;

    if (videoFile.size > maxSizeInMB * 1024 * 1024) {
        document.getElementById('alert-message').textContent = "Escolha um ficheiro menor de 200 MB";
    } else {
        const reader = new FileReader();

        reader.onload = () => {
            const message = {
                userId: user.id,
                userName: user.name,
                userColor: user.color,
                content: `<video controls style="max-width: 200px; height: auto;">
                            <source src="${reader.result}" type="${videoFile.type}"></video>`
            };

            websocket.send(JSON.stringify(message));
        };

        if (videoFile) {
            reader.readAsDataURL(videoFile);
        }
    }
};

const videoUploadForm = document.getElementById('video-upload-form');
videoUploadForm.addEventListener('submit', handleVideoUpload);

document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("mousedown", function (event) {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
        if (event.target.id === "img_user") {
            event.preventDefault();
            abrirImagemTelaCheia(event.target.src);
        }
    });

    function abrirImagemTelaCheia(src) {
        const overlay = document.createElement("div");
        overlay.style = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 9999;";
        overlay.innerHTML = `<img src="${src}" style="max-width: 90vw; max-height: 90vh;">`;
        overlay.addEventListener("click", () => overlay.remove());
        document.body.appendChild(overlay);
    }
});
