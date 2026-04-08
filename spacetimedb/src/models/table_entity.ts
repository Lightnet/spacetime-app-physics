//-----------------------------------------------
// TABLE ENTITY
//-----------------------------------------------
// import { ScheduleAt } from 'spacetimedb';
import { schema, table, t, SenderError  } from 'spacetimedb/server';
import { Coordinates3D } from '../types';
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
// Transform 3D
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
// Box parameters
//-----------------------------------------------
// Box parameters: width, height, depth
export const BoxParams = t.object('BoxParams', {
  width: t.f32(),
  height: t.f32(),
  depth: t.f32()
});
//-----------------------------------------------
// Sphere parameters: just radius
//-----------------------------------------------
export const SphereParams = t.object('SphereParams', {
  radius: t.f32()
});
//-----------------------------------------------
// ENUM {Box, Sphere}
//-----------------------------------------------
export const Shape = t.enum('Shape', {
  Box: BoxParams,
  Sphere: SphereParams
});
//-----------------------------------------------
// Body 3D
//-----------------------------------------------
export const body3d = table(
  { name: 'body3d', public: true },
  {
    entityId: t.string().primaryKey(),
    name: t.string(),
    params: Shape // This column now accepts BoxParams OR SphereParams
  }
);

// export const physicsObjects = table(
//   { name: 'physics_objects', public: true },
//   {
//     id: t.u64().primaryKey().autoInc(),
//     name: t.string(),
//     params: Shape // This column now accepts BoxParams OR SphereParams
//   }
// );

