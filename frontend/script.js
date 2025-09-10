// frontend/script.js - Versão Final com Saudação Automática no Movimento do Mouse

const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const loadingIndicator = document.getElementById('loading');
const micBtn = document.getElementById('mic-btn');

let conversationHistory = [];
let availableVoices = [];
const initialMessage = 'Olá! Como posso te ajudar hoje?';

// Função para carregar as vozes disponíveis
function loadVoices() {
    availableVoices = window.speechSynthesis.getVoices();
}
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// Função principal para fazer o chatbot falar
function speak(text) {
    if ('speechSynthesis' in window && text.trim() !== '') {
        window.speechSynthesis.cancel(); // Cancela qualquer fala anterior para evitar sobreposição
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        const desiredVoice = availableVoices.find(voice => voice.name === 'Google português do Brasil');
        if (desiredVoice) { utterance.voice = desiredVoice; }
        utterance.pitch = 1.2;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }
}

// Lógica para ouvir o usuário (Speech-to-Text)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => { micBtn.classList.add('listening'); userInput.placeholder = 'Ouvindo...'; };
    recognition.onresult = (event) => {
        userInput.value = event.results[0][0].transcript;
        chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
    };
    recognition.onerror = (event) => { console.error('Erro no reconhecimento de voz:', event.error); };
    recognition.onend = () => { micBtn.classList.remove('listening'); userInput.placeholder = 'Digite ou fale...'; };
    micBtn.addEventListener('click', () => { try { recognition.start(); } catch(e) { console.error("Erro ao iniciar o reconhecimento de voz.", e); } });
} else {
    console.log('Seu navegador não suporta o reconhecimento de voz.');
    micBtn.style.display = 'none';
}

// Função para adicionar uma mensagem visual na caixa de chat
function addMessage(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.innerText = text;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
    if ((sender === 'user' || sender === 'bot') && text.trim() !== '') {
         conversationHistory.push({ sender, text });
    }
}

// Evento que lida com o envio da mensagem para o backend
chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const userMessage = userInput.value.trim();
    if (userMessage === '') return;
    addMessage('user', userMessage);
    userInput.value = '';
    loadingIndicator.classList.remove('hidden');
    try {
        const response = await fetch('http://127.0.0.1:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage, history: conversationHistory.slice(0, -1) })
        });
        if (!response.ok) throw new Error('A resposta da rede não foi boa.');
        const data = await response.json();
        addMessage('bot', data.reply);
        speak(data.reply);
    } catch (error) {
        console.error('Erro:', error);
        const errorMessage = 'Desculpe, ocorreu um erro. Tente novamente.';
        addMessage('bot', errorMessage);
        speak(errorMessage);
    } finally {
        loadingIndicator.classList.add('hidden');
    }
});

// ==================================================================
// NOVA LÓGICA: ATIVAÇÃO DA VOZ COM O PRIMEIRO MOVIMENTO DO MOUSE
// ==================================================================
let hasGreetingBeenSpoken = false;

// Função que espera as vozes carregarem e então fala a saudação
function speakInitialGreeting() {
    if(hasGreetingBeenSpoken) return; // Garante que a saudação seja dita apenas uma vez

    hasGreetingBeenSpoken = true;
    const voiceCheckInterval = setInterval(() => {
        loadVoices();
        if (availableVoices.length > 0) {
            console.log("Vozes carregadas, falando a saudação.");
            speak(initialMessage);
            clearInterval(voiceCheckInterval);
        }
    }, 100);
}

// Esta função "acorda" o motor de voz e dispara a saudação
function primeEngineAndGreet() {
    if(hasGreetingBeenSpoken) return;
    
    console.log("Primeira interação (mouse move) detectada. Acordando o motor de voz.");
    // Acorda o motor de voz (uma boa prática)
    const synth = window.speechSynthesis;
    if (synth.state === 'suspended') {
        synth.resume();
    }
    
    speakInitialGreeting();

    // Remove este listener para não ser acionado novamente
    document.removeEventListener('mousemove', primeEngineAndGreet);
}

// Adiciona o listener que aguarda o primeiro movimento do mouse
document.addEventListener('mousemove', primeEngineAndGreet);

// Exibe a mensagem inicial visualmente assim que a página carrega
addMessage('bot-initial', initialMessage);