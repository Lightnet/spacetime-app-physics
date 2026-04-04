import * as THREE from 'three';


// ───────────────────────────────────────────────
// Scene setup (2D orthographic style)
// ───────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);

const aspect = window.innerWidth / window.innerHeight;
const viewSize = 10;
const camera = new THREE.OrthographicCamera(
  -viewSize * aspect,
    viewSize * aspect,
  -viewSize,
    viewSize,
  0.1, 100
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
// ───────────────────────────────────────────────
// Resize handling
// ───────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);

  const newAspect = w / h;
  camera.left   = -viewSize * newAspect;
  camera.right  =  viewSize * newAspect;
  camera.top    =  viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
});
//-----------------------------------------------
// 
//-----------------------------------------------
const geometry = new THREE.PlaneGeometry(1, 1);

const player_position = new THREE.Vector3(-2,0,0)
const shape_position = new THREE.Vector3(2,0,0)


// Player (red)
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
const player = new THREE.Mesh(geometry, playerMaterial);
// player.position.set(-2, 0, 0);
player.position.copy(player_position)
scene.add(player);


const material1 = new THREE.MeshBasicMaterial({ color: 0x27F535 });
const shape2 = new THREE.Mesh(geometry, material1);
// shape2.position.set(3, 0, 0);
shape2.position.copy(shape_position)
scene.add(shape2);



const box1 = new THREE.Box3();
box1.setFromCenterAndSize(player_position,new THREE.Vector3(1,1,1))

const sphere1 = new THREE.Sphere(player_position, 0.5);
const sphere2 = new THREE.Sphere(shape_position, 0.5);

const box2 = new THREE.Box3();
box2.setFromCenterAndSize(shape_position,new THREE.Vector3(1,1,1))


// ───────────────────────────────────────────────
// Controls (arrow keys)
// ───────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup',   e => keys[e.key] = false);


function updateMovement() {
  const speed = 0.08;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) player_position.y += speed;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) player_position.y -= speed;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) player_position.x -= speed;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) player_position.x += speed;

  player.position.copy(player_position);

}

function update_collision(){
  // if (sphere1.intersectsSphere(sphere2)) {
  //     console.log("Boom! Collision.");
  // }else{
  //   console.log("No collision")
  // }

  // box1.setFromCenterAndSize(player_position,new THREE.Vector3(1,1,1))
  // if(box1.intersectsBox(box2)){
  //   console.log("Boom! Collision.");
  // }

}

// ───────────────────────────────────────────────
// 
// ───────────────────────────────────────────────

function collision1(){
  const sphere1 = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0.5);
  // const sphere2 = new THREE.Sphere(new THREE.Vector3(1.5, 0, 0), 1);
  const sphere2 = new THREE.Sphere(new THREE.Vector3(1+1.1, 0, 0), 0.5);

  // Built-in method returns true if they overlap
  if (sphere1.intersectsSphere(sphere2)) {
      console.log("Boom! Collision.");
  }else{
    console.log("No collision")
  }
}

function collision2(){
  const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 5);
  const point = new THREE.Vector3(2, 2, 2);

  if (sphere.containsPoint(point)) {
      console.log("The point is inside!");
  }
}

function collision3(){
  const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
  const box = new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));

  // Note: The method belongs to the Box3 class
  if (box.intersectsSphere(sphere)) {
      console.log("The sphere is hitting the box.");
  }
}

collision1();
// collision2();
// collision3();

// Test TypeMethod Note


function animate() {

  updateMovement();
  update_collision();
  // checkCollision();   // ← collision happens here

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

animate();

window.dispatchEvent(new Event('resize'));