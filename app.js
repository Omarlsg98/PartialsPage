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
  materia: String,
  profesor: String,
  corte: Number,
  periodo: String,
  numeroFotos: {
    type: Number,
    required: true
  }
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


//-------Interacciones del servidor

app.get("/", (req, res) => {
  res.redirect("/parciales/default");
});

app.get("/parciales/:parcial", function(req, res) {
  Parcial.find({}, function(err, parciales) {
    if (err) {
      return res.status(500).send(err);
    } else {
      var bucket = new AWS.S3({
        params: {
          Bucket: 'parciales/'+req.params.parcial
        }
      });
      bucket.getObject({
        Key: '0.png'
      }, function(err2, file) {
        if (!err2 && file != null) {
          let buff = new Buffer(file.Body);
          let base64data = buff.toString('base64');
          res.render("index", {
            parciales: parciales,
            parcialToRender: "data:image/png;base64," + base64data
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
  let newParcial = JSON.parse(req.body.img);
  console.log(newParcial.length);
  if (newParcial != null) {

    const parcial = new Parcial({
      materia: req.body.materia,
      profesor: req.body.profesor,
      corte: req.body.corte,
      periodo: req.body.periodo,
      numeroFotos:newParcial.length
    });

    const parcialName = parcial._id;
    parcial.save();
    newParcial.forEach(function(imagen, indice, array) {
        dataURLtoFile(imagen, parcialName,indice);
    });
    res.redirect("/parciales/" + parcialName);

  } else {
    //no ingresa ningun archivo
    res.redirect("/");
  }
});

function loadToS3(parcialName, data, number) {
  // Create params for putObject call
  var objectParams = {
    Bucket: bucketName + "/" + parcialName,
    Key: number + ".png",
    Body: data
  };
  // Create object upload promise
  var uploadPromise = new AWS.S3({
    apiVersion: '2006-03-01'
  }).putObject(objectParams).promise();
  uploadPromise.then(
    function(data) {

    });
}

//Convertir URLImages en files
function dataURLtoFile(dataurl, filename, number) {
  var arr = dataurl.split(','),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  fs.writeFile(filename+".png", u8arr, function(err) {
    if (err) throw err;
    fs.readFile(filename+".png", function(err, data) {
      loadToS3(filename, data, number);
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
