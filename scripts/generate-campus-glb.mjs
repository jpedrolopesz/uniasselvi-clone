import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mkdir, writeFile } from "node:fs/promises";

globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = value;
      this.onloadend?.();
    });
  }
};

const outputDir = new URL("../public/assets/campus-vitru-3d/models/", import.meta.url);
await mkdir(outputDir, { recursive: true });

function material(color, roughness = 0.72) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
}

function box(group, size, position, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function building({ accent, floors, width, depth, name }) {
  const group = new THREE.Group();
  group.name = name;
  const concrete = material(0xf1eee7);
  const glass = material(0x263b43, 0.25);
  const dark = material(0x2c3031);
  const accentMaterial = material(accent, 0.48);
  const floorHeight = 1.1;

  box(group, [width + .8, .22, depth + .8], [0, .11, 0], material(0xd7d0c5));
  for (let floor = 0; floor < floors; floor += 1) {
    const y = .35 + floor * floorHeight;
    box(group, [width, .18, depth], [0, y, 0], concrete);
    box(group, [width - .28, .65, .12], [0, y + .38, depth / 2 - .05], glass);
    box(group, [width - .28, .65, .12], [0, y + .38, -depth / 2 + .05], glass);
    box(group, [.12, .65, depth - .28], [width / 2 - .05, y + .38, 0], glass);
    box(group, [.12, .65, depth - .28], [-width / 2 + .05, y + .38, 0], glass);
    for (let x = -width / 2 + .55; x < width / 2; x += .75) {
      box(group, [.055, .68, .18], [x, y + .38, depth / 2], dark);
    }
  }
  const roofY = .35 + floors * floorHeight;
  box(group, [width + .15, .22, depth + .15], [0, roofY, 0], concrete);
  box(group, [width * .56, .14, depth * .38], [0, roofY + .18, 0], dark);
  box(group, [.25, floors * floorHeight + .35, .3], [width / 2 + .08, roofY / 2, depth / 2 + .08], accentMaterial);
  box(group, [width * .65, .12, .65], [0, .25, depth / 2 + .58], accentMaterial);
  return group;
}

async function exportGlb(scene, filename) {
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(scene, { binary: true, onlyVisible: true });
  await writeFile(new URL(filename, outputDir), Buffer.from(result));
}

await exportGlb(building({ accent: 0xffcc00, floors: 3, width: 4.8, depth: 3.8, name: "Predio academico" }), "predio-academico.glb");
await exportGlb(building({ accent: 0x4bb47a, floors: 2, width: 4.2, depth: 3.4, name: "Predio social" }), "predio-social.glb");
await exportGlb(building({ accent: 0x8268d8, floors: 2, width: 3.8, depth: 3.1, name: "Predio servicos" }), "predio-servicos.glb");
