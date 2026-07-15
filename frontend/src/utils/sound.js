// Web Audio API Synthesizer for "Pằng" and "Chíu" sound effects

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

/**
 * Synthesizes a crowd applause burst for correct quiz answers — a pile of
 * randomly-timed, band-passed noise "claps" plus a soft whoosh underneath.
 */
export function playCheer() {
  if (isMuted) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const duration = 1.1;
    const now = ctx.currentTime;

    const clapCount = 26;
    for (let i = 0; i < clapCount; i++) {
      const start = now + Math.random() * (duration - 0.1);
      const clapDuration = 0.04 + Math.random() * 0.05;

      const bufferSize = Math.floor(ctx.sampleRate * clapDuration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) data[j] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800 + Math.random() * 2200;
      filter.Q.value = 0.8;

      const gain = ctx.createGain();
      const peak = 0.12 + Math.random() * 0.14;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, start + clapDuration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(start);
      noise.stop(start + clapDuration);
    }

    // Soft crowd "whoosh" underneath the claps for body
    const whooshBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const whooshData = whooshBuffer.getChannelData(0);
    for (let i = 0; i < whooshData.length; i++) whooshData[i] = Math.random() * 2 - 1;

    const whooshNoise = ctx.createBufferSource();
    whooshNoise.buffer = whooshBuffer;
    const whooshFilter = ctx.createBiquadFilter();
    whooshFilter.type = 'bandpass';
    whooshFilter.frequency.value = 2500;
    whooshFilter.Q.value = 0.5;
    const whooshGain = ctx.createGain();
    whooshGain.gain.setValueAtTime(0.001, now);
    whooshGain.gain.linearRampToValueAtTime(0.05, now + 0.15);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    whooshNoise.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(ctx.destination);
    whooshNoise.start(now);
    whooshNoise.stop(now + duration);

    speakLine(CHEER_PHRASES, 0.25);
  } catch (err) {
    console.error('Audio synthesis failed:', err);
  }
}

const CHEER_PHRASES = ['Giỏi lắm!', 'Quá đỉnh!', 'Quá giỏi!', 'Ôkela quá he!', 'Giỏi he!'];
const BOO_PHRASES = ['Ú là trời!', 'Kì zậy bồ!', 'Học lại đi!', 'Sai rồi bà ơi!', 'Quá bùn!', 'Trời ơi cứu tui!', 'Cứu tui trời ơi!', 'Chết tui!', 'Cái gì vậy!', 'Ủa gì vậy!'];

function speakLine(phrases, delaySec = 0) {
  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return;

  const text = phrases[Math.floor(Math.random() * phrases.length)];
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'vi-VN';
  utter.pitch = 1.3 + Math.random() * 0.3;
  utter.rate = 1.05;
  utter.volume = 1;

  window.speechSynthesis.cancel(); // avoid queued overlap if answers come in quick succession
  if (delaySec > 0) setTimeout(() => window.speechSynthesis.speak(utter), delaySec * 1000);
  else window.speechSynthesis.speak(utter);
}

/**
 * Synthesizes a long, breathy, disappointed sigh — filtered noise with a slow
 * decay envelope plus a low descending groan underneath.
 */
function playSigh() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const duration = 1.6;
  const now = ctx.currentTime;

  // Breathy "haaaa" noise layer
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(700, now);
  filter.frequency.exponentialRampToValueAtTime(350, now + duration);
  filter.Q.value = 0.7;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.001, now);
  noiseGain.gain.linearRampToValueAtTime(0.18, now + 0.15);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  // Low descending groan underneath, for the "disappointed" feel
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(85, now + duration);

  oscGain.gain.setValueAtTime(0.001, now);
  oscGain.gain.linearRampToValueAtTime(0.1, now + 0.2);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  noise.start(now);
  osc.start(now);
  noise.stop(now + duration);
  osc.stop(now + duration);
}

/**
 * Plays a long disappointed sigh under a dramatic, teasing "wrong answer"
 * line, using the browser's built-in speech synthesis for the line.
 */
export function playScream() {
  if (isMuted) return;

  try {
    playSigh();
    speakLine(BOO_PHRASES, 0.3);
  } catch (err) {
    console.error('Audio synthesis failed:', err);
  }
}
