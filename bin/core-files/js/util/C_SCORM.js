/*
 *  	C_SCORM
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses Houses SCORM functionality
 *  	Version: 0.5
 *		Date Created: 10/19/13
 *		Created by: Philip Double
 *		Date Updated: 10/19/13
 *		Updated by: Philip Double
 *		History: Moved all glossary functionality into its own js file.
 *		Todo: 	- Turn this into a plugin.  This did reside in C_Engine which was becoming unruly.
 *				- Optimize code.
 */


var isScorm = false;//indicates if is a SCORM course
var lessonStatus;//holds the status of the SCORM lesson
var lmsConnected = false;//indicates if connected to the LMS
var scorm;//Set after script is initialized. = pipwerks.SCORM;//var for SCORM API wrapper

/*************************************************************
** SCORM Funcitonality
*************************************************************/

function checkScorm(){
	scorm = pipwerks.SCORM;
	//check to see if the scorm perference is set to true
	//and mode is production
	if($(data).find('scorm').attr('value') == "true" && mode == "production"){
		isScorm = true;
		scorm.VERSION = $(data).find('scormVersion').attr('value');

		lmsConnected = scorm.init();
		lessonStatus = scorm.status("get");

		//course has already been completed
		if(lessonStatus == "completed"){
			scorm.quit();
		}
		else{
			scorm.status("set", "incomplete");

			//resume on page
			if(scorm.VERSION == "1.2"){
				if(scorm.get("cmi.core.entry") == "resume"){
					var location = scorm.get("cmi.core.lesson_location");
					if(location != ""){
						//figure out what is going on here.
						loadPageFromID(location);
						rejoinTracking(location);
					}
				}
			}
			else if(scorm.VERSION.substring(0,4) == "2004"){
				if(scorm.get("cmi.entry") == "resume"){
					var location = scorm.get("cmi.location");
					if(location != ""){
						//figure out what is going on here.
						loadPageFromID(location);
						rejoinTracking(location);
					}
				}
			}
		}
	}
}

function completeLessonDefault(){
	scorm.status("set", "completed");
	if(scorm.VERSION == "1.2"){
		//no calls 4 now
	}
	else if(scorm.VERSION.substring(0,4) == "2004"){
		scorm.set("cmi.success_status", "passed");
	}
	scorm.quit();
}

function completeLesson(completion, success, score){
	if(completion){
		scorm.status("set", "completed");	
	}
	else{
		scorm.status("set", "incomplete");
	}

	if(scorm.VERSION.substring(0,4) == "2004"){
		if(success){
			scorm.set("cmi.success_status", "passed");			
		}
		else{
			scorm.set("cmi.success_status", "failed");
		}

		scorm.set("cmi.score.scaled", score.toString());

		var finalLesson = $(data).find('finalLesson').attr('value');
		if(finalLesson === 'true'){
			scorm.set("adl.nav.request", "exitAll");
		}
		else
		{
			var validContinue = scorm.get("adl.nav.request_valid.continue");
			if(validContinue === 'true')
			{
				scorm.set("adl.nav.request", "continue");
			}
			else
			{
				scorm.set("adl.nav.request", "exit");
			}
		}
	}
	else if(scorm.VERSION == "1.2"){
		var raw = score*100;
		scorm.set("cmi.core.score.raw", raw.toString());
	}

	// reset location for next time lesson is opened
	var currentPageID = 0;
	if(scorm.VERSION == "1.2"){
		scorm.set("cmi.core.lesson_location", currentPageID);
	}
	else if(scorm.VERSION.substring(0,4) == "2004"){
		scorm.set("cmi.location", currentPageID);
	}

	if(scorm.VERSION = '1.2_CTCU'){
		var raw = score*100;
		scorm.set("cmi.core.score.raw", raw.toString());
		// wait for SCORM termination, then close popup windows
		var terminated = scorm.quit();
		if(terminated){
			if(window.opener){
				window.opener.lessonComplete();
			}
			window.close();
		}else{
			console.log("SCORM termination failed");
		}

	}
	else{
		scorm.quit();
	}
	
}