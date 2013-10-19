/*
 *  	C_Index
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
 
var masterIndex = false;
var indexState = false;
var indexClosePos = 0;
var indexClosePosMobile = 0;
var currentIndexItem = 'indexMenuItem0';
var isLinear = false;
var tracking_arr;
var pushedUpdate = false;//edit mode, live communication stuff...
var newPageAdded = false;
var indexItem_arr = [];

//addIndex
//If masterIndex == true  add the index.
function checkIndex(){
	//Place panels - index, glossary, resources, references, others...
	if($(data).find('masterIndex').attr('value') == "true"){
		masterIndex = true;
		
		$('#panes').append("<div id='indexPane' class='pane'><div id='indexTab' class='paneTab' title='click here to toggle content index'/></div>");
		
		//Set index tab action to open and close the index.
		$('#indexTab').click(toggleIndex).tooltip();
		addIndex();
	}
}



function updateMenuItems(){
	if(isLinear == true){
		for(var i = 0; i < tracking_arr.length; i++){
			var thisID = "indexMenuItem"+i;
			if(tracking_arr[i].complete == true){
				$("#" + thisID).removeClass('ui-state-disabled').addClass('indexMenuVisited');
			}else{
				$("#" + thisID).addClass('ui-state-disabled');
			}
		}
	}else{
		var thisID = "indexMenuItem"+currentPage;
		$("#" + thisID).addClass('indexMenuVisited').toggleClass('ui-state-disabled').siblings().removeClass('ui-state-disabled');
	}
}


var updateOutput = function(e){
	var list   = e.length ? e : $(e.target),
        output = list.data('output');
    if (window.JSON) {
    	console.log((window.JSON.stringify(list.nestable('serialize'))));//, null, 2));
    } else {
    	output.val('JSON browser support required for this demo.');
    }
};

function checkForGroup(_id){
	var virgin = true;
	for(var i = 0; i < indexGroupID_arr.length; i++){
		if(indexGroupID_arr[i] == _id){
			virgin = false;
		}
	}
	if(virgin == true){
		indexGroupID_arr.push(_id);
	}
	return virgin;
}

var indexGroupID_arr

function addIndex(){
	indexItem_arr = [];
	totalPages = $(data).find('page').length;
	$("#indexPane").append("<div id='indexContent' class='paneContent'></div>");
	
	if(mode == "edit"){
		$("#indexContent").addClass('indexContentEdit');
		$("#indexPane").append("<div id='addPage'>Add a New Page</div>");//<div id='removePage'>Remove</div>");
		$("#addPage").button({
			icons:{
				primary: 'ui-icon-circle-plus'
			}
		}).click(addPage);
	}

	//loop through the xml and add items to index.
	var thisID;
	var groupMode;
	indexGroupID_arr = [];
	
	var indexString = '<div class="dd" id="C_Index"><ol class="dd-list">';
	for(var i = 0; i < totalPages; i++){
		thisID = "indexMenuItem" + i;
		var pageID = $(data).find("page").eq(i).attr("id");
		if($(data).find("page").eq(i).attr("type") == "group"){
			//Resolves issue of group butting into group...
			if(groupMode == true){
				indexString += '</ol></li>';
			}
			groupMode = true;
			
			var isVirgin = checkForGroup(thisID);
			if(isVirgin){
				indexString += '<li id="'+pageID+'"class="dd-item dd3-item" data-id="'+ i + '">';
				if(mode == "edit"){
					indexString += '<div class="dd-handle dd3-handle">Drag</div>';
				}
				indexString += '<div id="'+thisID+'" class="dd3-content" tag="'+i+'" myID="'+$(data).find("page").eq(i).attr("id")+'">'+$(data).find("page").eq(i).find("title").first().text() +'</div><ol class="dd-list">';
			}
		}else{
			if($(data).find("page").eq(i).parent().attr("type") != "group"){
				if(groupMode == true){
					groupMode = false;
					indexString += '</ol></li>';
				}
			}
			indexString += '<li id="'+pageID+'" class="dd-item dd3-item" data-id="'+i+'">';
			//If edit mode attach drag spot - otherwise don't....
			if(mode == "edit"){
				indexString += '<div class="dd-handle dd3-handle">Drag</div>';
			}
			indexString += '<div id="'+thisID+'" class="dd3-content" tag="'+i+'" myID="'+$(data).find("page").eq(i).attr("id")+'">'+ $(data).find("page").eq(i).find('title').first().text() +'<div id="commentSpot"></div></div></li>';
		}
		indexItem_arr.push("#" + thisID);
	}
	
	indexString += "</ol></div>";
	
	$("#indexContent").append(indexString);
	
	var oldNodePos;
	var newNodePos;
	var oldParent;
	var newParent;
	var startChild = false; //If dragged object started as a child or root
	var startParent; //If dragged object started as a child - what was it's parent.
	var startChildrenLength; //Used to calculate top
	
	$('#C_Index').nestable({maxDepth: 2})
		.on('change', function(){
			//console.log("onChange");
		})
		.on('start', function(e, _item){
			oldNodePos = _item.attr('data-id');
			for(var i = 0; i < startList.length; i++){
				if(oldNodePos == startList[i].id){
					startChild = false;
					break;
				}
				if(startList[i].children){
					for(var j = 0; j < startList[i].children.length; j++){
						if(oldNodePos == startList[i].children[j].id){
							startChild = true;
							startParent = i;
							startChildrenLength = startList[i].children.length;
							break;
						}
					}
				}
			}
		})
		.on('stop', function(e, _item){
			//updateOutput($('#C_Index').data('output', $('#nestable-output')));
			newNodeID = _item.attr('id');
			//Convert list to JSON list
			var tmp = $('#C_Index').data('output', $('#nestable-output'));
			var tmpList   = tmp.length ? tmp : $(tmp.target);
			var list = tmpList.nestable('serialize');
			var listJSON = window.JSON.stringify(list);
			var isChild = false;
			var childParent;
			var moveUp = false;
			var isSub = false;
			var createNewGroup = false;
			var addToGroup = false;
			
			if(listJSON != startListJSON){
				var iterator = 0;
				for(var i = 0; i < list.length; i++){
					//IS A ROOT NODE
					if(oldNodePos == list[i].id){
						newNodePos = iterator;
						//Check if started as a child if so - if iterator is == to it being last in parent node them move up level for xml.
						if(startChild){
							if(iterator == startChildrenLength + startParent){
								newNodePos = startParent;
								moveUp = true;
							}
						}
						break;
					}
					iterator++;
					if(list[i].children){
						for(var j = 0; j < list[i].children.length; j++){
							//IS A CHILD NODE

							if(oldNodePos == list[i].children[j].id){
								isChild = true;
								childParent = list[i].id;
								newNodePos = iterator;
								if($(data).find("page").eq(childParent).attr("type") == "group"){
									addToGroup = true;	
								}else{
									createNewGroup = true;
								}
								break;
							}
							iterator++;
						}
					}
				}
				if(addToGroup){
					$(data).find("page").eq(oldNodePos).appendTo($(data).find("page").eq(childParent));
				}else if (createNewGroup){
					$(data).find("page").eq(oldNodePos).insertBefore($(data).find("page").eq(newNodePos));
					var secondID = $(data).find("page").eq(newNodePos).attr("id");
					//Create a Unique ID for the page
					var myID = guid();
					//Place a page element
					$(data).find("page").eq(childParent).before($('<page id="'+ myID +'" layout="group" type="group"></page>'));
					
					//Place the page title element
					$(data).find("page").eq(childParent).append($("<title>"));
					var newPageTitle = new DOMParser().parseFromString('<title></title>',  "application/xml");
					var titleCDATA = newPageTitle.createCDATASection("New Group Title");
					$(data).find("page").eq(childParent).find("title").append(titleCDATA);
					$(data).find("page").eq(childParent).append($("<content>"));
					var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
					var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
					$(data).find("page").eq(childParent).find("content").append(contentCDATA);
					$(data).find("page").eq(childParent).attr("type", "group");
					
					if(isLinear == true){
						var page_obj = new Object();
						page_obj.id = myID;
						page_obj.complete = false;
						tracking_arr.push(page_obj);
					}
					
					for(var i = 0; i < $(data).find("page").length; i++){
						if($(data).find("page").eq(i).attr("id") == myID){
							var newGroupSpot = i;
							var newSub = i+1;
						}
					}
					$(data).find("page").eq(newSub).appendTo($(data).find("page").eq(newGroupSpot));
					
					for(var i = 0; i < $(data).find("page").length; i++){
						if(secondID == $(data).find("page").eq(i).attr("id")){
							var tmpID = i;
						}
					}
					$(data).find("page").eq(tmpID).appendTo($(data).find("page").eq(newGroupSpot));
					
				}else if(newNodePos < oldNodePos && moveUp == false || isSub){
					$(data).find("page").eq(oldNodePos).insertBefore($(data).find("page").eq(newNodePos));
				}else{
					$(data).find("page").eq(oldNodePos).insertAfter($(data).find("page").eq(newNodePos));
				}
				sendUpdateWithRefresh();
			}
		});
		
	var tmpStart = $('#C_Index').data('output', $('#nestable-output'));
	var tmpStartList   = tmpStart.length ? tmpStart : $(tmpStart.target);
	var startList = tmpStartList.nestable('serialize');
	var startListJSON = window.JSON.stringify(startList);
	//Start with all closed...
	if(mode != "edit"){	
		$('#C_Index').nestable('collapseAll');
	}
	
	//Set the button functions
	for (var i = 0; i < indexItem_arr.length; i++){
		if(mode == "edit"){
			addRollovers($(indexItem_arr[i]));
		}
		$(indexItem_arr[i]).click(function(){
			if(hoverSubNav == false){
				loadPageFromID($(this).attr("myID"));
				if(indexState){
					toggleIndex();
				}
			}
		});
	}

	if(pushedUpdate == true){
		currentTemplate.fadeComplete();
		pushedUpdate = false;
	}
	
	if(mode == "edit" || mode == "review"){
		updateIndexCommentFlags();
	}
	
	updatePageCount();
	//updateOutput($('#C_Index').data('output', $('#nestable-output')));

}
//Index end.

function removePage(myNode){
	if(myNode == undefined){
		myNode = currentPage;
	}
	//Create the Dialog
	$("#stage").append("<div id='dialog-removePage' title='Remove Current Page'><p>Are you sure that you want to remove this page from your content?</p></div>");
	//Style it to jQuery UI dialog
	$("#dialog-removePage").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
			$("dialog-removePage").remove();
		},
		buttons: {
			Yes: function(){
				if(totalPages > 1){
					$(data).find("page").eq(myNode).remove();
					if(currentPage == myNode){
						if(currentPage == 0){
							currentPage++;
						}else{
							currentPage--;
						}
						//Load either previous or next page if you are removing the currentPage...
						currentPageID = $(data).find("page").eq(currentPage).attr("id");
						currentTemplate.fadeComplete();
					}
					sendUpdateWithRefresh();
				}else{
					$("#stage").append("<div id='dialog-removePageError' title='Error Removing Page'><p>Your content must have at least one page.</p><p>If you would like to remove this page you must first create another and then remove it.</p></div>");
					$("#dialog-removePage").dialog({
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
				$( this ).dialog( "close" );
			},
			No: function(){
				$( this ).dialog( "close" );
			}
		}
	});
}


function addRollovers(myItem){
	//ADD Program Level Buttons
    myItem.hover(
    	function () {
            $(this).append("<div id='myRemove' class='pageRemove' title='Remove this page from your content.'></div>");
            $("#myRemove").click(function(){
            	removePage(findNodeByID(myItem.attr("myid")));
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
			$("#myRemove").remove();
	});   
}

/*************************************************************
** Index Button Funcitonality
*************************************************************/
function toggleIndex(){
	$("#indexPane").css({'z-index':1});
	$("#glossaryPane").css({'z-index':0});
	$("#docPane").css({'z-index':0});
	//var icon = 'ui-icon-circle-triangle-s';
	if(indexState == false){
		indexState = true;
		gimmeIndexPos();
		TweenMax.to($('#indexPane'), transitionLength, {css:{left:0}, ease:transitionType});


	}
	else{
		indexState = false;
		TweenMax.to($('#indexPane'), transitionLength, {css:{left:indexClosePos}, ease:transitionType});

	}
}

function gimmeIndexPos(){
	indexClosePos = ($("#indexPane").position().left);
}

/*************************************************************
** EDIT mode Funcitonality
*************************************************************/
function updateIndex(){
	$.ajax({
	    	type: "GET",
	    	url: "xml/content.xml",
	    	dataType: "xml",
	    	async: false,
	    	success: function(_data){
	    		data = _data;
	    		$("#indexContent").remove();
	    		if(mode == "edit"){
		    		$("#addPage").remove();
		    		$("#removePage").remove();
		    	}
		    	//Update the current page value to avoid editing the wrong page!
		    	if(newPageAdded == true){
			    	newPageAdded = false;
			    	clickNext();
		    	}else{
		    		currentPage = findNodeByID();
		    	}
		    	addIndex();
		},
		error: function(){
	    	alert("unable to load content.xml in updateIndex")
	    }
	});
}
