/*!
 * C_Flashcard
 * This class creates a template for a creating basic flashcard exercises
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2013-06-03
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_Flashcard(_type) {
	var type = _type;
	// var pageTitle;
	// var audioHolder;
	var myContent;//Body
	
	var cardCount//number of tabs.
	var currentCard;
	var card_arr = [];
	var cardEdit_arr = [];
    
	var imageWidth;
	var imageHeight;
	var virgin = true;
	var myIndex = 1;
	var mandatory = false;
	var randomize = false;
	
	//Defines a public method - notice the difference between the private definition below.
	this.initialize = function(){
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		if($(data).find("page").eq(currentPage).attr('mandatory') == "true"){
			mandatory = true;
		}
		
		if($(data).find("page").eq(currentPage).attr('randomize') == "true"){
			randomize = true;
		}
		
		//Position the page text		
		cardCount = $(data).find("page").eq(currentPage).find("card").length;
		myContent = $(data).find("page").eq(currentPage).find("content").text();		
		
		buildTemplate();
	}
	
	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
		pageTitle = new C_PageTitle();
		
		$("#stage").append('<div id="scrollableContent" class="antiscroll-wrap"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div><div id="flashcardHolder"></div></div></div>');
		$("#scrollableContent").addClass("top");
		
		audioHolder = new C_AudioHolder();
		
        $("#content").addClass("top");
        $("#scrollableContent").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		$("#content").append(myContent);
		
		shuffle();		
   	}
	
	function shuffle(){
		card_arr.length = 0;
		
		//FLASHCARDS
		currentCard = cardCount - 1;
		
		var order_arr = [];
		for (var j = 0; j < cardCount; j++){
			order_arr.push(j);
		}
		
		if(randomize){
			var order_arr = shuffleArray(order_arr);
		}
		
		for(var i=0; i<cardCount; i++){
			var myTerm = $(data).find("page").eq(currentPage).find("card").eq(order_arr[i]).find("term").text();
			var myDef = $(data).find("page").eq(currentPage).find("card").eq(order_arr[i]).find("definition").text();
			var tempID = "card" + i;
			var tempTextID = "cardText" + i;
			
			$("#flashcardHolder").append("<div id='"+tempID+"' class='flashcard'><div id='"+tempTextID +"' class='cardText'>" + myTerm + "</div></div>");
			
			//Position the card.
			$("#" + tempID).css({'left': 69 + i*4});
			//Postion the text within the card.
			$("#" + tempTextID).css({'top': ($("#" + tempID).height() - $("#"+tempTextID).height())/2});
			
			$("#" + tempID).data("myTerm", myTerm);
			$("#" + tempID).data("myDef", myDef);
			
			card_arr.push("#" + tempID);
		}
		
		//Set height of holder, for styling
		$("#flashcardHolder").height($("#card0").height());
		
		if(transition == true){
			if (virgin == true){
				TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:checkMode});
				virgin = false;
			}else{
				TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
			}
		}else{
			if (virgin == true){
				checkMode();
				virgin = false;
			}
		}		
		enableNextCard();
		if(randomize == true){
			$("<div id='flashcardReshuffle'>shuffle</div>").insertAfter("#flashcardHolder");
		}else{
			$("<div id='flashcardReshuffle'>reset</div>").insertAfter("#flashcardHolder");
		}
		$("#flashcardReshuffle").button().click(function(){
			$("#flashcardHolder").empty();
			card_arr = [];
			myIndex = 1;
			shuffle();
			$(this).remove();
		});
	}
	
	function enableNextCard(){
		$(card_arr[currentCard]).hover(function(){
				$(this).addClass("flashcardHover");
			},function(){
				$(this).removeClass("flashcardHover");
			}).click(function(){
				$(this).unbind('mouseenter mouseleave click');
				$(this).removeClass("flashcardHover");
				TweenMax.to($(this), .2, {rotationY:90, left: $(this).position().left + $(this).width() + 25, zIndex: myIndex, onComplete:function(target){
					target.empty();
					tempID = "cardBackText" + myIndex;
					target.append("<div id='"+tempID+"' class='cardText'>"+target.data("myDef")+"</dev>");
					$("#" + tempID).css({'top': (target.height() - $("#" + tempID).height())/2});
					target.addClass("flashcardBack");
					TweenMax.to(target, .2, {rotationY:0, left: target.position().left});
					
				}, onCompleteParams:[$(this)]});
				myIndex++;
				
				if(currentCard == 0){
					if(mandatory == true){
						
					}
				}else{
					currentCard--;
					enableNextCard();
				}
			});
	}
	
	
	/*****************************************************************************************************************************************************************************************************************
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	PAGE EDIT FUNCTIONALITY
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	*****************************************************************************************************************************************************************************************************************/
	function checkMode(){
		$('.antiscroll-wrap').antiscroll();
		
		if(mode == "edit"){
			/**
			* Edit Content
			*/
			//Add and style contentEdit button
			$("#content").attr('contenteditable', true);
            CKEDITOR.disableAutoInline = true;
			CKEDITOR.inline( 'content', {
				on: {
					blur: function (event){
						if(cachedTextPreEdit != event.editor.getData()){
							saveContentEdit(event.editor.getData());
						}
						enableNext();
						enableBack();
					},
					focus: function (event){
						cachedTextPreEdit = event.editor.getData();
						disableNext();
						disableBack();
					}
				},
				toolbar: contentToolbar,
				toolbarGroups :contentToolgroup,
				extraPlugins: 'sourcedialog',
				allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
			});
			
			/**
			* Edit Cards
			*/
			$('#flashcardHolder').append("<div id='cardEdit' class='btn_edit_text' title='Edit Cards'></div>");
			
			$("#cardEdit").click(function(){
				cardEdit_arr.length = 0;
				//Create the Content Edit Dialog
				var msg = "<div id='cardEditDialog' title='Input Card Content'>";
				//msg += "<label id='label'><b>mandatory: </b></label>";
				//msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
				msg += "<label id='label'><b>randomize options: </b></label>";
				msg += "<input id='isRandom' type='checkbox' name='random' class='radio' value='true'/><br/><br/>";
				msg += "</div>";
				$("#stage").append(msg);
				
				if(!mandatory){
					$("#isMandatory").removeAttr('checked');
				}else{
					$("#isMandatory").attr('checked', 'checked');
				}
				
				if(!randomize){
					$("#isRandom").removeAttr('checked');
				}else{
					$("#isRandom").attr('checked', 'checked');
				}
				
				
				for(var i = cardCount - 1; i >= 0; i--){
					addCard(i, false);
				}
				
				//Style it to jQuery UI dialog
				$("#cardEditDialog").dialog({ 	
					autoOpen: true,
					modal: true,
					width: 600,
					height: 500,
					dialogClass: "no-close",
					buttons: {
						Add: function(){
							addCard(cardEdit_arr.length, true);	
						},
						Done: function(){
							/*if($("#isMandatory").prop("checked") == true){
								$(data).find("page").eq(currentPage).attr("mandatory", "true");
							}else{
								$(data).find("page").eq(currentPage).attr("mandatory", "false");
							}*/
							if($("#isRandom").prop("checked") == true){
								$(data).find("page").eq(currentPage).attr("randomize", "true");
							}else{
								$(data).find("page").eq(currentPage).attr("randomize", "false");
							}
							
							var tmpArray = new Array();
							
							for(var i = 0; i < cardEdit_arr.length; i++){
								var tmpObj = new Object();
								
								var myFrontText = cardEdit_arr[i]+"FrontText";
								tmpObj.front = CKEDITOR.instances[myFrontText].getData();
								var myBackText = cardEdit_arr[i]+"BackText";
								tmpObj.back = CKEDITOR.instances[myBackText].getData();
								tmpArray.push(tmpObj);
							}
							saveCardEdit(tmpArray);
							$( this ).dialog( "close" );
						}
					},
					close: function(){
						$("#cardEditDialog");
					} 
				});
			}).tooltip();
		}
		$(this).scrubContent();	
	}
	
	function addCard(_addID, _isNew){
		//ADD to XML if new....
		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<card><term/><definition/></card>"));
			var newFront1 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack1 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
			var frontCDATA1 = newFront1.createCDATASection("New Card Term");
			var backCDATA1 = newBack1.createCDATASection("New Card Definition");
			$(data).find("page").eq(currentPage).find("card").eq(_addID).find("term").append(frontCDATA1);
			$(data).find("page").eq(currentPage).find("card").eq(_addID).find("definition").append(backCDATA1);
			cardCount++;
		}
		
		var cardID = "card" + _addID;
		var cardLabel = _addID + 1;
		
		var myCardFront = $(data).find("page").eq(currentPage).find("card").eq(_addID).find("term").text();	
		var myCardBack = $(data).find("page").eq(currentPage).find("card").eq(_addID).find("definition").text();
		var removeID = "removeMedia" + _addID;
		
		var msg = "<div id='"+cardID+"' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='"+removeID+"' value='"+_addID+"' class='removeMedia' title='Remove this image'/>";
		msg += "<div id='"+cardID+"Front'><b>Card " + cardLabel + " Front:</b></div>";
		msg += "<div id='"+cardID+"FrontText' contenteditable='true' class='dialogInput'>" + myCardFront + "</div>";
		msg += "<div id='"+cardID+"Back'><b>Card " + cardLabel + " Back:</b></div>";
		msg += "<div id='"+cardID+"BackText' contenteditable='true' class='dialogInput'>" + myCardBack + "</div><br/>";
		msg += "</div>";
		
		$("#cardEditDialog").append(msg);
		
		$("#" + removeID).click(function(){
			removeCard($(this).attr("value"));	
		});
		
		CKEDITOR.inline( cardID+"FrontText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
			allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
		});	
		
		CKEDITOR.inline( cardID+"BackText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
			allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
		});	
		
		cardEdit_arr.push(cardID);
	}
	
	function removeCard(_removeID){
		for(var i = 0; i < cardEdit_arr.length; i++){
			if(_removeID == $("#"+cardEdit_arr[i]).attr("value")){
				var arrIndex = i;
				break;
			}
		}
									
		card_arr.splice(arrIndex, 1);
		cardEdit_arr.splice(arrIndex, 1);
		var myItem = "#card" + _removeID;
		$(myItem).remove();
	}
	
	 /**********************************************************************
     **Save Content Edit - save updated content text to content.xml
     **********************************************************************/
    function saveContentEdit(_data){
        var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
        var newCDATA=docu.createCDATASection(_data);
        $(data).find("page").eq(currentPage).find("content").first().empty();
        $(data).find("page").eq(currentPage).find("content").first().append(newCDATA);
        sendUpdate();
    };

	
	/**********************************************************************
	**Save Card Edit
	**********************************************************************/
	/**saveCardEdit
	* Sends the updated content to node.
	*/
	function saveCardEdit(_data){
		for(var i = 0; i < cardEdit_arr.length; i++){
			var frontText = _data[i].front;
			var backText = _data[i].back
			var newCardFront = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newCardBack = new DOMParser().parseFromString('<definition></definition>',  "text/xml");
			var frontCDATA = newCardFront.createCDATASection(frontText);
			var backCDATA = newCardBack.createCDATASection(backText);
			$(data).find("page").eq(currentPage).find("card").eq(i).find("term").empty();
			$(data).find("page").eq(currentPage).find("card").eq(i).find("term").append(frontCDATA);
			$(data).find("page").eq(currentPage).find("card").eq(i).find("definition").empty();
			$(data).find("page").eq(currentPage).find("card").eq(i).find("definition").append(backCDATA);
		}
		
		var extra = $(data).find("page").eq(currentPage).find("card").length;
		var active = cardEdit_arr.length;
		var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("card").eq(i).remove();
		}
		
		$("#cardEditDialog").dialog( "close" );
		sendUpdateWithRefresh();
		fadeComplete();
	};
		
	/*****************************************************************************************************************************************************************************************************************
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	ACESSIBILITY/508 FUNCTIONALITY
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	*****************************************************************************************************************************************************************************************************************/
	function doAccess(){
		var tabindex = 1;
	
		$("#pageTitle").attr("tabindex", tabindex);
		tabindex++;
		/*for(var i = 0; i < buttonArray.length; i++){
			$(buttonArray[i]).attr("tabindex", tabindex);
			tabindex++;
		}*/
		$("#content").attr("tabindex", tabindex);
		tabindex++;
		$("#loader").attr("tabindex", tabindex);
	}
	//////////////////////////////////////////////////////////////////////////////////////////////////END ACCESSIBILITY
	
	this.destroySelf = function() {
	   if(transition == true){
	   		TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:transitionType, onComplete:fadeComplete});
	   	}else{
		   	fadeComplete();
	   	}
	}
	
	this.fadeComplete = function(){
		fadeComplete();
	}
    // fadeComplete() moved to C_UtilFunctions.js
}