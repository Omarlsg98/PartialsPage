//jshint esversion:6
$("#newParcialFile").change(function() {
  const files = this.files;
  let result = "";
  if (files.length ==0) {
    result = "Elige el parcial";
  } else {
    result = files[0].name;
  }
  $("#newParcialFileName").text(result);
});

function validarParcial(form) {
  let confirmation = true;
  let alertMsg = "Por favor:\n";
  if (form.newParcial.files.length ==0) {
    confirmation = false;
    alertMsg += "Escoge un archivo valido";
  }
  if (!confirmation) alert(alertMsg);
  return confirmation;
}
