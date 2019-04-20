//jshint esversion:6
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
let factorEscala=1;
//Cuando se agrega una imagen al navegador!
$("#newParcialFile").change(function() {
  const files = this.files;

  let textToPut = "";
  if (files.length == 0) {
    textToPut = "Elige el parcial";
    $("#editorImagenes").css("position", "absolute");
  } else {
    var file = files[0];
    if (file.type.match('image.*')) {
      textToPut = file.name;
      //cargar imagen a canvas
      var reader = new FileReader();
      reader.onload = function(event) {
        var img = new Image();
        img.onload = function() {
          $("#editorImagenes").css("position", "relative");
          canvas.width = img.width;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          factorEscala =img.width/$('#editorImagenes').width();
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, canvas.width,canvas.height);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      textToPut = "Elige el parcial";
      alert("Por favor suba solo imagenes");
    }
  }
  $("#newParcialFileName").text(textToPut);
});


//Metodo activado por el envio del parcial
function validarParcial(form) {
  let confirmation = true;
  let alertMsg = "Por favor:\n";
  if (form.newParcial.files.length == 0) {
    confirmation = false;
    alertMsg += "Escoge un archivo valido";
  }
  if (!confirmation) alert(alertMsg);
  return confirmation;
}
//Para guardar los cambios en la imagen!
function guardarImagen(){
  $.post('/', {
      img: canvas.toDataURL("image/png"),
      materia: $("#editorImagenes"),
      profesor:"pruebando"
  });
  //var canvasURL = canvas.toDataURL("image/png");
  //var img = document.getElementById("parcialReady").src = canvasURL;
}

//Funcion de tachado en el canvas
$(document).ready(function() {
  var startX, startY;

  $("#editorImagenes").mousedown(function(event) {
    const canvasOffset = $('#canvas').offset();
    startX =-1;
    startY = -1;

    $(this).bind('mousemove', function(e) {
      const xPos=(e.pageX- canvasOffset.left)*factorEscala;
      const yPos=(e.pageY- canvasOffset.top)*factorEscala;
      if(startX!=-1)
        drawLine(startX, startY, xPos, yPos);
      startX = xPos;
      startY = yPos;
    });
  }).mouseup(function() {
    $(this).unbind('mousemove');
  });

  function drawLine(x, y, stopX, stopY) {
    //ctx.clearRect (0, 0, can.width, can.height);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(stopX, stopY);
    ctx.lineWidth = 5;
    ctx.closePath();
    ctx.stroke();

  }
});
