// 

import { schema, table, t, SenderError  } from 'spacetimedb/server';
// import { update_tick_test } from '../reducers/reducer_test';
import { Registry } from '../logic_registry';

// Define a wrapper that pulls the function from the module only when called
// @ts-ignore
// const lazyCollisionHandler = (...args: any[]) => 
//   import('../reducers/reducer_test').then(m => m.update_tick_test(...args));

// console.log("require")
// console.log(require)// nodejs

// let collisionHandler: any;
let collisionHandler = ()=>{}


export const test_tick = table(
  { 
    name: 'test_tick', 
    scheduled: (): any => collisionHandler

    // scheduled: (): any => {
    //   console.log("Test");
    //   if(!Registry.update_tick_test){
    //     return;
    //   }else{
    //     return Registry.update_tick_test;
    //   }
    // }
    // scheduled: (): any => update_tick_test
    // scheduled: (): any => {
    //   // import { update_tick_test } from '../reducers/reducer_test';
    //   const test = import('../reducers/reducer_test').then(m => m.update_tick_test);
    //   console.log(test)
    //   return test;
    // }
  },
  {
    scheduled_id: t.u64().primaryKey().autoInc(),
    scheduled_at: t.scheduleAt(),
    message: t.string(),
  }
);

// export const test_tick = table(
//   { 
//     name: 'test_tick', 
//     // public: true,
//     // scheduled: async (): any => lazyCollisionHandler
//     // scheduled: async (): Promise<any> => {
//     //   // Dynamically import the file containing the function
//     //   const { update_tick_test } = await import('../reducers/reducer_test');
//     //   // Call the function with any necessary arguments
//     //   return update_tick_test;
//     // }
//     scheduled: async (): Promise<any> {
//       // Dynamically import the file containing the function
//       const { update_tick_test } = await import('../reducers/reducer_test');
//       // Call the function with any necessary arguments
//       return update_tick_test;
//     }
//   },
//   {
//     identity: t.identity().primaryKey(),
//     name: t.string().optional(),
//     online: t.bool(),
//   }
// );



