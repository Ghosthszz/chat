// Função para verificar se o servidor local está respondendo via WebSocket
const checkServerStatusWebSocket = () => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject("Tempo limite excedido");
        }, 2000); // Tempo limite de 2 segundos

        const socket = new WebSocket("wss://chat-niha.onrender.com");

        socket.onopen = () => {
            clearTimeout(timeout); // Cancela o timeout
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
            clearTimeout(timeout); // Cancela o timeout
            reject("Erro ao conectar ao servidor");
            loginForm.removeEventListener("submit", handleLogin); // Remove o listener existente
            loginForm.addEventListener("submit", handleLoginError); // Adiciona um novo listener para tratar o erro
        };
    });
};

// Função para lidar com o carregamento da página
const handlePageLoad = async () => {
    try {
        await checkServerStatusWebSocket(); // Verifica se o servidor local está respondendo via WebSocket

        // Se o servidor local está respondendo, mostra o formulário de login
        const loginSection = document.querySelector(".login");
        loginSection.style.display = "block";
    } catch (error) {
        console.error(error);
    }
};

// Função para enviar mensagem com estilo personalizado
const sendMessage = (event) => {
    event.preventDefault();

    // Obtendo o valor da cor digitada pelo usuário
    const corInput = document.getElementById("corInput").value;
    // Construindo o estilo CSS com a cor selecionada
    const style = `color: ${corInput};`;

    // Construindo a mensagem com o estilo CSS da cor selecionada
    const message = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: `<h1 style="${style}">${chatInput.value}</h1>` // Incorporando o estilo CSS
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
    audio.play();
};

const processMessage = ({ data }) => {
    const { userId, userName, userColor, content } = JSON.parse(data);

    const isCurrentUser = userId === user.id;

    // Modificando a cor do texto da mensagem dependendo do remetente
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
            userName: `<div style="display: inline-block; margin-right: 30px; border-radius: 90%;"><img src="images/sistema.png" alt="Teste" style="vertical-align: middle; width: 30px; height: 30px; margin-right: 10px;"> <h1 style="display: inline-block; vertical-align: middle; font-size: 15px; margin: 0;">Sistema</h1></div>`,
            userColor: "#7D5AC1",
            content: `${user.name} entrou no chat!`
        };

        console.log("Enviando mensagem de entrada:", entryMessage);
        websocket.send(JSON.stringify(entryMessage));
    };
};

// Remove todos os cookies
window.addEventListener("beforeunload", () => {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
});

// Adiciona um event listener para o evento de erro de conexão com o servidor
loginForm.addEventListener("submit", handleLogin);

// Adiciona um event listener para o input de arquivo para enviar automaticamente a mensagem ao selecionar um arquivo
const fileInput = document.getElementById('file');
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = () => {
        let content;
        if (file.type.startsWith('image/')) {
            // Limita a largura da imagem a 100px
            content = `<img src="${reader.result}" alt="Imagem do usuário" style="max-width: 100px; height: auto;">`;
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

// Adiciona um event listener para o formulário de envio de mensagem
chatForm.addEventListener('submit', sendMessage);

// Função para verificar o tamanho do arquivo de vídeo
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

// Adiciona um event listener para o formulário de upload de vídeo
const videoUploadForm = document.getElementById('video-upload-form');
videoUploadForm.addEventListener('submit', handleVideoUpload);
