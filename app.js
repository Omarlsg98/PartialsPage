//jshint esversion:6
//----------Imports
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fileUpload = require('express-fileupload'); //paquete para subir las imagenes al servidor
const _ = require('lodash');
const AWS = require('aws-sdk');

//----------Server configurations
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.use(fileUpload());

//-----------Data base------
mongoose.connect("mongodb://localhost:27017/parcialesDB", {
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
var identityPoolId = 'us-east-1:2502b8c4-82b6-48ec-a959-3498f7d498f9';

// Inicializar el proveedor de credenciales de Amazon Cognito
AWS.config.region = bucketRegion; // Región
const credentials = new AWS.SharedIniFileCredentials();
AWS.config.credentials = credentials;

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
      }, function(err, file) {
        let buff = new Buffer(file.Body);
        let base64data = buff.toString('base64');
        res.render("index", {
          parciales: parciales,
          parcialToRender:"data:image/"+_.split(req.params.parcial,".")[1]+";base64,"+base64data
        });
      });
    }
  });
});

app.post("/", function(req, res) {
  //Metodo para subir archivos al servidor y guardar la referencia en la base de datos
  let newParcial = req.files.newParcial;
  if (newParcial != null) {

    const parcial = new Parcial({
      imgType: "." + _.split(newParcial.mimetype, "/")[1],
      materia: req.body.materia,
      profesor: req.body.profesor,
      corte: req.body.corte,
      periodo: req.body.periodo
    });
    const parcialName = parcial._id + parcial.imgType;

    // Create params for putObject call
    var objectParams = {
      Bucket: bucketName,
      Key: parcialName,
      Body: newParcial.data
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
  } else {
    //no ingresa ningun archivo
    res.redirect("/");
  }
});


//--------Inicializacion del servidor
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port " + port);
});
