//jshint esversion:6
$("#newParcialFile").change(function() {
  const files = this.files;
  let result = "";
  if (files == null) {
    result = "Elige el parcial";
  } else {
    result = files[0].name;
  }
  $("#newParcialFileName").text(result);
});
