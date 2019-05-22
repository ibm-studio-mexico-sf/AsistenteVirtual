(function(w) {
	function createNameSpace(){
		w.com={ibm:{assistant:{chat:{}}}};
	}
	createNameSpace();
	class Session{
		constructor (expiredTime,context){
			if(expiredTime){
				this.expiredTime=expiredTime;
			}
			else{
				this.expiredTime=5000;
			}
			this.timerHandler="";
  	}
		close(id){

		}
		widget_show(id){
			$("#modal-body").html('');
			var timer = $("<div>",{class:'timer',id:'timer'}).append('30 se');
			var message= $("<p>",{class:'alert',id:'mensaje'}).append("La sesion caducara en : ")
			message.append(timer);
			$("#modal-body").append(message);
			$('#chat-session').modal('show');
		}
		init(){
			this.timerHandler = setTimeout(this.widget_show,this.expiredTime);
		}
		refresh(){
			console.log("refresh");
			w.clearTimeout(this.timerHandler);
			this.init();
		}
	}
	w.com.ibm.assistant.chat.Session = Session
}(window));
