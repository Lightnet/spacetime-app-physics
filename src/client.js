// main entry point browser

import van from "https://cdn.jsdelivr.net/gh/vanjs-org/van/public/van-1.6.0.min.js"
import { DbConnection, tables } from './module_bindings';
// import { Identity } from 'spacetimedb';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ViewportGizmo } from "three-viewport-gizmo";
import { Pane } from "tweakpane";
import { transform } from "typescript";

// import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
// import { Value } from 'three/examples/jsm/inspector/ui/Values.js';

// spacetime sql --server local spacetimedb-app-physics "SELECT * FROM message"

const HOST = 'ws://localhost:3000';
const DB_NAME = 'spacetime-app-physics';

const {div, button, label, input, li, ul} = van.tags;

// need to add box, point and sphere data as array to match the update.

let update_select_entities;

const PARAMS = {
  key:"WASD = MOVEMENT",
  key1:"R = Rest Position",
  key2:"X = Test Foo",
  key3:"ShiftLeft = Down",
  key4:"Space = Up",
  entityId:'',
  player_entityId:'',
  player_row:null,
  isPlayer:false,
  block_position:{x:0,y:0,z:0},
  position:{x:0,y:0,z:0},

  e_position:{x:0,y:0,z:0},
  entities:[],
  bodies:[],
  transform3d:[],
  boxes:[],
  spheres:[],
  points:[], // in case of no shape
}

setupPane();

const wall_positions = div({style:`background-color:gray;`});
const size = 10;
const divisions = 10;
const chat_messages = div();
const chat_box = div();
const entity_position = div({style:`background-color:gray;`});
const el_status = van.state('None');
const username = van.state('Guest');
//-----------------------------------------------
// THREE JS
//-----------------------------------------------
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x87CEEB); // Sky blue color
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 5;
camera.position.y = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setSize( window.innerWidth, window.innerHeight );
const controls = new OrbitControls( camera, renderer.domElement );
const gizmo = new ViewportGizmo(camera, renderer,{
  placement: "bottom-right",
});
gizmo.attachControls(controls);

//-----------------------------------------------
// 
//-----------------------------------------------
function create_wireframe_cube(color){
  const geometry = new THREE.BoxGeometry( 1, 1, 1 );
  const edges = new THREE.EdgesGeometry(geometry, 15);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color }));
  line.castShadow = true; // Object can receive shadows
  return line;
}
const ph_cube = create_wireframe_cube(0x00bfff)
const axesHelper = new THREE.AxesHelper(2);
axesHelper.add(ph_cube);
scene.add(axesHelper);

function apply_user(ctx){
  // console.log("apply");
  // console.log(`Ready with ${ctx.db.user.count()} users`);
  // console.log(ctx);
}

function apply_messages(ctx){
  // console.log("apply");
  // console.log(`Ready with ${ctx.db.message.count()} messages`);
  // console.log(ctx);
}

function check_position(row){
  // console.log(row);
  const elEntity = document.getElementById(row.entityId.toString())
  //entity_position
  
  if(elEntity){
    elEntity.remove();
    // van.add(entity_position,div({id:row.identity.toHexString()},
    van.add(entity_position,div({id:row.entityId.toString()},
      label('[entity:' + row.entityId.toString().substring(0,16) + " ]"),
      label(" x: ",row.position.x.toFixed(4)),
      label(" y: ",row.position.y.toFixed(4)),
      label(" z: ",row.position.z.toFixed(4))
    ))
  }else{
    van.add(entity_position,div({id:row.entityId.toString()},
      label('[ entity:' + row.entityId.toString().substring(0,16) + " ]"),
      label(" x: ",row.position.x.toFixed(4)),
      label(" y: ",row.position.y.toFixed(4)),
      label(" z: ",row.position.z.toFixed(4))
    ))
  }
}

// https://spacetimedb.com/docs/clients/api/
// 
// spacetime sql --server local spacetime-app-map "SELECT * FROM user"
// var current_id = null;
const conn = DbConnection.builder()
  .withUri(HOST)
  .withDatabaseName(DB_NAME)
  .withToken(localStorage.getItem('auth_token') || undefined)
  .onConnect((conn, identity, token) => {
    // localStorage.setItem('auth_token', token);
    // console.log('Connected with identity:', identity.toHexString());
    el_status.val = 'Connected';
    setupDBListen();
  })
  .onDisconnect(() => {
    console.log('Disconnected from SpacetimeDB');
    el_status.val = 'Disconnected';
  })
  .onConnectError((_ctx, error) => {
    console.error('Connection error:', error);
    // statusEl.textContent = 'Error: ' + error.message;
    // statusEl.style.color = 'red';
  })
  .build();

// console.log("conn.reducers");
// console.log(conn.reducers);

function setupDBListen(){

  // setupDBUser();
  // setupDBMessages()
  setupDBPlayer();
  setupDBBody3D();
  setupDBEntities();
  setupDBTransform3D();
}
//-----------------------------------------------
// SET UP USER
//-----------------------------------------------
function setupDBUser(){
  conn
    .subscriptionBuilder()
    .onApplied((ctx) => apply_user(ctx))
    .onError((ctx, error) => {
      console.error(`Subscription failed: ${error}`);
    })
    .subscribe(tables.users);

    conn.db.users.onInsert((ctx, row)=>{
      // console.log('insert user row');
      // console.log(row);
      // check if current user client to update their name display
      if(row.identity.toHexString() == conn.identity.toHexString()){
        // console.log("found current ID:", conn.identity.toHexString());
        username.val = row.name;
      }
    });

    // any change on user.
    conn.db.users.onUpdate((ctx, oldRow, newRow)=>{
      console.log("update???");
      console.log("oldRow:", oldRow);
      console.log("newRow:", newRow);
    })
}
//-----------------------------------------------
// SET UP MESSAGES
//-----------------------------------------------
function setupDBMessages(){
      // conn
    //   .subscriptionBuilder()
    //     .onApplied((ctx) => apply_messages(ctx))
    //     .onError((ctx, error) => {
    //       console.error(`Subscription failed: ${error}`);
    //     })
    //     .subscribe(tables.message);
  //add message on first and if there old message will be added here.
  // conn.db.message.onInsert((ctx, row)=>{
  //   // console.log('insert message row');
  //   // console.log(`Message:`, row.text);
  //   // console.log(row)
  //   van.add(chat_messages,div(
  //     label(row.sender.toHexString().substring(0, 8)),
  //     label(' Msg:'),
  //     label(row.text),
  //   ))
  // });
}
//-----------------------------------------------
// SET UP PLAYER
//-----------------------------------------------
function setupDBPlayer(){
  conn
    .subscriptionBuilder()
    .subscribe(tables.my_player);

  conn.db.my_player.onInsert((ctx, row)=>{
    // console.log('insert Entity row');
    // console.log(row.position);
    // console.log(row);
    check_position(row);
    update_model_player(row);
    PARAMS.player_entityId = row.entityId;
    PARAMS.player_row = row;
  });
}
//-----------------------------------------------
// ON INSERT MODEL 3D
//-----------------------------------------------
function oninsert_model_box(row){
  let isFound = false;
  // console.log("check====================:", isFound);
  // scene.traverse()
  for (const obj_model of scene.children) {
    // no recursion
    // console.log(obj_model.userData)
    if (obj_model.userData?.row){
      if (obj_model.userData.row.entityId == row.entityId){
        isFound = true;
        obj_model.userData.row = row;
        obj_model.position.x = row.position.x;
        obj_model.position.z = row.position.z;
        break;
      }
    }
  }
  // console.log("isFound:", isFound);
  if(isFound){
  }else{
    // console.log('create cube');
    create_cube(row);
  }
}
//-----------------------------------------------
// ON DELETE MODEL 3D
//-----------------------------------------------
function onUpdate_Model3D(row){
  // console.log("check====================:", isFound);
  // scene.traverse()
  for (const obj_model of scene.children) {
    // no recursion
    // console.log(obj_model.userData)
    if (obj_model.userData?.row){
      if (obj_model.userData.row.entityId == row.entityId){
        isFound = true;
        obj_model.userData.row = row;
        obj_model.position.x = row.position.x;
        obj_model.position.z = row.position.z;
        break;
      }
    }
  }
}
//-----------------------------------------------
// ON DELETE MODEL 3D
//-----------------------------------------------
function onDelete_Model3D(row){
  for (const obj_model of scene.children) {
    // no recursion
    // console.log(obj_model.userData)
    if (obj_model.userData?.row){
      if (obj_model.userData.row.entityId == row.entityId){
        scene.remove(obj_model);
        break;
      }
    }
  }
}
//-----------------------------------------------
// TRANSFORM 3D
//-----------------------------------------------
function onInsert_Transform3D(row){
  create_cube(row);
}

function onUpdate_model_Transform3D(row){
  // console.log("check====================:", isFound);
  // scene.traverse()
  for (const obj_model of scene.children) {
    // no recursion
    // console.log(obj_model.userData)
    if (obj_model.userData?.row){
      if (obj_model.userData.row.entityId == row.entityId){
        obj_model.userData.row = row;
        obj_model.position.x = row.position.x;
        obj_model.position.z = row.position.z;
        break;
      }
    }
  }
}

function onDelete_model_Transform3D(row){
  for (const obj_model of scene.children) {
    // no recursion
    // console.log(obj_model.userData)
    if (obj_model.userData?.row){
      if (obj_model.userData.row.entityId == row.entityId){
        scene.remove(obj_model);
        break;
      }
    }
  }
}

// this filter player entity out.
function setupDBTransform3D(){
  conn
    .subscriptionBuilder()
    .subscribe(tables.scene_transform3d);

  conn.db.scene_transform3d.onInsert((ctx, row)=>{
    console.log('insert Entity Box row');
    console.log(row);
    onInsert_Transform3D(row);
    oninsert_model_box(row);
    PARAMS.transform3d.push(row);
  });

  conn.db.scene_transform3d.onUpdate((ctx, oldRow, newRow)=>{
    console.log('update...')
    onUpdate_model_Transform3D(newRow);
    PARAMS.transform3d=PARAMS.transform3d.filter(r=>r.entityId!=newRow.entityId);
    PARAMS.transform3d.push(newRow);
  });

  conn.db.scene_transform3d.onDelete((ctx, row)=>{
    onDelete_model_Transform3D(row);
    PARAMS.transform3d=PARAMS.transform3d.filter(r=>r.entityId!=row.entityId);
  });
}
//-----------------------------------------------
// ENTITIES
//-----------------------------------------------
function setupDBEntities(){
  conn
    .subscriptionBuilder()
    .subscribe(tables.entity);

  conn.db.entity.onInsert((ctx, row)=>{
    console.log('insert Entity row');
    // console.log(row);
    PARAMS.entities.push(row);
    // console.log(update_select_entities)
    if(typeof update_select_entities === 'function')update_select_entities();
  });

  conn.db.entity.onUpdate((ctx, oldRow, newRow)=>{
    // console.log("update Entity");
    // console.log("oldRow:", oldRow, "newRow:", newRow);
    PARAMS.entities=PARAMS.entities.filter(r=>r.id!=newRow.id);
    PARAMS.entities.push(newRow);
  });

  conn.db.entity.onDelete((ctx, row)=>{
    PARAMS.entities=PARAMS.entities.filter(r=>r.id!=row.id);
    if(typeof update_select_entities === 'function')update_select_entities();
  });
}
//-----------------------------------------------
// BODY 3D
//-----------------------------------------------
function setupDBBody3D(){
  conn
    .subscriptionBuilder()
    .subscribe(tables.body3d);

  conn.db.body3d.onInsert((ctx, row)=>{
    console.log('insert Entity row');
    // console.log(row);
    PARAMS.bodies.push(row);
  });

  conn.db.body3d.onUpdate((ctx, oldRow, newRow)=>{
    // console.log("update Entity");
    // console.log("oldRow:", oldRow, "newRow:", newRow);
    PARAMS.bodies=PARAMS.bodies.filter(r=>r.id!=newRow.id);
    PARAMS.bodies.push(newRow);
  });

  conn.db.body3d.onDelete((ctx, row)=>{
    PARAMS.bodies=PARAMS.bodies.filter(r=>r.id!=row.id);
  });
}

//-----------------------------------------------
// APP
//-----------------------------------------------
function App(){
  const isEdit = van.state(false);
  const message = van.state('');
  const text_content = van.state('');
  // const isDone = van.state(false);
  const isDone = van.state(true);

    // function test(){
    //     console.log("test");
    //     console.log(conn.reducers);
    //     // conn.reducers.sayHello();
    // }

    const render_name = van.derive(()=>{
      if(isEdit.val){
        return input({value:username,oninput:e=>username.val=e.target.value})
      }else{
        return label(username.val)
      }
    });

    // update name
    function update_name(){
      console.log("update name");
      conn.reducers.setName({name:username.val})
      isEdit.val = false;
    }

    const name_mode =  van.derive(()=>{
      if(isEdit.val){
        return button({onclick:update_name},'Update')
      }else{
        return button({onclick:()=>isEdit.val=!isEdit.val},'Edit')
      }
    });

    function click_sent(){
      console.log("message: ", message.val);
      conn.reducers.sendMessage({
          text:message.val
        });
    }

    function typing_message(e){
      if (e.key === "Enter") {
        console.log("Input Value:", e.target.value)
        // Add your logic here
        conn.reducers.sendMessage({
          text:e.target.value
        });
      }
    }

    function setup(){
      van.add(chat_box, input({value:message,oninput:e=>message.val=e.target.value,onkeydown:e=>typing_message(e)}))
      van.add(chat_box, button({onclick:click_sent},'Send'))
    }

    setup();

    return div({style:`position: fixed; top: 0; left: 0;background-color:gray;`},
        div(
          label("Status: "),
          el_status
        ),
        // div(
        //   name_mode,
        //   label('Name: '),
        //   render_name,
        // ),
        // chat_box,
        // chat_messages,
        entity_position,
        wall_positions
    )
}

van.add(document.body, App());
// ======================
// KEYBOARD CONTROLS (Normalized Diagonal Movement)
// ======================
const MOVEMENT_SPEED = 1.0;
// Track which keys are currently pressed
const pressedKeys = new Set();
// Current input state
let currentInput = {
  x: 0.0,
  y: 0.0,
  z: 0.0,
  jump: false
};
// Normalize vector so diagonal movement isn't faster
function normalizeMovement(x, y) {
  const length = Math.sqrt(x * x + y * y);
  if (length === 0) return { x: 0, y: 0 };
  return {
    x: (x / length) * MOVEMENT_SPEED,
    y: (y / length) * MOVEMENT_SPEED
  };
}
// Send input to your game/connection
function updateInput() {
  try {
    conn.reducers.updateInput(currentInput);
  } catch (error) {
    console.error("Failed to update input:", error);
  }
}
// ====================
// KEY DOWN
// ====================
function handleKeyDown(event) {
  const key = event.code;
  // Add to pressed keys
  pressedKeys.add(key);
  // Handle movement keys
  if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'ShiftLeft'].includes(key)) {
    updateMovementDirection();
  }
  // Special actions
  if (key === 'KeyR') {
    console.log('Reset player position');
    conn.reducers.setPlayerPosition({ x: 0, y: 0, z: 0 });
  }
  if (key === 'KeyX') {
    console.log('Testing testFoo...');
    console.log('Reducers available:', Object.keys(conn.reducers || {}));
    try {
      conn.reducers.testFoo({});
    } catch (err) {
      console.error("testFoo failed:", err);
    }
  }
}
// ====================
// KEY UP
// ====================
function handleKeyUp(event) {
  const key = event.code;
  pressedKeys.delete(key);
  // Only recalculate if it was a movement key
  if (['KeyW', 'KeyS', 'KeyA', 'KeyD','Space', 'ShiftLeft'].includes(key)) {
    updateMovementDirection();
  }
}
// ====================
// CALCULATE MOVEMENT
// ====================
function updateMovementDirection() {
  let moveX = 0;
  let moveY = 0;
  let moveZ = 0;
  if (pressedKeys.has('KeyW')) moveY -= 1;
  if (pressedKeys.has('KeyS')) moveY += 1;
  if (pressedKeys.has('KeyA')) moveX -= 1;
  if (pressedKeys.has('KeyD')) moveX += 1;
  if (pressedKeys.has('Space')){
    moveZ = 1
  }else if (pressedKeys.has('ShiftLeft')){
    moveZ = -1
  }else{
    moveZ = 0.0
  };
  // console.log("moveZ:", moveZ);
  // Normalize for consistent speed (including diagonals)
  const normalized = normalizeMovement(moveX, moveY);
  currentInput.x = normalized.x;
  currentInput.y = normalized.y;
  currentInput.z = moveZ; // test
  // currentInput.jump remains false unless you add jump logic
  updateInput();
}
// ====================
// INIT
// ====================
function initKeyboardControls() {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  console.log("✅ Keyboard controls initialized (normalized diagonal movement)");
}
// Call this once when your app starts
initKeyboardControls();
//-----------------------------------------------
// 
//-----------------------------------------------
function addLights(){
  // Add a HemisphereLight for subtle ambient lighting
  const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
  scene.add(ambientLight);
  // Set up the DirectionalLight
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
  // Set up the shadow
  directionalLight.castShadow = true;
  // Optional: Adjust shadow camera for better control and performance (e.g., tighten frustum)
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
}
addLights();
function addGridHelper(){
  const gridHelper = new THREE.GridHelper( size, divisions );
  scene.add( gridHelper );
}
addGridHelper()
function createPlaneFloor(){
  const planeGeometry = new THREE.PlaneGeometry(10, 10);
  const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2; // Rotate plane to be horizontal
  plane.position.y = -1;
  // Plane (receives shadows)
  plane.receiveShadow = true; // Object can receive shadows
  scene.add(plane);
}

// scene.traverse((obj) => {
//   if (obj.userData.disposeMe) {
//     toRemove.push(obj);
//   }
// });

// // or even shorter with for...of (but only direct children)
// for (const obj of scene.children) {
//   // no recursion
// }
//-----------------------------------------------
// 
//-----------------------------------------------
function create_cube(row, color= 0x78160a){
  const geometry = new THREE.BoxGeometry( 1, 1, 1 );
  const edges = new THREE.EdgesGeometry(geometry, 15);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color }));
  line.castShadow = true; // Object can receive shadows
  line.userData.row = row;
  line.position.set(
    row.position.x,
    row.position.y,
    row.position.z
  )
  scene.add( line );
}

function update_model_player(row){
  let isFound = false;
  // console.log("check====================:", isFound);
  // scene.traverse()
  for (const obj_model of scene.children) {
    // no recursion
    // console.log(obj_model.userData)
    if (obj_model.userData?.row){
      if (obj_model.userData.row.id == row.id){
        isFound = true;
        obj_model.userData.row = row;
        obj_model.position.x = row.position.x;
        obj_model.position.z = row.position.z;
        obj_model.position.y = row.position.y;
        break;
      }
    }
  }
  // console.log("isFound:", isFound);
  if(isFound){
  }else{
    // console.log('create cube');
    create_cube(row,0x0f7a2b);
  }
}

function animate( time ) {
  if(controls){
    controls.update();
  }
  renderer.render( scene, camera );
  gizmo.render();
  // cube.rotation.x = time / 2000;
  // cube.rotation.y = time / 1000;
}

function onWindowResize(event){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  gizmo.update();
}

window.addEventListener('resize',onWindowResize);
document.body.appendChild( renderer.domElement );
renderer.setAnimationLoop( animate );

function setupPane(){
  let deleteEntity3DBinding;

  let ePosition3DBinding;

  let addTranform3DBinding;
  let removeTranform3DBinding;
  let addBox3DBinding;
  let addSphere3DBinding;
  let removeBody3DBinding;


  const pane = new Pane();
  const keysPane = pane.addFolder({
    title: 'Keys',
  });
  keysPane.addBinding(PARAMS, 'key',{disabled:true})
  keysPane.addBinding(PARAMS, 'key1',{disabled:true})
  keysPane.addBinding(PARAMS, 'key2',{disabled:true})
  keysPane.addBinding(PARAMS, 'key3',{disabled:true})
  keysPane.addBinding(PARAMS, 'key4',{disabled:true})

  const blockPane = pane.addFolder({
    title: 'Block',
  });

  blockPane.addBinding(PARAMS, 'block_position',{
    label:'Position'
  }).on('change', (ev) => {
    // console.log(PARAMS.block_position);
    axesHelper.position.set(
      PARAMS.block_position.x,
      PARAMS.block_position.y,
      PARAMS.block_position.z
    );
  });

  blockPane.addButton({title:'Spawn Block'}).on('click',()=>{
    console.log("Spawn Block");
    console.log("spawn x:", PARAMS.block_position.x, " y: ", PARAMS.block_position.y ," z:", PARAMS.block_position.z);
    conn.reducers.createEntityBoxTest({
      x:PARAMS.block_position.x,
      y:PARAMS.block_position.y,
      z:PARAMS.block_position.z,
    })
  })

  const playerPane = pane.addFolder({
    title: 'Player',
  });

  playerPane.addBinding(PARAMS, 'position',{
    label:'Position'
  }).on('change', (ev) => {
    // console.log(PARAMS.block_position);
    axesHelper.position.set(
      PARAMS.block_position.x,
      PARAMS.block_position.y,
      PARAMS.block_position.z
    );
  });

  playerPane.addButton({title:'Create Player'}).on('click',()=>{
    conn.reducers.createPlayer({x:0,y:0,z:0});
  })
  playerPane.addButton({title:'Delete Player'}).on('click',()=>{
    conn.reducers.deletePlayer({});
  })

  playerPane.addButton({title:'Set Player Position'}).on('click',()=>{
    conn.reducers.setPlayerPosition({x:0,y:0,z:0});
  })

  const entitiesPane = pane.addFolder({
    title: 'Entities',
  });
//-----------------------------------------------
// update list
//-----------------------------------------------
  entitiesPane.addButton({title:'Refresh'}).on('click',()=>{
    update_select_entities();
  })
  let selectEntities = entitiesPane.addBlade({
    view: 'list',
    label: 'Entity ID:',
    options: [
      // {text: 'loading', value: 'LDG'},
      // {text: 'menu', value: 'MNU'},
      // {text: 'field', value: 'FLD'},
    ],
    value: '',
  });

  update_select_entities = function(){
    // console.log("test");
    if(!selectEntities) return;
    if(selectEntities) selectEntities.dispose();

    let entityOptions = []
    for(const entity of PARAMS.entities){
      entityOptions.push({
        text:entity.id, value: entity.id
      })
    }

    selectEntities = entitiesPane.addBlade({
      view: 'list',
      label: 'Entity ID:',
      options: entityOptions,
      value: '',
    }).on('change',(e)=>{
      // console.log(e.value);
      selectEntity(e.value)
    })
  }

  function selectEntity(id){
    const entity = PARAMS.entities.find(r=>r.id==id)
    if(entity){
      console.log("Found Entity ID: ", id);
      PARAMS.entityId = id;
      if(PARAMS.player_entityId ==  id){
        PARAMS.isPlayer = true;
      }else{
        PARAMS.isPlayer = false;
      }

      deleteEntity3DBinding.disabled = false;
      addTranform3DBinding.disabled = true;
      removeTranform3DBinding.disabled = true;
      addBox3DBinding.disabled = true;
      addSphere3DBinding.disabled = true;
      removeBody3DBinding.disabled = true;
      
      const _transform3d = PARAMS.transform3d.find(r=>r.entityId==id);
      console.log("_transform3d:", _transform3d)

      console.log("PARAMS.player_row: ",PARAMS.player_row)
      if(PARAMS.isPlayer){
        //PARAMS.player_row
        
        PARAMS.e_position.x = PARAMS.player_row.position.x;
        PARAMS.e_position.y = PARAMS.player_row.position.y;
        PARAMS.e_position.z = PARAMS.player_row.position.z;
        ePosition3DBinding.refresh()
      }

      if(_transform3d){
        addTranform3DBinding.disabled = true;
        removeTranform3DBinding.disabled = false;
        console.log(_transform3d.position);
        PARAMS.e_position.x = _transform3d.position.x;
        PARAMS.e_position.y = _transform3d.position.y;
        PARAMS.e_position.z = _transform3d.position.z;
        // setTimeout(()=>{
          ePosition3DBinding.refresh()
        // },500)
        

      }else{
        // PARAMS.e_position.x = 0;
        // PARAMS.e_position.y = 0;
        // PARAMS.e_position.z = 0;
        // setTimeout(()=>{
        //   ePosition3DBinding.refresh()
        // },500)
        addTranform3DBinding.disabled = false;
        removeTranform3DBinding.disabled = true;
      }

      const _body3d = PARAMS.bodies.find(r=>r.entityId==id);
      if(_body3d){
        console.log(_body3d.params);
        if(_body3d.params.tag == 'Box'){
          addBox3DBinding.disabled = true;
        }else{
          addBox3DBinding.disabled = false;
        }

        if(_body3d.params.tag == 'Sphere'){
          addSphere3DBinding.disabled = true;
        }else{
          addSphere3DBinding.disabled = false;
        }
        removeBody3DBinding.disabled = false
      }else{
        addBox3DBinding.disabled = false;
        addSphere3DBinding.disabled = false;
        removeBody3DBinding.disabled = true
      }



    }else{
      console.log("Not Found Entity ID: ", id);
    }
  }


  const entityPane = pane.addFolder({
    title: 'Entity',
  });

  entityPane.addBinding(PARAMS, 'entityId',{
    readonly:true
  })

  entityPane.addBinding(PARAMS, 'isPlayer',{
    readonly:true
  })

  entityPane.addButton({title:'Create Entity'}).on('click',()=>{
    conn.reducers.createEntity({});
  })

  deleteEntity3DBinding = entityPane.addButton({title:'Delete Entity'}).on('click',()=>{
    conn.reducers.deleteEntity({
      id:PARAMS.entityId
    });
  })

  const transform3DPane = entityPane.addFolder({
    title: 'Tranform 3D',
  });

  ePosition3DBinding = transform3DPane.addBinding(PARAMS, 'e_position').on('change',()=>{
    conn.reducers.setTransform3DPosition({
      id:PARAMS.entityId,
      x:PARAMS.e_position.x,
      y:PARAMS.e_position.y,
      z:PARAMS.e_position.z,
    })
  });

  addTranform3DBinding = transform3DPane.addButton({title:'Add Transform3D'}).on('click',()=>{
    console.log("PARAMS.entityId:", PARAMS.entityId);
    conn.reducers.createEntityTransform3D({
      id:PARAMS.entityId,
      x:PARAMS.e_position.x,
      y:PARAMS.e_position.y,
      z:PARAMS.e_position.z,
    });
  })
  removeTranform3DBinding = transform3DPane.addButton({title:'Remove Transform3D'}).on('click',()=>{
    conn.reducers.removeTransform3D({
      id:PARAMS.entityId
    });
  })

  const bodyPane = entityPane.addFolder({
    title: 'Body',
  });

  addBox3DBinding = bodyPane.addButton({title:'Add Body Box'}).on('click',()=>{
    conn.reducers.createEntityBox({
      id:PARAMS.entityId,
      x:1,
      y:1,
      z:1
    })
  })
  addSphere3DBinding = bodyPane.addButton({title:'Add Body Sphere'}).on('click',()=>{
    conn.reducers.createEntitySphere({
      id:PARAMS.entityId,
      radius:0.5
    })
  })
  removeBody3DBinding = bodyPane.addButton({title:'Remove Body'}).on('click',()=>{
    conn.reducers.removeEntityBody3D({
      id:PARAMS.entityId
    })
  })

  
  const testPane = pane.addFolder({
    title: 'Test',
  });
  testPane.addButton({title:'create box Test'}).on('click',()=>{
    conn.reducers.createEntityBoxTest({
      x:PARAMS.block_position.x,
      y:PARAMS.block_position.y,
      z:PARAMS.block_position.z,
    })
  })
  testPane.addButton({title:'test collision'}).on('click',()=>{
    conn.reducers.testCollision({})
  })
  // testPane.addButton({title:'test physics shape box'}).on('click',()=>{
  //   conn.reducers.addPhysicsObject({
  //     name:"box",
  //     params:{
  //       tag: "Box",
  //       value: {
  //         width: 1,
  //         height: 1,
  //         depth: 1,
  //       },
  //     }
  //   })
  // })
  testPane.addButton({title:'test physics shape shere'}).on('click',()=>{
    conn.reducers.addPhysicsObject({
      name:"box",
      params:{
        tag: "Sphere",
        value: {
          radius: 0.5,
        },
      }
    })
  })


  deleteEntity3DBinding.disabled = true;
  addTranform3DBinding.disabled = true;
  removeTranform3DBinding.disabled = true;
  addBox3DBinding.disabled = true;
  addSphere3DBinding.disabled = true;
  removeBody3DBinding.disabled = true;
}
// end