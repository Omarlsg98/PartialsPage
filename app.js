//jshint esversion:6
//----------Imports
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fileUpload = require('express-fileupload'); //paquete para subir las imagenes al servidor
const atob = require('atob');
const _ = require('lodash');
const AWS = require('aws-sdk');
const fs = require('fs');
let pass = null;

//----------Server configurations
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.json({
  limit: '16mb'
}));

app.use(bodyParser.urlencoded({
  extended: false,
  limit: '16mb'
}));
app.use(express.static("public"));
app.use(fileUpload());

//-----------Data base------
let pass1 = process.env.MongoPass;
if (pass1 == null || pass1 == "") {
  pass = require(__dirname + '/passwords');
  pass1 = pass.mongo;
}

mongoose.connect(pass1, {
  useNewUrlParser: true
});

const parcialSchema = {
  imgType: {
    type: String,
    required: true
  },
  materia: String,
  profesor: String,
  corte: Number,
  periodo: String
};

const Parcial = mongoose.model("parcial", parcialSchema);


//-------AWS services configuration
var bucketName = 'parciales';
var bucketRegion = 'us-east-1';

// Inicializar el proveedor de credenciales de Amazon Cognito
AWS.config.region = bucketRegion; // Región
if (process.env.AWS_ACCESS_KEY_ID == null || process.env.AWS_ACCESS_KEY_ID == "") {
  const credentials = new AWS.SharedIniFileCredentials();
  AWS.config.credentials = credentials;
}

var bucket = new AWS.S3({
  params: {
    Bucket: 'parciales'
  }
});


//-------Interacciones del servidor

app.get("/", (req, res) => {
  res.redirect("/parciales/default.jpg");
});

app.get("/parciales/:parcial", function(req, res) {
  Parcial.find({}, function(err, parciales) {
    if (err) {
      return res.status(500).send(err);
    } else {
      bucket.getObject({
        Key: req.params.parcial
      }, function(err2, file) {
        if (!err2 && file != null) {
          let buff = new Buffer(file.Body);
          let base64data = buff.toString('base64');
          res.render("index", {
            parciales: parciales,
            parcialToRender: "data:image/" + _.split(req.params.parcial, ".")[1] + ";base64," + base64data
          });
        } else {
          return res.status(500).send({
            error: err2,
            file: file
          });
        }
      });
    }
  });
});

app.post("/", function(req, res) {
  //Metodo para subir archivos al servidor y guardar la referencia en la base de datos
  let newParcial = req.body.img;

  if (newParcial != null) {

    const parcial = new Parcial({
      imgType: ".png",
      materia: req.body.materia,
      profesor: req.body.profesor,
      corte: req.body.corte,
      periodo: req.body.periodo
    });

    const parcialName = parcial._id + parcial.imgType;
    let file =dataURLtoFile(res,parcial,newParcial, parcialName);

  } else {
    //no ingresa ningun archivo
    res.redirect("/");
  }
});

function loadToS3(res,parcial,parcialName,data){
    // Create params for putObject call
  var objectParams = {
    Bucket: bucketName,
    Key: parcialName,
    Body: data
  };
  // Create object upload promise
  var uploadPromise = new AWS.S3({
    apiVersion: '2006-03-01'
  }).putObject(objectParams).promise();
  uploadPromise.then(
    function(data) {
      parcial.save();
      res.redirect("/parciales/" + parcialName);
    });
}

//Convertir URLImages en files
function dataURLtoFile(res,parcial,dataurl, filename) {
  var arr = dataurl.split(','),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  fs.writeFile(filename, u8arr, function(err) {
    if (err) throw err;
    fs.readFile(filename, function(err, data) {
      loadToS3(res,parcial,filename,data);
    });
  });
}



//--------Inicializacion del servidor
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port " + port);
});
