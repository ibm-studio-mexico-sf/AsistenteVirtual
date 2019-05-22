(function(w) {
  function Generator() {};
  Generator.prototype.rand =  Math.floor(Math.random() * 26) + Date.now();
  w.GENERIC_RESPONSE="Estoy entrenando para brindarte una mejor experiencia.";
  Generator.prototype.getId = function() {
  return this.rand++;
  };
  let idGen =new Generator();

  let context = {};
	let security_context = {};
  //let session = new w.com.ibm.assistant.chat.Session(360000,null);//6minutos
  let mainElement = $("#main");

  let createSingleTextNode = function(text) {
    let singletextNode = $("<div>", {
      class: "simple-text"
    });
    text = text.replace(/\n/g, "<br />");
    return singletextNode.append(text);
  }

  let createWatsonBubble = function(widget) {
    let watsonBubbleNode = $("<div>", {
      class: "bubble buble-watson"
    });
    return watsonBubbleNode.append(widget);
  }

  let createUserBubble = function(widget) {
    let watsonBubbleNode = $("<div>", {
      class: "bubble buble-user"
    });
    return watsonBubbleNode.append(widget);
  }

  let createErrorBuble = function(widget) {
    let watsonBubbleNode = $("<div>", {
      class: "bubble buble-watson error"
    });
    return watsonBubbleNode.append(widget);
  }

  let parseWidget = function(generic_context,target){

    let widget = $("<div>");
    let pause = target.interval||0;
    switch (generic_context.response_type) {
      case "pause":
           pause += pauseWidget(generic_context,target);
           target.interval = pause;
           break;
      case "option":
            widget = optionWidget(generic_context);
        break;
      case "image":
          widget = imageWidget(generic_context);
          break;
      case "text":
           let texto = generic_context.text;
           widget = createWatsonBubble(createSingleTextNode(texto));
         break;
      default:
    }
    widget = mainWidget(pause,widget);
    return widget;
  }
  /**Widgets*/
  let mainWidget = function(delay,widget){
    let currentWidget;
    if(delay&&delay>0){
      currentWidget = $('<div>').delay(delay).queue(
        function (next) {
          $(this).append(widget);
          next();
        });
    }else{
      currentWidget = widget;
    }
    return currentWidget;
  }
  /**Widget para opciones mediante botones*/
  let optionWidget = function(data){
   let options = data.options || [];
   let uuidDiv = idGen.getId();
   let divButtons = $('<div>',{id:uuidDiv,class:"options_buttons"});
   for(let indexOption in options){
     let oChoice = options[indexOption];
     let uuid= idGen.getId();
     let sValue = "";
     if(oChoice.value&&oChoice.value.input&&oChoice.value.input.text){
       sValue = oChoice.value.input.text;
     }
     let button = $("<a>",{
        id:uuid,
        href:'#',
        class:'btn btn-primary btn-lg btn-block',
        role:'button',
        'aria-pressed':'true',
        value:oChoice.label,
        'value-data':sValue
      }
    );
    button.get(0).onclick= function(event){
      // console.log(this.value,this, $("#"+this.id).attr("value-data"));
      let sValue = $("#"+this.id).attr("value-data");
      let sText = $("#"+this.id).attr("value");
      createMessage(sValue,sText);
      disableWidget(uuidDiv);
    };
     button.append(oChoice.label);
     divButtons.append(button);
   }
   return divButtons;
 }
 /**Widget para mostrar una imagen*/
  let imageWidget = function(data){
   let sSrcImage = data.source || null;
	 let classImage = data.classes ||"cloud_image";
   let uuidDiv = idGen.getId();
   let divButtons = $('<div>',{id:uuidDiv,class:"image"});
   if(sSrcImage){
     let oImageHTML = $('<img>',{id:uuidDiv,class:classImage,src:sSrcImage});
     divButtons.append(oImageHTML);
   }
   return divButtons;
 }
 /**Widget Pausa*/
  let pauseWidget = function(data,target){
   let time =  data.time || 500;
   return time;
 }

 /**Termnina Widgets*/

  let processResponse = function(oResponse) {
    /**Si no existe un response*/
    if (!oResponse) {
      return;
    }
    if (oResponse.error) {
      let value = oResponse.error.message;
      mainElement.append(createErrorBuble(createSingleTextNode(value)));
    } else {
      if (oResponse.context) {
        context = oResponse.context;
      }
			if (oResponse.security_context) {
        security_context = oResponse.security_context;
      }
      if(!oResponse.output){
				if(oResponse){
					  mainElement.append(createErrorBuble(createSingleTextNode(oResponse)));
				}else{
					mainElement.append(createErrorBuble(createSingleTextNode(w.GENERIC_RESPONSE)));
				}
      }
			/**trasformacion de widgets*/
			else{
				/**Pone intervalos de tiempo para mostar */
	      oResponse.output.interval =0;
	      /**Indice de textos encontrados en globals*/
	      oResponse.output.text_index = 0
	      oResponse.output.generic.forEach(
	        function(value,indexOption) {
	          mainElement.append(parseWidget(value,this));
	        }
	      ,oResponse.output);
			}

      scrollDown();
      enableForm();
    }
		// if(session){
		// 	session.refresh();
		// }
  };
  let createMessage = function(text,showText) {
    /**validamos que se invoque con un texto**/
    if (!text) {
      return;
    }
    /**Creacion del payload*/
    let payloadMessage = {
      context: context,
			security_context:security_context,
      input: {
        text: text
      }
    };

    /**Agregando la burbuja de texto del usuario*/
    if(showText){
      mainElement.append(createUserBubble(createSingleTextNode(showText)));
    }
    else{
      mainElement.append(createUserBubble(createSingleTextNode(text)));
    }

    scrollDown();
    /**Invocando la appi*/
    w.jApi.sendMessage(payloadMessage, processResponse);
  };
	let precessResponseVr = function(context){
		console.log("precessResponseVr : ",context);
		let edad = context.images[0].faces[0]['age'];

		if(edad){
			let text = 'La edad aproximada de la persona es entre '+edad.min+' y '+edad.max+'.';
			mainElement.append(createWatsonBubble(createSingleTextNode(text)));
		}else{
			let text ="No fue posible obtener la información";
			mainElement.append(createErrorBuble(createSingleTextNode(text)));
		}

	}
	let visualRecognitionWidget = function(srcObject){
		if(srcObject){
			let target = {interval:200};
			let context = {
				response_type:'image',
				classes:'vr-image',
				source:srcObject
			}

			mainElement.append(createUserBubble(parseWidget(context,target)));
			w.jApi.vrMessage(srcObject,precessResponseVr);
		}
		else{
			mainElement.append(createErrorBuble(createSingleTextNode("No fue posible procesar la imagen")));
		}
	};
  let disableWidget = function(uuid){
    $("#"+uuid).find('a').each(function(val){this.onclick=null;});
    $("#"+uuid).find('a').addClass("disabled");
  };
	let cleancontext = function(){
		context={};
		security_context={};
	};
  let init = function() {
    w.jApi.sendMessage({}, processResponse);
		//session.init();
  };
	let closeSesion = function(){
		let payloadMessage = {
      context: context,
			security_context:security_context
    };
		w.jApi.closeSesion(payloadMessage, cleancontext);
	};

  window.chat = {
    init: init,
    advance:createMessage,
		close:closeSesion,
		vrav:visualRecognitionWidget,
		keep:''
  };
  let disableForm = function() {
    $("#inputMessage").prop('disabled', true);
    $("#buttonMessage").prop('disabled', true);
  };
  let enableForm = function() {
    $("#inputMessage").prop('disabled', false);
    $("#buttonMessage").prop('disabled', false);
    // $("#inputMessage").focus();
  };
  let submitForm = function() {
    let texto = $("#inputMessage").val();
    createMessage(texto,texto);
    $("#inputMessage").val("");
    disableForm();
  };
  let scrollDown = function(){
    $('#chat-conversation').animate({
         scrollTop: $("#main").height()
     }, 1500);
  };
  /**Inicializar el chat*/
  $(document).ready(function() {
    console.log("chat.js running");
    $("#inputMessage").val(""); //clean inputMessage
    disableForm();
    chat.init();

    $("#inputMessage").keyup(function(event) {
      if (event.which == 13) {
        submitForm();
        //event.preventDefault();
      }
    });

    $("#buttonMessage").click(function(event) {
			event.preventDefault();
      submitForm();
    });
    /**Activacion de emoji*/
    $('.buble').Emoji();

		$("#btn-close-sesion").click(function(event) {
      event.preventDefault();
			chat.close();
			$('#chat-session').modal('hide');
    });
		$("#btn-keep-sesion").click(function(event) {
      event.preventDefault();
			$('#chat-session').modal('hide')
			chat.keep();
    });
		$("#buttom-camera").click(function(event) {
      event.preventDefault();
			$('#chat-camera').modal('show');
			window.camera.init();
    });

  });

}(window));
