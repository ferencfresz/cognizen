/*!
 * C_CoursePlayer
 * Dashboard for the cognizen tool
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 *
 * ©Concurrent Technologies Corporation 2018
 *
 */

function C_CoursePlayer(_course) {
	var co;
    var course = _course;
    var coursePath;
    var courseData;
    var proj;
    var hoverSubNav = false; //Boolean toggle to not launch project/lesson when adding a user.
    var userRoster;
    var currentParent;
    var currentLevel;
    var parentString = "";
    var assignParent;
    var myTimer;
    var launchItem;
    var scroller;
    var scrollTimer;
    var launchItemParent;
    var $stage;
    


    //Defines a public method - notice the difference between the private definition below.
    this.initialize = function () {
        if (transition == true) {
            $('#stage').css({'opacity': 0});
        }

		buildTemplate();
        /*****************************************************************************
        add socket listeners - for server connectivity.
        *****************************************************************************/
        // socket.on('recieveHostedProjectsFromDB', function(data) {
	       //  updateMenu(data);
        // });
        socket.emit('configLrs');
        receiveCoursePath();

        console.log("user = " + user);//Will be used to populate real content as a parameter in the below function
    }

    function receiveCoursePath(){
         coursePath = [window.location.protocol, '//', window.location.host, '/hosted/', course].join('');
         var xmlPath = coursePath + "/course.xml";
         console.log(xmlPath);
         courseXMLPath = xmlPath;
         $.ajax({
            type: "GET",
            url: xmlPath,
            dataType: "xml",
            async: false,
            success: updateTOC,
            error: function(){
                alert("unable to load content data")
            }
        });       
    }


    function idIfyPath(path) {
        return path.replace('/', '_');
    }


    /*****************************************************************************
     buildTemplate()
     *****************************************************************************/
    function buildTemplate(){
	    $("#stage").empty();
	    $stage = $('#stage');

        $("#gotoLMS").click(function(){
            dashMode = 'lms'; 
            $("#stage").remove();
            socket.emit('checkLoginStatus');
        });
		
		socket.emit('getHostedContent', {loc: "indahuas", path: "start"});
    }
    
    function updateTOC(_data){
	    //Clear the project list
        module_arr = [];
	    if (transition == true) {
			$('#stage').css({'opacity': 0});
     	}
        
        courseData = _data;

        var courseDisplayTitle = $(courseData).find("course").attr("coursedisplaytitle");
        if(courseDisplayTitle == undefined){
            courseDisplayTitle = $(courseData).find("course").attr("name");
        }

        var totalModules = $(courseData).find("item").length;

        if(totalModules > 0){
            for(var y = 0; y < totalModules; y++){

                 var moduleObj = new Object();

                 moduleObj.name = $(courseData).find("item").eq(y).attr("name");
                 moduleObj.id = $(courseData).find("item").eq(y).attr("id");
                 moduleObj.parent = {"name" : courseDisplayTitle};
                 moduleObj.parentDir = coursePath;
                 moduleObj.path = coursePath + "/" + encodeURIComponent($(courseData).find("item").eq(y).attr("name").trim());
                 moduleObj.xml = null;
                 moduleObj.xmlPath = ["/", encodeURIComponent($(courseData).find("item").eq(y).attr("name").trim()), "/xml/content.xml"].join("");
                 moduleObj.indexPath = [coursePath +"/", encodeURIComponent($(courseData).find("item").eq(y).attr("name").trim()), "/index.html"].join("");
                 module_arr.push(moduleObj);
            }
        }

	    var msg;
        msg = '<div class="C_CourseItem">';
        msg += '<img class="C_LMSCoursePoster" src="./css/images/placeholder.jpg"></img>';
        msg += '<div class="C_LMSCourseTitle">'+courseDisplayTitle+'<span class="C_CloseCourseButton">X</span></div>';
        msg += '<div class="C_LMSCourseDescription">';
        msg += '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vitae magna nulla. Integer fermentum velit ac felis blandit, at dapibus quam posuere. Nulla nisi mi, ornare id turpis ac, interdum cursus lorem. Cras in mi fermentum, vestibulum orci sit amet, accumsan ipsum. Sed venenatis id purus quis pretium. Pellentesque a quam ac ex efficitur finibus ac sit amet leo. Etiam neque tortor, accumsan id tortor non, porttitor luctus arcu. Nunc sit amet mauris lacinia, ultrices sapien vel, convallis diam. Donec nec eros ac ipsum mattis tempor nec id libero. Etiam quis auctor nibh.</p>';
        msg += '<p>Type:<br/>Reports Generation</p>';
        msg += '<p>Duration: 1.25 hours<br/>Assigned by: John Smith | Published: 21OCT2015 | Complete by: 01JAN2016</p>';
        msg += '</div>';
		msg += '<div id="C_LMSLessonListHolder" class="C_LMSLessonListHolder">';
	    
	    for(var i = 0; i < module_arr.length; i++){	
			msg += '<div class="C_LMSMenuItem2" title="'+ module_arr[i].name +'" data-fancybox-type="iframe" href="' + module_arr[i].indexPath + '" data-path="'+ _data[i] +'">';
			
			msg += module_arr[i].name;
			msg += '</div>';
	    }

        msg += '</div>';
        msg += '<div class="clear-div"></div></div>';

        $stage.append(msg);
        
        $(".C_CloseCourseButton").click(function(){
	       $("#gotoLMS").click(); 
        });
	    
        $(".C_LMSMenuItem2").click(function(){
            for(var j = 0; j < module_arr.length; j++){
                if(module_arr[j].name === $(this).attr('title')){
                    currentLesson = module_arr[j];
                    break;
                }
            }
        });

	    $(".C_LMSMenuItem2").fancybox({
            maxWidth    : '100%',
            maxHeight   : '100%',
            fitToView   : false,
            width       : '100%',
            height      : '100%',
            autoSize    : false,
            closeClick  : false,
            openEffect  : 'fade',
            closeEffect : 'fade' 
		});
		
    
	    //Once everything is loaded - fade page in.
        if (transition == true) {
			$('#stage').velocity({
				opacity: 1
			}, {
				duration: transitionLength
			});
        }
    }

    /*************************************************************************************************
     LEVAE PAGE CODE
     *************************************************************************************************/
        //Called from C_Engine.js - allows for transitions - fade the page first then load the new.
    this.destroySelf = function () {
        if (transition == true) {
			$('#stage').velocity({
				opacity: 0
			}, {
				duration: transitionLength,
				complete: fadeComplete
			});
        } else {
            fadeComplete();
        }
    }

    //After transitions are completed, load the next page.
    function fadeComplete() {
        //Calls loadPage in C_Engine.js
        loadPage();
    }

    /************************************************************************************************* END OF DASHBOARD CLASS*/
}
