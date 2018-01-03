if (!Detector.webgl) Detector.addGetWebGLMessage();
var container;
var camera, controls, scene, renderer;

init();
animate();

function addControls( camera, target ){
    var ctrl = new THREE.OrthographicTrackballControls(camera);
    ctrl.rotateSpeed = 1.0;
    ctrl.zoomSpeed = 1.2;
    ctrl.panSpeed = 0.3;
    ctrl.noZoom = false;
    ctrl.noPan = false;
    ctrl.staticMoving = false;
    ctrl.dynamicDampingFactor = 0.2;

    camera.lookAt(target);
    ctrl.target = target;
    return ctrl;
}
function addLight(){
    var dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(200, 200, 1000).normalize();
    camera.add(dirLight);
    camera.add(dirLight.target);
}
// 渲染方式
function setShading( materialType ){
    var materialColor = new THREE.Color();
    materialColor.setRGB(1.0, 1.0, 1.0);
    var opt = {
        color: materialColor,
        side: THREE.DoubleSide
    }
    var material;
    switch(materialType){
        case "wire":  // 线框
            opt["wireframe"] = true;
            material = new THREE.MeshBasicMaterial(opt);
        break;
        case "flat":  // 平直
            opt["specular"] = 0x000000;
            opt["flatShading"] = true;
            material = new THREE.MeshPhongMaterial(opt);
        break;
        case "gouraud":  // 平滑
            material = new THREE.MeshLambertMaterial(opt);
        break;
        case "phong":  // 平滑 高光
            material = new THREE.MeshPhongMaterial(opt);
        break;
    }
    return material;
}
function loadModels( filePath, material ){
    var loader = new THREE.JSONLoader();
    loader.load(filePath, function(geometry) {
        var mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
    })
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
    controls = addControls( camera, new THREE.Vector3(0, 70, 0) );

    scene.add(camera);

    // 灯光
    addLight();

    // 材质
    var material = setShading("phong");

    // 加载模型
    loadModels( 'obj/body.json', material );
    loadModels( 'obj/eyes.json', material );

    // 渲染
    renderer = new THREE.WebGLRenderer({
        antialias: false,    // 抗锯齿
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