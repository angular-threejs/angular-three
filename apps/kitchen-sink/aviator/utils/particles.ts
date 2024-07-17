// import { gsap, Power2 } from 'gsap';
// import * as THREE from 'three';
//
// const geom = new THREE.TetrahedronGeometry(3, 0);
// const mat = new THREE.MeshPhongMaterial({ color: 0x009999, shininess: 0, specular: 0xffffff, flatShading: true });
//
// export function spawnParticles(
// 	pos: THREE.Vector3,
// 	count: number,
// 	color: THREE.ColorRepresentation,
// 	scale: number,
// 	scene: THREE.Scene,
// ) {
// 	for (let i = 0; i < count; i++) {
// 		const mesh = new THREE.Mesh(geom, mat);
// 		scene.add(mesh);
//
// 		mesh.visible = true;
// 		mesh.position.copy(pos);
// 		mesh.material.color = new THREE.Color(color);
// 		mesh.material.needsUpdate = true;
// 		mesh.scale.set(scale, scale, scale);
// 		const targetX = pos.x + (-1 + Math.random() * 2) * 50;
// 		const targetY = pos.y + (-1 + Math.random() * 2) * 50;
// 		const targetZ = pos.z + (-1 + Math.random() * 2) * 50;
// 		const speed = 0.6 + Math.random() * 0.2;
// 		gsap.to(mesh.rotation, {
// 			duration: speed,
// 			x: Math.random() * 12,
// 			y: Math.random() * 12,
// 		});
// 		gsap.to(mesh.scale, { duration: speed, x: 0.1, y: 0.1, z: 0.1 });
// 		gsap.to(mesh.position, {
// 			duration: speed,
// 			x: targetX,
// 			y: targetY,
// 			z: targetZ,
// 			delay: Math.random() * 0.1,
// 			ease: Power2.easeOut,
// 			onComplete: () => {
// 				scene.remove(mesh);
// 			},
// 		});
// 	}
// }
