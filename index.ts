// Import stylesheets
import './style.css';
import van from 'vanjs-core';
import * as THREE from 'three';
import { EventHandlers } from './three-types';

const { button, div, pre } = van.tags;

type TThree = {
  renderer: any;
  scene: any;
  perspectiveCamera: any;
  boxGeometry: any;
  meshBasicMaterial: any;
  mesh: (
    geometry: THREE.BoxGeometry,
    material: THREE.MeshBasicMaterial
  ) => THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshBasicMaterial,
    THREE.Object3DEventMap
  > &
    EventHandlers;
};

const three: TThree = {
  renderer: (scene, camera) => {
    const render = new THREE.WebGLRenderer();
    render.setSize(window.innerWidth, window.innerHeight);
    render.render(scene, camera);
    return render;
  },
  scene: (arg) => {
    const scene = new THREE.Scene();
    scene.add(arg);
    return scene;
  },
  perspectiveCamera: () => {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    return camera;
  },
  boxGeometry: () => new THREE.BoxGeometry(1, 1, 1),
  meshBasicMaterial: () => new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
  mesh: (geometry: THREE.BoxGeometry, material: THREE.MeshBasicMaterial) => {
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  },
};

const {
  renderer,
  mesh,
  boxGeometry,
  meshBasicMaterial,
  scene,
  perspectiveCamera,
} = three;

const Cube = () => {
  const obj = mesh(boxGeometry(), meshBasicMaterial());

  obj.onPointerOver = () => {
    obj.material.color.set('hotpink');
  };
  obj.onPointerOut = () => {
    obj.material.color.set('green');
  };

  return obj;
};

const Box = Cube();

const Scene = scene(Box);
const Camera = perspectiveCamera();
const Render = renderer(Scene, Camera);
const Canvas = () => {
  let width = 0;
  let height = 0;
  let intersects = [];
  let hovered = {};
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    Camera.aspect = width / height;
    const target = new THREE.Vector3(0, 0, 0);
    const distance = Camera.position.distanceTo(target);
    const fov = (Camera.fov * Math.PI) / 180;
    const viewportHeight = 2 * Math.tan(fov / 2) * distance;
    const viewportWidth = viewportHeight * (width / height);
    Camera.updateProjectionMatrix();
    Render.setSize(width, height);
    Scene.traverse((obj) => {
      if (obj.onResize)
        obj.onResize(viewportWidth, viewportHeight, Camera.aspect);
    });
  }

  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('pointermove', (e) => {
    mouse.set((e.clientX / width) * 2 - 1, -(e.clientY / height) * 2 + 1);
    raycaster.setFromCamera(mouse, Camera);
    intersects = raycaster.intersectObjects(Scene.children, true);

    // If a previously hovered item is not among the hits we must call onPointerOut
    Object.keys(hovered).forEach((key) => {
      const hit = intersects.find((hit) => hit.object.uuid === key);
      if (hit === undefined) {
        const hoveredItem = hovered[key];
        if (hoveredItem.object.onPointerOver)
          hoveredItem.object.onPointerOut(hoveredItem);
        delete hovered[key];
      }
    });

    intersects.forEach((hit) => {
      // If a hit has not been flagged as hovered we must call onPointerOver
      if (!hovered[hit.object.uuid]) {
        hovered[hit.object.uuid] = hit;
        if (hit.object.onPointerOver) hit.object.onPointerOver(hit);
      }
      // Call onPointerMove
      if (hit.object.onPointerMove) hit.object.onPointerMove(hit);
    });
  });

  return div(Render.domElement);
};

van.add(document.getElementById('app'), Canvas());

function animate() {
  requestAnimationFrame(animate);
  Box.rotation.x += 0.01;
  Box.rotation.y += 0.01;
  Render.render(Scene, perspectiveCamera());
}

animate();
