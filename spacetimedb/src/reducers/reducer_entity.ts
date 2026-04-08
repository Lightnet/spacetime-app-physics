//-----------------------------------------------
// 
//-----------------------------------------------
import { schema, table, t, SenderError  } from 'spacetimedb/server';
import spacetimedb from "../module";
// import { generateRandomString } from '../helper';
import { Shape } from '../models/table_entity';

//-----------------------------------------------
// CREATE ENTITY
//-----------------------------------------------
export const create_entity = spacetimedb.reducer((ctx)=>{
  ctx.db.entity.insert({
    id: ctx.newUuidV7().toString(),
    created_at: ctx.timestamp
  });
})
//-----------------------------------------------
// DELETE ENTITY
//-----------------------------------------------
export const delete_entity = spacetimedb.reducer({id:t.string()},(ctx,{id})=>{
  const isDelete = ctx.db.entity.id.delete(id);
  console.log('delete id:', id ," :", isDelete);
})
//-----------------------------------------------
// CREATE PLAYER
//-----------------------------------------------
export const create_player = spacetimedb.reducer({},(ctx, {}) => {
  console.log("set player postion");
  const player = ctx.db.player.identity.find(ctx.sender);
  if(player){
    if(!player.entityId){
      let nameId = ctx.newUuidV7().toString();
      player.entityId = nameId;
      ctx.db.player.identity.update(player);

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


      ctx.db.body3d.insert({
        name: 'Box',
        entityId: nameId,
        params: Shape.Box({
          width: 1,
          height: 1,
          depth: 1
        })
      })
    }

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

    ctx.db.body3d.insert({
      name: 'Box',
      entityId: nameId,
      params: Shape.Box({
        width: 1,
        height: 1,
        depth: 1
      })
    })
  }
});

export const delete_player = spacetimedb.reducer({id:t.string()},(ctx, {id}) => {
  const _player = ctx.db.player.identity.find(ctx.sender);
  if(_player){
    if(_player.entityId){

      ctx.db.entity.id.delete(_player.entityId);
      ctx.db.transform3d.entityId.delete(_player.entityId);
      ctx.db.body3d.entityId.delete(_player.entityId);
      _player.entityId = "";
      ctx.db.player.identity.update(_player);

    }
  }
})

//-----------------------------------------------
// SET PLAYER POSITION
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
          // console.log(transform.position);
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
// REMOVE TRANSFORM 3D
//-----------------------------------------------
export const remove_transform3d = spacetimedb.reducer({id:t.string()},(ctx, {id}) => {
  ctx.db.transform3d.entityId.delete(id);
  console.log("remove transform 3d")
})
//-----------------------------------------------
// CREATE ENTITY BOX
//-----------------------------------------------
export const create_entity_box = spacetimedb.reducer({
  id:t.string(),
  x:t.f64(),
  y:t.f64(),
  z:t.f64(),
},(ctx, {id,x,y,z}) => {
  console.log("create box");
  const _entity = ctx.db.entity.id.find(id);
  if(_entity){
    console.log("found entity");
    const body = ctx.db.body3d.entityId.find(id);
    if(!body){
      ctx.db.body3d.insert({
        name: 'BOX',
        entityId: id,
        params: Shape.Box({width:x,height:y,depth:z})
      });
    }else{
      console.log("BODY EXIST!");
    }
  }
});
//-----------------------------------------------
// CREATE ENTITY SPHERE
//-----------------------------------------------
export const create_entity_sphere = spacetimedb.reducer({
  id:t.string(),
  radius :t.f64(),
},(ctx, {id,radius}) => {
  console.log("set player postion");
  const player = ctx.db.entity.id.find(id);
  if(player){
    console.log("found entity");
    const body = ctx.db.body3d.entityId.find(id);
    if(!body){
      ctx.db.body3d.insert({
        name: 'SPHERE',
        entityId: id,
        params: Shape.Sphere({radius:radius ?? 0.5})
      });
    }else{
      console.log("BODY EXIST!");
    }
  }
});
//-----------------------------------------------
// DELETE ENTITY BODY
//-----------------------------------------------
export const delete_entity_body3d = spacetimedb.reducer({id:t.string()},(ctx, {id}) => {
    console.log("delete body3d!");
    const _entity = ctx.db.entity.id.find(id);
    if(_entity){
      console.log("_player: ",_entity);
      const body = ctx.db.body3d.entityId.find(id);
      if(body){
        ctx.db.body3d.entityId.delete(id)
      }
    }
  }
)

//-----------------------------------------------
// CREATE ENTITY BOX TEST
//-----------------------------------------------
export const create_entity_box_test = spacetimedb.reducer({
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
// export const add_physics_object = spacetimedb.reducer(
//   { name: t.string(), params: Shape }, 
//   (ctx, { name, params }) => {
//     console.log('test', params)
//     // ctx.db provides access to your tables
//     ctx.db.physicsObjects.insert({
//       id: 0n, // auto-incremented
//       name,
//       params
//     });
//   }
// );

