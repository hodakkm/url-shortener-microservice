var mongoFunctions = require('./mongoFunctions');
var fs = require('fs');
var express = require('express');
var parser = require('ua-parser');
var mongodb = require('mongodb');
var app = express();

var results, url, lookupURL, urlArr, urlID, requestedURL, shortURL, matchedURL;

var mongoClient = mongodb.MongoClient;
// Need to do this later, before pushign to Github: https://forum.freecodecamp.org/t/storing-mongo-username-password-persistently-using-dotenv/50994
var url = "mongodb://" + process.env.MONGOUSERNAME + ":" + process.env.MONGOPASSWORD + "@ds127883.mlab.com:27883/hodakkm_url_shortener";


if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin || '*';
    if(!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1){
         //console.log(origin);
         res.setHeader('Access-Control-Allow-Origin', origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
  });
}

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/_api/package.json')
  .get(function(req, res, next) {
    //console.log('requested');
    fs.readFile(__dirname + '/package.json', function(err, data) {
      if(err) return next(err);
      res.type('txt').send(data.toString());
    });
  });
  
app.route('/')
    .get(function(req, res) {
      res.sendFile(process.cwd() + '/views/index.html');
    })

app.route('/new/*')
    .get(function(req, res) {
  
    // gets the requested url and creates random ID
    requestedURL = req.url.replace("/new/","");
    urlID = Math.floor(Math.random() * 9999) + 1;
  
    // regular expresssion to make sure the supplied URL is in a valid URL format: http://www.google.com or https://www.google.com
    var expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
    var regex = new RegExp(expression);
  
    // if url is valid, store it in database and return original url and short url as JSON
    if (requestedURL.match(regex)) {
      shortURL = "https://hodakkm-url-shortener-microservice.glitch.me/" + urlID
        
      // calls function from the mongoFunctions module to insert document in the database
      mongoFunctions.dbInsert(requestedURL, urlID);

      // returns the same document info as JSON
        results = { 
          "original_url": requestedURL,
          "short_url": shortURL
          };
        res.json(results);  

      } else {
        results = {
          "error": "Wrong url format, make sure you have a valid protocol and real site."
        };
        res.json(results);
       }      
    });

// route to return an original url when passed a short url
// uses a regular expression to match 4 digit number. I don't want /123, /12345, /abcd or /12a45 to work
app.route('/[0-9]{4,4}/')
    .get(function(req, res) {
    lookupURL = req.url.replace('/','');
    console.log('requested id is: ' + lookupURL);
    
    //call the db find function which sets matchedURL to the match
		//findInDB(lookupURL);
  
    var tempURL;
    
    mongoFunctions.dbFind(lookupURL, function(matchedURL){
      console.log('tempURL first is: ' + matchedURL);
        if (matchedURL == ""){
          results = {
            "error": "This url is not on the database.  Try https://hodakkm-url-shortener-microservice.glitch.me/4620 to see a working example."
          };
          res.json(results);
        } else {
          res.redirect(matchedURL);
        }
      
      });
      
    
    });
    
// Respond not found to all the wrong routes
app.use(function(req, res, next){
  results = { 
        "error": "Make sure you are using the /new/http://www.requestedurl.com format to shorten a new url or /#### with the four digit ID to access a previously generated short url."
        };
      res.json(results);   
  res.status(404);

});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
})

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});


// function to find the record by shorturl in the database and set it's original url to the matchedURL variable
function findInDB(id){
  console.log('Attempting to connect to: ' + url);
  mongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', url);
    
    var collection = db.collection('urls');
    console.log('looking for: ' + id);
    collection.find({
      "shorturl": +id
    }).toArray(function(err, documents) {
      
      if (err) {
      console.log('Unable to perform find request. Error: ', err);
      } else {
        if (documents.length > 0){
          console.log('Successfully found the document. Original url is: ' + documents[0].originalurl);
          matchedURL =  documents[0].originalurl;  
          console.log('matchedurl is: ' + matchedURL);
        } else {
          console.log('Document not found');
          matchedURL = "";
        }
      }
    })
    
    //Close connection
    db.close();
      }
  });
}