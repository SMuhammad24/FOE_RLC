import * as THREE from 'three';

export class CapacitorModel {
  constructor() {
    this.group = new THREE.Group();
    this.anchors = {};
    this.initModel();
  }

  initModel() {
    // 1. Outer Aluminum Can Casing & PVC Sleeve
    this.canGroup = new THREE.Group();

    // Canvas texture for printed capacitor sleeve
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep metallic navy sleeve
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    // Negative terminal indicator strip (white stripe with '-' signs)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(40, 0, 70, 512);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px monospace';
    for (let y = 50; y < 500; y += 70) {
      ctx.fillText('—', 65, y);
    }

    // Capacitor technical ratings text
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('470 µF', 180, 180);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px sans-serif';
    ctx.fillText('25V  105°C', 180, 230);
    ctx.fillText('VENT SAFETY', 180, 270);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('ELECTROLYTIC', 180, 310);

    const canTexture = new THREE.CanvasTexture(canvas);

    const sleeveMat = new THREE.MeshStandardMaterial({
      map: canTexture,
      roughness: 0.35,
      metalness: 0.5,
    });

    // Main cylinder can
    const canGeo = new THREE.CylinderGeometry(1.1, 1.1, 3.4, 32, 1, true);
    this.canMesh = new THREE.Mesh(canGeo, sleeveMat);
    this.canGroup.add(this.canMesh);

    // Embossed aluminum safety vent top (K-groove relief pattern)
    const topMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.25,
      metalness: 0.95,
    });
    const topGeo = new THREE.CylinderGeometry(1.09, 1.09, 0.05, 32);
    this.canTop = new THREE.Mesh(topGeo, topMat);
    this.canTop.position.y = 1.7;
    this.canGroup.add(this.canTop);

    // Top safety vent cross indent lines
    const ventMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
    const ventLine1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.06), ventMat);
    ventLine1.position.y = 1.73;
    this.canGroup.add(ventLine1);

    const ventLine2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.4), ventMat);
    ventLine2.position.y = 1.73;
    this.canGroup.add(ventLine2);

    this.group.add(this.canGroup);

    // 2. Base Rubber Stopper Bung & Terminal Pins
    this.baseGroup = new THREE.Group();
    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.05,
    });
    const bungGeo = new THREE.CylinderGeometry(1.02, 1.02, 0.3, 32);
    this.bungMesh = new THREE.Mesh(bungGeo, rubberMat);
    this.bungMesh.position.y = -1.65;
    this.baseGroup.add(this.bungMesh);

    // Anode (+) longer lead wire
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.9,
    });
    const anodeGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 16);
    this.anodePin = new THREE.Mesh(anodeGeo, pinMat);
    this.anodePin.position.set(-0.4, -2.6, 0);
    this.baseGroup.add(this.anodePin);

    // Cathode (-) shorter lead wire
    const cathodeGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 16);
    this.cathodePin = new THREE.Mesh(cathodeGeo, pinMat);
    this.cathodePin.position.set(0.4, -2.35, 0);
    this.baseGroup.add(this.cathodePin);

    this.group.add(this.baseGroup);

    // 3. The Inner Wound Jelly-Roll and Unrolling Foils
    this.coreRollGroup = new THREE.Group();

    // Central cylindrical core (tight inner winding)
    const woundCoreMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.5,
      metalness: 0.3,
    });
    const woundCoreGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.9, 32);
    this.woundCore = new THREE.Mesh(woundCoreGeo, woundCoreMat);
    this.coreRollGroup.add(this.woundCore);

    // Unrolling Layer 1: Anode Aluminum Foil (+ Dielectric Al2O3 Oxide)
    const anodeFoilMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.25,
      metalness: 0.9,
      side: THREE.DoubleSide,
    });
    // Create flexible curved sheet mesh
    this.anodeSheet = this.createUnrollSheet(0.7, 2.7, anodeFoilMat);
    this.coreRollGroup.add(this.anodeSheet);

    // Unrolling Layer 2: Dielectric Separator Paper with Liquid Electrolyte
    const separatorMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    this.separatorSheet = this.createUnrollSheet(0.78, 2.8, separatorMat);
    this.coreRollGroup.add(this.separatorSheet);

    // Unrolling Layer 3: Cathode Aluminum Foil
    const cathodeFoilMat = new THREE.MeshStandardMaterial({
      color: 0xa1a1aa,
      roughness: 0.2,
      metalness: 0.95,
      side: THREE.DoubleSide,
    });
    this.cathodeSheet = this.createUnrollSheet(0.86, 2.7, cathodeFoilMat);
    this.coreRollGroup.add(this.cathodeSheet);

    this.group.add(this.coreRollGroup);

    // 4. Anchors for HUD overlays
    this.createAnchors();
  }

  createUnrollSheet(radius, height, material) {
    // Generates a curved cylinder segment that can unroll into flat geometry via morph/scale/rotation
    const segments = 32;
    const geometry = new THREE.CylinderGeometry(radius, radius, height, segments, 1, true, 0, Math.PI * 1.5);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { initialRadius: radius };
    return mesh;
  }

  createAnchors() {
    this.anchors.casing = new THREE.Object3D();
    this.anchors.casing.position.set(0, 2.4, 0);
    this.canGroup.add(this.anchors.casing);

    this.anchors.anode = new THREE.Object3D();
    this.anchors.anode.position.set(-1.4, 0.4, 0.5);
    this.anodeSheet.add(this.anchors.anode);

    this.anchors.separator = new THREE.Object3D();
    this.anchors.separator.position.set(0, 0, 1.4);
    this.separatorSheet.add(this.anchors.separator);

    this.anchors.cathode = new THREE.Object3D();
    this.anchors.cathode.position.set(1.4, -0.4, 0.5);
    this.cathodeSheet.add(this.anchors.cathode);
  }

  /**
   * Explodes the capacitor: aluminum sleeve slides up, base moves down, inner foils unroll flat
   */
  setExplodeProgress(progress) {
    // 1. Aluminum casing slides straight up like a sleeve
    this.canGroup.position.y = progress * 3.6;
    this.canGroup.rotation.y = progress * 0.8;

    // 2. Rubber bung and lead pins pull down
    this.baseGroup.position.y = -progress * 1.5;

    // 3. Jelly roll foil layers expand and unroll outwards into space
    const unroll1 = progress * 1.4;
    this.anodeSheet.position.x = -unroll1 * 1.6;
    this.anodeSheet.position.z = unroll1 * 0.4;
    this.anodeSheet.rotation.y = -progress * Math.PI * 0.6;
    this.anodeSheet.scale.set(1 + progress * 0.8, 1, 1);

    const unroll2 = progress * 1.2;
    this.separatorSheet.position.z = unroll2 * 1.5;
    this.separatorSheet.rotation.y = progress * Math.PI * 0.25;
    this.separatorSheet.scale.set(1 + progress * 0.7, 1, 1);

    const unroll3 = progress * 1.4;
    this.cathodeSheet.position.x = unroll3 * 1.6;
    this.cathodeSheet.position.z = -unroll3 * 0.4;
    this.cathodeSheet.rotation.y = progress * Math.PI * 0.6;
    this.cathodeSheet.scale.set(1 + progress * 0.8, 1, 1);

    // Inner core rotates to show unrolling origin
    this.woundCore.rotation.y = progress * Math.PI * 1.5;
  }
}
