//-------------BADKARET-------------------
  //var bathMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff});
  var texture = new THREE.TextureLoader().load( "tiles.jpg" );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 8, 4 );
  var bathMaterial = new THREE.MeshLambertMaterial( { map: texture } );
  
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

  //sida tre
  var bathGeometryLong = new THREE.BoxGeometry (620, 200, 20);
  bathGeometryLong.translate(0, -80, -150);
  var matrix = new THREE.Matrix4();
  matrix.makeRotationY(Math.PI / 2);
  bathGeometryLong.applyMatrix( matrix );
  var bathShortSideThree = new THREE.Mesh(bathGeometryLong, bathMaterial);
  scene.add(bathShortSideThree);

  //sida fyra
  var bathGeometryLongTwo = new THREE.BoxGeometry (620, 200, 20);
  bathGeometryLongTwo.translate(0, -80, 150);
  var matrix2 = new THREE.Matrix4();
  matrix2.makeRotationY(Math.PI / 2);
  bathGeometryLongTwo.applyMatrix( matrix2 );
  var bathShortSideFour = new THREE.Mesh(bathGeometryLongTwo, bathMaterial);
  scene.add(bathShortSideFour);

  // botten
  var bathGeometryBottom = new THREE.BoxGeometry(299, 20, 620);
  bathGeometryBottom.translate(0, -170, 0);
  var bathBottom = new THREE.Mesh(bathGeometryBottom, bathMaterial);
  scene.add(bathBottom);

  //-------------TRAPPSTEG-------------------
  var stepOneGeometry = new THREE.BoxGeometry(280, 168, 60);
  stepOneGeometry.translate(0, -97, 260);
  var stepOne = new THREE.Mesh(stepOneGeometry, bathMaterial);
  scene.add(stepOne);

  var stepTwoGeometry = new THREE.BoxGeometry(280, 112, 60);
  stepTwoGeometry.translate(0, -107, 200);
  var stepTwo = new THREE.Mesh(stepTwoGeometry, bathMaterial);
  scene.add(stepTwo);

  var stepThreeGeometry = new THREE.BoxGeometry(280, 56, 60);
  stepThreeGeometry.translate(0, -117, 140);
  var stepThree = new THREE.Mesh(stepThreeGeometry, bathMaterial);
  scene.add(stepThree);

  var stepFourGeometry = new THREE.BoxGeometry(280, 36, 60);
  stepFourGeometry.translate(0, -158, 80);
  var stepFour = new THREE.Mesh(stepFourGeometry, bathMaterial);
  scene.add(stepFour);
  //--------------------------------------------