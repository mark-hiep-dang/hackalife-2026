// Web Audio API Synthesizer for "Pằng" and "Chíu" sound effects
import clapHandSfx from '../assets/sounds/clap-hand.mp3';
import yesSfx from '../assets/sounds/yes.mp3';
import hoohoSfx from '../assets/sounds/hooho.mp3';
import ohNoSfx from '../assets/sounds/oh-no.mp3';
import ohMyGodSfx from '../assets/sounds/oh-my-god.mp3';
import spitSfx from '../assets/sounds/spit.mp3';

let isMuted = localStorage.getItem('pang_chiu_mute') === 'true';

export function getMuteState() {
  return isMuted;
}

export function setMuteState(muted) {
  isMuted = muted;
  localStorage.setItem('pang_chiu_mute', muted ? 'true' : 'false');
}

/**
 * Synthesizes a snappy, satisfying gunshot sound ("Pằng")
 */
export function playPang() {
  if (isMuted) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    // 1. Noise Generator for the gunshot blast
    const bufferSize = ctx.sampleRate * 0.4; // 0.4 seconds duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = ctx.createBufferSource(buffer);
    noiseNode.buffer = buffer;
    
    // Lowpass filter to shape the noise into an explosion
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.35);
    
    // Gain node for the noise envelope
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    
    // Connect noise path
    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    // 2. Sine Oscillator for the low-frequency "thump"
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.15);
    
    oscGain.gain.setValueAtTime(0.9, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    // Start and Stop
    noiseNode.start(ctx.currentTime);
    osc.start(ctx.currentTime);
    
    noiseNode.stop(ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.error('Audio synthesis failed:', err);
  }
}

/**
 * Synthesizes a whistle/ricochet sound ("Chíu")
 */
export function playChiu() {
  if (isMuted) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Sine wave works best for pure pitch whistling
    osc.type = 'sine';
    
    const duration = 0.35; // 0.35 seconds
    
    // Fast frequency sweep down then slightly up, mimicking a passing bullet
    osc.frequency.setValueAtTime(1500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + duration);
    
    // Add frequency modulation (vibrato) to make it sound spinning/ricocheting
    const fmOsc = ctx.createOscillator();
    const fmGain = ctx.createGain();
    fmOsc.frequency.value = 45; // 45 Hz vibrato speed
    fmGain.gain.value = 150; // Pitch variation range
    
    fmOsc.connect(fmGain);
    fmGain.connect(osc.frequency);
    
    // Amplitude envelope
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.05); // quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); // decay
    
    // Connect
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Start both
    fmOsc.start(ctx.currentTime);
    osc.start(ctx.currentTime);
    
    fmOsc.stop(ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.error('Audio synthesis failed:', err);
  }
}

const CHEER_SOUNDS = [clapHandSfx, yesSfx, hoohoSfx];
const BOO_SOUNDS = [ohNoSfx, ohMyGodSfx, spitSfx];

function playRandomClip(clips) {
  if (isMuted) return;
  try {
    const src = clips[Math.floor(Math.random() * clips.length)];
    const audio = new Audio(src);
    audio.play().catch((err) => console.error('Audio playback failed:', err));
  } catch (err) {
    console.error('Audio playback failed:', err);
  }
}

/**
 * Plays a random cheer clip (clapping / "yes" / "hooho") for correct quiz answers.
 */
export function playCheer() {
  playRandomClip(CHEER_SOUNDS);
}

/**
 * Plays a random reaction clip ("oh no" / "oh my god" / spit) for wrong quiz answers.
 */
export function playScream() {
  playRandomClip(BOO_SOUNDS);
}
