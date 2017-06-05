/**
 * Licensed MIT.
 *
 * Sorry about the rudimentary scribble code below.
 *
 * The code in the repo might be drastically changed in the future without any notices.
 *
 * But
 *
 * The following code at least works and demonstrates as written in the read me.
 */

var game = new Phaser.Game(644,960,Phaser.CANVAS,'gameContainer', { preload: preload, create: create, update: update} );

var loadingLabel;
var tickSound;
var shortNoize;
var spinState = false;
var pocket_sprite = [];
var pocket_sprite_label = [];
var pockets_group;
var angleAccum = 0;
var angleBefore = 0;
var angleDiff = 0;
var reelHasSlowedDown = false;
var currentPocket;
var previousPocketNum;
var needle;
var needleTween;
var labelStyle = {
	font: "bold 52px Arial",
	fill: "#fff",
	boundsAlignH: "center",
	boundsAlignV: "middle"
};

var pocketChanged = 0;

var pocket_bets = ['2', '6', '2', '4', '10', '2', '4', '6', '0', '4', '8', '2', '6', '2', '4', '2', '10', '2', '6', '4', '2', '6', '2', '8', '2', '4', '0', '30', '2', '8', '4', '2', '10', '2', '4', '8'];

function preload () {
	loadingLabel = game.add.text(80, 150, 'loading...', {font: '30px Courier', fill: '#fff'});
	game.load.image('pocket_black', 'images/pocket_black.png');
	game.load.image('pocket_red', 'images/pocket_red.png');
	game.load.image('needle', 'images/needle.png');
	game.load.audio('tick', 'sound/waka.wav');
}

function create () {
	loadingLabel.destroy();
	game.stage.setBackgroundColor('#000');
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

	tickSound = game.add.audio('tick');
	tickSound.allowMultiple = true;
	pockets_group = game.add.group();
	pockets_group.x = 300;
	pockets_group.y = 300;
	pockets_group.scale.set(0.5);
	game.time.advancedTiming = true;
	game.stage.backgroundColor = '#777777';
	var _pocketType = ['pocket_red', 'pocket_black'];
	var _pocketSelector = 0;
	//	Here we add a Sprite to the display list
	for (var _i = 0; _i < 36; _i++) {
		if (_i % 2 == 0) {
			_pocketSelector = 0;
		} else {
			_pocketSelector = 1;
		}
		pocket_sprite[_i] = game.add.sprite(30 * _i, 20, _pocketType[_pocketSelector]);
		pocket_sprite[_i].anchor.setTo(1, 0);
		pockets_group.add(pocket_sprite[_i]);
	}

	for (var _i = 0; _i < 36; _i++) {
		pocket_sprite_label[_i] = game.add.text(30 * _i, 20, _i, labelStyle);
		pocket_sprite_label[_i].setText(pocket_bets[_i]);
		// pocket_sprite_label[_i].setText(_i);
		pocket_sprite_label[_i].anchor.setTo(0.5);
		pockets_group.add(pocket_sprite_label[_i]);
		set_pocket_coords_rotation(_i);
	}

	// instruction
	var _text_inst = game.add.text(10, 700, '', labelStyle);
	_text_inst.setText('Hit SPACEBAR or\nClick on screen to Spin');
	// text showing current poket and index of pocket_bets
	currentPocket = game.add.text(10, 650, '0', labelStyle);
	// needle
	needle = game.add.sprite(298, 20, 'needle');
	needle.scale.set(0.27);
	needle.anchor.setTo(0.5, 0);

	getCurrentPocket();
	var key1 = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	key1.onDown.add(spinWheel, this);

	var key2 = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
	key2.onDown.add(spinWheelLeft, this);

	var key3 = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
	key3.onDown.add(spinWheelRight, this);

	// mouse input
	var _click = (window.ontouchstart === undefined)? 'click' : 'touchstart';
	game.canvas.addEventListener(_click, function () {
		spinWheel();
	});
}

function update () {
	if(pocketChanged >= 0) {
		if (spinState == false && pocketChanged == 0) {
			tickSound.play();
			needle.angle = 0;
			needleTween = game.add.tween(needle).to( { angle: 10 }, 200, Phaser.Easing.Cubic.InOut, true);
			pocketChanged = -1;
		} else {
			if(reelHasSlowedDown === true){
				tickSound.play();
			}
			needle.angle = -10;
			needleTween = game.add.tween(needle).to( { angle: 0 }, 100, Phaser.Easing.Bounce.Out, true);
			pocketChanged = -1;
		}
	}
}


function spinWheelLeft() {
	pockets_group.angle--;
	needle.angle = 0;
	getCurrentPocket();
}

function spinWheelRight() {
	pockets_group.angle++;
	needle.angle = 0;
	getCurrentPocket();
}


function spinWheel() {
	if (spinState === true) return;
	spinState = true;
	reelHasSlowedDown = false;
	angleBefore = pockets_group.angle;
	var rand_angle = Math.floor(Math.random() * 360);
	var rand_time = Math.floor(Math.random() * 2000);
	rand_time -= 1000;
	var _tween = game.add.tween(pockets_group).to({
		angle: 1080 + rand_angle
	}, 11000 + rand_time, function(k) {
		getCurrentPocket();
		if(k > 0.5 && reelHasSlowedDown === false) {
			reelHasSlowedDown = true;
		}
		return --k * k * k + 1;
	}, true);

	_tween.onComplete.add(doSomething, this);

	function doSomething() {
	// reset once to the degree under 360
		pockets_group.angle = Math.ceil(pockets_group.angle % 360);
		angleAccum = 0;
		angleBefore = 0;
		angleDiff = 0;
		spinState = false;
		getCurrentPocket();
	}
}

function getCurrentPocket() {
  var _currentAngle = Math.floor((pockets_group.angle + 90) % 360); // at the top
  var _currentPocketNum = 35 - Math.floor(_currentAngle / 10);
  // pocket_bets
  if (previousPocketNum != _currentPocketNum) {
  	pocketChanged = _currentAngle % 10;
  }
  previousPocketNum = _currentPocketNum;
  currentPocket.setText(_currentPocketNum + ' / ' + pocket_bets[_currentPocketNum]);
}
//
function rotate_sprite($_target, turn_angle) {
	var _current_angle = $_target.angle;
	$_target.angle = _current_angle + turn_angle;
}

function set_pocket_coords_rotation(pocketNumber, pocketLabel) {
	var item_num = 36;
	var deg = 360.0 / item_num;
	var red = (deg * Math.PI / 180.0);
	var circle_r = 100 * 5.2;
	var x = Math.cos(red * pocketNumber) * circle_r + circle_r;
	var y = Math.sin(red * pocketNumber) * circle_r + circle_r
	pocket_sprite[pocketNumber].x = x - circle_r;
	pocket_sprite[pocketNumber].y = y - circle_r;
	pocket_sprite[pocketNumber].angle = (deg * pocketNumber) + 80;
  // label
  circle_r = 100 * 4.5;
  x = Math.cos(red * (pocketNumber + 0.4)) * circle_r + circle_r;
  y = Math.sin(red * (pocketNumber + 0.4)) * circle_r + circle_r;
  pocket_sprite_label[pocketNumber].x = x - circle_r;
  pocket_sprite_label[pocketNumber].y = y - circle_r;
  pocket_sprite_label[pocketNumber].angle = (deg * pocketNumber) + 94;
}