/**
 * @author       Shu Miyao
 * @copyright    2017 Shu Miyao
 * @license      {@link http://opensource.org/licenses/MIT}
 *
 * Available events:
 * 					rouletteInitialized
 * 					currentPocketChanged
					currentPocketChangedAfterCountDown
					currentPocketChangedBeforeCountDown
					onCompleteSpinReel
					reelCountDownStarted
 */
var rouletteModule = {
	/**
	 * Instances
	 */
	/** rouletteUnits prop contains a Phaser group that holds from lable, disc to needle */
	'rouletteUnits': {},
	/**
	 * Properties
	 */
	/**
	 * Constants
	 */
	'NUMBER_OF_POCKETS': 36,
	'DEGREE_OF_A_POCCKET': 10,
	'LABEL_STYLE': {
		font: "bold 25px Arial",
		fill: "#fff",
		boundsAlignH: "center",
		boundsAlignV: "middle"
	},
	/**
	 * Public Methods
	 */
	 /**
	  * Initialize
	  *
	  * @param      {string}  rouletteID       The roulette id
	  * @param      {array}   pocketBetStrip    The pocket bet strip (optional)
	  */
	init: function (rouletteID,pocketBetStrip,labelStyle) {
		if(!rouletteID) {
			console.log('No ID specified.');
			return false;
		}
		if(labelStyle){
			this.LABEL_STYLE = labelStyle;
		}
		pocketBetStrip = pocketBetStrip || ['2', '6', '2', '4', '10', '2', '4', '6', '0', '4', '8', '2', '6', '2', '4', '2', '10', '2', '6', '4', '2', '6', '2', '8', '2', '4', '0', '30', '2', '8', '4', '2', '10', '2', '4', '8'];
		this._buildRouletteUnit(rouletteID,pocketBetStrip);
		// reset the needle
		this._getCurrentStopID(rouletteID,true);
		// rouletteInitialized
		PCB.event.trigger('rouletteInitialized');
	},
	/**
	 * Spin the roulette disc
	 *
	 * @param      {string}  rouletteID       The roulette id
	 */
	spinRoulette: function (rouletteID) {
		/** _self */
		var _self = this;
		var $_currentRouletteUnit = this.rouletteUnits[rouletteID];

		/** return if the reel is already in motion */
		if($_currentRouletteUnit.isSpinning === true) return;

		/** set the spin state immediately */
		$_currentRouletteUnit.isSpinning = true;

		/** reelSpinStarted event can be used to start playing the sound */
		PCB.event.trigger('reelSpinStarted');

		/** define variables */
		var $_targetDisc = $_currentRouletteUnit.disc;

		/** randomize angle and duration of spinning */
		var _rand_angle = Math.floor(~~(Math.random()*(360)));
		var _rand_time = Math.floor(Math.random() * 2000) - 1000;
		/** using tween to spin the wheel */
		var _tween = Game.add.tween($_targetDisc).to({
			angle: 1080 + _rand_angle
		}, 11000 + _rand_time, function(k) {
			_self._getCurrentStopID(rouletteID);
			if(k > 0.53 && $_currentRouletteUnit.reelCountDownStarted === false) {
				$_currentRouletteUnit.reelCountDownStarted = true;
				PCB.event.trigger('reelCountDownStarted');
			}
			return --k * k * k + 1;
		}, true);

		_tween.onComplete.add(_findFinalResult, this);

		function _findFinalResult() {
			// reset once to the degree under 360
			$_targetDisc.angle = $_targetDisc.angle % 360;
			$_currentRouletteUnit.isSpinning = false;
			$_currentRouletteUnit.reelCountDownStarted = false;
			_self._getCurrentStopID(rouletteID,true);
			/** trigger event */
			PCB.event.trigger('onCompleteSpinReel');
		}
	},
	/**
	 * Private methods
	 */
	/**
	 * Sensors
	 */
	/**
	 * Gets the current pocket.
	 *
	 * @param      {string}		rouletteID    The reel id
	 * @param      {bool}  		lastTick  Is the last tick just before finalizing the result?
	 */
	_getCurrentStopID: function (rouletteID,lastTick) {
		// backdoors
		var $_targetUnit = this.rouletteUnits[rouletteID];
		var $_targetDisc = $_targetUnit.disc;
		// props
		_reelCountDownStarted = $_targetUnit.reelCountDownStarted;

		//default value
		lastTick = (!lastTick) ? false : true;

		// Rotation - take the position of needle into account (90 degrees)
		var _currentAngle = Math.floor(($_targetDisc.angle + 90) % 360);

		// find the current pocket pointed by the needle.
		// NUMBER_OF_POCKETS needs to be a total sum of index, zero based. So it needs to be substracted by 1.
		var _currentPocketNum = this.NUMBER_OF_POCKETS - 1 - Math.floor(_currentAngle / this.DEGREE_OF_A_POCCKET);
		$_targetUnit.currentStop = _currentPocketNum;

		// detect whether the pocket has been changed or not.
		var _hasPocketHasChanged = $_targetUnit.previousStop != _currentPocketNum;

		// rotate disc
		$_targetUnit.currentAngle = _currentAngle;

		// update the register
		$_targetUnit.previousStop = _currentPocketNum;

		// pocketBetStrip
		if(_hasPocketHasChanged === true) {
			PCB.event.trigger('currentPocketChanged');
			if (_reelCountDownStarted === true ) {
				PCB.event.trigger('currentPocketChangedAfterCountDown');
			} else {
				PCB.event.trigger('currentPocketChangedBeforeCountDown');
			}
			/**
			* needle movement
			*
			* atBorder is determined: each pocket has 10 degrees when there are 36 pockets,
			* the needle must be right on the boarder when there is no remainder
			*/
			this._animateNeedle(rouletteID, lastTick, _currentAngle % this.DEGREE_OF_A_POCCKET);
		}
	},
	/**
	 * For movement
	 */
	/**
	 * Animate the needle
	 *
	 * @param      {string}  	rouletteID    The reel id
	 * @param      {bool}  		lastTick  Is the last tick just before finalizing the result?
	 * @param      {number}   	atBorder  The at border
	 */
	_animateNeedle: function (rouletteID,lastTick,atBorder) {
		// console.log(atBorder);
		var $_targetNeedle = this.rouletteUnits[rouletteID].needle;

		if(lastTick === true && atBorder == 0) {
			// for near miss effect
			$_targetNeedle.angle = 0;
			Game.add.tween($_targetNeedle).to( { angle: 10 }, 100, Phaser.Easing.Bounce.Out, true);
			PCB.event.trigger('pocketChangedAtLastMoment');
		} else {
			// regular ticking animation
			$_targetNeedle.angle = -20;
			Game.add.tween($_targetNeedle).to( { angle: 0 }, 100, Phaser.Easing.Bounce.Out, true);
		}
	},
	/**
	 * For visuals / init
	 */
	/**
	 * Builds a roulette disc.
	 *
	 * @uses	sprites of 'pocket_red' and 'pocket_black'
	 *
	 * @param      {string} 	rouletteID			ID of roulette id.
	 * @param      {array}	 	pocketBetStrip		Numerical sequence of the pocket bet amount.
	 *
	 * @return     {object}		Instance of rouletteUnit
	 */
	_buildRouletteUnit: function (rouletteID,pocketBetStrip) {
		/**
		 * Initialize a new roulette unit
		 */
		/** target roulette instance */
		var $_rouletteUnit = this.rouletteUnits;
		/** create new */
		var $_currentRouletteUnit = $_rouletteUnit[rouletteID] = {};
		/** Backdoors for later access */
		$_currentRouletteUnit.unit = Game.add.group();
		$_currentRouletteUnit.disc = Game.add.group();
		$_currentRouletteUnit.needle = {}; // Phaser sprite
		/** configuration for the roulette unit */
		var _currentPocketBetStrip = $_currentRouletteUnit.pocketBetStrip = [] = pocketBetStrip;
		/** properties for the roulette unit */
		$_currentRouletteUnit.reelCountDownStarted = false;
		$_currentRouletteUnit.isSpinning = false;

		/**
		 * Placing graphic elements into a new roulette unit.
		 */
		/* parameters */
		var _pocketType = ['pocket_red', 'pocket_black'];

		/* work variables */
		var _pocketSelector = 0;
		var _pocketSprite = [];
		var _pocketSpriteLabel = [];

		//	Here we add sprites for the pockets.
		for (var _i = 0; _i < this.NUMBER_OF_POCKETS; _i++) {
			/** different colors depending on parity */
			_pocketSelector = (_i % 2 == 0) ? 0 : 1;
			/** add the pocket background sprite */
			_pocketSprite[_i] = Game.add.sprite(0,0, _pocketType[_pocketSelector]);
			/** Setting anchor at the edge of sprite */
			_pocketSprite[_i].anchor.setTo(1, 0);
			/** as well as the scale size */
			_pocketSprite[_i].scale.set(0.5);
			/** add to the disc group */
			$_currentRouletteUnit.disc.add(_pocketSprite[_i]);
		}

		// set label and adjust position and rotation
		for (var _i = 0; _i < this.NUMBER_OF_POCKETS; _i++) {
			_pocketSpriteLabel[_i] = Game.add.text(0,0, _i, this.LABEL_STYLE);
			_pocketSpriteLabel[_i].setText(_currentPocketBetStrip[_i]);
			/** Setting anchor at right in the middle */
			_pocketSpriteLabel[_i].anchor.setTo(0.5);
			/** add to the disc group */
			$_currentRouletteUnit.disc.add(_pocketSpriteLabel[_i]);
		}

		// adjust the adjust position and rotation
		for (var _i = 0; _i < this.NUMBER_OF_POCKETS; _i++) {
			this.__setPocketCoordinatesAndRotation(_i,_pocketSprite[_i],_pocketSpriteLabel[_i]);
		}

		// Place the needle
		$_currentRouletteUnit.needle = Game.add.sprite(-3, -279, 'needle');
		/** scaling as it is too huge for the Game */
		$_currentRouletteUnit.needle.scale.set(0.27);
		/** Setting anchor at right in the middle */
		$_currentRouletteUnit.needle.anchor.setTo(0.5, 0);

		// add all to the one parent group
		$_currentRouletteUnit.unit.add($_currentRouletteUnit.disc);
		$_currentRouletteUnit.unit.add($_currentRouletteUnit.needle);
		$_currentRouletteUnit.unit.x = 300;
		$_currentRouletteUnit.unit.y = 300;
		// return the instances
		return $_currentRouletteUnit;
	},
	/**
	 * Sets the pocket coordinates and rotation.
	 *
	 * @param      {number}  pocketIndexNumber  The pocket index number
	 * @param      {object}  $pocketSprite   The pocket sprite object
	 */
	__setPocketCoordinatesAndRotation: function (pocketIndexNumber, $pocketSprite, $pocketLabelSprite) {
		var _item_num = this.NUMBER_OF_POCKETS;
		var _degreeOfaPocket = 360 / _item_num;
		var _radianOfaPocket = _degreeOfaPocket * (Math.PI / 180);
		var _circleRadius, _x, _y;

		/** Coordinates and rotation for the poket background */
		_circleRadius = 50 * 5.2; // distance from the center of roulette circle.
		_x = Math.cos(_radianOfaPocket * pocketIndexNumber) * _circleRadius + _circleRadius;
		_y = Math.sin(_radianOfaPocket * pocketIndexNumber) * _circleRadius + _circleRadius;
		$pocketSprite.x = _x - _circleRadius;
		$pocketSprite.y = _y - _circleRadius;
		$pocketSprite.angle = (_degreeOfaPocket * pocketIndexNumber) + 80;

		/** Coordinates and rotation for the labels */
		_circleRadius = 50 * 4.5; // distance from the center of roulette circle.
		_x = Math.cos(_radianOfaPocket * (pocketIndexNumber + 0.4)) * _circleRadius + _circleRadius;
		_y = Math.sin(_radianOfaPocket * (pocketIndexNumber + 0.4)) * _circleRadius + _circleRadius;
		$pocketLabelSprite.x = _x - _circleRadius;
		$pocketLabelSprite.y = _y - _circleRadius;
		$pocketLabelSprite.angle = (_degreeOfaPocket * pocketIndexNumber) + 94;
	},
}