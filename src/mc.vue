<script setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { onMounted, ref, watch, nextTick, getCurrentInstance } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { StyleProvider, Themes } from '@varlet/ui'
import { TransformControls } from './TransformControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
// import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
// import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
// import { Camera } from "@mediapipe/camera_utils";
// import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
// import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader.js';
// import { MMDAnimationHelper } from 'three/examples/jsm/animation/MMDAnimationHelper.js';
const loader = new GLTFLoader();
// Optional: Provide a DRACOLoader instance to decode compressed mesh data
const dracoLoader = new DRACOLoader();
const gltfExporter = new GLTFExporter();
dracoLoader.setDecoderPath( 'three/examples/js/libs/draco/gltf' );
loader.setDRACOLoader( dracoLoader );
const cubeMapLoader = new THREE.CubeTextureLoader()
let outputCamera
let model, INTERSECTED
let keypoint = []
const link = document.createElement( 'a' );
link.style.display = 'none';
let arrowHelperFront
let arrowHelperUp
let image
let arrowHelperRight
let skeleton
let x = new THREE.Vector3(1, 0, 0)
let y = new THREE.Vector3(0, 1, 0)
let z = new THREE.Vector3(0, 0, 1)
let nX = new THREE.Vector3(-1, 0, 0)
let nY = new THREE.Vector3(0, -1, 0)
let nZ = new THREE.Vector3(0, 0, -1)
let rightVec = new THREE.Vector3(1, 0, 0)
let frontVec = new THREE.Vector3(1, 0, 0)
let upVec = new THREE.Vector3(1, 0, 0)
let nullVec = new THREE.Vector3(0, 0, 0)
const raycaster = new THREE.Raycaster()
raycaster.far = Number.MAX_VALUE
raycaster.near = 10
const mouse = new THREE.Vector2()
var lastSelected = null
var lastSelectTime = new Date().getTime()
var lastColor = null
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 256 );
const cubeCamera = new THREE.CubeCamera( 1, 1000, cubeRenderTarget );
let guiFolder = new GUI({ autoPlace: false})
let ratioSettings = {
  'threshold': 0.8,
  'cameraRotationFixRatio': 1,
  'head': 1,
  'shoulder': 1,
  'foreArm': 1,
  'arm': 1,
  'waist': 1,
  'upLeg': 1,
  'leg': 1
}
let lightsSettings = {
  'intensity': 0.4,
  'target': {
    'position': {
      'x': 0,
      'y': 0,
      'z': 0
    }
  }
}

let debugSettings = {
  keypointVisible: false,
  axesHelperVisible: false
}
//config
//let baseurl = 'https://4900795f7g.goho.co:443/'
let baseurl = ''


//props
const props = defineProps(['type'])

//ref
var videoWidth = ref( 500 )
var videoHeight = ref( 450)
var inputVisible = ref(true)
var isMobile = ref( false )
let gui = ref(null)
var loading = ref(true)
var src = ref(null)
var nowSelect = ref(null)
var videoPlayer = ref( null )
var showInput = ref( false )
let inputVideo = ref( null )
let inputImage = ref( null )
const finished = ref(false)
var showlist = ref(false)
const video = ref(null)
var sidebarIconSize = ref(25)
var visible = ref(false)
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
const modelBaseUrl = baseurl + 'src/assets/models/'
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
axesHelper.visible = debugSettings.axesHelperVisible
scene.add(axesHelper)

//scene.add( hemiLight );
const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 )
hemiLight.position.set( 0, 5, 0 )
scene.add( hemiLight );

const dirLight = new THREE.DirectionalLight( 0xffffff )
dirLight.position.set( - 30, 50,  -50 )
dirLight.intensity = lightsSettings.intensity
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
scene.add( dirLight.target )

function updateLight() {
  dirLight.target.updateMatrixWorld();
  lightHelper.update();
}


let lightHelper = new THREE.DirectionalLightHelper( dirLight );
scene.add( lightHelper );


const texture = new THREE.TextureLoader().load('src/assets/textures/brick.jpg');
texture.wrapS = THREE.RepeatWrapping; // 在横向上重复纹理
texture.wrapT = THREE.RepeatWrapping; // 在纵向上使用边缘颜色填充
texture.repeat.set(100, 100)
console.log(texture)

const planeMaterial = new THREE.MeshLambertMaterial({
  map: texture,
});
const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 5000, 5000 ), planeMaterial);
mesh.rotation.x = - Math.PI / 2
mesh.receiveShadow = true
mesh.name = 'brick'
console.log(mesh)
scene.add( mesh )

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
  let mcratio = guiFolder.addFolder( 'Ratios' )
  mcratio.add( ratioSettings, 'head' , 0.5, 2 )
  mcratio.add( ratioSettings, 'shoulder' , 0.5, 2 )
  mcratio.add( ratioSettings, 'foreArm' , 0.5, 2 )
  mcratio.add( ratioSettings, 'arm' , 0.5, 2 )
  mcratio.add( ratioSettings, 'waist' , 0.5, 2 )
  mcratio.add( ratioSettings, 'upLeg' , 0.5, 2 )
  mcratio.add( ratioSettings, 'leg' , 0.5, 2 )
  let threshold = guiFolder.addFolder( 'MotionCapture Threshold' )
  threshold.add( ratioSettings, 'threshold', 0.5, 0.95 )
  threshold.add( ratioSettings, 'cameraRotationFixRatio', 0.2, 1 )
  let lightRatio = guiFolder.addFolder( 'LightSettings')
  lightRatio.add(dirLight, 'intensity', 0, 2, 0.01).onChange(updateLight);
  lightRatio.add(dirLight.target.position, 'x', -10, 10).onChange(updateLight);
  lightRatio.add(dirLight.target.position, 'z', -10, 10).onChange(updateLight);
  lightRatio.add(dirLight.target.position, 'y', 0, 10).onChange(updateLight);
}

//加载背景天空盒
function loadMap(index, url) {

  if(index == 0){
    scene.background = new THREE.Color( 0xbfe3dd )
  } else {

    const urls = genCubeUrls( baseurl + 'src/assets/textures/' + url + '/', '.jpg' );

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

//导出

function saveString( text, filename ) {
  save( new Blob( [ text ], { type: 'text/plain' } ), filename );
}


function saveArrayBuffer( buffer, filename ) {
  save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}

function save( blob, filename ) {

  link.href = URL.createObjectURL( blob );
  link.download = filename;
  link.click();

  // URL.revokeObjectURL( url ); breaks Firefox...

}

function exportScene() {
  gltfExporter.parse(
    scene,
    function ( result ) {

      if ( result instanceof ArrayBuffer ) {

        saveArrayBuffer( result, 'scene.glb' );

      } else {

        const output = JSON.stringify( result, null, 2 );
        saveString( output, 'scene.gltf' );

      }

    },
    function ( error ) {

      console.log( 'An error happened during parsing', error );

    }
  )
}

function hide() {
  transformControls.visible = !transformControls.visible
  skeleton.visible = !skeleton.visible
  arrowHelperFront.visible = !arrowHelperFront.visible
  arrowHelperRight.visible = !arrowHelperRight.visible
  arrowHelperUp.visible = !arrowHelperUp.visible
  lightHelper.visible = !lightHelper.visible
}

//截图
function screenshot() {
  if(lastSelected){
    lastSelected.material.color.set(0xffffff)
  }
  hide()
  renderer.render(scene, camera)
  const dataURL = renderer.domElement.toDataURL();

  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'screenshot.png';

  document.body.appendChild(link);
  link.click();
  hide()
  canvasdom.value.animate([{opacity: 1, easing: 'ease-in-out'}, {opacity: 0.3, easing: 'ease-in-out'}, {opacity: 1, easing: 'ease-in-out'}], 300)
}

//更新画布
function updateThree() {
  let width = Math.ceil(document.getElementsByClassName('lhalf')[0].clientWidth + 1)
  let height = Math.ceil(document.getElementsByClassName('lhalf')[0].clientHeight + 1)
  camera.aspect = width / height
  camera.updateProjectionMatrix();
  renderer.setSize(width, height)
  if( window.innerWidth < 700){
    videoWidth.value = 250
    videoHeight.value = 150
  } else {
    videoWidth.value = 500
    videoHeight.value = 450
  }
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
    spheremesh.visible = debugSettings.keypointVisible
    keypoint.push(spheremesh)
    scene.add(spheremesh)
  }
//删除物体
function remove() {
  if(nowSelect ){
    transformControls.detach()
    console.log(nowSelect)
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
      addmodel.scale.set(5, 5, 5)
      addmodel.traverse( function ( object ) {

      if ( object.isMesh )
        object.castShadow = true;
      //console.log( object.name, object.parent.name)
      } );
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
    // 更新选择器的状态
    raycaster.setFromCamera(mouse, camera);
    // 获取被选中的物体
    const intersects = raycaster.intersectObjects(scene.children, true);
    if(intersects.length) {
      lastColor = intersects[0].object.material.color
      // 遍历所有被选中的物体
      for(const item of intersects){
        if( item.object.isMesh && !item.object.isTransformControlsPlane ) {
          nowSelect = item.object
          if( item.object.name != 'brick'){
            transformControls.visible = true
            item.object.material.emissive.setHex( 0x003300 );
          }

          if( lastSelected ) {
            lastSelected.material.emissive.setHex( 0x000000 );
          }
          break
        }
      }
      lastSelected = nowSelect
      recursiveSelect()
      transformControls.attach(nowSelect)
    }
  }
);

function recursiveSelect() {
  while(!nowSelect.parent.isScene) {
    nowSelect = nowSelect.parent
  }
}

//返回首页
function returnApp() {
  //outputCamera.stop()
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

function vectersToRotateMatrix( up, right, front){
  return new THREE.Matrix4().set(
    right.x, front.x, up.x, 0,
    right.y, front.y, up.y, 0,
    right.z, front.z, up.z, 0,
    0, 0, 0, 1
  )
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

    if ( object.isMesh )
      object.castShadow = true;
    //console.log( object.name, object.parent.name)
  } );


  skeleton = new THREE.SkeletonHelper( model );

  const direction = new THREE.Vector3(1, 0, 0)

  const origin = new THREE.Vector3(skeleton.bones[2].position.x, skeleton.bones[2].position.y, skeleton.bones[2].position.z);
  const length = 10;
  const color = 0xff0000;
  const headLength = 0.2 * length;
  const headWidth = 0.2 * headLength;

  arrowHelperFront = new THREE.ArrowHelper(new THREE.Vector3( 0, -0.8, 0.5 ), origin, length, new THREE.Color(0xff0000), headLength, headWidth)
  arrowHelperUp = new THREE.ArrowHelper(new THREE.Vector3( 0, 0.5, 0.8 ), origin, length, new THREE.Color(0x00ff00), headLength, headWidth)
  arrowHelperRight = new THREE.ArrowHelper(new THREE.Vector3( 1, 0, 0 ), origin, length, new THREE.Color(0x0000ff), headLength, headWidth)

  scene.add(arrowHelperFront);
  scene.add(arrowHelperUp)
  scene.add(arrowHelperRight)


  let PI = Math.PI
  let Euler = new THREE.Euler( PI / 2, 0  , 0, 'XYZ' )
  skeleton.bones[0].setRotationFromEuler( Euler )

  skeleton.bones[24].rotation.set(PI / 3, 0, 0)
  console.log(skeleton.bones[24].rotation)

  //右，上, 前
  let matrix = new THREE.Matrix4().makeRotationFromEuler(  skeleton.bones[24].rotation
  )
  matrix.extractBasis(rightVec, frontVec, upVec)
  console.log(matrix)

  skeleton.visible = true
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
  skeleton.bones[skeletonIndex].rotation.set(0, angleToNZ * ratio, angleToY * ratio)

}

//更新大腿
function updateUpLeg( target, parentX, parentZ, skeletonIndex, right, ratio) {
  skeleton.bones[skeletonIndex].rotation.set( Math.PI, 0, 0 )
  let setX = target.clone().setX(0).angleTo(parentX) * ( target.z > 0 ? 1 : -1 )
  let setZ = target.clone().setZ(0).angleTo(parentZ) * ( target.x < 0 ? 1 : -1 )
  skeleton.bones[skeletonIndex].rotateX(setX * ratio)
  skeleton.bones[skeletonIndex].rotateZ(setZ * ratio)
}

//更新小腿
function updateLeg( target, parentX, parentZ, skeletonIndex, right, ratio) {
  let setX = target.clone().setX(0).angleTo(parentX) * ( target.z > 0 ? 1 : -1 )
  let setZ = target.clone().setZ(0).angleTo(parentZ) * ( target.x < 0 ? 1 : -1 )
  skeleton.bones[skeletonIndex].rotation.set( setX * ratio, 0, setZ * ratio )
}

function updateSkeleton(array) {
  let up = new THREE.Vector3(0, 1, 0)

  //waist
  let midright = calculateTargetVector(array[23], array[24])
  let midfront = new THREE.Vector3().crossVectors(midright, up).normalize()
  let setY = midfront.clone().setY(0).angleTo(z) * ( midfront.x < 0 ? 1 : -1 )
  if (array[23].visibility > ratioSettings.threshold && array[23].visibility > ratioSettings.threshold){
    skeleton.bones[0].rotation.set(Math.PI / 2,setY * ratioSettings.waist, 0)
  }

  //skeleton[3]
  let right = calculateTargetVector(array[11], array[12])
  let front = new THREE.Vector3().crossVectors(right, up).normalize()
  let upVec = new THREE.Vector3().crossVectors(front, right).normalize()
  if (array[11].visibility > ratioSettings.threshold && array[12].visibility > ratioSettings.threshold){
    updateHorizontalBones( front, upVec, right, z, y, x, 3 , ratioSettings.shoulder)
    updateHorizontalBones( front, upVec, right, z, y, x, 2 , ratioSettings.shoulder * 0.8)
    updateHorizontalBones( front, upVec, right, z, y, x, 1 , ratioSettings.shoulder * 0.4)
  }

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
  if (array[4].visibility > ratioSettings.threshold || array[10].visibility > ratioSettings.threshold){
    skeleton.bones[5].rotation.set( rYZ * ratioSettings.head - Math.PI / 4, rXZ * ratioSettings.head, rXY * ratioSettings.head )
  }


  //rightForeArm
  let rightForeArm = calculateTargetVector(array[14], array[12])
  //rightArm
  let rightArm = calculateTargetVector(array[16], array[14])

  let rightForeArmRight = new THREE.Vector3().crossVectors(rightForeArm, rightArm)
  let rightForeArmUp = new THREE.Vector3().crossVectors( rightForeArmRight, rightForeArm )

  let mat = new THREE.Matrix4().set(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  )
  let El = new THREE.Euler().setFromRotationMatrix(mat)

  //rightForeArm
  if (array[14].visibility > ratioSettings.threshold || array[12].visibility > ratioSettings.threshold){
    updateLimbBones( rightForeArm, right.clone().negate(), 24, true, ratioSettings.foreArm )
    //skeleton.bones[24].rotation.copy(El)
  }


  //rightArm
  if (array[16].visibility > ratioSettings.threshold || array[14].visibility > ratioSettings.threshold){
    updateLimbBones( rightArm, rightForeArm, 25, true, ratioSettings.arm )
  }

  //rightHand
  let rightHand = calculateTargetVector(array[20], array[16])
  //updateLimbBones( rightHand, rightArm, 26, true, 1 )

  //rightUpLeg
  let rightUpLeg = calculateTargetVector(array[26], array[24])
  if (array[26].visibility > ratioSettings.threshold || array[24].visibility > ratioSettings.threshold){
    updateUpLeg( rightUpLeg, nY, nY, 45, true, true, ratioSettings.upLeg )
  }

  //rightLeg
  let rightLeg = calculateTargetVector(array[28], array[26])
  if (array[26].visibility > ratioSettings.threshold || array[28].visibility > ratioSettings.threshold){
    updateLeg( rightLeg, rightUpLeg.setX(0), rightUpLeg.setZ(0).setZ(0), 46, true, ratioSettings.leg )
  }


  //leftForeArm
  let leftForeArm = calculateTargetVector(array[13], array[11])
  if (array[26].visibility > ratioSettings.threshold || array[24].visibility > ratioSettings.threshold){
    updateLimbBones( leftForeArm, right, 7, false, ratioSettings.foreArm )
  }

  //leftArm
  let leftArm = calculateTargetVector(array[15], array[13])
  if (array[15].visibility > ratioSettings.threshold || array[13].visibility > ratioSettings.threshold){
    updateLimbBones( leftArm, leftForeArm, 8, false, ratioSettings.arm )
  }

  //leftUpLeg
  let leftUpLeg = calculateTargetVector(array[25], array[23])
  if (array[25].visibility > ratioSettings.threshold || array[23].visibility > ratioSettings.threshold){
    updateUpLeg( leftUpLeg, nY, nY, 41, true, ratioSettings.upLeg)
  }

  //leftLeg
  let leftLeg = calculateTargetVector(array[27], array[25])
  if (array[27].visibility > ratioSettings.threshold || array[25].visibility > ratioSettings.threshold){
    updateLeg( leftLeg, leftUpLeg.setX(0), leftUpLeg.setZ(0).setZ(0), 42, true, ratioSettings.leg )
  }


    arrowHelperFront.setDirection(rightForeArm)
    arrowHelperUp.setDirection(rightForeArmUp)
    arrowHelperRight.setDirection(rightForeArmRight)

}

onMounted( async () => {
  if( window.innerWidth < 1000){
    isMobile.value = true
    videoWidth.value = 300
    videoHeight.value = 200
  }
  gui.value.appendChild(guiFolder.domElement)
  instance = getCurrentInstance()
  loadMap(1, 'pisa')
  canvasdom.value.appendChild(renderer.domElement)

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
    let angle, upVec
    let rotatedV = new THREE.Vector3()
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
      let array = results.poseWorldLandmarks.map((item) => {
        return {
          x: item.x * ratio,
          y: -item.y * ratio + bias,
          z: item.z * ratio,
          visibility: item.visibility
        }
      })
      let moveVec = new THREE.Vector3( 0, -(array[23].y + array[24].y) / 2, -(array[23].z + array[24].z) / 2)
      upVec = new THREE.Vector3(
        0,
        (array[11].y + array[12].y) / 2 - (array[23].y + array[24].y) / 2,
        (array[11].z + array[12].z) / 2 - (array[23].z + array[24].z) / 2
      )
      arrowHelperFront.setDirection(upVec.normalize())
      angle = upVec.lerp(y, ratioSettings.cameraRotationFixRatio).angleTo(y)
      console.log(RToA(angle))
      let rotatedArray = array.map( (item, index) => {
        let temp = new THREE.Vector3( item.x, item.y, item.z).add(moveVec) .applyAxisAngle( x, angle ).add(moveVec.clone().negate())
        return {
          x: temp.x,
          y: temp.y,
          z: temp.z,
          visibility: item.visibility
        }
      })

      keypoint.map( (value, index) => {
        value.position.set( rotatedArray[index].x, rotatedArray[index].y, rotatedArray[index].z)
      })
      updateSkeleton(rotatedArray)
    }
  }

  const pose = new Pose({locateFile: (file) => {
    return baseurl + `@mediapipe/pose/${file}`;
  }});
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    static_image_mode: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });
  pose.onResults(onResults);

  if( props.type == 'video') {

    const fileInput = inputVideo.value
    await nextTick()

    fileInput.addEventListener( "change", () => {
      const file = fileInput.files[0]
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.addEventListener( "load", async () => {
        showInput.value = !showInput.value
        await nextTick()
        const videoElement = document.getElementsByClassName('input_video')[0];
        console.log(file)
        videoPlayer.value.src = reader.result
        inputVisible.value = false
        videoElement.addEventListener("timeupdate", async () => {
          await pose.send({image: videoElement});
        })
      })

    })


  }

  if( props.type == 'image' ) {
    const fileInput = inputImage.value
    await nextTick()
    fileInput.addEventListener( "change", async () => {
      const file = fileInput.files[0]
      const reader = new FileReader()
      reader.addEventListener( "load", async () => {
        showInput.value = !showInput.value
        await nextTick()
        src.value = reader.result
        image = new Image()
        image.src = src.value
        inputVisible.value = false
        console.log(src.value)
        await pose.send({image: image})
      })
      reader.readAsDataURL(file)

    })


  }
  if( props.type == 'camera' ){
    inputVisible.value = false
    outputCamera = new Camera(videoElement, {
      onFrame: async () => {
        await pose.send({image: videoElement});
      },
      width: videoWidth.value,
      height: videoHeight.value
    });
    outputCamera.start();
    videoElement.addEventListener("timeupdate", async () => {
      await pose.send({image: videoElement});
    })
  }

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
    <div :border="false" ripple class="menuItem" :elevation="18" @click="returnApp">
        <div class="sidebarText">返回</div>
        <var-icon name="chevron-left" :size="sidebarIconSize" />
    </div>
    <div :border="false" ripple class="menuItem" @click="setmode(0)" :style="{'background-color': interactType == 0 ? '#636b80d3' : 'transparent'}">
        <div class="sidebarText">移动</div>
        <var-icon name="src/assets/icons/移动.svg" :size="sidebarIconSize" color="#2979ff"/>
    </div>
    <div :border="false" ripple class="menuItem" @click="setmode(1)" :style="{'background-color': interactType == 1 ? '#636b80d3' : 'transparent'}">
        <div class="sidebarText">旋转</div>
        <var-icon name="src/assets/icons/旋转.svg" :size="sidebarIconSize" color="#2979ff"/>
    </div>
    <div :border="false" ripple class="menuItem" @click="setmode(2)" :style="{'background-color': interactType == 2 ? '#636b80d3' : 'transparent'}">
        <div class="sidebarText">缩放</div>
        <var-icon name="src/assets/icons/缩放.svg" :size="sidebarIconSize"/>
    </div>
    <div :border="false" ripple class="menuItem" @click="visible = !visible; pointer = 0">
        <div class="sidebarText">编辑</div>
        <var-icon name="menu" :size="sidebarIconSize" v-if="!visible" :transition="300"/>
        <var-icon name="menu-open" :size="sidebarIconSize" v-else/>
    </div>
    <div :border="false" ripple class="menuItem" @click="remove">
        <div class="sidebarText">删除</div>
        <var-icon name="trash-can-outline" :size="sidebarIconSize"/>
    </div>
    <div :border="false" ripple class="menuItem" @click="exportScene">
        <div class="sidebarText">导出</div>
        <var-icon name="upload" :size="sidebarIconSize"/>
    </div>
    <div :border="false" ripple class="menuItem" @click="fullscreen = !fullscreen">
        <div class="sidebarText">全屏</div>
        <var-switch v-model="fullscreen" :size="sidebarIconSize/2" @click.stop/>
    </div>
    <div :border="false" ripple class="menuItem" @click="settings.mcEnabled = !settings.mcEnabled" v-if="props.type == 'camera'">
      <div class="sidebarText">动捕</div>
      <var-switch v-model="settings.mcEnabled" :size="sidebarIconSize/2" @click.stop/>
    </div>
    <div :border="false" ripple class="menuItem" @click="screenshot">
      <div class="sidebarText">截屏</div>
      <var-icon name="camera" size="30"/>
    </div>
  </var-paper>
  <var-paper class="slidebar" v-if="visible" :elevation="12">
      <var-cell :border="false" class="top" :elevation="24" >
        <var-swipe indicator-color="gray" @change="(index) => {addpointer = index}">
          <var-swipe-item class="swipe-item" >
              <var-cell >
                <var-icon name="src/assets/icons/立方体.svg" size="20"/>
                <div >网格</div>
              </var-cell>
          </var-swipe-item>
          <var-swipe-item class="swipe-item">
              <var-cell >
                <var-icon name="image" size="20"/>
                <div >背景</div>
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
    <div :class="[!fullscreen ? 'half' : 'noDisplay']">
      <var-paper :elevation="12" :radius="10" class="skeleton"  >
        <var-loading v-show="loading && !inputVisible" type="wave" size="large" style="top:45%"/>
        <input type="file" ref="inputImage" v-if="props.type == 'image' && inputVisible">
        <video class="input_video" :width="videoWidth" :height="videoHeight" ref="videoPlayer" v-if="props.type == 'video'" style="display: none;" autoplay controls muted></video>
        <input type="file" ref="inputVideo" v-if="props.type == 'video' && inputVisible" >
        <video class="input_video" :width="videoWidth" :height="videoHeight" style="display: none;" v-if="props.type == 'camera'" ></video>
        <canvas class="output_canvas" :width="videoWidth" :height="videoHeight" :style="{'display': loading && !inputVisible ? 'none' : 'flex','z-index': 1}"  ></canvas>
      </var-paper>
      <div class="gui" ref="gui"></div>
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
:deep(.var-swipe){
  overflow: hidden;
  user-select: none;
  width: 100%;
  height: 100%;
}
:deep(.var-swipe__indicators){
  bottom: 0;
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
:deep(.root){
  padding: 2%;
  border-radius: 15px;
  width: 100%;
}
:deep(.slider ){
  @media (max-width: 700px) {
    width: 150px;
  }
}
:deep(.controller){
  @media (max-width: 700px) {
    height: 30px;
  }
}
:deep(.title){
  @media (max-width: 700px) {
    height: 30px;
  }
}
.mcContainer{
  display: flex;
  width: 100vw;
  height: 100vh;
  align-items: center;
  @media (max-width: 700px) {
    //flex-direction: column;
    flex-direction: column-reverse;
  }
  .sidebar{
      width:8%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
      //background-color: $blueLite;
      flex-shrink: 0;
      padding-bottom: 6%;
      @media (max-width: 700px) {
        flex-direction: row;
        width: 100%;
        height: 6%;
        justify-content: flex-start;
        align-items: center;
        overflow: auto;
        padding-bottom: 0;
      }
      .menuItem{
        width: 100px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        //margin: 2%;
        padding: 1%;
        font-size: $sidebarFontSize;
        cursor: pointer;
        @media (max-width: 700px) {
          width: 100px;
          height: 100%;
          //flex-direction: column;
        }
        .sidebarText{
          width: 50px;
        }
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
      @media (max-width: 700px) {
        width: 100%;
        height: 10%;
        flex-direction: row;
        @include center()
      }
      //margin-left: 1%;
      //border: 5px solid $blueFull;
      .top{
        @include center();
        width: 100%;
        height: 5%;
        padding: 0;
        //padding-left: 2%;
        font-size: 20px;
        //border-bottom: 5px solid $blueFull;
        :deep(.var-cell__content){
          @include center();
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        @media (max-width: 700px) {
          width: 15%;
          height: 100%;
          padding-left: 0;
        }
        .swipe-item {
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
          //padding-left: 13%;
          @include center();
          font-size: 20px;
          @media (max-width: 700px) {
            width: 100%;
            height: 100%;
            //flex-direction: column;
          }
          :deep(.var-cell){
            padding: 0;
          }
        }
      }
      .down{
        display: flex;
        align-items: center;
        flex-direction: column;
        overflow: auto;
        width: 100%;
        flex: 1;
        @media (max-width: 700px) {
          height: 100%;
          flex: 1;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          overflow: auto;
        }
        .footImages{
          width: 80%;
          margin: 1%;
          aspect-ratio: 1 / 1;
          //flex-shrink: 0;
          //border: 2px solid $blueLite;
          margin-top: 15px;
          @media (max-width: 700px) {
            //height: 100%;
            aspect-ratio: 1;
            margin-top: 0;
          }
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
      @media (max-width: 700px) {
        height: 60%;
        width: 95%;
      }
    }
    .half{
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      height: 95%;
      margin: 1%;
      flex-shrink: 0;
      @media (max-width: 700px) {
        height: 20%;
        width: 95%;
        margin-top: 5%;
        flex-direction: row;
      }
      .skeleton{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        flex-shrink: 0;
        width: 500px;
        height: 500px;
        overflow: auto;
        border-radius: 10px;
        @media (max-width: 700px) {
          display: flex;
          height: 100%;
          width: 48%;
        }
      }

      .gui{
        width: 500px;
        height: 450px;
        overflow: auto;
        border-radius: 10px;
        //justify-content: flex-start;
        overflow: auto;
        flex: 1;
        @media (max-width: 700px) {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          height: 100%;
          width: 48%;
        }
      }
    }


}
</style>
