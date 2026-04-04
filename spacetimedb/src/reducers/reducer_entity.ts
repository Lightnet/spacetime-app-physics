//-----------------------------------------------
// 
//-----------------------------------------------
import { schema, table, t, SenderError  } from 'spacetimedb/server';
import spacetimedb from "../module";
// import { generateRandomString } from '../helper';
import { Shape } from '../models/table_entity';
//-----------------------------------------------
// player
//-----------------------------------------------
export const set_player_position = spacetimedb.reducer({
  x:t.f64(),
  y:t.f64(),
  z:t.f64(),
},(ctx, {x,y,z}) => {
  console.log("set player postion");
  const player = ctx.db.player.identity.find(ctx.sender);
  if(player){
    console.log("found player");
    if(player.entityId){
      const _entity = ctx.db.entity.id.find(player.entityId);
      if(_entity){
        const transform = ctx.db.transform3d.entityId.find(player.entityId);
        if(transform){
          transform.position.x=x;
          transform.position.y=y;
          transform.position.z=z;
          ctx.db.transform3d.entityId.update(transform);
        }
      }
    }
  }
});
//-----------------------------------------------
// CREATE TRANSFORM 3D
//-----------------------------------------------
export const create_player_transform3d = spacetimedb.reducer({
  x:t.f64(),
  y:t.f64(),
  z:t.f64(),
},(ctx, {x,y,z}) => {
  console.log("set player postion");
  const player = ctx.db.player.identity.find(ctx.sender);
  if(player){
    // console.log("found player");
    // if(player.entityId){
    //   const _entity = ctx.db.entity.id.find(player.entityId);
    //   if(_entity){
    //     const _transform = ctx.db.transform3d.entityId.find(player.entityId);
    //     if(_transform){
    //       _transform.position.x=x;
    //       _transform.position.y=y;
    //       _transform.position.z=z;
    //       ctx.db.transform3d.entityId.update(_transform);
    //     }
    //   }
    // }
  }else{
    console.log("new player entity");
    // let nameId = generateRandomString(ctx, 32);
    let nameId = ctx.newUuidV7().toString();
    ctx.db.player.insert({
      identity: ctx.sender,
      entityId: nameId
    });
    ctx.db.entity.insert({
      id: nameId,
      created_at: ctx.timestamp
    });
    ctx.db.transform3d.insert({
      entityId: nameId,
      position: {x:0,y:0,z:0},
      velocity: {x:0,y:0,z:0},
      scale: {x:1,y:1,z:1},
      rotation: {x:0,y:0,z:0},
    });
  }
});
//-----------------------------------------------
// DELETE TRANSFORM 3D
//-----------------------------------------------
export const delete_player_transform3d = spacetimedb.reducer({},(ctx, {}) => {
  const _player = ctx.db.player.identity.find(ctx.sender);
  if(_player){
      console.log("_player: ",_player);
      console.log("id: ",_player.entityId);
      if(_player.entityId){
        ctx.db.entity.id.delete(_player.entityId);
        ctx.db.transform3d.entityId.delete(_player.entityId);
        ctx.db.player.identity.delete(ctx.sender);
      }
    }
})
//-----------------------------------------------
// CREATE PLAYER BOX
//-----------------------------------------------
export const create_player_box = spacetimedb.reducer({
  x:t.f64(),
  y:t.f64(),
  z:t.f64(),
},(ctx, {x,y,z}) => {
  console.log("create box");
  const player = ctx.db.player.identity.find(ctx.sender);
  if(player){
    console.log("found player");
    if(player.entityId){
      const _entity = ctx.db.entity.id.find(player.entityId);
      if(_entity){
        const body = ctx.db.body3d.entityId.find(player.entityId);
        if(!body){
          
          ctx.db.body3d.insert({
            name: 'BOX',
            entityId: player.entityId,
            params: Shape.Box({width:1,height:1,depth:1})
          });
        }else{
          console.log("BODY EXIST!");
        }
      }
    }
  }
});
//-----------------------------------------------
// CREATE PLAYER SPHERE
//-----------------------------------------------
export const create_player_sphere = spacetimedb.reducer({
  x:t.f64(),
  y:t.f64(),
  z:t.f64(),
},(ctx, {x,y,z}) => {
  console.log("set player postion");
  const player = ctx.db.player.identity.find(ctx.sender);
  if(player){
    console.log("found player");
    if(player.entityId){
      const _entity = ctx.db.entity.id.find(player.entityId);
      if(_entity){
        const body = ctx.db.body3d.entityId.find(player.entityId);
        if(!body){
          ctx.db.body3d.insert({
            name: 'SPHERE',
            entityId: player.entityId,
            params: Shape.Sphere({radius:0.5})
          });
        }else{
          console.log("BODY EXIST!");
        }
      }
    }
  }
});
//-----------------------------------------------
// DELETE PLAYER BODY
//-----------------------------------------------
export const delete_player_body = spacetimedb.reducer({},(ctx, {}) => {
    console.log("delete player box!");
    const _player = ctx.db.player.identity.find(ctx.sender);
    if(_player){
      console.log("_player: ",_player);
      console.log("id: ",_player.entityId);
      if(_player.entityId){
        const body = ctx.db.body3d.entityId.find(_player.entityId);
        if(body){
          ctx.db.body3d.entityId.delete(body.entityId)
        }
      }
    }
  }
)

//-----------------------------------------------
// CREATE ENTITY BOX
//-----------------------------------------------
export const create_entity_box = spacetimedb.reducer({
  x:t.f64(),
  y:t.f64(),
  z:t.f64(),
},(ctx, {x,y,z}) => {
    console.log("create entity box!");
    const id = ctx.newUuidV7().toString();

    ctx.db.entity.insert({
      id: id,
      created_at: ctx.timestamp
    })

    ctx.db.transform3d.insert({
      entityId: id,
      position: {x,y,z},
      velocity: {x:0,y:0,z:0},
      scale: {x:1,y:1,z:1},
      rotation: {x:0,y:0,z:0}
    })

    ctx.db.body3d.insert({
      name: '',
      entityId: id,
      params: Shape.Box({
        width: 1,
        height: 1,
        depth: 1
      })
    })
    
  }
)

//-----------------------------------------------
// create block
//-----------------------------------------------
// export const create_obstacle = spacetimedb.reducer({
//   x:t.f64(),
//   y:t.f64(),
//   z:t.f64(),
// },(ctx, args) => {
//   // console.log("create obstacle");
//   // ctx.db.Obstacle3D.insert({
//   //   position: {x:args.x,y:args.y,z:args.z},
//   //   size: {x:1,y:1,z:1},
//   //   id: 0n
//   // });
// });
//-----------------------------------------------
// update block
//-----------------------------------------------
// export const update_obstacle_position_id = spacetimedb.reducer({
//   id:t.u64(),
//   x:t.f64(),
//   y:t.f64(),
//   z:t.f64(),
// },(ctx, args) => {
//   // console.log("update obstacle")
//   // let obstacle = ctx.db.Obstacle3D.id.find(args.id);
//   // if(obstacle){
//   //   ctx.db.Obstacle3D.id.update({...obstacle,
//   //     position: {x:args.x,y:args.y,z:args.z}
//   //   });
//   // }
// });
//-----------------------------------------------
// delete block
//-----------------------------------------------
// export const delete_obstacle = spacetimedb.reducer({
//   id: t.u64()
// },(ctx, {id})=>{
//   // console.log("delete id:", id);
//   // ctx.db.Obstacle3D.id.delete(id);
// })
//-----------------------------------------------
// test
//-----------------------------------------------
// export const get_entity_shape = spacetimedb.reducer(
//   {shapeType:t.string()},
//   (ctx, args)=>{
//     // ctx.db.SampleEntity.iter(). //nope
//     // ctx.db.SampleEntity.id //nope
//     // ctx.db.SampleEntity.id.find();//
//     // ctx.db.SampleEntity.where(join)// nope
//     // ctx.db.SampleEntity.id.find
//     // ctx.db.SampleEntity.shapeType.filter('SPHERE');
// })

//-----------------------------------------------
// PHYSICS
//-----------------------------------------------
/*
(property) params: {
    tag: "Box";
    value: {
        width: number;
        height: number;
        depth: number;
    };
} | {
    tag: "Sphere";
    value: {
        radius: number;
    };
}
*/
export const add_physics_object = spacetimedb.reducer(
  { name: t.string(), params: Shape }, 
  (ctx, { name, params }) => {
    console.log('test', params)
    // ctx.db provides access to your tables
    ctx.db.physicsObjects.insert({
      id: 0n, // auto-incremented
      name,
      params
    });
  }
);











