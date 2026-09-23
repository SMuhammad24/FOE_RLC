import * as THREE from 'three';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05070e, 0.04);

    this.initCamera();
    this.initRenderer();
    this.initLights();
    this.initGroups();

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.camera.lookAt(this.cameraTarget);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  initLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Key Light (Crisp white illumination)
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    this.keyLight.position.set(5, 8, 6);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.scene.add(this.keyLight);

    // Rim / Back light for metallic edges (Electric Cyan accent)
    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    this.rimLight.position.set(-6, -3, -5);
    this.scene.add(this.rimLight);

    // Warm specular fill light (Amber accent for copper coil & resistor bands)
    this.fillLight = new THREE.DirectionalLight(0xf59e0b, 1.2);
    this.fillLight.position.set(-4, 5, 4);
    this.scene.add(this.fillLight);

    // Subtle floor glow point light
    const pointGlow = new THREE.PointLight(0x0284c7, 1.5, 20);
    pointGlow.position.set(0, -3, 2);
    this.scene.add(pointGlow);
  }

  initGroups() {
    this.mainGroup = new THREE.Group();
    this.scene.add(this.mainGroup);

    this.resistorHolder = new THREE.Group();
    this.inductorHolder = new THREE.Group();
    this.capacitorHolder = new THREE.Group();

    // Start with inductor and capacitor hidden / moved away
    this.inductorHolder.position.y = -20;
    this.capacitorHolder.position.y = -40;

    this.mainGroup.add(this.resistorHolder);
    this.mainGroup.add(this.inductorHolder);
    this.mainGroup.add(this.capacitorHolder);
  }

  onWindowResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  toScreenPosition(object3D) {
    const vector = new THREE.Vector3();
    object3D.getWorldPosition(vector);
    vector.project(this.camera);

    const x = (vector.x * 0.5 + 0.5) * this.width;
    const y = (-(vector.y * 0.5) + 0.5) * this.height;

    return { x, y, visible: vector.z < 1 };
  }

  render() {
    this.camera.lookAt(this.cameraTarget);
    this.renderer.render(this.scene, this.camera);
  }
}
