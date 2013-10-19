/*
 *  	C_Glossary
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses glossary functionality for cognizen
 *  	Version: 0.5
 *		Date Created: 10/19/13
 *		Created by: Philip Double
 *		Date Updated: 10/19/13
 *		Updated by: Philip Double
 *		History: Moved all glossary functionality into its own js file.
 *		Todo: 	- Turn this into a plugin.  This did reside in C_Engine which was becoming unruly.
 *				- Optimize code.
 */

var glossary = false;
var glossaryState = false;
var glossaryClosePos = 0;
var glossaryClosePosMobile = 0;
var totalGlossary = 0;

//Set up Glossary pane.
function checkGlossary(){
	if($(data).find('glossary').attr('value') == "true"){
		glossary = true;
		if(windowWidth <= mobileWidth){
			$('#panes').append("<div id='glossaryPane' class='pane'><button id='glossaryTab' class='paneTab'></button><div id='glossaryContent' class='glossaryContent'></div></div>");
		}
		else{
			$('#panes').append("<div id='glossaryPane' class='pane'><div id='glossaryTab' class='paneTab' title='click here to toggle the glossary'/><div id='glossaryTerms' class='glossaryTerms'></div><div id='glossaryContent' class='glossaryContent'><div id='glossaryDef'></div></div></div>");
		}
		
		$('#glossaryTab').click(toggleGlossary).tooltip();
	
		if(mode == "edit"){
			//Add glossary item button
			$("#glossaryContent").append("<div id='addGlossaryItem'>Add New Term</div>");
			$("#addGlossaryItem").button().click(function(){
				addGlossaryTerm();
			});
		}
		
		addGlossary();
	}
}

function updateGlossary(){
	console.log("updating glossary");
	$.ajax({
	    	type: "GET",
	    	url: "xml/content.xml",
	    	dataType: "xml",
	    	async: false,
	    	success: function(_data){
	    		data = _data;
	    		$("#glossaryTerms").empty();
	    		
	    		$("#glossaryDef").html("");
	    		
	    		addGlossary();
		},
		error: function(){
	    	alert("unable to load content.xml in updateIndex")
	    }
	});
}

function addGlossary(){
	console.log("addGlossary");
	totalGlossary = $(data).find('glossaryitem').length;
	glossaryItem_arr = [];
	var thisTerm;
	var termID;
	
	for(var i = 0; i < totalGlossary; i++){
		thisTerm = "term" + i;
		termID = "#"+thisTerm;
		$("#glossaryTerms").append("<div id='"+thisTerm+"' class='glossaryItem'>"+$(data).find('glossaryitem').eq(i).find('term').text()+"</div>");
		$(termID).data("definition", $(data).find('glossaryitem').eq(i).find('content').text());
		$(termID).data("myID", i);
		$(termID).click(function(){
			if(hoverSubNav == false){
				$("#glossaryDef").html("<b>Term: </b>" + $(this).text() + "<br/><br/><b>Definition: </b>" + $(this).data("definition"));
			}
		}).hover(function(){
			$(this).addClass("glossaryItemHover");
		},
		function(){
			$(this).removeClass("glossaryItemHover");
		});
		glossaryItem_arr.push("#" + thisTerm);
	}
	
	for(var i = 0; i < glossaryItem_arr.length; i++){
		if(mode == "edit"){
			addEditGlossaryRollovers($(glossaryItem_arr[i]));
		}
	}
}


function addEditGlossaryRollovers(myItem){
	//ADD Program Level Buttons
    myItem.hover(
    	function () {
            $(this).append("<div id='myGlossaryTermRemove' class='glossaryTermRemove' title='Remove this term from your glossary.'>");//</div><div id='myGlossaryTermEdit' class='glossaryTermEdit' title='Edit this glossary term.'></div>");
            $("#myGlossaryTermRemove").click(function(){
            	removeGlossaryTerm($(this).parent().data("myID"));
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
			$("#myGlossaryTermRemove").remove();
			$("#myGlossaryTermEdit").remove();
	});   
}

function removeGlossaryTerm(myNode){
	$(data).find("glossaryitem").eq(myNode).remove();
	sendUpdateWithRefresh("glossary");
}

/************************************************************************************
ADD NEW GLOSSARY Term - creates the input form for a new glossary term
************************************************************************************/
function addGlossaryTerm(){
	//Create the base message.
	var msg = '<div id="dialog-addGlossaryTerm" title="Add New Term"><p class="validateTips">Complete the form to create your new glossary term.</p><input id="newTerm" type="text" value="New Term" defaultValue="New Term" style="width:100%;"/><br/><div>Edit Definition:</div><div id="definitionEditText" type="text" style="width:480px; height:80%">Input defintion here.</div></div>';
	
	//Add to stage.
	$("#stage").append(msg);
	
	$("#definitionEditText").redactor({
		focus: true,
		buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'link', 'fontcolor', 'backcolor']
	});

	//Make it a dialog
	$("#dialog-addGlossaryTerm").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
				$("#dialog-addGlossaryTerm").remove();
			},
		buttons: {
			Cancel: function () {
                    $(this).dialog("close");
			},
			Add: function(){
				var myDef = $("#definitionEditText").getCode();
				$("#defintionEditText").destroyEditor();
				insertNewGlossaryTerm($("#newTerm").val(), $("#definitionEditText").getCode());
				$(this).dialog("close");
			}
		}
	});
}

function insertNewGlossaryTerm(_term, _definition){
	var noError = true;
	var isLast = true;
	var term = _term.toLowerCase();
	var insertPoint = 0;
	
	for(var i = 0; i < totalGlossary; i++){
		var testTerm = $(data).find('glossaryitem').eq(i).find('term').text().toLowerCase();
		insertPoint = i;
		if(term < testTerm){
			isLast = false;
			break;
		}else if(term == testTerm){
			noError = false;
			break;
		}
	}
	
	//IF doesn't exist already - create
	if(noError == true){
		if(isLast == true){
			$(data).find("glossaryitem").eq(insertPoint).after($('<glossaryitem></glossaryitem>'));
			//Place the page title element
			$(data).find("glossaryitem").eq(insertPoint + 1).append($("<term>"));
			var newGlossaryTerm = new DOMParser().parseFromString('<term></term>',  "application/xml");
			var termCDATA = newGlossaryTerm.createCDATASection(_term);
			$(data).find("glossaryitem").eq(insertPoint + 1).find("term").append(termCDATA);
		
			$(data).find("glossaryitem").eq(insertPoint + 1).append($("<content>"));
			var newGlossaryDef = new DOMParser().parseFromString('<content></content>',  "application/xml");
			var defCDATA = newGlossaryDef.createCDATASection(_definition);
			$(data).find("glossaryitem").eq(insertPoint + 1).find("content").append(defCDATA);
		}else{
			$(data).find("glossaryitem").eq(insertPoint).before($('<glossaryitem></glossaryitem>'));
			//Place the page title element
			$(data).find("glossaryitem").eq(insertPoint).append($("<term>"));
			var newGlossaryTerm = new DOMParser().parseFromString('<term></term>',  "application/xml");
			var termCDATA = newGlossaryTerm.createCDATASection(_term);
			$(data).find("glossaryitem").eq(insertPoint).find("term").append(termCDATA);
		
			$(data).find("glossaryitem").eq(insertPoint).append($("<content>"));
			var newGlossaryDef = new DOMParser().parseFromString('<content></content>',  "application/xml");
			var defCDATA = newGlossaryDef.createCDATASection(_definition);
			$(data).find("glossaryitem").eq(insertPoint).find("content").append(defCDATA);
		}
		
		//When done - update content.xml on the server.
		sendUpdateWithRefresh("glossary");
	}else{
		//Error about existing....
		var msg = '<div id="dialog-addGlossaryTermError" title="Term Already Exists"><p class="validateTips">This term is already entered in this glossary.</p><p>To edit this term, roll over it in the glossary list and select the edit button.</p></div>';
	
		//Add to stage.
		$("#stage").append(msg);
	
		//Make it a dialog
		$("#dialog-addGlossaryTermError").dialog({
			modal: true,
			width: 550,
			close: function(event, ui){
				$("#dialog-addGlossaryTermError").remove();
			},
			buttons: {
				Cancel: function () {
                    $(this).dialog("close");
				}
			}
		});
	}
}

function editGlossaryTerm(){
	
}

function updateGlossaryTerm(){
	 sendUpdateWithRefresh("glossary");
}


/*************************************************************
** Glossary Button Funcitonality
*************************************************************/
function toggleGlossary(){
	$("#glossaryPane").css({'z-index':1});
	$("#indexPane").css({'z-index':0});
	$("#docPane").css({'z-index':0});
	var icon = 'ui-icon-circle-triangle-s';
	if(glossaryState == false){
		glossaryState = true;

		gimmeGlosPos();
		if(windowWidth <= mobileWidth){
			TweenMax.to($('#glossaryPane'), transitionLength, {css:{top:0}, ease:transitionType});
		}
		else{
			TweenMax.to($('#glossaryPane'), transitionLength, {css:{left:0}, ease:transitionType});
		}
	}
	else{
		glossaryState = false;
		if(windowWidth <= mobileWidth){
			TweenMax.to($('#glossaryPane'), transitionLength, {css:{top:glossaryClosePosMobile}, ease:transitionType});
		}
		else{
			TweenMax.to($('#glossaryPane'), transitionLength, {css:{left:glossaryClosePos}, ease:transitionType});
		}
	}
}

function gimmeGlosPos(){
	glossaryClosePos = ($("#glossaryPane").position().left);
	glossaryClosePosMobile = ($("#glossaryPane").position().top);
}
