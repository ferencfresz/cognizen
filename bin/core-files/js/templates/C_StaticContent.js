/*!
 * C_StaticContent
 * This class creates a template for a all non-Interactive content (text/images/swfs).
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: Version 1.0
 * DATE: 2013-05-10
 * JavaScript
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_StaticContent(_type) {

	this.myImage;//image to be loaded.
    this.myPageTitle;//Title of this page.
    this.myContent;//Body
    this.myCaption;//Caption text if needed.
   // this.myAudio = "null";
    this.autoplay = false;//Boolean: true - attached media plays on load.  false - user interaction required to play media.  
    this.autoNext = false;//Boolean: true - next page loads automatically upon media completion.  false - user interaction required to load the next page.
    var hasCaption = false;
    var hasAudio = false;
    var mySidebar;
    var mediaWidth = 0;
    var mediaHeight = 0;
	
	var myAudio = "null";
	
    var stageW = $("#stage").width();
    var stageH = $("#stage").height();

    var type = _type;
    var mediaType;
    var hasPop = false;
    
    var mediaLink = null;
    var media_arr = [];
    var caption_arr = [];
    var captionEditText_arr = [];
	var largeImg = "";
	var audioUploader;

    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    INITIALIZE AND BUILD TEMPLATE
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	this.initialize = function(){
    	//transition variable in C_Engine - set in content.xml
        if(transition == true){
        	$('#stage').css({'opacity':0.1});
        }

        /*****************************************
        **Set template variables.
        *****************************************/

        //Sets whether the playable media autoplay or and auto transition to next page.
        autoNext = $(data).find("page").eq(currentPage).attr('autoNext');
        autoPlay = $(data).find("page").eq(currentPage).attr('autoplay');

        //Page title value from content.xml
        myPageTitle = $(data).find("page").eq(currentPage).find('title').text();

        //Position the page text
        myContent = $(data).find("page").eq(currentPage).find("content").text();

        if(type == "sidebar"){
            mySidebar = $(data).find("page").eq(currentPage).find("sidebar").text();
        }
        
        if($(data).find("page").eq(currentPage).attr('enlarge') != undefined && $(data).find("page").eq(currentPage).attr('enlarge') != "" && $(data).find("page").eq(currentPage).attr('enlarge') != " "){
	        largeImg = $(data).find("page").eq(currentPage).attr('enlarge');
        }
        
        if($(data).find("page").eq(currentPage).attr('popup') != "" && $(data).find("page").eq(currentPage).attr('popup') != undefined){
            hasPop = true;
            media_arr = $(data).find("page").eq(currentPage).attr('popup').split(",");
            caption_arr = $(data).find("page").eq(currentPage).attr('popcaps').split("!!!");	
        }

        if(type != "textOnly" && type != "sidebar"){
            mediaLink = $(data).find("page").eq(currentPage).attr('img');
            myCaption = $(data).find("page").eq(currentPage).find('caption').text();
        }


        //Check if the page has an associated audio file.
        if($(data).find("page").eq(currentPage).attr('audio') != undefined && $(data).find("page").eq(currentPage).attr('audio') != "null"){
            if($(data).find("page").eq(currentPage).attr('audio').length != 0){
                hasAudio = true;
                myAudio = $(data).find("page").eq(currentPage).attr('audio');
            }
        }else{
        	myAudio = "null";
        }

        buildTemplate();
    }

    //Defines a private method - notice the difference between the public definitions above.
    function buildTemplate() {
	   
        //Add the divs for the page title adn the content divs.
        $('#stage').append('<div id="pageTitle"></div>');
        $("#pageTitle").append(myPageTitle);

        //Add classes for page layouts - updatable in css
        $('#stage').append('<div id="contentHolder" class="nano"><div id="content" class="overthrow content"></div></div>');

        if(type == "left"){
            $("#contentHolder").addClass("left");
        }else if(type == "sidebar"){
            $("#contentHolder").addClass("left");
        }else if(type == "top"){
            $("#contentHolder").addClass("top");
            $("#stage").append("<div id='testTop' class='testTop'></div>");
            $("#testTop").append(myContent);
            var conHeight = $("#testTop").height();
            $("#testTop").remove();
            $("#contentHolder").height(conHeight);
        }else if(type == "bottom"){
			$("#contentHolder").addClass("bottom");
        }else if(type == "right"){
            $("#contentHolder").addClass("right");
        }else if(type == "textOnly"){
            $("#contentHolder").addClass("text");
        }else if(type == "graphicOnly"){
            $("#contentHolder").addClass("graphic");
        }

        $("#content").append(myContent);
        
        if(type != "bottom"){
        	$(".nano").nanoScroller({
        		flashDelay: 3000,
				flash: true
			});
		}

        /*Attach Media*/
        if(type == "textOnly"){
            if(transition == true){
                TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:checkMode});
            }else{
                checkMode();
            }
        }else if(type == "sidebar"){
            $('#stage').append('<div id="sidebarHolder" class="nano"></div>');
            $('#sidebarHolder').append('<div id="sidebar" class="sidebar content"></div>');
            $('#sidebar').append(mySidebar);
            if(transition == true){
                TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:checkMode});
            }else{
                checkMode();
            }
            
            $(".nano").nanoScroller({
                   flashDelay: 3000,
                   flash: true
            });   
                    
        }else{
            $('#stage').append('<div id="loader" class="loading" title="click to browse or drag media to this location" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div>');
            var tempID = "#loader";
            loadVisualMedia();
        }

        //check the xml for audio / if so, kick off audio code.
        if(hasAudio == true){
            $('#stage').append('<div id="audioCon"></div>');
            loadAudio();
        }
    }

    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    MEDIA FUNCTIONALITY
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
    /**********************************************************************
    **Load Visual Content from Link  -  creates tags and media player instance -
    ** Currently handles - .png, .swf, .jpg, .gif, .mp4, .html
    **********************************************************************/

    function loadVisualMedia(){
    	
        var contentH = $("#content").height();
        var contentW = $("#content").width();
        var contentX = $("#contentHolder").position().left;
        var contentY = $("#contentHolder").position().top;
        var titleY = $("#pageTitle").position().top;
        var titleH = $("#pageTitle").height();
	   
        if(type == "left"){
            $("#loader").addClass("right");
        }else if(type == "top"){
            $("#loader").addClass("bottom");
        }else if(type == "bottom"){
            $("#loader").addClass("top");
        }else if(type == "right"){
            $("#loader").addClass("left");
        }else if(type == "graphicOnly"){
            $("#loader").addClass("graphic");
        }

        var mediaLinkType = $(data).find("page").eq(currentPage).attr('mediaLinkType');

        if($(data).find("page").eq(currentPage).attr('img') != "" && $(data).find("page").eq(currentPage).attr('img') != " "){
            myImage = "media/" + mediaLink;
        }else{
            //We will have default.png's for different layouts - just a series of if, else if below here.
            myImage = "media/default.png";
        }

        var parts = myImage.split('.'), i, l;
        var last = parts.length;

        mediaType = (parts[last - 1]);
		
        if(mediaType == "swf"){////////////////////////////////////////////////Flash
            imageWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
            imageHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
            resizeForMobile();
            $("#loader").removeClass('loading');
            $("#loader").flash({swf:myImage,width:imageWidth,height:imageHeight});


            if(type == "top"){
                imgY = contentY + contentH + 20;
                imgX = (stageW - imageWidth) / 2;
                $("#loader").css({'top': imgY, 'left': imgX});
            }else if (type == "bottom"){
                imgX = (stageW - imageWidth) / 2;
                $("#loader").css({'left': imgX});
            }else if (type == "graphicOnly"){
                var startY = titleY + titleH + 20;
                var space = (stageH - startY);
                imgY =  startY + (space / 2);
                imgX = (stageW - imageWidth) / 2;
                $("#loader").css({'top': imgY, 'left': imgX})
            }
        }else if (mediaType == "html"){////////////////////////////////////////////////HTML for edge or js apps.
            imageWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
            imageHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
            resizeForMobile();

            $("#loader").append('<object id="edgeContent" data='+myImage+' type="text/html" width="' + imageWidth + '" height="' + imageHeight + '" align="absmiddle"></object>');
            $("#loader").removeClass('loading');
            if(type == "top"){
                imgY = contentY + contentH + 20;
                imgX = (stageW - imageWidth) / 2;
                $("#loader").css({'top': imgY, 'left': imgX});
            }else if (type == "bottom"){
                imgX = (stageW - imageWidth) / 2;
                $("#loader").css({'left': imgX});
            }else if (type == "graphicOnly"){
                var startY = titleY + titleH + 20;
                var space = (stageH - startY);
                imgX = (stageW - imageWidth) / 2;
                $("#loader").css({'top': startY, 'left': imgX})
            }
        }else if (mediaType == "mp4"  || mediaLinkType == "youtube"){////////////////////////////////////////////////VIDEO

            autoNext = $(data).find("page").eq(currentPage).attr('autoNext');
            imageWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
            imageHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
            autoPlay = $(data).find("page").eq(currentPage).attr('autoplay');
            resizeForMobile();

            var vidHTMLString = "<video id='videoplayer' width=" + imageWidth + " height=" + imageHeight + " controls='controls'";

            if(mediaLinkType == "youtube"){
                vidHTMLString += " preload='none'";
            }

            var hasPoster;
            var posterLink;
            var hasSubs;
            var subsLink;

            if($(data).find("page").eq(currentPage).attr('poster') != undefined && $(data).find("page").eq(currentPage).attr('poster') != "null" && $(data).find("page").eq(currentPage).attr('poster').length != 0){
                hasPoster = true;
                posterLink = $(data).find("page").eq(currentPage).attr('poster');
            }else{
                hasPoster = false;
            }

            //Check Poster
            if(hasPoster == true){
                vidHTMLString += "poster='"+posterLink+"'>";
            }else{
                vidHTMLString += ">";
            }

            vidHTMLString += "<source type='video/";

            //Check type and add appropriate.
            if(mediaLinkType == "youtube"){
                vidHTMLString += "youtube' ";
            }else{
                vidHTMLString += "mp4' ";
            }

            //Add the video source and close the source node.
            vidHTMLString += "src='" + myImage + "'/>";

            //Check for subs - defaults to false.
            if($(data).find("page").eq(currentPage).attr('subs') != undefined && $(data).find("page").eq(currentPage).attr('subs') != "null" && $(data).find("page").eq(currentPage).attr('subs').length != 0){
                hasSubs = true;
                subLink = $(data).find("page").eq(currentPage).attr('subs');
            }else{
                hasSubs = false;
            }

            //Check subs - if subs at track node.
            if(hasSubs == true){
                vidHTMLString += "<track kind='subtitles' src='" + subLink + "' srclang='en'/>"
            }

            vidHTMLString += "</video>";


            //Add the HTML to it's div.
            $("#loader").append(vidHTMLString);
            
            $('video').mediaelementplayer({
                success: function(player, node) {
                    //If autoNext then move to next page upon completion.
                    if(autoNext == "true"){
                        player.addEventListener('ended', function(e) {
                            hasEnded();
                        }, false);
                    }

                    //If autoplay - cick off the vid
                    if(autoPlay == "true"){
                        $('.mejs-overlay-button').trigger('click');
                    }
                }
            });
            if(type == "top"){
                imgY = contentY + contentH + 20;
                imgX = (stageW - imageWidth) / 2;
                $("#loader").css({'top': imgY, 'left': imgX});
            }else if (type == "bottom"){
                imgX = (stageW - imageWidth) / 2;
                $("#loader").css({'left': imgX});
            }else if (type == "graphicOnly"){
                var startY = titleY + titleH;
                var space = (stageH - startY);
                imgY =  (startY + (stageH - imageHeight))/2;
                imgX = (stageW - imageWidth) / 2;
                $("#loader").css({'top': imgY, 'left': imgX})
            }
        }else{////////////////////////////////////////////////IMAGES
            var img = new Image();
            $(img).load(function(){
                $("#loader").removeClass('loading').append(img);
                imageWidth = $(img).width();
                imageHeight = $(img).height();
                if(type == "top"){
                    imgY = contentY + contentH + 20;
                    imgX = (stageW - imageWidth) / 2;
                    $("#loader").css({'top': imgY, 'left': imgX});
                }else if (type == "bottom"){
                    imgX = (stageW - imageWidth) / 2;
                    $("#loader").css({'left': imgX});
                }else if (type == "graphicOnly"){
                    var startY = titleY + titleH;
                    var space = (stageH - startY);
                    imgY = (space / 2);
                    imgX = (stageW - imageWidth) / 2;
                    $("#loader").css({'top': startY, 'left': imgX})
                }
                
                ///////////////////////////////////////////////////////////////////////////////////////ONLY FOR IMAGES FOR NOW - HAVE TO LOOK INTO HOW TO DO DIFFERENT MEDIA TYPES
                ///////////////////////////////////////////////////////////////////////////////////////
                // MEDIA POPUP CODE
                //////////////////////////////////////////////////////////////////////////////////////
				if(hasPop == true || largeImg != ""){
					var tempItem;
					var tempCaption;
					if(largeImg != ""){
						tempItem = "media/" + largeImg;
						tempCaption = myCaption;
					}else{
						tempItem = "media/" + media_arr[0];
						tempCaption = caption_arr[0];
					}
				
					var mediaPopString = "<div id='myImgList' class='imglist'><a id='mediaPop' rel='mediaPop' class='mediaPop'  href='"+tempItem+"'><img src='css/images/img-enlarge.gif' title='click to view enlarged media' alt='' /></a>";
					
					if(media_arr.length > 0){
						mediaPopString += "<span style='display:none;'>";
						var startPoint;
						if(largeImg == ""){
							startPoint = 1;
						}else{
							startPoint = 0;
						}
						for(var i = startPoint; i < media_arr.length; i++){
							mediaPopString += "<a rel='mediaPop' data-fancybox-group='gallery' href='media/"+ media_arr[i] + "' title='"+ caption_arr[i] + "'></a>";
						}
						mediaPopString += "</span>";
					}
				
					mediaPopString += "</div>";
				
					$("#stage").append(mediaPopString);				 
				 
					$("[rel='mediaPop']").fancybox({
						caption : {
							type : 'inside'
						},
						openEffect  : 'elastic',
						closeEffect : 'elastic',
						nextEffect  : 'elastic',
						prevEffect  : 'elastic',
						maxHeight	: 1024,
						maxWidth	: 768,
						helpers : {
							title : tempCaption
						}
					});
				
					if(mediaType = "swf"){
					 	$("[rel='mediaPop']").fancybox({
							width	:  	parseInt($(data).find("page").eq(currentPage).attr('w')),
							height 	:	parseInt($(data).find("page").eq(currentPage).attr('h'))
						});
					}
				
					$(".mediaPop").css({'top': $("#loader").position().top + $("#loader").height() - 3, 'left': $("#loader").position().left + $("#loader").width() - 84});
					$("#myImgList").tooltip();
					$("#mediaPop").click(function(){
						try { $("#myImgList").tooltip("destroy"); } catch (e) {}
						$(this).attr("title", tempCaption);
					});
				}
				///////////////////////////////////////////////////////////////////////////////END MEDIA POP UP

                if(transition == true){
                    TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:setCaption});
                }else{
                    setCaption();
                }
            }).attr('src', myImage).attr('alt', $(data).find("page").eq(currentPage).attr('alt')).attr('id', 'myImg');
        }

        //Other media types include their size so we don't need to wait for them to load to place the caption - images (png, gif, jpg) don't so we have to do caption inside of the load event.
        if(mediaType == "mp4" || mediaType == "html"  || mediaType == "swf" || mediaLinkType == "youtube"){
            if(transition == true){
                TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:setCaption});
            }else{
                setCaption();
            }
        }

        $("#loader").removeClass('loading');
    }
    /////////////END of loadVisualMedia


    /**********************************************************************
     **Adjust objects width and height when on a mobile device
     **windowWidth = $('body').width(); - set in C_Engine.js
     **mobileWidth is set in C_Engine.js
     **********************************************************************/
    function resizeForMobile(){
        if(windowWidth <= mobileWidth){
            if(imageWidth > windowWidth){
                imageHeight = (imageHeight / imageWidth) * windowWidth;
                imageWidth = windowWidth-1;
            }
        }
    }

    /**********************************************************************
     **Load Audio Content from Link  -  creates audio player instance at bottom of stage.
     **********************************************************************/
    function loadAudio(){
        var contentH = $("#contentHolder").height();
        var contentW = $("#contentHolder").width();
        var contentX = $("#contentHolder").position().left;
        var contentY = $("#contentHolder").position().top;
        var titleY = $("#pageTitle").position().top;
        var titleH = $("#pageTitle").height();

        var audioString = "<audio id='audioPlayer' src='media/"+myAudio+ "' type='audio/mp3' controls='controls'>";

        //Check for subs - defaults to false.
        if($(data).find("page").eq(currentPage).attr('subs') != undefined && $(data).find("page").eq(currentPage).attr('subs') != "null" && $(data).find("page").eq(currentPage).attr('subs').length != 0){
            hasSubs = true;
            subLink = $(data).find("page").eq(currentPage).attr('subs');
        }else{
            hasSubs = false;
        }

        //Check subs - if subs at track node.
        if(hasSubs == true){
            audioString += "<track kind='subtitles' src='" + subLink + "' srclang='en'/>"
        }

        audioString += "</audio>";

        $("#audioCon").append(audioString);

        if(windowWidth <= mobileWidth){
            $('#audioPlayer').css({'width':stageW-1, 'height': 20});
        }
        else{
            $('#audioPlayer').css({'width':stageW, 'height': 20});
        }
        

        $('#audioPlayer').mediaelementplayer({
            success: function(player, node) {

                if(autoNext == "true"){
                    player.addEventListener('ended', function(e) {
                        hasEnded();
                    }, false);
                }
                if(autoPlay == "true"){
                    player.play();
                }
            }
        });
    }
    ////////////END of loadAudio



    //Function called on video complete if autoNext == true
    function hasEnded(){
        $('#next').click();
    }

    function setCaption(){
        
        var myCaption = $(data).find("page").eq(currentPage).find('caption').text();
        $('#stage').append('<div id="caption"></div>');
        $('#caption').append(myCaption);
        if(hasPop != true && largeImg == ""){
        	 $('#caption').css({'position':'absolute', 'top':$("#loader").position().top + $('#loader').height() + 5, 'left': $("#loader").position().left + 40, 'width':$("#loader").width() - 80});
        }else{
	      $('#caption').css({'position':'absolute', 'top':$("#loader").position().top + $('#loader').height() + 20, 'left': $("#loader").position().left + 40, 'width':$("#loader").width() - 80});  
        }

        if(transition == true){
            $('#caption').css({'opacity': 0});
            TweenMax.to($('#caption'), transitionLength, {css:{opacity:1}, ease:transitionType});
        }
        
        //Set content height and position for bottom text after everything else has been set...
        if(type == "bottom"){
	       var conYPos = $("#caption").position().top + $("#caption").height()+10;
	       var conHeight = stageH - conYPos;
	       console.log("conHeight = " + conHeight);
            $("#contentHolder").height(conHeight);
            $("#content").height(conHeight - 4);
            $("#contentHolder").css({'top': conYPos});
            
            $(".nano").nanoScroller({
        		flashDelay: 3000,
				flash: true
			});
        }
        
        checkMode();
    }

    ///////////////////////////////////////////////////////////////////////////END MEDIA FUNCTIONALITY


    /*****************************************************************************************************************************************************************************************************************
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     PAGE EDIT FUNCTIONALITY
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     *****************************************************************************************************************************************************************************************************************/
     function checkMode(){
     	
     	if(mode == "edit"){
            	
            /*******************************************************
			* Edit Title
			********************************************************/
                //Add and style titleEdit button
			 $('#stage').append("<div id='titleEdit' class='btn_edit_text' title='Edit Title'></div>");
			 $("#titleEdit").css({'position':'absolute', 'top':$("#pageTitle").position().top - 18, 'left': $("#pageTitle").position().left + $("#pageTitle").width() - 18});
			 //Add title Edit functionality
			 $("#titleEdit").click(function(){
                //Create the Dialog
			 	$("#stage").append("<div id='titleDialog' title='Input Page Title'><div id='titleEditText' type='text'>" + myPageTitle + "</div></div>");
			 	//Style it to jQuery UI dialog
			 	$("#titleDialog").dialog({
                    autoOpen: true,
					modal: true,
					width: 550,
					buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: saveTitleEdit
				});

				$("#titleEditText").redactor({
                    focus: true,
					buttons: ['bold', 'italic', 'underline', 'deleted', '|', 'fontcolor', 'backcolor']
				});
			}).tooltip();

			/*******************************************************
			* Edit Sidebar
			********************************************************/
			//Add and style contentEdit button
			if(type == "sidebar"){
                $('#stage').append("<div id='sideEdit' class='btn_edit_text' title='Edit Sidebar Content'></div>");
			 	$("#sideEdit").css({'position':'absolute', 'top':$("#sidebarHolder").position().top - 18, 'left': $("#sidebarHolder").position().left + $("#sidebarHolder").width() - 18});

			 	$("#sideEdit").click(function(){
                    	$("#stage").append("<div id='sidebarEditDialog' title='Input Sidebar Content'><div id='sidebarEditText' type='text' style='width:" + $('#sidebar').width() + "; height:85%' >" + $("#sidebar").html() + "</div>");
					//Style it to jQuery UI dialog
					$("#sidebarEditDialog").dialog({
						autoOpen: true,
						modal: true,
						width: 800,
						height: 500,
						buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
						close: saveSidebarEdit
					});

					$("#sidebarEditText").redactor({
						focus: true,
						buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
					});
				}).tooltip();
			}

			/*******************************************************
			* Edit Content
			********************************************************/
			//Add and style contentEdit button
			if(type != "graphicOnly"){
                $('#stage').append("<div id='conEdit' class='btn_edit_text' title='Edit Text Content'></div>");
			 	$("#conEdit").css({'position':'absolute', 'top':$("#contentHolder").position().top - 18, 'left': $("#contentHolder").position().left + $("#content").width() - 18});

			 	$("#conEdit").click(function(){

                    	//Create the Content Edit Dialog
					$("#stage").append("<div id='contentEditDialog' title='Input Page Content'><div id='contentEditText' type='text' style='width:" + $('#content').width() + "; height:85%' >" + myContent + "</div>");

					var myHeight;

					if($("#contentHolder").height() < 300){
						myHeight = 350;
					}else if($("#contentHolder").height() > (stageH - 80)){
						myHeight = stageH - 80;
					}else{
						myHeight = $("#contentHolder").height();
					}
					//Style it to jQuery UI dialog
					$("#contentEditDialog").dialog({
						autoOpen: true,
						modal: true,
						width: $("#contentHolder").width() + 100,
						height: myHeight + 150,
						buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
						close: saveContentEdit
					});

					$("#contentEditText").redactor({
						focus: true,
						buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
					});
				}).tooltip();
			}

			/*******************************************************
			* Edit Image
			********************************************************/
			if(type != "textOnly" && type !=  "sidebar"){
				//place image edit button
                $('#stage').append("<div id='imgEdit' class='btn_edit_media' title='Edit Image and Caption'></div>");
			 	$("#imgEdit").css({'position':'absolute', 'top':$("#loader").position().top - 18, 'left': $("#loader").position().left + $("#loader").width() - 18});

                //Establish it's functionality
				$("#imgEdit").click(function(){
					
                	$("#stage").append("<div id='imgDialog' title='Input Media Path'><input id='imgPath' type='text' value="+ mediaLink + " defaultValue="+ mediaLink + " style='width:100%;'/><br/><div>Edit Caption:</div><div id='captionEditText' type='text' style='width:" + $('#caption').width() + "; height:85%' >" + myCaption + "</div><label id='label'>large version: </label><input id='isEnlargeable' type='checkbox' name='enableLargeIgm' class='radio' value='true'/><input id='lrgImgPath' type='text' value="+ mediaLink + " defaultValue="+ mediaLink + " style='width:70%;'/><br/><br/></div>");
                    	
                    if(largeImg == ""){
						$("#isEnlargeable").removeAttr('checked');
					}else{
						$("#isEnlargeable").attr('checked', 'checked');
					}
                    	
                    $("#captionEditText").redactor({
						focus: true,
						buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'link', 'fontcolor', 'backcolor']
					});
					
					
					for(var i = 0; i < media_arr.length; i++){	
						var thisCaption = "captionEditText" + i;
						var removeID = "removeMedia" + i;
						var galleryItemID = "galleryItem" + i;
						
						$("#imgDialog").append("<div id='"+galleryItemID+"'><HR><div id='"+removeID+"' value='"+i+"' class='removeMedia'></div><label id='label'>Gallery Item: </label><HR WIDTH='75%'><label id='label'>Media: </label><input id='imgPath" + i + "' type='text' value="+ media_arr[i] + " defaultValue="+ media_arr[i] + " style='width:80%;'/><br/><div>Edit Caption:</div><div id='"+thisCaption+"' type='text' style='width:" + $('#caption').width() + "; height:85%' >" + caption_arr[i] + "</div></div>");
						$("#" + removeID).click(function(){
							var arrIndex = $(this).attr('value');
							//captionEditText_arr, media_arr, caption_arr, destroyEditor
							media_arr.splice(arrIndex,1);
							caption_arr.splice(arrIndex, 1);
							$(captionEditText_arr[arrIndex]).destroyEditor();
							captionEditText_arr.splice(arrIndex, 1);
							var myItem = "#galleryItem" + arrIndex;
							$(myItem).remove();		
						});
						
						captionEditText_arr.push("#" + thisCaption);
						$("#" + thisCaption).redactor({
							focus: true,
							buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'link', 'fontcolor', 'backcolor']
						});
					}

					$("#imgDialog").dialog({
                        autoOpen: true,
					   	modal: true,
					   	width: 550,
					   	buttons: {
							Cancel: function(){
								$( this ).dialog( "close" );
							},
							Add: function(){
								var imgID = "imgPath" + media_arr.length;
								var captionTextID = "captionEditText" + caption_arr.length;
								var removeID = "removeMedia" + media_arr.length;
								var galleryItemID = "galleryItem" + media_arr.length;
								captionEditText_arr.push("#" + captionTextID);
								
								$("#imgDialog").append("<div id='"+galleryItemID+"'> <HR><div id='"+removeID+"' value='"+i+"' class='removeMedia'></div><label id='label'>Gallery Item: </label><HR WIDTH='75%'><label id='label'>Media: </label><input id='" + imgID + "' type='text' value='defaultTop.png' defaultValue='defaultTop.png' style='width:100%;'/><br/><div>Edit Caption:</div><div id='"+captionTextID+"' type='text' style='width:" + $('#caption').width() + "; height:50px' ></div></div>");
								$("#" + removeID).click(function(){
									var arrIndex = $(this).attr('value');
									//captionEditText_arr, media_arr, caption_arr, destroyEditor
									media_arr.splice(arrIndex,1);
									caption_arr.splice(arrIndex, 1);
									$(captionEditText_arr[arrIndex]).destroyEditor();
									captionEditText_arr.splice(arrIndex, 1);
									var myItem = "#galleryItem" + arrIndex;
									$(myItem).remove();
								});
								//If no entries - just add the next one.
								if(media_arr.length == 0){
									$(data).find("page").eq(currentPage).attr('popup', "defaultTop.png");
									$(data).find("page").eq(currentPage).attr('popcaps', " ");
								}else{
									var popString = $(data).find("page").eq(currentPage).attr('popup');
									popString += ",defaultTop.png";
									$(data).find("page").eq(currentPage).attr('popup', popString);
									var commentString = $(data).find("page").eq(currentPage).attr('popcaps');
									commentString += "!!! ";
									$(data).find("page").eq(currentPage).attr('popcaps', commentString);
								}
								
								media_arr.push("defaultTop.png");
								caption_arr.push(" ");
								
								$("#" + captionTextID).redactor({
									focus: true,
									buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'link', 'fontcolor', 'backcolor']
								});
							},
							Save: function(){
								$( this ).dialog( "close" );
								saveImageEdit($("#imgPath").val());
							}
						}
					});
				}).tooltip();

				/*******************************************************
				* Drag and Drop Upload &&& Click Image for browse to image to upload
				********************************************************/
				if(dragFile == true){
					var $loader = $('#loader');
					var contentId = urlParams['type'] + '_' + urlParams['id'];
					$loader.attr('data-content', contentId);
					$loader.find('*').attr('data-content', contentId);
					
					$loader.click(function(){
						try { $("#loader").tooltip("destroy"); } catch (e) {}
						//$loader.unbind();
						siofu.prompt($loader.attr('data-content'));
					});
	
					siofu.listenOnDrop(document.getElementById("loader"));
					
					$("#loader").tooltip();
				}
			}
			
			siofu.addEventListener("complete", function(event){
				siofu.removeEventListener("complete");
				siofu.removeEventListener("load");
				//if successful upload, else....
							
				var myFile = event.file.name;
				var myExt = getExtension(myFile);
				if(myExt == "mp4" || myExt == "jpg" || myExt == "gif" || myExt == "png" || myExt == "JPG" || myExt == "jpeg" || myExt == "mp3" || myExt == "MP3" || myExt == "swf"){	
					if(event.success == true){
						if(myExt == "mp3" || myExt == "MP3"){
							var audioText;
							audioText = myFile;

							$("#stage").append("<div id='audioEditDialog' title='Input Audio Path'><input id='audioPath' type='text' value="+ audioText + " defaultValue="+ audioText + " style='width:100%;'/></div>");

							//Style it to jQuery UI dialog
							$("#audioEditDialog").dialog({
								autoOpen: true,
								modal: true,
								width: 500,
								height: 200,
								buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
								close: saveAudioEdit
							});
						}else{
							saveImageEdit(myFile, true);
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
					$("#mediaLoader").remove();
				}else{
					$("#mediaLoaderText").empty();
					$("#mediaLoaderText").append("The file format that you upladed can't be played in most browsers. Not to fear though - we are converting it to a compatibile format for you!<br/><br/>Larger files may take a few moments.<br/><br/>");
					$("#mediaLoaderText").append("<div id='conversionProgress'><div class='progress-label'>Converting...</div></div>");
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
																
					cognizenSocket.on('mediaConversionProgress', mediaConversionProgress);								
					cognizenSocket.on('mediaInfo', mediaInfo);
					cognizenSocket.on('mediaConversionComplete', mediaConversionComplete);
				}
			});
			
			siofu.addEventListener("start", function(event){
				var myFile = event.file.name;
				var myExt = getExtension(myFile);
				if(myExt == "mp3"){
					try { $("#audioDrop").tooltip("destroy"); } catch (e) {}
					$("#stage").append("<div id='mediaLoader' class='mediaLoader'></div>");
					$("#mediaLoader").css({'position':'absolute', 'top': $("#audioDrop").position().top, 'left': $("#audioDrop").position().left, 'height': $("#audioDrop").height(), 'width': $("#audioDrop").width()});
				}else{
					$("#stage").append("<div id='mediaLoader' class='mediaLoader'></div>");
					$("#mediaLoader").css({'position':'absolute', 'top': $("#loader").position().top, 'left': $("#loader").position().left, 'height': $("#loader").height(), 'width': $("#loader").width()});
					$("#mediaLoader").append("<div id='mediaLoaderText'>Please Wait.<br/><br/>Your media is being uploaded to the server.<br/><br/>Larger files may take a few moments.</div>");
					$("#mediaLoaderText").css({'position':'absolute', 'height': $("#loader").height(), 'width': $("#loader").width()});
					try { $("#loader").tooltip("destroy"); } catch (e) {}
				}
			});

			/*******************************************************
			* Edit Audio
			********************************************************/
			
            if(dragFile == true){
	     		var contentId = urlParams['type'] + '_' + urlParams['id'];
	     		$('#stage').append("<div id='audioDrop' class='audioDropSpot' title='click to browse or drag mp3 to this location'>AudioDrop</div>");
	     		if(hasAudio == true){
	     			$("#audioDrop").css({'position':'absolute', 'bottom':30, 'right': 20});
	     		}else{
		     		$("#audioDrop").css({'position':'absolute', 'bottom':0, 'right': 20});
	     		}
	     		
	     		$("#audioDrop").attr('data-content', contentId);
		 		$("#audioDrop").find('*').attr('data-content', contentId);
		 		
		 		$("#audioDrop").click(function(){
					try { $("#audioDrop").tooltip("destroy"); } catch (e) {}
					siofu.prompt($("#audioDrop").attr('data-content'));
				}).tooltip();
				
				siofu.listenOnDrop(document.getElementById("audioDrop"));
	     	} 
			
			$('#stage').append("<div id='audioEdit' class='btn_edit_audio' title='Edit Page Audio'></div>");
			//Move the audio edit button up if so as not to lay over the player, if there's audio on the page.
			if(hasAudio == true){
	     		$("#audioEdit").css({'position':'absolute', 'bottom':30, 'right': 0});
			}else{
          		$("#audioEdit").css({'position':'absolute', 'bottom':0, 'right': 0});
          		
			}
			
			
			//Add Audio Edit
			$("#audioEdit").click(function(){
				//Create the Content Edit Dialog
				var audioText;
				if(myAudio == "null"){
                    	audioText = "yourFile.mp3";
				}else{
                    	audioText = myAudio;
				}

				$("#stage").append("<div id='audioEditDialog' title='Input Audio Path'><input id='audioPath' type='text' value="+ audioText + " defaultValue="+ audioText + " style='width:100%;'/></div>");

				//Style it to jQuery UI dialog
				$("#audioEditDialog").dialog({
                    autoOpen: true,
					modal: true,
					width: 500,
					height: 200,
					buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: saveAudioEdit
				});
			}).tooltip();
		}
		$(this).scrubContent();
	}
	
	function mediaConversionProgress(data){
		//console.log('mediaProgress');
	    $("#conversionProgress").progressbar("value", Math.floor(data.percent))
	}
	
	function mediaInfo(data){
		var splitDim = data.video_details[2].split("x");
		mediaWidth = splitDim[0];
		mediaHeight = splitDim[1];
	}
	
	function mediaConversionComplete(data){
		console.log("mediaConversionComplete - start");
		var splitPath = data.split("/");
		var last = splitPath.length;
		var mediaPath = splitPath[last-1];
		saveImageEdit(mediaPath, true);
		$("#mediaLoader").remove();
		console.log("mediaConversionComplete - end");
	}


	/**********************************************************************
     **Save Title Edit - save updated page title text to content.xml
     **********************************************************************/
	function saveTitleEdit(){
        var titleUpdate = $("#titleEditText").getCode();
	   	var docu = new DOMParser().parseFromString('<title></title>',  "application/xml");
	   	var newCDATA=docu.createCDATASection(titleUpdate);
	   	$("#pageTitle").html($("#titleEditText").html());
	   	myPageTitle = titleUpdate;
	   	$("#titleEditText").destroyEditor();
	   	$(data).find("page").eq(currentPage).find("title").empty();
	   	$(data).find("page").eq(currentPage).find("title").append(newCDATA);
	   	$("#titleDialog").remove();
	   	sendUpdateWithRefresh();
	};

    /**********************************************************************
     **Save Content Edit - save updated content text to content.xml
     **********************************************************************/
    function saveContentEdit(){
        //Grab the updated text from redactor.
        var contentUpdate = $("#contentEditText").getCode();
        //We create an xml doc - add the contentUpdate into a CDATA Section
        var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
        var newCDATA=docu.createCDATASection(contentUpdate);
        //Now, destroy redactor.
        $("#content").html(contentUpdate);
        myContent = contentUpdate;
        $("#contentEditText").destroyEditor();
        //Update the local xml - first clearning the content node and then updating it with out newCDATA
        $(data).find("page").eq(currentPage).find("content").empty();
        $(data).find("page").eq(currentPage).find("content").append(newCDATA);
        $("#contentEditDialog").remove();
        sendUpdate();
    };

    	/**********************************************************************
     **Save Sidebar Edit
     **********************************************************************/
	function saveSidebarEdit(){
        //Grab the updated text from redactor.
	   	var contentUpdate = $("#sidebarEditText").getCode();
	   	//We create an xml doc - add the contentUpdate into a CDATA Section
	   	var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
	   	var newCDATA=docu.createCDATASection(contentUpdate);
	   	//Now, destroy redactor.
	   	$("#sidebar").html(contentUpdate);
	   	mySidebar = contentUpdate;
	   	$("#sidebarEditText").destroyEditor();
	   	//Update the local xml - first clearning the content node and then updating it with out newCDATA
	   	$(data).find("page").eq(currentPage).find("sidebar").empty();
	   	$(data).find("page").eq(currentPage).find("sidebar").append(newCDATA);
	   	$("#sidebarEditDialog").remove();
	   	sendUpdate();
	};


	/**********************************************************************
     **Save Image Edit
     **********************************************************************/
	function saveImageEdit(_path, fromDrop){
		fromDrop = typeof fromDrop !== 'undefined' ? fromDrop : false;
		
		if($("#captionEditText").length != 0){
			var capChange = false;
			var captionUpdate = $("#captionEditText").getCode();
		   	var docu = new DOMParser().parseFromString('<caption></caption>',  "application/xml");
		   	var newCDATA=docu.createCDATASection(captionUpdate);
		   	
		   	$("#caption").html($("#captionEditText").html());
		   	myCaption = captionUpdate;
		   	
		   	$("#captionEditText").destroyEditor();
		   	if(captionUpdate != $(data).find("page").eq(currentPage).find("caption").text()){
		   		$(data).find("page").eq(currentPage).find("caption").empty();
		   		$(data).find("page").eq(currentPage).find("caption").append(newCDATA);
		   		capChange = true;
		   	}
			var startPath = $("#imgPath").attr("defaultValue");
		}else{
			var startPath = "superBad";
		}
		
		//Check if there is an enlarged image to link
		if($("#isEnlargeable").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("enlarge", $("#lrgImgPath").val());
		}else{
			$(data).find("page").eq(currentPage).attr("enlarge", "");
		}
		
		//Check if there is a gallery attached AND that the media wasn't dropped.
		if(media_arr.length > 0 && fromDrop == false){
			var mediaString = "";
			var captionString = "";
			var virgin = true;
			
			for(var i = 0; i < media_arr.length; i++){
				if(virgin == false){
					mediaString +=",";
					captionString += "!!!"
				}
				mediaString += $("#imgPath"+i).val();
				captionString += $(captionEditText_arr[i]).getCode();
				virgin = false;
			}	
			$(data).find("page").eq(currentPage).attr("popup", mediaString);
			$(data).find("page").eq(currentPage).attr("popcaps", captionString);	 	
			for(var j=0; j<captionEditText_arr.length; j++){
				$(captionEditText_arr[j]).destroyEditor();			   	
			}
			captionEditText_arr.length = 0;
		}else if(media_arr.length == 0){
			$(data).find("page").eq(currentPage).attr("popup", "");
			$(data).find("page").eq(currentPage).attr("popcaps", "");
		}
		
		var imgPath = _path;
		   	
	   	if(imgPath != startPath){
            var parts = imgPath.split('.'), i, l;
		  	var last = parts.length;

		  	mediaType = getExtension(imgPath);
		  
		  	if(mediaType == "mp4"){
                $(data).find("page").eq(currentPage).attr("img", imgPath);
			 	$("#loader").append("<div id='videoDialog' title='Input Video Stats'><div>Video Width: <input id='videoWidth' type='text' value="+ mediaWidth + " defaultValue="+ mediaWidth + " style='width:100%;'/></div><div>Video Height: <input id='videoHeight' type='text' value="+ mediaHeight + " defaultValue="+ mediaHeight + " style='width:100%;'/></div><input id='autoplay' type='checkbox' name='autoplay' class='radio' value='true'/><label id='label'>autoplay</label></input><input id='autonext' type='checkbox' name='autonext' class='radio' value='true'/><label id='label'>autonext</label></input><input id='poster' type='checkbox' name='hasPoster' class='radio' value='true'/><label id='label'>poster</label></input><input id='subs' type='checkbox' name='hasSubs' class='radio' value='true'/><label id='label'>subtitles</label></input></div>");
			 	
			 	$("#videoDialog").dialog({
                    autoOpen: true,
					modal: true,
					buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: function(){
						var strippedPath = "";
						$(data).find("page").eq(currentPage).attr("w", $("#videoWidth").val());
						$(data).find("page").eq(currentPage).attr("h", $("#videoHeight").val());
						for(var i = 0; i < last-1; i++){
							strippedPath += parts[i];
						}
						if($("#subs").prop("checked") == true){
							$(data).find("page").eq(currentPage).attr("subs", strippedPath + ".srt");
						}else{
							$(data).find("page").eq(currentPage).attr("subs", "null");
						}

						if($("#poster").prop("checked") == true){
							$(data).find("page").eq(currentPage).attr("poster", strippedPath + ".png");
						}else{
							$(data).find("page").eq(currentPage).attr("poster", "null");
						}

						if($("#autoplay").prop("checked") == true){
							$(data).find("page").eq(currentPage).attr("autoplay", "true");
						}else{
							$(data).find("page").eq(currentPage).attr("autoplay", "false");
						}

						if($("#autonext").prop("checked") == true){
							$(data).find("page").eq(currentPage).attr("autonext", "true");
						}else{
							$(data).find("page").eq(currentPage).attr("autonext", "false");
						}
						$(data).find("page").eq(currentPage).attr("controlType", "bar");
						$("#videoDialog").remove();
						sendUpdateWithRefresh();
						fadeComplete();
					}
				});
				
			}else if(mediaType == "swf"){
               	//If its a swf we have to set it's width and height! - very imoprtant or shit get funky homey....
			 	console.log("wtf I'm in the swf section");
			 	$(data).find("page").eq(currentPage).attr("img", imgPath);
			 	$("#loader").append("<div id='swfDialog' title='Input SWF Stats'><div>SWF Width: <input id='swfWidth' type='text' value="+ 000 + " defaultValue="+ 000 + " style='width:100%;'/></div><div>SWF Height: <input id='swfHeight' type='text' value="+ 000 + " defaultValue="+ 000 + " style='width:100%;'/></div></div>");
			 	$("#swfDialog").dialog({
                   	autoOpen: true,
					modal: true,
					buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: function(){
						$(data).find("page").eq(currentPage).attr("w", $("#swfWidth").val());
						$(data).find("page").eq(currentPage).attr("h", $("#swfHeight").val());
						sendUpdateWithRefresh();
						fadeComplete();
					}
				});
			}else if(mediaType == "jpg" || mediaType == "gif" || mediaType == "png" || mediaType == "jpeg" || mediaType == "JPG"){
                $(data).find("page").eq(currentPage).attr("img", imgPath);
			}else{
			 
			}
		}else if(capChange == true){
			//sendUpdateWithRefresh();
			//fadeComplete();
		}
		
		if(mediaType != "mp4"  && mediaType != "swf"){
			sendUpdateWithRefresh();
			fadeComplete();
		}
		$("#imgDialog").remove();
	};

	/**********************************************************************
     **Save Audio Edit
     **********************************************************************/
	function saveAudioEdit(){
        var audioPath =  $("#audioPath").val();
	   	var parts = audioPath.split('.'), i, l;
	   	var last = parts.length;

	   	var fileType = (parts[last - 1]);
	   	if(fileType == "mp3"){
            if(audioPath == "yourFile.mp3"){
                $(data).find("page").eq(currentPage).attr("audio", "null");
			}else{
                $(data).find("page").eq(currentPage).attr("audio", audioPath);
			}
			$("#audioEditDialog").remove();
			sendUpdateWithRefresh();
			fadeComplete();
		}else{
          	$("#audioEditDialog").append("<div id='addError' style='color:#FF0000'><br/><br/>* Only .mp3 audio files are supported at this time.</div>");
		}
	};
    //////////////////////////////////////////////////////////////////////////////////////////////////END EDIT MODE

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
		$("#contentHolder").attr("tabindex", tabindex);
		tabindex++;
		$("#loader").attr("tabindex", tabindex);
	}
	//////////////////////////////////////////////////////////////////////////////////////////////////END ACCESSIBILITY

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
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

	function fadeComplete() {	
        $('#pageTitle').remove();
	   	$('#contentHolder').remove();
	   	$('#reveal').remove();
	   	
	   	if(hasAudio == true){
            $('#audioCon').remove();
		  	$('#player').remove();
		}

		if(type == "sidebar"){
            $("#sidebar").remove();
            $("#sidebarHolder").remove();
		}

		$("#titleEdit").remove();
		$("#conEdit").remove();
		$("#imgEdit").remove();
		$("#audioEdit").remove();
		$("#sideEdit").remove();
		$("#captionEdit").remove();
		$("#titleDialog").remove();
		$("#sidebarDialog").remove();
		$("#imgDialog").remove();
		$("#audioDialog").remove();
		$("#swfDialog").remove();
		
		try { $("#myImgList").tooltip("destroy"); } catch (e) {}
		try { $("#loader").tooltip("destroy"); } catch (e) {}
		
		if(mode == "edit" && dragFile == true){
		  	if(type != "textOnly" && type !=  "sidebar"){
			  	$("#loader").unbind();
			}
			siofu.destroy();
			$("#audioDrop").unbind();
			cognizenSocket.removeListener('mediaConversionComplete', mediaConversionProgress);
			cognizenSocket.removeListener('mediaInfo', mediaInfo);
			cognizenSocket.removeListener('mediaConversionComplete', mediaConversionComplete);
			$("#audioDrop").remove();
		}
		
		if(type != "textOnly" && type !=  "sidebar"){
        	if(mediaType == 'swf'){
                $('#loader').flash().remove();
			 }
			 
			 if(hasPop == true || largeImg != ""){
			 	$("#mediaPop").remove();
			 	$("#myImgList").remove();
			 }
			 $("#mediaLoader").remove();
			 $('#caption').remove();
			 $('#loader').remove();
		}
		
		
		loadPage();
    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}
