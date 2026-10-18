import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
const scene=new THREE.Scene();scene.background=new THREE.Color('#d8e9e5');scene.fog=new THREE.Fog('#d8e9e5',65,130);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#d8e9e5');document.body.prepend(renderer.domElement);
const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.1,220);camera.position.set(36,35,47);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1,0);controls.enableDamping=true;controls.minDistance=18;controls.maxDistance=90;controls.maxPolarAngle=Math.PI/2.12;controls.autoRotateSpeed=.45;
scene.add(new THREE.HemisphereLight('#fff5dc','#7b9a89',2.5));const sun=new THREE.DirectionalLight('#ffe4b6',3.2);sun.position.set(-20,40,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40});sun.shadow.normalBias=.04;scene.add(sun);
const village=new THREE.Group();village.name='Minato coastal village';scene.add(village);
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.85});const cream=mat('#f2eddb'),wood=mat('#ad8156'),roof=mat('#526b70'),green=mat('#719a65'),stone=mat('#a8afa1'),glass=new THREE.MeshStandardMaterial({color:'#9dced0',roughness:.23,metalness:.2});
function mesh(g,m,x,y,z,parent=village){const a=new THREE.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a;}
function box(w,h,d,m,x,y,z,p){return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,p);}
let seed=42;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
// A compact crescent of land embraces the water; all paths remain on its western bank.
const shape=new THREE.Shape();shape.moveTo(-22,-19);shape.lineTo(15,-19);shape.quadraticCurveTo(23,-14,21,-6);shape.lineTo(16,-5);shape.quadraticCurveTo(9,-17,-1,-11);shape.quadraticCurveTo(-10,-9,-9,1);shape.quadraticCurveTo(-8,9,-16,17);shape.lineTo(-22,17);shape.closePath();
const groundGeo=new THREE.ExtrudeGeometry(shape,{depth:2,bevelEnabled:true,bevelSize:.6,bevelThickness:.5,bevelSegments:2,steps:1});groundGeo.rotateX(Math.PI/2);mesh(groundGeo,mat('#b2c28b'),0,1,0);
const waterGeo=new THREE.PlaneGeometry(105,105,70,70);waterGeo.rotateX(-Math.PI/2);const water=mesh(waterGeo,new THREE.MeshStandardMaterial({color:'#67b8bc',roughness:.35,metalness:.1}),0,-.65,0);water.castShadow=false;
// Seeded rocks and vegetation make the scene reproducible.
function tree(x,z,s=1){mesh(new THREE.CylinderGeometry(.12*s,.18*s,1.7*s,6),wood,x,1.5*s,z);const crown=mesh(new THREE.IcosahedronGeometry(1.3*s,1),mat(['#749b63','#91ad70','#577f61'][Math.floor(rand()*3)]),x,2.8*s,z);crown.scale.y=1.2;}
for(let i=0;i<95;i++){const x=-21+rand()*32,z=-18+rand()*5;const s=.65+rand()*1.1;mesh(new THREE.IcosahedronGeometry(3,1),green,x,-.1,z).scale.set(1,1+rand(),1);tree(x,z,s);}
for(let i=0;i<28;i++)tree(-20+rand()*5,-12+rand()*26,.65+rand()*.65);
function path(points,width=.9){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],1.1,p[1])));const tube=new THREE.TubeGeometry(curve,70,width/2,6,false);const m=mesh(tube,mat('#dcd7bd'),0,0,0);m.scale.y=.12;m.position.y=.98;return curve;}
path([[-17,14],[-13,8],[-12,1],[-10,-5],[-6,-9],[0,-12],[7,-12],[14,-9]],1.4);
function house(x,z,w=3.5,d=3,h=2.7,cafe=false){const g=new THREE.Group();g.position.set(x,1.15,z);village.add(g);g.name=cafe?'Seaside cafe':'Modern house';box(w,h,d,cream,0,h/2,0,g);box(w+.25,.22,d+.28,roof,0,h+.1,0,g);for(let a=-1;a<=1;a+=2){box(.7,1,.05,glass,a*w*.26,h*.57,d/2+.03,g);box(.8,.08,.14,wood,a*w*.26,h*.57-.55,d/2+.07,g);}box(.65,1.8,.08,wood,0,.9,d/2+.05,g);if(cafe){box(w+1,.15,2.7,wood,0,.08,d/2+1.3,g);box(w*.8,h*.7,.08,glass,0,h*.5,d/2+.08,g);for(const a of [-1,1]){mesh(new THREE.CylinderGeometry(.52,.52,.12,20),cream,a*1.2,.9,d/2+1.4,g);box(.1,.85,.1,wood,a*1.2,.45,d/2+1.4,g);}}return g;}
house(-15,3,4,3,2.8,true);house(-16,-4);house(-10,-9,3,2.8);house(-4,-13,3.6,3);house(3,-14,3.4,2.7);house(10,-12,3.2,3);
// Branches from the lane to each front door.
path([[-13,3],[-15,5]],.8);path([[-12,-4],[-16,-2]],.8);path([[-6,-9],[-10,-7]],.8);path([[-1,-12],[-4,-11]],.8);path([[4,-12],[3,-12]],.7);
box(11,.6,1.6,stone,15,.7,-4);box(1.7,.6,5,stone,20,.7,-2.3);
for(let x=10;x<21;x+=2){mesh(new THREE.CylinderGeometry(.1,.13,.5,8),roof,x,1.2,-3.5);}
for(let i=0;i<38;i++){const t=i/37*Math.PI;const x=-1+11*Math.cos(t),z=-1-9*Math.sin(t);mesh(new THREE.DodecahedronGeometry(.4+rand()*.7),stone,x,-.3,z).scale.y=.6;}
// A small boat, with hull, cabin, mast, and mooring rope.
const boat=new THREE.Group();boat.name='Fishing boat';boat.position.set(16,-.1,-1.3);village.add(boat);const hull=mesh(new THREE.SphereGeometry(1,16,8),cream,0,0,0,boat);hull.scale.set(2.1,.45,.7);box(1,.7,.85,cream,.3,.55,0,boat);box(.6,.35,.87,glass,.3,.65,0,boat);box(.06,2.8,.06,wood,-.45,1.5,0,boat);
for(let i=0;i<28;i++){const x=-17+rand()*4,z=-9+rand()*20;mesh(new THREE.IcosahedronGeometry(.25,0),mat(['#fff2ba','#eaa59a','#e0c5e1'][i%3]),x,1.5,z);}
// Fine water lines give an illustrated, rather than photographic, surface.
const ripples=[];for(let i=0;i<70;i++){const x=-6+rand()*37,z=3+rand()*23;const r=box(.2+rand()*.8,.012,.035,mat('#b2e0d8'),x,-.53,z);r.castShadow=false;ripples.push(r);}
function reset(){camera.position.set(36,35,47);controls.target.set(0,1,0);controls.update();}document.querySelector('#home').onclick=reset;
document.querySelector('#top').onclick=()=>{camera.position.set(0,64,.1);controls.target.set(0,0,0);controls.update();};
document.querySelector('#orbit').onclick=e=>{controls.autoRotate=!controls.autoRotate;e.target.setAttribute('aria-pressed',String(controls.autoRotate));};
document.querySelector('#export').onclick=async()=>{const status=document.querySelector('#status');status.textContent='Menyiapkan model…';try{const data=await new GLTFExporter().parseAsync(village,{binary:true});const url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download='minato-village.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status.textContent='Model GLB berhasil diekspor';}catch(e){status.textContent='Ekspor gagal: '+e.message;}};
document.querySelector('#status').textContent='静かな港 · Pelabuhan yang tenang';
const clock=new THREE.Clock();renderer.setAnimationLoop(()=>{const t=clock.getElapsedTime();boat.position.y=-.1+Math.sin(t*1.2)*.055;boat.rotation.x=Math.sin(t*.9)*.02;for(let i=0;i<ripples.length;i++)ripples[i].position.y=-.53+Math.sin(t+i)*.015;controls.update();renderer.render(scene,camera);});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
addEventListener('error',e=>{document.querySelector('#status').textContent='Tidak dapat memuat 3D. Periksa koneksi dan dukungan WebGL.';});
