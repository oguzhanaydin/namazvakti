var bluebird = require('bluebird');
var restify = require('restify');
var builder = require('botbuilder');
var _ = require('lodash');
var util = require('util');
var request = require('request-promise');
//


//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server    = restify.createServer();
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port      = process.env.OPENSHIFT_NODEJS_PORT || 5477;
server.listen(port, ipaddress , function () {});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: "297aeeec-0c85-49ec-8136-9bbf1b1bd32e",
    appPassword:"2c3v4WkXHvX7U3rcUdkFXbb"
});

var bot = new builder.UniversalBot(connector);

var dbUrl = "https://hatimlist.firebaseio.com/"

bot.dialog('/',[
  function(session){
    console.log("ilk", util.inspect(session.message.user, false, null));
    var msg = {
      url: dbUrl + 'users/' + session.message.user.id + '.json',
      method: 'PUT',
      data : session.message.user
    }
    request({ url: msg.url, method: msg.method, json: msg.data}, function(error,req,body){
      console.log("body",body);
    })
    .then(function(resp){
        console.log("sessi", session.message.user);
        session.send('Merhaba');
        session.beginDialog('/location');
    })

  },
  function(session,results){
    if(_.isObject(session.message.entities[0])) {
      session.send("Teşekkürler lokasyonunu aldim");
      // var ref = db.ref('users/'+session.message.user.id + '/geo');
      // ref.update(session.message.entities[0].geo);
      console.log(session.message.entities[0].geo);
      var msg = {
        url: "http://146.185.174.158:3101/api/citiesbylocation",
        method: "POST",
      	data: {
          "latitude":session.message.entities[0].geo.latitude,
          "longitude":session.message.entities[0].geo.longitude
        }
      };
      request({ url: msg.url, method: msg.method, json: msg.data}, function(error,req,body){
        return(body)
      })
      .then(function(cities){
        msg.data = {cityId: cities[1]._id}
        msg.url = "http://146.185.174.158:3101/api/getcountiesbycity";
        request({ url: msg.url, method: msg.method, json: msg.data}, function(error,req,body){
          // console.log("body",body);
          return(body)
        })
        .then(function(counties){
          msg.data = {countyId: counties[0]._id}
          msg.url = "http://146.185.174.158:3101/api/salaahsbycounty";
          request({ url: msg.url, method: msg.method, json: msg.data}, function(error,req,body){
            return(body)
          })
          .then(function(times){
            console.log(times);
          })
        })
      })


    }
    else {
      session.beginDialog('/location');
    }
  }
])

bot.dialog('/location',[
  function(session){
    var text = "Lokasyonunu girer misin"
    builder.Prompts.text(session, text);
  },
  function (session, results) {
    if(_.isObject(session.message.entities[0])) {
      session.endDialogWithResult(results);
    }
    else {
      builder.Prompts.text(session, "Tekrar dener misin?")
    }
  }

]);


server.post('/api/messages', connector.listen());


//=========================================================
// Bots Dialogs
//=========================================================
