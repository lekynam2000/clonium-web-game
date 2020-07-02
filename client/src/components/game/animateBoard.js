const { getPiece } = require('../client/src/components/game/createCanvas');
const TWEEN = require('@tweenjs/tween.js');

function animateBoard(locations, player, scene, renderer, camera, result) {
  var squareBoard = scene.getObjectByName('board');
  var relativePos = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
  var init = 0;
  var animatePieces = {
    UP: [],
    DOWN: [],
    LEFT: [],
    RIGHT: [],
  };

  for (let location of locations) {
    let currRow = location.row;
    let currCol = location.col;
    let group = squareBoard.children[currRow * 10 + currCol].getObjectByName(
      'piece'
    );
    for (let i = 0; i < 4; i++) {
      let piece = getPiece(1, colorArray[player]);
      piece.initPosition = { ...piece.position };
      piece.initRotation = { ...piece.rotation };
      group.add(piece);
      animatePieces[relativePos[i]].push(piece);
    }
  }
  let tween = new TWEEN.Tween(init)
    .to(1, 500)
    .onUpdate((time) => {
      for (let p of animatePieces['UP']) {
        p.position.y = p.initPosition.y + time * 10;
        p.rotation.x = p.initRotation.x + time * Math.PI;
        p.position.z = p.initPosition.z - 40 * time * time + 40 * time;
      }
      for (let p of animatePieces['LEFT']) {
        p.position.x = p.initPosition.x - time * 10;
        p.rotation.y = p.initRotation.y - time * Math.PI;
        p.position.z = p.initPosition.z - 40 * time * time + 40 * time;
      }
      for (let p of animatePieces['DOWN']) {
        p.position.y = p.initPosition.y - time * 10;
        p.rotation.x = p.initRotation.x - time * Math.PI;
        p.position.z = p.initPosition.z - 40 * time * time + 40 * time;
      }
      for (let p of animatePieces['RIGHT']) {
        p.position.x = p.initPosition.x + time * 10;
        p.rotation.y = p.initRotation.y + time * Math.PI;
        p.position.z = p.initPosition.z - 40 * time * time + 40 * time;
      }
      renderer.render(scene, camera);
    })
    .onComplete(() => {
      update(renderer, scene, camera, result);
    });
  return tween;
}
