// Audio Engine using Web Audio API
let audioCtx = null;
let isMuted = false;

// Audio context lazy initializer
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Play UI Click Sound (Wooden button click)
function playClickSound() {
    if (isMuted) return;
    initAudio();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    
    // Short pitch-drop triangle wave + noise transient
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.05);
    
    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.start(now);
    osc.stop(now + 0.05);
}

// Synth a chime note for Level Up sequence
function playChimeNote(freq, startTime, duration) {
    if (isMuted) return;
    initAudio();
    const ctx = audioCtx;
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Bright bell sound: combination of Sine and Triangle (octave above)
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    
    gainNode.gain.setValueAtTime(0.12, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc1.start(startTime);
    osc2.start(startTime);
    
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
}

// Play Level Up Arpeggio
function playLevelUpSound() {
    if (isMuted) return;
    initAudio();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    
    // Classic Minecraft level-up synth chime progression
    const arpeggio = [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
    
    arpeggio.forEach((freq, index) => {
        // Fast succession of notes
        playChimeNote(freq, now + index * 0.07, 0.45);
    });
}

// Generate White Noise Buffer
function createNoiseBuffer() {
    initAudio();
    const sampleRate = audioCtx.sampleRate;
    const bufferSize = sampleRate * 2.5; // 2.5s maximum length
    const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

// Creeper Hiss (Rising white noise filter)
let hissSource = null;
let hissGain = null;

function playCreeperHiss() {
    if (isMuted) return;
    initAudio();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    
    hissSource = ctx.createBufferSource();
    hissSource.buffer = createNoiseBuffer();
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 5000;
    filter.Q.value = 1.2;
    
    hissGain = ctx.createGain();
    
    hissSource.connect(filter);
    filter.connect(hissGain);
    hissGain.connect(ctx.destination);
    
    // Ramps up volume mimicking Creeper about to explode
    hissGain.gain.setValueAtTime(0.001, now);
    hissGain.gain.exponentialRampToValueAtTime(0.4, now + 1.4);
    
    hissSource.start(now);
    hissSource.stop(now + 1.5);
}

// Stop Creeper Hiss (if aborted, though not needed here, good practice)
function stopCreeperHiss() {
    if (hissSource) {
        try {
            hissSource.stop();
        } catch(e) {}
    }
}

// Explosion Sound (Synthesized with low pitch rumble and noise blast)
function playExplosionSound() {
    if (isMuted) return;
    initAudio();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    
    // Rumble synthesizer
    const rumble = ctx.createOscillator();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(80, now);
    rumble.frequency.linearRampToValueAtTime(5, now + 1.3);
    
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 120;
    
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.8, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 1.3);
    
    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    
    // Debris/Blast Noise
    const blastSource = ctx.createBufferSource();
    blastSource.buffer = createNoiseBuffer();
    
    const blastFilter = ctx.createBiquadFilter();
    blastFilter.type = 'lowpass';
    blastFilter.frequency.setValueAtTime(900, now);
    blastFilter.frequency.exponentialRampToValueAtTime(60, now + 1.5);
    
    const blastGain = ctx.createGain();
    blastGain.gain.setValueAtTime(0.9, now);
    blastGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    
    blastSource.connect(blastFilter);
    blastFilter.connect(blastGain);
    blastGain.connect(ctx.destination);
    
    rumble.start(now);
    rumble.stop(now + 1.3);
    
    blastSource.start(now);
    blastSource.stop(now + 1.5);
}


/* ==================================================== */
/* Canvas Particle System (Hearts & Confetti Celebration) */
/* ==================================================== */

const canvas = document.getElementById('canvas-celebration');
const ctx = canvas.getContext('2d');

let particles = [];
let animationId = null;

// Adjust Canvas Size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Draw a pixelated heart onto canvas
function drawPixelHeart(ctx, x, y, pSize, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    
    // Row 0: . X . X .
    ctx.fillRect(x + pSize, y, pSize, pSize);
    ctx.fillRect(x + 3 * pSize, y, pSize, pSize);
    // Row 1: X X X X X
    ctx.fillRect(x, y + pSize, 5 * pSize, pSize);
    // Row 2: X X X X X
    ctx.fillRect(x, y + 2 * pSize, 5 * pSize, pSize);
    // Row 3: . X X X .
    ctx.fillRect(x + pSize, y + 3 * pSize, 3 * pSize, pSize);
    // Row 4: . . X . .
    ctx.fillRect(x + 2 * pSize, y + 4 * pSize, pSize, pSize);
    
    ctx.restore();
}

// Particle Class
class CelebrationParticle {
    constructor(type) {
        this.type = type; // 'heart' or 'confetti'
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * canvas.width;
        
        if (this.type === 'heart') {
            // Hearts float upwards from character region
            this.x = canvas.width / 2 + (Math.random() * 200 - 100);
            this.y = canvas.height * 0.7 + (Math.random() * 80 - 40);
            this.vx = Math.random() * 2 - 1;
            this.vy = -(Math.random() * 2 + 1.5);
            this.size = Math.random() * 3 + 3; // Pixel size multiplier
            this.color = Math.random() > 0.35 ? '#ff2222' : '#ff5555'; // Minecraft red and pink hearts
            this.alpha = 1;
            this.decay = Math.random() * 0.005 + 0.008;
        } else {
            // Confetti bursts from side or top
            this.y = -20;
            this.vx = Math.random() * 4 - 2;
            this.vy = Math.random() * 4 + 3;
            this.size = Math.random() * 6 + 6;
            this.color = this.getRandomConfettiColor();
            this.alpha = 1;
            this.decay = 0;
            this.angle = Math.random() * Math.PI * 2;
            this.spin = Math.random() * 0.1 - 0.05;
        }
    }
    
    getRandomConfettiColor() {
        const colors = [
            '#ff5555', // Red
            '#55ff55', // Green
            '#55ffff', // Cyan
            '#ff55ff', // Magenta
            '#ffff55', // Yellow
            '#ffaa00', // Orange
            '#5555ff'  // Blue
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.type === 'heart') {
            this.alpha -= this.decay;
            // Drifting motion
            this.vx += Math.sin(this.y * 0.05) * 0.05;
            
            if (this.alpha <= 0) {
                this.reset();
            }
        } else {
            this.angle += this.spin;
            // Confetti recycle when reaching bottom
            if (this.y > canvas.height + 20) {
                this.y = -20;
                this.x = Math.random() * canvas.width;
                this.vy = Math.random() * 4 + 3;
            }
        }
    }
    
    draw() {
        if (this.type === 'heart') {
            drawPixelHeart(ctx, this.x, this.y, this.size, this.color, this.alpha);
        } else {
            // Draw pixel block confetti
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = this.color;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 4;
            
            // Draw standard square block
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }
}

// Particle Loop
function initParticles() {
    particles = [];
    // 50 hearts
    for (let i = 0; i < 60; i++) {
        particles.push(new CelebrationParticle('heart'));
    }
    // 80 confetti items
    for (let i = 0; i < 90; i++) {
        particles.push(new CelebrationParticle('confetti'));
    }
}

function updateAndDrawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    
    animationId = requestAnimationFrame(updateAndDrawParticles);
}

function stopParticles() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
}


/* ==================================================== */
/* Interaction Flow                                     */
/* ==================================================== */

const soundToggle = document.getElementById('sound-toggle');
const btnYes = document.getElementById('btn-yes');
const btnNo = document.getElementById('btn-no');
const btnBack = document.getElementById('btn-back');

const mainContainer = document.getElementById('main-container');
const yesScreen = document.getElementById('yes-screen');
const noScreen = document.getElementById('no-screen');

// Sound Mute Toggle
soundToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    if (isMuted) {
        soundToggle.classList.add('mute');
        soundToggle.querySelector('.icon').textContent = '🔇';
    } else {
        soundToggle.classList.remove('mute');
        soundToggle.querySelector('.icon').textContent = '🔊';
        initAudio();
        playClickSound();
    }
});

// Button hover sounds
const buttons = document.querySelectorAll('.mc-btn, .sound-btn');
buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        if (!isMuted) playClickSound();
    });
});

// YES Selection Handler
btnYes.addEventListener('click', () => {
    playClickSound();
    
    // Transitions to celebration
    mainContainer.style.transform = 'scale(0.8)';
    mainContainer.style.opacity = '0';
    
    setTimeout(() => {
        mainContainer.style.display = 'none';
        yesScreen.classList.add('active');
        
        // Start level up chime
        playLevelUpSound();
        
        // Start particles
        initParticles();
        updateAndDrawParticles();
        
        // Simulate Discord server check
        setTimeout(() => {
            const discordBadgeText = document.querySelector('.discord-badge span:last-child');
            discordBadgeText.textContent = 'Server Pro 🚀';
        }, 1500);
    }, 300);
});

// Back Button Handler (YES Screen)
btnBack.addEventListener('click', () => {
    playClickSound();
    
    // Transitions back to main screen
    yesScreen.classList.remove('active');
    stopParticles();
    
    // Reset badge text back to loading state
    const discordBadgeText = document.querySelector('.discord-badge span:last-child');
    discordBadgeText.textContent = 'Discord: Cargando...';
    
    mainContainer.style.display = 'flex';
    setTimeout(() => {
        mainContainer.style.transform = 'scale(1)';
        mainContainer.style.opacity = '1';
    }, 50);
});

// NO Selection Handler
btnNo.addEventListener('click', () => {
    playClickSound();
    
    // Immediate creeper warning transition
    mainContainer.style.display = 'none';
    noScreen.classList.add('active');
    
    // Play creeper fuse hiss
    playCreeperHiss();
    
    // 1.5 seconds hiss, then explosion!
    setTimeout(() => {
        // Red flash!
        const flash = document.querySelector('.flash-red');
        flash.style.opacity = '1';
        
        // Screen shake class
        document.body.classList.add('shake');
        
        // Play boom!
        playExplosionSound();
        
        // Hide TNT & Show rejection screen components
        const tntBlock = document.querySelector('.tnt-block');
        if (tntBlock) tntBlock.style.display = 'none';
        
        const rejectionTitle = document.getElementById('rejection-msg');
        rejectionTitle.classList.add('show');
        
        const redirectInfo = document.querySelector('.redirect-info');
        redirectInfo.classList.add('show');
        
        // Fade out red flash slowly
        setTimeout(() => {
            flash.style.transition = 'opacity 0.8s ease';
            flash.style.opacity = '0';
        }, 50);
        
        // Remove shake class after animation completes
        setTimeout(() => {
            document.body.classList.remove('shake');
        }, 400);
        
        // Redirect to Teams after 2.5 seconds
        setTimeout(() => {
            window.location.href = 'https://teams.live.com/free';
        }, 2500);
        
    }, 1450); // Explodes right at 1.45s of the hiss
});

// Initial Easter Egg: wobbling splash text selection
const splashes = [
    "¡Para Juan!",
    "¡Con skins reales!",
    "¿Listo para minar?",
    "¡Presiona SÍ!",
    "¡Cuidado con el Creeper!",
    "100% libre de lag",
    "¡Hola SYN_2406!"
];
const splashEl = document.getElementById('splash');
if (splashEl) {
    // Choose random splash
    splashEl.textContent = splashes[Math.floor(Math.random() * splashes.length)];
}
