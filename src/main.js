import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

window.addEventListener('DOMContentLoaded', () => {
  setupHardwareCanvasStages();
  setupInteractiveWidgets();
  setupNavigation();
  setupOscilloscopes();
  setupResistorColorCode();
  setupRLCResonance();
  setupPresentationMode();

  // Ensure ScrollTrigger recalculates after fonts and layout settle
  if (document.fonts) {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  }
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
});

/* =========================================================================
   1. PURE 3D HARDWARE FRAME SEQUENCE ENGINE (ULTRA-SMOOTH SCROLL DISASSEMBLY)
   ========================================================================= */
class FrameSequenceCanvasViewer {
  constructor(config) {
    this.config = config;
    this.canvas = document.getElementById(config.canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.spotlight = document.getElementById(config.spotlightId);

    this.frameCount = config.frameCount;
    this.folder = config.folder;
    this.frames = new Array(this.frameCount);
    this.loadedSet = new Set();

    this.targetFrame = 0;
    this.currentFrame = 0;
    this.lastRenderedFrame = -1;

    this.initCanvasSize();
    this.setupListeners();
    this.preloadFrames();
    this.setupScrollTrigger();
    this.updateHUD(0);
    this.startRenderLoop();
  }

  getFrameUrl(index) {
    const pad = String(index).padStart(3, '0');
    const base = import.meta.env.BASE_URL || './';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    return `${cleanBase}frames/${this.folder}/frame_${pad}.jpg`;
  }

  preloadFrames() {
    // 1. Immediately load frame 0 and render it as soon as ready
    const frame0 = new Image();
    frame0.onload = () => {
      this.frames[0] = frame0;
      this.loadedSet.add(0);
      this.renderFrame(0);
      this.lastRenderedFrame = 0;
    };
    frame0.src = this.getFrameUrl(0);

    // 2. Load milestone frames first (every 8 frames) for fast initial scrubbing responsiveness
    const milestoneStep = 8;
    for (let i = milestoneStep; i < this.frameCount; i += milestoneStep) {
      const img = new Image();
      const frameIdx = i;
      img.onload = () => {
        this.frames[frameIdx] = img;
        this.loadedSet.add(frameIdx);
        if (Math.round(this.currentFrame) === frameIdx) {
          this.renderFrame(frameIdx);
        }
      };
      img.src = this.getFrameUrl(frameIdx);
    }

    // 3. Preload all remaining frames in priority order
    for (let i = 1; i < this.frameCount; i++) {
      if (i % milestoneStep === 0) continue;
      const img = new Image();
      const frameIdx = i;
      img.onload = () => {
        this.frames[frameIdx] = img;
        this.loadedSet.add(frameIdx);
        if (Math.round(this.currentFrame) === frameIdx) {
          this.renderFrame(frameIdx);
        }
      };
      img.src = this.getFrameUrl(frameIdx);
    }
  }

  getNearestLoadedFrame(targetIdx) {
    if (this.frames[targetIdx] && this.loadedSet.has(targetIdx)) {
      return this.frames[targetIdx];
    }
    for (let offset = 1; offset < this.frameCount; offset++) {
      const prev = targetIdx - offset;
      if (prev >= 0 && this.loadedSet.has(prev)) return this.frames[prev];
      const next = targetIdx + offset;
      if (next < this.frameCount && this.loadedSet.has(next)) return this.frames[next];
    }
    return null;
  }

  initCanvasSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = this.canvas.parentElement;
    this.width = parent ? parent.clientWidth : window.innerWidth;
    this.height = parent ? parent.clientHeight : window.innerHeight;

    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  setupListeners() {
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;

    window.addEventListener('resize', () => {
      // Avoid re-measuring on tiny mobile address bar collapse/expand
      if (window.innerWidth !== lastWidth || Math.abs(window.innerHeight - lastHeight) > 80) {
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        this.initCanvasSize();
        if (this.lastRenderedFrame >= 0) {
          this.renderFrame(this.lastRenderedFrame);
        }
      }
    });

    const updateSpotlight = (x, y) => {
      if (!this.spotlight) return;
      const rect = this.canvas.getBoundingClientRect();
      this.spotlight.style.left = `${x - rect.left}px`;
      this.spotlight.style.top = `${y - rect.top}px`;
    };

    if (this.spotlight) {
      window.addEventListener('mousemove', (e) => updateSpotlight(e.clientX, e.clientY));
      window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
          updateSpotlight(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });
    }

    // Touch swipe support for direct 360° interactive rotation on mobile screens
    let touchStartX = 0;
    let frameOnTouchStart = 0;
    let isTouchDragging = false;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        frameOnTouchStart = this.targetFrame;
        isTouchDragging = true;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!isTouchDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - touchStartX;
      const sensitivity = (this.frameCount * 0.75) / Math.max(this.width, 320);
      const frameDelta = -deltaX * sensitivity;
      this.targetFrame = Math.max(0, Math.min(this.frameCount - 1, frameOnTouchStart + frameDelta));
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      isTouchDragging = false;
    }, { passive: true });
  }

  setupScrollTrigger() {
    const isMobile = window.innerWidth < 768;
    const distance = isMobile ? (this.config.pinDistanceMobile || 1500) : (this.config.pinDistance || 2600);

    ScrollTrigger.create({
      trigger: this.config.trackId,
      pin: this.config.stageId,
      start: 'top top',
      end: `+=${distance}`,
      pinSpacing: true,
      scrub: 0.1,
      anticipatePin: 1,
      onUpdate: (self) => {
        const progress = Math.max(0, Math.min(1, self.progress));
        this.targetFrame = progress * (this.frameCount - 1);
        this.updateHUD(progress);
      },
    });
  }

  updateHUD(progress) {
    if (this.config.hudRules) {
      this.config.hudRules.forEach((rule) => {
        const el = document.getElementById(rule.id);
        if (!el) return;
        if (progress >= rule.start && progress <= rule.end) {
          el.style.opacity = '1';
          el.style.pointerEvents = 'auto';
          el.style.transform = 'translate(-50%, -50%) scale(1)';
        } else {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.transform = 'translate(-50%, -50%) scale(0.9)';
        }
      });
    }
  }

  startRenderLoop() {
    const loop = () => {
      const diff = this.targetFrame - this.currentFrame;
      if (Math.abs(diff) > 0.005) {
        this.currentFrame += diff * 0.35;
      } else {
        this.currentFrame = this.targetFrame;
      }

      const frameToRender = Math.min(this.frameCount - 1, Math.max(0, Math.round(this.currentFrame)));
      if (frameToRender !== this.lastRenderedFrame) {
        if (this.renderFrame(frameToRender)) {
          this.lastRenderedFrame = frameToRender;
        }
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  renderFrame(frameIndex) {
    const source = this.getNearestLoadedFrame(frameIndex);
    if (!source) return false;

    const cw = this.width;
    const ch = this.height;

    const sw = source.naturalWidth || 1280;
    const sh = source.naturalHeight || 720;

    const sAspect = sw / sh;
    const cAspect = cw / ch;

    let dw, dh, dx, dy;
    if (cAspect < sAspect) {
      // Screen is narrower/taller than 16:9 video frame (Mobile portrait, tablets, etc.)
      // FIT FULL WIDTH: Never crop or cut off left and right sides!
      // All component labels, lead wires, and data boxes remain 100% visible.
      dw = cw;
      dh = cw / sAspect;
      dx = 0;
      dy = (ch - dh) / 2;
    } else {
      // Screen is wider than or equal to 16:9 video frame (Desktop landscape)
      // Fit full height for immersive presentation
      dh = ch;
      dw = ch * sAspect;
      dx = (cw - dw) / 2;
      dy = 0;
    }

    this.ctx.clearRect(0, 0, cw, ch);
    this.ctx.drawImage(source, dx, dy, dw, dh);
    return true;
  }
}

function setupHardwareCanvasStages() {
  // Component 1: Resistor (192 frames)
  new FrameSequenceCanvasViewer({
    canvasId: 'canvas-resistor',
    trackId: '#track-resistor',
    stageId: '#stage-resistor',
    spotlightId: 'spotlight-resistor',
    folder: 'resistor',
    frameCount: 192,
    pinDistance: 2600,
    pinDistanceMobile: 1500,
  });

  // Component 2: Inductor (192 frames)
  new FrameSequenceCanvasViewer({
    canvasId: 'canvas-inductor',
    trackId: '#track-inductor',
    stageId: '#stage-inductor',
    spotlightId: 'spotlight-inductor',
    folder: 'inductor',
    frameCount: 192,
    pinDistance: 2600,
    pinDistanceMobile: 1500,
  });

  // Component 3: Capacitor (240 frames)
  new FrameSequenceCanvasViewer({
    canvasId: 'canvas-capacitor',
    trackId: '#track-capacitor',
    stageId: '#stage-capacitor',
    spotlightId: 'spotlight-capacitor',
    folder: 'capacitor',
    frameCount: 240,
    pinDistance: 2600,
    pinDistanceMobile: 1600,
  });
}

/* =========================================================================
   2. INTERACTIVE THEORY LAB WIDGETS
   ========================================================================= */
function setupInteractiveWidgets() {
  // 1. Resistor Ohm's Law Calculator
  const voltageInput = document.getElementById('slider-v');
  const resistanceInput = document.getElementById('slider-r');
  const currentOutput = document.getElementById('val-current');
  const powerOutput = document.getElementById('val-power');
  const displayV = document.getElementById('display-v');
  const displayR = document.getElementById('display-r');

  function updateOhmsLaw() {
    if (!voltageInput || !resistanceInput) return;
    const v = parseFloat(voltageInput.value) || 0;
    const r = parseFloat(resistanceInput.value) || 1;
    const i = r > 0 ? v / r : 0;
    const p = v * i;

    if (currentOutput) currentOutput.textContent = `${i.toFixed(2)} A`;
    if (powerOutput) powerOutput.textContent = `${p.toFixed(2)} W`;
    if (displayV) displayV.textContent = `${v} V`;
    if (displayR) displayR.textContent = `${r} Ω`;
  }

  voltageInput?.addEventListener('input', updateOhmsLaw);
  resistanceInput?.addEventListener('input', updateOhmsLaw);
  updateOhmsLaw();

  // 2. Inductor Reactance Calculator (XL = 2 * PI * f * L)
  const freqInput = document.getElementById('slider-freq');
  const indInput = document.getElementById('slider-ind');
  const xlOutput = document.getElementById('val-xl');
  const energyOutput = document.getElementById('val-el');
  const displayFreq = document.getElementById('display-freq');
  const displayInd = document.getElementById('display-ind');

  function updateInductance() {
    if (!freqInput || !indInput) return;
    const f = parseFloat(freqInput.value) || 0;
    const lMh = parseFloat(indInput.value) || 0;
    const L = lMh / 1000;
    const xl = 2 * Math.PI * f * L;
    const assumedCurrent = 1.5;
    const e = 0.5 * L * assumedCurrent * assumedCurrent;

    if (xlOutput) xlOutput.textContent = `${xl.toFixed(2)} Ω`;
    if (energyOutput) energyOutput.textContent = `${(e * 1000).toFixed(2)} mJ`;
    if (displayFreq) displayFreq.textContent = `${f} Hz`;
    if (displayInd) displayInd.textContent = `${lMh.toFixed(0)} mH`;
  }

  freqInput?.addEventListener('input', updateInductance);
  indInput?.addEventListener('input', updateInductance);
  updateInductance();

  // 3. Capacitor Reactance Calculator (XC = 1 / (2 * PI * f * C))
  const capFreqInput = document.getElementById('slider-cap-freq');
  const capValInput = document.getElementById('slider-cap-val');
  const xcOutput = document.getElementById('val-xc');
  const capEnergyOutput = document.getElementById('val-ec');
  const displayCapFreq = document.getElementById('display-cap-freq');
  const displayCapVal = document.getElementById('display-cap-val');

  function updateCapacitance() {
    if (!capFreqInput || !capValInput) return;
    const f = parseFloat(capFreqInput.value) || 0;
    const cUf = parseFloat(capValInput.value) || 0;
    const C = cUf * 1e-6;
    const denominator = 2 * Math.PI * f * C;
    const xc = denominator > 0 ? 1 / denominator : Infinity;
    const v = 12;
    const energy = 0.5 * C * v * v;

    if (xcOutput) xcOutput.textContent = Number.isFinite(xc) ? `${xc.toFixed(2)} Ω` : '∞ Ω';
    if (capEnergyOutput) capEnergyOutput.textContent = `${(energy * 1000).toFixed(3)} mJ`;
    if (displayCapFreq) displayCapFreq.textContent = `${f} Hz`;
    if (displayCapVal) displayCapVal.textContent = `${cUf.toFixed(0)} µF`;
  }

  capFreqInput?.addEventListener('input', updateCapacitance);
  capValInput?.addEventListener('input', updateCapacitance);
  updateCapacitance();

  // Reveal Animations for Theory Cards
  gsap.utils.toArray('.theory-card-animate').forEach((card) => {
    gsap.fromTo(
      card,
      { opacity: 0, y: 35, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  });
}

/* =========================================================================
   3. LIVE AC WAVEFORM OSCILLOSCOPE SIMULATOR (v vs i Phase Shifts)
   ========================================================================= */
function setupOscilloscopes() {
  function createScope(canvasId, phaseShiftRad, getWaveParams) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let tOffset = 0;

    function render() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth || 300;
      const height = canvas.clientHeight || 120;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Dark oscilloscope background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Oscilloscope Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridCols = 8;
      const gridRows = 4;
      for (let i = 1; i < gridCols; i++) {
        const x = (width / gridCols) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let j = 1; j < gridRows; j++) {
        const y = (height / gridRows) * j;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Centerline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const centerY = height / 2;
      const { vAmp, iAmp, speed } = getWaveParams();
      tOffset += speed;

      // Draw Voltage Sine Wave (Amber or Primary Trace)
      ctx.strokeStyle = getWaveParams().vColor || '#f59e0b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const angle = (x / width) * Math.PI * 4 + tOffset;
        const y = centerY - Math.sin(angle) * (height * 0.36 * vAmp);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Current Sine Wave with Phase Shift (Sky or Secondary Trace)
      ctx.strokeStyle = getWaveParams().iColor || '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const angle = (x / width) * Math.PI * 4 + tOffset + phaseShiftRad;
        const y = centerY - Math.sin(angle) * (height * 0.36 * iAmp);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    }

    render();
  }

  // 1. Resistor Scope (In Phase: phase = 0)
  createScope('scope-resistor', 0, () => {
    const v = parseFloat(document.getElementById('slider-v')?.value) || 12;
    const r = parseFloat(document.getElementById('slider-r')?.value) || 100;
    const vAmp = Math.min(1, Math.max(0.2, v / 48));
    const iAmp = Math.min(1, Math.max(0.15, (v / r) * 3));
    return { vAmp, iAmp, speed: 0.05, vColor: '#f59e0b', iColor: '#38bdf8' };
  });

  // 2. Inductor Scope (Current Lags by 90° = -PI/2)
  createScope('scope-inductor', -Math.PI / 2, () => {
    const f = parseFloat(document.getElementById('slider-freq')?.value) || 50;
    const L = (parseFloat(document.getElementById('slider-ind')?.value) || 25) / 1000;
    const xl = 2 * Math.PI * f * L;
    const vAmp = 0.85;
    // Current drops as frequency and XL increase
    const iAmp = Math.min(0.9, Math.max(0.15, 8 / Math.max(4, xl)));
    const speed = 0.02 + (f / 1000) * 0.08;
    return { vAmp, iAmp, speed, vColor: '#38bdf8', iColor: '#f59e0b' };
  });

  // 3. Capacitor Scope (Current Leads by 90° = +PI/2)
  createScope('scope-capacitor', Math.PI / 2, () => {
    const f = parseFloat(document.getElementById('slider-cap-freq')?.value) || 100;
    const C = (parseFloat(document.getElementById('slider-cap-val')?.value) || 220) * 1e-6;
    const xc = 1 / (2 * Math.PI * f * C);
    const vAmp = 0.85;
    // Current rises as frequency increases (XC drops)
    const iAmp = Math.min(0.95, Math.max(0.15, 6 / Math.max(2, xc)));
    const speed = 0.02 + (f / 2000) * 0.09;
    return { vAmp, iAmp, speed, vColor: '#a855f7', iColor: '#38bdf8' };
  });
}

/* =========================================================================
   4. INTERACTIVE 4-BAND RESISTOR COLOR CODE CALCULATOR
   ========================================================================= */
function setupResistorColorCode() {
  const sel1 = document.getElementById('select-band-1');
  const sel2 = document.getElementById('select-band-2');
  const sel3 = document.getElementById('select-band-3');
  const sel4 = document.getElementById('select-band-4');
  const resultDisplay = document.getElementById('resistor-color-value');

  const bandStrip1 = document.getElementById('band-strip-1');
  const bandStrip2 = document.getElementById('band-strip-2');
  const bandStrip3 = document.getElementById('band-strip-3');
  const bandStrip4 = document.getElementById('band-strip-4');

  const colorStyles = {
    '0': '#171717', // Black
    '1': '#854d0e', // Brown
    '2': '#dc2626', // Red
    '3': '#ea580c', // Orange
    '4': '#eab308', // Yellow
    '5': '#16a34a', // Green
    '6': '#2563eb', // Blue
    '7': '#9333ea', // Violet
    '8': '#64748b', // Gray
    '9': '#f8fafc', // White
    '10': '#854d0e', // Multiplier 10 (Brown)
    '100': '#dc2626', // Multiplier 100 (Red)
    '1000': '#ea580c', // Multiplier 1k (Orange)
    '10000': '#eab308', // Multiplier 10k (Yellow)
    '100000': '#16a34a', // Multiplier 100k (Green)
    '1000000': '#2563eb', // Multiplier 1M (Blue)
    '0.1': '#ca8a04', // Gold
    '0.01': '#94a3b8', // Silver
    '5': '#ca8a04', // Tol 5% Gold
  };

  function updateColorCode() {
    if (!sel1 || !sel2 || !sel3 || !sel4 || !resultDisplay) return;

    const d1 = parseInt(sel1.value, 10);
    const d2 = parseInt(sel2.value, 10);
    const mult = parseFloat(sel3.value);
    const tol = parseFloat(sel4.value);

    // Update Band Colors
    if (bandStrip1) bandStrip1.style.backgroundColor = colorStyles[String(d1)] || '#854d0e';
    if (bandStrip2) bandStrip2.style.backgroundColor = colorStyles[String(d2)] || '#171717';
    if (bandStrip3) bandStrip3.style.backgroundColor = colorStyles[String(mult)] || '#dc2626';
    if (bandStrip4) bandStrip4.style.backgroundColor = colorStyles[String(tol)] || '#ca8a04';

    // Calculate value
    const val = (d1 * 10 + d2) * mult;
    let formattedVal = '';
    if (val >= 1000000) {
      formattedVal = `${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 2)} MΩ`;
    } else if (val >= 1000) {
      formattedVal = `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)} kΩ`;
    } else {
      formattedVal = `${val.toFixed(val < 10 ? 2 : 0)} Ω`;
    }

    resultDisplay.textContent = `${formattedVal} ±${tol}%`;
  }

  sel1?.addEventListener('change', updateColorCode);
  sel2?.addEventListener('change', updateColorCode);
  sel3?.addEventListener('change', updateColorCode);
  sel4?.addEventListener('change', updateColorCode);
  updateColorCode();
}

/* =========================================================================
   5. COMBINED SERIES RLC RESONANCE SIMULATOR & FREQUENCY CURVE
   ========================================================================= */
function setupRLCResonance() {
  const sliderR = document.getElementById('slider-res-r');
  const sliderL = document.getElementById('slider-res-l');
  const sliderC = document.getElementById('slider-res-c');

  const dispR = document.getElementById('display-res-r');
  const dispL = document.getElementById('display-res-l');
  const dispC = document.getElementById('display-res-c');

  const dispF0 = document.getElementById('display-res-f0');
  const dispQ = document.getElementById('display-res-q');
  const dispBW = document.getElementById('display-res-bw');
  const dispW0 = document.getElementById('display-res-w0');
  const dispZ0 = document.getElementById('display-res-z0');

  const canvas = document.getElementById('canvas-resonance');

  function updateResonance() {
    if (!sliderR || !sliderL || !sliderC || !canvas) return;

    const R = parseFloat(sliderR.value) || 10;
    const lMh = parseFloat(sliderL.value) || 25;
    const cUf = parseFloat(sliderC.value) || 0.1;

    const L = lMh * 1e-3;
    const C = cUf * 1e-6;

    if (dispR) dispR.textContent = `${R} Ω`;
    if (dispL) dispL.textContent = `${lMh.toFixed(0)} mH`;
    if (dispC) dispC.textContent = `${cUf.toFixed(2)} µF`;

    // Resonance frequency: f0 = 1 / (2*PI*sqrt(L*C))
    const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
    const w0 = 2 * Math.PI * f0;
    const Q = (w0 * L) / R;
    const BW = f0 / Q;

    if (dispF0) dispF0.textContent = `${f0.toFixed(1)} Hz`;
    if (dispQ) dispQ.textContent = Q.toFixed(1);
    if (dispBW) dispBW.textContent = `${BW.toFixed(1)} Hz`;
    if (dispW0) dispW0.textContent = `${(w0 / 1000).toFixed(1)} krad/s`;
    if (dispZ0) dispZ0.textContent = `${R.toFixed(1)} Ω`;

    // Plot Resonance Curve on Canvas
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 176;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 30; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Frequency spectrum from 0.05*f0 to 2.5*f0
    const fMin = f0 * 0.05;
    const fMax = f0 * 2.5;
    const V_source = 10;
    const maxI = V_source / R;

    const points = [];
    for (let x = 0; x <= width; x += 2) {
      const f = fMin + (x / width) * (fMax - fMin);
      const w = 2 * Math.PI * f;
      const XL = w * L;
      const XC = 1 / (w * C);
      const Z = Math.sqrt(R * R + (XL - XC) * (XL - XC));
      const I = V_source / Z;
      const normY = I / maxI;
      const y = height - normY * (height * 0.78) - 16;
      points.push({ x, y });
    }

    // Fill gradient under curve
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, height);
    points.forEach((pt, i) => {
      if (i === 0) ctx.lineTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Draw main resonance curve trace
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Find and highlight peak at f0
    const peakX = ((f0 - fMin) / (fMax - fMin)) * width;
    const peakY = height - 1.0 * (height * 0.78) - 16;

    // Dotted vertical line down from f0
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.lineTo(peakX, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing dot at f0 peak
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(peakX, peakY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Label at peak
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`f₀ = ${f0.toFixed(0)} Hz`, Math.min(width - 90, Math.max(10, peakX - 35)), peakY - 8);

    ctx.restore();
  }

  sliderR?.addEventListener('input', updateResonance);
  sliderL?.addEventListener('input', updateResonance);
  sliderC?.addEventListener('input', updateResonance);
  window.addEventListener('resize', updateResonance);
  updateResonance();
}

/* =========================================================================
   6. PRESENTATION MODE SUITE (Timer, Fullscreen, Print Cheat Sheet)
   ========================================================================= */
function setupPresentationMode() {
  // 1. Live Stopwatch Timer
  const timerDisplay = document.getElementById('timer-display');
  const btnTimerToggle = document.getElementById('btn-timer-toggle');
  const btnTimerReset = document.getElementById('btn-timer-reset');

  let timerSeconds = 0;
  let timerInterval = null;
  let timerRunning = false;

  function renderTimer() {
    if (!timerDisplay) return;
    const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const secs = String(timerSeconds % 60).padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
  }

  btnTimerToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!timerRunning) {
      timerInterval = setInterval(() => {
        timerSeconds++;
        renderTimer();
      }, 1000);
      timerRunning = true;
      if (btnTimerToggle) btnTimerToggle.textContent = '⏸';
    } else {
      clearInterval(timerInterval);
      timerRunning = false;
      if (btnTimerToggle) btnTimerToggle.textContent = '▶';
    }
  });

  btnTimerReset?.addEventListener('click', (e) => {
    e.preventDefault();
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = 0;
    renderTimer();
    if (btnTimerToggle) btnTimerToggle.textContent = '▶';
  });

  // 2. Fullscreen Toggle
  const btnFullscreen = document.getElementById('btn-fullscreen');
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  btnFullscreen?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleFullscreen();
  });

  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  // 3. Print / PDF Summary Cheat Sheet
  const btnPrint = document.getElementById('btn-print');
  btnPrint?.addEventListener('click', (e) => {
    e.preventDefault();
    window.print();
  });
}

/* =========================================================================
   7. PRESENTATION NAVIGATION & KEYBOARD SHORTCUTS
   ========================================================================= */
function setupNavigation() {
  document.querySelectorAll('[data-jump]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-jump');
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    // Do not interfere if user is focusing a range slider, input or textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      return;
    }

    const sections = [
      'hero',
      'track-resistor',
      'slide-resistor',
      'track-inductor',
      'slide-inductor',
      'track-capacitor',
      'slide-capacitor',
      'slide-summary',
    ];

    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      const currentScroll = window.scrollY + 120;
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.offsetTop > currentScroll) {
          el.scrollIntoView({ behavior: 'smooth' });
          break;
        }
      }
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      const currentScroll = window.scrollY - 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop < currentScroll) {
          el.scrollIntoView({ behavior: 'smooth' });
          break;
        }
      }
    }
  });
}
