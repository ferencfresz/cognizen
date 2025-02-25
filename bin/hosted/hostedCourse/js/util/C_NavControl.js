/*
 *  	C_NavControl
 *  	Requires jQuery v1.9 or later
 *
 *      Houses index functionality for cognizen
 *  	Version: 0.5
 *		Date Created: 10/19/13
 *		Created by: Philip Double
 *		Date Updated: 10/19/13
 *		Updated by: Philip Double
 *		History: Moved all glossary functionality into its own js file.
 *		Todo: 	- Turn this into a plugin.  This did reside in C_Engine which was becoming unruly.
 *				- Optimize code.
 */
var currentTemplate;//Object representing the current template - many can have types, which are a parameter for those classes.
var currentTemplateType;//String tracking the page type i.e. An instance of the most common template C_StaticContent() takes a type("left", "top", "text", "right", "bottom"). This allows one class to handle multiple layouts instead of creating much redundant code.
var transition = false;//Boolean set in xml/preferences section - true - animated transitions  false - jump cut from page to page.
var transitionType;
var transitionLength = 1;

var pageCount = false;
var currentPage = 0;//Integer representing the current page
var currentPageID; //Needed for someone is sorting pages, may change node order and then a change would be sent to the wrong xml node.
var totalPages;//total pages in the presentation
var currentBranch = 0;

var sectionLength = 0;
var scored = false;
var passScore = 0;
var restartOnFail = false;
var totalGradedQuestions = 0;
var questionResponse_arr = [];
var mandatoryInteraction = false;
var assessment = false;
var hoverSubNav = false;
var nextBack = false;
var nextDisabled = true;
var backDisabled = false;
var indexDisabled = false;
var courseHelp	  = false;
var helpButton = false;
var helpURL = "";
var helpHeight = "750";
var helpWidth = "800";
var printButton = false;
var referenceButton = false;
var referenceURL = "";
var testOut		     = false;
var testLink		 = null;
var hasSurvey	     = false;
var surveyLink       = null;
var closeLesson 	 = false;
var forceUpdateOnSave = false;
var pathingTrack_arr = [];

function ncInitialize(){
	updateTotalGradedQuestions();

	//questionResponse_arr = [];
	if(questionResponse_arr.length == 0){
		for(var i = 0; i < totalPages; i++){
			if($(data).find("page").eq(i).attr('type') == 'kc'){
				var isMulti = false;
				if($(data).find("page").eq(i).attr('layout') == 'questionBank'){
					if(parseInt($(data).find("page").eq(i).attr('tocomplete')) > 1 || $(data).find("page").eq(i).attr('showall') == "true"){
						isMulti = true;
					}
				}
				if($(data).find("page").eq(i).attr('layout') == 'questionBank' && isMulti){
					var howMany = 0;
					if($(data).find("page").eq(i).attr('showall') == "true"){
						howMany = $(data).find("page").eq(i).find("bankitem").length;
					}else{
						howMany = parseInt($(data).find("page").eq(i).attr('tocomplete'));
					}
					for(var j = 0; j < howMany; j++){
						var userSelection_arr = [];
						var question_obj = new Object();
						question_obj.complete = false;
						question_obj.correct = null;
						if($(data).find("page").eq(i).attr('objective') == undefined || $(data).find("page").eq(i).attr('objective') == "undefined"){
							question_obj.objective = "undefined";
						}else{
							question_obj.objective = $(data).find("page").eq(i).attr('objective');
						}

						if($(data).find("page").eq(i).attr('objItemId') == undefined  || $(data).find("page").eq(i).attr('objItemId') == "undefined"){
							question_obj.objItemId = "undefined";
						}else{
							question_obj.objItemId = $(data).find("page").eq(i).attr('objItemId');
						}

						if($(data).find("page").eq(i).attr('graded') == 'true'){
							question_obj.graded = true;
						}else{
							question_obj.graded = false;
						}

						question_obj.id = $(data).find('page').eq(i).attr('id');
						question_obj.subID = j;
						question_obj.userAnswer = userSelection_arr;
						questionResponse_arr.push(question_obj);
					}
				}else{
					var userSelection_arr = [];
					var question_obj = new Object();
					question_obj.complete = false;
					question_obj.correct = null;
					if($(data).find("page").eq(i).attr('objective') == undefined  || $(data).find("page").eq(i).attr('objective') == "undefined"){
						question_obj.objective = "undefined";
					}else{
						question_obj.objective = $(data).find("page").eq(i).attr('objective');
					}

					if($(data).find("page").eq(i).attr('objItemId') == undefined  || $(data).find("page").eq(i).attr('objItemId') == "undefined"){
						question_obj.objItemId = "undefined";
					}else{
						question_obj.objItemId = $(data).find("page").eq(i).attr('objItemId');
					}

					if($(data).find("page").eq(i).attr('graded') == 'true'){
						question_obj.graded = true;
					}else{
						question_obj.graded = false;
					}

					if($(data).find("page").eq(i).attr('layout') == 'textInput'){
						var _textInputQuestions = [];
						question_obj.textInputQuestions = _textInputQuestions;
					}

					question_obj.id = $(data).find('page').eq(i).attr('id');
					question_obj.subID = 0;
					question_obj.userAnswer = userSelection_arr;
					questionResponse_arr.push(question_obj);
				}
			}
		}
	}

	//If this is a graded exercise, track the questions.  Am marking questions as graded so that you can have questions that ARE NOT scored as well...
	//if($(data).find('scored').attr("value") == 'true'){
	//scored = true;
	if($(data).find('restartOnFail').attr("value") == 'true'){
		restartOnFail = true;
	}
	passScore = $(data).find('minScore').attr("value") / 100;

	//END OF SCORING SET UP.

	//If the course is linear - must complete page by page - setup a page completion tracking array.
	if($(data).find('progressMode').attr("value") == 'linear' || $(data).find('progressMode').attr("value") == 'lockStep'){
		buildTrackingArray();
	}
	//END OF TRACKING SET UP.

}

function checkNav(){
	//Style is tied to the selected jquery ui theme set in index.
	nextBack = $(data).find('nextBack').attr('value');
	if(nextBack == "true"){
		nextBack = true;
		$("#myCanvas").append("<button id='back' aria-label='Back - Return to the previous page.' role='button'>back</button><button id='next' aria-label='Next - proceed to the next page.' role='button' >next</button>");
	}

	//Check if we are using page counter - if so, set it up.
	//Positioning can be updated in css/C_Engine.css
	pageCount = $(data).find('pageCount').attr('value');
	if(pageCount == "true"){
		pageCount = true;
		$('#myCanvas').append("<div id='pageCount'></div>");
		updatePageCount();
	}


	if(!$(data).find('closelesson').attr('value')){

		$(data).find("preferences").append($('<closelesson>', data));
		$(data).find("closelesson").attr("value", "false");

		closeLesson = false;
	}else{
		if($(data).find('closelesson').attr('value') == "false"){
			closeLesson = false;
		}else{
			closeLesson = true;
		}
	}

	//Check if we are using help button - if so, set it up.
	//Positioning can be updated in css/C_Engine.css
	//helpButton = $(data).find('help').attr('value');

	if(!$(data).find('help').attr('value')){
		if(mode === "edit"){
			$(data).find("preferences").append($('<help>', data));
			$(data).find("help").attr("value", "false");
			$(data).find("help").attr("course", "false");
			$(data).find("help").attr("url", "");
			$(data).find("help").attr("width", helpWidth);
			$(data).find("help").attr("height", helpHeight);
		}
		helpButton = false;
		courseHelp = false;
	}
	else{
		helpButton = ($(data).find('help').attr('value') === 'true');
		if($(data).find('help').attr('course') == "true"){
			courseHelp = true;
		}
		var tempWidth = $(data).find('help').attr('width');
		if(tempWidth != undefined && tempWidth != 'undefined'){
			helpWidth = tempWidth;
		}
		else{
			$(data).find("help").attr("width", helpWidth);
		}
		var tempHeight = $(data).find('help').attr('height');
		if(tempHeight != undefined && tempHeight != "undefined"){
			helpHeight = tempHeight;
		}
		else{
			$(data).find("help").attr("height", helpHeight);
		}
	}


	checkHelp();
	checkSurvey();
	checkTestOut();
	checkCloseLesson();

	//Check if we are using print button - if so, set it up.
	//Positioning can be updated in css/C_Engine.css
	printButton = $(data).find('print').attr('value');
	if(printButton == "true"){
		printButton = true;
		$('#myCanvas').append("<button id='print'>print</button>");
		//Style the Print button and give it its listener
		$("#print").button({
			icons:{
				primary: 'ui-icon-print'
			}
		});
		//attach print action
		$("#print").click(function() {
			window.print();
			return false;
		});
	}

	//Check if we are using reference button - if so, set it up.
	//Positioning can be updated in css/C_Engine.css
	referenceButton = $(data).find('reference').attr('value');
	if(referenceButton == "true"){
		referenceButton = true;
		$('#myCanvas').append("<button id='reference'>reference</button>");
		//Style the Reference button and give it its listener
		$("#reference").button({
			icons:{
				primary: 'ui-icon-document'
			}
		});
		//grab URL of reference file and attach click action
		referenceURL = $(data).find('reference').attr('url');
		$("#reference").click(function() {
			window.open(referenceURL, 'referenceWindow', 'menubar=0, status=0, toolbar=0, resizable=1, scrollbars=1, width=817, height=750');
		});
	}

	//Check if we are using home button - if so, set it up.
	//Positioning can be updated in css/C_Engine.css
	homeButton = $(data).find('homeButton').attr('value');
	if(homeButton == "true"){
		homeButton = true;
		$('#myCanvas').append("<button id='homeButton'>home</button>");
		//Style the Print button and give it its listener
		$("#homeButton").button({
			icons:{
				primary: 'ui-icon-home'
			}
		});
		//attach home action (go to first page)
		$("#homeButton").click(clickHome);
	}


	//Check if we are using transitions.  Set in preferences xml/Content.xml
	//if so, set them up.
	transition = $(data).find('transition').attr('value');
	if(transition == "true"){
		transition = true;
		transitionType = $(data).find('transitionType').attr('value');
		transitionLength = $(data).find('transitionLength').attr('value');
	 }

	 if(nextBack){
		 //Style the Back Button and give it its listener
		 $("#back").button({
		 	icons:{
				primary: 'ui-icon-circle-triangle-w'
			}
		});

		//Style the Next Button and give it its listener
		if(isMobile){
			$("#next").button({
				icons:{
					primary: 'ui-icon-circle-triangle-e'
				}
			});
		}else{
			$("#next").button({
				icons:{
					secondary: 'ui-icon-circle-triangle-e'
				}
			});
		}
	}
}

function addEditNav(){
	$("#myCanvas").append("<div id='preferences' class='btn_preferences' title='Set Preferences'></div>");
	$("#preferences").tooltip().click(function(){
		connected = socket.socket.connected;

		if(connected){
			launchPrefs();
		}else{
			fireConnectionError();
		}
	});

	$("#myCanvas").append("<div id='addPage' class='btn_addPage' title='add new page'></div>");
	$("#addPage").click(function(){
		connected = socket.socket.connected;

		if(connected){
			addPage();
		}else{
			fireConnectionError();
		}
	});
}

function addObjEdit(){
	$('#myCanvas').append('<div id="objEdit" class="btn_objedit" title="View and edit learning objectives."></div>');

	$('#objEdit').click(function(){
		launchObjEdit();
	});

	$('#objEdit').tooltip();
}

function launchObjEdit(){

	var msg = '<div id="dialog-objEdit" title="Learning Objectives Edit Window.">';
	msg += "<div id='objEditDialog'>"
	msg += '<b>instructional goal: </b>' + $(courseData).find("course").attr("instructionalgoal") + '<br/>';
    //display tlo
    msg += '<b>terminal objective: </b>' + $(data).find('tlo').attr('value') + '<br/>';
	//enter elo
 	msg += "<label for='eo' title='Update the enabling objective.'>enabling objective: </label>";
    msg += '<input type="text" name="eo" id="eo" value="undefined" /> <br/>';
 	msg += "<label for='out_pageObjective'";
 	msg += 'title="Update the learner friendly objective description or reference to this page in the lesson. This value is used on completion pages to show missed objectives to students.">objective description: </label>';
    msg += '<input type="text" name="out_pageObjective" id="out_pageObjective" ';
	msg += 'value="'+ $(data).find('page').eq(currentPage).attr("objective") + '" /> <br/>';

	//enter tlo referenced for assessments
    if($(data).find('page').eq(currentPage).attr("type") == "kc"){
		msg += "<label for='objItemId' title='Name of the modules or lesson the objective is mapped to.'>module or lesson mapped (highest level): </label>";
     	msg += "<select name='objItemId' id='objItemId'>";
     	//for loop through items in course.xml
		for(var k = 0; k < $(courseData).find("item").length; k++){
			var itemId = $(courseData).find("item").eq(k).attr('id');
			var itemName = $(courseData).find("item").eq(k).attr('name');
			var itemTLO = $(courseData).find("item").eq(k).attr('tlo');
			msg += '<option value ="'+itemId+'"';
			if(itemId == $(data).find('id').attr('value')){
				msg += ' selected';
			}
			msg += '>'+itemName+' : '+itemTLO+'</option>';
		}
     	msg += "</select><br/>";
 	}
	msg += "<br/>";
	msg += "</div></div>";

	$("#stage").append(msg);

	var questionResponseIndex = 0;
	for(var j = 0; j < questionResponse_arr.length; j++){
		if(questionResponse_arr[j].id == $(data).find('page').eq(currentPage).attr('id')){
			questionResponseIndex = j;
			break;
		}
	}

 	//if objItemId not set set to current in xml
	if($(data).find('page').eq(currentPage).attr("type") == "kc"){
		if($(data).find('page').eq(currentPage).attr("objItemId")){
			if($(data).find('page').eq(currentPage).attr("objItemId") == 'undefined'){
				$(data).find('page').eq(currentPage).attr("objItemId",$('#objItemId option:selected').val());
				questionResponse_arr[questionResponseIndex].objItemId = $('#objItemId option:selected').val();
				//updateModuleXML(currentPageParentModule);
			}
			else{
				$('#objItemId').val($(data).find('page').eq(currentPage).attr("objItemId"));
			}

		}
		else{
			$(data).find('page').eq(currentPage).attr("objItemId",$('#objItemId option:selected').val());
			questionResponse_arr[questionResponseIndex].objItemId = $('#objItemId option:selected').val();
			//updateModuleXML(currentPageParentModule);
		}
	}

 	//add .on change for objItemId
 	$('#objItemId').on("change", function(){
		$(data).find('page').eq(currentPage).attr("objItemId",$('#objItemId option:selected').val());
		questionResponse_arr[questionResponseIndex].objItemId = $('#objItemId option:selected').val();
		//updateModuleXML(currentPageParentModule);
 	});

	//set enabling based off value in xml
	if($(data).find('page').eq(currentPage).attr("eo")){
		$("#eo").val($(data).find('page').eq(currentPage).attr("eo"));
	}

	// update the xml when the enabling is changed
	$("#eo").on("change", function(){
		$(data).find('page').eq(currentPage).attr("eo", $.trim($("#eo").val().replace('<p>', '').replace('</p>', '')));
	 //updateModuleXML(currentPageParentModule);
	}).css({'width': '500px', 'color': '#3383bb;'});

	$("#out_pageObjective").on("change", function(){
		var objUpdate = $.trim($("#out_pageObjective").val());
		$(data).find('page').eq(currentPage).attr('objective', objUpdate);
		if($(data).find('page').eq(currentPage).attr("type") == "kc"){
			questionResponse_arr[questionResponseIndex].objective = objUpdate;
		}
	//updateModuleXML(currentPageParentModule);
	}).css({'width': '500px', 'color': '#3383bb;'});

	//Make it a dialog
	$("#dialog-objEdit").dialog({
		dialogClass: "no-close",
		modal: true,
		width: 700,
		buttons: [
            {
	            text: "Done",
	            title: "Saves and closes the media drop dialog.",
	            click: function(){
						//ensures input values are saved
						if($(data).find('page').eq(currentPage).attr("type") == "kc"){
							$(data).find('page').eq(currentPage).attr("objItemId",$('#objItemId option:selected').val());
							questionResponse_arr[questionResponseIndex].objItemId = $('#objItemId option:selected').val();
						}
						$(data).find('page').eq(currentPage).attr("eo", $.trim($("#eo").val().replace('<p>', '').replace('</p>', '')));
						var objUpdate = $.trim($("#out_pageObjective").val());
						$(data).find('page').eq(currentPage).attr('objective', objUpdate);
						if($(data).find('page').eq(currentPage).attr("type") == "kc"){
							questionResponse_arr[questionResponseIndex].objective = objUpdate;
						}
						
	            	sendUpdateWithRefresh();
		            $(this).dialog("close");
		            $("#dialog-objEdit").remove();
		        }
            }
		]
	});

	$("#dialog-objEdit").tooltip();

}

/*function addMediaDrop(){
	$("#myCanvas").append("<div id='mediaDrop' class='btn_mediaDrop' title='Add files to the media directory.'></div>");

	$("#mediaDrop").click(function(){
		launchMediaDrop();
	});

	$("#mediaDrop").tooltip();
}*/

function launchMediaDrop(){

	var msg = '<div id="dialog-mediaDrop" title="Media File Upload Window.">';
	msg += "<div id='mediaDropDialog'>"
	msg += '<p class="validateTips">Add media files to the media directory for the lesson by <br/>'
	+ 'Dragging and Dropping file onto the Media Drop button or click on the button to browse your computer.</p>';
	msg += "<div id='inputMedia' title='Browse for file to be used.' class='audioDropSpot'>Media Drop</div>";
	msg += "<div id='inputFeedback' />";
	msg += "<br/>";
	msg += "</div></div>";

	$("#stage").append(msg);

	//Make it a dialog
	$("#dialog-mediaDrop").dialog({
		dialogClass: "no-close",
		modal: true,
		width: 550,
		buttons: [
            {
	            text: "Done",
	            title: "Saves and closes the media drop dialog.",
	            click: function(){
		            $(this).dialog("close");
		            $("#dialog-mediaDrop").remove();
		        }
            }
		]
	});

	//adds tooltips to the edit dialog buttons
    $(function () {
        $(document).tooltip();
    });

	var contentId = urlParams['type'] + '_' + urlParams['id'];

	$("#inputMedia").attr('data-content', contentId);
	$("#inputMedia").find('*').attr('data-content', contentId);

	$("#inputMedia").click(function(){
		siofu.prompt($("#inputMedia").attr('data-content'));
	});

	siofu.listenOnDrop(document.getElementById("inputMedia"));

	siofu.addEventListener("complete", function(event){
		if($('#dialog-mediaDrop').length > 0){
			siofu.removeEventListener("complete");
			siofu.removeEventListener("load");
			//if successful upload, else....
			var myFile = event.file.name;
			var myExt = getExtension(myFile);
		    //var favoriteTypes = ["mp4", "swf", "jpg", "png", "html", "htm", "gif", "jpeg", "swf", "mp3", "svg", "pdf", "doc", "docx", "pptx", "ppt", "xls", "xlsx"];
		    var convertableVideoTypes = ["ogv", "avi", "mov", "wmv", "flv", "webm"];
		    var convertableVectorTypes = ["eps"];
		    var convertableAudioTypes = ["wav", "ogg", "m4a", "aiff", "flac", "wma"];
		    var convertableTypes = convertableVideoTypes.concat(convertableAudioTypes, convertableVectorTypes);
        	$("#inputFeedback").empty();
	  //       if (favoriteTypes.indexOf(myExt.toLowerCase()) >= 0) {
			// 	if(event.success == true){
			// 		$("#inputFeedback").append(myFile + " has been uploaded to the media directory so a link can be created in the content.</div>");
			// 	}else{
			// 		$("#stage").append("<div id='uploadErrorDialog' title='Upload Error'>There was an error uploading your content. Please try again, if the problem persists, please contact your program administrator.</div>");
			// 		//Theres an error
			// 		//Style it to jQuery UI dialog
			// 		$("#uploadErrorDialog").tooltip().dialog({
			// 	    	autoOpen: true,
			// 			modal: true,
			// 			width: 400,
			// 			height: 200,
			// 			buttons: [ { text: "Close", click: function() {$( this ).dialog( "close" ); $( this ).remove()} }]
			// 		});
			// 	}
			// }
			if(myExt == "zip" || myExt == "ZIP"){
				$(".C_Loader").text("Your zip file is now being unzipped into your media folder.");
				cognizenSocket.on('unzipComplete', _unzipComplete);
			}
			else if (convertableTypes.indexOf(myExt.toLowerCase()) >= 0) {
				$(".C_Loader").remove();
				$("#stage").append("<div id='uploadConversionDialog' title='Upload Coverting'>The file format that you uploaded can't be played in most browsers. We are converting it to a compatibile format for you!<br/><br/>Larger files may take a few moments. <br/><br/></div>");
				$("#uploadConversionDialog").append("<div id='conversionProgress'><div class='progress-label'>Converting...</div></div>");
				$("#conversionProgress").progressbar({
					value: 0,
					change: function() {
						$(".progress-label").text($("#conversionProgress").progressbar("value") + "%");
					},
					complete: function() {
						$(".progress-label").text("Complete!");
					}
				});

				$("#conversionProgress > div").css({ 'background': '#3383bb'});

				$("#uploadConversionDialog").tooltip().dialog({
			    	autoOpen: true,
					modal: true,
					width: 400,
					height: 350,
					buttons: [ { text: "Close", click: function() {$( this ).dialog( "close" ); $( this ).remove()} }]
				});

				cognizenSocket.on('mediaConversionProgress', _mediaConversionProgress);
				cognizenSocket.on('mediaInfo', _mediaInfo);
				cognizenSocket.on('mediaConversionComplete', _mediaConversionComplete);
				$("#dialog-mediaDrop").remove();
			}
			else{
				$(".C_Loader").remove();
				if(event.success == true){
					doGitCommit();
					$("#inputFeedback").append(myFile + " has been uploaded to the media directory so a link can be created in the content.</div>");
				}
				else{
					$("#stage").append("<div id='uploadErrorDialog' title='Upload Error'>There was an error uploading your content. Please try again, if the problem persists, please contact your program administrator.</div>");
					//Theres an error
					//Style it to jQuery UI dialog
					$("#uploadErrorDialog").tooltip().dialog({
				    	autoOpen: true,
						modal: true,
						width: 400,
						height: 200,
						buttons: [ { text: "Close", click: function() {$( this ).dialog( "close" ); $( this ).remove()} }]
					});
				}

			}
		}
	});

	siofu.addEventListener("start", function(event){
		if($('#dialog-mediaDrop').length > 0){
			try { $("#loader").tooltip("destroy"); } catch (e) {}
			var myFile = event.file.name;
			var myExt = getExtension(myFile);
			$('#dialog-mediaDrop').append("<div class='C_Loader'><div class='C_LoaderText'> Uploading "+ myFile +" to the media directory. Larger files may take a few moments.</div></div>");
		}
	});

	$("#dialog-mediaDrop").tooltip();

}

function _mediaConversionProgress(data){
    $("#conversionProgress").progressbar("value", Math.floor(data.percent))
}

function _mediaInfo(data){
	if(data.video != ""){
		var splitDim = data.video_details[2].split("x");
		mediaWidth = splitDim[0];
		mediaHeight = splitDim[1];
	}
}

function _mediaConversionComplete(data){
	doGitCommit();


	$("#conversionProgress").remove();
	$("#uploadConversionDialog").append("Conversion Complete!");
}

var testOutOption_arr;

function launchPrefs(){
	//Create array holding values for test out option pages (all graded pages in the module).
	testOutOption_arr = [];

	for(var i = 0; i < totalPages; i++){
		if($(data).find("page").eq(i).attr("graded") == "true"){
			var tempObj = new Object();
			tempObj.title = $.trim($(data).find("page").eq(i).find("title").text());
			tempObj.id = $(data).find("page").eq(i).attr("id");
			testOutOption_arr.push(tempObj);
		}
	}

	var selectedHelp = '';
	if(courseHelp === true){

		if(!$(courseData).find("course").attr("help")){
			selectedHelp = 'No course wide help document updated, please upload a file!';
		}
		else{
			selectedHelp = $(courseData).find("course").attr("help");
		}
	}
	else{
		selectedHelp = $(data).find('help').attr('url');
	}

	var msg = '<div id="dialog-lessonPrefs" title="Set Preferences"><p class="validateTips">Set your lesson preferences below:</p>';
    msg += "<div id='accordion'>";
 	msg += "<h3 style='padding: .2em .2em .2em 2.2em'>Nav Button Options</h3>";
 	msg += '<div id="rest" style="font-size:100%; padding: 1em 1em; color:#666666">';
	//Add the glossary checkbox.
	msg += "<div class='preferences_option' id='hasGlossaryDialog'>";
	msg += "<label id='label' title='Add/Remove Glossary'>Glossary: </label>";
	msg += "<input id='hasGlossary' type='checkbox' name='hasGlossary' class='radio'/>";
	msg += "<label id='label' for='hasCourseGlossary' title='Set Course/Module Level Glossary'>Course glossary: </label>";
	msg += "<input id='hasCourseGlossary' type='checkbox' name='hasCourseGlossary' class='radio'/>";
	msg += "</div>";
	//Survey
	msg += "<label id='label' for='hasSurvey' title='Add a survey'>Survey: </label>";
	msg += "<input id='hasSurvey' type='checkbox' name='hasSurvey' class='radio'/>";
	msg += "<label id='inputSurveyLinkLabel' for='inputSurveyLink' title='Input a link for your survey.'>Survey Link: </label>";
	msg += "<input id='inputSurveyLink' type='text' name='inputSurveyLink' class='dialogInput' value='"+surveyLink+"' defaultvalue='"+surveyLink+"'/><br/>";
	//Test out
	msg += "<label id='label' for='hasTestOut' title='Add a test out option'>Test out: </label>";
	msg += "<input id='hasTestOut' type='checkbox' name='hasTestOut' class='radio'/>";
	msg += "<select id='testOutSelect'></select></br>";
	//Search
	msg += "<label id='label' for='hasSearch' title='Add the search option'>Search: </label>";
	msg += "<input id='hasSearch' type='checkbox' name='hasSearch' class='radio'/>";
	msg += '<span id="searchError" class="error">Search cannot be enabled if lockStep is enabled!</span><br/>';
	//Lockstep
	msg += "<label id='label' for='hasLockstep' title='Set content to only be accessed sequentially.'>Enable lockstep mode: </label>";
	msg += "<input id='hasLockstep' type='checkbox' name='hasLockstep' class='radio'/>";
	msg += '<span id="lockStepError" class="error">Lockstep cannot be enabled if search is enabled!</span><br/>';
	//Show page numbers
	msg += "<label id='label' for='showPageNumbers' title='Turn on page numbers in index.'>Show page # in index: </label>";
	msg += "<input id='showPageNumbers' type='checkbox' name='showPageNumbers' class='radio'/><br/>";	
	//Close Lesson
    msg += "<label id='label' for='hasCloseLesson' title='Add a close lesson option'>Close Lesson: </label>";
	msg += "<input id='hasCloseLesson' type='checkbox' name='hasCloseLesson' class='radio'/>";

	//#3886
	if(!$(courseData).find("course").attr("redmine") || $(courseData).find("course").attr("redmine") == "false"){
		msg += "</br><div id='clearLessonComments'>Clear Lesson Comments</div>";
	}
	msg += "</div>";//rest

 	msg += "<h3 style='padding: .2em .2em .2em 2.2em'>Alt Titles</h3>";
 	msg += '<div id="alttiltes" style="font-size:100%; padding: 1em 1em; color:#666666">';				
	msg += "<label id='label' title='Input course title as you would like it to appear.'>Alt Course Title: </label>";
	tmpCourseTitleText = $('#courseTitle').text().replace(/'/g, "\&#8217;");
	tmpLessonTitleText = $('#lessonTitle').text().replace(/'/g, "\&#8217;");
	msg += "<input id='altCourseTitle' class='dialogInput' type='text' value='"+ tmpCourseTitleText + "' defaultValue='"+ tmpCourseTitleText + "' style='width:70%;'/><br/>";
	msg += "<label id='label' title='Input lesson title as you would like it to appear.'>Alt Lesson Title: </label>";
	msg += "<input id='altLessonTitle' class='dialogInput' type='text' value='"+ tmpLessonTitleText + "' defaultValue='"+ tmpLessonTitleText + "' style='width:70%;'/><br/>";
	msg += "</div>";//alttiltes

 	msg += "<h3 style='padding: .2em .2em .2em 2.2em'>Help Options</h3>";
 	msg += '<div id="helpoptions" style="font-size:100%; padding: 1em 1em; color:#666666">';
	msg += "<div class='preferences_option' id='helpDialog' title='Add/Remove Help Button'>"
	msg += "<label id='helpLabel'>Help: </label>";
	msg += "<input id='hasHelp' type='checkbox' name='hasHelp'>";
	msg += "<label id='helpCourseLabel' title='BEWARE: MAKE SURE THAT COURSE HELP HAS ALREADY BEEN UPLOADED. IF IT HAS NOT, UPLOAD YOUR HELP WITH THE COURSE HELP CHECKBOX SELECTED.'>Course Help: </label>";
	msg += "<input id='hasCourseHelp' type='checkbox' name='hasCourseHelp'>";
	msg += "<div id='inputHelp' title='Browse for file to be used.' class='audioDropSpot'>Help Drop</div>";
	msg += "<div id='selectedHelp' title='Current file used for help section.'>"+selectedHelp+"</div>";
	msg += "<label id='helpWidthLabel'>Help window width: </label>";
	msg += "<input id='helpWidth' type='text' name='helpWidth' value='"+helpWidth+"' disabled='disabled' size='4'>";
	msg += '<span id="helpWidthError" class="error">The value must be a numeric value</span><br/>';
	msg += "<br/><label id='helpHeightLabel'>Help window height: </label>";
	msg += "<input id='helpHeight' type='text' name='helpHeight' value='"+helpHeight+"' disabled='disabled' size='4'>";
	msg += '<span id="helpHeightError" class="error">The value must be a numeric value</span><br/>';
	msg += "</div><br/>";
	msg += "</div>"; //helpoptions

 	msg += "<h3 style='padding: .2em .2em .2em 2.2em'>Publish</h3>";
 	msg += '<div id="publish" style="font-size:100%; padding: 1em 1em; color:#666666">';	
	msg += "<label id='label' title='Set SCORM Version'>SCORM Version: </label>";
	msg += "<select id='scormVersion'>";
	msg += "<option>2004_4th</option>";
	msg += "<option>2004_3rd</option>";
	msg += "<option>1.2</option>";
	msg += "<option>none</option>";
	msg += "</select>";
    msg += '<div id="manonlyHolder">';
    msg += "<label id='label' for='manifestOnly' title='Only publish the imsmanifest.xml file'>imsmanifest.xml only: </label>";
    msg += "<input id='manifestOnly' type='checkbox' name='manifestOnly' class='radio'/>";
    msg += '</div>';
    msg += '<div id="deliverableHolder">';
    msg += "<label id='label' for='deliverableActive' title='Save the publish output as a deliverable'>deliverable: </label>";
    msg += "<input id='deliverableActive' type='checkbox' name='deliverableActive' class='radio'/>";
    msg += "<label for='deliverableVersion' id='deliverableVersionLabel' style='display:none' title='Label to indicate version (ex. v1.0)'> version : </label>";
    msg += "<input type='text' name='deliverableVersion' id='deliverableVersion'  value='' class='dialogInput' style='width:70px;display:none'/>";
    msg += '</div>';//deliverableHolder
    msg += "<div id='publishButton' title='Publishes the lesson to the chosen format.'>Publish</div>"    
	msg += "</div>"; //publish	
	
	msg += "</div>"; //accordion
	msg += "</div>"; //dialog-lessonPrefs

	$("#stage").append(msg);

	//#3230
	$('#helpWidth').on('change', function(){
		if(!$.isNumeric($('#helpWidth').val())){
			$('#helpWidthError').removeClass('error').addClass('error_show');
			$('#helpWidth').val(helpWidth);
		}
		else{
			if($('#helpWidthError').hasClass('error_show')){
				$('#helpWidthError').removeClass('error_show').addClass('error');
			}
		}
	});

	//#3230
	$('#helpHeight').on('change', function(){
		if(!$.isNumeric($('#helpHeight').val())){
			$('#helpHeightError').removeClass('error').addClass('error_show');
			$('#helpHeight').val(helpHeight);
		}
		else{
			if($('#helpHeightError').hasClass('error_show')){
				$('#helpHeightError').removeClass('error_show').addClass('error');
			}
		}
	});

    $('#scormVersion').on("change", function(){
        if($('#scormVersion').find(':selected').text() == 'none'){
            $('#manifestOnly').prop('checked', false);
            $('#manonlyHolder').hide();
            $('#deliverableHolder').show();
        }
        else{
            if(!$('#deliverableActive').is(':checked')){
                $('#manonlyHolder').show();
            }
        }
    });

    $('#deliverableActive').on('change', function(){
        $('#deliverableVersionLabel').toggle();
        $('#deliverableVersion').toggle();
        if($('#scormVersion').find(':selected').text() == 'none'){
            $('#manonlyHolder').hide();
        }
        else{
            $('#manonlyHolder').toggle();
        }
    });

    $('#manifestOnly').on('change', function(){
        if($('#manifestOnly').prop('checked')){
            $('#deliverableActive').prop('checked', false);
            $('#deliverableHolder').hide();
        }
        else{
            $('#deliverableHolder').show();
        }
    });

    //publish button
	$("#publishButton").button().click(function(){
        savePreferences(true);
	}).tooltip();    

	//Make it a dialog
	$("#dialog-lessonPrefs").dialog({
		dialogClass: "no-close",
		modal: true,
		width: 550,
		buttons: [
			{
				text: "Cancel",
				title: "Cancel any changes.",
				click: function () {
	            	$(this).dialog("close");
	            	$("#dialog-lessonPrefs").remove();
	            }
            },
            {
	            text: "Done",
	            title: "Saves and closes the preferences dialog.",
	            click: function(){
		            savePreferences();
		        }
            }
		]
	});


	//#3886
	if(!$(courseData).find("course").attr("redmine") || $(courseData).find("course").attr("redmine") == "false"){
		$("#clearLessonComments").button().click(function(){
			openCommentKillerDialog();
			//cognizenSocket.emit("clearLessonComments", {lesson: urlParams['id']})
		});
	}

	$("#scormform").tooltip();
	
	if(showPageNumbers == true){
		$("#showPageNumbers").attr('checked', true);
	}else{
		$("#showPageNumbers").attr('checked', false);
	}
	
	$("#showPageNumbers").change(function(){
		if($(this).prop("checked") == true){
			$(data).find('masterIndex').attr('showpagenumbers', true);
			showPageNumbers = true;
		}else{
			$(data).find('masterIndex').attr('showpagenumbers', false);
			showPageNumbers = false;
		}
		updateIndex();
	});
	
	if(glossary == true){
		$("#hasGlossary").attr('checked', true);
		$("#hasCourseGlossary").removeAttr("disabled");
	} else{
		$("#hasGlossary").attr('checked', false);
		$("#hasCourseGlossary").attr("disabled", true);
	}

	if(courseGlossary == true){
		$("#hasCourseGlossary").attr('checked', true);
	} else{
		$("#hasCourseGlossary").attr('checked', false);
	}

	$("#hasGlossary").change(function(){
		if($(this).prop("checked") == true){
			$("#hasCourseGlossary").removeAttr("disabled");
		}else{
			$("#hasCourseGlossary").attr("disabled", true);
		}
	});

	$("#hasCourseGlossary").change(function(){
		if($(this).prop("checked") == true){
			$(data).find("glossary").attr("courseGlossary", "true");
		}else{
			$(data).find("glossary").attr("courseGlossary", "false");
		}
	});
	
	if(progressMode == "lockStep"){
		$("#hasLockstep").attr('checked', true);
		$("#hasSearch").attr('disabled', true);
		$('#searchError').removeClass('error').addClass('error_show');
	}else{
		$("#hasLockstep").attr('checked', false);
		$('#searchError').removeClass('error_show').addClass('error');
	}
	
	$("#hasLockstep").change(function(){
		if($(this).prop("checked") == true){
			$(data).find("progressMode").attr("value", "lockStep");
			progressMode = "lockStep";
			$("#hasSearch").attr('disabled', true);
			$('#searchError').removeClass('error').addClass('error_show');
		}else{
			$(data).find("progressMode").attr("value", "linear");
			progressMode = "linear";
			$("#hasSearch").attr('disabled', false);
			$('#searchError').removeClass('error_show').addClass('error');
		}
		updateIndex();
	});

	if(hasSurvey == true){
		$("#hasSurvey").attr('checked', true);
	} else{
		$("#hasSurvey").attr('checked', false);
		$("#inputSurveyLinkLabel").hide();
		$("#inputSurveyLink").hide();
	}

	$("#hasSurvey").change(function(){
		if($(this).prop("checked") == true){
			$(data).find("survey").attr("value", "true");
			$("#inputSurveyLinkLabel").show();
			$("#inputSurveyLink").show();
			hasSurvey = true;
		}else{
			$(data).find("survey").attr("value", "false");
			$("#inputSurveyLink").hide();
			$("#inputSurveyLinkLabel").hide();
			hasSurvey = false;
		}
	});

	if(closeLesson == true){
		$("#hasCloseLesson").attr('checked', true);
	}else{
		$("#hasCloseLesson").attr('checked', false);
	}

	$("#hasCloseLesson").change(function(){
		if($(this).prop("checked") == true){
			$(data).find("closelesson").attr("value", "true");
			closeLesson = true;
		}else{
			$(data).find("closelesson").attr("value", "false");
			closeLesson = false;
		}
	});

	if(testOut == true){
		$("#hasTestOut").attr('checked', true);
	}else{
		$("#hasTestOut").attr('checked', false);
		$("#testOutSelect").hide();
	}

	$(testOutOption_arr).each(function(){
		$("#testOutSelect").append($("<option>").attr('value', this.id).text(this.title));
	});

	if($(data).find("testout").attr("link") != "null"){
		$("#testOutSelect").val($(data).find("testout").attr("link"));
	}

	$("#testOutSelect").change(function(){
		console.log($("#testOutSelect option:selected").val());
	});

	$("#hasTestOut").change(function(){
		if($(this).prop("checked") == true){
			$(data).find("testout").attr("value", "true");
			$("#testOutSelect").show();
			testOut = true;
		}else{
			$(data).find("testout").attr("value", "false");
			$("#testOutSelect").hide();
			testOut = false;
		}
	});

	//search #3559
	if(searchEnabled){
		$("#hasSearch").attr('checked', true);
		$("#hasLockstep").attr('disabled', true);
		$('#lockStepError').removeClass('error').addClass('error_show');
	}
	else{
		$("#hasSearch").attr('checked', false);
		$('#lockStepError').removeClass('error_show').addClass('error');
	}

	$("#hasSearch").change(function(){
		if($(this).prop("checked") == true){
			$(data).find("search").attr("value", "true");
			searchEnabled = true;
			$("#hasLockstep").attr('disabled', true);
			$('#lockStepError').removeClass('error').addClass('error_show');
		}else{
			$(data).find("search").attr("value", "false");
			searchEnabled = false;
			$("#hasLockstep").attr('disabled', false);
			$('#lockStepError').removeClass('error_show').addClass('error');
		}
		updateIndex();
	});	

	var contentId = urlParams['type'] + '_' + urlParams['id'];

	$("#inputHelp").attr('data-content', contentId);
	$("#inputHelp").find('*').attr('data-content', contentId);

	if(helpButton == true){
		$("#hasHelp").attr('checked', true);
		$("#helpWidth").attr('disabled', false);
		$("#helpHeight").attr('disabled', false);
	} else{
		$("#hasHelp").attr('checked', false);
		$("#helpWidth").attr('disabled', true);
		$("#helpHeight").attr('disabled', true);
	}

	if(courseHelp == true){
		$("#hasCourseHelp").attr('checked', true);
	}else{
		$("#hasCourseHelp").attr('checked', false);
		$(courseData).find("course").attr("help", "");
		sendCourseUpdate();	
	}

	$("#hasCourseHelp").change(function(){
		if($(this).prop("checked") == true){
			$(data).find("help").attr("course", "true");
			courseHelp = true;
			if(!$(courseData).find("course").attr("help")){
				var tmpURL = "../" + $(data).find("help").attr("url");
				$(courseData).find("course").attr("help", tmpURL);
				sendCourseUpdate();
				$("#selectedHelp").text(tmpURL);
			}
			else{
				$("#selectedHelp").text($(courseData).find("course").attr("help"));
			}

		}else{
			$(data).find("help").attr("course", "false");
			var tmpURL = $(data).find("help").attr("url");
			tmpURL = tmpURL.replace("../", "");
			courseHelp = false;
			$("#selectedHelp").text(tmpURL);
			$(data).find("help").attr("url", tmpURL);
			$(courseData).find("course").attr("help", "");
			sendCourseUpdate();			
		}

		forceUpdateOnSave = true;
	});

	$("#hasHelp").click(function() {
		$("#inputHelp").toggle(this.checked);

		if($("#helpWidth").prop('disabled')){
			$("#helpWidth").attr('disabled', false);
		}
		else{
			$("#helpWidth").attr('disabled', true);
		}

		if($("#helpHeight").prop('disabled')){
			$("#helpHeight").attr('disabled', false);
		}
		else{
			$("#helpHeight").attr('disabled', true);
		}
	});

	$("#inputHelp").click(function(){
		siofu.prompt($("#inputHelp").attr('data-content'));
	});

	siofu.listenOnDrop(document.getElementById("inputHelp"));

	siofu.addEventListener("complete", function(event){
		siofu.removeEventListener("complete");
		siofu.removeEventListener("load");
		//if successful upload, else....
		var myFile = event.file.name;
		var myExt = getExtension(myFile);
	    var favoriteTypes = ["mp4", "swf", "jpg", "png", "html", "htm", "gif", "jpeg", "svg", "pdf", "doc", "docx", "pptx", "ppt", "xls", "xlsx"];
        if (favoriteTypes.indexOf(myExt.toLowerCase()) >= 0) {
			if(event.success == true){
				if(courseHelp == true){
					//$(data).find('help').attr('url', '../media/' + myFile );
					$(courseData).find("course").attr("help", '../media/' + myFile );
				}else{
					$(data).find('help').attr('url', 'media/' + myFile );
				}
				helpURL = $(data).find('help').attr('url');
				$("#selectedHelp").text(myFile);
				$("#hasHelp").attr('checked', true);
				var urlParams = queryStringParameters();
				forceUpdateOnSave = true;
				if(courseHelp == true){
					socket.emit('updateHelpLocation', { my: myFile });
					sendCourseUpdate();
				}else{
					doGitCommit();
				}
			}else{
				$("#stage").append("<div id='uploadErrorDialog' title='Upload Error'>There was an error uploading your content. Please try again, if the problem persists, please contact your program administrator.</div>");
				//Theres an error
				//Style it to jQuery UI dialog
				$("#uploadErrorDialog").dialog({
			    	autoOpen: true,
					modal: true,
					width: 400,
					height: 200,
					buttons: [ { text: "Close", click: function() {$( this ).dialog( "close" ); $( this ).remove()} }]
				});
			}
		}
	});

	//If course help - once file moved commit to git
	socket.on("courseHelpLocationUpdated", function(){
		doGitCommit();
	});

	$("#scormVersion").val($(data).find('scormVersion').attr('value'));

	//adds tooltips to the edit dialog buttons
    $(function () {
        $(document).tooltip();
		//set up jquerui accordion
		$("#accordion").accordion({
			collapsible: true,
			heightStyle: "content"
		});   
    });
}

function _unzipComplete(){
	$(".C_Loader").remove();
	doGitCommit();

	try { cognizenSocket.removeListener("unzipComplete", _unzipComplete);; } catch (e) {}
	var msg = "<p>Your zip file has been uploaded and it's contents placed in your media folder.</p>";
	msg += "<p><b>IF</b> your zip is a zip of a folder, you will have to add that folder to your path when accessing the media. Ex. myFolder/myMedia.mp4</p>";
	msg += "<p>If you simply zipped a group of files, they can be accessed as you usually would.  Ex. myImage.png, myImage2.png and myImage3.png</p>"

	$("#inputFeedback").append(msg);
}

function openCommentKillerDialog(){
	var msg = '<div id="dialog-removeComments" title="Remove ALL Lesson Comments"><p class="validateTips">Do you want to remove all lesson comments?</p>';
	//Add the scorm form
	msg += "<p>Be 100% sure that this is what you want to do before pressing yes.  This will remove all comments for this lesson and they are not recoverable.</p>";

	//Add the resources/docs checkbox.   -------TODO
	msg += "</div>";

	$("#stage").append(msg);

	//Make it a dialog
	$("#dialog-removeComments").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
				$("#dialog-removeComments").remove();
			},
		buttons: {
			No: function () {
            	$(this).dialog("close");
            },
            Yes: function(){
            	cognizenSocket.emit("clearLessonComments", {lesson: urlParams['id']});
            	$("#dialog-lessonPrefs").remove();
	            $(this).dialog("close");
            }
		}
	});
}

function savePreferences(_pub){
	//check if glossary changed.
	var glossarySelected = $("#hasGlossary").is(':checked');
	var courseGlossarySelected = $("#hasCourseGlossary").is(':checked');
	var updateNeeded = false;

	var indexShowPageNumber = $("#showPageNumbers").is(':checked');
	
	var isLockstep = $("#hasLockstep").is(':checked');
	
	courseTitle = $("#altCourseTitle").val().trim();
	if(courseTitle != $(courseData).find('course').attr('coursedisplaytitle')){
		updateNeeded = true;
	}
	//$(data).find("coursedisplaytitle").attr("value", courseTitle);
	$(courseData).find('course').attr('coursedisplaytitle', courseTitle);
	sendCourseUpdate();
	$("#courseTitle").text(courseTitle);

	lessonTitle = $("#altLessonTitle").val().trim();
	if(lessonTitle != $(data).find("lessondisplaytitle").attr("value")){
		updateNeeded = true;
	}
	$(data).find("lessondisplaytitle").attr("value", lessonTitle);
	$("#lessonTitle").text(lessonTitle);
	document.title = lessonTitle;
	
	if(isLockstep != undefined){
		$(data).find('progressMode').attr('value', progressMode);
		updateNeeded = true;
	}
	
	if(indexShowPageNumber != undefined){
		showPageNumbers = indexShowPageNumber;
		$(data).find('masterIndex').attr('showpagenumbers', indexShowPageNumber);
		updateNeeded = true;
	}
	
	if(glossary != glossarySelected){
		glossary = glossarySelected;
		$(data).find('glossary').attr('value', glossarySelected);
		updateNeeded = true;
	}

	if(courseGlossary != courseGlossarySelected){
		courseGlossary = courseGlossarySelected;
		$(data).find('glossary').attr('courseGlossary', courseGlossarySelected);
		updateNeeded = true;
	}

	var surveySelected = $("#hasSurvey").is(':checked');

	if(hasSurvey){
		$(data).find('survey').attr('value', surveySelected);
		hasSurvey = surveySelected;
		surveyLink = $("#inputSurveyLink").val();
		$(data).find('survey').attr('link', $("#inputSurveyLink").val());
		updateNeeded = true;
	}

	var testoutSelected = $("#hasTestOut").is(':checked');

	if(testOut != undefined){
		$(data).find('testout').attr('value', testoutSelected);
		testOut = testoutSelected;
		testLink = $("#testOutSelect option:selected").val();
		$(data).find('testout').attr('link', $("#testOutSelect option:selected").val());
		updateNeeded = true;
	}

	var searchSelected = $("#hasSearch").is(":checked");

	if(searchEnabled != undefined){
		$(data).find('search').attr('value', searchSelected);
		searchEnbled = searchSelected;
		updateNeeded = true;
	}


	var closeLessonSelected = $("#hasCloseLesson").is(':checked');
	if(closeLesson){
		$(data).find('closelesson').attr('value', closeLessonSelected);
		updateNeeded = true;
	}

	var selectedScorm = $('#scormVersion').find(':selected').text();
	var myScormVersion = $(data).find('scormVersion').attr('value');
	if(selectedScorm != myScormVersion){
		$(data).find('scormVersion').attr('value', selectedScorm);
		updateNeeded = true;
	}

	var helpSelected = $("#hasHelp").is(':checked');
	if(helpButton != helpSelected){
		$(data).find('help').attr('value', helpSelected);
		updateNeeded = true;
	}

	helpWidth = $("#helpWidth").val();
	$(data).find('help').attr('width', helpWidth);

	helpHeight = $("#helpHeight").val();
	$(data).find('help').attr('height', helpHeight);

	if(helpSelected){
		helpButton = true;
	}else{
		helpButton = false;
	}

	//Force an update to the xml if a new help file is uploaded.
	if(forceUpdateOnSave == true){
		updateNeeded = true;
		forceUpdateOnSave = false;
	}

	if(updateNeeded == true && _pub != true){
		sendUpdateWithRefresh("updatePrefs");
		$("#dialog-lessonPrefs").dialog("close");
		$("#dialog-lessonPrefs").remove();
		//updateGlossary();
	}else if(updateNeeded == true && _pub == true){
		sendUpdateWithRefresh("updatePrefsWithPublish");
	}else if(updateNeeded == false && _pub == true){
		clickPublish();
	}else{
		$("#dialog-lessonPrefs").dialog("close");
		$("#dialog-lessonPrefs").remove();
	}
	currentTemplate.fadeComplete();
}

function updatePrefs(_pub){
	$.ajax({
	    type: "GET",
	    url: "xml/content.xml",
	    dataType: "xml",
	    async: false,
	    success: function(_data){
	    	data = _data;
	    	$("#glossaryPane").remove();
			if($(data).find('glossary').attr('value') == "true"){
				glossary = true;
			}else{
				glossary = false;
			}

			if($(data).find('survey').attr('value') == "true"){
				hasSurvey = true;
				surveyLink = $(data).find('survey').attr('link');
			}else{
				hasSurvey = false;
			}

			if($(data).find('testout').attr('value') == "true"){
				testOut = true;
				testLink = $(data).find('testout').attr('link');
			}else{
				testOut = false;
			}
			
			if($(data).find('masterIndex').attr('showpagenumbers') == "true"){
				showPageNumbers = true;
			}else{
				showPageNumbers = false;
			}
			
			progressMode = $(data).find('progressMode').attr('value');
			
			if($(data).find('closelesson').attr('value') == "true"){
				closeLesson = true;
			}else{
				closeLesson = false;
			}

			if(_pub == true){
				clickPublish();
			}

			checkGlossary();
			checkHelp();
			checkSurvey();
			checkTestOut();
			checkCloseLesson();
		},
		error: function(){
	   		alert("unable to load content.xml in updatePrefs")
	   	}
	});
}

function clickPublish(){
	$('#myCanvas').append('<div class="C_Loader"><div class="C_LoaderText">Please Wait.<br/><br/>The content is being packaged, this may take a couple of minutes.</div></div>');

	var myScormVersion = $(data).find('scormVersion').attr('value');
	var manifestOnly = $('#manifestOnly').is(':checked');
    var deliverable = {
        isDeliverable : $('#deliverableActive').is(':checked'),
        version : $('#deliverableVersion').val()
    };
	var publishData = {
		content: {type: urlParams['type'], id: urlParams['id']},
		user: {id: userID, username: username},
		scorm: {version : myScormVersion, manifestonly: manifestOnly },
		deliverable : deliverable
	};

	cognizenSocket.emit('publishContent', publishData, function(fdata) {
		sendUpdate();
		$('.C_Loader').remove();

		parsePackageLocation(fdata);
	});
	$("#dialog-lessonPrefs").dialog("close");
	$("#dialog-lessonPrefs").remove();
}

function checkSurvey(){
	try{ $("#survey").remove();} catch(e){}
	//Survey button.
	if($(data).find('survey').attr('value')){
		surveyLink = $(data).find('survey').attr('link');
		if($(data).find('survey').attr('value') == "true"){
			hasSurvey = true;
			$("#myCanvas").append("<button id='survey' aria-label='Click here to take a survey.'>COMMENT</button>");
		}else{
			hasSurvey = false;
		}

		$("#survey").button().click(function(){
			if(surveyLink == "null"){
				alert("The link for the survey has not been set.");
			}else{
				window.open(surveyLink, "_blank");
			}
		});
	}else{
		$(data).find("nextBack").after($('<survey value="false" link="null"/>'));
		hasSurvey = false;
	}
}	//End survey

function checkTestOut(){
	try{ $("#testOut").remove();} catch(e){}
	//Test Out button.
	if($(data).find('testout').attr('value')){
		testLink = $(data).find('testout').attr('link');
		if($(data).find('testout').attr('value') == "true"){
			testOut = true;
			$("#myCanvas").append("<button id='testOut' aria-label='Click here to got directly to the test.'>TEST OUT</button>");
		}else{
			testOut = false;
		}

		$("#testOut").button().click(function(){
			if(testLink == "null"){
				alert("The link for the test has not been set.");
			}else{
				if(indexState == true){
					toggleIndex();
				}
				loadPageFromID(testLink);
			}
		});
	}else{
		$(data).find("nextBack").after($('<testout value="false" link="null"/>'));
		testOut = false;
	}
}	//End survey



function checkCloseLesson(){
	try{ $("#closeLesson").remove();} catch(e){}
	if(closeLesson){
		$("#myCanvas").append("<button id='closeLesson' title='Click here close your lesson.'>CLOSE LESSON</button>");

		$("#closeLesson").button().click(function(){
			//#3550 updated to call scorm call.
			//#3568
			var isScored = 'false';
			//evaluate score
			for(var k = 0; k < $(data).find("page").length; k++){
				if($(data).find("page").eq(k).attr('graded') === "true" &&
					$(data).find("page").eq(k).attr('type') === "kc"){
					isScored = "true";
					break;
				}
			}
			if(doScorm()){
				if(currentTemplateType == "completion"){
					if(isScored === "true"){
						var _score_obj = getFinalScore();
						if($(data).find('scormVersion').attr('value') === '1.2_CTCU' || $(courseData).find("course").attr("lms") == 'CTCU' || $(courseData).find("course").attr("lms") == 'NEL') {
							completeLesson(score_obj.passed, score_obj.passed, score_obj.score, false, false, false);
						}
						else{
							completeLesson(true, _score_obj.passed, _score_obj.score, false, false, false);
						}
					}
					else{
						//#3568 - don't set success_status for non scored lessons
						completeLesson(true, 'undefined', 0, false, false, true);
					}
				}
				else{
			        switch(scorm.version){
			            case "1.2" :
							scorm.API.getHandle().LMSFinish("");
			            	break;
			            //2004
			            default :
							scorm.API.getHandle().Terminate("");
			            	break;
			        }

				}

			}
			window.close();
		});
	}
}

function checkHelp(){
	if($(data).find('help').attr('course') === 'true'){
		if(!$(courseData).find("course").attr("help")){
			helpButton = false;
		}
	}
	if(helpButton == true){
		if($("#help").length == 0){
			$('#myCanvas').append("<button id='help' title='Access help information.'>help</button>");
			//Style the Help button and give it its listener
			$("#help").button({
				icons:{
					primary: 'ui-icon-help'
				}
			});
		}
		//grab URL of help file and attach click action

		var loc = window.location.pathname;
		var dir = loc.substring(0, loc.lastIndexOf('/'));

		if($(data).find('help').attr('course') === 'true'){
			helpURL = $(courseData).find("course").attr("help");
		}
		else{
			helpURL = $(data).find('help').attr('url');
		}

		$("#help").click(function() {
			window.open(unescape(dir + "/" +helpURL), 'helpWindow', 'menubar=0, status=0, toolbar=0, resizable=1, scrollbars=1, width='+helpWidth+', height='+helpHeight+'');
		});
	}
	else{
		$("#help").remove();
	}
}

////checkLock Mode and enable pass functions....
function checkLockMode(){
	if(mode == "edit" || mode == "admin"){
		$("#myCanvas").append("<div id='passLock' class='btn_passLock' title='Relinquish Edit Control'></div>");
	}else if(forcedReviewer == true){
		$("#myCanvas").append("<div id='passLock' class='btn_requestLock' title='Request Edit Control'></div>");
	}
	$("#passLock").tooltip().click(function(){
		//Relinquish Edit Control
		connected = socket.socket.connected;

		if(connected){
			if(!forcedReviewer){
				var msg = '<div id="dialog-relinquishEdit" title="Relinquish Edit Control"><p class="validateTips">Do you want to relinquish edit control of the lesson?</p></div>';

				//Add to stage.
				$("#stage").append(msg);

				//Make it a dialog
				$("#dialog-relinquishEdit").dialog({
					dialogClass: "no-close",
					modal: true,
					width: 550,
					close: function(event, ui){
						$("#dialog-relinquishEdit").remove();
					},
					buttons: {
						YES: function () {
							mode = "review";
							justRelinquishedLock = true;
							forcedReviewer = true;
							activeEditor = null;
							cognizenSocket.emit('passLock', { me: username });
							$(this).dialog("close");
							nextDisabled = true;
							backDisabled = true;
							buildInterface();
						},
						NO: function(){
							$(this).dialog("close");
						}
					}
				});
			}
			//Request Edit Control
			else{
				if(activeEditor == null){
					var msg = '<div id="dialog-requestEdit" title="Take Edit Controls"><p class="validateTips">No one is currently editing the lesson.</p><p>Would you like to assume the edit controls?</p></div>';
				}else{
					var msg = '<div id="dialog-requestEdit" title="Request Edit Control"><p class="validateTips">Ask '+ activeEditor +' to permit you to take editing controls.</p><p>Would you like to send this request?</p></div>';
				}

				//Add to stage.
				$("#stage").append(msg);

				//Make it a dialog
				$("#dialog-requestEdit").dialog({
					dialogClass: "no-close",
					modal: true,
					width: 550,
					close: function(event, ui){
						$("#dialog-requestEdit").remove();
					},
					buttons: {
						YES: function () {
							cognizenSocket.emit('requestLock', {me: username});
							$(this).dialog("close");
						},
						NO: function(){
							$(this).dialog("close");
						}
					}
				});
			}
		}else{
			fireConnectionError();
		}
	});
}




function updateTotalGradedQuestions(){
	totalGradedQuestions = 0;
	for(var i = 0; i < totalPages; i++){
		if( ($(data).find("page").eq(i).attr('type') == 'kc') && ($(data).find("page").eq(i).attr('graded') == 'true') ){
			if($(data).find("page").eq(i).attr('layout') == 'questionBank' && $(data).find("page").eq(i).attr('tocomplete') != undefined){
				if($(data).find("page").eq(i).attr('showall') == 'false'){
					totalGradedQuestions += parseInt($(data).find("page").eq(i).attr('tocomplete'));
				}
				else{
					totalGradedQuestions += $(data).find("page").eq(i).find("bankitem").length;
				}
			}else{
				totalGradedQuestions++;
			}
		}
	}
}





//If the course is linear - must complete page by page - setup a page completion tracking array.
function buildTrackingArray(){
	isLinear = true;
	tracking_arr = [];
	for(var i = 0; i < totalPages; i++){
		var page_obj = new Object();
		page_obj.id = $(data).find('page').eq(i).attr('id');
		page_obj.complete = false;
		tracking_arr.push(page_obj);
	}
}



/*************************************************************
** Next/Back/Home Button Funcitonality
*************************************************************/
function clickBack(){
	disableBack();
	if(indexState == true){
		toggleIndex();
	}
	if(glossaryState == true){
		toggleGlossary();
	}
	currentBranch = 0;
	currentPage--;
	currentTemplate.destroySelf();
}

function clickNext(){
	disableNext();
	if(indexState == true){
		toggleIndex();
	}
	if(glossaryState == true){
		toggleGlossary();
	}
	currentBranch = 0;
	currentPage++;
	currentTemplate.destroySelf();
}

function clickHome(){
	if(indexState == true){
		toggleIndex();
	}
	if(glossaryState == true){
		toggleGlossary();
	}
	currentBranch = 0;	
	currentPage = 0;
	currentTemplate.destroySelf();
}

function disableBack(){
	$('#back').attr('aria-disabled', 'true');
	$('#back').addClass('disabled');
	$('#back').off('click');
	$("#back").attr("tabindex", "0");
	backDisabled = true;
}

function enableBack(){
	$('#back').attr('aria-disabled', 'false');
	$('#back').removeClass('disabled');
	//ensure all click events are off on "#back
	$('#back').off('click');
	$("#back").click(clickBack);
	$("#back").attr("tabindex", "1");
	backDisabled = false;
}

function disableNext(){
	$('#next').attr('aria-disabled', 'true');
	$('#next').addClass('disabled');
	$('#next').off('click');
	$("#next").attr("tabindex", "0");
	nextDisabled = true;
}

function enableNext(){
	$('#next').attr('aria-disabled', 'false');
	$('#next').removeClass('disabled');
	$("#next").click(clickNext);
	$("#next").attr("tabindex", "1");
	nextDisabled = false;
}

function disableHome(){
	$('#homeButton').addClass('disabled');
	$('#homeButton').off('click');
	homeDisabled = true;
}

function enableHome(){
	$('#homeButton').removeClass('disabled');
	$("#homeButton").click(clickHome);
	homeDisabled = false;
}

function disableIndex(){
	$('#indexTab').addClass('disabled');
	$('#indexTab').off('click');
	indexDisabled = true;
}

function enableIndex(){
	if(indexDisabled){
		$('#indexTab').removeClass('disabled');
		$('#indexTab').unbind('click').click(toggleIndex);
		indexDisabled = false;
	}
}

//Turns the next/back button off for first/last page.
function checkNavButtons(){
	if(assessment && !checkQuestionComplete()){
		disableIndex();
		disableHome();
	}else{
		enableIndex();
		enableHome();
	}

	if(mode == "edit" && indexDisabled == true){
		mandatoryInteraction = false;
		enableIndex();
	}

	if(currentPage == 0 || (assessment == true && !checkQuestionComplete())){
		disableBack();
	}else{
		var _cmi = 'cmi.core.entry';
		if($(data).find('scormVersion').attr('value').substring(0,4) == "2004"){
			_cmi = 'cmi.entry';
		}
		if(backDisabled == true || scorm.get(_cmi) == "resume" || markResume == true){
			enableBack();
			markResume = false;
		}
	}

	if(currentPage == totalPages -1 || mandatoryInteraction == true){
		disableNext();
		if($(data).find("page").eq(currentPage).attr('layout') == "pathing" && mandatoryInteraction == true){
			disableIndex();
			disableBack();
		}

	}else{
		if(nextDisabled == true){
			enableNext();
			//enableIndex();
		}
	}

	if(currentPage == totalPages -1 && isScorm && !mandatoryInteraction && $(data).find("page").eq(currentPage).attr('layout') != "completion"){
		completeLessonDefault();
	}
	else if(currentPage > totalPages -1 && isScorm && mandatoryInteraction && $(data).find("page").eq(currentPage).attr('layout') != "completion"){
		completeLessonDefault();
	}

}


/*************************************************************
** Page Counter Funcitonality
*************************************************************/
function updatePageCount(){
	var tempPage = currentPage + 1;
	if($(courseData).find("course").attr("lms") === 'CTCU'){
		$('#pageCount').text(tempPage + "/" + totalPages);
	}
	else if(isMobile){
		$('#pageCount').text(tempPage + " of " + totalPages);
	}
	else{
		$('#pageCount').text("Page " + tempPage + " of " + totalPages);
		$('#pageCount').attr('aria-label', "Page " + tempPage + " of " + totalPages);
	}
}

/****************************************************
********************************** TRACKING
*****************************************************/
function rejoinTracking(_location){
	var foundCurrPage = 0;
	for(var i = 0; i < tracking_arr.length; i++){
		if(tracking_arr[i].id === _location)
		{
			foundCurrPage = 1;
			tracking_arr[i].complete = true;
		}
		else if(foundCurrPage == 0)
		{
			tracking_arr[i].complete = true;
		}

	}
	updateMenuItems();
}

function updateTracking(){
	tracking_arr[currentPage].complete = true;
	updateMenuItems();
}

/////////////////////////////////////////////////////END TRACKING

/****************************************************
********************************** SCORING FUNCTIONALITY
*****************************************************/
function updateScoring(_userSelection, _correct, _order, _bankID, _subID){
	var hasSubID = false;
	var isMatch = false;
	if(_subID){
		hasSubID = true;
	}



	for(var i = 0; i < questionResponse_arr.length; i++){
		if(currentPageID == questionResponse_arr[i].id){
			if(hasSubID){
				if(_subID == questionResponse_arr[i].subID){
					isMatch = true;
				}
			}else{
				isMatch = true;
			}
		}

		if(isMatch){
			if(mode != "edit"){
				questionResponse_arr[i].complete = true;
			}

			questionResponse_arr[i].userAnswer = [];
			for(var j = 0; j < _userSelection.length; j++){
				questionResponse_arr[i].userAnswer.push(_userSelection[j]);
				questionResponse_arr[i].correct = _correct;
			}
			//Assures that we display correctly upon return
			if(_order){
				questionResponse_arr[i].order = _order;
			}

			//Show proper bank item, if a bank...
			if(_bankID != undefined){
				questionResponse_arr[i].bankID = _bankID;
			}
			break;
		}
	}

	//if is running in SCORM LMS set the questionResonse_arr to the cmi.suspend_data
	if(doScorm()){

		//NWC (NEL) courses do not persist score of tests
		if($(courseData).find("course").attr("lms") != 'NEL'){
			//create string version of questionResponse_arr to be used in suspend_data
			var qrString = '';
			for(var i = 0; i < questionResponse_arr.length; i++){
				qrString += JSON.stringify(questionResponse_arr[i]) + "|";
			}

			scorm.set("cmi.suspend_data", qrString);
		}
	}

	if(restartOnFail == true){
		checkForRestart();
	}
}

function checkForRestart(){
	var allowedMisses = Math.ceil(totalGradedQuestions - (totalGradedQuestions * passScore));

	var misses = 0;

	for (var i = 0; i < questionResponse_arr.length; i++){
		if(questionResponse_arr[i].correct == false && questionResponse_arr[i].graded){
			misses++
		}
	}

	if(misses == allowedMisses){
		sendRestartOnFail();
	}
}

function sendRestartOnFail(){
	$("#stage").append('<div id="dialog-failedTraining" title="Failed"><p class="validateTips">You have missed too many questions to pass this training.</p><p>You must start this training over. Please click <b>Restart</b> below to restart the training. Close your browser window to quit.</p></div>');

	//Make it a dialog
	$("#dialog-failedTraining").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
				location.reload();
				$("#dialog-failedTraining").remove();
			},
		buttons: {
			Restart: function () {
                    $(this).dialog("close");

			}
		}
	});
}

function getFinalScore(){
	var score_obj = new Object();
	score_obj.totalQuestions = totalGradedQuestions;
	score_obj.correctQuestions = 0;
	score_obj.score = 0;
	score_obj.scorePercent = 0;
	score_obj.minScore = parseInt($(data).find('minScore').attr('value'));
	score_obj.passed = false;

	for(var i = 0; i < questionResponse_arr.length; i++){
		if(questionResponse_arr[i].correct && questionResponse_arr[i].graded){
			score_obj.correctQuestions++;
		}
	}
	score_obj.score = score_obj.correctQuestions / score_obj.totalQuestions;
	score_obj.scorePercent = Math.round(score_obj.score*100);
	if(score_obj.scorePercent >= score_obj.minScore){
		score_obj.passed = true;
	}

	return score_obj;
}

function checkQuestionComplete(){
	var isComplete = false;
	for(var i = 0; i < questionResponse_arr.length; i++){
		if(currentPageID == questionResponse_arr[i].id){
			if(questionResponse_arr[i].complete == true){
				isComplete = true;
			}
		}
	}
	return isComplete;
}

function updateTextInputQuestionResponse(_questionObj){
	for(var i = 0; i < questionResponse_arr.length; i++){
		if(currentPageID == questionResponse_arr[i].id){

			for(var j = 0; j < questionResponse_arr[i].textInputQuestions.length; j++){
				if(_questionObj.question == questionResponse_arr[i].textInputQuestions[j].question){
					questionResponse_arr[i].textInputQuestions[j].userAnswer = _questionObj.userAnswer;
					questionResponse_arr[i].textInputQuestions[j].correct = _questionObj.correct;
					questionResponse_arr[i].textInputQuestions[j].feedback = _questionObj.feedback;
					questionResponse_arr[i].textInputQuestions[j].userAttempts = _questionObj.userAttempts;
					questionResponse_arr[i].textInputQuestions[j].maxAttempts = _questionObj.maxAttempts;
					questionResponse_arr[i].textInputQuestions[j].dropDownEnabled = _questionObj.dropDownEnabled;
					questionResponse_arr[i].textInputQuestions[j].dropDownComplete = _questionObj.dropDownComplete;
					questionResponse_arr[i].textInputQuestions[j].dropDownAnswer = _questionObj.dropDownAnswer;
				}
			}

		}
	}
}

function markIncomplete(){
	for(var i = 0; i < questionResponse_arr.length; i++){
		if(currentPageID == questionResponse_arr[i].id){
			questionResponse_arr[i].complete = false;
			if(questionResponse_arr[i].hasOwnProperty("textInputQuestions")){
				questionResponse_arr[i].textInputQuestions = [];
				// for(var j = 0; j < questionResponse_arr[i].textInputQuestions.length; j++){
				// 	questionResponse_arr[i].textInputQuestions[j].userAnswer = '';
				// 	questionResponse_arr[i].textInputQuestions[j].correct = false;
				// 	questionResponse_arr[i].textInputQuestions[j].feedback = '';
				// 	questionResponse_arr[i].textInputQuestions[j].userAttempts = 0;
				// 	questionResponse_arr[i].textInputQuestions[j].dropDownComplete = false;
				// 	questionResponse_arr[i].textInputQuestions[j].dropDownAnswer = '';

				// }
			}
		}
	}
}

function addPathingTracking(_id){

	var paths_arr = [];
	var pathingPage = {
		id: _id,
		paths: paths_arr
	};

	if(pathingTrack_arr.length == 0){
		pathingTrack_arr.push(pathingPage);
	}
	else{
		var exists = false;
		for (var i = 0; i < pathingTrack_arr.length; i++) {
			if(pathingTrack_arr[i].id == _id){
				exists = true;
			}
		};
		if(!exists){
			pathingTrack_arr.push(pathingPage);
		}
	}
}

function updatePathingTracking(_id, _paths){
	for (var i = 0; i < pathingTrack_arr.length; i++) {
		if(pathingTrack_arr[i].id == _id){
			pathingTrack_arr[i].paths = _paths;
		}
	};
}

function checkPathComplete(_id, _path){
	var _paths_arr = [];
	for (var i = 0; i < pathingTrack_arr.length; i++) {
		if(pathingTrack_arr[i].id == _id){
			_paths_arr = pathingTrack_arr[i].paths;
		}
	};

	if(_paths_arr.length > 0){
		for (var j = 0; j < _paths_arr.length; j++) {
			if(_paths_arr[j].pathid == _path){
				return _paths_arr[j].completion;
			}
		};
	}
	else{
		return false;
	}

}

/////////////////////////////////////////////////////END SCORING FUNCTIONALITY

/****************************************************
********************************** STEP 4 - LOAD PAGE
*****************************************************
**Details:
***utilizes this. namespace so that it can be referenced from external template files.
***Was placed like that to enable page fade tranistions.
***utilizes currentPage variable, which is an int representing a node in content .xml*/
//Function to load page content
this.loadPage = function(){
	try { $(".ui-tooltip-content").parents('div').remove(); } catch (e) {console.log(e)}
	try { $(".ui-tooltip").tooltip("close"); } catch (e) {console.log(e)}
	if(isLinear == true){
		updateTracking();
	}

	if($(data).find("page").eq(currentPage).attr("mandatory") == "true" && mode != "edit"){
		if($(data).find("page").eq(currentPage).attr("graded") == "true"){
			assessment = true;
		}else{
			assessment = false;
		}
		mandatoryInteraction = true;
	}else{
		mandatoryInteraction = false;
		assessment = false;
	}

	if(mode == "edit" || mode == "review"){
		//clear the page comments from last page
		if(pageComments && pageComments.length > 0){
			pageComments.length = 0;
	    }
		//get the page comments
		if(!$(courseData).find("course").attr("redmine") || $(courseData).find("course").attr("redmine") == "false"){
			cognizenSocket.emit('getContentComments', {
				contentId: urlParams['id'],
				pageId: $(data).find("page").eq(currentPage).attr("id")
			});
		}
		else{
			updateRedmineCommentIcon();
		}
	}

	//currentBranch = 0;
	//Check if nave buttons should be disabled.
	checkNavButtons();
	updatePageCount();

	currentTemplateType = $(data).find("page").eq(currentPage).attr('layout');
	currentPageID = $(data).find("page").eq(currentPage).attr("id");
	if(isScorm){
		if(scorm.VERSION == "1.2"){
			scorm.set("cmi.core.lesson_location", currentPageID);
			scorm.set("cmi.core.exit", "suspend");
			scorm.save();
		}
		else if(scorm.VERSION.substring(0,4) == "2004"){
			scorm.set("cmi.location", currentPageID);
			scorm.set("cmi.exit", "suspend");
			scorm.save();
		}
	}

	if(mode == "edit"){
		//clear the page comments from last page
		if(currentTemplateType == "graphicOnly" || currentTemplateType == "top"
			|| currentTemplateType == "left" || currentTemplateType == "bottom"
			|| currentTemplateType == "right" || currentTemplateType == "multipleChoiceMedia"
			|| currentTemplateType == "tabsLeft"){

			$("#mediaDrop").css("visibility","hidden");

	    }
		else{

			// $("#mediaDrop").click(function(){
			// launchMediaDrop();
			// });
			$("#mediaDrop").css("visibility", "visible");

		}
	}

	switch (currentTemplateType) {
		//Satic Layouts
		case "group":
			currentTemplate = new C_StaticContent("textOnly");
			currentTemplate.initialize();
			break;
		case "completion":
			currentTemplate = new C_Completion(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "textOnly":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "graphicOnly":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "top":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "left":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "right":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "bottom":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "sidebar":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		//Interactive Layouts
		case "branching":
			currentTemplate = new C_Branching(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "pathing":
			currentTemplate = new C_Pathing(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "chaining":
			currentTemplate = new C_Chaining(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "clickImage":
			currentTemplate = new C_ClickImage(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "tabsOnly":
			currentTemplate = new C_TabbedContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "tabsLeft":
			currentTemplate = new C_TabbedContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "revealRight":
			currentTemplate = new C_Reveal(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "revealBottom":
			currentTemplate = new C_Reveal(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "revealTop":
			currentTemplate = new C_Reveal(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "revealLeft":
			currentTemplate = new C_Reveal(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "flashcard":
			currentTemplate = new C_Flashcard(currentTemplateType);
			currentTemplate.initialize();
			break;
		//Knowledge Check Layouts
		case "categories":
			currentTemplate = new C_Categories(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "questionBank":
			currentTemplate = new C_QuestionBank(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleChoice":
			currentTemplate = new C_MultipleChoice(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleChoiceFancy":
			currentTemplate = new C_MultipleChoiceFancy(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleSelect":
			currentTemplate = new C_MultipleChoice("multipleChoice");
			currentTemplate.initialize();
			break;
		case "multipleChoiceMedia":
			currentTemplate = new C_MultipleChoice(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleChoiceImageTop":
			currentTemplate = new C_MultipleChoiceImage(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleChoiceImageLeft":
			currentTemplate = new C_MultipleChoiceImage(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleChoiceImageRight":
			currentTemplate = new C_MultipleChoiceImage(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleSelectImageTop":
			currentTemplate = new C_MultipleChoiceImage(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "matching":
			currentTemplate = new C_Matching(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "matchingDrag":
			currentTemplate = new C_Matching(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "sequence":
			currentTemplate = new C_Sequencing(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "textInput":
			currentTemplate = new C_TextInput(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "essayCompare":
			currentTemplate = new C_EssayCompare(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "slider":
			currentTemplate = new C_Slider(currentTemplateType);
			currentTemplate.initialize();
			break;
		//UNITY SWF Layouts
		case "unity":
			currentTemplate = new C_Unity3D(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "unityOnly":
			currentTemplate = new C_Unity3D(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "clickListRevealText":
			currentTemplate = new C_ClickListRevealText(currentTemplateType);
			currentTemplate.initialize();
			break;
	}
}
