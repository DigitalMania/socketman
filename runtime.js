// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

/////////////////////////////////////
// Plugin class
// Plugin Id goes here - must match the "id" property in edittime.js
cr.plugins_.SocketMan = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	/////////////////////////////////////
	// Plugin Id goes here - must match the "id" property in edittime.js
	var pluginProto = cr.plugins_.SocketMan.prototype;
		
	/////////////////////////////////////
	// Object type class
	// C2 Specification
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};

	var typeProto = pluginProto.Type.prototype;

	// called on startup for each object type
	typeProto.onCreate = function()
	{
	};

	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
	};
	
	var instanceProto = pluginProto.Instance.prototype;

	// called whenever an instance is created
	// Init plugin varaibles must be here
	instanceProto.onCreate = function()
	{
		// Socket.io Object
		this.socket = null;
		// Container that holds all events and their data
		this.eventsData = {};
		// Container that hold the last event name and data
		this.lastEvent = {name: '', data:{}};
	};
	
	// called whenever an instance is destroyed
	// note the runtime may keep the object after this call for recycling; be sure
	// to release/recycle/reset any references to other objects in this function.
	instanceProto.onDestroy = function ()
	{
	};
	
	// called when saving the full state of the game
	instanceProto.saveToJSON = function ()
	{
		// return a Javascript object containing information about your object's state
		// note you MUST use double-quote syntax (e.g. "property": value) to prevent
		// Closure Compiler renaming and breaking the save format
		return {
			"socket" : this.socket,
			"eventsData" : this.eventsData,
			"lastEvent" : this.lastEvent,
		};
	};
	
	// called when loading the full state of the game
	instanceProto.loadFromJSON = function (o)
	{
		// load from the state previously saved by saveToJSON
		// 'o' provides the same object that you saved
		// note you MUST use double-quote syntax (e.g. o["property"]) to prevent
		// Closure Compiler renaming and breaking the save format
		this.socket = o["socket"];
		this.eventsData = o["eventsData"];
		this.lastEvent = o["lastEvent"];
	};
	
	// only called if a layout object - draw to a canvas 2D context
	instanceProto.draw = function(ctx)
	{
	};
	
	// only called if a layout object in WebGL mode - draw to the WebGL context
	// 'glw' is not a WebGL context, it's a wrapper - you can find its methods in GLWrap.js in the install
	// directory or just copy what other plugins do.
	instanceProto.drawGL = function (glw)
	{
	};
	
	// The comments around these functions ensure they are removed when exporting, since the
	// debugger code is no longer relevant after publishing.
	/**BEGIN-PREVIEWONLY**/
	instanceProto.getDebuggerValues = function (propsections)
	{
		var props = [];
		props.push({
			"name": "socket", 
			"value": this.socket
		});
		props.push({
			"name": "eventsData", 
			"value": this.eventsData
		});
		props.push({
			"name": "lastEvent", 
			"value": this.lastEvent
		});		

		// Append to propsections any debugger sections you want to appear.
		// Each section is an object with two members: "title" and "properties".
		// "properties" is an array of individual debugger properties to display
		// with their name and value, and some other optional settings.
		propsections.push({
			"title": "SocketMan debugger section",
			"properties": props
		});
	};
	
	instanceProto.onDebugValueEdited = function (header, name, value)
	{
		// Called when a non-readonly property has been edited in the debugger. Usually you only
		// will need 'name' (the property name) and 'value', but you can also use 'header' (the
		// header title for the section) to distinguish properties with the same name.
		if (name === "socket")
			this.socket = value;
		if (name === "eventsData")
			this.eventsData = value;
		if (name === "lastEvent")
			this.lastEvent = value;
	};
	/**END-PREVIEWONLY**/

	//////////////////////////////////////
	// Conditions
	// Contain all respectives function to the edittime.js file
	function Cnds() {};

	// Return ture every call
	// Trigged manually when the socket is sucssefully connected.
	Cnds.prototype.OnConnect = function() {
		return true;
	};
	
	// Check if the event was received
	// Check the proceeded flag. proceeded flag prevent the condition from returning always true when an event happen
	// This condition return true only when the event is present on the list of received event and the proceeded flag is at false
	// If all conditions are satisfied, we set the proceeded flag to true.
	Cnds.prototype.OnEvent = function(event_) {
		if(this.eventsData.hasOwnProperty(event_))
			if (this.eventsData[event_].proceeded)
				return false;
			else {
				this.eventsData[event_].proceeded = true;
				return true;
			}
		else
			return false;
	};

	// return true on every call
	// trigged manually when the socket is successfully disconnected from the server
	Cnds.prototype.OnDisconnect = function () {
		return true;
	};

	// return true on every call
	// trigged manually when any event received (including connect and disconnect)
	Cnds.prototype.OnAnyEvent = function() {
		return true;
	};
	pluginProto.cnds = new Cnds();
	
	// Conditions
	
	//////////////////////////////////////
	// Actions
	// Contain all respectives functions to the edittime.js file
	function Acts() {};

	// Connect to server and force trigging some conditions
	Acts.prototype.Connect = function (address_, port_) {
		if (!this.socket || !this.socket.connected) {
			// Connect to the server:port 
			this.socket = io.connect(address_ + ':' + port_.toString());
			var instance = this;
			var runtime = instance.runtime;

			// Handle the on connect callback
			this.socket.on('connect', function () {
				// Trigging on connect condition
				runtime.trigger(pluginProto.cnds.OnConnect,instance);
				// Setting last event to connect with no data
				instance.lastEvent = {name: 'connect', data: ''};
				// Trigging on any event
				runtime.trigger(pluginProto.cnds.OnAnyEvent,instance);
				// Handling on disconnect, it must be inside on connect callback to be sure that socket variable is connected and is no null
				instance.socket.on('disconnect', function () {
					// Trigging on disconnect condition
					runtime.trigger(pluginProto.cnds.OnDisconnect,instance);
					// Setting lastEvent to disconnect with no data
					instance.lastEvent = {name: 'disconnect', data: ''};
					// Trigging on any event condition
					runtime.trigger(pluginProto.cnds.OnAnyEvent,instance);	
				});

				// Handling on any event
				// To use this important feature, we must include the attached socket.io.js file because we force trigging < on anything event in the code > (on line 849 : emit.call(this, '*', packet);)  
				instance.socket["on"]('*', function(data){
					var eventName = data.data[0];
					var eventData = data.data[1];
					// Set the event name and event data in the events array
					// Set proceeded to flase to force on event returning true 
					instance.eventsData[eventName] = {data: eventData, prceeded: false};
					// Trig on event condition
					runtime.trigger(pluginProto.cnds.OnEvent,instance);
					// Set last event
					instance.lastEvent = {name: eventName, data: eventData};
					// Trig on any event condition
					runtime.trigger(pluginProto.cnds.OnAnyEvent,instance);
				});		
			});
		}
	};

	// Send an event and the associated to the server
	Acts.prototype.Emit = function (event_, data_) {
		if (this.socket && this.socket.connected) {
			var data;
			try {
				data = JSON.parse(data_);
			}
			catch(e) { 
				data = data_; 	
			}
			finally {
				this.socket.emit(event_, data);				
			}
		}
	};
	// Force client to disconnect from server
	Acts.prototype.Disconnect = function () {
		if (this.socket && this.socket.connected)
			this.socket.disconnect();
		this.socket = null;
	};
	pluginProto.acts = new Acts();
	// Actions

	//////////////////////////////////////
	// Expressions
	// Contain all respectives functions to the edittime.js file
	function Exps() {};
	
	// Return the data of the specified event
	// Check if the event name exist in the eventsReceived
	// Check the type of the value to return
	// If it is an object or an array, GetEventData will return a stringified version of the value
	Exps.prototype.GetEventData = function (ret, event_)
	{
		if(this.eventsData.hasOwnProperty(event_))
			if (typeof(this.eventsData[event_].data) == 'object')
				ret.set_string(JSON.stringify(this.eventsData[event_].data));
			else
				ret.set_any(this.eventsData[event_].data);	
		else
			ret.set_int(0);
	};
	
	// Return the last event name received
	Exps.prototype.LastEventName = function (ret)
	{
		ret.set_string(this.lastEvent.name);
	};

	// Return the last event data received
	// Applying the same checks as GetEventData expression in term of the type of the object
	Exps.prototype.LastEventData = function (ret)
	{
		if (typeof(this.lastEvent.data) == 'object')
			ret.set_string(JSON.stringify(this.lastEvent.data));
		else
			ret.set_any(this.lastEvent.data);	
	};

	pluginProto.exps = new Exps();
	// Expressions
}());