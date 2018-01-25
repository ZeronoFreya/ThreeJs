
if (!Detector.webgl) Detector.addGetWebGLMessage();
var container;
var objects = [];
var camera, controls, scene, renderer;

// var log = new Console(document.getElementById('console'));
var effectController;
var gui;
init();
animate();

function addControls(camera, target) {
  var te = new TouchEvent(container);
  var ctrl = new THREE.TrackballControls(camera, te);
  // var ctrl = new THREE.TrackballControls(camera);
  // var ctrl = new THREE.OrthographicTrackballControls(camera);
  ctrl.rotateSpeed = 1.0;
  ctrl.zoomSpeed = 1.2;
  ctrl.panSpeed = 0.3;
  ctrl.noZoom = false;
  ctrl.noPan = false;
  ctrl.staticMoving = false;
  ctrl.dynamicDampingFactor = 0.2;

  camera.lookAt(target);
  // ctrl.target = target;
  ctrl.setTarget(target);
  return ctrl;
}

function addLight() {
  var dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(200, 200, 1000).normalize();
  camera.add(dirLight);
  camera.add(dirLight.target);
}

// function loadModels( filePath, material ){
//     var loader = new THREE.JSONLoader();
//     loader.load(filePath, function(geometry) {
//         var mesh = new THREE.Mesh(geometry, material);
//         mesh.castShadow = true;
//         mesh.receiveShadow = true;
//         scene.add(mesh);
//         objects.push(mesh);
//     })
// }
function loadModels(data) {
  let loader, mesh;
  for (let i = 0; i < data.length; i++) {
    switch (data[i]['fltp']) {
      case 'json':
        loader = new THREE.JSONLoader();
        loader.load(data[i]['file'], function(geometry) {
          mesh = new THREE.Mesh(geometry, data[i]['mtl']);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          scene.add(mesh);
          objects.push(mesh);
        })
        break;
      default:

    }
  }

}


function setupGui() {
  // https://github.com/dataarts/dat.gui/blob/master/API.md
  effectController = {
    fullScreen: function() {
      fullscreen.toggleFullscreen();
      gui.close();
    },
    material: 'phong'
  }
  // var h;
  gui = new dat.GUI();
  // 创建二级菜单
  // h = gui.addFolder( "Menu" );
  // 添加 Slider
  // h.add( effectController, "slider", 1, 100 )
  //     .step( 2 )
  //     .name( "slider" )
  //     .onChange( testGui );
  // 添加 Button
  gui.add(effectController, "fullScreen");
  // 添加 Select
  gui.add(effectController, "material", ["wire", "flat", "gouraud", "phong", "basicRim", "advToon"])
    .name("Material")
    .onFinishChange(updateMaterial);
}

function init() {
  container = document.getElementById('viewport');

  // 构建场景
  scene = new THREE.Scene();

  // 添加摄像机
  camera = new THREE.PerspectiveCamera(50,
    window.innerWidth / window.innerHeight,
    1, 2000);
  camera.position.set(0, 90, 150);

  // 添加控制器（轨迹球方式） & 设置旋转中心
  controls = addControls(camera, new THREE.Vector3(0, 70, 0));

  scene.add(camera);

  // 灯光
  addLight();

  // 材质
  var material = materials["phong"]();

  // 加载模型
  // loadModels( 'obj/body.json', material );
  // loadModels( 'obj/eyes.json', material );
  loadModels([{
    file: 'obj/body.json',
    mtl: material,
    fltp: 'json'
  }, {
    file: 'obj/eyes.json',
    mtl: material,
    fltp: 'json'
  }]);
  setupGui();
  // 渲染
  renderer = new THREE.WebGLRenderer({
    antialias: false, // 抗锯齿
    alpha: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // controls.handleResize();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
