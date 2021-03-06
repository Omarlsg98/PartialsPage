//jshint esversion:6
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
let factorEscala = 1;
let images = [];
let cambiosguardados = false;

//Cuando se agrega una imagen al navegador!
$("#newParcialFile").change(function() {
  const files = this.files;

  let textToPut = "";
  if (files.length == 0) {
    textToPut = "Elige el parcial";
    $("#editorImagenes").css("display", "none");
  } else {
    var file = files[0];
    if (file.type.match('image.*')) {
      textToPut = file.name + " -------> clickeame si deseas cambiarla imagen!";
      //cargar imagen a canvas
      var reader = new FileReader();
      reader.onload = function(event) {
        var img = new Image();
        img.onload = function() {

          $("#editorImagenes").css("display", "block");
          $("#EnviarParcial").css("display", "block");
          cambiosguardados = false;

          canvas.width = img.width;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          factorEscala = img.width / $('#editorImagenes').width();
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
//Para enviar todo el parciales
function enviarParcial() {
  if (!cambiosguardados)
    guardarImagen();
  var fields = $("#formParcial").serializeArray();
  var results = [];
  jQuery.each(fields, function(i, field) {
    results[i] = field.value;
  });
  console.log(images);
  $.post('/', {
    img: JSON.stringify(images),
    materia: results[1],
    profesor: results[0],
    periodo: results[2],
    corte: results[3]
  }, function(data, status, jqXHR) {
    alert("Tu parcial fue cargado con Exito!");
    location.reload(true);
  });
}

//Para guardar los cambios en la imagen!
function guardarImagen() {
  images.push(canvas.toDataURL("image/png"));
  cambiosguardados = true;
  $("#editorImagenes").css("display", "none");
  $("#EnviarParcial").css("display", "block");
  $("#newParcialFileName").text("Deseas añadir otra imagen del parcial?");
}


//Funcion de tachado en el canvas
$(document).ready(function() {
  var startX, startY;

  $("#editorImagenes").mousedown(function(event) {
    const canvasOffset = $('#canvas').offset();
    startX = -1;
    startY = -1;

    $(this).bind('mousemove', function(e) {
      const xPos = (e.pageX - canvasOffset.left) * factorEscala;
      const yPos = (e.pageY - canvasOffset.top) * factorEscala;
      if (startX != -1)
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
