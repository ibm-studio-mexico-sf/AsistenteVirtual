
(function (w) {

  var hideAll = function (){
    $("#options").hide();
    $("#icon1").hide();
  };

  var loadPageConfig = function(){
    console.log("cargando configuracion de la pagina");
    $("#contentParent").hide();
    var iconToggle=false;
    var firstInput = true;
    $("#icon1").on("click",function(){
      if(!iconToggle){
        $("#contentParent").show();
      }
      else{
        $("#contentParent").hide();
      }
      if(firstInput){
        ConversationPanel.init();
        firstInput=false;
      }
      iconToggle=!iconToggle;
    });
    /**Funcionalidad para la seleccion de fondo*/
    $("#iconTheme").on("click",function(){
      if(!this.iconToggle){
        $("#options").show();
      }else{
        $("#options").hide();
      }
      this.iconToggle=!this.iconToggle;
    });
    $("#options").hide();
    $( "select" ).change(function () {
    var str = "";
    var val ="";
    $( "select option:selected" ).each(function() {
      str += $( this ).text() + " ";
      val +=  this.value;
    });
    $( "div#urlImage" ).text( val );
    $(".chat-column").css("background-image","url('"+val+"')");
    $("#closeOptions").on("click",function(){
      $("#options").hide();
    });
  }

  ).change();}

  $( document ).ready(function() {
    // loadPageConfig();
    hideAll();
  });

}(window));
