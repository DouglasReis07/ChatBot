// frontend/script.js - Versão Completa com Menu Hover

// ==================================================================
// LÓGICA DO MENU LATERAL EXPANSÍVEL (ATUALIZADO PARA HOVER)
// ==================================================================
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const menuIcon = menuBtn.querySelector('i'); // Pega o elemento do ícone

// ABRE o menu ao passar o mouse sobre o botão
menuBtn.addEventListener('mouseenter', () => {
    sidebar.classList.add('open');
    document.body.classList.add('sidebar-open');

    // Troca o ícone para 'X'
    menuIcon.classList.remove('bi-justify');
    menuIcon.classList.add('bi-x-lg');
});

// FECHA o menu ao tirar o mouse de cima da área da sidebar
sidebar.addEventListener('mouseleave', () => {
    sidebar.classList.remove('open');
    document.body.classList.remove('sidebar-open');

    // Garante que o ícone volte ao normal (menu)
    menuIcon.classList.remove('bi-x-lg');
    menuIcon.classList.add('bi-justify');
});
// ==================================================================

const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const loadingIndicator = document.getElementById('loading');
const micBtn = document.getElementById('mic-btn');

let conversationHistory = [];
let availableVoices = [];
const initialMessage = "E aí! Eu sou o DG 😎, seu parceiro virtual. Bora resolver suas dúvidas? Da ideia!";

function loadVoices() {
    availableVoices = window.speechSynthesis.getVoices();
}
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function speak(text) {
    if ('speechSynthesis' in window && text.trim() !== '') {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        const desiredVoice = availableVoices.find(voice => voice.name === 'Google português do Brasil');
        if (desiredVoice) { utterance.voice = desiredVoice; }
        utterance.pitch = 1.2;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }
}

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

let hasGreetingBeenSpoken = false;

function speakInitialGreeting() {
    if(hasGreetingBeenSpoken) return;
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

function primeEngineAndGreet() {
    if(hasGreetingBeenSpoken) return;
    console.log("Primeira interação (mouse move) detectada. Acordando o motor de voz.");
    const synth = window.speechSynthesis;
    if (synth.state === 'suspended') {
        synth.resume();
    }
    speakInitialGreeting();
    document.removeEventListener('mousemove', primeEngineAndGreet);
}

document.addEventListener('mousemove', primeEngineAndGreet);
addMessage('bot-initial', initialMessage);