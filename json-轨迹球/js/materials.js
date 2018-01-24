var materials = {
    wire: function() {
        var materialColor = new THREE.Color();
        materialColor.setRGB(1.0, 1.0, 1.0);
        var opt = {
            color: materialColor,
            side: THREE.DoubleSide,
            wireframe: true
        }
        return new THREE.MeshBasicMaterial(opt);
    },
    flat: function() {
        var materialColor = new THREE.Color();
        materialColor.setRGB(1.0, 1.0, 1.0);
        var opt = {
            color: materialColor,
            side: THREE.DoubleSide,
            specular: 0x000000,
            flatShading: true
        }
        return new THREE.MeshPhongMaterial(opt);
    },
    gouraud: function() {
        var materialColor = new THREE.Color();
        materialColor.setRGB(1.0, 1.0, 1.0);
        var opt = {
            color: materialColor,
            side: THREE.DoubleSide
        }
        return new THREE.MeshLambertMaterial(opt);
    },
    phong: function() {
        var materialColor = new THREE.Color();
        materialColor.setRGB(1.0, 1.0, 1.0);
        var opt = {
            color: materialColor,
            side: THREE.DoubleSide
        }
        // var mtl = new THREE.MeshPhongMaterial(opt);
        return new THREE.MeshPhongMaterial(opt);
    },
    basicRim: function() {
        var intensity = 1.3;
        var power = new THREE.FloatNode(3);
        var color = new THREE.ColorNode(0xFFFFFF);
        var viewZ = new THREE.Math2Node(new THREE.NormalNode(THREE.NormalNode.VIEW), new THREE.Vector3Node(0, 0, -intensity), THREE.Math2Node.DOT);
        var rim = new THREE.OperatorNode(viewZ, new THREE.FloatNode(intensity), THREE.OperatorNode.ADD);
        var rimPower = new THREE.Math2Node(rim, power, THREE.Math2Node.POW);
        var rimColor = new THREE.OperatorNode(rimPower, color, THREE.OperatorNode.MUL);

        var mtl = new THREE.PhongNodeMaterial();
        mtl.color = new THREE.ColorNode(0x111111);
        mtl.emissive = rimColor;
        return mtl.build();
    },
    advToon: function() {
        var count = new THREE.FloatNode(2.8);
        var sceneDirectLight = new THREE.LightNode();
        var color = new THREE.ColorNode(0xf8eaec);
        var lineColor = new THREE.ColorNode(0x6b0602);
        var lineSize = new THREE.FloatNode(0);
        var lineInner = new THREE.FloatNode(0);
        // CEL
        var lightLuminance = new THREE.LuminanceNode(sceneDirectLight);
        var preCelLight = new THREE.OperatorNode(lightLuminance, count, THREE.OperatorNode.MUL);
        var celLight = new THREE.Math1Node(preCelLight, THREE.Math1Node.CEIL);
        var posCelLight = new THREE.OperatorNode(celLight, count, THREE.OperatorNode.DIV);
        // LINE
        var posDirection = new THREE.Math1Node(new THREE.PositionNode(THREE.PositionNode.VIEW), THREE.Math1Node.NORMALIZE);
        var norDirection = new THREE.Math1Node(new THREE.NormalNode(THREE.NormalNode.VIEW), THREE.Math1Node.NORMALIZE);
        var viewZ = new THREE.Math2Node(posDirection, norDirection, THREE.Math2Node.DOT);
        var lineOutside = new THREE.Math1Node(viewZ, THREE.Math1Node.ABS);
        var line = new THREE.OperatorNode(lineOutside, new THREE.FloatNode(1), THREE.OperatorNode.DIV);
        var lineScaled = new THREE.Math3Node(line, lineSize, lineInner, THREE.Math3Node.SMOOTHSTEP);
        var innerContour = new THREE.Math1Node(new THREE.Math1Node(lineScaled, THREE.Math1Node.SAT), THREE.Math1Node.INVERT);

        // APPLY
        var mtl = new THREE.PhongNodeMaterial();
        mtl.color = color;
        mtl.light = posCelLight;
        mtl.shininess = new THREE.FloatNode(0);
        mtl.environment = lineColor;
        mtl.environmentAlpha = innerContour;
        return mtl.build();
    }
}