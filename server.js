var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");

//'mongodb://marilyn:mongo123@ds129024.mlab.com:29024/calorie_counter';
var MONGO_CONNECTION_URL = 'mongodb://marilyn:mongo123@ds129024.mlab.com:29024/calorie_counter';
var COLLECTION = {
    "UserCalorie": "UserCalorie",
    "Calorie": "Calorie"
};

var app = express();
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5008));

app.set('views', __dirname + '/views');

var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(MONGO_CONNECTION_URL, function (err, database) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    db = database;
    console.log("Database connected to Calorie Counter");
});

// app.get("/app/getFoodList",function(req,res){

//    var a = db.collection(COLLECTION.Calorie).find({});
//    console.log(a);
// });

app.get("/app/getFoodList", function (req, res) {
    db.collection(COLLECTION.Calorie).find({
    }).toArray(function (err, docs) {
        if (err) {
            handleError(res, err.message, "");
        } else {
            if (docs.length > 0) {
                res.status(200).json(docs);
            } else {
                handleError(res, "");
            }
        }
    });
});


app.get("/app/getWeeksCalorieData", function (req, res) {
    var moment = require('moment');
    var localTime = moment().format('YYYY-MM-DD'); // store localTime
    var proposedDate = localTime + "T00:00:00.000Z";

    var startdate = moment().subtract(7, "days").format("YYYY-MM-DD");
    var propStartDate = startdate + "T00:00:00.000Z";

    var date = new Date();


    var myWeek = new Date();
    myWeek.setDate(myWeek.getDate() - 7);

    var filtered = [];

    db.collection(COLLECTION.UserCalorie)
        .aggregate({ $unwind: "$caloriedata" }, {
            $match: {
                "date": {
                    "$lte": date,
                    "$gte": myWeek

                }
            }
        }).toArray(function (err, docs) {
            if (err) {
                handleError(res, err.message, "");
            } else {


                if (docs.length > 0) {
                    for (var i = 0; i < docs.length; i++) {

                        if (Date.parse(docs[i].caloriedata.date) >= Date.parse(propStartDate) && Date.parse(docs[i].caloriedata.date) <= Date.parse(proposedDate)) {
                            filtered.push(docs[i])
                        }
                    }


                    res.status(200).json(filtered);
                } else {
                    console.log(res)
                }
            }
        });


});


app.post("/app/setCalories", function (req, res) {

    var data = req.body;
    var moment = require('moment');



    var localTime = moment().format('YYYY-MM-DD'); // store localTime
    var proposedDate = localTime + "T00:00:00.000Z";

    console.log(new Date(proposedDate))
    //currentlly harcoding userId

    db.collection(COLLECTION.UserCalorie).findOneAndUpdate({
        "userId": "562104"
    }, {
            $addToSet: {
                "caloriedata": {
                    "quantity": data.caloriedata.quantity,
                    "type": data.caloriedata.type,
                    "calories": data.caloriedata.calories,
                    "date": new Date(proposedDate)
                }
            }
        }).then((resp) => {
            console.log(resp);
            console.log('Data Successfully inserted');
            res.status(200).json({
                "success": "Data Successfully inserted"
            });
        }, (er) => {
            handleError(res, er.message, "Error inserting Data");
        });


});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
