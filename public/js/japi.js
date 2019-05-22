// The Api module is designed to handle all interactions with the server

var jApi =  (function() {
  var messageEndpoint = '/api/message';
	var deleteEndpoint = '/api/session';
	var vrEndpoint = '/api/file/upload';
	var sendRequestGeneric = function(data,endpoint,method,callback){
    data = JSON.stringify(data);
    $.ajax(
      {
        type: method,
        url: endpoint,
        contentType: "application/json",
        cache:false,
        data:data,
        dataType: 'json',
        success: function(result){
          console.log(result);
          if(callback){
            callback(result);
          }
       },
       error: function (xhr, ajaxOptions, thrownError) {

		 	 var response = {
		 			error:{
		 				message:"Error técnico, disculpe las molestias",
		 				code:"500"
		 			}
		 		}
		 		if(callback){
		 			callback(response);
		 		}
		  }
    });

  }
	var sendDeleteRequest = function(data,callback){
		return sendRequestGeneric(data,deleteEndpoint,"DELETE",callback);
	}
  var sendRequest = function(data,callback){
		return sendRequestGeneric(data,messageEndpoint,"POST",callback);
  }
	let sendFormDataURL = function(dataURL,callback){
		if(dataURL==undefined||dataURL==null){
			console.log("dataURL is empty");
			return;
		}
		let arrayImageParts = dataURL.split(',');
		if(arrayImageParts.length<1){
			console.log("dataURL not have data");
			return;
		}
		console.log("Parsin image to blob");
		let blobBin = atob(arrayImageParts[1]);
		let type = arrayImageParts[0].split(':')[1].split(';')[0];
		let array = [];
		for(let i = 0; i < blobBin.length; i++) {
		    array.push(blobBin.charCodeAt(i));
		}
		let file=new Blob([new Uint8Array(array)], {type: type});
		console.log("Parsin done!!");
		let formData = new FormData();
    // add assockey values, this will be posts values
    formData.append('files', file);
		console.log("formData!!",formData);
		for (var value of formData.values()) {
		   console.log(value);
		}
		$.ajax(
      {
        type: "POST",
        url: vrEndpoint,
        contentType:false,
        cache:false,
        processData: false,
				async: true,
				timeout: 60000,
        data:formData,
        success: function(result){
          console.log('Succes ',result);
					if(callback){
						callback(result);
					}
       },
       error: function (xhr, ajaxOptions, thrownError) {

		 	 var response = {
		 			error:{
		 				message:"Error técnico, disculpe las molestias",
		 				code:"500"
		 			}
		 		}
		 		console.log(response);
				if(callback){
					callback(response);
				}

		  }
    });
	}
  return {
    sendMessage:sendRequest,
		closeSesion:sendDeleteRequest,
		vrMessage:sendFormDataURL
  }

}());
