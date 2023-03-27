<script setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { onMounted, ref, watch, nextTick, getCurrentInstance } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { StyleProvider, Themes, Snackbar } from '@varlet/ui'
import { TransformControls } from 'three-transform-controls/TransformControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader.js';
import { MMDAnimationHelper } from 'three/examples/jsm/animation/MMDAnimationHelper.js';
const loader = new GLTFLoader();
// Optional: Provide a DRACOLoader instance to decode compressed mesh data
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( 'three/examples/js/libs/draco/gltf' );
loader.setDRACOLoader( dracoLoader );
const cubeMapLoader = new THREE.CubeTextureLoader()
let model, INTERSECTED
let keypoint = []
let arrowHelperFront
let arrowHelperUp
let arrowHelperRight
let skeleton
let x = new THREE.Vector3(1, 0, 0)
let y = new THREE.Vector3(0, 1, 0)
let z = new THREE.Vector3(0, 0, 1)
let nX = new THREE.Vector3(-1, 0, 0)
let nY = new THREE.Vector3(0, -1, 0)
let nZ = new THREE.Vector3(0, 0, -1)
let nullVec = new THREE.Vector3(0, 0, 0)
const raycaster = new THREE.Raycaster()
raycaster.far = Number.MAX_VALUE
raycaster.near = 10
const mouse = new THREE.Vector2()
var loading = ref(true)
var lastSelected = null
var lastSelectTime = new Date().getTime()
var nowSelect = ref(null)
var lastColor = null
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 256 );
const cubeCamera = new THREE.CubeCamera( 1, 1000, cubeRenderTarget );
let guiFolder = new GUI({ autoPlace: false})
let ratioSettings = {
  'waist': 1,
  'shoulder': 1
}

//props
const props = defineProps(['type'])

//ref
var videoPlayer = ref( null )
var showVideo = ref( false )
let inputVideo = ref( null )
const finished = ref(false)
var showlist = ref(false)
const video = ref(null)
var sidebarIconSize = ref(25)
var visible = ref(true)
var showLeft = ref(true)
const active = ref(0)
let currentTheme = null
const scene = new THREE.Scene()
let canvasdom = ref(null)
var fullscreen = ref(false)
var settings = ref({
  showDat: false,
  mcEnabled: true
})
let instance
var videoSize = ref({
  width: 430,
  height: 300
})
var addpointer = ref(0)
var interactType = ref(0)
const previewBaseUrl = [
'src/assets/preview/models/',
'src/assets/preview/textures/'
]
const modelBaseUrl = 'src/assets/models/'
const mapUrls = ref(
  ['none', 'bridge', 'milkyWay', 'park', 'park2', 'pisa', 'wild', 'building']
)
const modelUrls = ref(
  ['DamagedHelmet.gltf', 'RobotExpressive.glb', 'shaderball.glb', 'SheenChair.glb', 'PrimaryIonDrive.glb', 'SimpleSkinning.gltf', 'Flower.glb']
)
scene.background = new THREE.Color( 0xbfe3dd )
const renderer = new THREE.WebGLRenderer({ antialias: true,preserveDrawingBuffer: true})
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight  ,
  0.1,
  1000
)
renderer.shadowMap.enabled = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(window.innerWidth , window.innerHeight )
const controls = new OrbitControls(camera, renderer.domElement)
camera.position.z = 10

const axesHelper = new THREE.AxesHelper(10)
scene.add(axesHelper)

//scene.add( hemiLight );
const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 )
hemiLight.position.set( 0, 5, 0 )
scene.add( hemiLight );

const dirLight = new THREE.DirectionalLight( 0xffffff )
dirLight.position.set( - 3, 5,  -5 )
dirLight.castShadow = true
dirLight.shadow.camera.top = 200
dirLight.shadow.camera.bottom = - 200
dirLight.shadow.camera.left = - 200
dirLight.shadow.camera.right = 200
dirLight.shadow.camera.near = 0.1
dirLight.shadow.camera.far = 500
dirLight.shadow.mapSize.width = 2048 // default 512
dirLight.shadow.mapSize.height = 2048 // default
scene.add( dirLight );


// let lightHelper = new THREE.HemisphereLightHelper( hemiLight );
// scene.add( lightHelper );

const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshLambertMaterial( { color: 0x999999, depthWrite: true } ) );
mesh.rotation.x = - Math.PI / 2
mesh.receiveShadow = true
scene.add( mesh )


//mmd
// const vpds = [];
// let mmdmesh, helper
// Ammo().then( function ( AmmoLib ) {

// Ammo = AmmoLib;


// } );
// function onProgress( xhr ) {

// if ( xhr.lengthComputable ) {

//   const percentComplete = xhr.loaded / xhr.total * 100;
//   console.log( Math.round( percentComplete, 2 ) + '% downloaded' );

// }

// }

// const modelFile = 'src/assets/models/mmd/miku/miku_v2.pmd';
// const vpdFiles = [
// 'src/assets/models/mmd/vpds/01.vpd',
// 'src/assets/models/mmd/vpds/02.vpd',
// 'src/assets/models/mmd/vpds/03.vpd',
// 'src/assets/models/mmd/vpds/04.vpd',
// 'src/assets/models/mmd/vpds/05.vpd',
// 'src/assets/models/mmd/vpds/06.vpd',
// 'src/assets/models/mmd/vpds/07.vpd',
// 'src/assets/models/mmd/vpds/08.vpd',
// //'models/mmd/vpds/09.vpd',
// //'models/mmd/vpds/10.vpd',
// 'models/mmd/vpds/11.vpd'
// ];

// helper = new MMDAnimationHelper();

// const mmdloader = new MMDLoader();

// mmdloader.load( modelFile, function ( object ) {

// mmdmesh = object;
// mmdmesh.position.z = - 10;

// skeleton = new THREE.SkeletonHelper( mmdmesh );
// scene.add( mmdmesh );
// scene.add( skeleton );
// skeleton.bones.map((item, index) => {
//   console.log(index, item.name)
// })
// let Euler = new THREE.Euler( PI / 3*2, 0, -PI / 4, 'XYZ' )
// skeleton.bones[39].setRotationFromEuler( Euler )

// let vpdIndex = 0;

// function loadVpd() {

//   const vpdFile = vpdFiles[ vpdIndex ];

//   mmdloader.loadVPD( vpdFile, false, function ( vpd ) {

//     vpds.push( vpd );

//     vpdIndex ++;

//     if ( vpdIndex < vpdFiles.length ) {

//       loadVpd();

//     } else {

//       initGui();

//     }

//   }, onProgress, null );

// }

// loadVpd();

// }, onProgress, null );


const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.setSize(0.5)
transformControls.attach(mesh); // 将 TransformControls 绑定到选中的物体上
scene.add(transformControls);

const genCubeUrls = function ( prefix, postfix ) {

  return [
    prefix + 'px' + postfix, prefix + 'nx' + postfix,
    prefix + 'py' + postfix, prefix + 'ny' + postfix,
    prefix + 'pz' + postfix, prefix + 'nz' + postfix
  ];

};

function addRatio() {
  let mcratio = guiFolder.addFolder( 'MotionCapture Ratios' )
  mcratio.add( ratioSettings, 'waist' , 0.5, 2 )
  mcratio.add( ratioSettings, 'shoulder' , 0.5, 2 )
}

//加载背景天空盒
function loadMap(index, url) {

  if(index == 0){
    scene.background = new THREE.Color( 0xbfe3dd )
  } else {

    const urls = genCubeUrls( 'src/assets/textures/' + url + '/', '.jpg' );

    cubeMapLoader.load( urls, function ( cubeTexture ) {

    cubeTexture.encoding = THREE.sRGBEncoding;

    scene.background = cubeTexture;

    cubeCamera.update( renderer, scene );

    } );
  }
}

//移动，旋转，缩放切换
function setmode(mode) {
  switch (mode){
    case 0:
      interactType.value = 0
      transformControls.setMode('translate')
      break
    case 1:
      interactType.value = 1
      transformControls.setMode('rotate')
      break
    case 2:
      interactType.value = 2
      transformControls.setMode('scale')
      break
  }

}

transformControls.addEventListener( 'dragging-changed', function ( event ) {

  controls.enabled = ! event.value;

} );

//截图
function screenshot() {
  if(lastSelected){
    lastSelected.material.color.set(0xffffff)
  }
  transformControls.visible = false
  renderer.render(scene, camera)
  const dataURL = renderer.domElement.toDataURL();

  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'screenshot.png';

  document.body.appendChild(link);
  link.click();
  canvasdom.value.animate([{opacity: 1, easing: 'ease-in-out'}, {opacity: 0.3, easing: 'ease-in-out'}, {opacity: 1, easing: 'ease-in-out'}], 300)
}

//更新画布
function updateThree() {
  let width = Math.ceil(document.getElementsByClassName('lhalf')[0].clientWidth + 1)
  let height = Math.ceil(document.getElementsByClassName('lhalf')[0].clientHeight + 1)
  camera.aspect = width / height
  camera.updateProjectionMatrix();
  renderer.setSize(width, height)
}

// const cube = new THREE.BoxGeometry(1, 1, 1)
// const material = new THREE.MeshLambertMaterial({color: 0xffffff})
// const spheremesh = new THREE.Mesh(cube, material)
// scene.add(spheremesh)
function addSphere() {
  currentTheme = currentTheme ? null : Themes.dark
  StyleProvider(currentTheme)
  //visible.value = !visible.value
  //showLeft.value = !showLeft.value

}
for(var i = 0; i < 33; i++){
    const cube = new THREE.SphereGeometry(0.5, 1, 1)
    const material = new THREE.MeshLambertMaterial({color: 0x000000})
    const spheremesh = new THREE.Mesh(cube, material)
    spheremesh.position.x = Math.random() * 20 - 10
    spheremesh.position.y = Math.random() * 20 - 10
    spheremesh.position.z = Math.random() * 10
    spheremesh.receiveShadow = true
    spheremesh.castShadow = true
    keypoint.push(spheremesh)
    scene.add(spheremesh)
  }
//删除物体
function remove() {
  if(nowSelect ){
    transformControls.detach()
    scene.remove(nowSelect)
    nowSelect.geometry.dispose()
    nowSelect.material.dispose()

    renderer.render(scene, camera)
  }
}

//添加物体
function addmodel(i) {
  controls.enabled = false
  let addmodel
  loader.load(
    // resource URL
    `${modelBaseUrl}${i}`,
    // called when the resource is loaded
    function ( gltf ) {
      addmodel = gltf.scene;
      gltf.scene.position.y = 8;

      scene.add( addmodel );



      let intervel = setInterval( () => {
        raycaster.setFromCamera(mouse, camera);
        // 获取被选中的物体
        const intersects = raycaster.intersectObject(mesh, true);
        const point = intersects[0].point
        const position = new THREE.Vector3().copy(point);
        if(addmodel.position != undefined){
          addmodel.position.copy(position);
        }


      }, 30)
      canvasdom.value.addEventListener( 'click', () => {
        clearInterval(intervel)
        controls.enabled = true
      }, { once: true} )
    },
    // called while loading is progressing
    function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    // called when loading has errors
    function ( error ) {
      console.log( error );

    })
}

//选中物体
renderer.domElement.addEventListener('dblclick', () => {
    var currentTime = new Date().getTime();
    // 更新选择器的状态
    raycaster.setFromCamera(mouse, camera);
    // 获取被选中的物体
    const intersects = raycaster.intersectObjects(scene.children, true);
    if(intersects.length) {
      lastColor = intersects[0].object.material.color
      // 遍历所有被选中的物体
      for(const item of intersects){
        if(item.object != lastSelected && item.object.isMesh && !item.object.isTransformControlsPlane) {
          nowSelect = item.object
          console.log('a', nowSelect)
          item.object.material.emissive.setHex( 0x00ff00 );
          transformControls.visible = true
          if(item.object.isSkinnedMesh) {
            transformControls.attach(nowSelect.SkeletonHelper)
          } else {
            transformControls.attach(nowSelect)
          }
          if(lastSelected) {
            lastSelected.material.emissive.setHex( lastSelected.currentHex );
          }
          break
        }
      }
      lastSelected = nowSelect
    } else {
      console.log(lastSelected)
      lastSelected.material.color.set(0xffffff)
    }

  }
);

//返回首页
function returnApp() {
  instance.emit('returnApp')
}

function loadModel(url) {
  // Load a glTF resource
  loader.load(
    // resource URL
    `${modelBaseUrl}${i}`,
    // called when the resource is loaded
    function ( gltf ) {

      let addmodel = gltf.scene;
      scene.add( addmodel );


      //

      // const skeleton = new THREE.SkeletonHelper( model );
      // skeleton.depthWrite = true
      // skeleton.bones.map((item) => {
      //   console.log(item.name)
      // })
      // skeleton.bones[0].position.set(90, 0, 0)
      // skeleton.bones[1].position.set(80, 0, 0)
      // skeleton.visible = true;
      // scene.add( skeleton );


    },
    // called while loading is progressing
    function ( xhr ) {

      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

    },
    // called when loading has errors
    function ( error ) {

      console.log( error );

    }
  )
}

window.addEventListener( 'resize', updateThree );

function RToA(value) {
  return value / Math.PI * 180
}

loader.load(
// resource URL
`${modelBaseUrl}Soldier.glb`,
// called when the resource is loaded
function ( gltf ) {

  model = gltf.scene;
  let scaleRatio = 9.5
  model.scale.set(scaleRatio, scaleRatio, scaleRatio)
  model.position.x = -10
  scene.add( model );
  camera.position.set(0, 10, 45)
  camera.lookAt(0, 14, 0)
  model.traverse( function ( object ) {

    if ( object.isMesh ) object.castShadow = true;
    //console.log( object.name, object.position.x, object.position.y, object.position.z )
  } );


  skeleton = new THREE.SkeletonHelper( model );

  const direction = new THREE.Vector3(1, 0, 0)

  const origin = new THREE.Vector3(skeleton.bones[2].position.x, skeleton.bones[2].position.y, skeleton.bones[2].position.z);
  const length = 10;
  const color = 0xff0000;
  const headLength = 0.2 * length;
  const headWidth = 0.2 * headLength;

  arrowHelperFront = new THREE.ArrowHelper(direction, origin, length, color, headLength, headWidth)
  arrowHelperUp = new THREE.ArrowHelper(direction, origin, length, color, headLength, headWidth)
  arrowHelperRight = new THREE.ArrowHelper(direction, origin, length, color, headLength, headWidth)

  scene.add(arrowHelperFront);
  scene.add(arrowHelperUp)
  scene.add(arrowHelperRight)

  skeleton.depthWrite = true

  let PI = Math.PI
  let Euler = new THREE.Euler( Math.PI / 2, 0  , 0, 'XYZ' )
  skeleton.bones[0].setRotationFromEuler( Euler )

  let euler = new THREE.Euler( Math.PI / 3, 0, 0, 'XYZ' )
  skeleton.bones[46].setRotationFromEuler( euler )
  //skeleton.bones[46].rotateX(Math.PI / 3)

  // skeleton.bones.map((item, index) => {
  //   console.log(index, item.name)
  // })
  skeleton.visible = true;
  scene.add( skeleton );
  render()

},
// called while loading is progressing
function ( xhr ) {

  console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

},
// called when loading has errors
function ( error ) {

  console.log( error );

})

//计算Vector
function calculateTargetVector( target, parent ) {
  return new THREE.Vector3( target.x - parent.x, target.y - parent.y, target.z - parent.z).normalize()
}
//更新肢体骨骼节点
function updateLimbBones( target, parent, skeletonIndex, right, ratio ) {
  let xTemp = target.clone().setY(0)
  let yTemp = target.clone().setX(0)
  let setX = xTemp.angleTo(parent.clone().setY(0)) * (right ? 1 : -1)
  let setY = yTemp.angleTo(nZ) * ( yTemp.y < 0 ? 1 : -1 )
  let Euler = new THREE.Euler( setX * ratio, 0, setY * ratio, 'XYZ' )

  skeleton.bones[skeletonIndex].setRotationFromEuler( Euler )
}

//更新水平骨骼节点
function updateHorizontalBones( front, up , right, parentFront, parentUp, parentRight, skeletonIndex, ratio ) {
  let angleToNZ = front.clone().setY(0).angleTo( parentFront.clone().setY(0) ) * ( front.x < 0 ? 1 : -1 )
  let angleToY = up.clone().setZ(0).angleTo( parentUp.clone().setZ(0) ) * ( up.x < 0 ? 1 : -1 )
  let angleToX = right.clone().setX(0).angleTo(parentRight.clone().setX(0))
  //console.log(RToA(angleToNZ), RToA(angleToY))
  skeleton.bones[skeletonIndex].rotation.set(0, angleToNZ * ratio, angleToY * ratio)

}

//更新大腿
function updateUpLeg( target, parentX, parentZ, skeletonIndex, right, ratio) {
  skeleton.bones[skeletonIndex].rotation.set( Math.PI, 0, 0 )
  let setX = target.clone().setX(0).angleTo(parentX) * ( target.z > 0 ? 1 : -1 )
  let setZ = target.clone().setZ(0).angleTo(parentZ) * ( target.x < 0 ? 1 : -1 )
  skeleton.bones[skeletonIndex].rotateX(setX)
  skeleton.bones[skeletonIndex].rotateZ(setZ)
  console.log(RToA(setZ))
}

//更新小腿
function updateLeg( target, parentX, parentZ, skeletonIndex, right, ratio) {
  let setX = target.clone().setX(0).angleTo(parentX) * ( target.z > 0 ? 1 : -1 )
  let setZ = target.clone().setZ(0).angleTo(parentZ) * ( target.x < 0 ? 1 : -1 )
  skeleton.bones[skeletonIndex].rotation.set(setX, 0, setZ)
  console.log(RToA(setZ))
}

function updateSkeleton(array) {
  let up = new THREE.Vector3(0, 1, 0)

  //waist
  let midright = calculateTargetVector(array[23], array[24])
  let midfront = new THREE.Vector3().crossVectors(midright, up).normalize()
  let setY = midfront.clone().setY(0).angleTo(z) * ( midfront.x < 0 ? 1 : -1 )
  //console.log(RToA(setY))
  skeleton.bones[0].rotation.set(Math.PI / 2,setY * ratioSettings.waist, 0)

  //skeleton[3]
  let right = calculateTargetVector(array[11], array[12])

  let front = new THREE.Vector3().crossVectors(right, up).normalize()
  let upVec = new THREE.Vector3().crossVectors(front, right).normalize()

  //updateHorizontalBones( front, upVec, right, z, y, x, 3 , ratioSettings.shoulder)
  //updateHorizontalBones( front, upVec, right, z, y, x, 2 , ratioSettings.shoulder * 0.8)
  //updateHorizontalBones( front, upVec, right, z, y, x, 1 , ratioSettings.shoulder * 0.4)
  //head
  let upHead = new THREE.Vector3(
  (array[4].x + array[1].x) / 2 - (array[10].x + array[9].x) / 2,
  (array[4].y + array[1].y) / 2 - (array[10].y + array[9].y) / 2,
  (array[4].z + array[1].z) / 2 - (array[10].z + array[9].z) / 2 ).normalize()
  let rightHead = calculateTargetVector(array[1], array[4])
  let frontHead = new THREE.Vector3().crossVectors(rightHead, upHead).normalize()
  let rXY = rightHead.clone().setZ(0).angleTo(x) * ( rightHead.y > 0 ? 1 : -1 ) * 1  //3
  let rXZ = frontHead.clone().setY(0).angleTo(z) * ( frontHead.x < 0 ? 1 : -1) * 1//2
  let rYZ = upHead.clone().setX(0).angleTo(y) *    1 //1
  //console.log(RToA(rYZ))
  skeleton.bones[5].rotation.set( rYZ - Math.PI / 4, rXZ, rXY )

  //rightForeArm
  let rightForeArm = calculateTargetVector(array[14], array[12])
  updateLimbBones( rightForeArm, right.clone().negate(), 24, true, 1 )

  //rightArm
  let rightArm = calculateTargetVector(array[16], array[14])
  updateLimbBones( rightArm, rightForeArm, 25, true, 1 )

  //rightHand
  let rightHand = calculateTargetVector(array[20], array[16])
  //updateLimbBones( rightHand, rightArm, 26, true, 1 )

  //rightUpLeg
  let rightUpLeg = calculateTargetVector(array[26], array[24])
  updateUpLeg( rightUpLeg, nY, nY, 45, true, true, 1)

  //rightLeg
  let rightLeg = calculateTargetVector(array[28], array[26])
  updateLeg( rightLeg, rightUpLeg.setX(0), rightUpLeg.setZ(0).setZ(0), 46, true, 1)

  //leftForeArm
  let leftForeArm = calculateTargetVector(array[13], array[11])
  updateLimbBones( leftForeArm, right, 7, false, 1 )

  //leftArm
  let leftArm = calculateTargetVector(array[15], array[13])
  updateLimbBones( leftArm, leftForeArm, 8, false, 1 )

  //leftUpLeg
  let leftUpLeg = calculateTargetVector(array[25], array[23])
  updateUpLeg( leftUpLeg, nY, nY, 41, true, 1)

  //leftLeg
  let leftLeg = calculateTargetVector(array[27], array[25])
  updateLeg( leftLeg, leftUpLeg.setX(0), leftUpLeg.setZ(0).setZ(0), 42, true, 1)

   arrowHelperUp.setDirection(rightLeg)
   arrowHelperFront.setDirection(midright)
}

onMounted( async () => {
  instance = getCurrentInstance()
  loadMap(1, 'pisa')
  canvasdom.value.appendChild(renderer.domElement)
  videoPlayer.value.appendChild(guiFolder.domElement)
  addRatio()
  canvasdom.value.addEventListener('mousemove', (event) => {
    mouse.x = ( event.offsetX / canvasdom.value.clientWidth ) * 2 - 1;
    mouse.y = - ( event.offsetY / canvasdom.value.clientHeight ) * 2 + 1;

  });

  updateThree();
  const videoElement = document.getElementsByClassName('input_video')[0];
  const canvasElement = document.getElementsByClassName('output_canvas')[0];
  const canvasCtx = canvasElement.getContext('2d');


  function onResults(results) {
    loading.value = false
    canvasCtx.save();
    let ratio = 12
    let bias = 8.5
    if( results.poseWorldLandmarks ) {
      let array = keypoint.map( (value, index) => {
        value.position.set( -results.poseWorldLandmarks[index].x * ratio, -results.poseWorldLandmarks[index].y * ratio + bias, results.poseWorldLandmarks[index].z * ratio)
      })

    }
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    // Only overwrite existing pixels.
    canvasCtx.globalCompositeOperation = 'source-in';
    canvasCtx.fillStyle = '#00FF00';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'source-over';
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                  {color: '#00FF00', lineWidth: 4});
    drawLandmarks(canvasCtx, results.poseLandmarks,
                  {color: '#FF0000', lineWidth: 2});
    canvasCtx.restore();
    if(results.poseWorldLandmarks && settings.value.mcEnabled) {
      updateSkeleton(results.poseWorldLandmarks.map((item) => ({
        x: item.x * ratio,
        y: -item.y * ratio + bias,
        z: item.z * ratio,
        visibility: item.visibility,
      })))
    }
  }

  const pose = new Pose({locateFile: (file) => {
    return `@mediapipe/pose/${file}`;
  }});
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });
  pose.onResults(onResults);
  // if( props.type == 'video') {

  //   const fileInput = inputVideo.value
  //   await nextTick()

  //   fileInput.addEventListener( "change", () => {
  //     const file = fileInput.files[0]
  //     const reader = new FileReader()
  //     reader.addEventListener( "load", async () => {
  //       showVideo.value = !showVideo.value
  //       await nextTick()
  //       const videoElement = document.getElementsByClassName('input_video')[0];
  //       videoPlayer.value.src = reader.result
  //       videoElement.addEventListener("timeupdate", async () => {
  //         await pose.send({image: videoElement});
  //       })
  //     })
  //     reader.readAsDataURL(file)
  //   })


  // }

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({image: videoElement});
    },
    width: 500,
    height: 500
  });
  camera.start();

  // videoElement.addEventListener("timeupdate", async () => {
  //   await pose.send({image: videoElement});
  // })
})

const render = async () => {
  await nextTick();
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}



watch(fullscreen, async () => {
  await nextTick()
  updateThree()
})

watch(visible, async () => {
  await nextTick()
  updateThree()
})

</script>

<template>
<var-paper class="mcContainer" >
  <var-paper class="sidebar" :elevation="20">
    <var-cell border ripple class="menuItem" :elevation="18" @click="returnApp">
        <text>返回</text>
        <var-icon name="chevron-left" :size="sidebarIconSize" />
    </var-cell>
    <var-cell border ripple class="menuItem" @click="setmode(0)" :style="{'background-color': interactType == 0 ? '#636b80d3' : 'transparent'}">
        <text>移动</text>
        <var-icon name="src/assets/icons/移动.svg" :size="sidebarIconSize" color="#2979ff"/>
    </var-cell>
    <var-cell border ripple class="menuItem" @click="setmode(1)" :style="{'background-color': interactType == 1 ? '#636b80d3' : 'transparent'}">
        <text>旋转</text>
        <var-icon name="src/assets/icons/旋转.svg" :size="sidebarIconSize" color="#2979ff"/>
    </var-cell>
    <var-cell border ripple class="menuItem" @click="setmode(2)" :style="{'background-color': interactType == 2 ? '#636b80d3' : 'transparent'}">
        <text>缩放</text>
        <var-icon name="src/assets/icons/缩放.svg" :size="sidebarIconSize"/>
    </var-cell>
    <var-cell border ripple class="menuItem" @click="visible = !visible; pointer = 0">
        <text>编辑</text>
        <var-icon name="menu" :size="sidebarIconSize" v-if="!visible" :transition="300"/>
        <var-icon name="menu-open" :size="sidebarIconSize" v-else/>
    </var-cell>
    <var-cell border ripple class="menuItem" @click="remove">
        <text>删除</text>
        <var-icon name="trash-can-outline" :size="sidebarIconSize"/>
    </var-cell>
    <var-cell border ripple class="menuItem">
        <text>导出</text>
        <var-icon name="upload" :size="sidebarIconSize"/>
    </var-cell>
    <var-cell border ripple class="menuItem" @click="fullscreen = !fullscreen">
        <text>全屏</text>
        <var-switch v-model="fullscreen" :size="sidebarIconSize/2" @click.stop/>
    </var-cell>
    <var-cell border ripple class="menuItem" @click="settings.showDat = !settings.showDat">
      <text>设置</text>
      <var-switch v-model="settings.showDat" :size="sidebarIconSize/2" @click.stop/>
    </var-cell>
    <var-cell border ripple class="menuItem" @click="settings.mcEnabled = !settings.mcEnabled">
      <text>动捕</text>
      <var-switch v-model="settings.mcEnabled" :size="sidebarIconSize/2" @click.stop/>
    </var-cell>
    <var-cell border ripple class="menuItem" @click="screenshot">
      <text>截屏</text>
      <var-icon name="camera" size="30"/>
    </var-cell>
    <var-button type="primary" block @click="addSphere">
      左侧弹出
    </var-button>
  </var-paper>
  <var-paper class="slidebar" v-if="visible" :elevation="12">
      <var-cell border class="top" :elevation="24" >
        <var-swipe indicator-color="gray" @change="(index) => {addpointer = index}">
          <var-swipe-item class="swipe-item">
              <var-cell >
              <var-icon name="src/assets/icons/立方体.svg" size="20"/>
              网格
              </var-cell>
          </var-swipe-item>
          <!-- <var-swipe-item class="swipe-item">
              <var-cell >
              <var-icon name="white-balance-sunny" size="20"/>
              光源
              </var-cell>
          </var-swipe-item>
          <var-swipe-item class="swipe-item">
              <var-cell >
              <var-icon name="src/assets/icons/声音.svg" size="20"/>
              声音
              </var-cell>
          </var-swipe-item> -->
          <var-swipe-item class="swipe-item">
              <var-cell >
              <var-icon name="image" size="20"/>
              背景
              </var-cell>
          </var-swipe-item>
        </var-swipe>
      </var-cell>
      <div class="down">

        <var-image v-if="addpointer == 0" :src="`src/assets/preview/models/${i.split('.')[0]}.jpg`" ripple :radius="10" class="footImages" v-for="i in modelUrls" :key="i"
        :elevation="8" draggable="true" @click="addmodel(i)"/>

        <var-image v-if="addpointer == 1"  ripple :radius="10" class="footImages" v-for="(item, index) in mapUrls" :key="index" :src="`src/assets/preview/textures/${item}.jpg`"
        :elevation="8" draggable="true" @click="loadMap(index, item)"/>

      </div>
    </var-paper>

      <var-paper :elevation="12" :radius="10" class="lhalf">
        <div ref="canvasdom" ></div>
      </var-paper>


    <div :class="[!fullscreen ? 'half' : 'noDisplay']" ref="videoPlayer">
      <var-paper :elevation="12" :radius="10" class="skeleton">
        <!-- <video class="input_video" width="430" height="300" autoplay src="./assets/videos/1.只因你太美（鸡你太美）原版(Av51818204,P1).mp4"
        muted="true" controls v-if="props.type == 'video' && showVideo == true" ref="videoPlayer"></video> -->
        <!-- <video class="input_video" width="430" height="300" autoplay src="./assets/videos/1.只因你太美（鸡你太美）原版(Av51818204,P1).mp4"
        muted="true" controls ref="videoPlayer"></video> -->
        <video class="input_video" width="500" height="500"></video>
        <!-- <input type="file" ref="inputVideo" v-if="props.type == 'video'"> -->
      </var-paper>
      <var-paper :elevation="12" :radius="10" class="skeleton" >
        <!-- <canvas class="output_canvas" :width="videoSize.width" :height="videoSize.height" :style="{'display': loading ? 'none' : 'flex'}" ></canvas> -->
        <canvas class="output_canvas" width="500" height="500" :style="{'display': loading ? 'none' : 'flex'}" ></canvas>

        <var-loading v-show="loading" type="wave" size="large"/>

      </var-paper>
    </div>

  </var-paper>
</template>

<style lang="scss" scoped>
$blueHeavy: #4747d6;
$blueFull: #636b80d3;
$blueLite: #3252b167;
$sidebarFontSize: 20px;

@keyframes flash {
  /* 在0%时，透明度为0 */
  0% {
    opacity: 1;
  }

  /* 在50%时，透明度为1 */
 50% {
    opacity: 0;
 }

 /* 在100%时，透明度为0 */
100% {
    opacity: 1;
 }
}
@mixin center{
  display: flex;
  justify-content: center;
  align-items: center;
}
/* 将滚动条设置为红色 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background-color: #f5f5f5;
  display: none;
}
::-webkit-scrollbar-thumb {
  background-color: gray;
  border-radius: 10px;
  display: none;
}
:deep(.root) {
  width: 100%;
  border-radius: 15px;
  padding: 5%;
}
:deep(.var-swipe){
  overflow: hidden;
  user-select: none;
  width: 100%;
  height: 100%;
}
:deep(.var-cell){
  width: 100%;
  font-size: 20px;
}
:deep(.var-cell__content){
  @include center();
  justify-content: space-around;
  width: 100%;
  height: 100%;
}
// :deep(.var-swipe__indicators){
//   bottom: 0;
// }
.mcContainer{
  display: flex;
  width: 100vw;
  height: 100vh;
  align-items: center;
  .sidebar{
      width: 8%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
      //background-color: $blueLite;
      flex-shrink: 0;
      padding-bottom: 6%;
      .menuItem{
        width: 100%;
        display: flex;
        flex: 1;
        justify-content: space-between;
        align-items: center;
        //margin: 2%;
        //padding: 10%;
        font-size: $sidebarFontSize;
        cursor: pointer;
      }
      .withSwitch{
        align-items: flex-start;
        justify-content: space-between;
      }
    }
    .slidebar{
      height: 100%;
      width: 10vw;
      padding-bottom: 1%;
      display: flex;
      flex-shrink: 0;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      transition: transform 0.5s ease-out;
      //margin-left: 1%;
      //border: 5px solid $blueFull;
      .top{
        @include center();
        width: 100%;
        height: 5%;
        padding: 0;
        //background-color: gray;
        padding-left: 2%;
        align-items: center;
        font-size: 20px;
        //border-bottom: 5px solid $blueFull;
        :deep(.var-cell__content){
          @include center();
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .swipe-item {
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
          @include center();
          font-size: 20px;
        }
      }
      .down{ display: flex;
        align-items: center;
        flex-direction: column;
        overflow: auto;
        width: 100%;
        flex: 1;
        .footImages{
          width: 80%;
          aspect-ratio: 1 / 1;
          flex-shrink: 0;
          //border: 2px solid $blueLite;
          margin-top: 15px;
        }
      }
    }
    .noDisplay{
      display: none;
    }
    .lhalf{
      display: flex;
      flex-shrink: 0;
      flex-grow: 1;
      height: 95%;
      width: 42vw;
      margin: 1vw;
      // animation-name: flash;
      // /* 设置动画持续时间为1秒 */
      // animation-duration: 1s;
      //border: 2px solid black;
    }
    .half{
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      height: 95%;
      margin: 1%;
      flex-shrink: 0;
      //border: 2px solid black;
      .skeleton{
        @include center();
        flex-direction: column;
        flex-shrink: 0;
        width: 500px;
        height: 500px;
      }
    }


}
</style>
