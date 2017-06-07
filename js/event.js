/*
	logic: event
	global events manager
*/
// Make Printed circuit board if it does not exist yet (to deal with load order issue here).
if(!PCB) var PCB = {};

// print PCB
// uses Register.signalInstances
PCB.event = {
	/** properties */
	'events': {},
	/** methods */
	trigger: function( _eventName, _context ) {
		if(this.events.hasOwnProperty(_eventName)) {
			this.events[_eventName](_context);
		} else {
			return false;
		};
	},
	add: function( _eventName , _eventFunction ) {
		if(_eventFunction !== undefined && typeof _eventFunction === 'function') {
			if(this.events.hasOwnProperty(_eventName)) {
				delete this.events[_eventName];
			};
			this.events[_eventName] = _eventFunction;
		} else {
			return false;
		};
	},
	remove: function( _eventName ) {
		if( this.events.hasOwnProperty(_eventName)) {
			delete this.events[_eventName];
		} else {
			return false;
		};
	},
	removeAll: function() {
		this.events = {};
	},
};