var app = angular.module("twitter-trends", []);

app.filter("fromNow", function() {
    return function(dateString) {
        return moment(new Date(dateString)).fromNow()
    };
});

function GlobalCtrl($scope) {
    $scope.spin = true;
    var cameraAngle = 0.3;
    var prevCameraAngle = 0.3;
    $scope.minDate = null;
    $scope.maxDate = null;

    $scope.update = function() {
        location.reload();
    };

    $scope.showAll = function() {
        if ($scope.lines) {
            for (var i = 0; i < $scope.lines.length; i++) {
                $scope.lines[i].line.visible = true;
            }
        }
    };

    $scope.showNone = function() {
        if ($scope.lines) {
            for (var i = 0; i < $scope.lines.length; i++) {
                $scope.lines[i].line.visible = false;
            }
        }
    };

    $scope.showInvert = function() {
        if ($scope.lines) {
            for (var i = 0; i < $scope.lines.length; i++) {
                $scope.lines[i].line.visible = !$scope.lines[i].line.visible;
            }
        }
    };

    $scope.toggleLine = function(line) {
        line.line.visible = !line.line.visible;
    };

    $scope.hoverOver = function(line) {
        line.line.material.linewidth = 5;
    };

    $scope.hoverLeave = function(line) {
        line.line.material.linewidth = 1;
    };

    $scope.toggleSpin = function() {
        $scope.spin = !$scope.spin;
    };

    function init() {
        console.log("Getting latest data");
        $.get("/api/snapshots?hours=12", function(data) {
            $scope.$apply(function() {
                initScene(data);
                initAxis();
            });
        });
    }

    function randomLineMaterial() {
        var colour = new THREE.Color();
        colour.setHSL(Math.random(), 1, 0.5);
        return new THREE.LineBasicMaterial({color: colour});
    }

    function initScene(trendData) {
        var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 10000);
        var scene = new THREE.Scene();

        //load all trend data into temp arrays
        var points = {};
        var xMax, xMin, yMax, yMin, zMax, zMin = null;
        for (var i = 0; i < trendData.length; i++) {
            var hashtag = trendData[i]["hashtag"];
            if (!points[hashtag]) {
                points[hashtag] = [];
            }

            var x = parseFloat(trendData[i].sentimentIndex) * 20.0 - 100;
            var y = (Math.log(parseFloat(trendData[i].popularityIndex)) - 20) * 50;
            var seconds = new Date(trendData[i].dateCreated).getTime() / 1000;
            var z = (seconds - 1382342000) / 80;

            if ($scope.minDate == null || $scope.minDate > trendData[i].dateCreated)
                $scope.minDate = trendData[i].dateCreated;
            if ($scope.maxDate == null || $scope.maxDate < trendData[i].dateCreated)
                $scope.maxDate = trendData[i].dateCreated;
            if (xMax == null || xMax < x)
                xMax = x;
            if (xMin == null || xMin > x)
                xMin = x;
            if (yMax == null || yMax < y)
                yMax = y;
            if (yMin == null || yMin > y)
                yMin = y;
            if (zMax == null || zMax < z)
                zMax = z;
            if (zMin == null || zMin > z)
                zMin = z;

            points[hashtag].push(new THREE.Vector3(x, y, z));
        }

        var center = new THREE.Vector3((xMax + xMin) / 2.0, -870, (zMax + zMin) / 2.0);
	console.log(center);

        //load the lines into scene objects
        $scope.lines = [];
        for (var hashtag in points) {
            //skip non-lines
            if (points[hashtag].length < 2) {
                continue;
            }
            var spline = new THREE.SplineCurve3(points[hashtag]);
            var material = randomLineMaterial();
            var splinePoints = spline.getPoints(250);
            var geometry = new THREE.Geometry();

            for (var i = 0; i < splinePoints.length; i++) {
                geometry.vertices.push(splinePoints[i]);
            }

            var line = new THREE.Line(geometry, material);
            $scope.lines.push({hashtag: hashtag, line: line});
            scene.add(line);
        }

        var renderer = new THREE.WebGLRenderer({canvas: document.getElementById("main-canvas")});
        renderer.setSize(window.innerWidth, window.innerHeight);

        var mouseDownPosition = null;
        function handleMouseDown(event) {
            mouseDownPosition = {x: event.clientX, y: event.clientY};
            prevCameraAngle = cameraAngle;
            $scope.$apply(function() {
                $scope.spin = false;
            });
        }
        renderer.domElement.addEventListener("mousedown", handleMouseDown);

        function handleMouseUp(event) {
            mouseDownPosition = null;
        }
        renderer.domElement.addEventListener("mouseup", handleMouseUp);

        function handleMouseMove(event) {
            if (mouseDownPosition != null) {
                var dx = event.clientX - mouseDownPosition.x;
                cameraAngle = prevCameraAngle - dx / 100.0;
            }
        }
        renderer.domElement.addEventListener("mousemove", handleMouseMove);
        
        function animate() {
            requestAnimationFrame(animate);
            camera.position.x = Math.sin(cameraAngle) * 400.0 + center.x;
            camera.position.y = 70 + center.y;
            camera.position.z = Math.cos(cameraAngle) * 400.0 + center.z;
            camera.lookAt(center);
            renderer.render(scene, camera);
            if ($scope.spin) {
                cameraAngle += 0.001;
            }
        }

        animate();
    }

    function initAxis() {
        var camera = new THREE.PerspectiveCamera(55, 1, 1, 10000);
        var scene = new THREE.Scene();
        var center = new THREE.Vector3(0, 20, 0);

        function createText(text) {
            var textGeometry = new THREE.TextGeometry(text, {
                size: 18,
                height: 0,
                curveSegments: 0,
                font: "helvetiker"
            });
            var material = new THREE.MeshBasicMaterial({color: 0xcccccc, overdraw: true});
            return new THREE.Mesh(textGeometry, material)
        }
        
        var xAxis = createText("-sentiment+");
        xAxis.position.x = 16;
        scene.add(xAxis);
        var yAxis = createText("-popularity+");
        yAxis.rotation.x = Math.PI / 2;
        yAxis.rotation.y = Math.PI / 2;
        yAxis.position.y = 20;
        scene.add(yAxis);
        var zAxis = createText("+time-");
        zAxis.position.z = 100;
        zAxis.rotation.y = Math.PI / 2;
        scene.add(zAxis);

        var renderer = new THREE.WebGLRenderer({canvas: document.getElementById("axis-canvas")});
        renderer.setSize(500, 500);

        function animate() {
            requestAnimationFrame(animate);
            camera.position.x = Math.sin(cameraAngle) * 300.0 + center.x;
            camera.position.y = 100 + center.y;
            camera.position.z = Math.cos(cameraAngle) * 300.0 + center.z;
            camera.lookAt(center);
            renderer.render(scene, camera);
        }

        animate();
    }

    init();
}
