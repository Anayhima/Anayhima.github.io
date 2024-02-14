import * as THREE from "three";
import { OrbitControls } from "./OrbitControls";
import { DeviceOrientationControls } from "./DeviceOrientationControls";

let camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100);
let scene = new THREE.Scene();
let renderer = new THREE.WebGLRenderer({ antialias: true });
const loader = new THREE.TextureLoader().setPath("img/");

function createScene () {
    // scene = new THREE.Scene();
	// camera = new THREE.PerspectiveCamera(60,  window.innerWidth / window.innerHeight, 1, 100);
	camera.position.z = 30;
	    
	// renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	    
	const color = 0xFFFFFF;
	const intensity = 0.75;
	const light = new THREE.PointLight(color, intensity);
	light.position.set(-15, -10, 30);
    const light2 = new THREE.PointLight(color, intensity);
    light2.position.set(15, -10, -30);

    const spotlight = new THREE.SpotLight(0xffffff);
    const texture = loader.load("noise.jpg");
    const mater = new THREE.ShadowMaterial()
    spotlight.shadow.map = texture;
    spotlight.castShadow = true;
    // spotlight.shadow.mapSize.width = 1024;
    // spotlight.shadow.mapSize.height = 1024;
    spotlight.shadow.camera.near = 0.5;
    spotlight.shadow.camera.far = 500;
    spotlight.shadow.focus = 1;
    spotlight.shadow.camera.fov = 30;
    spotlight.angle = 0.785398;
    spotlight.position.set(0, 20, 0);
    scene.add(spotlight);
    
    const spotHelper = new THREE.SpotLightHelper(spotlight);
    scene.add(spotHelper);


	scene.add(light);
	scene.add(light2);
		
	return {
		scene,
		camera,
		renderer
	};
}

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

function createHeartMesh (coordinatesList, trianglesIndexes) {
	const geo = new THREE.Geometry();

	for (let i in trianglesIndexes) {
		if ((i+1)%3 === 0) {
			geo.vertices.push(coordinatesList[trianglesIndexes[i-2]], coordinatesList[trianglesIndexes[i-1]], coordinatesList[trianglesIndexes[i]]);
			geo.faces.push(new THREE.Face3(i-2, i-1, i));
		}
	}
	geo.computeVertexNormals();
	const material = new THREE.MeshPhongMaterial( { color: 0xad0c00 } );
	const heartMesh = new THREE.Mesh(geo, material);
    heartMesh.castShadow = true;
    heartMesh.receiveShadow = true;
	return {
		geo,
		material,
		heartMesh
	};
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
  const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x5e1b16 });
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

function init ({ deviceOrientationMode }) {
  document.querySelector('.controlsOverlay').remove();

  const {scene, camera, renderer} = createScene();
  const { controls } = setControls(camera, renderer.domElement, deviceOrientationMode);
  const { vertices, trianglesIndexes} = useCoordinates();
  const { geo, material, heartMesh } = createHeartMesh(vertices, trianglesIndexes);
  scene.add(heartMesh);
  createRoom({ width: 70, height: 70, depth: 70 }, scene);

  addWireFrameToMesh(heartMesh, geo);
  const { onMouseIntersection } = handleMouseIntersection(camera, scene, heartMesh.uuid);

  window.addEventListener('click', onMouseIntersection, false);
  window.addEventListener('resize', onWindowResize);

  const animate = function () {
    requestAnimationFrame(animate);
    renderer.shadowMap.enabled = true;
    renderer.render(scene, camera);
    heartMesh.rotation.y -= 0.005;
    startAnim && beatingAnimation(heartMesh);
    controls.update();
  }
  animate();
}

document.querySelector('.controlsOverlay__orbit').onclick = () => {
  init({ deviceOrientationMode: false });
}
document.querySelector('.controlsOverlay__rotation').onclick = () => {
  init({ deviceOrientationMode: true });
}