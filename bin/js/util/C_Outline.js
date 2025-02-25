/*
 *  	C_Outline
 *  	Requires jQuery v1.9 or later
 *
 *      Houses functionality to create course structure and sequencing
 *
 *      ©Concurrent Technologies Corporation 2018
 */
function C_Outline(_myItem) {

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
    var totalOutlineModules;									//Number of modules in course
    var loadedOutlineModules;									//Variable to track how many module xml files have been loaded.


    ////////////////////////////////////////////////   PAGE LEVEL VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

    ////////////////////////////////////////////////   MENU ITEMS VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    var currentPageParentModule;
    var currentPage;
    var currentPageFamily;
    var currentMenuItem;
    var indexItem_arr;											//Array of moduleIndexItem_arr arrays which hold each button

	////////////////////////////////////////////////   MOVING MENU ITEMS VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    var startList;
    var hoverSubNav = false;
    var startListJSON;
    var currentDragID;
    var currentDragItem;

	var pageType_arr = ["textOnly", "mediaOnly", "textAboveMedia", "textLeftofMedia", "textRightofMedia", "textBelowMedia", "sidebar", "clickImageFullText",
	 "textAboveTabs", "tabsLeftMediaRight", "clickImageRevealText", "flashcard", "dragOrdering", "multipleChoice", "multipleChoiceMedia", "matching",
	 "questionBank", "completion", "branchingDecisions", "branchingLinearPaths", "branchingPractice", "inputAnswer", "inputExpertCompare",
	 "clickListFullText", "dragSlider", "multipleChoiceFancy"];

	var templateNameMap = {};	
	//#3600 Updated template names
	//format templateNameMap[Name User Sees] = Name of template file
	templateNameMap[pageType_arr[0]] = 'textOnly';
	templateNameMap[pageType_arr[1]] = 'graphicOnly';
	templateNameMap[pageType_arr[2]] = 'top';
	templateNameMap[pageType_arr[3]] = 'left';
	templateNameMap[pageType_arr[4]] = 'right';
	templateNameMap[pageType_arr[5]] = 'bottom';
	templateNameMap[pageType_arr[6]] = 'sidebar';
	templateNameMap[pageType_arr[7]] = 'clickImage';
	templateNameMap[pageType_arr[8]] = 'tabsOnly';
	templateNameMap[pageType_arr[9]] = 'tabsLeft';
	templateNameMap[pageType_arr[10]] = 'revealRight';
	templateNameMap[pageType_arr[11]] = 'flashcard';
	templateNameMap[pageType_arr[12]] = 'sequence';
	templateNameMap[pageType_arr[13]] = 'multipleChoice';
	templateNameMap[pageType_arr[14]] = 'multipleChoiceMedia';
	templateNameMap[pageType_arr[15]] = 'matching';
	templateNameMap[pageType_arr[16]] = 'questionBank';
	templateNameMap[pageType_arr[17]] = 'completion';
	templateNameMap[pageType_arr[18]] = 'branching';
	templateNameMap[pageType_arr[19]] = 'pathing';
	templateNameMap[pageType_arr[20]] = 'chaining';
	templateNameMap[pageType_arr[21]] = 'textInput';
	templateNameMap[pageType_arr[22]] = 'essayCompare';
	templateNameMap[pageType_arr[23]] = 'clickListRevealText';
	templateNameMap[pageType_arr[24]] = 'slider';	
	templateNameMap[pageType_arr[25]] = 'multipleChoiceFancy';

    var pageTypeExamples = [
		{
			"type" : "textOnly",
			"images" : ["ex_textOnly.png"]
		},
		{
			"type" : "mediaOnly",
			"images" : ["ex_graphicOnly.png"]
		},
		{
			"type" : "textAboveMedia",
			"images" : ["ex_TextTop.png"]
		},
		{
			"type" : "textLeftofMedia",
			"images" : ["ex_TextLeft.png"]
		},
		{
			"type" : "textRightofMedia",
			"images" : ["ex_TextRight.png"]
		},
		{
			"type" : "textBelowMedia",
			"images" : ["ex_TextBottom.png"]
		},
		{
			"type" : "sidebar",
			"images" : ["ex_sidebar.png"]
		},
		{
			"type" : "clickImageFullText",
			"images" : ["ex_clickImage.png"]
		},
		{
			"type" : "textAboveTabs",
			"images" : ["ex_Tabs.png"]
		},
		{
			"type" : "tabsLeftMediaRight",
			"images" : ["ex_tabsLeft.png"]
		},
		{
			"type" : "clickImageRevealText",
			"images" : ["ex_revealRight.png"]
		},
		{
			"type" : "flashcard",
			"images" : ["ex_FlashCards.png"]
		},
		{
			"type" : "dragOrdering",
			"images" : ["ex_sequence.png"]
		},
		{
			"type" : "multipleChoice",
			"images" : ["ex_multipleChoice.png"]
		},
		{
			"type" : "multipleChoiceMedia",
			"images" : ["ex_MultipleChoiceMedia.png"]
		},
		{
			"type" : "matching",
			"images" : ["ex_MatchingMedia1.png"]
		},
		{
			"type" : "questionBank",
			"images" : ["ex_questionBank.png"]
		},
		{
			"type" : "completion",
			"images" : ["ex_completion.png", "ex_Completion1.png"]
		},
		{
			"type" : "inputAnswer",
			"images" : ["ex_textInput.png"]
		},
		{
			"type" : "inputExpertCompare",
			"images" : ["ex_EssayCompare_Answers.png"]
		},
		{
			"type" : "clickListFullText",
			"images" : ["ex_clickListRevealText.png"]
		},
		{
			"type" : "branchingDecisions",
			"images" : ["Ex_Branching1x.png", "Ex_Branching2x.png", "Ex_Branching3x.png", "Ex_Branching4x.png"]
		},
		{
			"type" : "dragSlider",
			"images" : ["ex_Slider.png"]
		},
		{
			"type" : "branchingPractice",
			"images" : ["ex_Chaining1x.png", "ex_Chaining2x.png", "ex_Chaining3.png", "ex_Chaining4.png", "ex_Chaining5.png"]
		},
		{
			"type" : "branchingLinearPaths",
			"images" : ["ex_Pathing1.png", "ex_Pathing2.png", "ex_Pathing3.png","ex_Pathing4.png", "ex_Pathing5.png", "ex_Pathing6.png"]
		},
		{
			"type" : "multipleChoiceFancy",
			"images" : ["ex_multipleChoiceFancy.png"]
		}		

	];


    $(document).ready(function(){
    	initOutline();
    });

    socket.on('receiveCoursePath', function (data){
		receiveCoursePath(data);
    });

    this.refreshOutlineData = function(){
	   refreshOutlineData();
    }

    function refreshOutlineData(){
	    if(refreshExpected == true){
		   module_arr = [];
		   indexItem_arr = [];
		   loadedOutlineModules = 0;
		   refreshExpected = false;

		   $.ajax({
			   type: "GET",
			   url: courseXMLPath,
			   dataType: "xml",
			   async: false,
			   success: importOutlineItems,
			   error: function(){
				   alert("unable to load content data")
			   }
			});
		}
    }

	 /************************************************************************************
     initOutline()
     -- reach out to the node server and get the path to the course.
     ************************************************************************************/
     function initOutline(){
     	module_arr = [];
		indexItem_arr = [];
     	loadedOutlineModules = 0;
		socket.emit("getCoursePath", {
        	content: {
            	id: courseID,
                type: currentCourseType,
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
	     coursePath = [window.location.protocol, '//', window.location.host, '/programs/', decodeURIComponent(data.path)].join('').replace(/\\/g, "/");
	     var xmlPath = coursePath + "/course.xml";
	     courseXMLPath = xmlPath;
	     $.ajax({
		    type: "GET",
		    url: xmlPath,
		    dataType: "xml",
		    async: false,
		    success: importOutlineItems,
		    error: function(){
			    alert("unable to load content data")
		    }
		});
     }

     /************************************************************************************
     importModuleItems(_data);
     -- store the course.xml in courseData variable to read and manipulate as needed.
     -- call functionimport each of the module content.xml files.
     ************************************************************************************/
     function importOutlineItems(_data){
	     courseData = _data;
	     totalOutlineModules = $(courseData).find("item").length;

	     if(totalOutlineModules > 0){
	     	for(var y = 0; y < totalOutlineModules; y++){
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
		 }else{
			 buildOutlineInterface();
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
		    success: importOutlineModuleItemComplete,
		    error: function(){
			    alert("unable to load module data for " + _path);
		    }
		});
     }


     /************************************************************************************
     importOutlineModuleItemComplete(_data);
     -- attach module content.xml to appropriate module_arr item
	 -- Check if all are downloaded then move on.
     ************************************************************************************/
     function importOutlineModuleItemComplete(_data){
	     for(var i = 0; i < module_arr.length; i++){
	     	//#4929 updated to compare ids instead of names
		     if($(_data).find("id").attr("value") == module_arr[i].id){
			     module_arr[i].xml = _data;
		     }
	     }
	     loadedOutlineModules++;
	     if(loadedOutlineModules === totalOutlineModules){
		     buildOutlineInterface();
	     }
     }


     /************************************************************************************
	 buildOutlineInterface()
     -- build menuing system and add functionalities
     ************************************************************************************/
     function buildOutlineInterface(){
     	try {$("#dialog-outline").dialog("close");} catch (e) {}

     	var thisID;
     	indexItem_arr = [];

     	msg = '<div id="dialog-outline" title="Outline '+ $(courseData).find('course').first().attr("name") + ':">';
	    msg += '<div id="outlinePane" class="pane">'
	    msg += '<div id="outlineIndexPane" class="paneContent">';
	    msg += '<div class="dd" id="C_Index">';
	    msg += '<ol class="dd-list">';
	    //COURSE LEVEL
	    msg += '<li id="courseIndex" class="dd-item dd3-item outlineCourseItem" data-id="course">';
		//msg += '<div class="dd-handle dd3-handle">Drag</div>';
		msg += '<div id="courseIndexHotspot" class="dd3-content" data-id="'+ courseID+'">'+ $(courseData).find('course').first().attr("name") +'</div>';
		msg += '<ol class="dd-list">';

	    //ADD MODULE and PAGES LEVEL  ----- Calls a separate function for cleanliness
	    for(var i = 0; i < module_arr.length; i++){
	     	msg += buildOutlineModule(i);
     	}

     	msg += '</ol></li></ol>';
     	msg += '</div>';
	    msg += '</div>';//close the outline index
	    msg += '<div id = "outlinePagePrefPane"></div>';
	    msg += '</div>';//close the outline pane
	    msg += '</div>';//close the dialog
        //ADD menu to stage
        $("#stage").append(msg);


        //Apply nestable capabilities
        $('#C_Index').nestable({maxDepth: 4})
        	.on('change', function(e, _item){
				console.log("onChange");
			})
			.on('start', function(e, _item){
				currentDragID = _item.attr('data-id');
			})
			.on('stop', function(e, _item){
				updateOrder();
			})
     	msg = '<div id="dialog-outline" title="Outline '+ myItem.find("span").first().text() + ':">';
        $("#dialog-outline").dialog({
            modal: true,
            width: 1024,
            height: 798,
            resizable: false,
            close: function (event, ui) {
                socket.removeAllListeners('receiveCoursePath');
                socket.emit("closeTool", {
                	id : courseID,
                	tool : 'outline'
                });
                $(this).dialog('destroy').remove();
            },
            open: function (event, ui) {

            }
        });

        //OPEN WITH ALL MENU ITEMS COLLAPSED
        //$('#C_Index').nestable('collapseAll');
        
        $(window).mousemove(function (e) {
		    var x = $(window).innerHeight() - 50,
		        y = $(window).scrollTop() + 50;
		    try{if ($('.dd-dragel').offset().top > x) {
			        //Down
			        $('#outlineIndexPane').animate({
			            scrollTop: $('#outlineIndexPane').height() // adjust number of px to scroll down
			        }, 600);
			    }
			}catch(e){}
		    try{if ($('.dd-dragel').offset().top < y) {
			        //Up
			        $('#outlineIndexPane').animate({
			            scrollTop: 0
			        }, 600);
			    } else {
			        $('#outlineIndexPane').animate({
			
			        });
			    }
			}catch(e){}
		});

        //CREATE A SNAPSHOT OF THE MENU TO COMPARE AGAINST
        var tmpStart = $('#C_Index').data('output', $('#nestable-output'));
		var tmpStartList   = tmpStart.length ? tmpStart : $(tmpStart.target);
		startList = tmpStartList.nestable('serialize');
        startListJSON = window.JSON.stringify(startList);

        //Add button listeners
        //COURSE BUTTON LISTENER
        $("#courseIndexHotspot").click(function(){
	        if(hoverSubNav == false){
		        try { currentMenuItem.addClass("dd3-visited"); } catch (e) {}
		        currentMenuItem = $(this);
				currentMenuItem.addClass("dd3-selected");
				displayCourseData($(this).attr("data-id"));
	        }
        }).hover(
	    	function () {
	    		$(this).append("<div id='outlineAdd' class='outlineModuleAdd'></div>");

	            //ADD apropriate title attributes for the toolitp hints on rollovers...
	            $("#outlineAdd").attr("title", "Add a new module to your course.");

	            //ADD ADD NAV
	            $("#outlineAdd").click(function(){
	            	addModuleToCourse(myItem.attr("data-id"));
		        }).hover(
	            	function () {
	                	hoverSubNav = true;
	                },
					function () {
	                	hoverSubNav = false;
	                }
	            ).tooltip({
	            	show: {
	                	delay: 1500,
	                    effect: "fadeIn",
	                    duration: 200
	                }
	            });
	        },
	        function () {
				$("#outlineAdd").remove();
			}
		);

        //START WITH COURSE SELECTED
        $("#courseIndexHotspot").click();

        //MODULE BUTTON LISTENERS
        addModuleClicks();

		//Pages
		addPageClicks();

		try{$("#preloadholder").remove();} catch(e){};
     }

     /*****************************************************************
     buildOutlineModule - builds the index for the module.
     Retruns a string representing the module and it's pages.
     Called for each module in buildOutlineInterface()
     *****************************************************************/
     function buildOutlineModule(_id){
	     var data = module_arr[_id].xml;
	     var thisID;
		 var moduleIndexItem_arr = [];
		 var totalPages = $(data).find('page').length;
		 var indexString = '<li id="'+module_arr[_id].id+'" class="dd-item dd3-item outlineModuleItem" data-id="'+ module_arr[_id].id +'">';
		 indexString += '<div class="dd-handle dd3-handle">Drag</div>';
		 indexString += '<div id="module'+ _id + 'IndexHotspot" class="dd3-content" data-id="'+ module_arr[_id].id +'">'+$(data).find("lessonTitle").attr("value") +'</div>';
		 indexString += '<ol class="dd-list">';
		 for(var i = 0; i < totalPages; i++){
		 	thisID = "module"+ _id + "indexMenuItem" + i;
		 	var pageID = $(data).find("page").eq(i).attr("id");
		 	indexString += '<li id="'+pageID+'" class="dd-item dd3-item" data-id="'+pageID+'">';
			indexString += '<div class="dd-handle dd3-handle">Drag</div>';
			indexString += '<div id="'+thisID+'" class="dd3-content" myID="'+pageID+'">'+ $(data).find("page").eq(i).find('title').first().text() +/*'<div id="commentSpot"></div>*/'</div>';
			moduleIndexItem_arr.push("#" + thisID);
		 	if($(data).find("page").eq(i).find("page").length){
		 		indexString += '<ol class="dd-list">';

		 		for(var j = 0; j < $(data).find("page").eq(i).find("page").length; j++){
			 		thisID = "module"+ _id + "indexMenuItem" + i + "lessonItem" + j;
			 		pageID = $(data).find("page").eq(i).find("page").eq(j).attr("id");
			 		indexString += '<li id="'+pageID+'" class="dd-item dd3-item" data-id="'+pageID+'">';
			 		indexString += '<div class="dd-handle dd3-handle">Drag</div>';
			 		indexString += '<div id="'+thisID+'" class="dd3-content" myID="'+pageID+'">'+ $(data).find("page").eq(i).find("page").eq(j).find('title').first().text() +/*'<div id="commentSpot"></div>*/'</div></li>';
					moduleIndexItem_arr.push("#" + thisID);
		 		}
		 		i = i + j;
		 		indexString += "</ol>"
		 	}

		 	indexString += "</li>";
		}
		indexItem_arr.push(moduleIndexItem_arr)
		indexString += '</ol></li>';
		return indexString;
     }

     /************************************************************************************
     addModuleClicks()
     -- Add listeners to the menu times for the course module buttons
     ************************************************************************************/
     function addModuleClicks(){
	      for(var j = 0; j < module_arr.length; j++){
	        $("#module"+j+"IndexHotspot").click(function(){
				if(hoverSubNav == false){
					//Call for when a module is clicked.
					try { currentMenuItem.addClass("dd3-visited"); } catch (e) {}
					currentMenuItem = $(this);
					currentMenuItem.addClass("dd3-selected");
					displayModuleData($(this).attr("data-id"));
				}
			});
			addOutlineRollovers($("#module"+j+"IndexHotspot"), "module");
		}
     }

     /************************************************************************************
     addPageClicks()
     -- Add listeners to the menu times for the course page buttons
     ************************************************************************************/
     function addPageClicks(){
	     for(var i = 0; i < indexItem_arr.length; i++){
		     var tmp_arr = [];
		     tmp_arr = indexItem_arr[i];
		     for(var j = 0; j < tmp_arr.length; j++){
			     $(tmp_arr[j]).click(function(){
					//don't fire if click subNavButtons like add or remove.
					if(hoverSubNav == false){
						//Call for when a page is clicked.
						try { currentMenuItem.addClass("dd3-visited"); } catch (e) {}
						currentMenuItem = $(this);
						currentMenuItem.addClass("dd3-selected");
						displayPageData($(this).attr("myID"));
					}
				});
				addOutlineRollovers($(tmp_arr[j]), "page");
			}
	     }
     }

     /******************************************************************
     Update module and page order and call appropriate XML SAVE Funcion
     Called on drop of menu item - does nothing if there is no change.
     ******************************************************************/
     function updateOrder(){
     	 var legalMove = true;
   	     //Gather the current state of the list and assign to list...
   	     var tmp = $('#C_Index').data('output', $('#nestable-output'));
		 var tmpList   = tmp.length ? tmp : $(tmp.target);
		 var list = tmpList.nestable('serialize');
		 var listJSON = window.JSON.stringify(list);
		 //If the list has changed, record that change.
		 if(listJSON != startListJSON){
			 var startNode = getNode(currentDragID);
			 var moveFrom = startNode.node;
			 var startModule = startNode.module;
			 var startModuleID = module_arr[startNode.module].id;
			 var startModuleName = module_arr[startNode.module].name;
			 var startNodeLevel = startNode.level;

			 var endNode;
			 var myInsert;

			 //Discern whether to put before or after - depending upon position change...
			 if(startNodeLevel == "module"){
				 var tmpID = $('#' + currentDragID).attr("id");
				 var moduleList = $(tmpList).find("#courseIndex").find(".dd-list").first().children();
				 for(var i = 0; i < moduleList.length; i++){
					 if($(moduleList[i]).attr("id") == tmpID){
						 if($(moduleList[i + 1]).attr("id")){
							 endNode = getNode($(moduleList[i + 1]).attr("id"));
							 myInsert = "before";
						 }else{
							 endNode = getNode($(moduleList[i - 1]).attr("id"));
							 myInsert = "after";
						 }
					 }
				 }
			 }else{
				 if($('#' + currentDragID).next().attr("id")){
				 	endNode = getNode($('#' + currentDragID).next().attr("id"));
				 	myInsert = "before";
				 }else{
					 endNode = getNode($('#' + currentDragID).prev().attr("id"));
					 myInsert = "after";
				 }
				 //If being added as first page of lesson there will be no previous or next - this get's "into"
				 if(endNode == undefined){
				 	endNode = getNode($('#' + currentDragID).parent().parent().attr("id"));
				 	myInsert = "into";
				 }
			}

			 var moveTo = endNode.node;
			 var endModule = endNode.module;
			 var endModuleID = module_arr[endNode.module].id;
			 var endModuleName = module_arr[endNode.module].name;
			 var endNodeLevel = endNode.level;

			 //Make sure that module levels are not changed.
			 if(startNodeLevel == "module"){
				 var levelChange = true;
				 for(var i = 0; i < list[0].children.length; i++){
					 if(startModuleID == list[0].children[i].id){
						 levelChange = false;
					 }
				 }

				 if(levelChange){
					 legalMove = false;
					 alert("That is an illegal move.  You cannot change the level of a module, just reorder them.")
				 }
			 }

			 //Check for legal moves....
			 if(startNodeLevel == "page" && endNodeLevel == "module"){
				 legalMove = false;
				 alert("That is an illegal move.  You cannot turn a page into a module.... yet...");
			 }

			 if(!legalMove){
			 	refreshExpected = true;
			 	refreshOutlineData()
			 }else{
				 //MOVE from original position to updated position.
				 if(myInsert == "before"){
					 moveFrom.insertBefore(moveTo);
				 }else if (myInsert == "after"){
					 moveFrom.insertAfter(moveTo);
				 }else{
					 moveTo.append(moveFrom);
				 }

				 //REORDERING MODULES
				 if(endNodeLevel == "module" && startNodeLevel == "module"){
					 updateCourseXML();
				 }
				 //MOVING A MODULE INTO ANOTHER MODULE
				 	else if(startNodeLevel == "module" && endNodeLevel == "page"){
					 var msg = '<div id="import-moduleDialog" title="Import alert!"></div>';
					 $("#stage").append(msg);
			         $("#dialog-outline").dialog({
			            modal: true,
			            width: 400,
			            height: 300,
			            resizable: false,
			            close: function (event, ui) {
			                //socket.emit("closeOutline");
			                destroy();
			            },
			            open: function (event, ui) {

			            }
			         });

				 }
				 //REORDERING PAGES WITHIN MODULES
				 	else if (startNodeLevel == "page" && endNodeLevel == "page"){
				 	if(endModule != startModule){
					 	updateModuleXML(startModule, false);
					 	moveAllRedmineIssuesForPage($('#' + currentDragID).attr("id"), startModuleName, startModuleID, endModuleID);
					 }
				 	 updateModuleXML(endModule, true);
				 }

				 //Update start list in case more than one change is made...
				 //Without this, you can only make one change and then stuff get's funky.
				 var tmpStart = $('#C_Index').data('output', $('#nestable-output'));
				 var tmpStartList   = tmpStart.length ? tmpStart : $(tmpStart.target);
				 startList = tmpStartList.nestable('serialize');
				 startListJSON = window.JSON.stringify(startList);
			 }
		}
     }

	function moveAllRedmineIssuesForPage(_pageId, _lessonTitle, _lessonId, _newLessonId){

		var _issues = {};
		var _page = {
			lessontitle: _lessonTitle ,
			lessonid: _lessonId,
			id: _pageId,
			coursetitle: $(courseData).find('course').first().attr("name")
		};

		socket.emit('getRedminePageIssues', _page, function(fdata){
			_issues = fdata;

			if(_issues.total_count != 0){
				// _page.lessonid = _newLessonid;
				socket.emit('findRedmineProjectId', _newLessonId, function(fdata){
					var _newProject = fdata;
					if(_newProject.length != 0){
						updateMovedIssues(_issues, _newProject.id, 0);
					}
					else{
						alert("The project id of the lesson the page was moved to was not found so no comments were moved. ");
					}
				});


			}
		});	
	} 

	// recursive function that moves each issue/comment on a page when a page is moved between lessons
	function updateMovedIssues(_issues, _newProjectId, index){
		if(index < _issues.total_count){
			_issues.issues[index].project_id = _newProjectId;
			socket.emit('updateRedmineIssue', _issues.issues[index], user.username, function(err){
				if(err){
					alert(err);
				}
				else{
					updateMovedIssues(_issues, _newProjectId, index+1);
				}
			});			
		}	
	}


     function getNode(_nodeID){
         var nodeData = new Object();
	     for(var i = 0; i < module_arr.length; i++){
		     if(module_arr[i].id == _nodeID){
			     nodeData.node = $(courseData).find('item[id="' +_nodeID+ '"]');
			     nodeData.module = i;
			     nodeData.level = "module";
			     return nodeData;
			     break;
		     }else{
			     var $xml = $(module_arr[i].xml)

			     if($xml.find('page[id="'+_nodeID+'"]').length > 0){
			     	 nodeData.node = $xml.find('page[id="'+_nodeID+'"]');
			     	 nodeData.module = i;
			     	 nodeData.level = "page";
				     return nodeData;
				     break;
			     }
			 }
	     }
     }

     /****************************************************************
     * Display editable Course Preferences.
     ****************************************************************/
     function displayCourseData(_id){
     	var serverVersion = '';
     	socket.emit('retrieveServer', function(fdata){
     		serverVersion = fdata;

			var pathSplit = coursePath.split('/programs');
			var _normPath = '../programs' + pathSplit[1];  
   		
			socket.emit('readDir', {path: _normPath, track: 'metadata'}, function(fdata){

				var metadataArr = [];
	            if(fdata == ''){
	            	console.log("fdata is empty");
	            }
	            else{

		            for (var k = 0; k < fdata.length; k++) {
		            	metadataArr.push(fdata[k].path);
		            }		           

		        }

		     	$("#outlinePagePrefPane").empty();
			    var msg = "<div name='out_courseHead' id='out_courseHead' class='outlineCourseEditHeader'><b>Course Preferences: " + $(courseData).find('course').first().attr("name") + "</b></div><br/>";
			    msg += "<div id='accordion'>";
		     	msg += "<h3 style='padding: .2em .2em .2em 2.2em'>General</h3>";
		     	msg += '<div id="general" style="font-size:100%; padding: 1em 1em; color:#666666">';
				msg += "<div><b>Details:</b></div>";
				msg += "<label for='out_courseTitle'>course title: </label>";
				msg += '<input type="text" name="out_courseTitle" id="out_courseTitle" title="Update the course title." value="'+ $(courseData).find('course').first().attr("name") + '" class="text ui-widget-content ui-corner-all" /> <br/>';
				msg += "<label for='out_courseDisplayTitle'>alt course title: </label>";
				msg += '<input type="text" name="out_courseDisplayTitle" id="out_courseDisplayTitle" title="Input course title as you would like it to appear." class="text ui-widget-content ui-corner-all" /> <br/>';			
				msg += "<label for='targetAudience'>target audience: </label>";
				msg += '<textarea rows="4" cols="50" name="targetAudience" id="targetAudience" title="Update the instructional goal for the course." value="undefined" class="text ui-widget-content ui-corner-all"></textarea>';
				msg += "<label for='instructionalGoal'>instructional goal: </label>";
				msg += '<textarea rows="4" cols="50" name="instructionalGoal" id="instructionalGoal" title="Update the instructional goal for the course." value="undefined" class="text ui-widget-content ui-corner-all"></textarea>';
				msg += '<div><b>Section 508:</b></div>';
				msg += addToggle("section508", "Enable content to follow Section 508 standards.");
		     	msg += "<div><b>Redmine:</b></div>";
				msg += addToggle("redmine", "Enable the use of Redmine for commenting.");	
		     	msg += "<div><b>ShowAll:</b></div>";
				msg += addToggle("showall", "Override lesson settings to show all questionbank questions.");					
				msg += '</div>';//end general div
		     	msg += '<h3 style="padding: .2em .2em .2em 2.2em">SCORM 2004 Sequencing</h3>';
				msg += '<div id="sequencing" style="font-size:100%; padding: 1em 1em; color:#666666">';
				msg += addToggle("objectivesGlobalToSystem", "Enable shared global objective information for the lifetime of the learner in the system.");
				msg += '<br/><div id="controlModes" title="Determine what type of navigation is allowed by the user." style="float:left"><b>Determine what type of navigation is allowed by the user:</b></div>';
				msg += addToggle("choice", "Enable the table of contents for navigating among this activity’s children.");
				msg += addToggle("flow", "Enable previous and next buttons for navigating among this activity’s children.");
				msg += addToggle("forwardOnly", "Restricts the user to only moving forward through the children of this activity. Previous requests and using the table of contents go backwards is prohibited.");
				msg += 	'<br/><br/><a href="http://scorm.com/scorm-explained/technical-scorm/sequencing/sequencing-definition-model/" target="_blank" style="float:left">Sequencing Definition Model</a>';
				//end div for sequencing
				msg += '</div>';
				if(serverVersion != 'VA'){
			    	msg += "<h3 style='padding: .2em .2em .2em 2.2em'>LMS Options</h3>";
			     	msg += '<div id="lmsAccord" style="font-size:100%; padding: 1em 1em; color:#666666">';
			     	msg += "<label for='lms'>Set preferred LMS: </label>";
			     	msg += "<select name='lms' id='lms' title='Set the preferred LMS to be used for deployment.'>";
			     	msg += "<option>none</option>";
			     	msg += "<option>JKO</option>";
			     	msg += "<option>CTCU</option>";
			     	msg += "<option>NEL</option>";
			     	msg += "<option>ADLS</option>";
			     	msg += "</select> ";
					//end div for lmsAccord
					msg += '</div>';
				}
				//#3727 Add course_metadata.xml updating
		    	msg += "<h3 style='padding: .2em .2em .2em 2.2em'>Metadata Options</h3>";
		     	msg += '<div id="metadataAccord" style="font-size:100%; padding: 1em 1em; color:#666666">';
				msg += '<div><b>Import Metadata:</b></div>';
				msg += addToggle("importmetadata", "Enable external metadata file to be added to the imsmanifest.xml. Ex: course_metadata.xml");	     	
				msg += '<br/><div id="uploadMetadata" title="Upload new metadata files." style="float:left"><b>Upload Metadata:</b></div>';
				msg += "<div style='clear: both'><input id='metadatafile' type='file' disabled/></div><br/>";
				msg += '<div><b>Manage Metadata:</b></div><div id="metadataFiles">';				
				if(metadataArr.length != 0){
					for (var i = 0; i < metadataArr.length; i++) {
						msg += '<div id="metadataFile'+i+'" data-id="'+metadataArr[i]+'">' + metadataArr[i];
						msg += "<div id='metadataRemove' class='metadataRemove' title='delete this item'></div>";						
						msg += "<a  target='_blank' href=" + encodeURI(_normPath) + '/metadata/' +metadataArr[i]+ " download id='downloadMetadata' class='metadataDownload' title='download this item'></a>";				
						msg +='</div>';//metadataFile+i end
					}
				}
				//end div for metadataFiles
				msg += '</div>';
				//end div for metadataAccord
				msg += '</div>';			
				//end div for accordion
				msg += '</div>';

				$("#outlinePagePrefPane").append(msg);
				$("#out_courseTitle").alphanum();

				//set redmine to default if not set and set redmine based off of value in xml
				if(!$(courseData).find("course").attr("redmine")){
					$('#redmine').prop('checked', false);
					$(courseData).find("course").attr("redmine", "false");
					updateCourseXML();
				}
				else if($(courseData).find("course").attr("redmine") === "true"){
					$('#redmine').prop('checked', true);
					checkRedmineStructure($(courseData).find('course').first().attr("id"));
				}
				else{
					$('#redmine').prop('checked', false);
				}

				//update the xml when the redmine toggle is changed
				$('#redmine').on('change', function(){
					if($('#redmine').prop('checked')){
						$(courseData).find("course").attr("redmine", "true");
						checkRedmineStructure($(courseData).find('course').first().attr("id"));
					}
					else{
						$(courseData).find("course").attr("redmine", "false");
					}
					updateCourseXML();
				});

				//handle setting of coursedisplaytitle if not set and setting the value based off of the xml
				if(!$(courseData).find('course').attr('coursedisplaytitle')){
					$('#out_courseDisplayTitle').val($(courseData).find('course').first().attr("name"));
					$(courseData).find('course').attr('coursedisplaytitle', $('#out_courseDisplayTitle').val().trim());
					updateCourseXML();
				}
				else{
					$('#out_courseDisplayTitle').val($(courseData).find('course').first().attr("coursedisplaytitle"));
				}

				//on change of the coursedisplaytitle toggle update the course xml 
				$('#out_courseDisplayTitle').on('change', function(){
					$(courseData).find('course').attr('coursedisplaytitle', $('#out_courseDisplayTitle').val().trim());
					updateCourseXML();
				}).css({'width': '500px', 'color': '#3383bb;'});


				//handle setting of section 508 if not set and setting the value based off of the xml
				if(!$(courseData).find('course').attr('section508')){
					$('#section508').prop('checked', true);
					$(courseData).find('course').attr('section508', 'true');
					updateCourseXML();

				}
				else if($(courseData).find('course').attr('section508') === 'true'){
					$('#section508').prop('checked', true);
				}
				else{
					$('#section508').prop('checked', false);
				}

				//on change of the section508 toggle update the course xml 
				$('#section508').on('change', function(){
					if($('#section508').prop('checked')){
						$(courseData).find('course').attr('section508', 'true');
					}
					else{
						$(courseData).find('course').attr('section508', 'false');
					}
					updateCourseXML();
				});

				//handle setting of showall if not set and setting the value based off of the xml
				if(!$(courseData).find('course').attr('showall')){
					$('#showall').prop('checked', false);
					$(courseData).find('course').attr('showall', 'false');
					updateCourseXML();

				}
				else if($(courseData).find('course').attr('showall') === 'true'){
					$('#showall').prop('checked', true);
				}
				else{
					$('#showall').prop('checked', false);
				}

				//on change of the  toggle update the course xml 
				$('#showall').on('change', function(){
					if($('#showall').prop('checked')){
						$(courseData).find('course').attr('showall', 'true');
					}
					else{
						$(courseData).find('course').attr('showall', 'false');
					}
					updateCourseXML();
				});

				//set objectivesGlobalToSystem based off value in xml
				if($(courseData).find('sequencing').first().attr("objectivesGlobalToSystem") === "true"){
					$('#objectivesGlobalToSystem').prop('checked',true);
				}
				else{
					$('#objectivesGlobalToSystem').prop('checked',false);
				}

				//update the xml when objectivesGlobalToSystem toggle is changed
				$("#objectivesGlobalToSystemRadio").on("change", function(){
				   if($('#objectivesGlobalToSystem').prop('checked')){
					   $(courseData).find('sequencing').first().attr("objectivesGlobalToSystem", "true");
				   } else{
					   $(courseData).find('sequencing').first().attr("objectivesGlobalToSystem", "false");
				   }
				   updateCourseXML();
				});

				//set choice based off value in xml
				if($(courseData).find('sequencing').first().attr("choice") === "true"){
					$('#choice').prop('checked',true);
				}
				else{
					$('#choice').prop('checked',false);
				}

				//update the xml when choice toggle is changed
				$("#choiceRadio").on("change", function(){
				   if($('#choice').prop('checked')){
					   $(courseData).find('sequencing').first().attr("choice", "true");
				   } else{
					   $(courseData).find('sequencing').first().attr("choice", "false");
				   }
				   updateCourseXML();
				});

				//set flow based off value in xml
				if($(courseData).find('sequencing').first().attr("flow") === "true"){
					$('#flow').prop('checked',true);
				}
				else{
					$('#flow').prop('checked',false);
				}

				//update the xml when flow toggle is changed
				$("#flowRadio").on("change", function(){
				   if($('#flow').prop('checked')){
					   $(courseData).find('sequencing').first().attr("flow", "true");
				   } else{
					   $(courseData).find('sequencing').first().attr("flow", "false");
				   }
				   updateCourseXML();
				});

				//set forwardOnly based off value in xml
				if($(courseData).find('sequencing').first().attr("forwardOnly") === "true"){
					$('#forwardOnly').prop('checked',true);
				}
				else{
					$('#forwardOnly').prop('checked',false);
				}

				//update the xml when forwardOnly toggle is changed
				$("#forwardOnlyRadio").on("change", function(){
				   if($('#forwardOnly').prop('checked')){
					   $(courseData).find('sequencing').first().attr("forwardOnly", "true");
				   } else{
					   $(courseData).find('sequencing').first().attr("forwardOnly", "false");
				   }
				   updateCourseXML();
				});

				$("#out_courseTitle").on("change", function(){
					//ADD CODE TO PROPERLY RENAME LESSON ---------------------------------------------------------------------------------------------------------------
					var titleUpdate = $("#out_courseTitle").val().replace('<p>', '').replace('</p>', '').trim();
					currentMenuItem.text(titleUpdate);
					$('#out_courseHead').text("Course Preferences: " + titleUpdate);
					$('#courseIndexHotspot').text(titleUpdate);
					$('#dialog-outline').dialog('option', 'title', 'Outline ' + titleUpdate + ':');
					$(courseData).find('course').first().attr("name", titleUpdate);
					//$(courseData).attr("name", titleUpdate);
					updateCourseXML();

					var data = {
			            content: {
			                id: courseID,
			                type: currentCourseType,
			                name: titleUpdate
			            },
			            user: {
			                id: user._id,
			                username: user.username
			            }
			        };

			        socket.emit('renameContent', data);
				}).css({'width': '500px', 'color': '#3383bb;'});

				if(serverVersion != 'VA'){
					//set lms based off value in xml
					if($(courseData).find("course").attr("lms")){
						$("#lms").val($(courseData).find("course").attr("lms"));
					}

					// update the xml when the lms drop is changed
				    $("#lms").on("change", function(){
					    $(courseData).find("course").attr("lms", $("#lms").val());
					    setLmsAccord();
					    updateCourseXML();
				    });
				}

				//set instructional goal based off value in xml
				if($(courseData).find("course").attr("instructionalgoal")){
					$("#instructionalGoal").val($(courseData).find("course").attr("instructionalgoal"));
				}

				// update the xml when the instructional goal is changed
			    $("#instructionalGoal").on("change", function(){
				    $(courseData).find("course").attr("instructionalgoal", $("#instructionalGoal").val().replace('<p>', '').replace('</p>', '').trim());
				    updateCourseXML();
			    }).css({'width': '500px', 'color': '#3383bb;'});

				//set target audience based off value in xml
				if($(courseData).find("course").attr("targetaudience")){
					$("#targetAudience").val($(courseData).find("course").attr("targetaudience"));
				}

				// update the xml when the target audience is changed
			    $("#targetAudience").on("change", function(){
				    $(courseData).find("course").attr("targetaudience", $("#targetAudience").val().replace('<p>', '').replace('</p>', '').trim());
				    updateCourseXML();
			    }).css({'width': '500px', 'color': '#3383bb;'});	    

				//set importmetadata to default if not set and set importmetadata based off of value in xml
				if(!$(courseData).find("course").attr("importmetadata")){
					$('#importmetadata').prop('checked', false);
					$(courseData).find("course").attr("importmetadata", "false");
					$('#metadatafile').prop('disabled', true);
					updateCourseXML();
				}
				else if($(courseData).find("course").attr("importmetadata") === "true"){
					$('#importmetadata').prop('checked', true);
					$('#metadatafile').prop('disabled', false);
				}
				else{
					$('#importmetadata').prop('checked', false);			
					$('#metadatafile').prop('disabled', true);

				}

				//update the xml when the importmetadata toggle is changed
				$('#importmetadata').on('change', function(){
					if($('#importmetadata').prop('checked')){
						$(courseData).find("course").attr("importmetadata", "true");
						$('#metadatafile').prop('disabled', false);
					}
					else{
						$(courseData).find("course").attr("importmetadata", "false");
						$('#metadatafile').prop('disabled', true);
					}
					
					updateCourseXML();
				});		 

				$('#metadatafile').change(function(e) { 

					socket.on('mediaBrowserUploadComplete', refreshMetadataList);

					var file = e.target.files[0];

					if(file != undefined){
						var stream = ss.createStream(/* {hightWaterMark: 16 * 1024} */);
						ss(socket).emit('upload-media', stream, {size: file.size, name: file.name, id: courseID, type: 'course', path:"", track: "metadata"});
						var blobStream = ss.createBlobReadStream(file/* , {hightWaterMark: 16 * 1024} */);

						blobStream.pipe(stream);

					}	

				});	

				$(".metadataRemove").click(function(){
					checkRemoveMetadata($(this).parent().attr("data-id"));
				});						   

				/*$("#out_courseObjective").on("change", function(){
				 	//ADD CODE TO PROPERLY RENAME LESSON ---------------------------------------------------------------------------------------------------------------
				 	var titleUpdate = $("#out_pageObjective").val().trim();
				   	$(module_arr[i].xml).find('page').eq(j).attr('objective', titleUpdate);
					updateModuleXML(currentPageParentModule);
				}).css({'width': '500px', 'color': '#3383bb;'});*/

				$(function () {
					//$("div[id$='Radio']").buttonset();
					$( document ).tooltip();
					//set up jquerui accordion
					$("#accordion").accordion({
						collapsible: true,
						heightStyle: "content"
					});
					//sets up lmsAccord div based off of lms identified
					setLmsAccord();
				});     				        

			});

     	});

     }

     function checkRedmineStructure(_courseId){

		socket.emit('checkRedmineProjectStructure', _courseId, function(err){
			if(err){
				alert('There was an error creating the Redmine project structure.');
			}
		});	

     }


	function setLmsAccord(){
		if($("#lms").val() == "JKO"){
			//append to accordon for course...
			var jkoData = "<div id='certTitleHolder'><br/><label id='certTitleLabel' for='out_certificateCourseTitle'>certificate course title: </label>";
			jkoData += '<input type="text" name="out_certificateCourseTitle" id="out_certificateCourseTitle" title="Update the course title to be used on the certificate." class="text ui-widget-content ui-corner-all" /></div> <br/>';
			jkoData += addToggle("survey", "Adds the JKO survey to the end of the course.");
			jkoData += addToggle("certificate", "Adds the JKO certificate to the end of the course.");

			$("#lmsAccord").append(jkoData);
			setToggle("survey", -1);
			setToggle("certificate", -1);
			toggleChange("survey", -1);
			toggleChange("certificate", -1);

			$(courseData).find('course').first().attr("name")

			//set cert title based off value in xml
			if($(courseData).find("course").attr("certificatetitle")){
				$("#out_certificateCourseTitle").val($(courseData).find("course").attr("certificatetitle"));
			}
			else{
				var displaytitle = $(courseData).find('course').first().attr("coursedisplaytitle");
				$("#out_certificateCourseTitle").val(displaytitle);
			    $(courseData).find("course").attr("certificatetitle", displaytitle);
			    updateCourseXML();				
			}

			// update the xml when the cert title is changed
		    $("#out_certificateCourseTitle").on("change", function(){
			    $(courseData).find("course").attr("certificatetitle", $("#out_certificateCourseTitle").val().replace('<p>', '').replace('</p>', '').trim());
			    updateCourseXML();
		    }).css({'width': '500px', 'color': '#3383bb;'});

			$( document ).tooltip();
			$("#accordion").accordion("refresh");
		}
		else if($("#lms").val() == "none"){
			$(courseData).find("course").attr("survey", "false");
			$(courseData).find("course").attr("certificate", "false");
			$("#certTitleHolder").remove();
			$("#surveyText").parent().remove();
			$("#certificateText").parent().remove();
		}

	}

	/**
	* Launch Dialog to confirm removal of media.
	*
	* @method checkRemoveMetadata
	* @param {String} server path and name of file to be removed.
	*/
	function checkRemoveMetadata(_file){
		//Create the Dialog
		$("#stage").append("<div id='dialog-removePage' title='Remove Metadata file'><p>Are you sure that you want to remove " + _file + " from this project?</p></div>");
		//Style it to jQuery UI dialog
		$("#dialog-removePage").dialog({
			modal: true,
			width: 550,
			close: function(event, ui){
				$("dialog-removePage").remove();
			},
			buttons: {
				Yes: function(){
					removeMetadata(_file);
					$( this ).dialog( "close" );
				},
				No: function(){
					$( this ).dialog( "close" );
				}
			}
		});
	}

	/**
	* Function to remove selected media.
	*
	* @method removeMetadata
	* @param _file {Boolean} path to file to remove
	*/
	function removeMetadata(_file){
		socket.on('removeMetadataComplete', removeMetadataComplete);

		socket.emit('removeMetadata', {file: _file, type: 'course', id: courseID, track: 'metadata'});
	}

	/**
	* Function to to update once removal of media is complete.
	*
	* @method removeMetadataComplete
	*/
	function removeMetadataComplete(){

		try { socket.removeListener('removeMetadataComplete', removeMetadataComplete); } catch (e) {}

		refreshMetadataList();  		

	}

	/**
	* Function to refresh the metadata list
	*
	* @method refreshMetadataList
	*/
	function refreshMetadataList(){

		var pathSplit = coursePath.split('/programs');
		var _normPath = '../programs' + pathSplit[1];
		
		try { socket.removeListener('mediaBrowserUploadComplete', refreshMetadataList);} catch (e) {}

		//Commit GIT when complete.
		socket.emit('contentSaved', {
			content: {type: 'course', id: courseID},
			user: {id: user._id}
		});	

		socket.emit('readDir', {path: _normPath, track: 'metadata'}, function(fdata){

			var metadataArr = [];
            if(fdata == ''){
            	console.log("fdata is empty");
            }
            else{

	            for (var k = 0; k < fdata.length; k++) {
	            	metadataArr.push(fdata[k].path);
	            }

	            var msg = '';
				if(metadataArr.length != 0){
					for (var i = 0; i < metadataArr.length; i++) {
						msg += '<div id="metadataFile'+i+'" data-id="'+metadataArr[i]+'">' + metadataArr[i];
						msg += "<div id='metadataRemove' class='metadataRemove' title='delete this item'></div>";							
						msg += "<a  target='_blank' href=" + encodeURI(_normPath) + '/metadata/' +metadataArr[i]+ " download id='downloadMetadata' class='metadataDownload' title='download this item'></a>";				
						msg +='</div>';//metadataFile+i end
					}
				}

				$("#metadataFiles").empty();
				$("#metadataFiles").append(msg);	       

				$(".metadataRemove").click(function(){
					checkRemoveMetadata($(this).parent().attr("data-id"));
				});					     		           

	        }
	    });		
	}	


     /****************************************************************
     * Display editable Module Preferences.
     ****************************************************************/
     function displayModuleData(_id){
     	//Find which array item to push to....
     	for(var i = 0; i < module_arr.length; i++){
			if(_id == module_arr[i].id){
				_id = i;
				break;
			}
		}

		//#3905 ///////////////////////////////
		//lessondisplaytitle
		if($(module_arr[_id].xml).find('lessondisplaytitle').length != 0){
			if($(module_arr[_id].xml).find('lessondisplaytitle').attr('value') == ""){
				$(module_arr[_id].xml).find('lessondisplaytitle').attr('value', $(module_arr[_id].xml).find('lessonTitle').attr("value"));
				updateModuleXML(_id);
			}
		}
		else{
			$(module_arr[_id].xml).find("preferences").append($("<lessondisplaytitle>", data));
			$(module_arr[_id].xml).find("lessondisplaytitle").attr("value", $(data).find("lessonTitle").attr("value"));
			updateModuleXML(_id);
		}

		//lessonWidth
		if($(module_arr[_id].xml).find('lessonWidth').length != 0){
			if($(module_arr[_id].xml).find('lessonWidth').attr('value') == ""){
				$(module_arr[_id].xml).find('lessonWidth').attr('value', '768');
				updateModuleXML(_id);
			}
		}
		else{
			$(module_arr[_id].xml).find("preferences").append($("<lessonWidth>", data));
			$(module_arr[_id].xml).find("lessonWidth").attr("value", '768');
			updateModuleXML(_id);
		}

		//lessonHeight
		if($(module_arr[_id].xml).find('lessonHeight').length != 0){
			if($(module_arr[_id].xml).find('lessonHeight').attr('value') == ""){
				$(module_arr[_id].xml).find('lessonHeight').attr('value', '1024');
				updateModuleXML(_id);
			}
		}
		else{
			$(module_arr[_id].xml).find("preferences").append($("<lessonHeight>", data));
			$(module_arr[_id].xml).find("lessonHeight").attr("value", '1024');
			updateModuleXML(_id);
		}
		/////////////////////////////////////////////////////////////////////

     	$("#outlinePagePrefPane").empty();
     	var msg = "<div id='header' class='outlineModuleEditHeader'><b>Module Preferences: " + $(module_arr[_id].xml).find('lessonTitle').attr("value") + "</b></div><br/>";
     	msg += "<div id='accordion'>";
     	msg += "<h3 style='padding: .2em .2em .2em 2.2em'>General</h3>";
     	msg += '<div id="general" style="font-size:100%; padding: 1em 1em; color:#666666">';
     	msg += "<div><b>Details:</b></div>";
     	msg += "<label for='lessonTitle'>lesson title: </label>";
        msg += '<input type="text" name="lessonTitle" id="lessonTitle" title="Update the lesson title." value="'+ $(module_arr[_id].xml).find('lessonTitle').attr("value") + '" class="text ui-widget-content ui-corner-all" /> ';
     	msg += "<br/><label for='lessonDisplayTitle'>alt lesson title: </label>";
        msg += '<input type="text" name="lessonDisplayTitle" id="lessonDisplayTitle" title="Input lesson title as you would like it to appear." value="'+ $(module_arr[_id].xml).find('lessondisplaytitle').attr("value") + '" class="text ui-widget-content ui-corner-all" /> ';        
     	msg += "<br/><label for='tlo'>terminal objective: </label>";
        msg += '<input type="text" name="tlo" id="tlo" title="Update the course terminal objective." value="'+ $(module_arr[_id].xml).find('tlo').attr("value") + '" class="text ui-widget-content ui-corner-all" /> ';
     	msg += "<div>"
     	msg += "<label for='lessonWidth'>width of lesson: </label>";
        msg += '<input type="text" name="lessonWidth" id="lessonWidth" title="Update the width of the lesson." value="'+ $(module_arr[_id].xml).find('lessonWidth').attr("value") + '" class="text ui-widget-content ui-corner-all" /> ';
        msg += "<label for='lessonHeight'>height of lesson: </label>";
        msg += '<input type="text" name="lessonHeight" id="lessonHeight" title="Update the height of the lesson." value="'+ $(module_arr[_id].xml).find('lessonHeight').attr("value") + '" class="text ui-widget-content ui-corner-all" /><br/>';
        msg += "<label for='mode'>set mode: </label>";
     	msg += "<select name='mode' id='mode'>";
     	msg += "<option>production</option>";
     	msg += "<option>review</option>";
     	msg += "<option>edit</option>";
     	msg += "</select><br/><br/>";
		msg += "<div><b>Transitions:</b></div>";
     	msg += "<label for='transitionDuration'>transition duration (s): </label>";
        msg += '<input type="text" name="transitionDuration" id="transitionDuration" value="'+ $(module_arr[_id].xml).find('transitionLength').attr("value") + '" class="text ui-widget-content ui-corner-all" /> ';
     	msg += "<br/><br/>";
     	msg += "<div><b>Lock:</b></div>";
     	msg += "<label for='lockDuration'>duration for lock request (s): </label>";
        msg += '<input type="text" name="lockDuration" id="lockDuration" value="'+ $(module_arr[_id].xml).find('lockRequestDuration').attr("value") + '" class="text ui-widget-content ui-corner-all" /><br/> ';
     	msg += "<div><b>minScore:</b></div>";
     	msg += "<label for='minScore'>minimal passing score: </label>";
        msg += '<input type="text" name="minScore" id="minScore" value="'+ $(module_arr[_id].xml).find('minScore').attr("value") + '" class="text ui-widget-content ui-corner-all" /><br/> ';
     	msg += "<div><b>restartOnFail</b></div>";
		msg += "<label id='label' for='restartOnFail'>restartOnFail: </label>";
		msg += "<input id='restartOnFail' type='checkbox' name='restartOnFail' class='radio'/><br/><br/>";
     	msg += "<div><b>exclude from publish</b></div>";
		msg += addToggle("excludeFromPublish", "Exclude this lesson from being published with the course");		
     	msg += "</div>";
     	//end general div
     	msg += '</div>';
     	msg += '<h3 style="padding: .2em .2em .2em 2.2em">SCORM 2004 Sequencing</h3>';
		msg += '<div id="sequencing" style="font-size:100%; padding: 1em 1em; color:#666666">';
		msg += '<br/><div id="hideLMSUIValues" title="" style="float:left;"><b>Indicates which navigational UI elements the LMS should hide when this activity is being delivered:</b></div>';
		msg += addToggle("previous", "Remove the previous button:");
		msg += addToggle("continue", "Remove the continue button:" );
		msg += addToggle("exit", "Remove the exit button (if present):");
		msg += addToggle("exitAll", "Remove the exitAll button (if present):");
		msg += addToggle("abandon", "Remove the abandon button (if present):");
		msg += addToggle("abandonAll", "Remove the abandonAll button (if present):");
		msg += addToggle("suspendAll", "Remove the suspendAll button (if present):");
		msg += '<br/><br/><div id="controlModes" title="" style="float:left;"><b>Determine what type of navigation is allowed by the user:</b></div>';
		//msg += addToggle("choice", "Enable the table of contents for navigating among this activity’s children:");
		//msg += addToggle("flow", "Enable previous and next LMS navigation buttons for navigating among this activity’s children:");
		//msg += addToggle("forwardOnly", "Restricts the user to only moving forward through the children of this activity: (Previous requests and using the table of contents go backwards is prohibited.)");
		msg += addToggle("choiceExit", "Can the learner jump out of this activity using a choice request?");
		msg += '<br/><div id="sequencingRules" title="" style="float:left;"><b>Specify if-then conditions that determine which activities are available for delivery and which activity should be delivered next.: </b></div>';
		msg += addToggle("notAttemptHidden", "Hide the item in the TOC until it has been attempted:");
     	//msg += '<label title="Hide the item in the TOC until it has been attempted." style="width:350px; float:left;" >Hide in table of contents until attempted : </label>';
		//msg += '<input type="checkbox" id="notAttemptHiddenCheckbox" style="float:left;"/><label for="notAttemptHiddenCheckbox" title="Add/Remove rule.">toggle</label>';
		msg += '<br/><br/><div id="rollupControls" title="" style="float:left;"><b>Determine which activities participate in status rollup and how their status is weighted in relation to other activities: </b></div>';
		msg += addToggle("rollupObjectiveSatisfied", "Specifies whether this activity should count towards satisfaction rollup:");
		msg += '<label for="rolluOobjectiveMeasureWeight" title="" style="float:left">Assign a weight to the score for this activity to be used in rollup.:  </label>';
		msg += '<input id="rollupObjectiveMeasureWeight" name="rollupObjectiveMeasureWeight" style="width:350px; float:left;"/>';
		msg += addToggle("rollupProgressCompletion", "Specifies whether this activity should count towards completion rollup:");
		msg += '<br/><div id="deliveryControls" title="" style="float:left;"><b>Allow for non-communicative content to be delivered and sequenced:</b></div>';
		msg += addToggle("tracked", "Is data tracked for this activity:");
		msg += addToggle("completionSetByContent", "If false, the sequencer will automatically mark the activity as completed if it does not report any completion status.");
		msg += addToggle("objectiveSetByContent", "If false, the sequencer will automatically mark the activity as satisfied if it does not report any satisfaction status.");
		msg += '<br/><div id="reviewModule" title="If this is a test module, a test review module can be added that displays all of the missed objectives from the test.'
		+' This adds the module at publish time to the final SCORM package." style="float:left;"><b>Add test review module after this module:</b></div>';
		msg += addToggle("testReview", "Specifies if a test review module should follow this module:");
		msg += 	'<br/><div style="float:left;"><a href="http://scorm.com/scorm-explained/technical-scorm/sequencing/sequencing-definition-model/" target="_blank" >Sequencing Definition Model</a></div>';


		//end sequencing div
		msg += '</div>';
		//end accordion div
		msg += '</div>';
	    $("#outlinePagePrefPane").append(msg);
	    $("#lessonTitle").alphanum();
	    //Set module settings.
	    //Mode
		$("#mode option:contains(" + $(module_arr[_id].xml).find('mode').attr("value") + ")").attr('selected', 'selected');

		//set restartOnFail
		if($(module_arr[_id].xml).find('restartOnFail').attr("value") === "true"){
			$('restartOnFail').prop('checked', true);
		}

	    //set tlo to default if not set
	    if(!$(module_arr[_id].xml).find('tlo').attr('value')){
	    	//forloop coursedata to find item....
			for(var j = 0; j < $(courseData).find("item").length; j++){
				if($(courseData).find("item").eq(j).attr('name') == currentMenuItem.text().replace(/[^\w\s]/gi, '')){
					if(!$(courseData).find("item").eq(j).attr('tlo')){
						$(module_arr[_id].xml).find("preferences").append($('<tlo>',module_arr[_id].xml));
						$(module_arr[_id].xml).find('tlo').attr('value', 'undefined');
						$(courseData).find("item").eq(j).attr('tlo', 'undefined');
						updateModuleXML(_id);
						updateCourseXML(false);
						$('#tlo').val('undefined');
						break;
					}
					else{
						$(module_arr[_id].xml).find("preferences").append($('<tlo>', module_arr[_id].xml));
						$(module_arr[_id].xml).find('tlo').attr('value', $(courseData).find("item").eq(j).attr('tlo'));
						updateModuleXML(_id);
						$('#tlo').val($(courseData).find("item").eq(j).attr('tlo'));
					}
				}

			}
	    }
	    else{
	    	$('#tlo').val($(module_arr[_id].xml).find('tlo').attr('value'));
	    }

	    //moved to here so it could be used in setting of id in module.xml
		var lessonMatchID;
		for (var i=0; i < totalOutlineModules; i++){
			if(currentMenuItem.attr("data-id") == $(courseData).find("item").eq(i).attr("id")){
				lessonMatchID = $(courseData).find("item").eq(i).attr("id");
				break;
			}
		}

	    //set lesson id on module.xml if doesn't exist
	    if(!$(module_arr[_id].xml).find('id').attr('value')){
	    	$(module_arr[_id].xml).find("preferences").append($('<id>', module_arr[_id].xml));
	    	$(module_arr[_id].xml).find('id').attr('value', lessonMatchID);
	    	updateModuleXML(_id);
	    }

	    //Listeners for Module Settings
	     //MODULE TITLE CHANGE
	     $("#lessonTitle").on("change", function(){
			//Updated module title in edit pane header
			$("#header").html("<b>Module Preferences: " + $("#lessonTitle").val().trim() + "</b>");
			//Update module name in module.xml
			$(module_arr[_id].xml).find('lessonTitle').attr("value", $("#lessonTitle").val().trim());
			updateModuleXML(_id, false);
			
			//find and update module title in course.xml
			for(var j = 0; j < $(courseData).find("item").length; j++){
				if($(courseData).find("item").eq(j).attr('name') == currentMenuItem.text().replace(/[^\w\s]/gi, '')){
					$(courseData).find("item").eq(j).attr('name', $("#lessonTitle").val().trim());
					updateCourseXML(false);
					break;
				}

			}


			//Update title in menu
			currentMenuItem.text($("#lessonTitle").val().trim());

			//Send to server for rename
			var data = {
	            content: {
	                id: lessonMatchID,
	                type: "lesson",
	                name: $("#lessonTitle").val().trim()
	            },
	            user: {
	                id: user._id,
	                username: user.username
	            }
	        };

	        socket.emit('renameContent', data);
	        
	        //Update the array after making changes.
	        module_arr[_id].name = $("#lessonTitle").val().trim();
			var pathSplitter = module_arr[_id].path.split("/");
			pathSplitter[pathSplitter.length - 1] = $("#lessonTitle").val().trim();
			module_arr[_id].path = pathSplitter.join("/");
			
			var xmlpathSplitter = module_arr[_id].xmlPath.split("/");
			xmlpathSplitter[1] = $("#lessonTitle").val().trim();
			module_arr[_id].xmlPath = xmlpathSplitter.join("/")
			
	    }).css({'width': '500px', 'color': '#3383bb;'});
	    //END MODULE TITLE CHANGE

	    $('#lessonDisplayTitle').on('change', function(){
			$(module_arr[_id].xml).find('lessondisplaytitle').attr("value", $("#lessonDisplayTitle").val().trim());
			updateModuleXML(_id);
	    }).css({'width': '500px', 'color': '#3383bb;'});

	    //module tlo change
	    $("#tlo").on("change", function(){
			$(module_arr[_id].xml).find('tlo').attr('value', $('#tlo').val().trim());
			updateModuleXML(_id);

			//find and update module tlo in course.xml
			for(var j = 0; j < $(courseData).find("item").length; j++){
				if($(courseData).find("item").eq(j).attr('name') == currentMenuItem.text().replace(/[^\w\s]/gi, '')){
					$(courseData).find("item").eq(j).attr('tlo', $('#tlo').val().trim());
					updateCourseXML(false);
					break;
				}

			}

	    }).css({'width': '500px', 'color': '#3383bb;'});


	    $("#mode").on("change", function(){
		    $(module_arr[_id].xml).find('mode').attr("value", $("#mode").val());
		    updateModuleXML(_id);
	    });

	    $("#transitionDuration").on("change", function(){
			$(module_arr[_id].xml).find('transitionLength').attr("value", $("#transitionDuration").val());
			updateModuleXML(_id);
	    }).css({'width': '50px', 'color': '#3383bb;'});

	    $("#lockDuration").on("change", function(){
			$(module_arr[_id].xml).find('lockRequestDuration').attr("value", $("#lockDuration").val());
			updateModuleXML(_id);
	    }).css({'width': '50px', 'color': '#3383bb;'});

	    $("#lessonWidth").on("change", function(){
			$(module_arr[_id].xml).find('lessonWidth').attr("value", $("#lessonWidth").val());
			updateModuleXML(_id);
	    }).css({'width': '50px', 'color': '#3383bb;'});

	    $("#lessonHeight").on("change", function(){
			$(module_arr[_id].xml).find('lessonHeight').attr("value", $("#lessonHeight").val());
			updateModuleXML(_id);
	    }).css({'width': '50px', 'color': '#3383bb;'});

	    $("#minScore").on("change", function(){
			$(module_arr[_id].xml).find('minScore').attr("value", $("#minScore").val());
			updateModuleXML(_id);
	    }).css({'width': '50px', 'color': '#3383bb;'});

	    $("#restartOnFail").on("change", function(){
		   if($('#restartOnFail').prop('checked')){
			   $(module_arr[_id].xml).find('restartOnFail').attr("value", "true");
		   } else{
			   $(module_arr[_id].xml).find('restartOnFail').attr("value", "false");
		   }
		   updateModuleXML(_id);
	    });

	    //find the index number for the item
	    var modIndex = 0;
		for(var j = 0; j < $(courseData).find("item").length; j++){
			if($(courseData).find("item").eq(j).attr('name') == currentMenuItem.text().replace(/[^\w\s]/gi, '')){
				modIndex = j+1;
			}
		}

		//set sequencing toggles based off of xml
		//setToggle("choice", modIndex);
		//setToggle("flow", modIndex);
		//setToggle("forwardOnly", modIndex);
		setToggle("excludeFromPublish", modIndex-1, "item");
		setToggle("choiceExit", modIndex);
		setToggle("previous", modIndex);
		setToggle("continue", modIndex);
		setToggle("exit", modIndex);
		setToggle("exitAll", modIndex);
		setToggle("abandon", modIndex);
		setToggle("abandonAll", modIndex);
		setToggle("suspendAll", modIndex);
		setToggle("tracked", modIndex);
		setToggle("completionSetByContent", modIndex);
		setToggle("objectiveSetByContent", modIndex);
		setToggle("rollupObjectiveSatisfied", modIndex);
		setToggle("rollupProgressCompletion", modIndex);
		setToggle("testReview", modIndex);

		if($(courseData).find('sequencing').eq(modIndex).find('sequencingRules').find('notattempthidden').attr('value') === "true"){
			$('#notAttemptHidden').prop('checked',true);
		}
		else{
			$('#notAttemptHidden').prop('checked',false);
		}

		//update the xml when toggles are changed
		//toggleChange("choice", modIndex);
		//toggleChange("flow", modIndex);
		//toggleChange("forwardOnly", modIndex);
		toggleChange("excludeFromPublish", modIndex-1, "item");
		toggleChange("choiceExit", modIndex);
		toggleChange("previous", modIndex);
		toggleChange("continue", modIndex);
		toggleChange("exit", modIndex);
		toggleChange("exitAll", modIndex);
		toggleChange("abandon", modIndex);
		toggleChange("abandonAll", modIndex);
		toggleChange("suspendAll", modIndex);
		toggleChange("tracked", modIndex);
		toggleChange("completionSetByContent", modIndex);
		toggleChange("objectiveSetByContent", modIndex);
		toggleChange("rollupObjectiveSatisfied", modIndex);
		toggleChange("rollupProgressCompletion", modIndex);
		toggleChange("testReview", modIndex);

		$('#notAttemptHidden').on("change", function(){
			if($(courseData).find('sequencing').eq(modIndex).find('sequencingRules').find('notattempthidden').length == 0){
				$(courseData).find('sequencing').eq(modIndex).find('sequencingRules').append($('<notattempthidden/>', courseData));
			}

			if($('#notAttemptHidden').prop('checked')){
			   $(courseData).find('sequencing').eq(modIndex).find('sequencingRules').find('notattempthidden').attr('value', "true");
			} else{
			   $(courseData).find('sequencing').eq(modIndex).find('sequencingRules').find('notattempthidden').attr('value', "false");
			}
			updateCourseXML();
		});

		var currentROMWeight = $("#rollupObjectiveMeasureWeight").val();
		$(function () {
			//$("div[id$='Radio']").buttonset();
			$("input[id$='Checkbox']").button();

			//setup for rollupObjectiveMeasureWeight spinner
			$("#rollupObjectiveMeasureWeight").spinner({
				step: 0.01,
				numberFormat: "n",
				max: 1,
				min: 0,
				stop: function(event, ui){
					if(currentROMWeight != $("#rollupObjectiveMeasureWeight").val()){
						currentROMWeight = $("#rollupObjectiveMeasureWeight").val();
						$(courseData).find('sequencing').eq(modIndex).attr("rollupObjectiveMeasureWeight", $("#rollupObjectiveMeasureWeight").val());
						updateCourseXML();
					}
				}
			}).val($(courseData).find('sequencing').eq(modIndex).attr("rollupObjectiveMeasureWeight"));

			//prevent user manual input in spinner
			$("#rollupObjectiveMeasureWeight").bind("keydown", function (event){
				event.preventDefault();
			});

			//set up jquerui accordion
			$("#accordion").accordion({
				collapsible: true,
				heightStyle: "content"
			});
		});

     }

     function addToggle(_id, title){
     	var msg = '<div id="toggleWrapper" style="float: left;"><div id="' + _id + 'Text" style="width:400px; float: left; margin: 8px">' + title + '</div>';
     	msg += '<div id="' + _id + 'Radio" title="'+title+'" style="float: left;">';
		// msg += '<input type="radio" id="' + _id + 'true" name="' + _id + 'Radio" /><label for="' + _id + 'true" title="Set ' + _id + ' to true.">true </label>';
		// msg += '<input type="radio" id="' + _id + 'false" name="' + _id + 'Radio" /><label for="' + _id + 'false" title="Set ' + _id + ' to false">false</label>';
		//msg += '</div></div>';
     	msg += '<div class="onoffswitch">';
		msg += '	<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="' + _id + '" >';
		msg += '	<label class="onoffswitch-label" for="' + _id + '">';
		msg += '	    <span class="onoffswitch-inner"></span>';
		msg += '	    <span class="onoffswitch-switch"></span>';
		msg += '	</label>';
		msg += '</div>';
		msg += '</div></div>';
		return msg;
     }

     function setToggle(_id, index, element){
     	if(index == -1){
			if($(courseData).find("course").attr(_id) === "true"){
				$('#'+_id).prop('checked',true);
			}
			else{
				$('#'+_id).prop('checked',false);
			}
     	}
     	else{
     		//if element parameter not defined then default to sequencing
     		var _xmlElement = (element === undefined) ? 'sequencing' : element;

			if($(courseData).find(_xmlElement).eq(index).attr(_id) === "true"){
				$('#'+_id).prop('checked',true);
			}
			else{
				$('#'+_id).prop('checked',false);
			}
     	}

     }

     function toggleChange(_id, index, element){
     	if(index == -1){
			$('#'+_id+'Radio').on("change", function(){
			   if($('#'+_id).prop('checked')){
				   $(courseData).find("course").attr(_id, "true");
			   } else{
				   $(courseData).find("course").attr(_id, "false");
			   }
			   updateCourseXML();
			});
     	}
     	else{
     		//if element parameter not defined then default to sequencing
     		var _xmlElement = (element === undefined) ? 'sequencing' : element;

     		//check attr exists
     		if(!$(courseData).find(_xmlElement).eq(index).attr(_id)){
				$(courseData).find(_xmlElement).eq(index).attr(_id, "false");
     		}

			$('#'+_id+'Radio').on("change", function(){
			   if($('#'+_id).prop('checked')){
				   $(courseData).find(_xmlElement).eq(index).attr(_id, "true");
			   } else{
				   $(courseData).find(_xmlElement).eq(index).attr(_id, "false");
			   }
			   updateCourseXML();
			});
     	}
     }


     function updateCourseXML(_commit){
	    var myData = $(courseData);
		var xmlString;
		//IE being a beatch, as always - have handle xml differently.
		if (window.ActiveXObject){
	        xmlString = myData[0].xml;
		}

		var commit = true;
		if(_commit == false){
			commit = false;
		}

		if(xmlString === undefined){
			var oSerializer = new XMLSerializer();
			xmlString = oSerializer.serializeToString(myData[0]);
		}

		var pd = new pp();
		var tempXmlString = pd.xml(xmlString);
		var tmpPath = courseXMLPath.replace(new RegExp("%20", "g"), ' ');
		socket.emit('updateCourseXML', { myXML: tempXmlString , courseXMLPath: tmpPath, commit: commit, user: user ,content: {
        	id: courseID,
            type: currentCourseType,
            permission: currentCoursePermission
            }
		});
     }

     /****************************************************************
     * Serialize XML and send it to the server.
     ****************************************************************/
     function updateModuleXML(_id, _commit, _refresh){
	 	var myData = $(module_arr[_id].xml);
		var xmlString;

		//IE being a beatch, as always - have handle xml differently.
		if (window.ActiveXObject){
	        xmlString = myData[0].xml;
		}

		if(xmlString === undefined){
			var oSerializer = new XMLSerializer();
			xmlString = oSerializer.serializeToString(myData[0]);
		}

		var commit = true;
		if(_commit == false){
			commit = false;
		}

		var refresh = false;
		if(_refresh == true){
			refresh = true;
		}
		var pd = new pp();
		var xmlString  = pd.xml(xmlString);

		var moduleXMLPath = module_arr[_id].xmlPath.replace(new RegExp("%20", "g"), ' ');
		socket.emit('updateModuleXML', { myXML: xmlString, moduleXMLPath: moduleXMLPath, commit: commit, refresh: refresh, user: user ,content: {
        	id: courseID,
            type: currentCourseType,
            permission: currentCoursePermission
            }
		});
     }

     function displayPageData(_id){
     	var matched = false;
     	for(var i = 0; i < module_arr.length; i++){
		    for(var j = 0; j < $(module_arr[i].xml).find("page").length; j++){
		    	if(_id == $(module_arr[i].xml).find("page").eq(j).attr("id")){
			    	matched = true;
			    	currentPageParentModule = i;
			    	currentPage = j;

			    	var userTemplateName = getKey($(module_arr[i].xml).find('page').eq(j).attr("layout"));

			     	$("#outlinePagePrefPane").empty();
				 	var msg = "<div class='outlinePageEditHeader'><b>Page Preferences: " + $(module_arr[i].xml).find('page').eq(j).find("title").first().text().trim() + "</div>";
				 	msg += "<div><b>Details:</b></div>";
				 	msg += "<b>page type: </b>" + userTemplateName + "  <button id='panePagePreview'>preview</button><br/>";
			     	msg += "<label for='out_pageTitle' title='Update the page title.'>page title: </label>";
			        msg += '<input type="text" name="out_pageTitle" id="out_pageTitle" value="'+$(module_arr[i].xml).find('page').eq(j).find("title").first().text().trim()+'" class="text ui-widget-content ui-corner-all" /> <br/>';
			        //display tlo
			        msg += '<b>terminal objective: </b>' + $(module_arr[i].xml).find('tlo').attr('value') + '<br/>';
					//enter elo
			     	msg += "<label for='eo' title='Update the enabling objective.'>enabling objective: </label>";
			        msg += '<input type="text" name="eo" id="eo"  value="undefined" class="text ui-widget-content ui-corner-all" /> <br/>';
			     	msg += "<label for='out_pageObjective'";
			     	msg += 'title="Update the learner friendly objective description or reference to this page in the lesson. This value is used on completion pages to show missed objectives to students.">objective description: </label>';
			        msg += '<input type="text" name="out_pageObjective" id="out_pageObjective"';

			        msg += 'value="'+ $(module_arr[i].xml).find('page').eq(j).attr("objective") + '" class="text ui-widget-content ui-corner-all" /> <br/>';

					//enter tlo referenced for assessments
			        if($(module_arr[i].xml).find('page').eq(j).attr("type") == "kc"){
						msg += "<label for='objItemId' title='Name of the modules or lesson the objective is mapped to.'>module or lesson mapped (highest level): </label>";
				     	msg += "<select name='objItemId' id='objItemId'>";
				     	//for loop through items in course.xml
						for(var k = 0; k < $(courseData).find("item").length; k++){
							var itemId = $(courseData).find("item").eq(k).attr('id');
							var itemName = $(courseData).find("item").eq(k).attr('name');
							var itemTLO = $(courseData).find("item").eq(k).attr('tlo');
							msg += '<option value ="'+itemId+'"';
							if(itemId == $(module_arr[i].xml).find('id').attr('value')){
								msg += ' selected';
							}
							msg += '>'+itemName+' : '+itemTLO+'</option>';
						}
				     	msg += "</select><br/>";
			     	}

				 	$("#outlinePagePrefPane").append(msg);

			     	//if objItemId not set set to current in xml
					if($(module_arr[i].xml).find('page').eq(j).attr("type") == "kc"){
						if($(module_arr[i].xml).find('page').eq(j).attr("objItemId")){
							if($(module_arr[i].xml).find('page').eq(j).attr("objItemId") == 'undefined'){
								$(module_arr[i].xml).find('page').eq(j).attr("objItemId",$('#objItemId option:selected').val());
								updateModuleXML(currentPageParentModule);
							}
							else{
								$('#objItemId').val($(module_arr[i].xml).find('page').eq(j).attr("objItemId"));
							}

						}
						else{
							$(module_arr[i].xml).find('page').eq(j).attr("objItemId",$('#objItemId option:selected').val());
							updateModuleXML(currentPageParentModule);
						}
					}

			     	//add .on change for objItemId
			     	$('#objItemId').on("change", function(){
						$(module_arr[i].xml).find('page').eq(j).attr("objItemId",$('#objItemId option:selected').val());
						updateModuleXML(currentPageParentModule);
			     	});

				 	$("#panePagePreview").button().click(function(){
						clickPreview(userTemplateName);
					});

					//set enabling based off value in xml
					if($(module_arr[i].xml).find('page').eq(j).attr("eo")){
						$("#eo").val($(module_arr[i].xml).find('page').eq(j).attr("eo"));
					}

					// update the xml when the enabling is changed
				    $("#eo").on("change", function(){
					    $(module_arr[i].xml).find('page').eq(j).attr("eo", $("#eo").val().replace('<p>', '').replace('</p>', '').trim());
					    updateModuleXML(currentPageParentModule);
				    }).css({'width': '500px', 'color': '#3383bb;'});

				 	$("#out_pageTitle").on("change", function(){
				     	//ADD CODE TO PROPERLY RENAME LESSON ---------------------------------------------------------------------------------------------------------------
				     	var titleUpdate = $("#out_pageTitle").val().replace('<p>', '').replace('</p>', '').trim();
				     	currentMenuItem.text(titleUpdate);
					   	var docu = new DOMParser().parseFromString('<title></title>',  "application/xml");
					   	var newCDATA=docu.createCDATASection(titleUpdate);
					   	$(module_arr[i].xml).find('page').eq(j).find("title").first().empty();
					   	$(module_arr[i].xml).find('page').eq(j).find("title").first().append(newCDATA);
						updateModuleXML(currentPageParentModule);
				    }).css({'width': '500px', 'color': '#3383bb;'});

				    $("#out_pageObjective").on("change", function(){
				     	//ADD CODE TO PROPERLY RENAME LESSON ---------------------------------------------------------------------------------------------------------------
				     	var titleUpdate = $("#out_pageObjective").val().trim();
					   	$(module_arr[i].xml).find('page').eq(j).attr('objective', titleUpdate);
						updateModuleXML(currentPageParentModule);
				    }).css({'width': '500px', 'color': '#3383bb;'});
			     	break;
		     	}
		     }
		     if(matched){
			     break;
		     }
		 }
     }

	/************************************************************************************************
	Function: 		addOutlineRollovers
	Param: 			myItem = The term to attach the rollover functionality to.
					level = Whether it is a module or a page.
	Description:	Called when a user rolls over an existing outline item.
	The buttons listeners attach click actions for adding and removing content on the sub buttons.
	************************************************************************************************/
	function addOutlineRollovers(myItem, _level){
		//ADD Program Level Buttons
	    myItem.hover(
	    	function () {
	    		//$(this).append("<div id='outlineAdd' class='outlineModuleAdd'></div><div id='outlineRemove' class='outlineModuleRemove'></div>");

	            //ADD apropriate title attributes for the toolitp hints on rollovers...
	            if(_level == "module"){
		            $(this).append("<div id='outlineRemove' class='outlineModuleRemove'></div>");
		            //$("#outlineAdd").attr("title", "Add a new lesson to your module.");
		            $("#outlineRemove").attr("title", "Remove this module from your course.");
	            }else if (_level == "page"){
		            $(this).append("<div id='outlineAdd' class='outlineModuleAdd'></div><div id='outlineRemove' class='outlineModuleRemove'></div>");
		            $("#outlineRemove").attr("title", "Remove this page from your module.");
		            $("#outlineAdd").attr("title", "Add a new page to your module.");
	            }

	            //ADD ADD NAV
	            $("#outlineAdd").click(function(){
	            	if(_level == "module"){
	            		addLessonToModule(myItem.attr("data-id"));
	            	}else{
		            	addPageToModule(myItem.attr("myID"));
	            	}
		        }).hover(
	            	function () {
	                	hoverSubNav = true;
	                },
					function () {
	                	hoverSubNav = false;
	                }
	            ).tooltip({
	            	show: {
	                	delay: 1500,
	                    effect: "fadeIn",
	                    duration: 200
	                }
	            });

	            //ADD REMOVE NAV
	            $("#outlineRemove").click(function(){
	            	if(_level == "module"){
	            		removeModuleFromCourse(myItem.attr("data-id"));
	            	}else{
		            	removePageFromModule(myItem.attr("myID"), myItem);
	            	}
		        }).hover(
	            	function () {
	                	hoverSubNav = true;
	                },
					function () {
	                	hoverSubNav = false;
	                }
	            ).tooltip({
	            	show: {
	                	delay: 1500,
	                    effect: "fadeIn",
	                    duration: 200
	                }
	           });
	        },
	        function () {
				$("#outlineAdd").remove();
				$("#outlineRemove").remove();
			});
	}

	/*******************************************************************************
	ADD and REMOVE FUNCTIONS
	*******************************************************************************/

	/************************************************************************************************
	Function: 		addModuleToCourse
	Param: 			_id = ID of the course to be added to.
	Description:	Creates a new module in the identified course.
	************************************************************************************************/
	function addModuleToCourse(_id){
		var  msg = '<div id="dialog-registerContent" title="Add New Lesson">';
		msg += '<p class="validateTips">You are adding a new module to the ' + myItem.find("span").first().text() + ' course.</p>';
		msg += '<p>Fill in the details below for your new module.</p>';
		msg += '<label for="myName" class="regField">name: </label>';
		msg += '<input type="text" name="myName" id="myName" value="" class="regText text ui-widget-content ui-corner-all" /><br/>';
		msg += '<label for="tlo" class="regField">tlo: </label>';
		msg += '<input type="text" name="tlo" id="tlo" value="" class="regText text ui-widget-content ui-corner-all" />';
		msg += '</div>';
		$("#stage").append(msg);
		$("#myName").alphanum();
		$("#dialog-registerContent").dialog({
        	modal: true,
            width: 550,
            close: function (event, ui) {
                $("#dialog-registerContent").remove();
            },
            buttons: {
                Submit: function(){
                	//Build the module data object to submit to the server.
                	refreshExpected = true;
                	var nameString = $("#myName").val();
                	var tloString = $('#tlo').val();
                	var content = {
			            name: nameString,
			            tlo: tloString,
			            user: user,
			            course: {
			                id: courseID
			            },
			            parentName: myItem.find("span").first().text()
			        };
			        socket.emit("registerLesson", content);
			        $(this).dialog("close");								    //Close dialog.
                },
                Cancel: function () {
                	$(this).dialog("close");
                }
            }
        });
	}

	/************************************************************************************************
	Function: 		addLessonToModule
	Param: 			_id = ID of the module to be added to.
	Description:	Creates a new lesson in the identified module and a page inside the lesson.
					Adds lesson to the end of the module.  Can then be dragged.
	************************************************************************************************/
	function addLessonToModule(_id){
		console.log("_id = " + _id);
	}

	/************************************************************************************************
	Function: 		addPageToModule
	Param: 			_id = ID of the module to be added to.
	Description:	Creates a new page in the identified module.
					Creates the page after the page being added from.
	************************************************************************************************/
	function addPageToModule(_id){
		var opt_arr = ["application", "analysis", "comprehension", "evaluation", "knowledge", "problem solving", "synthesis"];
		var content_arr = ["concepts", "facts", "principle", "procedures", "process"];
		var demoapp_arr = ["demonstration", "practice, testing"];


		var pages= [
			{
				"capability" : ["textOnly", "mediaOnly", "textAboveMedia", "textLeftofMedia", "textRightofMedia", "textBelowMedia", "sidebar", "clickImageFullText", "textAboveTabs", "tabsLeftMediaRight", "clickImageRevealText", "clickListFullText", "completion"],
				"opt" : ["comprehension", "knowledge"],
				"content" : ["facts"],
				"demoapp" : "demonstration"
			},
			{
				"capability" : ["flashcard", "dragOrdering", "multipleChoice", "multipleChoiceMedia", "matching", "questionBank", "inputAnswer", "dragSlider", "completion" ],
				"opt" : ["comprehension", "knowledge"],
				"content" : ["facts"],
				"demoapp" : "practice, testing"
			},			
			{
				"capability" : ["textOnly", "textAboveMedia", "textLeftofMedia", "textRightofMedia", "textBelowMedia", "sidebar", "clickImageFullText", "textAboveTabs", "tabsLeftMediaRight", "clickImageRevealText", "clickListFullText", "completion"],
				"opt" : ["application", "analysis"],
				"content" : ["concepts"],
				"demoapp" : "demonstration"
			},
			{
				"capability" : ["flashcard", "multipleChoice", "multipleChoiceMedia", "matching", "questionBank", "inputAnswer", "inputExpertCompare", "completion" ],
				"opt" : ["application", "analysis"],
				"content" : ["concepts"],
				"demoapp" : "practice, testing"
			},
			{
				"capability" : ["mediaOnly", "textAboveMedia", "textLeftofMedia", "textRightofMedia", "textBelowMedia", "clickImageFullText", "textAboveTabs", "tabsLeftMediaRight", "clickImageRevealText", "clickListFullText", "branchingPractice", "completion"],
				"opt" : ["application", "analysis"],
				"content" : ["procedures"],
				"demoapp" : "demonstration"
			},
			{
				"capability" : ["dragOrdering", "multipleChoice", "multipleChoiceMedia", "matching", "questionBank", "inputAnswer", "inputExpertCompare", "branchingPractice", "branchingDecisions", "branchingLinearPaths", "completion" ],
				"opt" : ["application", "analysis"],
				"content" : ["procedures"],
				"demoapp" : "practice, testing"
			},
			{
				"capability" : ["mediaOnly", "textAboveMedia", "textLeftofMedia", "textRightofMedia", "textBelowMedia", "clickImageFullText", "textAboveTabs", "tabsLeftMediaRight", "clickImageRevealText", "clickListFullText", "branchingPractice", "completion"],
				"opt" : ["application", "analysis"],
				"content" : ["process"],
				"demoapp" : "demonstration"
			},
			{
				"capability" : ["dragOrdering", "multipleChoice", "multipleChoiceMedia", "matching", "questionBank", "inputAnswer", "inputExpertCompare", "branchingPractice", "branchingDecisions", "branchingLinearPaths", "completion" ],
				"opt" : ["application", "analysis"],
				"content" : ["process"],
				"demoapp" : "practice, testing"
			},
			{
				"capability" : ["textOnly", "textAboveMedia", "textLeftofMedia", "textRightofMedia", "textBelowMedia", "sidebar", "clickImageFullText", "textAboveTabs", "tabsLeftMediaRight", "clickImageRevealText", "clickListFullText", "branchingPractice", "completion"],
				"opt" : ["application", "analysis"],
				"content" : ["principle"],
				"demoapp" : "demonstration"
			},
			{
				"capability" : ["dragOrdering", "multipleChoice", "multipleChoiceMedia", "matching", "questionBank", "inputAnswer", "inputExpertCompare", "branchingPractice", "branchingDecisions", "branchingLinearPaths", "completion" ],
				"opt" : ["application", "analysis"],
				"content" : ["principle"],
				"demoapp" : "practice, testing"
			},
			{
				"capability" : ["mediaOnly", "textAboveMedia", "textLeftofMedia", "textRightofMedia", "textBelowMedia", "clickImageFullText", "textAboveTabs", "tabsLeftMediaRight", "clickImageRevealText", "clickListFullText", "branchingPractice", "completion"],
				"opt" : ["problem solving", "synthesis"],
				"content" : ["procedures"],
				"demoapp" : "demonstration"
			},
			{
				"capability" : ["dragOrdering", "multipleChoice", "multipleChoiceMedia", "matching", "questionBank", "inputAnswer", "inputExpertCompare", "branchingPractice", "branchingDecisions", "branchingLinearPaths", "completion" ],
				"opt" : ["problem solving", "synthesis"],
				"content" : ["procedures"],
				"demoapp" : "practice, testing"
			},
			{
				"capability" : ["mediaOnly", "textAboveMedia", "textLeftofMedia", "textRightofMedia", "textBelowMedia", "clickImageFullText", "textAboveTabs", "tabsLeftMediaRight", "clickImageRevealText", "clickListFullText", "branchingPractice", "completion"],
				"opt" : ["problem solving", "synthesis"],
				"content" : ["process"],
				"demoapp" : "demonstration"
			},
			{
				"capability" : ["dragOrdering", "multipleChoice", "multipleChoiceMedia", "matching", "questionBank", "inputAnswer", "inputExpertCompare", "branchingPractice", "branchingDecisions", "branchingLinearPaths", "completion" ],
				"opt" : ["problem solving", "synthesis"],
				"content" : ["process"],
				"demoapp" : "practice, testing"
			},	
			{
				"capability" : ["textOnly", "mediaOnly", "textAboveMedia", "textLeftofMedia", "textRightofMedia", "textBelowMedia", "sidebar", "clickImageFullText", "textAboveTabs", "tabsLeftMediaRight", "clickImageRevealText", "clickListFullText", "branchingPractice", "completion"],
				"opt" : ["problem solving", "synthesis"],
				"content" : ["principle"],
				"demoapp" : "demonstration"
			},																										
			{
				"capability" : ["dragOrdering", "multipleChoice", "multipleChoiceMedia", "matching", "questionBank", "inputAnswer", "inputExpertCompare", "branchingPractice", "branchingDecisions", "branchingLinearPaths", "completion" ],
				"opt" : ["problem solving", "synthesis"],
				"content" : ["principle"],
				"demoapp" : "practice, testing"
			},	
			{
				"capability" : ["textOnly", "mediaOnly", "textAboveMedia", "textLeftofMedia", "textRightofMedia", "textBelowMedia", "sidebar", "clickImageFullText", "textAboveTabs", "tabsLeftMediaRight", "clickImageRevealText", "clickListFullText", "branchingPractice", "completion"],
				"opt" : ["evaluation"],
				"content" : ["procedures", "process", "principle"],
				"demoapp" : "demonstration"
			},																										
			{
				"capability" : ["dragOrdering", "multipleChoice", "multipleChoiceMedia", "matching", "questionBank", "inputAnswer", "inputExpertCompare", "dragSlider", "branchingPractice", "branchingDecisions", "branchingLinearPaths", "completion" ],
				"opt" : ["evaluation"],
				"content" : ["procedures", "process", "principle"],
				"demoapp" : "practice, testing"
			}				
		];

		var msg = '<div id="dialog-addPage" title="Add Page"><p class="validateTips">Complete the advanced or basic form to create your new page.</p>';
     	msg += "<div id='addPageAccordion'>";
     	msg += "<h3 style='padding: .2em .2em .2em 2.2em'>Advanced</h3>";
     	msg += '<div id="advanced" style="font-size:100%; padding: 1em 1em; color:#666666">';
		//Add the content type dropdown
		msg += '<div><label for="contentTypeList">Select a content type:</label><select id="contentTypeList" name="contentTypeList">';
		msg += '<option value=""></option>';
		for(var i=0; i < content_arr.length; i++){
			msg += '<option value="' + content_arr[i]+ '">' + content_arr[i] + '</option>';
		}
		msg += '</select></div>';

		//Add the objective performance type dropdown
		msg += '<div id="advancedOpType"><label for="opTypeList">Select a objective performance type:</label><select id="opTypeList" name="opTypeList">';
		msg += '<option value=""></option>';
		for(var i=0; i < opt_arr.length; i++){
			msg += '<option value="' + opt_arr[i]+ '">' + opt_arr[i] + '</option>';
		}
		msg += '</select></div>';

		//Add the action verbs dropdown
		msg += '<div id="advancedActionVerbs"><label for="actionVerbsList">Select an action verb:</label><select id="actionVerbsList" name="actionVerbsList"/>';
		msg += '</div>';

		//Add the demo/application dropdown
		msg += '<div id="advancedDemoApp"><label for="demoApp">Select a demonstration or practice/testing:</label><br/>'+
				'<input type="radio" name="demoApp" id="demoApp" value="demonstration">demonstration'+
				'<input type="radio" name="demoApp" id="demoApp" value="practice, testing">practice, testing';

		msg += '</div>';		

		//Add the page type dropdown
		msg += '<div id="advancedPageType"><label for="pageTypeList">Select a page type:</label><select id="pageTypeList" name="pageTypeList">';
		// for(var i=0; i < pages.length; i++){
		// 	msg += '<option value="' + pages[i].capability + '">' + pages[i].capability + '</option>';
		// }
		for(var i=0; i < pageType_arr.length; i++){
			msg += '<option value="' + pageType_arr[i] + '">' + pageType_arr[i] + '</option>';
		}
		msg += '</select>';

		//ADD PREVIEW BUTTON
		msg += '<button id="preview">preview</button>';
		//end div tag for pageTypeList
		msg += '</div>';

		msg += '<br/><div id="advancedName"><label for="myName" class="regField">name: </label>'+
				'<input type="text" name="myName" id="myName" value="new page" class="regText text ui-widget-content ui-corner-all" /></div><br/><br/>';
		msg += '<div id="advancedElo"><label for="elo" class="regField">elo: </label>'+
				'<input type="text" name="elo" id="elo" value="undefined" class="regText text ui-widget-content ui-corner-all" /></div><br/><br/>';

		//end advanced div
		msg += '</div>';
     	msg += "<h3 style='padding: .2em .2em .2em 2.2em'>Basic</h3>";
     	msg += '<div id="basic" style="font-size:100%; padding: 1em 1em; color:#666666">';
		//Add the page type dropdown
		msg += '<div id="basicPageType"><label for="basicPageTypeList">Select a page type:</label><select id="basicPageTypeList" name="basicPageTypeList">';
		for(var i=0; i < pageType_arr.length; i++){
			msg += '<option value="' + pageType_arr[i] + '">' + pageType_arr[i] + '</option>';
		}
		msg += '</select>';

		//ADD PREVIEW BUTTON
		msg += '<button id="basicPreview">preview</button>';
		//end div tag for pageTypeList
		msg += '</div>';

		msg += '<br/><div id="basicName"><label for="basicMyName" class="regField">name: </label>'+
				'<input type="text" name="basicMyName" id="basicMyName" value="new page" class="regText text ui-widget-content ui-corner-all" /></div><br/><br/>';
		msg += '<div id="basicEloWrap"><label for="basicElo" class="regField">elo: </label>'+
				'<input type="text" name="basicElo" id="basicElo" value="undefined" class="regText text ui-widget-content ui-corner-all" /></div><br/><br/>';
     	//end basic div
     	msg += '</div>';		
		//end accordion div
		msg += '</div>'
		//end dialog-addPage
		msg += '</div>';

		$("#stage").append(msg);



		$("#dialog-addPage").dialog({
        	modal: true,
            width: 600,
            height: 535,
            close: function (event, ui) {
                $("#dialog-addPage").remove();
            },
            buttons: {
                Submit: function(){
                	//detect active accordion to know which values to use on submit
                	if($("#addPageAccordion").accordion("option", "active") == 0){
                		var newPageType = $("#pageTypeList").val();
						createNewPageByType(getTemplate(newPageType), $("#myName").val(), $('#elo').val(), _id);
	                	$(this).dialog("close");
                	}
                	else{
                		var newBasicPageType = $("#basicPageTypeList").val();
  						createNewPageByType(getTemplate(newBasicPageType), $("#basicMyName").val(), $('#basicElo').val(), _id);
	                	$(this).dialog("close");              		
                	}
                },
                Cancel: function () {
                	$(this).dialog("close");
                }
            },
            open: function(){
				//set up jquerui accordion
				$("#addPageAccordion").accordion({
					collapsible: true,
					heightStyle: "fill"
				});	            	
            }
        });
		$(function() {
			$("#advancedOpType" ).hide();//.prop('disabled', true);
			$("#advancedPageType" ).hide()//.prop('disabled', true);
			$("#advancedActionVerbs").hide();
			$("#advancedDemoApp").hide();
			$("#advancedName").hide();
			$("#advancedElo").hide();
		
			$("#contentTypeList").on("change", function() {
				setOpTypeList();				
				$("#advancedOpType" ).show();//.prop('disabled', false);
				if($("#advancedName").is(":visible")){
					filterPageList(pages);
					setActionVerbsList();
				}
			});

			$("#opTypeList").on("change", function() {
				setActionVerbsList();
				$("#advancedActionVerbs").show();
				if($("#advancedName").is(":visible")){
					filterPageList(pages);
				}
			});

			$("#actionVerbsList").on("change", function(){
				$("#advancedDemoApp").show();
			});

			$("input[name=demoApp]:radio").on("change",function(){
				$("#advancedPageType" ).show();//.prop('disabled', false);
				$("#advancedName").show();
				$("#advancedElo").show();		
				filterPageList(pages);
			});

					
		});

		$("#preview, #basicPreview").button().click(function(){
        	//detect active accordion to know which values to use on submit
        	if($("#addPageAccordion").accordion("option", "active") == 0){			
				clickPreview($("#pageTypeList").val());
			}
			else{
				clickPreview($("#basicPageTypeList").val());
			}
		});
	}

	/**
	* #3600 Util function to get template file name from key
	**/
	function getTemplate(key){
		return templateNameMap[key];
	}

	/**
	* #3600 util function to get the key (User template name) from the template file name (code template name)
	**/
	function getKey(template){
		for( var prop in templateNameMap){
			if( templateNameMap.hasOwnProperty( prop )){
				if(templateNameMap[ prop ] == template){
					return prop;
				}
			}
		}
	}	

	function setActionVerbsList(){
		$("select#actionVerbsList option").remove();
		var opTypeValue = $("#opTypeList").val();
		if(opTypeValue === "knowledge"){
			var knowledge_arr = ["","identify", "name", "recite", "recall", "report", "share information"];
			for (var i = 0; i < knowledge_arr.length; i++) {
				$("#actionVerbsList").append($("<option></option>").attr("value", knowledge_arr[i]).text(knowledge_arr[i]));
			};						
		}
		else if(opTypeValue === "comprehension"){
			var comprehension_arr = ["","reflect", "look up", "find out", "define", "state", "list", "indicate", "restate", "describe",
			 "explain", "narrate", "collect data", "share information", "represent", "show", "interpret", "relate", "write"];
			for (var i = 0; i < comprehension_arr.length; i++) {
				$("#actionVerbsList").append($("<option></option>").attr("value", comprehension_arr[i]).text(comprehension_arr[i]));
			};		
		}
		else if(opTypeValue === "application"){
			var application_arr = ["", "contrast", "compare", "classify", "sort", "perform", "follow procedure", "compute", "demonstrate",
			 "dramatize", "employ", "operate", "practice", "prepare", "schedule", "show", "sketch", "use", "record", "administer", "inject",
			  "infuse", "attach", "decrease/increase", "reduce/elevate", "inform", "sterilize", "prepare"];
			for (var i = 0; i < application_arr.length; i++) {
				$("#actionVerbsList").append($("<option></option>").attr("value", application_arr[i]).text(application_arr[i]));
			};
		}
		else if (opTypeValue === "analysis"){
			var analysis_arr = ["", "examine", "discover", "decode", "derive", "deduce", "interpret", "isolate", "assess", "quantify" ];
			for (var i = 0; i < analysis_arr.length; i++) {
				$("#actionVerbsList").append($("<option></option>").attr("value", analysis_arr[i]).text(analysis_arr[i]));
			};			
		}
		else if (opTypeValue === "problem solving"){
			var problemSolving_arr = ["", "diagnose", "decide", "plan", "formulate", "design", "organize", "solve", "resolve", "demonstrate",
			 "execute", "implement", "substitute", "hypothesize", "change", "choose", "manipulate", "modify", "produce", "prescribe", "isolate",
			 "quantify", "administer", "stabilize", "interpret", "treat", "prevent", "clear", "resuscitate/revive" ];
			for (var i = 0; i < problemSolving_arr.length; i++) {
				$("#actionVerbsList").append($("<option></option>").attr("value", problemSolving_arr[i]).text(problemSolving_arr[i]));
			}			
		}
		else if (opTypeValue === "synthesis"){
			var synthesis_arr = ["", "brainstorm", "identify alternatives", "forecast", "discover", "combine", "generalize", "summarize",
			 "transfer", "prioritize", "select", "justify", "propagate", "analogize", "find the procedure", "predict", "stabilize", "interpret",
			 "treat", "prevent", "clear"];
			for (var i = 0; i < synthesis_arr.length; i++) {
				$("#actionVerbsList").append($("<option></option>").attr("value", synthesis_arr[i]).text(synthesis_arr[i]));
			}		
		}
		else if (opTypeValue === "evaluation"){
			var evaluation_arr = ["", "evaluate", "judge", "correct", "prove", "test", "measure", "check answers", "critique", "assess"];
			for (var i = 0; i < evaluation_arr.length; i++) {
				$("#actionVerbsList").append($("<option></option>").attr("value", evaluation_arr[i]).text(evaluation_arr[i]));
			}				
		}
	}

	function setOpTypeList(){
		//["application", "analysis", "comprehension", "evaluation", "knowledge", "problem solving", "synthesis"];
		$("select#opTypeList option").remove();
		$("#opTypeList").append($("<option></option>").attr("value", "").text(""));
		var contentTypeValue = $("#contentTypeList").val();
		if(contentTypeValue === "facts"){
			$("#opTypeList").append($("<option></option>").attr("value", "knowledge").text("knowledge"));
			$("#opTypeList").append($("<option></option>").attr("value", "comprehension").text("comprehension"));
		}
		else if(contentTypeValue === "concepts"){
			$("#opTypeList").append($("<option></option>").attr("value", "application").text("application"));
			$("#opTypeList").append($("<option></option>").attr("value", "analysis").text("analysis"));			
		}
		else{
			$("#opTypeList").append($("<option></option>").attr("value", "application").text("application"));
			$("#opTypeList").append($("<option></option>").attr("value", "analysis").text("analysis"));	
			$("#opTypeList").append($("<option></option>").attr("value", "evaluation").text("evaluation"));
			$("#opTypeList").append($("<option></option>").attr("value", "problem solving").text("problem solving"));	
			$("#opTypeList").append($("<option></option>").attr("value", "synthesis").text("synthesis"));			
		}
	}

	/************************************************************************************************
	Function: 		filterPageList
	Param: 			_pages = pages to filter
	Description:	Create suggestions for page types based on Objectives.
	************************************************************************************************/
	function filterPageList(_pages){

		var capabilities = '';
		$("select#pageTypeList option").remove();

		for(var j=0; j < _pages.length; j++){

			if($.inArray($("#contentTypeList").val(), _pages[j].content) != -1 ){//|| $("#contentTypeList").val() == ""){
				if($.inArray($("#opTypeList").val(), _pages[j].opt) != -1){
					if($("#advancedDemoApp input[name=demoApp]:checked").val() === _pages[j].demoapp){
						capabilities = _pages[j].capability;
					}
				}
			}

		}

		for(var t=0; t <capabilities.length; t++){
			$("#pageTypeList").append($("<option></option>").attr("value", capabilities[t]).text(capabilities[t]));
		}

	}

	/************************************************************************************************
	Function: 		setupGallery
	Param: 			mediaType = Identifier of media type - String.
	Description:	Builds a popup example when button clicked.
	************************************************************************************************/
	function clickPreview(mediaType){
		var img_arr = [];
		for(var i = 0; i < pageTypeExamples.length; i++){
			if(pageTypeExamples[i].type == mediaType){
				for(var j = 0; j < pageTypeExamples[i].images.length; j++){
					var tempObj = new Object();
					tempObj.src = "media/examples/"+ pageTypeExamples[i].images[j];
					tempObj.title = mediaType + " example";
					img_arr.push(tempObj);
				}

				$.magnificPopup.open({
					items: img_arr,
					type: 'image',
					closeOnContentClick: false,
					mainClass: 'mfp-with-zoom mfp-img-mobile',
					image: {
						verticalFit: true
					},
					gallery: {
						enabled: true, 
						preload: [0,1], 
						navigateByImgClick: false
					}
				});

			    return false;

			    break;
			}
		}
	}

	/************************************************************************************************
	Function: 		createNewPageByType
	Param: 			_myType = Identifier of page type - String.
	Description:	Creates node and page data in the xml object.
	************************************************************************************************/
	function createNewPageByType(_myType, _myTitle, elo, _id){
		//Create a Unique ID for the page
		var myID = guid();
		var myNode = getNode(_id);
		var myTitle;
		if (/\S/.test(_myTitle)) {
			myTitle = _myTitle;
		}else{
			myTitle = "new page";
		}
		//Place a page element
		var myAddAfter = myNode.node;							//Variable for the node id
		var myModule = myNode.module;						//Parent module.
		var myModuleID = module_arr[myNode.module].id;		//module ID in case needed ----- probably can remove - leaving for now...
		var myNodeLevel = myNode.level;						//Level that the button resides on ("module", "page" so far)...
		var myXML = module_arr[myNode.module].xml;

		//Find insert location
		for (var i = 0; i < $(myXML).find("page").length; i++){
			if(_id == $(myXML).find("page").eq(i).attr("id")){
				var insertPoint = i;
			}
		}

		$(myXML).find("page").eq(insertPoint).after($('<page id="'+ myID +'" layout="'+_myType+'" audio="null" prevPage="null" nextPage="null"></page>'));

		var currentChildrenLength = $(myXML).find("page").eq(insertPoint).children("page").length;
		var newPage = insertPoint + currentChildrenLength + 1;
		if(_myType != "branching" && _myType != "chaining" && _myType != "pathing"){
			$(myXML).find("page").eq(newPage).append($("<title>"));
			var newPageTitle = new DOMParser().parseFromString('<title></title>',  "application/xml");
			var titleCDATA = newPageTitle.createCDATASection(myTitle);
			$(myXML).find("page").eq(newPage).find("title").append(titleCDATA);
			$(myXML).find("page").eq(newPage).attr("eo", elo);
			$(myXML).find("page").eq(newPage).append($("<visualtranscript>"));
			var newVisualTranscript = new DOMParser().parseFromString('<visualtranscript></visualtranscript>',  "application/xml");
			var vTransCDATA = newVisualTranscript.createCDATASection("Visual transcript content");
			$(myXML).find("page").eq(newPage).find("visualtranscript").append(vTransCDATA);
			$(myXML).find("page").eq(newPage).append($("<audiotranscript>"));
			var newAudioTranscript = new DOMParser().parseFromString('<audiotranscript></audiotranscript>',  "application/xml");
			var aTransCDATA = newAudioTranscript.createCDATASection("Audio transcript content");
			$(myXML).find("page").eq(newPage).find("audiotranscript").append(aTransCDATA);
		}
		
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//ADD PAGE SPECIFIC ELEMENTS
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		switch (_myType) {
			//Satic Layouts
		case "group":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).attr("type", "group");
			break;
		case "completion":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).attr("graded", "true");
			$(myXML).find("page").eq(newPage).attr("mandatory", "true");
			$(myXML).find("page").eq(newPage).attr("type", "completion");
			$(myXML).find("page").eq(newPage).attr("graded", "true");
			$(myXML).find("page").eq(newPage).attr("mandatory", "true");
			$(myXML).find("page").eq(newPage).attr("type", "completion");
			$(myXML).find("page").eq(newPage).attr("indexhide", "false");
			$(myXML).find("page").eq(newPage).attr("retainscore", "false");
			$(myXML).find("page").eq(newPage).attr("subs", "null");
			$(myXML).find("page").eq(newPage).attr("poster", "null");
			$(myXML).find("page").eq(newPage).attr("popup", "");
			$(myXML).find("page").eq(newPage).attr("popcaps", " ");
			$(myXML).find("page").eq(newPage).attr("popalt", " ");
			$(myXML).find("page").eq(newPage).attr("img", "defaultTop.png");
			$(myXML).find("page").eq(newPage).attr("w", "350");
			$(myXML).find("page").eq(newPage).attr("h", "260");
			$(myXML).find("page").eq(newPage).attr("enlarge", "");
			$(myXML).find("page").eq(newPage).attr("controlType", "bar");
			$(myXML).find("page").eq(newPage).attr("autoplay", "false");
			$(myXML).find("page").eq(newPage).attr("autonext", "false");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			$(myXML).find("page").eq(newPage).attr("mediaLinkType", "");
			$(myXML).find("page").eq(newPage).attr("objectItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("poploop", "true");
			$(myXML).find("page").eq(newPage).attr("withmedia", "false");
			break;
		case "textOnly":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);

			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "graphicOnly":
			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).attr("img", "defaultTop.png");
			$(myXML).find("page").eq(newPage).attr("galTransType", "elastic");
			$(myXML).find("page").eq(newPage).attr("popup", "");
			$(myXML).find("page").eq(newPage).attr("popcaps", "");
			$(myXML).find("page").eq(newPage).attr("enlarge", "");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			$(myXML).find("page").eq(newPage).attr("poploop", "true");
			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "top":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).attr("img", "defaultTop.png");
			$(myXML).find("page").eq(newPage).attr("galTransType", "elastic");
			$(myXML).find("page").eq(newPage).attr("popup", "");
			$(myXML).find("page").eq(newPage).attr("popcaps", "");
			$(myXML).find("page").eq(newPage).attr("enlarge", "");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			$(myXML).find("page").eq(newPage).attr("poploop", "true");
			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "left":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).attr("galTransType", "elastic");
			$(myXML).find("page").eq(newPage).attr("popup", "");
			$(myXML).find("page").eq(newPage).attr("popcaps", "");
			$(myXML).find("page").eq(newPage).attr("enlarge", "");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			$(myXML).find("page").eq(newPage).attr("poploop", "true");
			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "right":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).attr("galTransType", "elastic");
			$(myXML).find("page").eq(newPage).attr("popup", "");
			$(myXML).find("page").eq(newPage).attr("popcaps", "");
			$(myXML).find("page").eq(newPage).attr("enlarge", "");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			$(myXML).find("page").eq(newPage).attr("poploop", "true");
			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "bottom":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).attr("img", "defaultTop.png");
			$(myXML).find("page").eq(newPage).attr("galTransType", "elastic");
			$(myXML).find("page").eq(newPage).attr("popup", "");
			$(myXML).find("page").eq(newPage).attr("popcaps", "");
			$(myXML).find("page").eq(newPage).attr("enlarge", "");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			$(myXML).find("page").eq(newPage).attr("poploop", "true");
			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "sidebar":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).append($("<sidebar>"));
			var newSidebarContent = new DOMParser().parseFromString('<sidebar></sidebar>',  "text/xml");
			var sidebarCDATA = newSidebarContent.createCDATASection("<p>New Page Sidebar</p>");
			$(myXML).find("page").eq(newPage).find("sidebar").append(sidebarCDATA);

			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "tabsOnly":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);

			$(myXML).find("page").eq(newPage).append($("<tab>"));
			var newTabContent1 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA1 = newTabContent1.createCDATASection("New Tab Content");
			$(myXML).find("page").eq(newPage).find("tab").eq(0).append(tabCDATA1);
			$(myXML).find("page").eq(newPage).find("tab").eq(0).attr('id', '1');
			$(myXML).find("page").eq(newPage).find("tab").eq(0).attr('title', 'tab1');

			$(myXML).find("page").eq(newPage).append($("<tab>"));
			var newTabContent2 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA2 = newTabContent2.createCDATASection("New Tab Content");
			$(myXML).find("page").eq(newPage).find("tab").eq(1).append(tabCDATA2);
			$(myXML).find("page").eq(newPage).find("tab").eq(1).attr('id', '2');
			$(myXML).find("page").eq(newPage).find("tab").eq(1).attr('title', 'tab2');

			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			$(myXML).find("page").eq(newPage).attr("clickall", "false");
			break;
		case "tabsLeft":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);

			$(myXML).find("page").eq(newPage).append($("<tab>"));
			var newTabContent1 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA1 = newTabContent1.createCDATASection("New Tab Content");
			$(myXML).find("page").eq(newPage).find("tab").eq(0).append(tabCDATA1);
			$(myXML).find("page").eq(newPage).find("tab").eq(0).attr('id', '1');
			$(myXML).find("page").eq(newPage).find("tab").eq(0).attr('title', 'tab1');

			$(myXML).find("page").eq(newPage).append($("<tab>"));
			var newTabContent2 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA2 = newTabContent2.createCDATASection("<p>New Tab Content</p>");
			$(myXML).find("page").eq(newPage).find("tab").eq(1).append(tabCDATA2);
			$(myXML).find("page").eq(newPage).find("tab").eq(1).attr('id', '2');
			$(myXML).find("page").eq(newPage).find("tab").eq(1).attr('title', 'tab2');

			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("default caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).attr("poploop", "true");
			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			$(myXML).find("page").eq(newPage).attr("clickall", "false");
			break;
		case "revealRight":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);

			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Image Reveal Text Content 1</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<caption>"));
			var diffFeed1 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("caption").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("title", "default title");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("alt", "Default alt text");

			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("<p>New Image Reveal Text Content 2</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<caption>"));
			var diffFeed2 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("caption").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("title", "default title");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("alt", "Default alt text");

			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("interact", "click");
			$(myXML).find("page").eq(newPage).attr("w", "150");
			$(myXML).find("page").eq(newPage).attr("h", "150");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			$(myXML).find("page").eq(newPage).attr("clickall", "false");

			break;

		case "flashcard":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);

			$(myXML).find("page").eq(newPage).append($("<card><term/><definition/></card>"));
			var newFront1 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack1 = new DOMParser().parseFromString('<definition></definition>',  "text/xml");
			var frontCDATA1 = newFront1.createCDATASection("New Card Term");
			var backCDATA1 = newBack1.createCDATASection("New Card Definition");
			$(myXML).find("page").eq(newPage).find("card").eq(0).find("term").append(frontCDATA1);
			$(myXML).find("page").eq(newPage).find("card").eq(0).find("definition").append(backCDATA1);

			$(myXML).find("page").eq(newPage).append($("<card><term/><definition/></card>"));
			var newFront2 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack2 = new DOMParser().parseFromString('<definition></definition>',  "text/xml");
			var frontCDATA2 = newFront2.createCDATASection("New Card Term");
			var backCDATA2 = newBack2.createCDATASection("New Card Definition");
			$(myXML).find("page").eq(newPage).find("card").eq(1).find("term").append(frontCDATA2);
			$(myXML).find("page").eq(newPage).find("card").eq(1).find("definition").append(backCDATA2);

			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("mandatory", false);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "static");
			$(myXML).find("page").eq(newPage).attr("clickall", "false");

			break;

		case "clickImage":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);

			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Image Reveal Text Content 1</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<caption>"));
			var diffFeed1 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("caption").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("alt", "Default alt text");

			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("<p>New Image Reveal Text Content 2</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<caption>"));
			var diffFeed2 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("caption").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("alt", "Default alt text");

			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("interact", "click");
			$(myXML).find("page").eq(newPage).attr("w", "150");
			$(myXML).find("page").eq(newPage).attr("h", "150");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			$(myXML).find("page").eq(newPage).attr("clickall", "false");

			break;

		case "questionBank":
			//PREPOPULATE A QUESTION BANK WITH TWO QUESTIONS
			//QUESTION 1
			$(myXML).find("page").eq(newPage).append($("<bankitem>"));
			var bankitem1 = new DOMParser().parseFromString('<bankitem></bankitem>',  "text/xml");

			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input question 1.</p>");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("question").append(myQuestionCDATA);

			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).attr("correct", "true");

			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("False");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).attr("correct", "false");

			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("attemptresponse").append(myAttemptResponseCDATA);

			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("correctresponse").append(myCorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("incorrectresponse").append(myIncorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("feedback").append(myFeedbackCDATA);

			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).attr("audio", "null");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).attr("btnText", "Submit");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).attr("randomize", false);

			//QUESTION 2
			$(myXML).find("page").eq(newPage).append($("<bankitem>"));
			var bankitem2 = new DOMParser().parseFromString('<bankitem></bankitem>',  "text/xml");

			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input question 2.</p>");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("question").append(myQuestionCDATA);

			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).attr("correct", "true");

			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("False");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).attr("correct", "false");

			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("attemptresponse").append(myAttemptResponseCDATA);

			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("correctresponse").append(myCorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("incorrectresponse").append(myIncorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("feedback").append(myFeedbackCDATA);

			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).attr("audio", "null");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).attr("btnText", "Submit");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).attr("randomize", false);

			//PAGE LEVEL VARS
			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("type", "kc");

			break;

		case "multipleChoice":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input a question.</p>");
			$(myXML).find("page").eq(newPage).find("question").append(myQuestionCDATA);

			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).attr("correct", "true");

			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("False");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).attr("correct", "false");

			$(myXML).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(myXML).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			$(myXML).find("page").eq(newPage).attr("poploop", "true");
			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");

			$(myXML).find("page").eq(newPage).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "kc");


			break;

		case "multipleChoiceMedia":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input a question.</p>");
			$(myXML).find("page").eq(newPage).find("question").append(myQuestionCDATA);

			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).attr("correct", "true");

			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("False");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).attr("correct", "false");

			$(myXML).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(myXML).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);

			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("default caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);

			$(myXML).find("page").eq(newPage).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).attr("galTransType", "elastic");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			$(myXML).find("page").eq(newPage).attr("poploop", "true");
			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");

			$(myXML).find("page").eq(newPage).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "kc");

			break;

		case "textInput":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("question").eq(0).attr("attempts", 1);
			$(data).find("page").eq(currentPage).find("question").eq(0).attr("autocomplete", false);
			//content
			$(myXML).find("page").eq(newPage).find("question").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var question1CDATA = content1.createCDATASection("<p>Input a question.</p>");
			$(myXML).find("page").eq(newPage).find("question").eq(0).find("content").append(question1CDATA);
			//acceptedresponse
			$(myXML).find("page").eq(newPage).find("question").eq(0).append($("<acceptedresponse>"));
			var acceptedResponse1 = new DOMParser().parseFromString('<acceptedresponse></acceptedresponse>', "text/xml");
			var acceptedResponse1CDATA = acceptedResponse1.createCDATASection("Yes");
			$(myXML).find("page").eq(newPage).find("question").eq(0).find("acceptedresponse").append(acceptedResponse1CDATA);
			//diffeed
			$(myXML).find("page").eq(newPage).find("question").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("question").eq(0).find("diffeed").append(difFeed1CDATA);
			//correctresponse
			$(myXML).find("page").eq(newPage).find("question").eq(0).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("question").eq(0).find("correctresponse").append(myCorrectResponseCDATA);

			// $(myXML).find("page").eq(newPage).append($("<incorrectresponse>"));
			// var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			// var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			// $(myXML).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);

			// $(myXML).find("page").eq(newPage).append($("<feedback>"));
			// var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			// var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			// $(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);

			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbacktype", "differentiated");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");

			//$(myXML).find("page").eq(newPage).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "kc");

			break;

		case "matching":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Match the items on the left to the items on the right:</p>");
			$(myXML).find("page").eq(newPage).find("question").append(myQuestionCDATA);

			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option1CDATA = option1.createCDATASection("Option1");
			$(myXML).find("page").eq(newPage).find("option").eq(0).append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).attr("correct", "A");

			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option2CDATA = option2.createCDATASection("Option2");
			$(myXML).find("page").eq(newPage).find("option").eq(1).append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).attr("correct", "B");

			$(myXML).find("page").eq(newPage).append($("<answer>"));
			var answer1 = new DOMParser().parseFromString('<answer></answer>', "text/xml");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var answer1CDATA = content1.createCDATASection("Answer 1");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).find("content").append(answer1CDATA);
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("answer").eq(0).attr("correct", "A");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).attr("img", "defaultReveal.png");

			$(myXML).find("page").eq(newPage).append($("<answer>"));
			var answer2 = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var answer2CDATA = content2.createCDATASection("Answer 2");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).find("content").append(answer2CDATA);
			var difFeed2CDATA = diffFeed2.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("answer").eq(1).attr("correct", "B");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).attr("img", "defaultReveal.png");

			$(myXML).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(myXML).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);

			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");

			$(myXML).find("page").eq(newPage).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "kc");

			break;

		case "categories":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Match the items on the left to the items on the right:</p>");
			$(myXML).find("page").eq(newPage).find("question").append(myQuestionCDATA);

			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("Category question 1");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).attr("correct", "A");

			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("Option2");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).attr("correct", "B");

			$(myXML).find("page").eq(newPage).append($("<answer>"));
			var answer1 = new DOMParser().parseFromString('<answer></answer>', "text/xml");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var answer1CDATA = content1.createCDATASection("Answer 1");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).find("content").append(answer1CDATA);
			$(myXML).find("page").eq(newPage).find("answer").eq(0).attr("correct", "A");

			$(myXML).find("page").eq(newPage).append($("<answer>"));
			var answer2 = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var answer2CDATA = content2.createCDATASection("Answer 2");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).find("content").append(answer2CDATA);
			$(myXML).find("page").eq(newPage).find("answer").eq(1).attr("correct", "B");

			$(myXML).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(myXML).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);

			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");

			$(myXML).find("page").eq(newPage).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).attr("cycle", false);
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "kc");

			break;

		case "sequence":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Place the items below, into the proper order:</p>");
			$(myXML).find("page").eq(newPage).find("question").append(myQuestionCDATA);

			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("Sequence Item 1");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).attr("correct", "1");

			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("Sequence Item 2");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).attr("correct", "2");

			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option3 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(2).append($("<content>"));
			var content3 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option3CDATA = content3.createCDATASection("Sequence Item 3");
			$(myXML).find("page").eq(newPage).find("option").eq(2).find("content").append(option3CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(2).append($("<diffeed>"));
			var diffFeed3 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed3CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(2).find("diffeed").append(difFeed3CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(2).attr("correct", "3");

			$(myXML).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(myXML).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);

			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); $(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");

			$(myXML).find("page").eq(newPage).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "kc");

			break;

		case "essayCompare":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input a question.</p>");
			$(myXML).find("page").eq(newPage).find("question").append(myQuestionCDATA);

			$(myXML).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("Expert response goes here...");
			$(myXML).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);

			$(myXML).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);

			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");

			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("type", "kc");

			break;

		case "slider":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input instructions or a question.</p>");
			$(myXML).find("page").eq(newPage).find("question").append(myQuestionCDATA);

			$(myXML).find("page").eq(newPage).append($("<slider>"));
			var mySlider = new DOMParser().parseFromString('<slider></slider>',  "text/xml");

			$(myXML).find("page").eq(newPage).find("slider").eq(0).attr("max", 10);
			$(myXML).find("page").eq(newPage).find("slider").eq(0).attr("min", 0);
			$(myXML).find("page").eq(newPage).find("slider").eq(0).attr("step", 1);
			$(myXML).find("page").eq(newPage).find("slider").eq(0).attr("start", 5);
			$(myXML).find("page").eq(newPage).find("slider").eq(0).attr("orientation", "horizontal");
			$(myXML).find("page").eq(newPage).find("slider").eq(0).attr("attempts", 1);
			$(myXML).find("page").eq(newPage).find("slider").eq(0).attr("correctanswer", 5);
			//content
			$(myXML).find("page").eq(newPage).find("slider").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var question1CDATA = content1.createCDATASection("Input a question.");
			$(myXML).find("page").eq(newPage).find("slider").eq(0).find("content").append(question1CDATA);
			//diffeed
			$(myXML).find("page").eq(newPage).find("slider").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("slider").eq(0).find("diffeed").append(difFeed1CDATA);
			//correctresponse
			$(myXML).find("page").eq(newPage).find("slider").eq(0).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("slider").eq(0).find("correctresponse").append(myCorrectResponseCDATA);
					
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbacktype", "differentiated");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");
			
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("type", "kc");
						
			break;
		case "clickListRevealText":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click each item in the list below to reveal information about each item.</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);

			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<title>"));
			var title1 = new DOMParser().parseFromString('<title></title>', "text/xml");
			var title1CDATA = title1.createCDATASection("Item 1");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("title").append(title1CDATA);

			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Reveal Text Content 1</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("content").append(option1CDATA);

			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<title>"));
			var title2 = new DOMParser().parseFromString('<title></title>', "text/xml");
			var title2CDATA = title1.createCDATASection("Item 2");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("title").append(title2CDATA);

			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content1.createCDATASection("<p>New Reveal Text Content 2</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("content").append(option2CDATA);

			$(myXML).find("page").eq(newPage).attr("objective", "undefined");
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("interact", "click");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			$(myXML).find("page").eq(newPage).attr("clickall", "false");
			break;
			
		case "branching":
			var tempID = guid();
			$(myXML).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Branch Page Introduction");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("title").append(titleCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("sidebar").append(sidebarCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<option>"));
			var option = new DOMParser().parseFromString('<option></option>', "text/xml");
			var optionCDATA = option.createCDATASection("This Page");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("option").append(optionCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("option").first().attr("id", tempID);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("id", guid());
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("success", "false");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("pathcomplete", "false");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("layout", "textOnly");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("img", "defaultLeft.png");
			
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("option").attr("id", tempID);
			$(myXML).find("page").eq(newPage).attr("graded", "false");
			$(myXML).find("page").eq(newPage).attr("mandatory", "false");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "pathing":
			$(myXML).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Pathing Home");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("title").append(titleCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Path Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("sidebar").append(sidebarCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<option>"));
			var path1Guid = guid();
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("option").attr("id", path1Guid);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("option").attr("path", "1");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("option").attr("img", "");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("option").attr("active", "false");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("option").attr("altbtntitle", "");

			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("id", guid());
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("layout", "textOnly");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("galTransType", "elastic");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("pathid", "0");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("pathtype", "home");

			//path 1
			$(myXML).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Path Page 1");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).find("title").append(titleCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(1).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Path Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(1).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).find("sidebar").append(sidebarCDATA);

			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("id", path1Guid);
			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("layout", "textOnly");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("galTransType", "elastic");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("pathid", "1");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("pathtype", "branch");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("pathtimg", "");

			$(myXML).find("page").eq(newPage).attr("graded", "false");
			$(myXML).find("page").eq(newPage).attr("mandatory", "false");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;			
		case "chaining":
			//intro
			$(myXML).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Chaining Introduction");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("title").append(titleCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(0).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).find("sidebar").append(sidebarCDATA);

			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("id", guid());
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("success", "false");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("pathcomplete", "false");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("layout", "textOnly");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("galTransType", "elastic");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("stepnumber", "0");
			$(myXML).find("page").eq(newPage).find("branch").eq(0).attr("steptype", "intro");
			
			//overview
			$(myXML).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Chaining Overview");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).find("title").append(titleCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(1).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(1).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).find("sidebar").append(sidebarCDATA);

			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("id", guid());
			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("success", "false");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("pathcomplete", "false");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("layout", "textOnly");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("galTransType", "elastic");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("stepnumber", "0");
			$(myXML).find("page").eq(newPage).find("branch").eq(1).attr("steptype", "overview");	

			//summary - success and pathcomplete are always true for summary
			$(myXML).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("branch").eq(2).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Chaining Summary");
			$(myXML).find("page").eq(newPage).find("branch").eq(2).find("title").append(titleCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(2).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(2).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(2).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("branch").eq(2).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(2).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(2).find("sidebar").append(sidebarCDATA);

			$(myXML).find("page").eq(newPage).find("branch").eq(2).attr("id", guid());
			$(myXML).find("page").eq(newPage).find("branch").eq(2).attr("success", "true");
			$(myXML).find("page").eq(newPage).find("branch").eq(2).attr("pathcomplete", "true");
			$(myXML).find("page").eq(newPage).find("branch").eq(2).attr("layout", "textOnly");
			$(myXML).find("page").eq(newPage).find("branch").eq(2).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).find("branch").eq(2).attr("galTransType", "elastic");
			$(myXML).find("page").eq(newPage).find("branch").eq(2).attr("stepnumber", "0");
			$(myXML).find("page").eq(newPage).find("branch").eq(2).attr("steptype", "summary");

			//step1 teach
			$(myXML).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("branch").eq(3).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Chaining Step 1 teach");
			$(myXML).find("page").eq(newPage).find("branch").eq(3).find("title").append(titleCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(3).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(3).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(3).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("branch").eq(3).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(3).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(3).find("sidebar").append(sidebarCDATA);

			$(myXML).find("page").eq(newPage).find("branch").eq(3).attr("id", guid());
			$(myXML).find("page").eq(newPage).find("branch").eq(3).attr("success", "false");
			$(myXML).find("page").eq(newPage).find("branch").eq(3).attr("pathcomplete", "false");
			$(myXML).find("page").eq(newPage).find("branch").eq(3).attr("layout", "textOnly");
			$(myXML).find("page").eq(newPage).find("branch").eq(3).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).find("branch").eq(4).attr("galTransType", "elastic");
			$(myXML).find("page").eq(newPage).find("branch").eq(3).attr("stepnumber", "1");
			$(myXML).find("page").eq(newPage).find("branch").eq(3).attr("steptype", "teach");

			//step1 practice
			$(myXML).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("branch").eq(4).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Chaining Step 1 practice");
			$(myXML).find("page").eq(newPage).find("branch").eq(4).find("title").append(titleCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(4).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(4).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(4).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("branch").eq(4).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).find("branch").eq(4).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(myXML).find("page").eq(newPage).find("branch").eq(4).find("sidebar").append(sidebarCDATA);

			$(myXML).find("page").eq(newPage).find("branch").eq(4).attr("id", guid());
			$(myXML).find("page").eq(newPage).find("branch").eq(4).attr("success", "false");
			$(myXML).find("page").eq(newPage).find("branch").eq(4).attr("pathcomplete", "false");
			$(myXML).find("page").eq(newPage).find("branch").eq(4).attr("layout", "textOnly");
			$(myXML).find("page").eq(newPage).find("branch").eq(4).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).find("branch").eq(4).attr("galTransType", "elastic");
			$(myXML).find("page").eq(newPage).find("branch").eq(4).attr("stepnumber", "1");
			$(myXML).find("page").eq(newPage).find("branch").eq(4).attr("steptype", "practice");													

			$(myXML).find("page").eq(newPage).attr("graded", "false");
			$(myXML).find("page").eq(newPage).attr("mandatory", "false");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;	
		}
		refreshExpected = true;
		updateModuleXML(myModule, true, true);
	}




	/************************************************************************************
     removeModuleFromCourse(_id);
     params: _id - id of the item to be removed.
     -- Build a dialog to warn about the removal.
     -- on Yes, find id in xml and then remove from xml and menu, then push update to server.
     -- update the course xml
     -- update the module_arr - remove module and children.
     -- Check that there is at least one page left or disallow the removal.
     ************************************************************************************/
	function removeModuleFromCourse(_id){
		var myID = _id;
		$("#stage").append('<div id="dialog-removeContent" title="Remove this lesson?"><p class="validateTips">Are you sure that you want to remove this module?</div>');

	    $("#dialog-removeContent").dialog({
            modal: true,
            width: 550,
            close: function (event, ui) {
			   	 $("#dialog-removeContent").remove();
            },
            buttons: {
                Yes: function(){

	               $("#"+myID).remove();									//Remove the item from the menu
	               $("#"+myID).remove();									//Have to call twice - not sure why...
	               var myNode = getNode(myID);								//Find node in course.xml as object
	               var myRemove = myNode.node;								//Define the actual node in course.xml

				   var myModule = myNode.module;						
				   var myModuleName = module_arr[myNode.module].name;

	               myRemove.remove();	
	               updateCourseXML(false);									//Push xml without commit

				   for(var i = 0; i < module_arr.length; i++){				//Find by id in module_arr
					   if (module_arr[i].id == myID){
						   module_arr.splice(i, 1);							//remove from module_arr
					   }
				   }
	               var content = {											//Create data to send to node server
			            id: myID,
			            type: "lesson",
			            name: myModuleName,
			            user: user,
			            loc: 'outliner'
			        };

			        socket.emit('removeContent', content);					//Call to server to remove content ------ must add to function to remove module from course.xml...
			        
			        $(this).dialog("close");								//Close dialog.
                },
                 No: function () {
                    $(this).dialog("close");
                }
            }
        });
	}


	/************************************************************************************
     removePageFromModule(_id);
     params: _id - id of the item to be removed.
     -- Build a dialog to warn about the removal.
     -- on Yes, find id in xml and then remove from xml and menu, then push update to server.
     -- Check that there is at least one page left or disallow the removal.
     ************************************************************************************/
	function removePageFromModule(_id){
		var myID = _id;
		//Attach dialog ensureing that user wants to remove the page.
		$("#stage").append("<div id='dialog-removePage' title='Remove Current Page'><p>Are you sure that you want to remove this page from your content?</p></div>");
		//Build the dialog - utilzing jqueryui
		$("#dialog-removePage").dialog({
			modal: true,
			width: 550,
			close: function(event, ui){
				$("dialog-removePage").remove();
			},
			buttons: {
				Yes: function(){
					var myNode = getNode(myID);							//Return object representing this item.
					var myRemove = myNode.node;							//Variable for the node id
					var myModule = myNode.module;						//Parent module.
					var myModuleID = module_arr[myNode.module].id;		//module ID in case needed ----- probably can remove - leaving for now...
					var myNodeLevel = myNode.level;						//Level that the button resides on ("module", "page" so far)...

					//modules have to have at least 1 page... Ensure that you aren't deleting the last....
					if($(module_arr[myModule].xml).find("page").length > 1){
						myRemove.remove();									//remove the node from the xml
						$("#"+myID).remove();								//Remove the item from the menu
						updateModuleXML(myModule, true);					//update the xml

						if($(courseData).find("course").attr("redmine") && $(courseData).find("course").attr("redmine") == "true"){
							closeAllRedmineIssuesForPage(myID, $(module_arr[myModule].xml).find('id').attr('value'));
						}

						$(this).dialog("close");							//close the dialog
					}else{
						$(this).dialog("close");
						//Launch a dialog warning that this page can't be removed because it is the last page left in content.xml
						$("#stage").append("<div id='dialog-removePageError' title='Error Removing Page'><p>Your module must have at least one page.</p><p>If you would like to remove this page you must first add another page to this module and then you can remove it.</p></div>");
						$("#dialog-removePageError").dialog({
							modal: true,
							width: 550,
							close: function(event, ui){
								$("dialog-removePageError").remove();
							},
							buttons: {
								cancel: function(){
									$(this).dialog("close");
								}
							}
						});
					}
				},
				No: function(){
					$( this ).dialog( "close" );
				}
			}
		});
	}

	function closeAllRedmineIssuesForPage(_pageId, _lessonId){
		//close redmine comments for page
		var _issues = {};
		var _page = {
			lessonid: _lessonId ,
			id: _pageId
		};

		socket.emit('getRedminePageIssues', _page, function(fdata){
			_issues = fdata;
			if(_issues.total_count != 0){
				for(var h = 0; h < _issues.issues.length; h++){
					_issues.issues[h].notes = 'This page was deleted in Cognizen so the issue was closed.';

					_issues.issues[h].status_id = 5;

					socket.emit('updateRedmineIssue', _issues.issues[h], user.username, function(err){
						if(err){
							alert(err);
						}
					});
				}
			}
		});		
	} 


	/************************************************************************************************
	Function: 		s4
	Description:	Create 4 random characters.
					Used by guid()
	************************************************************************************************/
	function s4() {
	  return Math.floor((1 + Math.random()) * 0x10000)
	             .toString(16)
	             .substring(1);
	};

	/************************************************************************************************
	Function: 		guid
	Description:	Creates a random guid.
	************************************************************************************************/
	function guid() {
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	         s4() + '-' + s4() + s4() + s4();
	}
	/**********************************************************END RANDOM GUID GENERATION*/

    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
    function destroy(){
	     try { $("#dialog-outline").remove(); } catch (e) {}

    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}