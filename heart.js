import * as THREE from "three";
import { OrbitControls } from "./OrbitControls";
import { DeviceOrientationControls } from "./DeviceOrientationControls";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";

// let camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100);
// let scene = new THREE.Scene();
// let renderer = new THREE.WebGLRenderer({ antialias: true });
let camera, renderer, scene;
const loader = new THREE.TextureLoader().setPath("img/");
let heartMesh, geo, material;
let spotHelper;
let spotlight, spotlight2, spotlight3, spotlight4, spotlight5, spotlight6;
let spotlights;
let textMesh;
let font;
let group = new THREE.Group();
const floader = new FontLoader();
floader.load("fonts/helvetiker_bold.typeface.json", function(res){
    font = res;
});

const listener = new THREE.AudioListener();

function useCoordinates () {
  const vertices = [
    new THREE.Vector3(0, 0, 0), // point C
    new THREE.Vector3(0, 5, -1.5),
    new THREE.Vector3(5, 5, 0), // point A
    new THREE.Vector3(9, 9, 0),
    new THREE.Vector3(5, 9, 2),
    new THREE.Vector3(7, 13, 0),
    new THREE.Vector3(3, 13, 0),
    new THREE.Vector3(0, 11, 0),
    new THREE.Vector3(5, 9, -2),
    new THREE.Vector3(0, 8, -3),
    new THREE.Vector3(0, 8, 3),
    new THREE.Vector3(0, 5, 1.5), // point B
    new THREE.Vector3(-9, 9, 0),
    new THREE.Vector3(-5, 5, 0),
    new THREE.Vector3(-5, 9, -2),
    new THREE.Vector3(-5, 9, 2),
    new THREE.Vector3(-7, 13, 0),
    new THREE.Vector3(-3, 13, 0),
  ];
  const trianglesIndexes = [
  // face 1
    2,11,0, // This represents the 3 points A,B,C which compose the first triangle
    2,3,4,
    5,4,3,
    4,5,6,
    4,6,7,
    4,7,10,
    4,10,11,
    4,11,2,
    0,11,13,
    12,13,15,
    12,15,16,
    16,15,17,
    17,15,7,
    7,15,10,
    11,10,15,
    13,11,15,
  // face 2
    0,1,2,
    1,9,2,
    9,8,2,
    5,3,8,
    8,3,2,
    6,5,8,
    7,6,8,
    9,7,8,
    14,17,7,
    14,7,9,
    14,9,1,
    9,1,13,
    1,0,13,
    14,1,13,
    16,14,12,
    16,17,14,
    12,14,13
  ];
  return {
    vertices,
    trianglesIndexes
  };
}

var minIntensity = 100;
var maxIntensity = 500;
var currentIntensity = 100;
var intensityIncrement = 10; // Adjust as needed
var intervalTime = 50;
var intensityDir = 1;

var intensityInterval = setInterval(function () {
    // Update the intensity
    if (spotlights == undefined)
        return;
    for (let i = 0; i < spotlights.length; i++) {
        spotlights[i].intensity = currentIntensity;
    }
    // spotlight.intensity = currentIntensity / 100;

    // Increment or decrement the intensity
    if(currentIntensity == 500) {
        intensityDir = 0;
    }
    else if (currentIntensity == 100) {
        intensityDir = 1;
    }

    if (intensityDir == 0) {
        intensityIncrement = -10;
    }
    if (intensityDir == 1) {
        intensityIncrement = 10;
    }

    currentIntensity += intensityIncrement;

}, intervalTime);

function createHeartMesh (coordinatesList, trianglesIndexes) {
    geo = new THREE.BufferGeometry();
    const verticesArray = new Float32Array(coordinatesList.length * 3);
    coordinatesList.forEach((vector, index) => {
        verticesArray[index * 3] = vector.x;
        verticesArray[index * 3 + 1] = vector.y;
        verticesArray[index * 3 + 2] = vector.z;
    });
    geo.setAttribute("position", new THREE.BufferAttribute(verticesArray, 3));
    const indicesArray = new Uint32Array(trianglesIndexes);
    geo.setIndex(new THREE.BufferAttribute(indicesArray, 1));
	geo.computeVertexNormals();
    material = new THREE.MeshPhongMaterial({color: 0xff9898});
	heartMesh = new THREE.Mesh(geo, material);
    heartMesh.castShadow = true;
    heartMesh.receiveShadow = true;
}

function addWireFrameToMesh (mesh, geometry) {
	const wireframe = new THREE.WireframeGeometry(geometry);
	const lineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
	const line = new THREE.LineSegments(wireframe, lineMat);
	mesh.add(line);
}

const beatingIncrement = 0.008;
let scaleThreshold = false;
function beatingAnimation (mesh) {
	 // while the scale value is below the max,
	 // and the threshold is not reached, we increase it
	 if (mesh.scale.x < 1.4 && !scaleThreshold) {
	  mesh.scale.x += beatingIncrement * 2;
	  mesh.scale.y += beatingIncrement * 2;
	  mesh.scale.z += beatingIncrement * 2;
	  // When max value is reached, the flag can be switched
      if (mesh.scale.x >= 1.4) {
        scaleThreshold = true;
      }
	 } else if (scaleThreshold) {
	  mesh.scale.x -= beatingIncrement;
	  mesh.scale.y -= beatingIncrement;
	  mesh.scale.z -= beatingIncrement;
	  // The mesh got back to its initial state
	  // we can switch back the flag and go through the increasing path next time
	  if (mesh.scale.x <= 1) {
	   scaleThreshold = startAnim = false;
	  }
	 }
}

let startAnim = false;

function handleMouseIntersection (camera, scene, meshUuid) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onMouseIntersection( event ) {
      const coordinatesObject = event.changedTouches ? event.changedTouches[0] : event;
      mouse.x = ( coordinatesObject.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( coordinatesObject.clientY / window.innerHeight ) * 2 + 1;

      raycaster.setFromCamera( mouse, camera );
      const intersects = raycaster.intersectObjects( scene.children );

      if (intersects.length && intersects[0].object.uuid === meshUuid) {
          startAnim = true;
      }
  }

  mouse.x = 1;
  mouse.y = 1;

  return {
      onMouseIntersection
  };
}

function setControls (camera, domElement, deviceOrientationMode) {
  const controls = deviceOrientationMode ? new DeviceOrientationControls(camera) : new OrbitControls( camera, domElement );
  controls.minPolarAngle = Math.PI/3;
  controls.maxPolarAngle = 2*Math.PI/3;
  controls.minDistance = 20;
  controls.maxDistance = 34;
	controls.update();
  return {
    controls
  };
}

function createRoom ({ width, height, depth }, scene) {
  const planeMaterial = new THREE.MeshPhongMaterial({color: 0xff0606});
  for (let i = 0; i < 6; i++) {
    const geo = new THREE.PlaneGeometry( width, height, 2 );
    const rotationAngle = {
      axis: 'X',
      radiant: 0
    };
    const translation = {
      x: 0,
      y: 0,
      z: 0
    };
    switch (i) {
      case 0:
        translation.z = -depth/2;
        break;
      case 1:
        rotationAngle.radiant = -Math.PI * 0.5;
        rotationAngle.axis = 'X';
        translation.y = -height/2;
        break;
      case 2:
        rotationAngle.radiant = Math.PI * 0.5;
        rotationAngle.axis = 'X';
        translation.y = height/2;
        break;
      case 3:
        rotationAngle.radiant = Math.PI * 0.5;
        rotationAngle.axis = 'Y';
        translation.x = -width/2;
        break;
      case 4:
        rotationAngle.radiant = -Math.PI * 0.5;
        rotationAngle.axis = 'Y';
        translation.x = width/2;
        break;
      case 5:
        translation.z = depth/2;
        rotationAngle.radiant = -Math.PI;
        rotationAngle.axis = 'Y';
        break;
      default:
        break;
    }
    const plane = new THREE.Mesh(geo[`rotate${rotationAngle.axis}`](rotationAngle.radiant).translate(translation.x, translation.y, translation.z), planeMaterial);
    plane.receiveShadow = true;
    plane.castShadow = true;
    scene.add(plane);
  }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate () {
    renderer.render(scene, camera);
    heartMesh.rotation.y -= 0.005;
    spotlight.rotation.y -= 0.01;
    spotlight2.rotation.y -= 0.01;
    group.rotation.y -= 0.005;
    spotHelper.update();
  }
let controls;

function init ({ deviceOrientationMode }) {
  document.querySelector('.controlsOverlay').remove();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setAnimationLoop( animate );
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 100 );
  camera.add(listener);
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("audio/maitro.mp3", function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.25);
    sound.play();
  });
  camera.position.set( 7, 200, 1 );
  scene.add(camera);

//   const {scene, camera, renderer} = createScene();
// let spotlight = createSpotlight(new THREE.Vector3(0, 20, 0), new THREE.Vector3(0,0,0));
    spotlight = new THREE.SpotLight(0x860404, 100);
    const texture = loader.load("noise.jpg");
    spotlight.map = texture;
    spotlight.castShadow = true;
    spotlight.penumbra = 1;
    spotlight.decay = 1;
    spotlight.shadow.camera.near = 1;
    spotlight.shadow.mapSize.width = 1024;
    spotlight.shadow.mapSize.height = 1024;
    spotlight.distance = 0;
    spotlight.shadow.camera.far = 500;
    spotlight.shadow.focus = 1;
    spotlight.shadow.camera.fov = 30;
    spotlight.angle = 0.785398;
    spotlight.position.set(0, 20, 0);
    scene.add(spotlight);
    spotlight2 = new THREE.SpotLight(0x860404, 100);
    spotlight2.map = texture;
    spotlight2.castShadow = true;
    spotlight2.penumbra = 1;
    spotlight2.decay = 1;
    spotlight2.shadow.camera.near = 1;
    spotlight2.shadow.mapSize.width = 1024;
    spotlight2.shadow.mapSize.height = 1024;
    spotlight2.distance = 0;
    spotlight2.shadow.camera.far = 500;
    spotlight2.shadow.focus = 1;
    spotlight2.shadow.camera.fov = 30;
    spotlight2.angle = 0.785398;
    spotlight2.position.set(0, -20, 0);
    spotlight2.rotation.set(0, -90, 0);
    scene.add(spotlight2);
    spotlight3 = new THREE.SpotLight(0x860404, 100);
    spotlight3.map = texture;
    spotlight3.castShadow = true;
    spotlight3.penumbra = 1;
    spotlight3.decay = 1;
    spotlight3.shadow.camera.near = 1;
    spotlight3.shadow.mapSize.width = 1024;
    spotlight3.shadow.mapSize.height = 1024;
    spotlight3.distance = 0;
    spotlight3.shadow.camera.far = 500;
    spotlight3.shadow.focus = 1;
    spotlight3.shadow.camera.fov = 30;
    spotlight3.angle = 0.785398;
    spotlight3.position.set(-20, 10, 0);
    spotlight3.rotation.set(0, -90, 0);
    scene.add(spotlight3);
    const shlper2 = new THREE.SpotLightHelper(spotlight3);
    spotlight4 = new THREE.SpotLight(0x860404, 100);
    spotlight4.map = texture;
    spotlight4.castShadow = true;
    spotlight4.penumbra = 1;
    spotlight4.decay = 1;
    spotlight4.shadow.camera.near = 1;
    spotlight4.shadow.mapSize.width = 1024;
    spotlight4.shadow.mapSize.height = 1024;
    spotlight4.distance = 0;
    spotlight4.shadow.camera.far = 500;
    spotlight4.shadow.focus = 1;
    spotlight4.shadow.camera.fov = 30;
    spotlight4.angle = 0.785398;
    spotlight4.position.set(20, 10, 0);
    spotlight4.rotation.set(0, 90, 0);
    scene.add(spotlight4);
    const shlper3 = new THREE.SpotLightHelper(spotlight4);
    spotlight5 = new THREE.SpotLight(0x860404, 100);
    spotlight5.map = texture;
    spotlight5.castShadow = true;
    spotlight5.penumbra = 1;
    spotlight5.decay = 1;
    spotlight5.shadow.camera.near = 1;
    spotlight5.shadow.mapSize.width = 1024;
    spotlight5.shadow.mapSize.height = 1024;
    spotlight5.distance = 0;
    spotlight5.shadow.camera.far = 500;
    spotlight5.shadow.focus = 1;
    spotlight5.shadow.camera.fov = 30;
    spotlight5.angle = 0.785398;
    spotlight5.position.set(0, 10, -20);
    spotlight5.rotation.set(0, 90, 0);
    scene.add(spotlight5);
    const shlper4 = new THREE.SpotLightHelper(spotlight5);
    spotlight6 = new THREE.SpotLight(0x860404, 100);
    spotlight6.map = texture;
    spotlight6.castShadow = true;
    spotlight6.penumbra = 1;
    spotlight6.decay = 1;
    spotlight6.shadow.camera.near = 1;
    spotlight6.shadow.mapSize.width = 1024;
    spotlight6.shadow.mapSize.height = 1024;
    spotlight6.distance = 0;
    spotlight6.shadow.camera.far = 500;
    spotlight6.shadow.focus = 1;
    spotlight6.shadow.camera.fov = 30;
    spotlight6.angle = 0.785398;
    spotlight6.position.set(0, 10, 20);
    spotlight6.rotation.set(0, 90, 0);
    scene.add(spotlight6);
    spotlights = [spotlight, spotlight2, spotlight3, spotlight4, spotlight5, spotlight6];
    const shlper5 = new THREE.SpotLightHelper(spotlight5);
    const shlper = new THREE.SpotLightHelper(spotlight2);
    spotHelper = new THREE.SpotLightHelper(spotlight);
    // scene.add(spotHelper);
    // scene.add(shlper);
    // scene.add(shlper2);scene.add(shlper3);scene.add(shlper4);scene.add(shlper5);
  const ambient = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 0.15 );
  scene.add( ambient );
  let text = new TextGeometry("For Anya <3", {font: font, size: 2, height: 2});
  text.computeBoundingBox();
  let textOffset = - 0.5 * (text.boundingBox.max.x - text.boundingBox.min.x);
  textMesh = new THREE.Mesh(text, new THREE.MeshPhongMaterial({color: 0xff0404}));
  textMesh.position.x = textOffset;
  textMesh.position.y = -10;
  textMesh.rotation.x = 0;
  textMesh.rotation.y = Math.PI * 2;
  group.add(textMesh);
  
  scene.add(group);
  controls = setControls(camera, renderer.domElement, deviceOrientationMode);
  const {vertices, trianglesIndexes} = useCoordinates();
  createHeartMesh(vertices, trianglesIndexes);
  scene.add(heartMesh);
  createRoom({ width: 70, height: 70, depth: 70 }, scene);

  addWireFrameToMesh(heartMesh, geo);
  const { onMouseIntersection } = handleMouseIntersection(camera, scene, heartMesh.uuid);

  window.addEventListener('click', onMouseIntersection, false);
  window.addEventListener('resize', onWindowResize);
//   animate();
}

document.querySelector('.controlsOverlay__orbit').onclick = () => {
  init({ deviceOrientationMode: false });
}
document.querySelector('.controlsOverlay__rotation').onclick = () => {
  init({ deviceOrientationMode: true });
}