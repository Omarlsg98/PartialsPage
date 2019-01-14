//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fileUpload = require('express-fileupload'); //paquete para subir las imagenes al servidor
const _ = require('lodash');

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
  }
};

const Parcial = mongoose.model("parcial", parcialSchema);

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
      imgType: _.split(newParcial.mimetype, "/")[1]
    });
    newParcial.name = parcial._id + "." + parcial.imgType;
    parcial.save();
    newParcial.mv(`./public/images/parciales/${newParcial.name}`, err => {
      if (err) return res.status(500).send({
        message: err
      });
      res.redirect("/parciales/"+newParcial.name);
    });
  } else {
    //no ingresa ningun archivo
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
