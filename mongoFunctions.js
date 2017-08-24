var mongodb = require('mongodb');


var mongoClient = mongodb.MongoClient;
// Need to do this later, before pushign to Github: https://forum.freecodecamp.org/t/storing-mongo-username-password-persistently-using-dotenv/50994
var url = "mongodb://" + process.env.MONGOUSERNAME + ":" + process.env.MONGOPASSWORD + "@ds127883.mlab.com:27883/hodakkm_url_shortener";



// function to connect to mongoDB and insert the record to the urls collection
function insertToDB(originalURL, shortURL){
  mongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Successfully connected to hodakkm_url_shortener database');

    var collection = db.collection('urls');
    
    collection.insert({
      originalurl: originalURL,
      shorturl: shortURL
    }, function(err, data) {
      if (err) {
      console.log('Unable to insert the document. Error: ', err);
      } else {
        console.log('Successfully inserted document');
      }
    })

    //Close connection
    db.close();
      }
  });
}

// function to find the record by shorturl in the database and set it's original url to the matchedURL variable
function findInDB(id, callback){
  var matchedURL;
  mongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Successfully connected to hodakkm_url_shortener database');
    
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
          console.log('matchedurl inside module is: ' + matchedURL);
        } else {
          console.log('Document not found in module');
          matchedURL = "";
        }
        callback(matchedURL);
      }
    })
    
      }
    
   db.close();
      
  });
  

   
}

module.exports.dbInsert = insertToDB;
module.exports.dbFind = findInDB;