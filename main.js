import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

function createScene () {  
    const  scene = new THREE.Scene()  
    const  camera = new THREE.PerspectiveCamera(60,  window.innerWidth / window.innerHeight, 1, 100)  
    camera.position.z = 30       
   
    const  renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)  
    document.body.appendChild(renderer.domElement)  
        
    const color = 0xFFFFFF;  const intensity = 0.75;
    const light = new THREE.PointLight(color, intensity)
    light.position.set(-15, -10, 30)   
    scene.add(light)     
    return {   
      scene,
      camera,
      renderer
    }
  }