"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { workbench } from "@/mock/workbench";

// Viewport — a Three.js render of the parametric document. The geometry is
// built PROCEDURALLY from workbench.nodes (sketchX = position along the axis,
// sketchY = radius); nothing is fetched, no asset is loaded, no loader is used.
// It is a REPRESENTATION, not a dimensioned model — the caption says so.
//
// The scene-colour hex literals below are WebGL material/helper colours, not UI
// styling; there are no design tokens for 3D materials, so hex is the only way
// to express them. The token/no-hex rule governs the Tailwind layer, not this.

// Frame the camera so the whole model fits, deriving the pull-back distance from
// the vertical FOV rather than guessing a constant — the model fits at any extent.
function frameCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  object: THREE.Object3D,
) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = (camera.fov * Math.PI) / 180;
  const dist = (maxDim / 2 / Math.tan(fov / 2)) * 1.6; // 1.6 = framing margin
  const dir = new THREE.Vector3(1, 0.6, 1).normalize();
  camera.position.copy(center).addScaledVector(dir, dist);
  camera.near = Math.max(dist / 100, 0.01);
  camera.far = dist * 100;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}

export default function Viewport() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Guard unmount-during-init: if cleanup runs before setup finishes, dispose
    // whatever exists rather than leaking it. Setup here is synchronous, but the
    // flag keeps the invariant explicit for when async work lands later.
    let disposed = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.GridHelper(400, 20, 0x444444, 0x2a2a2a));
    scene.add(new THREE.AxesHelper(40));
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(1, 1, 1);
    scene.add(key);

    // Procedural document geometry — one cylinder per node, laid along X. Each
    // mesh owns its material so selection (S4) and teardown stay per-mesh.
    const model = new THREE.Group();
    for (const node of workbench.nodes) {
      const radius = Math.max(node.sketchY, 2); // clamp so zero-radius nodes stay visible
      const geom = new THREE.CylinderGeometry(radius, radius, 16, 24);
      const material = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.1, roughness: 0.7 });
      const mesh = new THREE.Mesh(geom, material);
      mesh.rotation.z = Math.PI / 2; // default Y-up cylinder -> lie along X
      mesh.position.x = node.sketchX;
      mesh.userData.nodeId = node.nodeId;
      model.add(mesh);
    }
    scene.add(model);
    frameCamera(camera, controls, model);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize from the container, not the window — the pane can change size
    // without the window doing so.
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    return () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      // Dispose every geometry AND every material; for each material dispose any
      // texture slot it holds. These are the three leak classes from the prior viewer.
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        if (!mat) return;
        const mats = Array.isArray(mat) ? mat : [mat];
        for (const m of mats) {
          for (const slot of Object.values(m as unknown as Record<string, unknown>)) {
            if (slot && (slot as THREE.Texture).isTexture) (slot as THREE.Texture).dispose();
          }
          m.dispose();
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div ref={containerRef} className="min-h-0 flex-1" />
      <div className="border-t border-border-subtle px-5 py-3 text-sm text-text-faint">
        Representative geometry from the document — not dimensioned.
      </div>
    </div>
  );
}
