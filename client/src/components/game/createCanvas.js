import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
var THREE = require('three');
var THREEx = require('./threex.domevents');
const TWEEN = require('@tweenjs/tween.js').default;
var colorArray = [
  0xfc0303,
  0xf1f514,
  0x111111,
  0xe309ad,
  0xe3092d,
  0x09cde3,
  0x0918e3,
  0x1a1717,
];
export function init(game, playFunc) {
  var scene = new THREE.Scene();
  var parentDom = document.getElementById('webgl');
  var cvheight = parentDom.offsetHeight;
  var cvwidth = parentDom.offsetWidth;
  var light = new THREE.AmbientLight(0xffffff); // soft white light
  scene.add(light);

  var camera = new THREE.PerspectiveCamera(
    70, // field of view
    cvwidth / cvheight, // aspect ratio
    2, // near clipping plane
    2000
  );
  camera.position.y = 90;
  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(cvwidth, cvheight);
  parentDom.appendChild(renderer.domElement);
  var domEvents = new THREEx.DomEvents(camera, renderer.domElement);
  var controls = new OrbitControls(camera, renderer.domElement);
  var squareBoard = getSquareBoard(game.width, game.height);
  squareBoard.children.forEach((board, index) => {
    let row = Math.floor(index / game.width);
    let col = index % game.width;
    let group = new THREE.Group();
    group.name = 'piece';
    domEvents.addEventListener(
      board,
      'mouseover',
      (event) => {
        event.target.material.opacity *= 0.5;
        document.body.style.cursor = 'pointer';
        renderer.render(scene, camera);
      },
      false
    );
    domEvents.addEventListener(
      board,
      'mouseout',
      (event) => {
        event.target.material.opacity *= 2;
        document.body.style.cursor = 'context-menu';
        renderer.render(scene, camera);
      },
      false
    );
    domEvents.addEventListener(
      board,
      'click',
      () => {
        if (game.gameMatrix[row][col].player > -1) {
          playFunc(row, col);
        }
      },
      false
    );
    if (game.gameMatrix[row][col].dot > 0) {
      let piece = getPiece(
        game.gameMatrix[row][col].dot,
        colorArray[game.gameMatrix[row][col].player]
      );

      group.add(piece);
    }
    board.add(group);
  });
  squareBoard.name = 'board';
  scene.add(squareBoard);
  controls.enableRotate = false;
  renderer.render(scene, camera);
  window.scene = scene;
  function animateTween(time) {
    requestAnimationFrame(animateTween);
    TWEEN.update(time);
  }
  requestAnimationFrame(animateTween);
  function animateBoard(locations, player, scene, renderer, camera, result) {
    var squareBoard = scene.getObjectByName('board');
    var relativePos = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
    var init = { time: 0.6 };
    var animatePieces = {
      UP: [],
      DOWN: [],
      LEFT: [],
      RIGHT: [],
    };

    let tween = new TWEEN.Tween(init)
      .to({ time: 0.9 }, 600)
      .onStart(() => {
        for (let location of locations) {
          let currRow = location.row;
          let currCol = location.col;
          let group = squareBoard.children[
            currRow * 10 + currCol
          ].getObjectByName('piece');
          for (let i = 0; i < 4; i++) {
            let piece = getPiece(1, colorArray[player]);
            piece.initPosition = { ...piece.position };
            piece.initRotation = {};
            piece.initRotation.x = piece.rotation._x;
            piece.initRotation.y = piece.rotation._y;
            piece.initRotation.z = piece.rotation._z;
            group.add(piece);
            animatePieces[relativePos[i]].push(piece);
          }
        }
      })
      .onUpdate(() => {
        let time = init.time;

        for (let p of animatePieces['DOWN']) {
          p.position.y = p.initPosition.y + time * 10;
          p.rotation.x = p.initRotation.x + 2 * time * Math.PI;
          p.position.z = p.initPosition.z + 40 * time * time - 40 * time;
        }
        for (let p of animatePieces['LEFT']) {
          p.position.x = p.initPosition.x - time * 10;
          p.rotation.z = p.initRotation.z + 2 * time * Math.PI;
          p.position.z = p.initPosition.z + 40 * time * time - 40 * time;
        }
        for (let p of animatePieces['UP']) {
          p.position.y = p.initPosition.y - time * 10;
          p.rotation.x = p.initRotation.x - 2 * time * Math.PI;
          p.position.z = p.initPosition.z + 40 * time * time - 40 * time;
        }
        for (let p of animatePieces['RIGHT']) {
          p.position.x = p.initPosition.x + time * 10;
          p.rotation.z = p.initRotation.z - 2 * time * Math.PI;
          p.position.z = p.initPosition.z + 40 * time * time - 40 * time;
        }
        renderer.render(scene, camera);
      })
      .onComplete(() => {
        update(renderer, scene, camera, result);
      });
    return tween;
  }

  function animate(animateArray, player, explode = true) {
    var tweenArray = [];
    if (explode) {
      Array.from(animateArray).forEach((el, index) => {
        let tween = animateBoard(
          el.location,
          player,
          scene,
          renderer,
          camera,
          el.result
        );
        tweenArray.push(tween);
      });
      if (tweenArray.length > 1) {
        for (let i = 0; i < tweenArray.length - 1; i++) {
          tweenArray[i + 1].delay(500);
          tweenArray[i].chain(tweenArray[i + 1]);
        }
      }
      if (tweenArray.length > 0) {
        tweenArray[0].start();
      }
    } else {
      let game = animateArray[0].result;
      update(renderer, scene, camera, game);
    }
  }
  return animate;
}
function update(renderer, scene, camera, game) {
  updateGameBoard(scene, game);
  renderer.render(scene, camera);
  // controls.update();
}
function updateGameBoard(scene, game) {
  var squareBoard = scene.getObjectByName('board');
  squareBoard.children.forEach((board, index) => {
    let row = Math.floor(index / game.width);
    let col = index % game.width;
    let group = board.getObjectByName('piece');
    // if (group.children.length > 0) {
    //   if (game.gameMatrix[row][col].dot == 0) {
    //     group.children = [];
    //   }
    // }
    group.children = [];
    if (game.gameMatrix[row][col].dot > 0) {
      let piece = getPiece(
        game.gameMatrix[row][col].dot,
        colorArray[game.gameMatrix[row][col].player]
      );
      group.add(piece);
    }
  });
}

export function getPiece(n, color, side = 4.5) {
  var height = side / 2;
  var CylinderGeometry = new THREE.CylinderGeometry(side, side, height, 50);
  var CylinderMaterial = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.4,
  });
  var cylinder = new THREE.Mesh(CylinderGeometry, CylinderMaterial);

  var RingGeometry = new THREE.RingGeometry(
    (3.7 * side) / 5,
    (4.2 * side) / 5,
    100
  );
  var RingMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  var ring = new THREE.Mesh(RingGeometry, RingMaterial);

  ring.position.y += 0.501 * height;
  switch (n) {
    case 1:
      let dot = getDot(side / 5);
      ring.add(dot);
      break;
    case 2:
      let dot1 = getDot(side / 5);
      let dot2 = getDot(side / 5);
      dot1.position.x += 0.3 * side;
      dot2.position.x -= 0.3 * side;
      ring.add(dot1);
      ring.add(dot2);
      break;
    case 3:
      let r = 0.35 * side;
      let t;
      for (let i = 0; i < 3; i++) {
        t = -Math.PI / 2 - (2 * Math.PI * i) / 3;
        let dot = getDot(side / 5);
        dot.position.x = r * Math.cos(t);
        dot.position.y = r * Math.sin(t);
        ring.add(dot);
      }
      break;
    case 4:
      let circlePos = [
        { x: -1, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
      ];
      for (let i = 0; i < 4; i++) {
        let dot = getDot(side / 5);
        dot.position.x = 0.3 * side * circlePos[i].x;
        dot.position.y = 0.3 * side * circlePos[i].y;
        ring.add(dot);
      }
      break;
    case 5:
      let mid_dot = getDot(side / 5);
      ring.add(mid_dot);
      let cornerPos = [
        { x: -1, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
      ];
      for (let i = 0; i < 4; i++) {
        let dot = getDot(side / 5);
        dot.position.x = 0.35 * side * cornerPos[i].x;
        dot.position.y = 0.35 * side * cornerPos[i].y;
        ring.add(dot);
      }
      break;
    default:
      var loader = new THREE.FontLoader();
      loader.load('http://localhost:5000/static/Roboto_Bold.json', function (
        font
      ) {
        let geometry = new THREE.TextGeometry(n, {
          font: font,
          size: 4,
          height: 0,
        });
        let material = new THREE.MeshBasicMaterial();
        let text = new THREE.Mesh(geometry, material);
        text.rotation.x = Math.PI;
        text.position.x = -1.5;
        text.position.y = 2;
        ring.add(text);
      });
  }
  ring.rotation.x = Math.PI / 2;

  cylinder.add(ring);

  cylinder.rotation.x = -Math.PI / 2;
  cylinder.position.z += -height * 0.501;
  return cylinder;
}
export function getDot(side) {
  var dotMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  var dotGeo = new THREE.CircleGeometry(side, 50);
  var mesh = new THREE.Mesh(dotGeo, dotMaterial);
  return mesh;
}
export function getSquare(size, color) {
  var mainRecGeo = new THREE.PlaneGeometry(0.8 * size, size);
  var sideRecGeo = new THREE.PlaneGeometry(0.1 * size, 0.8 * size);
  var cornerCircleGeo = new THREE.CircleGeometry(
    0.1 * size,
    16,
    0,
    Math.PI / 2
  );
  var material = new THREE.MeshPhongMaterial({
    color: color,
    opacity: 0.6,
    transparent: true,
  });
  var mainRec = new THREE.Mesh(mainRecGeo, material);
  var leftRec = new THREE.Mesh(sideRecGeo, material);
  var rightRec = new THREE.Mesh(sideRecGeo, material);
  var circlePos = [
    { x: -1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
  ];
  leftRec.position.x = -0.45 * size;
  rightRec.position.x = +0.45 * size;
  mainRec.add(leftRec);
  mainRec.add(rightRec);

  for (let i = 0; i < 4; i++) {
    let circle = new THREE.Mesh(cornerCircleGeo, material);
    circle.position.x = 4 * circlePos[i].x;
    circle.position.y = 4 * circlePos[i].y;
    circle.rotation.z = (Math.PI * (1 - i)) / 2;
    mainRec.add(circle);
  }
  mainRec.rotation.x = Math.PI / 2;
  mainRec.material.side = THREE.DoubleSide;
  return mainRec;
}
export function getSquareBoard(
  width,
  height,
  size = 10,
  step = 1,
  color = 0xdddddd
) {
  var i;
  var board = new THREE.Group();
  for (i = 0; i < width * height; i++) {
    let square = getSquare(size, color);
    square.position.x = (size + step) * (i % width);
    square.position.z = (size + step) * Math.floor(i / width);
    board.add(square);
  }
  board.position.x = (-(width - 1) * (size + step)) / 2;
  board.position.z = (-(height - 1) * (size + step)) / 2;
  return board;
}
