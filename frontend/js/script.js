// Função para detectar scripts no conteúdo da mensagem
const containsScript = (messageContent) => {
    const scriptRegex = /<script.*?>.*?<\/script>/gi; // Expressão regular para detectar tags <script>
    return scriptRegex.test(messageContent);
};

// Função para enviar mensagem com estilo personalizado
const sendMessage = (event) => {
    event.preventDefault();

    // Obtendo o valor da cor digitada pelo usuário
    const corInput = document.getElementById("corInput").value;
    // Construindo o estilo CSS com a cor selecionada
    const style = `color: ${corInput};`;

    // Obtendo o conteúdo da mensagem digitada pelo usuário
    const messageContent = chatInput.value;

    // Verifica se o conteúdo contém um script
    if (containsScript(messageContent)) {
        alert("Script detectado! Mensagem não pode ser enviada.");
        chatInput.value = ""; // Limpa o campo de entrada
        return; // Não envia a mensagem
    }

    // Construindo a mensagem com o estilo CSS da cor selecionada
    const message = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: `<h1 style="${style}">${messageContent}</h1>` // Incorporando o estilo CSS
    };

    websocket.send(JSON.stringify(message));

    chatInput.value = ""; // Limpa o campo de entrada após o envio
};

// Função para verificar se o servidor está respondendo via WebSocket
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

        socket.onerror = () => {
            clearTimeout(timeout); // Cancela o timeout
            reject("Erro ao conectar ao servidor");
            loginForm.removeEventListener("submit", handleLogin);
            loginForm.addEventListener("submit", handleLoginError); // Alteração para tratar erro
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

// Função para processar a mensagem recebida
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

// Função para criar o elemento de mensagem do próprio usuário
const createMessageSelfElement = (content) => {
    const div = document.createElement("div");

    div.classList.add("message--self");
    div.innerHTML = content;

    return div;
};

// Função para criar o elemento de mensagem de outro usuário
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

// Função para pegar uma cor aleatória para o usuário
const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
};

// Função para rolar a tela até o final
const scrollScreen = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
};

// Função para tocar o som de notificação
const playNotificationSound = () => {
    const audio = new Audio("./sounds/aviso.mp3");
    audio.play();
};

// Função para tratar login
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

// Remove todos os cookies ao sair da página
window.addEventListener("beforeunload", () => {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
});

// Adiciona o listener para o formulário de login
loginForm.addEventListener("submit", handleLogin);

// Adiciona o event listener para o input de arquivo
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

// Adiciona o listener para o formulário de envio de mensagem
chatForm.addEventListener('submit', sendMessage);
