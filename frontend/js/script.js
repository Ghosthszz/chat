// Função para verificar se o servidor local está respondendo via WebSocket
const checkServerStatusWebSocket = () => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject("Tempo limite excedido");
        }, 2000); // Tempo limite de 2 segundos

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

        // Adiciona um event listener para o evento de erro de conexão com o servidor
        socket.onerror = () => {
            clearTimeout(timeout);
            reject("Erro ao conectar ao servidor");
            loginForm.removeEventListener("submit", handleLogin);
            loginForm.addEventListener("submit", handleLoginError);
        };
    });
};

// Função para lidar com o carregamento da página
const handlePageLoad = async () => {
    try {
        await checkServerStatusWebSocket();
        const loginSection = document.querySelector(".login");
        loginSection.style.display = "block";
    } catch (error) {
        console.error(error);
    }
};

// Função para enviar mensagem com estilo personalizado
const sendMessage = (event) => {
    event.preventDefault();

    const corInput = document.getElementById("corInput").value;
    const style = `color: ${corInput};`;

    const message = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: `<h1 style="${style}">${chatInput.value}</h1>`
    };

    websocket.send(JSON.stringify(message));
    chatInput.value = "";
};

// Elementos de login
const login = document.querySelector(".login");
const loginForm = login.querySelector(".login__form");
const loginInput = login.querySelector(".login__input");

// Elementos do chat
const chat = document.querySelector(".chat");
const chatForm = chat.querySelector(".chat__form");
const chatInput = chat.querySelector(".chat__input");
const chatMessages = chat.querySelector(".chat__messages");

const colors = ["cadetblue", "darkgoldenrod", "cornflowerblue", "darkkhaki", "hotpink", "gold"];
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

    span.innerHTML = sender;
    div.appendChild(span);
    div.innerHTML += content;

    return div;
};

const getRandomColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
};

const scrollScreen = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
};

const playNotificationSound = () => {
    const audio = new Audio("./sounds/aviso.mp3");
    audio.play();
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
            userName: `<div style="display: inline-block; margin-right: 30px; border-radius: 90%;">
                          <img src="images/sistema.png" alt="Teste" style="vertical-align: middle; width: 30px; height: 30px; margin-right: 10px;">
                          <h1 style="display: inline-block; vertical-align: middle; font-size: 15px; margin: 0;">Sistema</h1>
                       </div>`,
            userColor: "#7D5AC1",
            content: `${user.name} entrou no chat!`
        };

        websocket.send(JSON.stringify(entryMessage));
    };
};

// Remove todos os cookies ao fechar a página
window.addEventListener("beforeunload", () => {
    document.cookie.split(";").forEach(cookie => {
        document.cookie = cookie.split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    });
});

loginForm.addEventListener("submit", handleLogin);

// Evento para envio de arquivos
document.getElementById('file').addEventListener('change', () => {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = () => {
        let content;
        if (file.type.startsWith('image/')) {
            content = `<img src="${reader.result}" id="img_user" alt="Imagem do usuário" style="max-width: 200px; height: auto;">`;
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

// Evento para envio de mensagem no chat
chatForm.addEventListener('submit', sendMessage);

// Verifica o tamanho do vídeo antes de enviar
document.getElementById('video-upload-form').addEventListener('submit', (event) => {
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
                            <source src="${reader.result}" type="${videoFile.type}">
                          </video>`
            };
            websocket.send(JSON.stringify(message));
        };
        reader.readAsDataURL(videoFile);
    }
});

// Função para abrir imagens em tela cheia ao clicar e segurar
document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("mousedown", function (event) {
        if (event.target.id === "img_user") {
            event.preventDefault();
            abrirImagemTelaCheia(event.target.src);
        }
    });

    function abrirImagemTelaCheia(src) {
        const overlay = document.createElement("div");
        overlay.style = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 9999;";
        overlay.innerHTML = `<img src="${src}" style="max-width: 90%; max-height: 90%; border-radius: 10px;">`;
        overlay.addEventListener("click", () => overlay.remove());
        document.body.appendChild(overlay);
    }
});