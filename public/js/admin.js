(function(w) {
  var setSkill = function(skill_id){
		if(skill_id){
				w.skill_id=skill_id;
		}
	}
	var getSkill = function(skill_id){
		console.log(w.skill_id);
	}
	w.admin={
		setSkill:setSkill,
		getkill:getSkill
	}
	
	$( "#skillUpdateForm" ).submit(
		function( event ) {
  		alert( "Handler for .submit() called." );
  		event.preventDefault();
		})
	}(window));
