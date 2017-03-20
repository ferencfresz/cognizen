/*
 *  	C_Print
 *  	Requires jQuery v1.9 or later
 *
 *      Displays the lesson to be printed.
 *  	Version: 0.5
 *		Date Created: 07/11/16
 */
function C_Print(_myItem, _myParent) {

	////////////////////////////////////////////////   COURSE LEVEL VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	var myItem = _myItem;										//The Button that was clicked in the dashboard.
	var courseID = myItem.data('id');							//Course to check for modules
    var currentCourseType = myItem.data('type');				//Type to be passed to node server
    var currentCoursePermission = myItem.data('permission');	//Permission to be passed to node server

    var coursePath;												//Path to the course
    var courseData;												//Variable to hold and manipulate course.xml - the xml is imported and held in courseData object.
    var courseXMLPath;											//Path to the course.xml
    var refreshExpected = false;								//Toggle on refreshes coming in - true when needed.


    ////////////////////////////////////////////////   MODULE LEVEL VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    var totalPrintModules;									//Number of modules in course
    var loadedPrintModules;									//Variable to track how many module xml files have been loaded.

    $(document).ready(function(){
    	initPrint();
    });

    socket.on('receiveCoursePath', function (data){
		receiveCoursePath(data);
    });

    this.refreshPrintData = function(){
	   refreshPrintData();
    }

    function refreshPrintData(){
	    if(refreshExpected == true){
		   module_arr = [];
		   indexItem_arr = [];
		   loadedPrintModules = 0;
		   refreshExpected = false;

		   $.ajax({
			   type: "GET",
			   url: courseXMLPath,
			   dataType: "xml",
			   async: false,
			   success: importPrintItems,
			   error: function(){
				   alert("unable to load content data")
			   }
			});
		}
    }

	 /************************************************************************************
     initPrint()
     -- reach out to the node server and get the path to the course.
     ************************************************************************************/
     function initPrint(){
     	loadedPrintModules = 0;
     	var tmpCourseId = courseID;
     	if(currentCourseType === 'lesson'){
     		tmpCourseId = _myParent.id;
     	}
		socket.emit("getCoursePath", {
        	content: {
            	id: tmpCourseId,
                type: 'course',
                permission: currentCoursePermission
             }
		});
     }

     /************************************************************************************
     receiveCoursePath(data)
     -- recieve course path back from node in data object.
     -- use recieved path to load the course.xml file.
     ************************************************************************************/
     function receiveCoursePath(data){
	     coursePath = [window.location.protocol, '//', window.location.host, '/programs/', decodeURIComponent(data.path)].join('');
	     var xmlPath = coursePath + "/course.xml";
	     courseXMLPath = xmlPath;
	     $.ajax({
		    type: "GET",
		    url: xmlPath,
		    dataType: "xml",
		    async: false,
		    success: importPrintItems,
		    error: function(){
			    alert("unable to load content data")
		    }
		});
     }

     /************************************************************************************
     importPrintItems(_data);
     -- store the course.xml in courseData variable to read and manipulate as needed.
     -- call functionimport each of the module content.xml files.
     ************************************************************************************/
     function importPrintItems(_data){
	     courseData = _data;

	     //TODO: course level not yet implemented
		if(currentCourseType === 'course'){
		    totalPrintModules = $(courseData).find("item").length;

			if(totalPrintModules > 0){
				for(var y = 0; y < totalPrintModules; y++){
					 var moduleObj = new Object();

					 moduleObj.name = $(courseData).find("item").eq(y).attr("name");
					 moduleObj.id = $(courseData).find("item").eq(y).attr("id");
					 moduleObj.parent = courseID;
					 moduleObj.parentDir = coursePath;
					 moduleObj.path = coursePath + "/" +$(courseData).find("item").eq(y).attr("name");
					 moduleObj.xml = null;
					 moduleObj.xmlPath = ["/", encodeURIComponent($(courseData).find("item").eq(y).attr("name").trim()), "/xml/content.xml"].join("");
					 module_arr.push(moduleObj);

					 var currentXML = [coursePath, "/", encodeURIComponent($(courseData).find("item").eq(y).attr("name")), "/xml/content.xml"].join("");
					 importModuleXML(currentXML);
				}
			}
			else{
				buildPrintInterface();
			}

		}
		else{
			totalPrintModules = 1;
			 var moduleObj = new Object();

			 moduleObj.name = $(courseData).find("item[id='"+courseID+"']").attr("name");
			 moduleObj.id = $(courseData).find("item[id='"+courseID+"']").attr("id");
			 moduleObj.parent = _myParent.id;
			 moduleObj.parentDir = coursePath;
			 moduleObj.path = coursePath + "/" +$(courseData).find("item[id='"+courseID+"']").attr("name");
			 var pathSplit = moduleObj.path.split('/programs');
			 moduleObj.normPath = '../programs' + pathSplit[1];
			 moduleObj.xml = null;
			 moduleObj.xmlPath = ["/", encodeURIComponent($(courseData).find("item[id='"+courseID+"']").attr("name").trim()), "/xml/content.xml"].join("");
			 module_arr.push(moduleObj);

			 var currentXML = [coursePath, "/", encodeURIComponent($(courseData).find("item[id='"+courseID+"']").attr("name")), "/xml/content.xml"].join("");
			 importModuleXML(currentXML);			
		}
     }


     /************************************************************************************
     importModuleXML(_path)
     -- download content.xml for each module
	 -- call importOUtlineModuleComplete after each is pulled to see if all are pulled.
     ************************************************************************************/
     function importModuleXML(_path){
	     $.ajax({
		    type: "GET",
		    url: _path,
		    dataType: "xml",
		    async: false,
		    success: importPrintModuleItemComplete,
		    error: function(){
			    alert("unable to load module data for " + _path);
		    }
		});
     }


     /************************************************************************************
     importPrintModuleItemComplete(_data);
     -- attach module content.xml to appropriate module_arr item
	 -- Check if all are downloaded then move on.
     ************************************************************************************/
     function importPrintModuleItemComplete(_data){
	     for(var i = 0; i < module_arr.length; i++){
	     	//#4929 updated to compare ids instead of names
		     if($(_data).find("id").attr("value") == module_arr[i].id){
			     module_arr[i].xml = _data;
		     }
	     }
	     loadedPrintModules++;
	     if(loadedPrintModules === totalPrintModules){
		     buildPrintInterface(module_arr[0]);
	     }
     }


     /************************************************************************************
	 buildPrintInterface()
     -- build menuing system and add functionalities
     ************************************************************************************/
     function buildPrintInterface(_mod){
     	try {$("#dialog-print").dialog("close");} catch (e) {}

     	var thisID;
     	indexItem_arr = [];

     	var data = module_arr[0].xml;
     	//var totalPages = $(data).find('page[type="kc"]').length;
     	var totalPages = $(data).find('page').length;

	    // if(totalPages == 0){
	    // 	alert('No pages contain assessment based pages in this lesson.');
		   //  socket.removeAllListeners('receiveCoursePath');
     //        socket.emit("closeTool", {
     //        	id : courseID,
     //        	tool : 'print'
     //        });
     //        module_arr = [];
	    // }
//	    else{
	     	var lessonTitle = $(courseData).find('course').first().attr("name");
	     	if(currentCourseType === 'lesson'){
	     		lessonTitle = $(courseData).find("item[id='"+courseID+"']").attr("name");
	     	}

	     	msg = '<div id="dialog-print" title="Print Lesson (Beta) : '+ lessonTitle + ':">';
		    msg += '<div id="ptPane" class="pane">'
		    msg += '<div id="printPane" class="paneContent">';
		    msg += '<div id="lessonTitle" class="print">' + lessonTitle + '</div>';
			for(var i = 0; i < totalPages; i++){
//				totalPages = $(data).find('page').length;
				var myContent = $(data).find("page").eq(i).find("content").first().text();
		 		msg += '<div id="printPage"><div id="pageTitle" class="print" role="heading">' + $(data).find("page").eq(i).find('title').first().text() + '</div>';
		 		var layout = $(data).find("page").eq(i).attr('layout');
		 		if($(data).find("page").eq(i).attr('type') === 'kc'){
					var attempts = $(data).find("page").eq(i).attr('attempts');
					if(typeof attempts === typeof undefined){ attempts = 'N/A'}
			 		var graded = $(data).find("page").eq(i).attr('graded') !== "true" ? 'Not Graded' : 'Graded';
			 		var mandatory = $(data).find("page").eq(i).attr('mandatory') !== "true" ? 'Not Mandatory' : 'Mandatory';
			 		var randomize = $(data).find("page").eq(i).attr('randomize') !== "true" ? 'Not Randomized' : 'Randomized';
			 		msg += layout + " : Num Attempts - " + attempts + " : " + graded + " : " + mandatory + ' : Answers are ' + randomize +'<br/>'; 
			 	}

		 		console.log(layout);
		 		switch(layout){
		 			case 'multipleChoice':
		 			case 'multipleChoiceMedia':
		 				msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
		 				var optionCount = $(data).find("page").eq(i).find("option").length;
						for(var j = 0; j < optionCount; j++){
							var answerText = $(data).find("page").eq(i).find("option").eq(j).find("content").text();
							if(answerText.indexOf("src=") != -1){
								var mediaPathRes = "programs/"+currentProject+"/"+$(courseData).find('course').first().attr("name")+"/"+lessonTitle+"/media/";
								msg += answerText.replace("media/",	mediaPathRes);
							}
							else{
								msg += answerText;
							}
							var icon = $(data).find("page").eq(i).find("option").eq(j).attr('correct') !== "true" ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
							msg += icon + '<br/>';
						}		 				
		 				break;
		 			case "multipleChoiceFancy":	
			 			msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';	
			 			break;		 				
		 			case 'matching':
		 				msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
		 				var optionCount = $(data).find("page").eq(i).find("option").length;
						for(var j = 0; j < optionCount; j++){	
							msg += $(data).find("page").eq(i).find("option").eq(j).text();
							var optionCorrect =  $(data).find("page").eq(i).find("option").eq(j).attr('correct');
							var answerText = $(data).find("page").eq(i).find("answer[correct="+optionCorrect+"]").find("content").text();
							if(answerText.indexOf("src=") != -1){
								var mediaPathRes = "programs/"+currentProject+"/"+$(courseData).find('course').first().attr("name")+"/"+lessonTitle+"/media/";
								msg += ' = ' + answerText.replace("media/",	mediaPathRes);
							}
							else{
								msg += ' = ' + answerText;
							}
							msg += '<br/>';
						}	 				
		 				break;
		 			case 'matchingDrag':
		 				msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
		 				var optionCount = $(data).find("page").eq(i).find("option").length;
						for(var j = 0; j < optionCount; j++){	
							msg += $(data).find("page").eq(i).find("option").eq(j).text();
							var optionCorrect =  $(data).find("page").eq(i).find("option").eq(j).attr('correct');
							msg += ' = ' + $(data).find("page").eq(i).find("answer[correct="+optionCorrect+"]").attr('img');
							msg += '<br/>';
						}			 			
		 				break;
		 			case 'questionBank':
						var showall = $(data).find("page").eq(i).attr('showall') !== "true" ? 'showall off' : 'showall on';
						var numToComplete = $(data).find("page").eq(i).attr('tocomplete');
						var bankCount = $(data).find("page").eq(i).find("bankitem").length;
						msg += showall + ' : Num of questions is ' + bankCount + ' : Number of questions to complete is ' + numToComplete; 

						for (var j = 0; j < bankCount; j++) {
							msg += '<hr style="border-top: dotted 2px;" />';
							var bankAttempt =  $(data).find("page").eq(i).find("bankitem").eq(j).attr("attempts");
							var bankRandomize = $(data).find("page").eq(i).find("bankitem").eq(j).attr("randomize") !== 'true' ? 'Not Randomized' : 'Randomized';
							msg += 'Num Attempts - ' + bankAttempt + ' : Answers are ' +  bankRandomize + '<br/>';
							var qNum = j+1;
							msg += '<br/>' + qNum + '. ' + $(data).find("page").eq(i).find("bankitem").eq(j).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
			 				var bankOptionCount = $(data).find("page").eq(i).find("bankitem").eq(j).find("option").length;
							for(var k = 0; k < bankOptionCount; k++){
								var answerText = $(data).find("page").eq(i).find("bankitem").eq(j).find("option").eq(k).find("content").text();
								if(answerText.indexOf("src=") != -1){
									var mediaPathRes = "programs/"+currentProject+"/"+$(courseData).find('course').first().attr("name")+"/"+lessonTitle+"/media/";
									msg += answerText.replace("media/",	mediaPathRes);
								}
								else{
									msg += answerText;
								}									
								var icon = $(data).find("page").eq(i).find("bankitem").eq(j).find("option").eq(k).attr('correct') !== "true" ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
								msg += icon + '<br/>';
							}								
						}
		 				break;	
	 				case 'sequence':
		 				var optionCount = $(data).find("page").eq(i).find("option").length;
						for(var j = 0; j < optionCount; j++){	
							var optionOrder = j+1;
							optionOrder = optionOrder.toString();
							msg += $(data).find("page").eq(i).find("option[correct="+optionOrder+"]").find("content").text();
							msg += '<br/>';
						}		 					
	 					break;
	 				case 'textInput':
	 					var questionCount = $(data).find("page").eq(i).find("question").length;
	 					for (var j = 0; j < questionCount; j++) {
	 						msg += '<hr style="border-top: dotted 2px;" />';
	 						msg += 'Num Attempts - ' + $(data).find("page").eq(i).find("question").eq(j).attr('attempts') + '<br/>';
	 						msg += '<br/>' + $(data).find("page").eq(i).find("question").eq(j).find('content').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
	 						var acceptedResponseCount = $(data).find("page").eq(i).find("question").eq(j).find("acceptedresponse").length;
	 						msg += 'Accepted Responses : <br/>';
	 						for (var k = 0; k < acceptedResponseCount; k++) {
	 							msg += $(data).find("page").eq(i).find("question").eq(j).find('acceptedresponse').eq(k).text() + '<br/>';
	 						}
	 					}
	 					break;	
 					case 'slider':
 						msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
 						msg += $(data).find("page").eq(i).find('slider').first().find('content').text()+ '<br/>';
 						msg += $(data).find("page").eq(i).find('slider').attr('correctanswer');
 						break;
 					case "essayCompare":	
 						msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
 						msg += '<h3>Expert Response</h3>';
 						msg += $(data).find("page").eq(i).find('correctresponse').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
 						break	 						
 					case "textOnly":	
 						msg += '<br/>' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
 						break;	
 					case "completion":
 					case "graphicOnly":
 					case "bottom":
 					    msg += '<div id="graphicHolder" class="antiscroll-wrap"><div class="box"><div id="mediaHolder" class="antiscroll-inner"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(i).attr('alt') + '"></div></div></div></div>';
 						var mediaLink = $(data).find("page").eq(i).attr('img');	 	
 						var myImage = coursePath + "/" + lessonTitle + "/media/" + mediaLink;
				        var parts = myImage.split('.'), i, l;
				        var last = parts.length; 
				        var mediaType = (parts[last - 1]);	
				        if(mediaType != 'swf' && mediaType != 'html' && mediaType != 'htm' && mediaType != 'mp4' && mediaType != 'youtube'){
				        	msg += '<img class="print" alt="" src="'+myImage+'" >';
				        	msg += '<br/><div id="caption" class="print"> ' + $(data).find("page").eq(i).find('caption').first().text() + '</div><br/>';
						    if($(data).find("page").eq(i).attr('popup') != "" && $(data).find("page").eq(i).attr('popup') != undefined){
						        var media_arr = $(data).find("page").eq(i).attr('popup').split(",");
						        var caption_arr = $(data).find("page").eq(i).attr('popcaps').split("!!!");
								var alt_arr = $(data).find("page").eq(i).attr('popalt').split("!!!");
								for (var j = 0; j < media_arr.length; j++) {								
									msg += '<img class="print" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +media_arr[j]+'" >';
									msg += '<br/><div id="caption" class="print"> ' + caption_arr[j] + '</div><br/>';
								}
						    }				        	        	
				        }	
				        msg += '<br/>' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/") + '<br/>';				
 						break;	
 					case "top":	
 						msg += '<br/>' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/") + '<br/>';
 					    msg += '<div id="graphicHolder" class="antiscroll-wrap"><div class="box"><div id="mediaHolder" class="antiscroll-inner"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(i).attr('alt') + '"></div></div></div></div>';
 						var mediaLink = $(data).find("page").eq(i).attr('img');	 	
 						var myImage = coursePath + "/" + lessonTitle + "/media/" + mediaLink;
				        var parts = myImage.split('.'), i, l;
				        var last = parts.length; 
				        var mediaType = (parts[last - 1]);	
				        if(mediaType != 'swf' && mediaType != 'html' && mediaType != 'htm' && mediaType != 'mp4' && mediaType != 'youtube'){
				        	msg += '<img class="print" alt="" src="'+myImage+'" >';
				        	msg += '<br/><div id="caption" class="print"> ' + $(data).find("page").eq(i).find('caption').first().text() + '</div><br/>';
						    if($(data).find("page").eq(i).attr('popup') != "" && $(data).find("page").eq(i).attr('popup') != undefined){
						        var media_arr = $(data).find("page").eq(i).attr('popup').split(",");
						        var caption_arr = $(data).find("page").eq(i).attr('popcaps').split("!!!");
								var alt_arr = $(data).find("page").eq(i).attr('popalt').split("!!!");
								for (var j = 0; j < media_arr.length; j++) {								
									msg += '<img class="print" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +media_arr[j]+'" >';
									msg += '<br/><div id="caption" class="print"> ' + caption_arr[j] + '</div><br/>';
								}
						    }				        	        	
				        }					        				
 						break;	
 					case "left":
 						msg += '<br/><div class="contentHolder print">';
 						msg += '<div class="contentLeft print" >' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/") + '</div>' ;
 						//msg += displayMedia(lessonTitle, i);
 						var mediaLink = $(data).find("page").eq(i).attr('img');	 	
 						var myImage = coursePath + "/" + lessonTitle + "/media/" + mediaLink;
				        var parts = myImage.split('.'), i, l;
				        var last = parts.length; 
				        var mediaType = (parts[last - 1]);	
				        if(mediaType != 'swf' && mediaType != 'html' && mediaType != 'htm' && mediaType != 'mp4' && mediaType != 'youtube'){
				        	msg += '<div class="mediaHolder print">';
				        	msg += '<img class="print part"  alt="" src="'+myImage+'" >';
				        	msg += '<br/><div id="caption" class="print"> ' + $(data).find("page").eq(i).find('caption').first().text() + '</div><br/>';
						    if($(data).find("page").eq(i).attr('popup') != "" && $(data).find("page").eq(i).attr('popup') != undefined){
						        var media_arr = $(data).find("page").eq(i).attr('popup').split(",");
						        var caption_arr = $(data).find("page").eq(i).attr('popcaps').split("!!!");
								var alt_arr = $(data).find("page").eq(i).attr('popalt').split("!!!");
								for (var j = 0; j < media_arr.length; j++) {								
									msg += '<img class="print part" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +media_arr[j]+'" >';
									msg += '<br/><div id="caption" class="print"> ' + caption_arr[j] + '</div><br/>';
								}
						    }
						    msg += '</div>';				        	        	
				        }	
				        msg += '</div>';				        				
 						break;	
 					case "right":
 						msg += '<br/><div class="contentHolder print">';
 						//msg += displayMedia(lessonTitle, i);
 						var mediaLink = $(data).find("page").eq(i).attr('img');	 	
 						var myImage = coursePath + "/" + lessonTitle + "/media/" + mediaLink;
				        var parts = myImage.split('.'), i, l;
				        var last = parts.length; 
				        var mediaType = (parts[last - 1]);	
				        if(mediaType != 'swf' && mediaType != 'html' && mediaType != 'htm' && mediaType != 'mp4' && mediaType != 'youtube'){
				        	msg += '<div class="mediaHolder print">';
				        	msg += '<img class="print part"  alt="" src="'+myImage+'" >';
				        	msg += '<br/><div id="caption" class="print"> ' + $(data).find("page").eq(i).find('caption').first().text() + '</div><br/>';
						    if($(data).find("page").eq(i).attr('popup') != "" && $(data).find("page").eq(i).attr('popup') != undefined){
						        var media_arr = $(data).find("page").eq(i).attr('popup').split(",");
						        var caption_arr = $(data).find("page").eq(i).attr('popcaps').split("!!!");
								var alt_arr = $(data).find("page").eq(i).attr('popalt').split("!!!");
								for (var j = 0; j < media_arr.length; j++) {								
									msg += '<img class="print part" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +media_arr[j]+'" >';
									msg += '<br/><div id="caption" class="print"> ' + caption_arr[j] + '</div><br/>';
								}
						    }
						    msg += '</div>';				        	        	
				        }	
 						msg += '<div class="contentRight print" >' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/") + '</div>' ;				        
				        msg += '</div>';	 
				        break;					
 					case "sidebar":	
 						msg += '<br/><div class="contentHolder print">';
 						msg += '<br/>' + '<div class="contentLeft print" >' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/") + '</div>';
 						msg += '<div id="sidebarHolder"><div id="sidebar" class="sidebar">'+$(data).find("page").eq(i).find("sidebar").first().text()+'</div></div></div>';
 						break;
 					case "clickImage":	
 					case "revealRight":
 						msg += '<br/>' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
 						var revealCount = $(data).find("page").eq(i).find("reveal").length;
 						var mediaWidth = $(data).find("page").eq(i).attr('w');
						var mediaHeight = $(data).find("page").eq(i).attr('h');
						var labeled = false;
						if($(data).find("page").eq(i).attr('labeled') == "true"){
							labeled = true;
						}
 						for(var j = 0; j < revealCount; j++){
							var currentImg = $(data).find("page").eq(i).find("reveal").eq(j).attr("img");
							var tmpContent = $(data).find("page").eq(i).find("reveal").eq(j).find("content").text();
							var tmpCaption = $(data).find("page").eq(i).find("reveal").eq(j).find("caption").text(); 	
							msg += "<img src='"+coursePath + "/" + lessonTitle + "/media/"+currentImg+"' width='"+ mediaWidth +"' height='"+ mediaHeight +"'/>";	
							if(labeled){
								msg += "<div id='mediaLabel' class='mediaLabel'>"+$(data).find("page").eq(i).find("reveal").eq(j).attr("label")+"</div>";
							}
							msg += 	tmpContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
							msg += '<br/>';										
 						}
 						break;
 					case "tabsOnly":
 						msg += '<br/>' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
 						var tabCount = $(data).find("page").eq(i).find("tab").length;
 						for(var j = 0; j < tabCount; j++){
							var currentTitle = $(data).find("page").eq(i).find("tab").eq(j).attr("title");
							msg += '<h3>' + currentTitle + '</h3>';
							var tmpContent = $(data).find("page").eq(i).find("tab").eq(j).text();
							msg += 	tmpContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
							msg += '<br/>';										
 						}
 						break;		
 					case "tabsLeft":
 						msg += '<br/>' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
 						msg += '<div class="contentLeft print" >';
 						var tabCount = $(data).find("page").eq(i).find("tab").length;
 						for(var j = 0; j < tabCount; j++){
							var currentTitle = $(data).find("page").eq(i).find("tab").eq(j).attr("title");
							msg += '<h3>' + currentTitle + '</h3>';
							var tmpContent = $(data).find("page").eq(i).find("tab").eq(j).text();
							msg += 	tmpContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
							msg += '<br/>';										
 						}
 						msg += '</div>';//contentLeft print
 						//msg += displayMedia(lessonTitle, i);
 						var mediaLink = $(data).find("page").eq(i).attr('img');	 	
 						var myImage = coursePath + "/" + lessonTitle + "/media/" + mediaLink;
				        var parts = myImage.split('.'), i, l;
				        var last = parts.length; 
				        var mediaType = (parts[last - 1]);	
				        if(mediaType != 'swf' && mediaType != 'html' && mediaType != 'htm' && mediaType != 'mp4' && mediaType != 'youtube'){
				        	msg += '<div class="mediaHolder print">';
				        	msg += '<img class="print part"  alt="" src="'+myImage+'" >';
				        	msg += '<br/><div id="caption" class="print"> ' + $(data).find("page").eq(i).find('caption').first().text() + '</div><br/>';
						    if($(data).find("page").eq(i).attr('popup') != "" && $(data).find("page").eq(i).attr('popup') != undefined){
						        var media_arr = $(data).find("page").eq(i).attr('popup').split(",");
						        var caption_arr = $(data).find("page").eq(i).attr('popcaps').split("!!!");
								var alt_arr = $(data).find("page").eq(i).attr('popalt').split("!!!");
								for (var j = 0; j < media_arr.length; j++) {								
									msg += '<img class="print part" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +media_arr[j]+'" >';
									msg += '<br/><div id="caption" class="print"> ' + caption_arr[j] + '</div><br/>';
								}
						    }
						    msg += '</div>';				        	        	
				        } 						
 						break;	 
 					case "clickListRevealText":	
 						msg += '<br/>' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
 						var revealCount = $(data).find("page").eq(i).find("reveal").length;
 						for(var j = 0; j < revealCount; j++){
							var tmpContent = $(data).find("page").eq(i).find("reveal").eq(j).find("content").text();
							var tmpTitle = $(data).find("page").eq(i).find("reveal").eq(j).find("title").text(); 
							msg += '<h3>' + tmpTitle + '</h3>';	
							msg += 	tmpContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
							msg += '<br/>';										
 						}
 						break;
 					case "flashcard":
 						msg += '<br/>' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
 						var cardCount = $(data).find("page").eq(i).find("card").length;
 						for(var j = 0; j < cardCount; j++){
							var tmpTerm = $(data).find("page").eq(i).find("card").eq(j).find("term").text();
							var tmpDefinition = $(data).find("page").eq(i).find("card").eq(j).find("definition").text(); 
							msg += '<h3>' + tmpTerm + '</h3>';	
							msg += 	tmpDefinition.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
							msg += '<br/>';										
 						}
 						break; 						 																
 					case "branching":
 						msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
 						break;	
 					case "pathing":	 
 						msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
 						break;	
 					case "chaining":
 						msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
 						break;		 					 						 						 						 								 							 							 						 							 													 					
		 		}

			 	msg += '<br clear="all"/><hr/>';
				msg += '<div class="page-break"></div>';
				msg += '</div>';//printPage div


			}
		    msg += '</div>';//close the printKeyPane

		    msg += '</div>';//close the mv pane
		    msg += '</div>';//close the dialog
	        //ADD menu to stage
	        $("#stage").append(msg);


	        $("#dialog-print").dialog({
	            modal: true,
	            width: 1075,
	            height: 768,
	            resizable: false,
	            close: function (event, ui) {
	                socket.removeAllListeners('receiveCoursePath');
	                socket.emit("closeTool", {
	                	id : courseID,
	                	tool : 'print'
	                });
	                module_arr = [];
	                $(this).dialog('destroy').remove();
	            },
	            open: function (event, ui) {

	            },
	            buttons: [
					{
						text: "Print",
						title: "Prints the lesson .",
						click: function(){
							$('#printPane').printThis({
								//pageTitle:lessonTitle,
								importStyle: true,
								loadCSS: 'css/C_Print.css'
							});
						}
					}
				]
	        });			
//		}

		try{$("#preloadholder").remove();} catch(e){};

     }

  //    function displayMedia(_lessonTitle, i){
  //    	var msg = '';
		// var mediaLink = $(data).find("page").eq(i).attr('img');	 	
		// var myImage = coursePath + "/" + _lessonTitle + "/media/" + mediaLink;
	 //    var parts = myImage.split('.'), i, l;
	 //    var last = parts.length; 
	 //    var mediaType = (parts[last - 1]);	
	 //    if(mediaType != 'swf' && mediaType != 'html' && mediaType != 'htm' && mediaType != 'mp4' && mediaType != 'youtube'){
	 //    	msg += '<div class="mediaHolder print">';
	 //    	msg += '<img class="print part"  alt="" src="'+myImage+'" >';
	 //    	msg += '<br/><div id="caption" class="print"> ' + $(data).find("page").eq(i).find('caption').first().text() + '</div><br/>';
		//     if($(data).find("page").eq(i).attr('popup') != "" && $(data).find("page").eq(i).attr('popup') != undefined){
		//         var media_arr = $(data).find("page").eq(i).attr('popup').split(",");
		//         var caption_arr = $(data).find("page").eq(i).attr('popcaps').split("!!!");
		// 		var alt_arr = $(data).find("page").eq(i).attr('popalt').split("!!!");
		// 		for (var j = 0; j < media_arr.length; j++) {								
		// 			msg += '<img class="print part" alt="" src="'+coursePath + "/" + _lessonTitle + "/media/" +media_arr[j]+'" >';
		// 			msg += '<br/><div id="caption" class="print"> ' + caption_arr[j] + '</div><br/>';
		// 		}
		//     }
		//     msg += '</div>';				        	        	
	 //    } 	   
	 //    return msg;  	
  //    }

    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
    function destroy(){
	     try { $("#dialog-print").remove(); } catch (e) {}

    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}