// Elementos de login
const login = document.querySelector(".login")
const loginForm = login.querySelector(".login__form")
const loginInput = login.querySelector(".login__input")

// Elementos do chat
const chat = document.querySelector(".chat")
const chatForm = chat.querySelector(".chat__form")
const chatInput = chat.querySelector(".chat__input")
const chatMessages = chat.querySelector(".chat__messages")

const cores = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
]

const user = { id: "", nome: "", cor: "" }

let websocket

const criarElementoMensagemPropria = (conteudo) => {
    const div = document.createElement("div")

    div.classList.add("message--self")
    div.innerHTML = conteudo

    return div
}

const criarElementoMensagemOutro = (conteudo, remetente, corRemetente) => {
    const div = document.createElement("div")
    const span = document.createElement("span")

    div.classList.add("message--other")

    span.classList.add("message--sender")
    span.style.color = corRemetente

    div.appendChild(span)

    span.innerHTML = remetente
    div.innerHTML += conteudo

    return div
}

const obterCorAleatoria = () => {
    const indiceAleatorio = Math.floor(Math.random() * cores.length)
    return cores[indiceAleatorio]
}

const rolarTela = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    })
}

const processarMensagem = ({ data }) => {
    const { userId, userName, userColor, content } = JSON.parse(data)

    if (userName === "Sistema") {
        // Mensagens do sistema (por exemplo, mensagens de boas-vindas)
        const mensagemSistema = criarElementoMensagemOutro(content, userName, userColor)
        chatMessages.appendChild(mensagemSistema)
    } else {
        // Mensagens do usuário
        const mensagem =
            userId == user.id
                ? criarElementoMensagemPropria(content)
                : criarElementoMensagemOutro(content, userName, userColor)

        chatMessages.appendChild(mensagem)
    }

    rolarTela()
}

const lidarComLogin = (evento) => {
    evento.preventDefault()

    user.id = crypto.randomUUID()
    user.nome = loginInput.value
    user.cor = obterCorAleatoria()

    // Criar uma instância do WebSocket antes de enviar a mensagem de boas-vindas
    websocket = new WebSocket("wss://chat2-backend2.onrender.com")
    websocket.onmessage = processarMensagem

    // Criar e enviar uma mensagem de boas-vindas
    const mensagemBoasVindas = {
        userId: user.id,
        userName: "Sistema",
        userColor: "blue", // Você pode escolher uma cor para mensagens do sistema
        content: `${user.nome} entrou no chat!`
    }
    websocket.send(JSON.stringify(mensagemBoasVindas))

    login.style.display = "none"
    chat.style.display = "flex"
}

const enviarMensagem = (evento) => {
    evento.preventDefault()

    const mensagem = {
        userId: user.id,
        userName: user.nome,
        userColor: user.cor,
        content: chatInput.value
    }

    websocket.send(JSON.stringify(mensagem))

    chatInput.value = ""
}

loginForm.addEventListener("submit", lidarComLogin)
chatForm.addEventListener("submit", enviarMensagem)
