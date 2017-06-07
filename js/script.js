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

var Game = new Phaser.Game(600,600,Phaser.CANVAS,'gameContainer', { preload: preload, create: create, update: update} );

var tickSound;
var currentPocketDisplay;

function preload () {
	loadingLabel = Game.add.text(80, 150, 'loading...', {font: '30px Courier', fill: '#fff'});
	Game.load.image('pocket_black', 'images/pocket_black.png');
	Game.load.image('pocket_red', 'images/pocket_red.png');
	Game.load.image('needle', 'images/needle.png');
	Game.load.audio('tick', 'sound/waka.wav');
}

function create () {
	loadingLabel.destroy();
	Game.stage.setBackgroundColor('#777777');
	Game.time.advancedTiming = true;
	Game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

	/**
	 * Required Instances
	 */
	tickSound = Game.add.audio('tick');
	tickSound.allowMultiple = true;

	/**
	 * For debugging
	 */
	currentPocketDisplay = Game.add.text(0, 0, '0', {font:"bold 128px Arial",fill: "#fff",boundsAlignH: "center",boundsAlignV: "middle"});
	currentPocketDisplay.setTextBounds(0, 200, 595, 230);

	/**
	 * Events
	 */
	PCB.event.add('rouletteInitialized',function() {
	});
	PCB.event.add('reelSpinStarted',function() {
		tickSound.play('',0,1,true);
	});
	PCB.event.add('reelCountDownStarted',function() {
		tickSound.stop();
	});
	PCB.event.add('currentPocketChanged',function() {

	});
	PCB.event.add('currentPocketChangedAfterCountDown',function() {
		tickSound.play('',0,1,false);
		outputCurrentStop();
	});
	PCB.event.add('currentPocketChangedBeforeCountDown',function() {
		outputCurrentStop();
	});
	PCB.event.add('pocketChangedAtLastMoment',function() {
		tickSound.play('',0,1,false);
	});
	PCB.event.add('onCompleteSpinReel',function() {
		outputCurrentStop();
	});

	/**
	 * Init roulette
	 */
	rouletteModule.init('main');

	/**
	 * Key Events
	 */
	var key1 = Game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	key1.onDown.add(function() { rouletteModule.spinRoulette('main');} , this);
	// nudge the disc to left
	var key2 = Game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
	key2.onDown.add(function() {
		var $_rouletteUnit = rouletteModule.rouletteUnits.main;
		$_rouletteUnit.disc.angle--;
		$_rouletteUnit.needle.angle = 0;
		rouletteModule._getCurrentStopID('main',true);
		outputCurrentStop();
	}, this);
	// nudge the disc to right
	var key3 = Game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
	key3.onDown.add(function() {
		var $_rouletteUnit = rouletteModule.rouletteUnits.main;
		$_rouletteUnit.disc.angle++;
		$_rouletteUnit.needle.angle = 0;
		rouletteModule._getCurrentStopID('main',true);
		outputCurrentStop();
	}, this);

	// mouse input
	var _click = (window.ontouchstart === undefined)? 'click' : 'touchstart';
	Game.canvas.addEventListener(_click, function () {
		rouletteModule.spinRoulette('main');
	});
}

function update () {
}

function outputCurrentStop(){
	var $_targetUnit = rouletteModule.rouletteUnits.main;
	var _pocketIndex = $_targetUnit.currentStop;
	currentPocketDisplay.setText($_targetUnit.pocketBetStrip[_pocketIndex]);
}

