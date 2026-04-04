// 

import { schema, table, t, SenderError  } from 'spacetimedb/server';
import spacetimedb from '../module';
import * as THREE from 'three';

export const test_foo = spacetimedb.reducer({},(ctx, args) => {
  console.log("test")
});

export const test_collision = spacetimedb.reducer({},(ctx, args) => {
  console.log("test")
  // Define Box 1 using min/max [x, y, z]
  const min1 = new THREE.Vector3(0, 0, 0);
  const max1 = new THREE.Vector3(2, 2, 2);
  const box1 = new THREE.Box3(min1, max1);

  // Define Box 2
  const min2 = new THREE.Vector3(1, 1, 1);
  const max2 = new THREE.Vector3(3, 3, 3);
  const box2 = new THREE.Box3(min2, max2);

  // Direct check
  if (box1.intersectsBox(box2)) {
    console.log("Collision detected!");
  }


});