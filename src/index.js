

import {
  AssetType,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SessionMode,
  SRGBColorSpace,
  AssetManager,
  World,
  SphereGeometry,
  MeshStandardMaterial,
  LocomotionEnvironment,
  EnvironmentType,
  PanelUI,
  Interactable,
  ScreenSpace,
  PhysicsBody, PhysicsShape, PhysicsShapeType, PhysicsState, PhysicsSystem,
  createSystem,
  OneHandGrabbable,
  Group
} from '@iwsdk/core';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { PanelSystem } from './panel.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';


const assets = {
  chimeSound: {
    url: '/audio/chime.mp3',
    type: AssetType.Audio,
    priority: 'background'
  },

};

World.create(document.getElementById('scene-container'), {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: 'always',
    // Optional structured features; layers/local-floor are offered by default
    features: { handTracking: true, layers: false } 
  },
  features: { locomotion: { useWorker: true }, grabbing: true, physics: true},
  level: '/glxf/Arena.glxf' 
}).then((world) => {
  const { camera } = world;

  // create a floor
  const floorMesh = new Mesh(new PlaneGeometry(36, 36), new MeshStandardMaterial({color: 0xC2B280 }));
  floorMesh.rotation.x = -Math.PI / 2;
  const floorEntity = world.createTransformEntity(floorMesh);
  floorEntity.addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });
  floorEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto});
  floorEntity.addComponent(PhysicsBody, { state: PhysicsState.Static });

  // Arena walls since Spatial Editor model doesn't want to load.
  const wallMesh0 = new Mesh(new PlaneGeometry(36, 5), new MeshStandardMaterial({color: 0xCB4154 }));
  const arenaWalls = new Group;
  wallMesh0.position.set(0,2.5,-18);
  arenaWalls.add(wallMesh0);

  const wallMesh1 = wallMesh0.clone();
  wallMesh1.position.set(0,2.5,18);
  wallMesh1.rotation.y = Math.PI / 1;
  arenaWalls.add(wallMesh1);

  const wallMesh2 = wallMesh0.clone();
  wallMesh2.position.set(18,2.5,0);
  wallMesh2.rotation.y = -Math.PI / 2;
  arenaWalls.add(wallMesh2);

  const wallMesh3 = wallMesh0.clone();
  wallMesh3.position.set(-18,2.5,0);
  wallMesh3.rotation.y = Math.PI / 2;
  arenaWalls.add(wallMesh3);

  const wallsEntity = world.createTransformEntity(arenaWalls);
  wallsEntity.addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });
  wallsEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
  wallsEntity.addComponent(PhysicsBody, { state: PhysicsState.Static });

  const loader = new GLTFLoader();
  loader.load('/models/swordModel.gltf', (gltf) => {
    const swordModel = gltf.scene;
    swordModel.position.set(0,2,0);
    const swordEntity = world.createTransformEntity(swordModel);
    swordEntity.addComponent(OneHandGrabbable);
    swordEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.ConvexHull });
    swordEntity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
  });  

  const GameLoopSystem = class extends createSystem() {
    update(delta, time) {
      //Things that Need to Update Every Tick
    }
  };

  world.registerSystem(GameLoopSystem);


  
  world.registerSystem(PhysicsSystem).registerComponent(PhysicsBody).registerComponent(PhysicsShape);
  





  // vvvvvvvv EVERYTHING BELOW WAS ADDED TO DISPLAY A BUTTON TO ENTER VR FOR QUEST 1 DEVICES vvvvvv
  //          (for some reason IWSDK doesn't show Enter VR button on Quest 1)
  world.registerSystem(PanelSystem);
  
  if (isMetaQuest1()) {
    const panelEntity = world
      .createTransformEntity()
      .addComponent(PanelUI, {
        config: '/ui/welcome.json',
        maxHeight: 0.8,
        maxWidth: 1.6
      })
      .addComponent(Interactable)
      .addComponent(ScreenSpace, {
        top: '20px',
        left: '20px',
        height: '40%'
      });
    panelEntity.object3D.position.set(0, 1.29, -1.9);
  } else {
    // Skip panel on non-Meta-Quest-1 devices
    // Useful for debugging on desktop or newer headsets.
    console.log('Panel UI skipped: not running on Meta Quest 1 (heuristic).');
  }
  function isMetaQuest1() {
    try {
      const ua = (navigator && (navigator.userAgent || '')) || '';
      const hasOculus = /Oculus|Quest|Meta Quest/i.test(ua);
      const isQuest2or3 = /Quest\s?2|Quest\s?3|Quest2|Quest3|MetaQuest2|Meta Quest 2/i.test(ua);
      return hasOculus && !isQuest2or3;
    } catch (e) {
      return false;
    }
  }
});
