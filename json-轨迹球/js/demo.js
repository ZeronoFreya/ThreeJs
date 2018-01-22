if (!Detector.webgl) Detector.addGetWebGLMessage();
var container;
var objects = [];
var camera, controls, scene, renderer;
// var wireMaterial,
//     flatMaterial,
//     gouraudMaterial,
//     phongMaterial;

var log = new Console(document.getElementById('console'));
var effectController;
var gui;
init();
animate();

function addControls( camera, target ){
    var te = new TouchEvent( container );
    var ctrl = new THREE.TrackballControls(camera,te);
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
    ctrl.setTarget( target );
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
        objects.push(mesh);
    })
}
function launchFullScreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
    // fullscreen.innerHTML = "全屏";
}
function toggleFullscreen(){
    if (effectController.fullScreen) {
        launchFullScreen( document.documentElement );
        return;
    }
    exitFullscreen();
}

function testGui(){
    console.log('testGui');
}
function rim(){
    var mtl = new THREE.PhongNodeMaterial();

    var intensity = 1.3;
    var power = new THREE.FloatNode( 3 );
    var color = new THREE.ColorNode( 0xFFFFFF );

    var viewZ = new THREE.Math2Node(
        new THREE.NormalNode( THREE.NormalNode.VIEW ),
        new THREE.Vector3Node( 0, 0, - intensity ),
        THREE.Math2Node.DOT
    );

    var rim = new THREE.OperatorNode(
        viewZ,
        new THREE.FloatNode( intensity ),
        THREE.OperatorNode.ADD
    );

    var rimPower = new THREE.Math2Node(
        rim,
        power,
        THREE.Math2Node.POW
    );

    var rimColor = new THREE.OperatorNode(
        rimPower,
        color,
        THREE.OperatorNode.MUL
    );

    mtl.color = new THREE.ColorNode( 0x111111 );
    mtl.emissive = rimColor;

    return mtl;
}
function toon(){
    var mtl = new THREE.PhongNodeMaterial();

    var count = new THREE.FloatNode( 2.8 );
    var sceneDirectLight = new THREE.LightNode();
    var color = new THREE.ColorNode( 0xf8eaec );

    var lineColor = new THREE.ColorNode( 0x6b0602 );
    var lineSize = new THREE.FloatNode( 0 );
    var lineInner = new THREE.FloatNode( 0 );

    // CEL

    var lightLuminance = new THREE.LuminanceNode( sceneDirectLight );

    var preCelLight = new THREE.OperatorNode(
        lightLuminance,
        count,
        THREE.OperatorNode.MUL
    );

    var celLight = new THREE.Math1Node(
        preCelLight,
        THREE.Math1Node.CEIL
    );

    var posCelLight = new THREE.OperatorNode(
        celLight,
        count,
        THREE.OperatorNode.DIV
    );

    // LINE

    var posDirection = new THREE.Math1Node( new THREE.PositionNode( THREE.PositionNode.VIEW ), THREE.Math1Node.NORMALIZE );
    var norDirection = new THREE.Math1Node( new THREE.NormalNode( THREE.NormalNode.VIEW ), THREE.Math1Node.NORMALIZE );

    var viewZ = new THREE.Math2Node(
        posDirection,
        norDirection,
        THREE.Math2Node.DOT
    );

    var lineOutside = new THREE.Math1Node(
        viewZ,
        THREE.Math1Node.ABS
    );

    var line = new THREE.OperatorNode(
        lineOutside,
        new THREE.FloatNode( 1 ),
        THREE.OperatorNode.DIV
    );

    var lineScaled = new THREE.Math3Node(
        line,
        lineSize,
        lineInner,
        THREE.Math3Node.SMOOTHSTEP
    );

    var innerContour = new THREE.Math1Node( new THREE.Math1Node( lineScaled, THREE.Math1Node.SAT ), THREE.Math1Node.INVERT );

    // APPLY

    mtl.color = color;
    mtl.light = posCelLight;
    mtl.shininess = new THREE.FloatNode( 0 );

    mtl.environment = lineColor;
    mtl.environmentAlpha = innerContour;
    return mtl;
}

function updateMaterial(){
    var mesh = objects[0];
    if ( mesh.material ) mesh.material.dispose();
    var mtl;
    switch ( effectController.material ) {
        case 'rim':
            mtl = rim();
        break;
        case 'toon':
            mtl = toon();
        break;
        case 'skin':
            mtl = skin('skin');
        break;
    }

    // build shader
    mtl.build();
    // set material
    mesh.material = mtl;
    objects[1].material = mtl;
}

function setupGui() {
    // https://github.com/dataarts/dat.gui/blob/master/API.md
    effectController = {
        button: testGui,
        color: '#ffffff',
        fullScreen: false,
        material:'rim',
        slider: 40
    }
    var h;
    gui = new dat.GUI();
    // 创建二级菜单
    h = gui.addFolder( "Menu" );
    // 添加 Slider
    h.add( effectController, "slider", 1, 100 )
        .step( 2 )
        .name( "slider" )
        .onChange( testGui );
    // 添加 CheckBox
    gui.add( effectController, "fullScreen" )
        .onChange( toggleFullscreen );
    // 添加 Select
    gui.add( effectController, "material", [ "rim", "toon", "skin" ] )
        .name( "Material" )
        .onFinishChange( updateMaterial );
    // 添加 Button
    gui.add( effectController, 'button' );
    gui.addColor( effectController, 'color' ).onChange(testGui);
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

    setupGui();
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