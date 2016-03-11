//Variabler
var mesh, renderer, scene, camera, geometry, controls, projector;


//Storlek på vattenytan
var W = 290;
var H = 590;

//Upplösning på vattenytan
var NH = 100; //300 ser jävligt smooth ut, men för mycket beräkningstungt, bör isf ordna beräkningar på GPU
var NW = Math.ceil(NH * W/H) ;
console.log(NW);

//Vågutberedningshastighet
var C = 0.05;
var C2 = C * C;

//Variabel för hur snabbt vågorna ska dö ut
var DAMPING = 0.0001;
var SIM_SPEED = 1.3;

//Stegstorlek i x och z-led
var DELTA_X = W / NW; 
var DELTA_X2 = DELTA_X * DELTA_X;
var DELTA_Z = H / NH;
var DELTA_Z2 = DELTA_Z * DELTA_Z;

//för eulers metod så måste iterationen dt specificeras
var MAX_DT = 12;
//vi simulerar inte förbi detta dt
var MAX_ITERATRED_DT = 100;

//höjden på den ursprungliga droppen
var MAX_Y = 40;

//koncentrationen av första droppen
//Sigma-variabeln används för att göra en normalfördelning för en "vattendroppe", se "Gaussian distribution"
var SIGMA = 0.01;

//now används till tid i function animate
now = Date.now();

init = function() {

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 0;
  camera.position.y = 350;
  camera.position.x = -200;

  scene = new THREE.Scene();

 //-------------LJUS-------------------
  var lightamb = new THREE.AmbientLight( 0x909090 ); // soft white light
  scene.add( lightamb );

  var spotLight = new THREE.SpotLight( 0xffffff );
  spotLight.position.set( 100, 1000, 100 );

  spotLight.castShadow = true;

  spotLight.shadowMapWidth = 1024;
  spotLight.shadowMapHeight = 1024;

  spotLight.shadowCameraNear = 500;
  spotLight.shadowCameraFar = 4000;
  spotLight.shadowCameraFov = 30;

  scene.add( spotLight );

 //-------------VATTENYTAN-------------------

  //Planet som är vattenytan
  geometry = new THREE.PlaneGeometry(W, H, NW, NH);

  //matrisen som appliceras på vattenytan
  var matrix = new THREE.Matrix4();
  matrix.makeRotationX(-Math.PI / 2);
  geometry.applyMatrix(matrix);

  initGeometry();

  //material och mesh
  var materials = new THREE.MeshPhongMaterial({ color: 0x006080, specular: 0x101010, opacity: 0.7, transparent: true, wireframe : false});
  mesh = new THREE.Mesh(geometry, materials);
  scene.add(mesh);


  //-------------BADKARET-------------------
  var bathMaterialcolor = new THREE.MeshLambertMaterial({ color: 0xff0000});

  //-----kortsida material--------
  var texture1 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture1.wrapS = THREE.RepeatWrapping;
  texture1.wrapT = THREE.RepeatWrapping;
  texture1.repeat.set( 1, 4); //sidor

  var texture2 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture2.wrapS = THREE.RepeatWrapping;
  texture2.wrapT = THREE.RepeatWrapping;
  texture2.repeat.set( 5, 1 ); // ovan- och undersida

  var texture3 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture3.wrapS = THREE.RepeatWrapping;
  texture3.wrapT = THREE.RepeatWrapping;
  texture3.repeat.set( 7, 4 ); //in och utsida

  var bathMaterial1 = new THREE.MeshLambertMaterial( { map: texture1 } );
  var bathMaterial2 = new THREE.MeshLambertMaterial( { map: texture2 } );
  var bathMaterial3 = new THREE.MeshLambertMaterial( { map: texture3 } );

  // utsida, insida, ovan, under, kort-fram, kort-bort
  var materials = [bathMaterial1, bathMaterial1, bathMaterial2, bathMaterial2, bathMaterial3, bathMaterial3];

  var bathMaterial = new THREE.MeshFaceMaterial( materials); 
  //----slut kortsida material---------

  //sida ett
  var bathGeometryShort = new THREE.BoxGeometry (299, 200, 20);
  bathGeometryShort.applyMatrix( new THREE.Matrix4().makeTranslation(0, -80, -300) );
  var bathShortSideOne = new THREE.Mesh(bathGeometryShort, bathMaterial);
  scene.add(bathShortSideOne);

  //sida två
  var bathGeometryShortTwo = new THREE.BoxGeometry (299, 200, 20);
  bathGeometryShortTwo.applyMatrix( new THREE.Matrix4().makeTranslation(0, -80, 300) );
  var bathShortSideTwo = new THREE.Mesh(bathGeometryShortTwo, bathMaterial);
  scene.add(bathShortSideTwo);

    //-----långsida material-----
  var texture4 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture4.wrapS = THREE.RepeatWrapping;
  texture4.wrapT = THREE.RepeatWrapping;
  texture4.repeat.set( 15, 1 ); //ovan, under

  var texture5 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture5.wrapS = THREE.RepeatWrapping;
  texture5.wrapT = THREE.RepeatWrapping;
  texture5.repeat.set( 1, 8 ); //sidor

  var texture6 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture6.wrapS = THREE.RepeatWrapping;
  texture6.wrapT = THREE.RepeatWrapping;
  texture6.repeat.set( 15, 4 ); //långsida-långsida!

  var bathMaterial4 = new THREE.MeshLambertMaterial( { map: texture4 } );
  var bathMaterial5 = new THREE.MeshLambertMaterial( { map: texture5 } );
  var bathMaterial6 = new THREE.MeshLambertMaterial( { map: texture6 } );

  // [kortsida-vänster, kortsida-höger, ovansida, undersida, lång-långsida-in, lång-långsida-ut]
  var materials2 = [bathMaterial5, bathMaterial5, bathMaterial4, bathMaterial4, bathMaterial6, bathMaterial6];

  var bathMaterial2 = new THREE.MeshFaceMaterial( materials2 ); 
  //----slut långsida material-------

  //sida tre
  var bathGeometryLong = new THREE.BoxGeometry (620, 200, 20);
  bathGeometryLong.translate(0, -80, -150);
  var matrix = new THREE.Matrix4();
  matrix.makeRotationY(Math.PI / 2);
  bathGeometryLong.applyMatrix( matrix );
  var bathShortSideThree = new THREE.Mesh(bathGeometryLong, bathMaterial2);
  scene.add(bathShortSideThree);

  //sida fyra
  var bathGeometryLongTwo = new THREE.BoxGeometry (620, 200, 20);
  bathGeometryLongTwo.translate(0, -80, 150);
  var matrix2 = new THREE.Matrix4();
  matrix2.makeRotationY(Math.PI / 2);
  bathGeometryLongTwo.applyMatrix( matrix2 );
  var bathShortSideFour = new THREE.Mesh(bathGeometryLongTwo, bathMaterial2);
  scene.add(bathShortSideFour);

  //----botten material---------
  var texture7 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture7.wrapS = THREE.RepeatWrapping;
  texture7.wrapT = THREE.RepeatWrapping;
  texture7.repeat.set( 1, 1 ); 

  var texture8 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture8.wrapS = THREE.RepeatWrapping;
  texture8.wrapT = THREE.RepeatWrapping;
  texture8.repeat.set( 5, 15 ); 

  var texture9 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture9.wrapS = THREE.RepeatWrapping;
  texture9.wrapT = THREE.RepeatWrapping;
  texture9.repeat.set( 1, 1 ); //in och utsida

  var bathMaterial7 = new THREE.MeshLambertMaterial( { map: texture7 } );
  var bathMaterial8 = new THREE.MeshLambertMaterial( { map: texture8 } );
  var bathMaterial9 = new THREE.MeshLambertMaterial( { map: texture9 } );

  var materials3 = [bathMaterial7, bathMaterial7, bathMaterial8, bathMaterial8, bathMaterial9, bathMaterial9];

  var bathMaterial3 = new THREE.MeshFaceMaterial( materials3 ); 
  //------slut botten materal-------

  // botten
  var bathGeometryBottom = new THREE.BoxGeometry(299, 20, 620);
  bathGeometryBottom.translate(0, -170, 0);
  var bathBottom = new THREE.Mesh(bathGeometryBottom, bathMaterial3);
  scene.add(bathBottom);

  //-------------TRAPPSTEG-------------------
  //-----trappsteg material-------
  var texture10 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture10.wrapS = THREE.RepeatWrapping;
  texture10.wrapT = THREE.RepeatWrapping;
  texture10.repeat.set( 4, 1 ); 

  var texture11 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture11.wrapS = THREE.RepeatWrapping;
  texture11.wrapT = THREE.RepeatWrapping;
  texture11.repeat.set( 4, 1 ); 

  var texture12 = new THREE.TextureLoader().load( "tiles.jpg" );
  texture12.wrapS = THREE.RepeatWrapping;
  texture12.wrapT = THREE.RepeatWrapping;
  texture12.repeat.set( 4, 2 ); //in och utsida

  var bathMaterial10 = new THREE.MeshLambertMaterial( { map: texture10 } );
  var bathMaterial11 = new THREE.MeshLambertMaterial( { map: texture11 } );
  var bathMaterial12 = new THREE.MeshLambertMaterial( { map: texture12 } );

  var materials4 = [bathMaterial10, bathMaterial10, bathMaterial11, bathMaterial11, bathMaterial12, bathMaterial12];

  var bathMaterial4 = new THREE.MeshFaceMaterial( materials4 ); 
  //------slut trappsteg material-----

  var stepOneGeometry = new THREE.BoxGeometry(280, 38, 60);
  stepOneGeometry.translate(0, -35, 260);
  var stepOne = new THREE.Mesh(stepOneGeometry, bathMaterial4);
  scene.add(stepOne);

  var stepTwoGeometry = new THREE.BoxGeometry(280, 38, 60);
  stepTwoGeometry.translate(0, -73, 200);
  var stepTwo = new THREE.Mesh(stepTwoGeometry, bathMaterial4);
  scene.add(stepTwo);

  var stepThreeGeometry = new THREE.BoxGeometry(280, 38, 60);
  stepThreeGeometry.translate(0, -109, 140);
  var stepThree = new THREE.Mesh(stepThreeGeometry, bathMaterial4);
  scene.add(stepThree);

  var stepFourGeometry = new THREE.BoxGeometry(280, 38, 60);
  stepFourGeometry.translate(0, -147, 80);
  var stepFour = new THREE.Mesh(stepFourGeometry, bathMaterial4);
  scene.add(stepFour);
  //--------------------------------------------

  //navigation till scenen
  controls = new THREE.OrbitControls(camera);
  //finns till för att kunna klicka och hitta klickpositioner
  projector = new THREE.Projector(); // projector har slutat uppdateras, ändra till raycaster? 

  renderer = new THREE.WebGLRenderer();

  //Anpassar vyn efter fönstrets storlek
  updateViewport = function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    return controls.target.set(0, 0, 0);
  };
  updateViewport();
  window.addEventListener('resize', updateViewport); 

  //Hantera klickfuntion
  document.addEventListener('mousedown', hitTest);

  return document.body.appendChild(renderer.domElement);
};

 //-------------FUNKTIONER-------------------


animate = function() {
  var dt;
  dt = Date.now() - now; // tidsskillnad

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();
  dt *= SIM_SPEED; // multipleceras med simuleringshastighet
  //Begränsa tidsskillnaden
  if (dt > MAX_ITERATRED_DT) {
    dt = MAX_ITERATRED_DT; // KOLLA HIT
  }
  while (dt > 0) {
    if (dt > MAX_DT) {
      integrate(MAX_DT);
    } else {
      integrate(dt);
    }
    dt -= MAX_DT;
  }
  return now = Date.now();
};

//convert from (x, z) indices to an index in the vertex array
idx = function(x, z) {
  return x + (NW + 1) * z;
};

//initierar geometrin (vattenytan)
initGeometry = function() {
  var results = [];
  for (index = 0; index < geometry.vertices.length; index++) {
    var vertex = geometry.vertices[index]; //create an array with all the vertices

    //equation for water equation y = u(x, z, 0) = A exp(-σx²) exp(-σz²)
    vertex.y = 0; //MAX_Y * Math.exp(-SIGMA * vertex.x * vertex.x) * Math.exp(-SIGMA * vertex.z * vertex.z);
    vertex.uy = 0; //uy = hastighet i y-led
    results.push(vertex.ay = 0); //ay = acceleration i y-led
  }
  return results;
};

integrate = function(dt) {
  var d2x, d2z, i, iNextX, iNextZ, iPrevX, iPrevZ, j, k, l, m, v, x, z;
  v = geometry.vertices;
  for (z = 1; z < NH; z++) { 
    for (x = 1; x < NW; x++) { 
      i = idx(x, z); // idx funktionen konverterar x och z till värden i indexarrayen
      
      iPrevX = idx(x - 1, z);
      iNextX = idx(x + 1, z);
      iPrevZ = idx(x, z - 1);
      iNextZ = idx(x, z + 1);
      // finita differensmetoden används här för att lösa vår andra ordningens differentialekvation
      d2x = (v[iNextX].y - 2 * v[i].y + v[iPrevX].y) / DELTA_X2; 
      d2z = (v[iNextZ].y - 2 * v[i].y + v[iPrevZ].y) / DELTA_Z2;
      v[i].ay = C2 * (d2x + d2z); //acceleration för varje vertex; 
      v[i].ay += -DAMPING * v[i].uy; // acceleration = gammal acc - dämpning * hastighet
      v[i].uy += dt * v[i].ay; // ny hastighet = gammal hastighet + tidssteg*acceleration, Euler
      v[i].newY = v[i].y + dt * v[i].uy; // beräkna ny y-position; höjd = gammal höjd + tidssteg * hastigheten, Euler
    }
  }
  for (z = 1; z < NH; z++) { 
    for (x = 1; x < NW; x++) { 
      i = idx(x, z);
      v[i].y = v[i].newY; // skriv över med den nya höjden för varje vertex
    }
  }
  geometry.verticesNeedUpdate = true;
  geometry.computeFaceNormals();
  geometry.computeVertexNormals();
  return geometry.normalsNeedUpdate = true;
};

//hanterar raycaster/projector för alla musklick
hitTest = function(e) {
  var index, intersects, j, len, p, raycaster, results, vector, vertex, x, z;
  //get vector of mouseclick event coordinates
  vector = new THREE.Vector3((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1, 0.5);
  projector.unprojectVector(vector, camera);
  raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
  intersects = raycaster.intersectObjects([mesh]);
  if (intersects.length) {
    p = intersects[0].point;
    results = [];
    for (index = 0; index < geometry.vertices.length; index ++) {
      vertex = geometry.vertices[index];
      x = vertex.x - p.x; 
      z = vertex.z - p.z;
      vertex.y += (MAX_Y * Math.exp(-SIGMA * x * x) * Math.exp(-SIGMA * z * z)); //starta droppe vid tryck
      //hantera tryck vid kanterna, gränsvillkor
      if (vertex.x === -W / 2 || vertex.x === W / 2 || vertex.z === -H / 2 || vertex.z === H / 2) {
        results.push(vertex.y = 0);
      } else { 
        results.push(void 0);
      }
    }
    return results; //array av alla träffar
  }
};

init();

animate();
