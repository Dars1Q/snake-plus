// audio.js - Enhanced Sound System
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.sfxVolume = 0.3;
    this.musicVolume = 0.2;
    this.enabled = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.sfxVolume;
      this.initialized = true;
      
      // Resume audio context on user interaction
      document.addEventListener('click', () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
      }, { once: true });
      
      console.log('🔊 Sound system initialized');
    } catch (e) {
      console.warn('Audio not supported:', e);
    }
  }

  setVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.sfxVolume;
    }
    localStorage.setItem('snakeplus_sfx_volume', this.sfxVolume);
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('snakeplus_music_volume', this.musicVolume);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = this.enabled ? this.sfxVolume : 0;
    }
    return this.enabled;
  }

  // Play a tone with envelope
  playTone(freq, type = 'sine', duration = 100, volume = 1, attack = 10, decay = 50) {
    if (!this.enabled || !this.audioContext) return;
    
    try {
      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + attack / 1000);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + duration / 1000);
    } catch (e) {}
  }

  // Play noise (for crash/explosion)
  playNoise(duration = 200, volume = 1) {
    if (!this.enabled || !this.audioContext) return;
    
    try {
      const now = this.audioContext.currentTime;
      const bufferSize = this.audioContext.sampleRate * (duration / 1000);
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      noise.start(now);
    } catch (e) {}
  }

  // Sound effects
  playEatSound() {
    this.playTone(800, 'sine', 100, 0.3, 5, 50);
    setTimeout(() => this.playTone(1200, 'sine', 80, 0.25, 5, 40), 30);
  }

  playBonusEatSound() {
    // Special sound for bonus food
    this.playTone(600, 'sine', 80, 0.3, 5, 40);
    setTimeout(() => this.playTone(900, 'sine', 80, 0.3, 5, 40), 40);
    setTimeout(() => this.playTone(1200, 'sine', 100, 0.3, 5, 50), 80);
    setTimeout(() => this.playTone(1600, 'triangle', 120, 0.2, 5, 60), 120);
  }

  playIceBreakSound() {
    // Ice cracking sound
    this.playTone(500, 'triangle', 60, 0.2, 2, 30);
    setTimeout(() => this.playTone(700, 'triangle', 50, 0.15, 2, 25), 25);
    setTimeout(() => this.playTone(400, 'triangle', 70, 0.2, 2, 35), 50);
  }

  playCrashSound() {
    // Explosion/crash sound
    this.playNoise(300, 0.4);
    this.playTone(200, 'sawtooth', 400, 0.3, 10, 200);
    setTimeout(() => this.playTone(150, 'sawtooth', 300, 0.3, 10, 150), 50);
  }

  playComboSound(multiplier) {
    // Special sound for combo
    const baseFreq = 400 + (multiplier * 100);
    this.playTone(baseFreq, 'sine', 100, 0.3, 5, 50);
    setTimeout(() => this.playTone(baseFreq + 200, 'sine', 120, 0.25, 5, 60), 60);
    if (multiplier >= 5) {
      setTimeout(() => this.playTone(baseFreq + 400, 'triangle', 150, 0.2, 5, 75), 120);
    }
  }

  playRankUpSound() {
    // Special sound for rank up
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 200, 0.3, 10, 100), i * 100);
    });
  }

  playBuySound() {
    // Purchase sound
    this.playTone(800, 'sine', 100, 0.3, 5, 50);
    setTimeout(() => this.playTone(1000, 'sine', 150, 0.3, 5, 75), 80);
  }

  playSelectSound() {
    // UI selection sound
    this.playTone(600, 'sine', 50, 0.15, 2, 25);
  }

  playErrorSound() {
    // Error/denied sound
    this.playTone(200, 'sawtooth', 150, 0.3, 5, 75);
    setTimeout(() => this.playTone(150, 'sawtooth', 150, 0.3, 5, 75), 100);
  }

  playStarCollectSound() {
    // Star collection sound
    this.playTone(1000, 'sine', 80, 0.2, 5, 40);
    setTimeout(() => this.playTone(1500, 'sine', 100, 0.2, 5, 50), 50);
    setTimeout(() => this.playTone(2000, 'triangle', 120, 0.15, 5, 60), 100);
  }
}

// Create global sound manager
const soundManager = new SoundManager();

// Load saved volume settings
try {
  const savedSfxVolume = localStorage.getItem('snakeplus_sfx_volume');
  const savedMusicVolume = localStorage.getItem('snakeplus_music_volume');
  if (savedSfxVolume) soundManager.sfxVolume = parseFloat(savedSfxVolume);
  if (savedMusicVolume) soundManager.musicVolume = parseFloat(savedMusicVolume);
} catch (e) {}

// Export functions for backward compatibility
const playEatSound = () => soundManager.playEatSound();
const playIceBreakSound = () => soundManager.playIceBreakSound();
const playCrashSound = () => soundManager.playCrashSound();

export { 
  soundManager, 
  playEatSound, 
  playIceBreakSound, 
  playCrashSound,
  SoundManager 
};
