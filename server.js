/**
 * Showing with the Express framwork http://expressjs.com/
 * Express must be installed for this sample to work
 */

var tropowebapi = require('./lib/tropo-webapi');
var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var request = require('request');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

 app.get('/', function (req, res) {
    res.send('Hello from Cisco Shipped!');
});
	 

app.post('/', function(req, res){
	
	// Create a new instance of the TropoWebAPI object.
	var tropo = new tropowebapi.TropoWebAPI();
	 
	tropo.say("Welcome to Shipped Tropo Web API demo.");

	var say = new Say(" For weather, press 1. For contact search, press 2.");
	var choices = new Choices("1,2");
	    
	tropo.ask(choices, 3, false, null, "foo", null, true, say, 5, null);	
	tropo.on("continue", null, "/selection", true);	
	 
    res.send(tropowebapi.TropoJSON(tropo));
});

//option selection 
app.post('/selection', function(req, res) {
	  
	var tropo = new tropowebapi.TropoWebAPI();	
	var choice=req.body.result.actions.interpretation;	 
	tropo.say("Your choice is invalid.");
	
	if (choice == "1"){
		weatherReport(res,function(){});
	}else if (choice == "2"){
		attendent(choice,res, function(){
				
		})
	}else{
	res.send(tropowebapi.TropoJSON(tropo));
	}
 });
	
// define the list of contacts

var contacts = { 	"jason": { nameChoices: "Jason, Jason Goecke", number: "14075551212" },
					"adam" : { nameChoices: "Adam, Adam Kalsey",    number: "14075551313" },
					"jose" : { nameChoices: "Jose, Jose de Castro",    number: "14075551414" } };
attendent = function(choice,res, callback){
	var tropo = new tropowebapi.TropoWebAPI();	
	listNames= function ( theContacts )
	{
	  var s = '';
	  for( var contact in theContacts )
	  {
		if (s != '') { s = s + ", " };
		s = s + contact;
	  }
	  return s;
	}

	// -----------
	// turn the contacts into a comma separated list of options for each contact (simple grammar)

	listOptions=function ( theContacts )
	{
	  var s ='';
	  for( var contact in theContacts )
	  {
		if (s != '') { s = s + ", " };
		s = s + contact + " (" + theContacts[ contact ].nameChoices + ")";
	  }
	  return s;
	}



	tropo.say("Searching for contacts.");
	
	//Create event objects
	var e1 = {"value":"Sorry, I did not hear anything.","event":"timeout"};
    var e2 = {"value":"Sorry, that was not a valid option.","event":"nomatch:1"};
    var e3 = {"value":"Nope, still not a valid response","event":"nomatch:2"};
    
    //Create an array of all events
    var e = new Array(e1,e2,e3);
       
	// Demonstrates how to use the base Tropo action classes.
	var say = new Say("Who would you like to call?  Just say " + listNames( contacts ), null, e, null, null, null);
		 
	var choices = new Choices(listOptions( contacts ));	 
	tropo.ask(choices, 3, false, null, "foo", null, true, say, 5, null);
	tropo.on("continue", null, "/contact", true);
	
	res.send(tropowebapi.TropoJSON(tropo));
	callback();
};

app.post('/contact', function(req, res){	
	 
	var tropo = new tropowebapi.TropoWebAPI();
	 
	var contact=req.body.result.actions.interpretation;
	//var contact="adam";
	tropo.say( "ok, you said " + contact +" .");	
	var c= contacts[contact];
	if (c == undefined){
		tropo.say("Could not able to find contact information for contact "+contact+", Please try again." );
	}else{
		 tropo.say("Please hold while I transfer you." );
		 tropo.transfer(contacts[contact].number, false, null, null, {'x-caller-name' : contact}, null, null, true, '#', 60.0);
	}
	
	
	tropo.say( "Goodbye !");
	 res.send(tropowebapi.TropoJSON(tropo));
	
});
	
weatherReport=function(res,callback){
	var tropo = new tropowebapi.TropoWebAPI();
// Demonstrates how to use the base Tropo action classes.
	var say = new Say("Please enter your 5 digit zip code.");
	var choices = new Choices("[5 DIGITS]");

	// Action classes can be passes as parameters to TropoWebAPI class methods.
	// use the ask method https://www.tropo.com/docs/webapi/ask.htm
	tropo.ask(choices, 3, false, null, "foo", null, true, say, 5, null);
	 
	
	// use the on method https://www.tropo.com/docs/webapi/on.htm
	tropo.on("continue", null, "/answer", true);
	 
    res.send(tropowebapi.TropoJSON(tropo));	
	callback();
};

getWeather=function(zip, callback){
	request('http://api.openweathermap.org/data/2.5/weather?zip='+zip+'&appid=a8f81765ac74e18e357c9496ac295aad', function (error, response, body) {
	if (!error && response.statusCode == 200) {
    callback(body)
	 
	}});
	
};

app.post('/answer', function(req, res){	
	 var tropo = new tropowebapi.TropoWebAPI();
	//console.log(req.body['result']['actions']['interpretation'])
	var zip=req.body.result.actions.interpretation;
	tropo.say("Fetching weather information for your zip code "+ zip +".");
	getWeather(zip,function(response){
		var j= JSON.parse(response)
			if(j.cod==200){
				
				var wtr= " Weather for "+j.name+" is ! clouds " +j.weather[0].description+ ", Temperature " +j.main.temp +" kelvin, Pressure " +j.main.pressure +", Humidity " +j.main.humidity +"%"
				console.log(wtr);
				tropo.say(wtr);
				tropo.say( "Goodbye !");
			}
			else{
				console.log(j.message);
				tropo.say( "Oops ! "+ j.message);
				tropo.say( "Please try again.");
			}	
		 res.send(tropowebapi.TropoJSON(tropo));
	});
	
});

app.listen(3000);
console.log('Server running on http://0.0.0.0:3000/');
