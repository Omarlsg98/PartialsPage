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
var albumBucketName = 'parciales';
var bucketRegion = 'us-east-1';
var IdentityPoolId = 'us-east-1:2502b8c4-82b6-48ec-a959-3498f7d498f9';

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});

var s3 = new AWS.S3({
  params: {Bucket: albumBucketName}
});

//-------Interacciones del servidor

app.get("/", (req, res) => {
  res.redirect("/parciales/1.jpg");
});

app.get("/parciales/:parcial", function(req, res) {

  Parcial.find({}, function(err, parciales) {
    if (err) {
      return res.status(500).send(err);
    } else {
      res.render("index", {
        parciales: parciales,
        parcialToRender: req.params.parcial
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
    const parcialName=parcial._id + parcial.imgType;

    s3.upload({
      Key: parcialName,
      Body: newParcial,
      ACL: 'public-read'
    }, function(err, data) {
      if (err) {
        return res.status(500).send({
         message: err.message
       });
      }
      parcial.save();
      res.redirect("/parciales/" + parcialName);
    });
  } else {
    //no ingresa ningun archivo
    res.redirect("/");
  }
});


//--------Inicializacion del servidor
let port= process.env.PORT;
if(port==null||port==""){
	port=3000;
}
app.listen(port, function() {
  console.log("Server started on port "+port);
});
