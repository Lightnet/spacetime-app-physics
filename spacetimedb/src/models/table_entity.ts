//-----------------------------------------------
// 
//-----------------------------------------------
// import { ScheduleAt } from 'spacetimedb';
import { schema, table, t, SenderError  } from 'spacetimedb/server';
import { Coordinates3D } from '../types';
// export const Entity = table(
//   { name: 'entity', public: true },
//   {
//     identity: t.identity().primaryKey(),
//     position:Coordinates3D,
//     velocity:Coordinates3D,
//     size:Coordinates3D,
//     direction: Coordinates3D,
//   }
// );
//
// export const Obstacle3D = table({
//   name: 'obstacle3d', public: true
// },{
//   id: t.u64().primaryKey().autoInc(),
//   position: Coordinates3D,
//   size:Coordinates3D
// });


//-----------------------------------------------
// select entity
//-----------------------------------------------
export const player = table(
  { name: 'player', public: true },
  {
    identity: t.identity().primaryKey(),
    entityId: t.string().optional(),
  }
);
//-----------------------------------------------
// Entity
// start with entity with id
// use for place holder incase of adding script since it has no position.
//-----------------------------------------------
export const entity = table(
  { name: 'entity', public: true },
  {
    id: t.string().primaryKey(),
    // position:Coordinates3D,
    // velocity:Coordinates3D,
    // size:Coordinates3D,
    // direction: Coordinates3D,
    created_at:t.timestamp(),
  }
);
//-----------------------------------------------
// Entity
//-----------------------------------------------
export const transform3d = table(
  { name: 'transform3d', public: true },
  {
    entityId: t.string().primaryKey(),
    position:Coordinates3D,
    velocity:Coordinates3D,
    scale:Coordinates3D,
    rotation:Coordinates3D,
    // quaternion: Coordinates3D,
  }
);
//-----------------------------------------------
// box
//-----------------------------------------------
// export const box = table({
//   name: 'box', public: true
// },{
//   id: t.u64().primaryKey().autoInc(),
//   type:t.string().default('BOX'),
//   entityId:t.string().unique(), // should have one for position entity
//   // position: Coordinates3D,
//   size:Coordinates3D
// });
//-----------------------------------------------
// sphere
//-----------------------------------------------
// export const sphere = table({
//   name: 'sphere', public: true
// },{
//   id: t.u64().primaryKey().autoInc(),
//   type:t.string().default('SPHERE'),
//   entityId:t.string().unique(),
//   radius:t.f32(),
// });

// Box parameters: width, height, depth
export const BoxParams = t.object('BoxParams', {
  width: t.f32(),
  height: t.f32(),
  depth: t.f32()
});

// Sphere parameters: just radius
export const SphereParams = t.object('SphereParams', {
  radius: t.f32()
});

export const Shape = t.enum('Shape', {
  Box: BoxParams,
  Sphere: SphereParams
});

export const body3d = table(
  { name: 'body3d', public: true },
  {
    entityId: t.string().primaryKey(),
    name: t.string(),
    params: Shape // This column now accepts BoxParams OR SphereParams
  }
);

export const physicsObjects = table(
  { name: 'physics_objects', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    name: t.string(),
    params: Shape // This column now accepts BoxParams OR SphereParams
  }
);

