import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

function DoThreeJs() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  const etiquetasRenderer = new CSS2DRenderer();
  let sound: THREE.Audio<GainNode>, nave: THREE.Object3D<THREE.Object3DEventMap> | null = null;
  const speed = 0.1;
  const meteorClones: THREE.Object3D<THREE.Object3DEventMap>[] = [];
  let meteor: THREE.Object3D<THREE.Object3DEventMap> | null = null;
  let meteorite: THREE.Object3D<THREE.Object3DEventMap> | null = null;
  const meteoriteClones: THREE.Object3D<THREE.Object3DEventMap>[] = [];
  // let meteoriteMoving = false;
  let clonesAppear = false;
  let cloneCounter = 0;
  const maxClones = 15;
  const cloneInterval = 1000;
  let cloneTimer = 0;
  let meteoriteCloneCounter = 0; // Contador de clones creados
  const maxMeteoriteClones = 5; // Máximo número de clones
  let meteoriteCloneTimer = 0; // Temporizador para crear clones
  const meteoriteCloneInterval = 2000; // Intervalo en milisegundos entre clones


  let score = 0;
  let maxScore = localStorage.getItem('maxScore') ? parseInt(localStorage.getItem('maxScore') || '0') : 0;
  let isGameOver = false; // Bandera para detener el score

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  etiquetasRenderer.setSize(window.innerWidth, window.innerHeight);
  etiquetasRenderer.domElement.style.position = 'absolute';
  etiquetasRenderer.domElement.style.top = '0px';
  etiquetasRenderer.domElement.style.pointerEvents = 'none';
  document.body.appendChild(etiquetasRenderer.domElement);

  // Crear y agregar elementos para mostrar el score y maxScore
  const scoreContainer = document.createElement('div');
  scoreContainer.style.position = 'absolute';
  scoreContainer.style.top = '10px';
  scoreContainer.style.left = '10px';
  scoreContainer.style.color = 'white';
  scoreContainer.style.fontSize = '20px';
  scoreContainer.id = 'scoreContainer';
  document.body.appendChild(scoreContainer);

  function updateScoreDisplay() {
    scoreContainer.innerHTML = `Score: ${score} | Max Score: ${maxScore}`;
  }
  updateScoreDisplay();

  // Configuración de escena, luces, controles, cargadores
  scene.background = new THREE.Color('skyblue');
  const ambientLight = new THREE.AmbientLight(0x99aaff, 1);
  scene.add(ambientLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  const listener1 = new THREE.AudioListener();
  camera.add(listener1);
  const ambientSound = new THREE.Audio(listener1);
  const audioLoader1 = new THREE.AudioLoader();
  audioLoader1.load('audio/Running in the 90s.MP3', buffer => {
    ambientSound.setBuffer(buffer);
    ambientSound.setLoop(true); // Repetir la música en bucle
    ambientSound.setVolume(0.05);
  });

  const listener = new THREE.AudioListener();
  camera.add(listener);
  sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load('audio/wineGlassClink.wav', buffer => {
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(0.5);
  });

  const loader = new RGBELoader();
  loader.load('environments/HDR_ringed_brown_dwarf.hdr', texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  });

  const jpgloader = new THREE.TextureLoader();
  jpgloader.load('environments/HDR_ringed_brown_dwarf.jpg', texturajpg => {
    texturajpg.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texturajpg;
  });

  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    'models/SpaceShip/spaceship.gltf',
    gltf => {
      nave = gltf.scene;
      scene.add(nave);
      nave.scale.set(0.2, 0.2, 0.2);
      nave.position.set(0, 0, 0);
      nave.rotation.y = Math.PI;
      camera.position.set(0, 2, 7);
    },
    undefined,
    error => console.error('Error cargando GLTF:', error)
  );

  gltfLoader.load(
    'models/Meteor/scene.gltf',
    gltf => {
      meteor = gltf.scene;
      scene.add(meteor);
      meteor.scale.set(1.2, 1.2, 1.2);
      meteor.position.set(Math.random() * 10 - 5, Math.random() * 20 - 10, -30);
      meteor.rotation.y = Math.PI;
    },
    undefined,
    error => console.error('Error cargando GLTF:', error)
  );

  gltfLoader.load(
    'models/Meteorite/scene.gltf',
    (gltf) => {
      meteorite = gltf.scene; // Guarda el modelo base
      meteorite.scale.set(0.3, 0.3, 0.3);
      meteorite.rotation.y = Math.PI;
    },
    undefined,
    (error) => console.error('Error cargando GLTF:', error)
  );  

  const initialMeteorPositions: { x: number, y: number, z: number }[] = [];
  const initialClonePositions: { x: number, y: number, z: number }[] = [];  

  function resetMeteorPositions() {
    if (meteor) {
      const initialPos = initialMeteorPositions[0]; // El primer meteorito
      meteor.position.set(initialPos.x, initialPos.y, initialPos.z);
    }
  
    meteorClones.forEach((clone, index) => {
      const initialPos = initialClonePositions[index];
      clone.position.set(initialPos.x, initialPos.y, initialPos.z);
    });
  }

  scene.fog = new THREE.FogExp2(0x999999, 0.02);

  let meteorMoving = false;
  let mousePosition = { x: 0, y: 0 };
  let controlsEnabled = true;
  const shakeAmplitude = 0.05;
  let shakeDuration = 0;

  window.addEventListener('mousemove', event => {
    mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener('click', () => {
    if (!clonesAppear) {
      clonesAppear = true;
      meteorMoving = true;
      ambientSound.play();
    }
  });

  function applyCameraShake() {
    if (shakeDuration > 0) {
      const shakeX = (Math.random() - 0.5) * shakeAmplitude;
      const shakeY = (Math.random() - 0.5) * shakeAmplitude;
      const shakeZ = (Math.random() - 0.5) * shakeAmplitude;
      camera.position.x += shakeX;
      camera.position.y += shakeY;
      camera.position.z += shakeZ;
      shakeDuration -= 1;
    }
  }

  function checkCollision() {
    if (nave) {
      const naveBox = new THREE.Box3().setFromObject(nave);
      meteorClones.forEach(clone => {
        const cloneBox = new THREE.Box3().setFromObject(clone);
        if (naveBox.intersectsBox(cloneBox)) {
          onCollision();
        }
      });
    }
  }

  let meteorSpeed = 0.05; // Velocidad inicial de los meteoritos
  let meteoriteSpeed = 0.02; // Velocidad inicial para meteoriteClones

  function onCollision() {
    controlsEnabled = false;
    shakeDuration = 30;
    const randomAngleX = Math.random() * Math.PI * 2;
    const randomAngleY = Math.random() * Math.PI * 2;
    if (nave) {
      nave.rotation.set(randomAngleX, randomAngleY, 0);
    }
    if (sound.isPlaying) sound.stop();
    sound.play();
    isGameOver = true; // Detener el score
  
    // Resetear las posiciones de los meteoritos
    resetMeteorPositions();
  }  
  
// Crear cubo invisible
const targetCube = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 0.2, 0.2),
  new THREE.MeshBasicMaterial({ color: 0x00ff00, visible: false }) // Invisible
);
targetCube.position.z = -1;
scene.add(targetCube);

function animate(time: number) {
  requestAnimationFrame(animate);

  if (nave && controlsEnabled) {

    // Restringir el movimiento del cubo invisible
    targetCube.position.x = Math.max(-5, Math.min(5, targetCube.position.x));
    targetCube.position.y = Math.max(-3, Math.min(3, targetCube.position.y));

    // Mover el cubo invisible más rápido que la nave
    targetCube.position.x += (mousePosition.x * 10 - targetCube.position.x) * speed * 2;
    targetCube.position.y += (mousePosition.y * 6 - targetCube.position.y) * speed * 2;

    // Mover la nave hacia el cubo invisible
    nave.position.x += (targetCube.position.x - nave.position.x) * speed;
    nave.position.y += (targetCube.position.y - nave.position.y) * speed;

    // Hacer que la nave siga al cubo con la mirada
    nave.lookAt(targetCube.position);
  }

  if (meteorMoving && meteor && !isGameOver) { // Detener el conteo al ocurrir colisión
    if (meteor.position.z < 0) {
      meteor.position.z += meteorSpeed;
    } else {
      meteor.position.set(Math.random() * 20 - 10, Math.random() * 10 - 5, -30);
      score++;
      if (score > maxScore) {
        maxScore = score;
        localStorage.setItem('maxScore', maxScore.toString());
      }
      if (score % 350 === 0) {
        meteorSpeed += 0.05; // Aumentar la velocidad de los meteoritos cada 350 esquivados
      }
      updateScoreDisplay();
    }

    meteorClones.forEach(clone => {
      if (clone.position.z < 0) {
        clone.position.z += meteorSpeed;
      } else {
        clone.position.set(Math.random() * 20 - 10, Math.random() * 10 - 5, -30);
        score++;
        if (score > maxScore) {
          maxScore = score;
          localStorage.setItem('maxScore', maxScore.toString());
        }
        if (score % 350 === 0) {
          meteorSpeed += 0.05; // Aumentar la velocidad de los meteoritos cada 350 esquivados
        }
        updateScoreDisplay();
      }
    });

    meteoriteClones.forEach(clone => {
      if (clone.position.z < 0) {
        clone.position.z += meteoriteSpeed; // Movimiento hacia adelante
      } else {
        // Reiniciar la posición usando la lógica inicial
        const posicionBorde = new THREE.Vector3(
          Math.random() * 20 - 10,
          Math.random() * 30 - 15,
          0
        );
        posicionBorde.normalize(); // Vector de longitud 1
        posicionBorde.multiplyScalar(15); // Escalar para ajustar la distancia inicial
        posicionBorde.z = -30; // Ajustar la profundidad
        clone.position.copy(posicionBorde); // Aplicar nueva posición
      }
    });
  }

  if (clonesAppear && cloneCounter < maxClones) {
    if (time - cloneTimer > cloneInterval) {
      if (meteor) {
        const meteorClone = SkeletonUtils.clone(meteor);
        meteorClone.position.set(Math.random() * 20 - 10, Math.random() * 10 - 5, -30);
        meteorClone.rotation.y = Math.PI;
        scene.add(meteorClone);
        meteorClones.push(meteorClone);
        cloneCounter++;
        cloneTimer = time;
      }
    }
  }

  if (clonesAppear) {
    // Crear clones de meteorite poco a poco
    if (meteorite && meteoriteCloneCounter < maxMeteoriteClones && time - meteoriteCloneTimer > meteoriteCloneInterval) {
      const posicionBorde = new THREE.Vector3(
        Math.random() * 20 - 10,
        Math.random() * 30 - 15,
        0
      );
      posicionBorde.normalize();
      posicionBorde.multiplyScalar(15);
      posicionBorde.z = -30;

      const meteoriteClone = SkeletonUtils.clone(meteorite);
      meteoriteClone.position.copy(posicionBorde);
      meteoriteClone.rotation.y = meteorite.rotation.y;
      meteoriteClone.scale.copy(meteorite.scale);
      meteoriteClone.name = "MeteoriteClone";

      scene.add(meteoriteClone);
      meteoriteClones.push(meteoriteClone);

      meteoriteCloneCounter++;
      meteoriteCloneTimer = time; // Actualiza el temporizador
    }

    // Mover clones de meteorite
    meteoriteClones.forEach((clone) => {
      if (clone.position.z < 0) {
        clone.position.z += 0.02; // Velocidad de movimiento
      } else {
        // Reiniciar posición cuando alcanza al jugador
        const posicionBorde = new THREE.Vector3(
          Math.random() * 20 - 10,
          Math.random() * 30 - 15,
          0
        );
        posicionBorde.normalize();
        posicionBorde.multiplyScalar(15);
        posicionBorde.z = -30;
        clone.position.copy(posicionBorde);
      }
    });
  }

  applyCameraShake();
  checkCollision();
  controls.update();
  etiquetasRenderer.render(scene, camera);
  renderer.render(scene, camera);
}

  animate(0);
}

function App() {
  return <>{DoThreeJs()}</>;
}

export default App;