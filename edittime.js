function GetPluginSettings()
{
	return {
		"name":			"SocketMan",				// as appears in 'insert object' dialog, can be changed as long as "id" stays the same
		"id":			"SocketMan",				// this is used to identify this plugin and is saved to the project; never change it
		"version":		"1.0",						// (float in x.y format) Plugin version - C2 shows compatibility warnings based on this
		"description":	"Socket.Io Handler",
		"author":		"Digital Mania S.A.R.L",
		"help url":		"http://www.digitalmaniastudio.com/",
		"category":		"Network",					// Prefer to re-use existing categories, but you can set anything here
		"type":			"object",					// "object" means that the plugin is available to the whole project
		"rotatable":	false,						// only used when "type" is "world".  Enables an angle property on the object.
		"flags":		pf_singleglobal,			// Single globale object, this flag used in addition to type : object
		"dependency":	"socket.io.js",
	};
};

////////////////////////////////////////
// Conditions
// Conditions are use to check an event on runtime until it happen and trig a list of actions
// AddCondition(id,					// any positive integer to uniquely identify this condition
//				flags,				// (see docs) cf_none, cf_trigger, cf_fake_trigger, cf_static, cf_not_invertible,
//									// cf_deprecated, cf_incompatible_with_triggers, cf_looping
//				list_name,			// appears in event wizard list
//				category,			// category in event wizard list
//				display_str,		// as appears in event sheet - use {0}, {1} for parameters and also <b></b>, <i></i>
//				description,		// appears in event wizard dialog when selected
//				script_name);		// corresponding runtime function name

// On Connect (With no params): This condition is satisfied when the socket is successfully connected to the server, generally this condition is trigged after a connect action.				
AddCondition(0,cf_trigger,"On connect","Socket","On connect","Triggered when the socket successfully connects to an address.","OnConnect");

// On Event (With one param < event name >): This condition return true when the client receive the specified event.
AddStringParam("Socket Event","The Event to check.","\"\"");
AddCondition(1,cf_trigger,"On event received","Socket","On <i>{0}</i> received","Triggered when SocketMan receives a socket event.","OnEvent");

// On Disconnect (With no params): If the server disconnect the client or the client force the disconnection, this condition will return true. 
// It happen when the server send disconnect or after disconnect action. 
AddCondition(2,cf_trigger,"On disconnect","Socket","On disconnect","Triggered when the SocketMan disconnects from an address.","OnDisconnect");

// On any event (With no params): If the client receive any event (including connect and disconnect), this condition will return true.
AddCondition(3,cf_trigger,"On any event","Socket","On any socket event","Triggered when SocketMan receives any event.","OnAnyEvent");

// To optimize the runtime, All condition are trigged from runtime.js file (Not every tick).
// All condition lives in the runtime during the whole execution of the application.
// All condition can be satisfied many times (Not execute once).
// Conditions

////////////////////////////////////////
// Actions
// Actions are executed when their container's condition are satisfied
// AddAction(id,				// any positive integer to uniquely identify this action
//			 flags,				// (see docs) af_none, af_deprecated
//			 list_name,			// appears in event wizard list
//			 category,			// category in event wizard list
//			 display_str,		// as appears in event sheet - use {0}, {1} for parameters and also <b></b>, <i></i>
//			 description,		// appears in event wizard dialog when selected
//			 script_name);		// corresponding runtime function name

// Connect (Address, Port): This action attempt to establish between connection between client and server:port
// Mainly it fire < on connect > condition
AddStringParam("Address","Connection adress. Supports cross-domain requests.","\"localhost\"");
AddNumberParam("Port","","80");
AddAction(0,0,"Connect","Socket","Connecting to <b>{0}</b>:<b>{1}</b>","Connect to an address / port.","Connect");

// Emit (Event, Data): Send and event with the associated data to server
AddStringParam("Event","The event to emit through the socket.","\"\"");
AddStringParam("Data","The data to emit through the socket.","\"\"");
AddAction(1, 0, "Emit", "Socket", "Emit <i>{0}</i>, <b>{1}</b>", "Emit Socket event through the socket.", "Emit");

// Disconnect (With no params): Force client to disconnect from server. This action will fire on disconnect condition
AddAction(2, 0, "Disconnect", "Socket", "Disconnect from server", "Disconnect from server.", "Disconnect");

// SocketMan will ignore all actions if the socket is not connected
// Actions

////////////////////////////////////////
// Expressions
// Expressions are used to retrieve some data used or received by the plugin
// AddExpression(id,			// any positive integer to uniquely identify this expression
//				 flags,			// (see docs) ef_none, ef_deprecated, ef_return_number, ef_return_string,
//								// ef_return_any, ef_variadic_parameters (one return flag must be specified)
//				 list_name,		// currently ignored, but set as if appeared in event wizard
//				 category,		// category in expressions panel
//				 exp_name,		// the expression name after the dot, e.g. "foo" for "myobject.foo" - also the runtime function name
//				 description);	// description in expressions panel

// Get Event Data (Event name): Retrive the received by a specific event, if the event was not received SocketMan will return 0.
// This implementation of receiving data will escape the fact the data is overrided when two different events are received at the same time 
AddStringParam("Event name", "The name of the event to get the associated data");
AddExpression(0, ef_return_any, "GetEventData", "Socket", "GetEventData", "Data received for a specific event.");

// LastEventName (With no params): Will print the last event received by the client (including connect and disconnect)
AddExpression(1, ef_return_any, "LastEventName", "Socket", "LastEventName", "Get last event recieved name");

// LastEventData (With no data): Will print the last event's data received by the client (including connect and disconnect)
// In the case of < connect > and < disconnect > the data returned will be an empty string
AddExpression(2, ef_return_any, "LastEventData", "Socket", "LastEventData", "Get last event recieved data");

// LastEventName and LastEventData can be used for testing purpose with the < on any event > conditions.
// Expressions

////////////////////////////////////////
ACESDone();

////////////////////////////////////////
// Properties
// Define the list of plugin properties here
// Array of property grid properties for this plugin
// new cr.Property(ept_integer,		name,	initial_value,	description)		// an integer value
// new cr.Property(ept_float,		name,	initial_value,	description)		// a float value
// new cr.Property(ept_text,		name,	initial_value,	description)		// a string
// new cr.Property(ept_color,		name,	initial_value,	description)		// a color dropdown
// new cr.Property(ept_font,		name,	"Arial,-16", 	description)		// a font with the given face name and size
// new cr.Property(ept_combo,		name,	"Item 1",		description, "Item 1|Item 2|Item 3")	// a dropdown list (initial_value is string of initially selected item)
// new cr.Property(ept_link,		name,	link_text,		description, "firstonly")		// has no associated value; simply calls "OnPropertyChanged" on click

var property_list = [];
	
// Called by IDE when a new object type is to be created
function CreateIDEObjectType()
{
	return new IDEObjectType();
}

// Class representing an object type in the IDE
function IDEObjectType()
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
}

// Called by IDE when a new object instance of this type is to be created
IDEObjectType.prototype.CreateInstance = function(instance)
{
	return new IDEInstance(instance);
}

// Class representing an individual instance of an object in the IDE
function IDEInstance(instance, type)
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
	
	// Save the constructor parameters
	this.instance = instance;
	this.type = type;
	
	// Set the default property values from the property table
	this.properties = {};
	
	for (var i = 0; i < property_list.length; i++)
		this.properties[property_list[i].name] = property_list[i].initial_value;
		
	// Plugin-specific variables goes here
}

// Called when inserted via Insert Object Dialog for the first time
IDEInstance.prototype.OnInserted = function()
{
}

// Called when double clicked in layout
IDEInstance.prototype.OnDoubleClicked = function()
{
}

// Called after a property has been changed in the properties bar
IDEInstance.prototype.OnPropertyChanged = function(property_name)
{
}

// For rendered objects to load fonts or textures
IDEInstance.prototype.OnRendererInit = function(renderer)
{
}

// Called to draw self in the editor if a layout object
IDEInstance.prototype.Draw = function(renderer)
{
}

// For rendered objects to release fonts or textures
IDEInstance.prototype.OnRendererReleased = function(renderer)
{
}