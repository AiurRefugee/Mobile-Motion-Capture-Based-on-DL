<script setup>
import { onMounted, ref, watch, nextTick} from 'vue'
import mc from './mc.vue'
import '@varlet/touch-emulator'
import { StyleProvider, Themes } from '@varlet/ui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { gsap } from 'gsap'
const loader = new GLTFLoader();
// Optional: Provide a DRACOLoader instance to decode compressed mesh data
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( 'three/examples/js/libs/draco/gltf' );
loader.setDRACOLoader( dracoLoader );

let nullVec = new THREE.Vector3(0, 0, 0)

//ref
const canvasdom = ref(null)
var inputType = ref(null)
const cubeMapLoader = ref(new THREE.CubeTextureLoader())
var currentTheme = ref(null)
const topbarIconSize = 40
var showMediapipe = ref(false)
var showThree = ref(false)
var showVue = ref(false)
var showVarletUI = ref(false)
let stats = new Stats();
var mcVisible = ref(false)

function changeTheme() {
  currentTheme.value = currentTheme.value ? null : Themes.dark
  if(currentTheme.value) {
    loadMap('MilkyWay')
  } else {
    loadMap('skybox')
  }
  StyleProvider(currentTheme.value)
}
function showleft() {
  left.value = !left.value

}
let actions, mixer, idleAction, walkAction, runAction

const canvas = document.getElementById('background-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputEncoding = THREE.sRGBEncoding;
const controls = new OrbitControls(camera, renderer.domElement)

const light = new THREE.AmbientLight(0xffffff, 1);
const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 )
hemiLight.position.set( 0, 5, 0 )
scene.add( hemiLight );

const dirLight = new THREE.DirectionalLight( 0xffffff )
dirLight.position.set( - 3, 5,  -5 )
dirLight.castShadow = true
dirLight.shadow.camera.top = 20
dirLight.shadow.camera.bottom = - 20
dirLight.shadow.camera.left = - 20
dirLight.shadow.camera.right = 20
dirLight.shadow.camera.near = 0.1
dirLight.shadow.camera.far = 40
dirLight.shadow.mapSize.width = 2048 // default 512
dirLight.shadow.mapSize.height = 2048 // default
scene.add( dirLight );

scene.background = new THREE.Color(0xbfe3dd)
scene.add(light);

let geometry = new THREE.BufferGeometry()

const genCubeUrls = function ( prefix, postfix ) {

  return [
    prefix + 'px' + postfix, prefix + 'nx' + postfix,
    prefix + 'py' + postfix, prefix + 'ny' + postfix,
    prefix + 'pz' + postfix, prefix + 'nz' + postfix
  ];

};




function trans( x, y, z, input ) {
  gsap.to(
    camera.position,{
      x: x,//20
      y: y,//40
      z: z,//20
      duration: 2,
      onComplete: () => {
        inputType.value = input
        mcVisible.value = !mcVisible.value
      },
      onUpdate: () => { // 更新相机朝向
        camera.lookAt(nullVec);
      },
    }
  )
  //mcVisible.value = !mcVisible.value
}

async function returnApp() {
  mcVisible.value = false
  await nextTick()
  canvasdom.value.appendChild(renderer.domElement)
  gsap.to(
    camera.position,{
      x: 0,
      y: 10,
      z: 55,
      duration: 2,
      onUpdate: () => { // 更新相机朝向
        camera.lookAt(0, 20, 0)
      },
    }
  )
}
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 256 );

function loadMap(url) {

  const urls = genCubeUrls( 'src/assets/textures/' + url + '/', '.jpg' );

  cubeMapLoader.value.load( urls, function ( cubeTexture ) {

  cubeTexture.encoding = THREE.sRGBEncoding;

  scene.background = cubeTexture;

  } )
}

loadMap('skybox')

const waterGeometry = new THREE.PlaneGeometry( 50000, 50000 );

let water = new Water(
  waterGeometry,
  {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load( 'src/assets/textures/waternormals.jpg', function ( texture ) {

      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    } ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
  }
);

water.rotation.x = - Math.PI / 2;

scene.add( water );

const clock = new THREE.Clock();
const time = clock.getElapsedTime();

function animate() {
  requestAnimationFrame(animate);
  water.material.uniforms[ 'time' ].value += 1.0 / 120.0;
  renderer.render(scene, camera);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();
  if(mixer){
    mixer.update(delta);
  }
}

loader.load(
  // resource URL
  'src/assets/models/Soldier.glb',
  // called when the resource is loaded
  function ( gltf ) {

    let model = gltf.scene;
    console.log(model)
    scene.add( model );
    model.position.z = 2
    model.traverse( function ( object ) {

      if ( object.isMesh ) object.castShadow = true;
      //console.log(object.name, object.parent.name)
    } );
    model = gltf.scene;
    model.scale.set(10, 10, 10)
    scene.add( model );
    camera.position.set(0, 10, 55)
    camera.lookAt(0, 20, 0)
    model.traverse( function ( object ) {

      if ( object.isMesh ) object.castShadow = true;

    } );

    //

    let skeleton = new THREE.SkeletonHelper( model );
    skeleton.visible = false;
    scene.add( skeleton );

    const animations = gltf.animations;

    // 创建骨骼和动画混合器
    mixer = new THREE.AnimationMixer(model);

    // 将动画添加到混合器中，并播放动画
    const animation = mixer.clipAction(animations[3]);
    animation.play();
    animate();

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

onMounted( () => {
  console.log('onMounted')

  canvasdom.value.appendChild(renderer.domElement)

  // setInterval( () => {
  //   console.log(camera.position)
  // }, 100)



})
</script>

<template>

  <div class="appContainer" v-if="!mcVisible">
    <div class="three" ref="canvasdom"></div>
    <var-popup v-model:show="showMediapipe" position="left" style="width: 20vw;">
      <var-cell border>
        <var-image src="src/assets/preview/textures/m1.png"></var-image>
      </var-cell>
      <var-cell>MediaPipe是一个多平台的，性能优秀的深度学习工具包，提供了实现面部检测，面部网格体检测，手势识别，3维人体姿态估计等功能，并且提供了丰富的接口，包括c++，python，和javascript。</var-cell>
    </var-popup>
    <var-popup v-model:show="showThree" position="left" style="width: 20vw;">
      <var-cell border>
        <var-image src="src/assets/preview/textures/m2.png"></var-image>
      </var-cell>
      <var-cell>Three.js是一个尽可能简化在网页端获取3D 内容的库。Three.js经常会和WebGL混淆， 但也并不总是，three.js其实是使用WebGL来绘制三维效果的。 WebGL是一个只能画点、线和三角形的非常底层的系统. 想要用WebGL来做一些实用的东西通常需要大量的代码， 这就是Three.js的用武之地。它封装了诸如场景、灯光、阴影、材质、贴图、空间运算等一系列功能，让你不必要再从底层WebGL开始写起。</var-cell>
    </var-popup>
    <var-popup v-model:show="showVue" position="left" style="width: 20vw;">
      <var-cell border>
        <var-image src="src/assets/preview/textures/m3.png"></var-image>
      </var-cell>
      <var-cell>Vue 是一个框架，也是一个生态。其功能覆盖了大部分前端开发常见的需求。但 Web 世界是十分多样化的，不同的开发者在 Web 上构建的东西可能在形式和规模上会有很大的不同。考虑到这一点，Vue 的设计非常注重灵活性和“可以被逐步集成”这个特点。</var-cell>
    </var-popup>
    <var-popup v-model:show="showVarletUI" position="left" style="width: 20vw;">
      <var-cell border>
        <var-image src="src/assets/preview/textures/varlet.png"></var-image>
      </var-cell>
      <var-cell>Varlet 是一个基于 Vue3 开发的 Material 风格移动端组件库，全面拥抱 Vue3 生态，由社区团队维护。支持 Typescript、按需引入、暗黑模式、主题定制、国际化，并提供 VSCode 插件保障良好的开发体验。</var-cell>
    </var-popup>
    <var-cell border class="topBar">
    <div class="title">Motion Capture Based on DeepLearning</div>
      <div class="topbarIcons">
        <var-row style="width:100%" align="center" justify="flex-end" :gutter="20">
          <var-col :span="1" justify="center">
            <var-link text-size="20" underline="hover" @click="showMediapipe = !showMediapipe">Mediapipe</var-link>
          </var-col>
          <var-col :span="1" justify="center">
            <var-link text-size="20" underline="hover" @click="showThree = !showThree">Three</var-link>
          </var-col>
          <var-col :span="1" justify="center">
            <var-link text-size="20" underline="hover" @click="showVue = !showThree">Vue</var-link>
          </var-col>
          <var-col :span="1" justify="center">
            <var-link text-size="20" underline="hover" @click="showVarletUI = !showVarletUI">Varlet UI</var-link>
          </var-col>
          <var-col :span="1" justify="center">
            <var-icon :name="`${!currentTheme ? 'white-balance-sunny' : 'weather-night'}`" @click="changeTheme" :size="topbarIconSize" :transition="400"/>
          </var-col>
          <var-col :span="1" justify="center">
            <var-icon name="github" :size="topbarIconSize"/>
          </var-col>
        </var-row>


      </div>
    </var-cell>
    <div class="main">
      <div class="showArea">


        <var-row class="inputIcons" justify="center" align="center">
          <var-col :span="6" justify="justify" direction="column" @click="trans(20, 30, 0, 'image')">
              <var-icon name="image" size="200"></var-icon>
              <div class="text">从图片输入</div>
          </var-col>
          <var-col :span="6" justify="justify" direction="column" @click="trans(-20, 30, 0, 'video')">
              <var-icon name="play-circle" size="200"></var-icon>
              <div class="text">从视频输入</div>
          </var-col>
          <var-col :span="6" justify="justify" direction="column" @click="trans(10, 40, -20, 'camera')">
              <var-icon name="radio-marked" size="200"></var-icon>
              <div class="text">从摄像头输入</div>
          </var-col>
        </var-row>
      </div>
    </div>
  </div>
  <mc v-else v-on:returnApp="returnApp" :type="inputType"></mc>
</template>

<style lang="scss" scoped>
$blueHeavy: #4747d6;
$blueFull: #636b80d3;
$blueLite: #3252b167;
$sidebarFontSize: 30px;
div{
  //border: 2px solid black;
  // margin: 5px;
}
@mixin center{
  display: flex;
  justify-content: center;
  align-items: center;
}
:deep(.var-swipe){
  overflow: hidden;
  user-select: none;
  width: 100%;
  height: 100%;
}
:deep(.var-swipe__indicators){
  margin-bottom: 2%;
}
:deep(.var-cell){
  width: 100%;
  font-size: 20px;
}
:deep(.var-col){
  justify-content: center;
}
:deep(.var-cell__content){
  @include center();
  justify-content: space-around;
  width: 100%;
  height: 100%;
}
:deep(.var-swipe__indicators){
  bottom: 0;
}

.appContainer{
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  justify-content: space-between;
  align-items: center;
  position: relative;
  .three{
    position: absolute;
    left: 0;
    top: 0;
  }
  .popup-example-block {
    padding: 20px 24px;
    width: 250px;
    height: 100vh;
  }
  .topBar{
    width: 100%;
    height: 8%;
    display: flex;
    justify-content: space-between;
    .title{
      width: 50%;
      height: 90%;
      font-size: 2vw;
      padding-right: 1%;
      font-style: italic;
      @include center();
      padding-left: 1%;
      justify-content: flex-start;
      font-weight: 900;
      font-family: math;
    }
    .topbarIcons{
      flex: 1;
      height: 90%;
      @include center();
      justify-content: flex-end;
    }
    :deep(.var-icon){
      margin: 1%;
      cursor: pointer;
    }
  }
  .main{
    display: flex;
    width: 80vw;
    flex-grow: 1;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .showArea{
      width: 80%;
      height: 70%;
      display: flex;
      justify-content: flex-start;
      padding-top: 5%;
      align-items: center;
      flex-direction: column;

      :deep(.var-col){
        justify-content: center;
      }
      .inputIcons{
        width: 100%;
        @include center();
        justify-content: space-between;
        .text{
          @include center();
          font-size: 40px;
        }
      }
    }
  }

}
</style>
