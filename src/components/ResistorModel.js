import * as THREE from 'three';

export class ResistorModel {
  constructor() {
    this.group = new THREE.Group();
    this.anchors = {};
    this.initModel();
  }

  initModel() {
    // Ceramic Core (Bone-white / off-white alumina cylinder)
    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0xf5f3ee,
      roughness: 0.55,
      metalness: 0.05,
    });
    const coreGeo = new THREE.CylinderGeometry(0.38, 0.38, 3.2, 32);
    coreGeo.rotateZ(Math.PI / 2);
    this.ceramicCore = new THREE.Mesh(coreGeo, ceramicMat);
    this.group.add(this.ceramicCore);

    // Carbon Film Spiral Helix (Laser-trimmed resistive carbon track)
    const helixCurve = new THREE.Curve();
    helixCurve.getPoint = function (t) {
      const turns = 7;
      const angle = t * Math.PI * 2 * turns;
      const radius = 0.395;
      const x = (t - 0.5) * 2.8;
      const y = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return new THREE.Vector3(x, y, z);
    };

    const helixGeo = new THREE.TubeGeometry(helixCurve, 180, 0.045, 12, false);
    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.35,
      metalness: 0.85,
    });
    this.carbonHelix = new THREE.Mesh(helixGeo, carbonMat);
    this.group.add(this.carbonHelix);

    // Metal End Caps (Nickel-plated steel caps)
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.2,
      metalness: 0.95,
    });

    const capGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.45, 32);
    capGeo.rotateZ(Math.PI / 2);

    this.leftCap = new THREE.Mesh(capGeo, capMat);
    this.leftCap.position.x = -1.6;
    this.group.add(this.leftCap);

    this.rightCap = new THREE.Mesh(capGeo, capMat);
    this.rightCap.position.x = 1.6;
    this.group.add(this.rightCap);

    // Axial Lead Wires (Tinned Copper)
    const leadMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.25,
      metalness: 0.9,
    });
    const leadGeo = new THREE.CylinderGeometry(0.065, 0.065, 2.2, 16);
    leadGeo.rotateZ(Math.PI / 2);

    this.leftLead = new THREE.Mesh(leadGeo, leadMat);
    this.leftLead.position.x = -2.9;
    this.leftCap.add(this.leftLead);

    this.rightLead = new THREE.Mesh(leadGeo, leadMat);
    this.rightLead.position.x = 2.9;
    this.rightCap.add(this.rightLead);

    // Outer Epoxy Shell with Color Bands (split into top and bottom shell halves for exploded view)
    this.epoxyGroup = new THREE.Group();

    // Custom textured shell with color bands
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Base body color (classic resistor beige / tan)
    ctx.fillStyle = '#c8a876';
    ctx.fillRect(0, 0, 512, 128);

    // Band 1: Brown (1)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(110, 0, 22, 128);

    // Band 2: Black (0)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(160, 0, 22, 128);

    // Band 3: Red (10^2 multiplier)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(210, 0, 22, 128);

    // Band 4: Gold (±5% tolerance)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(360, 0, 20, 128);

    const bandTexture = new THREE.CanvasTexture(canvas);
    bandTexture.wrapS = THREE.RepeatWrapping;
    bandTexture.repeat.set(1, 1);

    const shellMat = new THREE.MeshPhysicalMaterial({
      map: bandTexture,
      roughness: 0.3,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      transparent: true,
      opacity: 0.96,
    });

    // Top shell half
    const topShellGeo = new THREE.CylinderGeometry(0.44, 0.44, 2.7, 32, 1, false, 0, Math.PI);
    topShellGeo.rotateZ(Math.PI / 2);
    this.topShell = new THREE.Mesh(topShellGeo, shellMat);
    this.epoxyGroup.add(this.topShell);

    // Bottom shell half
    const bottomShellGeo = new THREE.CylinderGeometry(0.44, 0.44, 2.7, 32, 1, false, Math.PI, Math.PI);
    bottomShellGeo.rotateZ(Math.PI / 2);
    this.bottomShell = new THREE.Mesh(bottomShellGeo, shellMat);
    this.epoxyGroup.add(this.bottomShell);

    this.group.add(this.epoxyGroup);

    // Invisible anchor points for HUD tracking
    this.createAnchors();
  }

  createAnchors() {
    this.anchors.core = new THREE.Object3D();
    this.anchors.core.position.set(0, 0, 0);
    this.ceramicCore.add(this.anchors.core);

    this.anchors.helix = new THREE.Object3D();
    this.anchors.helix.position.set(-0.5, 0.55, 0);
    this.carbonHelix.add(this.anchors.helix);

    this.anchors.caps = new THREE.Object3D();
    this.anchors.caps.position.set(-1.6, 0.6, 0);
    this.leftCap.add(this.anchors.caps);

    this.anchors.shell = new THREE.Object3D();
    this.anchors.shell.position.set(0.6, 0.7, 0);
    this.topShell.add(this.anchors.shell);
  }

  /**
   * Explodes the resistor components based on progress value [0, 1]
   */
  setExplodeProgress(progress) {
    // 1. Epoxy outer shell splits outward and becomes semi-translucent
    this.topShell.position.y = progress * 1.6;
    this.topShell.position.z = progress * 0.4;
    this.topShell.rotation.x = progress * 0.35;

    this.bottomShell.position.y = -progress * 1.6;
    this.bottomShell.position.z = -progress * 0.4;
    this.bottomShell.rotation.x = -progress * 0.35;

    this.topShell.material.opacity = 0.96 - progress * 0.25;

    // 2. Metal end caps pull away axially
    this.leftCap.position.x = -1.6 - progress * 1.5;
    this.rightCap.position.x = 1.6 + progress * 1.5;

    // 3. Carbon film helix expands radially to reveal ceramic core
    const helixScale = 1 + progress * 1.1;
    this.carbonHelix.scale.set(1, helixScale, helixScale);
    this.carbonHelix.position.y = progress * 0.4;

    // 4. Ceramic core rotates slightly to catch highlights
    this.ceramicCore.position.y = -progress * 0.2;
  }
}
