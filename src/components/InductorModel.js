import * as THREE from 'three';

export class InductorModel {
  constructor() {
    this.group = new THREE.Group();
    this.anchors = {};
    this.coilMeshes = [];
    this.initModel();
  }

  initModel() {
    // 1. Ferromagnetic Laminated Core
    // Silicon steel / ferrite core consisting of stacked laminated plates and cylindrical center
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.35,
      metalness: 0.85,
    });

    this.coreGroup = new THREE.Group();
    
    // Core cylinder
    const coreGeo = new THREE.CylinderGeometry(0.55, 0.55, 3.2, 32);
    coreGeo.rotateZ(Math.PI / 2);
    this.mainCore = new THREE.Mesh(coreGeo, coreMat);
    this.coreGroup.add(this.mainCore);

    // End flange plates (Bobbin/Core boundary discs)
    const flangeGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 32);
    flangeGeo.rotateZ(Math.PI / 2);
    this.leftFlange = new THREE.Mesh(flangeGeo, coreMat);
    this.leftFlange.position.x = -1.6;
    this.coreGroup.add(this.leftFlange);

    this.rightFlange = new THREE.Mesh(flangeGeo, coreMat);
    this.rightFlange.position.x = 1.6;
    this.coreGroup.add(this.rightFlange);

    // Laminated core interior sheets (cross-section visualization)
    const sheetMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.9,
    });
    this.laminations = new THREE.Group();
    for (let i = -4; i <= 4; i++) {
      const plateGeo = new THREE.BoxGeometry(2.8, 0.04, 0.9);
      const plate = new THREE.Mesh(plateGeo, sheetMat);
      plate.position.y = i * 0.1;
      this.laminations.add(plate);
    }
    this.laminations.visible = false;
    this.coreGroup.add(this.laminations);

    this.group.add(this.coreGroup);

    // 2. Insulation Layer (High-temperature Mylar / Kapton polyimide sleeve)
    const insulationMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.1,
      transmission: 0.6,
      opacity: 0.8,
      transparent: true,
      clearcoat: 0.5,
    });
    const insulGeo = new THREE.CylinderGeometry(0.62, 0.62, 2.7, 32, 1, true);
    insulGeo.rotateZ(Math.PI / 2);
    this.insulationSleeve = new THREE.Mesh(insulGeo, insulationMat);
    this.group.add(this.insulationSleeve);

    // 3. Copper Wire Windings (High-gloss enameled magnet wire)
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.2,
      metalness: 0.95,
    });

    this.windingsGroup = new THREE.Group();

    // Procedural coil segments to allow progressive uncoiling & radial expansion
    const turnsCount = 14;
    const coilWidth = 2.4;
    const startX = -coilWidth / 2;
    const stepX = coilWidth / turnsCount;

    for (let i = 0; i < turnsCount; i++) {
      const turnCenter = startX + i * stepX;
      // Single turn torus loop with small offset for helix look
      const turnGeo = new THREE.TorusGeometry(0.78, 0.08, 16, 48);
      turnGeo.rotateY(Math.PI / 2);
      const turnMesh = new THREE.Mesh(turnGeo, copperMat);
      turnMesh.position.x = turnCenter;
      
      // Store initial transformation data for smooth explosion
      turnMesh.userData = {
        baseX: turnCenter,
        baseScale: 1,
        angleOffset: (i / turnsCount) * Math.PI * 2
      };

      this.coilMeshes.push(turnMesh);
      this.windingsGroup.add(turnMesh);
    }

    // Terminal wire leads
    const leadGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 16);
    this.leadStart = new THREE.Mesh(leadGeo, copperMat);
    this.leadStart.position.set(-1.25, -1.2, 0);
    this.leadStart.rotation.z = Math.PI / 6;
    this.windingsGroup.add(this.leadStart);

    this.leadEnd = new THREE.Mesh(leadGeo, copperMat);
    this.leadEnd.position.set(1.25, -1.2, 0);
    this.leadEnd.rotation.z = -Math.PI / 6;
    this.windingsGroup.add(this.leadEnd);

    this.group.add(this.windingsGroup);

    // 4. Magnetic Flux Field Visualization (Glowing cyan elliptical rings)
    this.fluxGroup = new THREE.Group();
    const fluxMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      wireframe: true,
    });

    for (let f = 0; f < 3; f++) {
      const ringGeo = new THREE.TorusGeometry(1.6 + f * 0.4, 0.015, 8, 48);
      ringGeo.rotateX(Math.PI / 2);
      const fluxRing = new THREE.Mesh(ringGeo, fluxMat);
      fluxRing.scale.set(1.4, 1, 0.7);
      this.fluxGroup.add(fluxRing);
    }
    this.group.add(this.fluxGroup);

    // Create Anchors
    this.createAnchors();
  }

  createAnchors() {
    this.anchors.coil = new THREE.Object3D();
    this.anchors.coil.position.set(0, 1.2, 0);
    this.windingsGroup.add(this.anchors.coil);

    this.anchors.core = new THREE.Object3D();
    this.anchors.core.position.set(0, 0, 0.7);
    this.coreGroup.add(this.anchors.core);

    this.anchors.insulation = new THREE.Object3D();
    this.anchors.insulation.position.set(-0.8, -0.9, 0);
    this.insulationSleeve.add(this.anchors.insulation);

    this.anchors.flux = new THREE.Object3D();
    this.anchors.flux.position.set(0, 2.1, 0);
    this.fluxGroup.add(this.anchors.flux);
  }

  /**
   * Explodes the inductor: copper wire expands radially away, uncoiling in 3D
   */
  setExplodeProgress(progress) {
    // 1. Windings expand radially and spread apart along X
    this.coilMeshes.forEach((mesh, index) => {
      const radialExpansion = 1 + progress * 1.35;
      mesh.scale.set(1, radialExpansion, radialExpansion);
      // Axial spreading (uncoiling pitch increases)
      const spreadFactor = (index - this.coilMeshes.length / 2) * progress * 0.12;
      mesh.position.x = mesh.userData.baseX + spreadFactor;
      mesh.rotation.x = progress * Math.PI * 0.4;
    });

    // 2. Insulation sleeve slides upward or scales to reveal bare core
    this.insulationSleeve.position.y = progress * 1.5;
    this.insulationSleeve.scale.set(1 + progress * 0.2, 1 + progress * 0.2, 1);

    // 3. Ferromagnetic Core moves slightly down & reveals laminated cross-section
    this.coreGroup.position.y = -progress * 0.6;
    this.laminations.visible = progress > 0.3;
    if (this.laminations.visible) {
      this.laminations.position.z = Math.min((progress - 0.3) * 1.2, 0.6);
    }

    // 4. Magnetic Flux lines become visible and pulse
    this.fluxGroup.children.forEach((ring) => {
      ring.material.opacity = Math.min(progress * 0.85, 0.85);
      ring.rotation.z += 0.01;
    });
  }
}
