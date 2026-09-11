// Programmatic Web Audio Synthesizer for high-quality, zero-asset calming background soundscapes

let audioCtx: AudioContext | null = null;
let currentNodes: {
  sourceNodes: any[];
  gainNodes: any[];
  filterNodes: any[];
  lfoNodes: any[];
  noiseInterval?: any;
} = { sourceNodes: [], gainNodes: [], filterNodes: [], lfoNodes: [] };

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function stopAllAmbient() {
  // Clear any noise loop intervals
  if (currentNodes.noiseInterval) {
    clearInterval(currentNodes.noiseInterval);
    currentNodes.noiseInterval = undefined;
  }

  // Stop and disconnect all nodes
  currentNodes.sourceNodes.forEach(node => {
    try { node.stop(); } catch (e) {}
    try { node.disconnect(); } catch (e) {}
  });
  currentNodes.lfoNodes.forEach(node => {
    try { node.stop(); } catch (e) {}
    try { node.disconnect(); } catch (e) {}
  });
  currentNodes.gainNodes.forEach(node => {
    try { node.disconnect(); } catch (e) {}
  });
  currentNodes.filterNodes.forEach(node => {
    try { node.disconnect(); } catch (e) {}
  });

  currentNodes = { sourceNodes: [], gainNodes: [], filterNodes: [], lfoNodes: [] };
}

// 1. Warm Sunlight - Pure, peaceful sinusoidal chord wash
export function playWarmSunlight() {
  stopAllAmbient();
  const ctx = getAudioContext();
  
  // F Major Pentatonic scale notes (warm and peaceful)
  // F3 (174.61), A3 (220.00), C4 (261.63), D4 (293.66), F4 (349.23), A4 (440.00)
  const frequencies = [174.61, 220.00, 261.63, 293.66, 349.23];
  
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 3); // Slow fade-in
  masterGain.connect(ctx.destination);
  currentNodes.gainNodes.push(masterGain);

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    const gain = ctx.createGain();
    // Soft, slightly staggered volume per pitch
    gain.gain.setValueAtTime(0.04 / frequencies.length, ctx.currentTime);
    
    // Add a slow LFO to modulate volume (simulating breathing)
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.05 + idx * 0.02, ctx.currentTime); // very slow speed
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.02, ctx.currentTime);
    
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain); // modulate frequency volume
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    lfo.start();
    osc.start();
    
    currentNodes.sourceNodes.push(osc);
    currentNodes.lfoNodes.push(lfo);
    currentNodes.gainNodes.push(gain);
    currentNodes.gainNodes.push(lfoGain);
  });
}

// 2. Peaceful Rain - Brown noise synthesized with resonant bandpass sweeping
export function playPeacefulRain() {
  stopAllAmbient();
  const ctx = getAudioContext();

  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  // Generate brown noise
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; // compensative volume boost
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const lowpassFilter = ctx.createBiquadFilter();
  lowpassFilter.type = "lowpass";
  lowpassFilter.frequency.setValueAtTime(350, ctx.currentTime);
  lowpassFilter.Q.setValueAtTime(1, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 3);

  // Slow LFO to sweep filter frequency, mimicking ocean waves or soft gusts
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // very slow sweep

  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(150, ctx.currentTime); // modulation depth

  lfo.connect(lfoGain);
  lfoGain.connect(lowpassFilter.frequency);

  noiseSource.connect(lowpassFilter);
  lowpassFilter.connect(gain);
  gain.connect(ctx.destination);

  lfo.start();
  noiseSource.start();

  currentNodes.sourceNodes.push(noiseSource);
  currentNodes.lfoNodes.push(lfo);
  currentNodes.gainNodes.push(gain);
  currentNodes.gainNodes.push(lfoGain);
  currentNodes.filterNodes.push(lowpassFilter);
}

// 3. Cozy Fireplace - Rich low-frequency hum mixed with random sharp crackles
export function playCozyFireplace() {
  stopAllAmbient();
  const ctx = getAudioContext();

  // Create ambient background wind/hum (low-pass white noise)
  const bufferSize = ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(120, ctx.currentTime); // deep fire rumble

  const fireGain = ctx.createGain();
  fireGain.gain.setValueAtTime(0, ctx.currentTime);
  fireGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2);

  noiseSource.connect(filter);
  filter.connect(fireGain);
  fireGain.connect(ctx.destination);

  noiseSource.start();
  currentNodes.sourceNodes.push(noiseSource);
  currentNodes.gainNodes.push(fireGain);
  currentNodes.filterNodes.push(filter);

  // Synthesize sharp crackles using random interval triggers
  currentNodes.noiseInterval = setInterval(() => {
    // Random probability of cracking
    if (Math.random() < 0.4) {
      try {
        const crackleOsc = ctx.createOscillator();
        crackleOsc.type = "triangle";
        crackleOsc.frequency.setValueAtTime(800 + Math.random() * 1500, ctx.currentTime);

        const crackleFilter = ctx.createBiquadFilter();
        crackleFilter.type = "bandpass";
        crackleFilter.frequency.setValueAtTime(1500, ctx.currentTime);
        crackleFilter.Q.setValueAtTime(8, ctx.currentTime);

        const crackleGain = ctx.createGain();
        crackleGain.gain.setValueAtTime(0.04 + Math.random() * 0.08, ctx.currentTime);
        crackleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02 + Math.random() * 0.04);

        crackleOsc.connect(crackleFilter);
        crackleFilter.connect(crackleGain);
        crackleGain.connect(ctx.destination);

        crackleOsc.start();
        crackleOsc.stop(ctx.currentTime + 0.08);

        // Keep track of active nodes temporarily (they dispose themselves quickly)
        setTimeout(() => {
          crackleOsc.disconnect();
          crackleFilter.disconnect();
          crackleGain.disconnect();
        }, 100);
      } catch (e) {}
    }
  }, 120);
}
