var mesh, renderer, scene, camera, geometry, controls, projector;

// resolution
var N = 60;

//size
var W = 200;
var H = 200;

var D = 10; 

//wave propagation speed (relation between time and space)
var C = 0.04;
var C2 = C * C;

var DAMPING = 0.001;
var SIM_SPEED = 1;

//precompute some deltas for our finite differences
var DELTA_X = W / N;
var DELTA_X2 = DELTA_X * DELTA_X;
var DELTA_Z = H / N;
var DELTA_Z2 = DELTA_Z * DELTA_Z;

//we're using iterated Euler's method
//specify iteration dt
var MAX_DT = 12;
//we won't be simulating beyond this dt
var MAX_ITERATRED_DT = 100;

//some constants for the initial state of the world
//the height of the original droplet
var MAX_Y = 50;
//the concentration of the original droplet
//this is the square of the inverse of the usual "sigma" used in the gaussian distribution
var SIGMA = 0.01;

function init(){
	//CAMERA
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.z = 200;
    camera.position.y = 150;
    camera.position.x = 100;

    //SCENE
    scene = new THREE.Scene();

    //LIGHTS
    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);

    // start with a flat plane which we'll deform accordingly
    geometry = new THREE.PlaneGeometry(W, H, N, N);
    console.log(geometry);
    //make it so that our wave function is in the form y = f(x, z, t)
    var matrix = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
    geometry.applyMatrix(matrix);

    initGeometry();

    var materials = [
    	new THREE.MeshPhongMaterial({color: 0x0099ff}),
    	new THREE.MeshBasicMaterial({visible: false})
    	];
	mesh = new THREE.Mesh(geometry, materials[0]);

    var cubeGeometry = new THREE.CubeGeometry(W, D, H);
    console.log(cubeGeometry);
   
	for (i = 0; i < cubeGeometry.faces.length; i++) {
  		face = cubeGeometry.faces[i];
  		face.materialIndex = 0;
	};

	cubeGeometry.faces[2].materialIndex = 1;

	var cubeMesh = new THREE.Mesh(cubeGeometry, new THREE.MeshFaceMaterial(materials));
	cubeMesh.position.set(0, -D / 2, 0);

    scene.add(mesh);
    scene.add(cubeMesh);

    controls = new THREE.TrackballControls(camera);

    projector = new THREE.Projector();

    renderer = new THREE.WebGLRenderer();
    
    function updateViewport() {
  	renderer.setSize(window.innerWidth, window.innerHeight);
  	camera.aspect = window.innerWidth / window.innerHeight;
  	camera.updateProjectionMatrix();
  	return controls.target.set(0, 0, 0);
	};

    updateViewport();

    window.addEventListener('resize', updateViewport);
    document.addEventListener('mousedown', hitTest);

    document.body.appendChild(renderer.domElement);

};

var now = Date.now();

//main loop function
function animate(){
	var dt = Date.now() - now;
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	dt *= SIM_SPEED;

	if (dt > MAX_ITERATRED_DT)
	    dt = MAX_ITERATRED_DT;
	    
	//iterated Euler's method
	while (dt > 0) {
		if (dt > MAX_DT)
	        integrate(MAX_DT);
	    else
	        integrate(dt);
	    dt -= MAX_DT;
	}
	        
	now = Date.now();
};
    

//convert from (x, z) indices to an index in the vertex array
function idx (x, z) {
	return x + (N+1) * z;
};

function initGeometry(){
	var ref = geometry.vertices;
	for (index = 0; index < geometry.vertices.length; index++ ){
		var vertex = ref[index];
		//equation for water equation y = u(x, z, 0) = A exp(-σx²) exp(-σz²)
		vertex.y = MAX_Y * Math.exp(-SIGMA * vertex.x * vertex.x) * Math.exp(-SIGMA * vertex.z * vertex.z);
		vertex.uy = 0;
		vertex.ay = 0;
	}
};

function integrate(dt){
	var v = geometry.vertices;
    for (z=0; z < N; z++) {
        for (x=0; x< N; x++){
            var i = idx(x, z);
            //find neighbouring points in grid
            var iPrevX = idx(x - 1, z);
            var iNextX = idx(x + 1, z);
            var iPrevZ = idx(x, z - 1);
            var iNextZ = idx(x, z + 1);

            //evaluate the second space-derivatives using finite differences
            //see http://en.wikipedia.org/wiki/Finite_difference#Higher-order_differences
            var d2x = (v[iNextX].y - 2 * v[i].y + v[iPrevX].y) / DELTA_X2;
            var d2z = (v[iNextZ].y - 2 * v[i].y + v[iPrevZ].y) / DELTA_Z2;

            //the Wave partial differential equation in 2D
            //see https://en.wikipedia.org/wiki/Wave_equation
            //"d2x + d2z" is the spacial laplacian, ay is the acceleration w.r.t time
            v[i].ay = C2 * (d2x + d2z);

            //add a non-homogeneous term to introduce damping
            //see http://uhaweb.hartford.edu/noonburg/m344lecture16.pdf
            v[i].ay += -DAMPING * v[i].uy;

            //use Euler integration to find the new velocity w.r.t. time
            //and the new vertical position
            //see https://en.wikipedia.org/wiki/Euler_integration
            v[i].uy += dt * v[i].ay;
            v[i].newY = v[i].y + dt * v[i].uy;
        }
    }

    //Commit the changes in the simulation
    //This is done in a separate step so that each simulation step doesn't affect itself
    for (z=0; z < N; z++)
        for (x=0; x<N; x++){
            var i = idx(x, z);
            v[i].y = v[i].newY;
        }

    geometry.verticesNeedUpdate = true;
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.normalsNeedUpdate = true;
};

function hitTest(e) {
	//see http://mrdoob.github.io/three.js/examples/canvas_interactive_cubes.html for details on hit testing
    var vector = new THREE.Vector3((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1, 0.5);
    projector.unprojectVector(vector, camera);

    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

    var intersects = raycaster.intersectObjects([mesh]);
    if (intersects.length) {
        var p = intersects[0].point;
        //create a new initial condition (droplet) based on clicked location
        for (index = 0; index < geometry.vertices.length; index++){
        	var vertex = geometry.vertices[index];
            var x = vertex.x - p.x;
            var z = vertex.z - p.z;
            vertex.y += MAX_Y * Math.exp(-SIGMA * x * x) * Math.exp(-SIGMA * z * z);
            if (vertex.x == -W / 2 || vertex.x == W / 2 || vertex.z == -H / 2 || vertex.z == H / 2)
                vertex.y = 0;
        }
    }
}

init();
animate();