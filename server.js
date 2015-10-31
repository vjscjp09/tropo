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
app.use(bodyParser.urlencoded({
    extended: true
})); // for parsing application/x-www-form-urlencoded

app.get('/', function(req, res) {
    res.send('Hello from Cisco Shipped!');
});

//Main menu
app.post('/', function(req, res) {

    // Create a new instance of the TropoWebAPI object.
    var tropo = new tropowebapi.TropoWebAPI();

    tropo.say("Welcome to Shipped Tropo Web API demo.");

    // use the ask method https://www.tropo.com/docs/webapi/say.htm	 
    var say = new Say(" . For weather, press 1. For contact search, press 2.");
    var choices = new Choices("1,2");

    // Action classes can be passes as parameters to TropoWebAPI class methods.
    // use the ask method https://www.tropo.com/docs/webapi/ask.htm	 
    tropo.ask(choices, 3, false, null, "foo", null, true, say, 5, null);

    // use the on method https://www.tropo.com/docs/webapi/on.htm	
    tropo.on("continue", null, "/selection", true);

    res.send(tropowebapi.TropoJSON(tropo));
});

//on Main menu option selection 
app.post('/selection', function(req, res) {

    var tropo = new tropowebapi.TropoWebAPI();
    console.log("--selection --");
    console.log(req.body.result);
    var choice = req.body.result.actions.interpretation;
    tropo.say("Your choice is invalid.");

    if (choice == "1") {
        weatherReport(res, function() {});
    } else if (choice == "2") {
        attendent(choice, res, function() {

        })
    } else {
        res.send(tropowebapi.TropoJSON(tropo));
    }
});

// define the list of contacts
var contacts = {
    "neelesh": {
        nameChoices: "Neelesh, Nelesh p",
        number: "6697778304"
    },
    "adam": {
        nameChoices: "Adam, Adam Kalsey",
        number: "3022662842"
    },
    "jose": {
        nameChoices: "Jose, Jose de Castro",
        number: "13022662842"
    }
};

//helper func
//return string with , seperated contacts
listNames = function(theContacts) {
    var s = '';
    for (var contact in theContacts) {
        if (s != '') {
            s = s + ", "
        };
        s = s + contact;
    }
    return s;
};

//for Nomae choice object
listOptions = function(theContacts) {
    var s = '';
    for (var contact in theContacts) {
        if (s != '') {
            s = s + ", "
        };
        s = s + contact + " (" + theContacts[contact].nameChoices + ")";
    }
    return s;
};

attendent = function(choice, res, callback) {
    var tropo = new tropowebapi.TropoWebAPI();

    tropo.say("Searching for contacts.");
    //Create event objects
    var e1 = {
        "value": "Sorry, I did not hear anything.",
        "event": "timeout"
    };
    var e2 = {
        "value": "Sorry, that was not a valid option.",
        "event": "nomatch:1"
    };
    var e3 = {
        "value": "Nope, still not a valid response",
        "event": "nomatch:2"
    };

    //Create an array of all events
    var e = new Array(e1, e2, e3);

    // Demonstrates how to use the base Tropo action classes.
    var say = new Say("Who would you like to call?  Just say " + listNames(contacts), null, e, null, null, null);

    var choices = new Choices(listOptions(contacts));
    tropo.ask(choices, 3, false, null, "foo", null, true, say, 5, null);
    tropo.on("continue", null, "/contact", true);

    res.send(tropowebapi.TropoJSON(tropo));
    callback();


};

// on contact selection.
app.post('/contact', function(req, res) {

    var tropo = new tropowebapi.TropoWebAPI();
    var contact = req.body.result.actions.interpretation;

    //console.log(contact)

    tropo.say("ok, you said " + contact + " .");

    contact = contact.toLowerCase() // for searching name from contacts array.
    var c = contacts[contact];
    if (c == undefined) {
        tropo.say("Could not able to find contact information for contact " + contact + ", Please try again.");
    } else {
        tropo.say("Please hold while I transfer you. Call forwarding will only works if your account is activated for call forwarding feature.");

        //added ring while answered by other person.
        var say1 = new Say("http://www.phono.com/audio/holdmusic.mp3");
        var on = new On("ring", null, null, false, say1);

        //transfer call to the requested contact.
        tropo.transfer(c.number, false, null, null, {
            'x-caller-name': contact
        }, null, on, true, '#', 60.0);
        //sms
        //tropo.call(c.number, null, null, null, null, null, "SMS", null, null, null);

    }

    tropo.say("Goodbye !");
    res.send(tropowebapi.TropoJSON(tropo));

});

//
//For weather report
//

//On weather report selection from main menu.
weatherReport = function(res, callback) {
    var tropo = new tropowebapi.TropoWebAPI();

    var say = new Say("Please enter your 5 digit zip code.");
    var choices = new Choices("[5 DIGITS]");

    tropo.ask(choices, 3, false, null, "foo", null, true, say, 5, null);
    tropo.on("continue", null, "/answer", true);

    res.send(tropowebapi.TropoJSON(tropo));
    callback();
};

//on entering 5 digit zip code.
app.post('/answer', function(req, res) {
    var tropo = new tropowebapi.TropoWebAPI();
    //console.log(req.body['result']['actions']['interpretation'])
    var zip = req.body.result.actions.interpretation;

    tropo.say("Fetching weather information for your zip code " + zip + ".");
    getWeather(zip, function(response) {
        var j = JSON.parse(response)

        if (j.cod == 200) {
            //Format string object from weather api response.				
            var wtr = " Weather for " + j.name + " is ! clouds " + j.weather[0].description + ", Temperature " + j.main.temp + " kelvin, Pressure " + j.main.pressure + ", Humidity " + j.main.humidity + "%"
            console.log(wtr);
            tropo.say(wtr);
            tropo.say("Goodbye !");
        } else {
            console.log(j.message);
            tropo.say("Oops ! " + j.message);
            tropo.say("Please try again.");
        }
        res.send(tropowebapi.TropoJSON(tropo));
    });

});


//weather bkend api call.
getWeather = function(zip, callback) {
    request('http://api.openweathermap.org/data/2.5/weather?zip=' + zip + '&appid=a8f81765ac74e18e357c9496ac295aad', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(body)

        }
    });

};
//Server listening port.
app.listen(3000);
console.log('Server running on http://0.0.0.0:3000/');
