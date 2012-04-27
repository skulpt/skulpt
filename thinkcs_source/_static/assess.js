var checkMe = function(divid, expected, feedback) {
	var given;
	var buttonObjs = document.forms[divid+"_form"].elements.group1;
	for (var i = buttonObjs.length - 1; i >= 0; i--) {
		if (buttonObjs[i].checked) {
			given = buttonObjs[i].value;
		}
	}
	// update number of trials??
	// log this to the db
	feedBack('#'+divid+'_feedback',given == expected, feedback);
	var answerInfo = 'answer:' +  (given==expected ? 'correct' : given);
	jQuery.get("/hsblog",{'event':'assses', 'act':answerInfo, 'div_id':divid});
};


var feedBack = function(divid,correct,feedbackText) {
	if (correct) {
		$(divid).html('You are Correct!');
	} else {
		$(divid).html("Inorrect.  " + feedbackText );
	}
};

// for each form in the div
//    get the id of the form
//    call checkMe on the form...  -- need metadata what kind of question what parms etc
//    hidden fields for meta data??? each form defines a checkme function with no parameters
//    that calls the actual function that checks the answer properly??
// summarize
