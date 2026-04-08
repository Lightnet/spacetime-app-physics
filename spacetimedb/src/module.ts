//-----------------------------------------------
// module design to keep it simple
//-----------------------------------------------
import { ScheduleAt } from 'spacetimedb';
import { schema, table, t, SenderError  } from 'spacetimedb/server';
import { user } from './models/table_user';
import { message } from './models/table_message';
import { 
  player, 
  entity,
  transform3d,
  body3d,
  // physicsObjects,
} from './models/table_entity';
import { PlayerInput } from './models/table_contoller';
import * as THREE from 'three'
//-----------------------------------------------
// TABLE SimulationTick
// typescript circular dependency files
//   - must place in single file with simulation tick reducer function
//   - note that if there change in reducer function the data must be delete
//-----------------------------------------------
export const SimulationTick = table({ 
  name: 'simulation_tick',
  // scheduled: (): any => update_simulation_tick
  scheduled: (): any => update_simulation_tick_collision3d
},{
  scheduled_id: t.u64().primaryKey().autoInc(),
  scheduled_at: t.scheduleAt(),
  last_tick_timestamp:t.timestamp(),
  dt:t.f32(),
});
//-----------------------------------------------
// SPACETIMEDB SCHEMA TABLES
//-----------------------------------------------
const spacetimedb = schema({
  user,
  message,
  player,
  entity,
  transform3d,
  body3d,
  PlayerInput,
  SimulationTick,
  // 
  // physicsObjects,
  // SampleEntity,
  // SampleBox,
  // SampleSphere,
});

function checkAABBOverlap3D(
  selfPos:THREE.Vector3,

){

}


//-----------------------------------------------
// update simulation tick
//-----------------------------------------------
export const update_simulation_tick_collision3d = spacetimedb.reducer({ arg: SimulationTick.rowType }, (ctx, { arg }) => {
  // Invoked automatically by the scheduler
  // arg.message, arg.scheduled_at, arg.scheduled_id
  // console.log('update_simulation_tick');
  // console.log(arg);
  const now = ctx.timestamp;                    // current wall time
  let dt = 0;                       // we'll compute this
  if (arg.last_tick_timestamp) {        // not first tick
    const elapsed_ms = now.since(arg.last_tick_timestamp).millis;
    // console.log("elapsed_ms: ", elapsed_ms);
    dt = elapsed_ms / 1000.0;       // in seconds
  } else {
    dt = 0.033;                     // first tick guess / fallback
  }
  const speed = 5.0; // units per second

  // console.log("PlayerInput coutns: ",ctx.db.PlayerInput.count());
  for (const input_player of ctx.db.PlayerInput.iter()){
    // console.log(input_player);
    // console.log("move?")
    if(!input_player){
      return;
    }
    //do not use ctx.sender here...
    const _player = ctx.db.player.identity.find(input_player.identity);
    // console.log("_player: ",_player)
    if(_player){
      if(_player.entityId){
        // console.log(_player.entityId.toString())
        const transform = ctx.db.transform3d.entityId.find(_player.entityId);
        if(!transform) return;

        // ── Apply input acceleration ───────────────────────────────────────
        if(input_player.directionX == 0){
          transform.velocity.x = 0;
        }else{
          transform.velocity.x += input_player.directionX * speed * dt;
        }
        // TEST up and down
        if(input_player.directionZ == 0){
          transform.velocity.y = 0;
        }else{
          transform.velocity.y += input_player.directionZ * speed * dt;
        }
        // console.log(input_player.directionZ)

        if(input_player.directionY == 0){
          transform.velocity.z = 0;
        }else{
          transform.velocity.z += input_player.directionY * speed * dt;
        }

        // ── Movement prediction + collision 
        let newPos = new THREE.Vector3(
          transform.position.x + transform.velocity.x * dt,
          transform.position.y + transform.velocity.y * dt,
          transform.position.z + transform.velocity.z * dt
        );

        // console.log(newPos.y);
        // console.log(transform.velocity.y);
        // console.log(transform.position.y);

        const body = ctx.db.body3d.entityId.find(_player.entityId);
        // if(!body) return;
        // console.log(body?.params?.tag);

        const selfPos = newPos;       // default if there no shape body
        let selfIsSphere = null;      // sphere params
        let selfIsBox = null;         // box params
        if(body?.params?.tag === 'Box'){
          selfIsBox = body?.params?.value;
        }
        if(body?.params?.tag === 'Sphere'){
          selfIsSphere = body?.params?.value;
        }

        // // nope not best to handle collision
        // for (const entity of ctx.db.entity.iter()){
        //   if(entity.id == _player.entityId){// skip this player current own collision.
        //     continue;
        //   }
        //   const otherBody = ctx.db.body3d.entityId.find(entity.id)
        //   if(otherBody){
        //   }
        // }

        let otherBox;
        let otherSphere;
        let isCollide = false;
        // best to handle collision since table has collision it.
        for (const otherBody of ctx.db.body3d.iter()){
          // need string to check not uuid which fail to skip...
          if(otherBody.entityId.toString() == _player.entityId.toString()) continue;//skip self collision
          // console.log("otherBody.entityId:", otherBody.entityId.toString(), " otherBody.entityId:", otherBody.entityId.toString());
          const otherTransform = ctx.db.transform3d.entityId.find(otherBody.entityId)
          if(otherTransform){
            if(otherBody.params.tag === 'Box'){
              otherBox = otherBody.params.value;
            }
            if(otherBody.params.tag === 'Sphere'){
              otherSphere = otherBody.params.value; // Sphere { radius: 0.5 }
            }
            //check box collision for now.
            if(selfIsBox && otherBox){

              let otherPos = new THREE.Vector3(
                otherTransform.position.x,
                otherTransform.position.y,
                otherTransform.position.z
              )
              let otherSize = new THREE.Vector3(
                otherBox.width,
                otherBox.height,
                otherBox.depth
              )
              const box1 = new THREE.Box3();
              box1.setFromCenterAndSize(newPos,new THREE.Vector3(selfIsBox.width,selfIsBox.height,selfIsBox.depth))
              const box2 = new THREE.Box3();
              box2.setFromCenterAndSize(otherPos, otherSize)
              if(!box1.intersectsBox(box2)){ //not collision
                // console.log("Collision!");
                // isCollide=true
                // break;
                continue;
              }
              isCollide=true
              // console.log("Collision");
              // this handle wall side?
              // Pick the smallest **positive** penetration
              const penX = [
                (newPos.x + selfIsBox.width/2) - (otherTransform.position.x - otherSize.x/2),   // left/negative x
                (otherTransform.position.x + otherSize.x/2) - (newPos.x - selfIsBox.width/2),   // right/positive x
              ];
              const penY = [
                (newPos.y + selfIsBox.height/2)  - (otherTransform.position.y - otherSize.y/2),
                (otherTransform.position.y + otherSize.y/2)  - (newPos.y - selfIsBox.height/2),
              ];
              const penZ = [
                (newPos.z + selfIsBox.depth/2) - (otherTransform.position.z - otherSize.z/2),
                (otherTransform.position.z + otherSize.z/2) - (newPos.z - selfIsBox.depth/2),
              ];
              // Pick the smallest **positive** penetration
              let minPen = Infinity;
              let bestAxis: 'x' | 'y' | 'z' | null = null;
              let bestSign = 0; // which side
              // X
              if (penX[0] > 0 && penX[0] < minPen) { minPen = penX[0]; bestAxis = 'x'; bestSign = -1; }
              if (penX[1] > 0 && penX[1] < minPen) { minPen = penX[1]; bestAxis = 'x'; bestSign = +1; }
              // Y
              if (penY[0] > 0 && penY[0] < minPen) { minPen = penY[0]; bestAxis = 'y'; bestSign = -1; }
              if (penY[1] > 0 && penY[1] < minPen) { minPen = penY[1]; bestAxis = 'y'; bestSign = +1; }
              // Z
              if (penZ[0] > 0 && penZ[0] < minPen) { minPen = penZ[0]; bestAxis = 'z'; bestSign = -1; }
              if (penZ[1] > 0 && penZ[1] < minPen) { minPen = penZ[1]; bestAxis = 'z'; bestSign = +1; }
              if (bestAxis && minPen < Infinity) {
                // ── Correct only one axis (the one with least penetration) ─────
                if (bestAxis === 'x') {
                  newPos.x = transform.position.x;           // full revert, or: -= minPen * bestSign
                  transform.velocity.x *= 0.1;               // strong damping
                } else if (bestAxis === 'y') {
                  newPos.y = transform.position.y;
                  transform.velocity.y *= 0.1;
                  // If you later add gravity: can set velocity.y = 0 when hitting floor (bestSign < 0)
                } else if (bestAxis === 'z') {
                  newPos.z = transform.position.z;
                  transform.velocity.z *= 0.1;
                }
              }
            }
          }
        }

        // console.log(newPos.y)

        // if(!newPos.y){
        //   newPos.y = 0;
        // }

        // update position for table entity
        transform.position.x = newPos.x;
        transform.position.y = newPos.y ?? 0;
        transform.position.z = newPos.z;
        // console.log("z:", transform.velocity.z)
        // console.log("x: ", transform.position.x," z: ", transform.position.z)
        // update entity position
        // if(!isCollide){ // can't do this due that need to slide against the wall.
          ctx.db.transform3d.entityId.update(transform);
        // }
      }
    }
  }
  // ── Save the time for next call ─────────────────────────────────────────
  ctx.db.SimulationTick.scheduled_id.update({
    ...arg,
    last_tick_timestamp: now,
    dt:dt,
    // accumulator: arg.accumulator   // if using fixed style
  });
});
//-----------------------------------------------
// spacetimedb init
//-----------------------------------------------
export const init = spacetimedb.init(ctx => {
  console.log("[ ====::: INIT SPACETIMEDB APP PHYSICS:::==== ]");
  ctx.db.SimulationTick.insert({
    scheduled_id: 0n,
    // scheduled_at: ScheduleAt.interval(5_000_000n),// Schedule to run every 5 seconds (5,000,000 microseconds)
    scheduled_at: ScheduleAt.interval(33_333n),// Schedule to run every 30 tick
    last_tick_timestamp: ctx.timestamp,
    dt:0.0,
  });
});
//-----------------------------------------------
// spacetimedb onConnect
//-----------------------------------------------
export const onConnect = spacetimedb.clientConnected(ctx => {
  const user = ctx.db.user.identity.find(ctx.sender);
  console.log("SENDER: ",ctx.sender);
  if (user) {
    ctx.db.user.identity.update({ ...user, online: true });
  } else {
    ctx.db.user.insert({
      identity: ctx.sender,
      name: undefined,
      online: true,
    });
  }
});
//-----------------------------------------------
// spacetimedb onDisconnect
//-----------------------------------------------
export const onDisconnect = spacetimedb.clientDisconnected(ctx => {
  const user = ctx.db.user.identity.find(ctx.sender);
  if (user) {
    ctx.db.user.identity.update({ ...user, online: false });
  } else {
    console.warn(
      `Disconnect event for unknown user with identity ${ctx.sender}`
    );
  }
});
//-----------------------------------------------
// EXPORT SPACETIMEDB
//-----------------------------------------------
export default spacetimedb;
// console.log("end set up: spacetime-app-physics");
