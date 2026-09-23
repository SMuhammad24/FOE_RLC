import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class AnimationBridge {
  constructor(sceneManager, models) {
    this.sm = sceneManager;
    this.models = models; // { resistor, inductor, capacitor }
    this.hudElements = {};
    this.initHUD();
    this.setupTimelines();
  }

  initHUD() {
    // Select all HUD callouts
    document.querySelectorAll('[data-hud]').forEach((el) => {
      const key = el.getAttribute('data-hud');
      this.hudElements[key] = el;
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    });
  }

  setupTimelines() {
    const { resistor, inductor, capacitor } = this.models;
    const { resistorHolder, inductorHolder, capacitorHolder, camera } = this.sm;

    // Default positions
    resistorHolder.position.set(0, 0, 0);
    inductorHolder.position.set(0, -18, 0);
    capacitorHolder.position.set(0, -36, 0);

    /* =========================================================================
       1. TRACK 1: RESISTOR (PRATIRODHAK) EXPLODED VIEW & TRANSITION
       ========================================================================= */
    const resistorTL = gsap.timeline({
      scrollTrigger: {
        trigger: '#track-resistor',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
      },
    });

    // Initial appearance and gentle camera rotation
    resistorTL
      .fromTo(
        resistorHolder.rotation,
        { x: 0.2, y: -0.4, z: 0.1 },
        { x: 0.35, y: 0.8, z: -0.15, duration: 1.5, ease: 'none' },
        0
      )
      .to(
        { progress: 0 },
        {
          progress: 1,
          duration: 1.8,
          ease: 'power1.inOut',
          onUpdate: function () {
            resistor.setExplodeProgress(this.targets()[0].progress);
          },
        },
        0.4
      )
      // HUD callout appearances synchronized with parts separating
      .to('#hud-resistor-shell', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }, 0.6)
      .to('#hud-resistor-caps', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }, 0.9)
      .to('#hud-resistor-helix', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }, 1.2)
      .to('#hud-resistor-core', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }, 1.5)
      // Hold state for user inspection
      .to({}, { duration: 0.8 })
      // Fade out HUD callouts as we scroll into theory
      .to('.hud-resistor', { opacity: 0, pointerEvents: 'none', duration: 0.4 })
      // Transition model to the side or elevate as theory slide enters
      .to(resistorHolder.position, { x: 2.2, y: 4, z: -3, duration: 1.2 }, '-=0.2')
      .to(resistorHolder.rotation, { y: 2.5, duration: 1.2 }, '<');

    /* =========================================================================
       2. TRACK 2: INDUCTOR (PRERAK) UNCOILING EXPLODED VIEW & TRANSITION
       ========================================================================= */
    const inductorTL = gsap.timeline({
      scrollTrigger: {
        trigger: '#track-inductor',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
      },
    });

    // Bring Inductor into focus
    inductorTL
      .fromTo(
        inductorHolder.position,
        { x: 0, y: -16, z: -4 },
        { x: 0, y: 0, z: 0, duration: 1.2, ease: 'power2.out' },
        0
      )
      .fromTo(
        inductorHolder.rotation,
        { x: 0.5, y: -0.6, z: 0 },
        { x: 0.3, y: 0.7, z: -0.1, duration: 1.5, ease: 'none' },
        0
      )
      // Uncoiling & disassembly animation
      .to(
        { progress: 0 },
        {
          progress: 1,
          duration: 1.8,
          ease: 'power1.inOut',
          onUpdate: function () {
            inductor.setExplodeProgress(this.targets()[0].progress);
          },
        },
        0.5
      )
      // HUD callouts for Inductor
      .to('#hud-inductor-coil', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }, 0.8)
      .to('#hud-inductor-core', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }, 1.1)
      .to('#hud-inductor-insul', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }, 1.4)
      .to('#hud-inductor-flux', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }, 1.7)
      // Hold state
      .to({}, { duration: 0.8 })
      // Fade out HUD callouts
      .to('.hud-inductor', { opacity: 0, pointerEvents: 'none', duration: 0.4 })
      // Shift inductor offstage
      .to(inductorHolder.position, { x: -2.5, y: 5, z: -4, duration: 1.2 }, '-=0.2');

    /* =========================================================================
       3. TRACK 3: CAPACITOR (SANDHARITRAK) UNROLLING EXPLODED VIEW & TRANSITION
       ========================================================================= */
    const capacitorTL = gsap.timeline({
      scrollTrigger: {
        trigger: '#track-capacitor',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
      },
    });

    // Bring Capacitor into view
    capacitorTL
      .fromTo(
        capacitorHolder.position,
        { x: 0, y: -20, z: -4 },
        { x: 0, y: 0, z: 0, duration: 1.2, ease: 'power2.out' },
        0
      )
      .fromTo(
        capacitorHolder.rotation,
        { x: 0.4, y: -0.5, z: 0.1 },
        { x: 0.25, y: 0.9, z: -0.05, duration: 1.5, ease: 'none' },
        0
      )
      // Sliding casing & unrolling foils animation
      .to(
        { progress: 0 },
        {
          progress: 1,
          duration: 1.8,
          ease: 'power1.inOut',
          onUpdate: function () {
            capacitor.setExplodeProgress(this.targets()[0].progress);
          },
        },
        0.5
      )
      // HUD callouts for Capacitor
      .to('#hud-cap-casing', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }, 0.8)
      .to('#hud-cap-anode', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }, 1.1)
      .to('#hud-cap-separator', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }, 1.4)
      .to('#hud-cap-cathode', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }, 1.7)
      // Hold state
      .to({}, { duration: 0.8 })
      // Fade out HUD callouts
      .to('.hud-capacitor', { opacity: 0, pointerEvents: 'none', duration: 0.4 })
      // Settle down for final slides
      .to(capacitorHolder.position, { x: 2.5, y: -1.5, z: -2, duration: 1.2 }, '-=0.2');

    // Theory cards reveal animations
    gsap.utils.toArray('.theory-card-animate').forEach((card) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 40, scale: 0.96 },
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

  /**
   * Updates screen positions of 2D HUD annotations from 3D anchors
   */
  updateHUDPositions() {
    const { resistor, inductor, capacitor } = this.models;

    // Resistor Anchors
    this.positionHUDElement('hud-resistor-core', resistor.anchors.core);
    this.positionHUDElement('hud-resistor-helix', resistor.anchors.helix);
    this.positionHUDElement('hud-resistor-caps', resistor.anchors.caps);
    this.positionHUDElement('hud-resistor-shell', resistor.anchors.shell);

    // Inductor Anchors
    this.positionHUDElement('hud-inductor-coil', inductor.anchors.coil);
    this.positionHUDElement('hud-inductor-core', inductor.anchors.core);
    this.positionHUDElement('hud-inductor-insul', inductor.anchors.insulation);
    this.positionHUDElement('hud-inductor-flux', inductor.anchors.flux);

    // Capacitor Anchors
    this.positionHUDElement('hud-cap-casing', capacitor.anchors.casing);
    this.positionHUDElement('hud-cap-anode', capacitor.anchors.anode);
    this.positionHUDElement('hud-cap-separator', capacitor.anchors.separator);
    this.positionHUDElement('hud-cap-cathode', capacitor.anchors.cathode);
  }

  positionHUDElement(elementId, anchorObject3D) {
    const el = document.getElementById(elementId);
    if (!el || !anchorObject3D) return;

    const screenPos = this.sm.toScreenPosition(anchorObject3D);
    if (screenPos.visible) {
      el.style.left = `${screenPos.x}px`;
      el.style.top = `${screenPos.y}px`;
    }
  }
}
