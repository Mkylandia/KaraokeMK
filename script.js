let audioContext;
let microphone;
let gainNode;
let delayNode;
let feedbackNode;
let analyser;
let dataArray;
let animationId;
let isRecording = false;

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const delaySlider = document.getElementById('delaySlider');
const delayValue = document.getElementById('delayValue');
const feedbackSlider = document.getElementById('feedbackSlider');
const feedbackValue = document.getElementById('feedbackValue');
const visualization = document.getElementById('visualization');
const bluetoothStatus = document.getElementById('bluetoothStatus');

// Erstelle Visualisierung Bars
function createVisualizationBars() {
    for (let i = 0; i < 32; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = '2px';
        visualization.appendChild(bar);
    }
}

// Bluetooth Status prüfen
function checkBluetoothStatus() {
    if ('bluetooth' in navigator) {
        bluetoothStatus.innerHTML = '🔵 Bluetooth API verfügbar - Verbinde dein Gerät manuell mit der JBL Box';
        bluetoothStatus.style.background = 'rgba(0, 255, 0, 0.2)';
    } else {
        bluetoothStatus.innerHTML = '🔴 Bluetooth API nicht verfügbar - Audio wird über Standard-Ausgabe abgespielt';
        bluetoothStatus.style.background = 'rgba(255, 255, 0, 0.2)';
    }
}

async function startKaraoke() {
    try {
        status.textContent = 'Mikrofon wird gestartet...';
        
        // AudioContext erstellen
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Mikrofon zugriff
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });
        
        // Audio Nodes erstellen
        microphone = audioContext.createMediaStreamSource(stream);
        gainNode = audioContext.createGain();
        delayNode = audioContext.createDelay(1.0);
        feedbackNode = audioContext.createGain();
        analyser = audioContext.createAnalyser();
        
        // Analyser konfigurieren
        analyser.fftSize = 64;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        // Audio Graph verbinden
        microphone.connect(gainNode);
        gainNode.connect(delayNode);
        delayNode.connect(feedbackNode);
        feedbackNode.connect(delayNode); // Feedback loop für Echo
        gainNode.connect(audioContext.destination);
        delayNode.connect(audioContext.destination);
        gainNode.connect(analyser);
        
        // Initial settings
        gainNode.gain.value = volumeSlider.value / 100;
        delayNode.delayTime.value = parseFloat(delaySlider.value);
        feedbackNode.gain.value = parseFloat(feedbackSlider.value);
        
        isRecording = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        status.textContent = '🎤 Karaoke aktiv - Sing mit!';
        
        // Visualisierung starten
        visualize();
        
    } catch (error) {
        console.error('Fehler beim Starten:', error);
        status.textContent = '❌ Fehler: Mikrofon-Zugriff verweigert';
    }
}

function stopKaraoke() {
    if (audioContext) {
        audioContext.close();
    }
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    isRecording = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    status.textContent = 'Bereit zum Start';
    
    // Bars zurücksetzen
    const bars = document.querySelectorAll('.bar');
    bars.forEach(bar => {
        bar.style.height = '2px';
    });
}

function visualize() {
    if (!isRecording) return;
    
    analyser.getByteFrequencyData(dataArray);
    const bars = document.querySelectorAll('.bar');
    
    bars.forEach((bar, index) => {
        const height = (dataArray[index] / 255) * 80 + 2;
        bar.style.height = height + 'px';
    });
    
    animationId = requestAnimationFrame(visualize);
}

// Event Listeners
function setupEventListeners() {
    startBtn.addEventListener('click', startKaraoke);
    stopBtn.addEventListener('click', stopKaraoke);

    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value;
        volumeValue.textContent = volume;
        if (gainNode) {
            gainNode.gain.value = volume / 100;
        }
    });

    delaySlider.addEventListener('input', (e) => {
        const delay = e.target.value;
        delayValue.textContent = delay;
        if (delayNode) {
            delayNode.delayTime.value = parseFloat(delay);
        }
    });

    feedbackSlider.addEventListener('input', (e) => {
        const feedback = e.target.value;
        feedbackValue.textContent = feedback;
        if (feedbackNode) {
            feedbackNode.gain.value = parseFloat(feedback);
        }
    });
}

// App initialisieren
function initApp() {
    createVisualizationBars();
    checkBluetoothStatus();
    setupEventListeners();
}

// App starten wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', initApp);
