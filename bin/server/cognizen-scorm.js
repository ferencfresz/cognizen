var fs = require('fs-extra');
var et = require('elementtree');
var readdirp = require('readdirp');
var archiver = require('archiver');

var SCORM = {
    logger: {},
    scormPath: '',
    contentPath: '',
    xmlContentFile: '',
    scormVersion: '',
    courseName: '',
    packageFolder: '',
    tempXmlContentFile: '',
    binDir: 'cognizen',
    previousLesson: '',
    objectives_arr: [],
    init: function(logger, ScormPath, ContentPath, XmlContentPath, Found, ScormVersion) {
        this.logger = logger;
        this.scormPath = ScormPath;
        this.contentPath = ContentPath;
        this.xmlContentFile = XmlContentPath;
        this.found = Found;
        this.scormVersion = ScormVersion;
        return this;
    },

	generateSCORMLesson: function(callback){
        var _this = this;

        //clear objectives_arr
        _this.objectives_arr = [];

        //console.log(_this.scormVersion);
        readdirp(
            { root: _this.contentPath,
                directoryFilter: [ '!server', '!scorm', '!.git'],
                fileFilter: [ '!.*' ] }
            , function(fileInfo) {
                //console.log("---------------------------------------------------------" + fileInfo);
            }
            , function (err, res) {

            	//copy content.xml file to temp location
            	_this.packageFolder = _this.contentPath + '/packages/';
            	_this.tempXmlContentFile = _this.packageFolder + 'content.xml';
            	fs.copy(_this.xmlContentFile, _this.tempXmlContentFile, function(err){
            		if(err){
            			_this.logger.error("Error copying content.xml file " + err);
            			callback(err, null);
            		}
            		_this.logger.info('content.xml file copied success');

			        var data, etree;

			        fs.readFile(_this.tempXmlContentFile, function(err, data){
			        	if(err){
			        		_this.logger.error("Error reading temp content.xml file " + err);
            				callback(err, null);
			        	}

			        	data = data.toString();
				        etree = et.parse(data);

				        //set mode to production and scorm version in temp content.xml
		                etree.find('./courseInfo/preferences/mode').set('value','production');
		                etree.find('./courseInfo/preferences/scormVersion').set('value', _this.scormVersion);	
		                etree.find('./courseInfo/preferences/finalLesson').set('value','true');
		                if(_this.scormVersion === 'none'){
		                	etree.find('./courseInfo/preferences/scorm').set('value','false');
		                }
		                var xml = etree.write({'xml_decleration': false});
		                fs.outputFile(_this.tempXmlContentFile, xml, function (err) {
		                    if (err) callback(err, null);
					    
						    _this.courseName = etree.find('.courseInfo/preferences/lessonTitle').get('value');
						    
						    //find the objectives in the pages. 
						    var pageCount = etree.findall('./pages/page').length;

						    for (var i = 0; i < pageCount; i++) {
						    	var myNode = etree.findall('./pages/page')[i];
						    	var pageObj = myNode.get('objective');
						    	var pageObjId = myNode.get('objItemId');
						    	var pageTitle = myNode.findtext('title');
						    	var tmpObjId = '';
						    	if(pageObj != undefined && pageObj !== "undefined"){
						    		//console.log(i + " : " + pageObj);
						 			//check for duplicates; manipulate objective name if so (this may not work!!!!)
						 			tmpObjId = _this.courseName.replace(/\s+/g, '') +"."+
						 						pageTitle.replace("<![CDATA[", "").replace("]]>", "").replace(/\s+/g, '')+"."+
						 						pageObj.replace(/\s+/g, '_');

						    	}

						    	if(pageObjId != undefined && pageObjId !== "undefined"){
						    		if(tmpObjId.length > 0){
						    			tmpObjId += "." + pageObjId.replace(/\s+/g, '_');
						    		}
						    		else{
							 			tmpObjId = _this.courseName.replace(/\s+/g, '') +"."+
						 						pageTitle.replace("<![CDATA[", "").replace("]]>", "").replace(/\s+/g, '')+"."+
						 						pageObjId.replace(/\s+/g, '_');						    			
						    		}
						    	}

						    	if(tmpObjId.length > 0 ){
						    		if(_this.objectives_arr.indexOf(tmpObjId) == -1){
						    			_this.objectives_arr.push(tmpObjId);	
						    		}
						    		else{
						    			_this.objectives_arr.push(tmpObjId+i);						    			
						    		}						    		
						    	}
						    }

						    var imsManifestFilePath = '';
						    //do not need to do scorm files if publishing to "none"						    
	        				if(_this.scormVersion != "none"){
				                var manifestFile = _this._populateManifest(res);

				                var scormBasePath = _this.scormPath + '/' + _this.scormVersion + '/';

				                if(_this.scormVersion === '1.2_CTCU'){
				                	scormBasePath = _this.scormPath + '/1.2/';
				                }

				                imsManifestFilePath = scormBasePath + 'imsmanifest.xml';

				                fs.writeFile(imsManifestFilePath, manifestFile, function(err) {
				                    if(err) {
				                        _this.logger.error("Write file error" + err);
				                        callback(err, null);
				                    }
				                    else {
				                    	_this._zipScormPackage(res, scormBasePath, imsManifestFilePath, function(err, output){
				                    		if(err){
				                    			callback(err, null);
				                    		}

											fs.remove(_this.tempXmlContentFile, function(err){
												if(err){
													_this.logger.error(err);
													callback(err, null);
												}
												_this.logger.info('temp content.xml file removed.');
									            _this.logger.debug("packageFolder = " + _this.packageFolder);        
									            //tells the engine that it is done writing the zip file
									            callback(null, output);															
											});												
                    		
				                    	});

				                    }


				                });
			                }
			                else{
			                	_this._zipScormPackage(res, scormBasePath, imsManifestFilePath, function(err, output){
		                    		if(err){
		                    			callback(err, null);
		                    		}			                		

									fs.remove(_this.tempXmlContentFile, function(err){
										if(err){
											_this.logger.error(err);
											callback(err, null);
										}
										_this.logger.info('temp content.xml file removed.');
							            _this.logger.debug("packageFolder = " + _this.packageFolder);        
							            //tells the engine that it is done writing the zip file
							            callback(null, output);															
									});	
			                	});
			                }
		                });			                			        	
			        });


            	});

            }
        );
	//end of generateSCORMLesson
	},

	_populateManifest: function(res){
		var _this = this;
        var manifest;

	    manifest = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n';

	    if (_this.scormVersion === '2004_3rd'){
	        manifest += '<manifest identifier=\"'+ _this.courseName.replace(/\s+/g, '') +'Course\" version=\"1.3\"\n';
	        manifest += "	xmlns = \"http://www.imsglobal.org/xsd/imscp_v1p1\" \n"+
    			"	xmlns:adlcp = \"http://www.adlnet.org/xsd/adlcp_v1p3\" \n"+
    			"	xmlns:adlseq = \"http://www.adlnet.org/xsd/adlseq_v1p3\" \n"+
    			"	xmlns:adlnav = \"http://www.adlnet.org/xsd/adlnav_v1p3\" \n"+
    			"	xmlns:imsss = \"http://www.imsglobal.org/xsd/imsss\" \n"+
    			"	xmlns:xsi = \"http://www.w3.org/2001/XMLSchema-instance\" \n"+
    			"	xsi:schemaLocation = \"http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd\n"+
    			"							http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd\">\n"+
	            "   <metadata>\n"+
	            "       <schema>ADL SCORM</schema>\n"+
	            "       <schemaversion>2004 3rd Edition</schemaversion>\n"+
	            "   </metadata>\n";
	        manifest += "   <organizations default=\""+_this.courseName.replace(/\s+/g, '') +"\">\n"+
	            "       <organization identifier=\""+_this.courseName.replace(/\s+/g, '')+"\" structure=\"hierarchical\">\n"+
	            "           <title>"+_this.courseName+"</title>\n"+
	            "           <item identifier=\"Home\" identifierref=\"RES-common-files\">\n"+
	            "               <title>"+_this.courseName+"</title>\n"+
	            "               <adlnav:presentation>\n"+
	            "                   <adlnav:navigationInterface>\n"+
	            "                       <adlnav:hideLMSUI>continue</adlnav:hideLMSUI>\n"+
	            "                       <adlnav:hideLMSUI>previous</adlnav:hideLMSUI>\n"+
	            //"                       <adlnav:hideLMSUI>exit</adlnav:hideLMSUI>\n"+
	            //"                       <adlnav:hideLMSUI>exitAll</adlnav:hideLMSUI>\n"+
	            "                       <adlnav:hideLMSUI>abandon</adlnav:hideLMSUI>\n"+
	            "                       <adlnav:hideLMSUI>abandonAll</adlnav:hideLMSUI>\n"+
	            //                        "                       <adlnav:hideLMSUI>suspendAll</adlnav:hideLMSUI>\n"+
	            "                   </adlnav:navigationInterface>\n"+
	            "               </adlnav:presentation>\n"+
	            "               <imsss:sequencing>\n";
	        //any objectives stuff goes here - objectivesGenerator
	       	if(_this.objectives_arr.length > 0){
	        	manifest += _this._objectivesGenerator();
	        }

	        manifest += "                   <imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n";
	        manifest += "               </imsss:sequencing>\n";
	        manifest += "           </item>\n";
	        //sequencing rules for the course go here
	        manifest += "       </organization>\n";
	        manifest += "    </organizations>\n";
	        manifest += "   <resources>\n";
	        manifest += "      <resource identifier=\"RES-common-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\"" +_this.binDir+ "/index.html\">\n";	  	        
	    }
	    else if(_this.scormVersion == "2004_4th"){
	        manifest += '<manifest identifier=\"'+ _this.courseName.replace(/\s+/g, '') +'Course\" version=\"1.3\"\n';
	        manifest += "	xmlns = \"http://www.imsglobal.org/xsd/imscp_v1p1\" \n"+
    			"	xmlns:adlcp = \"http://www.adlnet.org/xsd/adlcp_v1p3\" \n"+
    			"	xmlns:adlseq = \"http://www.adlnet.org/xsd/adlseq_v1p3\" \n"+
    			"	xmlns:adlnav = \"http://www.adlnet.org/xsd/adlnav_v1p3\" \n"+
    			"	xmlns:imsss = \"http://www.imsglobal.org/xsd/imsss\" \n"+
    			"	xmlns:xsi = \"http://www.w3.org/2001/XMLSchema-instance\" \n"+
    			"	xsi:schemaLocation = \"http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd\n"+
    			"							http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd\">\n"+
	            "   <metadata>\n"+
	            "       <schema>ADL SCORM</schema>\n"+
	            "       <schemaversion>2004 4th Edition</schemaversion>\n"+
	            "   </metadata>\n";
	        manifest += "   <organizations default=\""+_this.courseName.replace(/\s+/g, '') +"\">\n"+
	            "       <organization identifier=\""+_this.courseName.replace(/\s+/g, '')+"\" structure=\"hierarchical\">\n"+
	            "           <title>"+_this.courseName+"</title>\n"+
	            "           <item identifier=\"Home\" identifierref=\"RES-common-files\">\n"+
	            "               <title>"+_this.courseName+"</title>\n"+
	            "               <adlnav:presentation>\n"+
	            "                   <adlnav:navigationInterface>\n"+
	            "                       <adlnav:hideLMSUI>continue</adlnav:hideLMSUI>\n"+
	            "                       <adlnav:hideLMSUI>previous</adlnav:hideLMSUI>\n"+
	            //"                       <adlnav:hideLMSUI>exit</adlnav:hideLMSUI>\n"+
	            //"                       <adlnav:hideLMSUI>exitAll</adlnav:hideLMSUI>\n"+
	            "                       <adlnav:hideLMSUI>abandon</adlnav:hideLMSUI>\n"+
	            "                       <adlnav:hideLMSUI>abandonAll</adlnav:hideLMSUI>\n"+
	            //                        "                       <adlnav:hideLMSUI>suspendAll</adlnav:hideLMSUI>\n"+
	            "                   </adlnav:navigationInterface>\n"+
	            "               </adlnav:presentation>\n"+
	            "               <imsss:sequencing>\n";
	        //any objectives stuff goes here - objectivesGenerator
	        if(_this.objectives_arr.length > 0){
	        	manifest += _this._objectivesGenerator();
	        }
	        
	        manifest += "                   <imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n";
	        manifest += "               </imsss:sequencing>\n";
	        manifest += "           </item>\n";
	        //sequencing rules for the course go here
	        manifest += "       </organization>\n";
	        manifest += "    </organizations>\n";
        	manifest += "   <resources>\n";
        	manifest += "      <resource identifier=\"RES-common-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\"" +_this.binDir+ "/index.html\">\n";	  	        
	    }
	    //SCORM 1.2
	    else{
	        manifest += '<manifest identifier=\"'+ _this.courseName.replace(/\s+/g, '') +'Course\" version=\"1\"\n';
	        manifest += '    xmlns=\"http://www.imsproject.org/xsd/imscp_rootv1p1p2\"\n'+
	            '    xmlns:adlcp=\"http://www.adlnet.org/xsd/adlcp_rootv1p2\"\n'+
	            '    xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n';
	        if (_this.scormVersion === '1.2_CTCU'){    
	        	manifest += '    xmlns:c2lcp="http://www.sumtotalsystems.com/xsd/c2l_cp_rootv1p1"';
	        }        
	        manifest += '    xsi:schemaLocation=\"http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd\n'+
	            '                         http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd\n'+
	            '                         http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd';
	        if (_this.scormVersion === '1.2_CTCU'){      
	        	manifest += '\n                 http://www.sumtotalsystems.com/xsd/c2l_cp_rootv1p1 c2l_cp_rootv1p1.xsd';   
	        } 
	        manifest += '\">\n';    
	        manifest +='<metadata>\n'+
	            '   <schema>ADL SCORM</schema>\n'+
	            '   <schemaversion>1.2</schemaversion>\n'+
	            '</metadata>\n';
	        manifest +='<organizations default="'+_this.courseName.replace(/\s+/g, '') +'">\n'+
	            '   <organization identifier="'+_this.courseName.replace(/\s+/g, '') +'">\n'+
	            '		<title>'+_this.courseName+'</title>\n'+
	            '		<item identifier="Home" identifierref="RES-common-files">\n'+
	            '			<title>'+_this.courseName+'</title>\n'+
	            '		</item>\n'+
	            '	</organization>\n'+
	            '</organizations>\n';
	        manifest += "   <resources>\n";
	        if(_this.scormVersion === '1.2_CTCU'){
				manifest += "      <resource identifier=\"RES-common-files\" type=\"webcontent\" adlcp:scormtype=\"sco\" href=\"index.html\">\n";	
				manifest += "         <file href=\"index.html\"/>\n";
	        }
	        else{
        		manifest += "      <resource identifier=\"RES-common-files\" type=\"webcontent\" adlcp:scormtype=\"sco\" href=\"" +_this.binDir+ "/index.html\">\n";	      
        	}
	    }
	    //resources go here - resourcesgenerator  
	    var resources = _this._resourcesGenerator(res, '');
	    for (var i = 0; i < resources.length; i++) {
	    	manifest += resources[i];
	    };
	    manifest += '      </resource>\n';
	    manifest += '   </resources>\n';
	   
	    if (_this.scormVersion === '1.2_CTCU'){  
	    	manifest += '   	<c2lcp:ItemDataExtra>\n'+
						'			<c2lcp:ItemData Type=\"Course\">\n'+
						'	 			<c2lcp:ItemSpecificData>\n'+
						'					<c2lcp:CourseData>\n'+
		 				'						<c2lcp:PackageProperties>\n'+
						'							<c2lcp:CourseDisplay>\n'+
			 			'								<c2lcp:ShowNavBar>no</c2lcp:ShowNavBar>\n'+
			 			'								<c2lcp:TOC>\n'+
						'									<c2lcp:MaxLevels>3</c2lcp:MaxLevels>\n'+
						'									<c2lcp:MaxWidth>1</c2lcp:MaxWidth>\n'+
						'									<c2lcp:ScrollBar>yes</c2lcp:ScrollBar>\n'+
						'									<c2lcp:TreeOpenIcon width=\"9\" height=\"9\" />\n'+
						'									<c2lcp:TreeCloseIcon width=\"9\" height=\"9\" />\n'+
						'									<c2lcp:TopImage width=\"-1\" height=\"-1\" />\n'+
						'									<c2lcp:BottomImage width=\"-1\" height=\"-1\" />\n'+
						'									<c2lcp:BackgroundColor>ffffff</c2lcp:BackgroundColor>\n'+
			 			'								</c2lcp:TOC>\n'+
						'							</c2lcp:CourseDisplay>\n'+
						'							<c2lcp:Launch>\n'+
			 			'								<c2lcp:Width>640</c2lcp:Width>\n'+
			 			'								<c2lcp:Height>480</c2lcp:Height>\n'+
						'							</c2lcp:Launch>\n'+
		 				'						</c2lcp:PackageProperties>\n'+
						'					</c2lcp:CourseData>\n'+
	 					'				</c2lcp:ItemSpecificData>\n'+
						'			</c2lcp:ItemData>\n'+
						'		</c2lcp:ItemDataExtra>\n';
	    }
	   
	    manifest += '</manifest>';	

	    return manifest;	
	},	

	_zipScormPackage: function(res, scormBasePath, imsManifestFilePath, callback) {
		var _this = this;
        var scormFileVersion = _this.scormVersion.replace(/\./, '_');
        //var packageFolder = _this.contentPath + '/packages/';
        var outputFile = _this.packageFolder + _this.courseName.replace(/\s+/g, '')+'_'+scormFileVersion+'.zip';
        var output = fs.createWriteStream(outputFile);
        var archive = archiver('zip');

        archive.on('error', function(err) {
            throw err;
        });

        archive.pipe(output);
        //builds the cognizen directory
        res.files.forEach(function(file) {
            var localFile = file.path.replace(/\\/g,"/");
            if(localFile.indexOf('content.xml') == -1 && localFile.indexOf('packages') == -1){
            	var inputFile = _this.contentPath + '/' + localFile;
            	archive.append(fs.createReadStream(inputFile), { name: _this.binDir+'/'+localFile });
        	}
        });

        //adds temp content.xml file to zip
        archive.append(fs.createReadStream(_this.tempXmlContentFile), { name: _this.binDir+'/xml/content.xml'});

        //do not need to do scorm files if publishing to "none"
        if(_this.scormVersion != "none")
        {
	        //add SCORM files
	        readdirp({
	                root: scormBasePath,
	                directoryFilter: ['*'],
	                fileFilter: [ '!.DS_Store' ]
	            },
	            function(fileInfo) {},
	            function (err, res) {
	                res.files.forEach(function(file) {
	                    var localFile = file.path.replace(/\\/g,"/")
	                    //console.log(lFile);
	                    var inputFile = scormBasePath + localFile;
	                    archive.append(fs.createReadStream(inputFile), { name: localFile });
	                });

	            }
	        );

	        //add sumtotal xsd files for CTC publish
	        if (_this.scormVersion === '1.2_CTCU'){  
		        readdirp({
		                root: _this.scormPath + '/1.2_sumtotal/',
		                directoryFilter: ['*'],
		                fileFilter: [ '!.DS_Store' ]
		            },
		            function(fileInfo) {},
		            function (err, res) {
		                res.files.forEach(function(file) {
		                    var localFile = file.path.replace(/\\/g,"/")
		                    //console.log(lFile);
		                    var inputFile = _this.scormPath + '/1.2_sumtotal/' + localFile;
		                    archive.append(fs.createReadStream(inputFile), { name: localFile });
		                });

		            }
		        );	        	

		        //add a index.html file that launches the cognizen/index.html file to work in SumTotal
                var indexLaunchFile = _this._buildLaunchFile();
                var indexFilePath = _this.scormPath + '/index.html';

                fs.writeFile(indexFilePath, indexLaunchFile, function(err) {
                    if(err) {
                        _this.logger.error("Write file error" + err);
                        callback(err, null);
                    }
                    else {     
                    	archive.append(fs.createReadStream(indexFilePath), { name: 'index.html' });  
				        fs.remove(indexFilePath, function(err){
							if(err){ 
								_this.logger.error(err);
								callback(err, null);
							}
							_this.logger.info('index.html launch file removed.');
					    });                        	
                    }

                }); 

                    	

	        }

	        //add imsmanifest.xml file
	        archive.append(fs.createReadStream(imsManifestFilePath), { name: 'imsmanifest.xml'});

	        fs.remove(imsManifestFilePath, function(err){
				if(err){ 
					_this.logger.error(err);
					callback(err, null);
				}
				_this.logger.info('imsmanifest.xml file removed.');
		        archive.finalize(function(err, written) {
		            if (err) {
		                callback(err, null);
		            }
		        
		            callback(null, outputFile);
		        });		
		    });	        
    	}
    	else{
	        archive.finalize(function(err, written) {
	            if (err) {
	                callback(err, null);
	            }
	        
	            callback(null, outputFile);
	        });		    		
    	}

	}, 

	_objectivesGenerator: function(){
		var _this = this;
		var objectives = "                    <imsss:objectives>\n"+
        "                       <imsss:primaryObjective />\n";
        objectives += _this._secondaryObjectivesGenerator();
        objectives += "                    </imsss:objectives>\n";

        return objectives;
	},

	_secondaryObjectivesGenerator: function(){
		var _this = this;
		var secondaryObjectives = "";
        for (var i = 0; i < _this.objectives_arr.length; i++) {
        	secondaryObjectives += "						<imsss:objective objectiveID=\""+_this.objectives_arr[i]+"\">\n"+
            "							<imsss:mapInfo targetObjectiveID=\""+_this.objectives_arr[i]+"\"\n readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"true\"/>\n"+
            "						</imsss:objective>\n";	            	
        };

        return secondaryObjectives;
	},

	_buildLaunchFile: function(){
		var _this = this;
        var index = '<!DOCTYPE html>\n'+
					'<html>\n'+
					'	<head>\n'+
					'		<title>'+_this.courseName+'</title>\n'+
					'		<!-- launch the lesson window -->\n'+ 
					'		<script type="text/javascript">\n'+
					'			window.open("cognizen/index.html", "lessonWindow", "width=1024, height=768");\n'+
					'			function lessonComplete(){window.top.close();}\n'+
					'		</script>\n'+	
					'	</head>\n'+
					'	<body>\n'+
					'		<p>Close this window to record your progress and exit.</p>\n'+
					'	</body>\n'+
					'</html>';
		return index;
	},

	generateSCORMCourse: function(callback){
        var _this = this;

        var manifestFile = '';
        var resourceLines = [];
        var lessonsArray = [];
        var lessonsName = [];

        for(var i=0; i<_this.found.lessons.length; i++){
            var obj = _this.found.lessons[i];
            var lessonPath = _this.contentPath + "/" + obj.name;
            lessonsArray.push(lessonPath); 	                            
        } 
        var data, etree;
        var lessonXmlContentFile = lessonsArray[0] + '/xml/content.xml';
        data = fs.readFileSync(lessonXmlContentFile).toString();
        etree = et.parse(data);

	    _this.courseName = etree.find('.courseInfo/preferences/courseTitle').get('value');

	    //do not need to do scorm files if publishing to "none"
		if(_this.scormVersion != "none"){
	    	manifestFile = _this._startManifest();				    	
	    }

        var scormFileVersion = _this.scormVersion.replace(/\./, '_');
        _this.packageFolder = _this.contentPath + '/packages/';
        var outputFile = _this.packageFolder + _this.courseName.replace(/\s+/g, '')+'_'+scormFileVersion+'.zip';
        var output = fs.createWriteStream(outputFile);
        var archive = archiver('zip');

        archive.on('error', function(err) {
            throw err;
        });

        archive.pipe(output);

	    _this._recurseLessons(callback, 0, lessonsArray, manifestFile, resourceLines, lessonsName, archive, outputFile);

    //end of generateSCORMCourse    
	},

	_recurseLessons: function(callback, count, lArray, manifestFile, resourceLines, lessonsName, archive, outputFile){
		var _this = this;
		var _lessonPath = lArray[count];
		//clear objectives_arr
		_this.objectives_arr = [];
		console.log(_lessonPath);
        readdirp(
            { root: _lessonPath,
                directoryFilter: [ '!server', '!scorm', '!.git', '!packages'],
                fileFilter: [ '!.*' ] }
            , function(fileInfo) {
                //console.log("---------------------------------------------------------" + fileInfo.path);
               	//resFinal.push(fileInfo.path);
            }
            , function (err, res) {
		        var data, etree;
		        var lessonXmlContentFile = _lessonPath + '/xml/content.xml';
            	_this.tempXmlContentFile = _this.packageFolder +count+'content.xml';

            	fs.copy(lessonXmlContentFile, _this.tempXmlContentFile, function(err){
            		if(err){
            			_this.logger.error("Error copying content.xml file " + err);
            			callback(err, null);
            		}
            		_this.logger.info('content.xml file copied success');	

			        fs.readFile(_this.tempXmlContentFile, function(err, data){
			        	if(err){
			        		_this.logger.error("Error reading temp content.xml file " + err);
            				callback(err, null);
			        	}
			        	data = data.toString();
				        etree = et.parse(data);

				        //set mode to production and scorm version in temp content.xml
		                etree.find('./courseInfo/preferences/mode').set('value','production');
		                etree.find('./courseInfo/preferences/scormVersion').set('value', _this.scormVersion);
		              	if(_this.scormVersion === 'none'){
		                	etree.find('./courseInfo/preferences/scorm').set('value','false');
		                }
		                if(count+1 == lArray.length){
		                	etree.find('./courseInfo/preferences/finalLesson').set('value','true');	
		                }
		                var xml = etree.write({'xml_decleration': false});
		                fs.outputFile(_this.tempXmlContentFile, xml, function (err) {
		                    if (err) callback(err, null);

			                //add item & item sequencing (objectives)
			                var _lessonTitle = etree.find('.courseInfo/preferences/lessonTitle').get('value');
			                lessonsName.push(_lessonTitle);

						    //find the objectives in the pages.
						    //except for USSOCOM publishes
						    //if(_this.scormVersion.indexOf('USSOCOM') == -1 ){
							    var pageCount = etree.findall('./pages/page').length;

							    for (var i = 0; i < pageCount; i++) {
							    	var myNode = etree.findall('./pages/page')[i];
							    	var pageObj = myNode.get('objective');
							    	var pageObjId = myNode.get('objItemId');
							    	var pageTitle = myNode.findtext('title');
							    	var tmpObjId = '';
							    	if(pageObj != undefined && pageObj !== "undefined"){
							    		//console.log(i + " : " + pageObj);
							 			//check for duplicates; manipulate objective name if so (this may not work!!!!)
							 			tmpObjId = _lessonTitle.replace(/\s+/g, '') +"."+
							 						pageTitle.replace("<![CDATA[", "").replace("]]>", "").replace(/\s+/g, '').replace(/:/g, '')+"."+
							 						pageObj.replace(/\s+/g, '_').replace(/:/g, '');

							    	}

							    	if(pageObjId != undefined && pageObjId !== "undefined"){
							    		if(tmpObjId.length > 0){
							    			tmpObjId += "." + pageObjId.replace(/\s+/g, '_').replace(/:/g, '');
							    		}
							    		else{
								 			tmpObjId = _lessonTitle.replace(/\s+/g, '') +"."+
							 						pageTitle.replace("<![CDATA[", "").replace("]]>", "").replace(/\s+/g, '').replace(/:/g, '')+"."+
							 						pageObjId.replace(/\s+/g, '_').replace(/:/g, '');						    			
							    		}
							    	}

							    	if(tmpObjId.length > 0 ){
							    		tmpObjId += "_id";
							    		if(_this.objectives_arr.indexOf(tmpObjId) == -1){
							    			_this.objectives_arr.push(tmpObjId);	
							    		}
							    		else{
							    			_this.objectives_arr.push(tmpObjId+i);						    			
							    		}						    		
							    	}
							    }
							//}

						    var reviewLines = '';
							//set up the final test item structure for review
							if(_this.scormVersion.indexOf('USSOCOM') != -1 && count + 1 == lArray.length)
							{
								manifestFile += _this._addUSSOCOMFinalTest(lessonsName[count]);

						        reviewLines = _this._addResources(res, 'Review-files/')

						        res.files.forEach(function(file) {
						            var localFile = file.path.replace(/\\/g,"/");
						            if(localFile.indexOf('content.xml') == -1 ){
						            	var inputFile = _lessonPath + '/' + localFile;
						            	archive.append(fs.createReadStream(inputFile), { name: _this.binDir+'/Review-files/'+localFile });
						        	}
						        });								

							}
						    //do not need to do scorm files if publishing to "none"
		    				else if(_this.scormVersion != "none"){
			                	manifestFile += _this._add2004Item(lessonsName[count], count, lArray.length);
			            	}

			                //add resources
			                resourceLines.push(_this._addResources(res, lessonsName[count]+'/'));
					        //builds the cognizen directory
					        res.files.forEach(function(file) {
					            var localFile = file.path.replace(/\\/g,"/");
					            if(localFile.indexOf('content.xml') == -1 ){
					            	var inputFile = _lessonPath + '/' + localFile;
					            	archive.append(fs.createReadStream(inputFile), { name: _this.binDir+'/'+lessonsName[count]+'/'+localFile });
					        	}
					        });

			                if(count+1 == lArray.length){
						        if(manifestFile != ''){
							        //sequencing rules for the course go here
							        var completionLines = '';
							        if(_this.scormVersion.indexOf('USSOCOM') != -1){
								        //add completion  and survey files
								        readdirp({
								                root: _this.scormPath + '/completion/',
								                directoryFilter: ['*']
								            },
								            function(fileInfo) {},
								            function (err, res) {
								                res.files.forEach(function(file) {
								                    var localFile = file.path.replace(/\\/g,"/")
								                    var inputFile = _this.scormPath + '/completion/' + localFile;
								                    archive.append(fs.createReadStream(inputFile), { name: _this.binDir+'/completion-files/' + localFile });
								                });
								                manifestFile += _this._addUSSOCOMExtra('survey');
								                archive.append(fs.createReadStream(_this.scormPath + '/survey/survey.html'), { name: _this.binDir + '/survey/survey.html'});
								                manifestFile += _this._addUSSOCOMExtra('completion');
								                completionLines = _this._addResources(res, 'completion-files/')
								                manifestFile += _this._finalizeManifest(lessonsName, resourceLines, reviewLines, completionLines);
								                if(_this.scormVersion != "none"){
								                	//this needs to be moved to a function
							        				///////////////////////////////////////////////
											        var scormBasePath = _this.scormPath + '/' + _this.scormVersion + '/';

											        //USSOCOM publishing uses 2004 4th edition SCORM files
											        if(_this.scormVersion === '2004_4th_USSOCOM'){
											        	scormBasePath = _this.scormPath + '/2004_4th/'; 
											        }
											        else if(_this.scormVersion === '2004_3rd_USSOCOM'){
											        	scormBasePath = _this.scormPath + '/2004_3rd/';
											        }
											        
											        var imsManifestFilePath = scormBasePath + 'imsmanifest.xml';

											        fs.writeFile(imsManifestFilePath, manifestFile, function(err) {
											            if(err) {
											                _this.logger.error("Write file error" + err);
											                callback(err, null);
											            }
											            else {
									            	
													        //add SCORM files
													        readdirp({
													                root: scormBasePath,
													                directoryFilter: ['*'],
													                fileFilter: [ '!.DS_Store' ]
													            },
													            function(fileInfo) {},
													            function (err, res) {
													                res.files.forEach(function(file) {
													                    var localFile = file.path.replace(/\\/g,"/")
													                    var inputFile = scormBasePath + localFile;
													                    archive.append(fs.createReadStream(inputFile), { name: localFile });
													                });

													            }
													        );


													        //add imsmanifest.xml file
													        archive.append(fs.createReadStream(imsManifestFilePath), { name: 'imsmanifest.xml'});

										        			//adds temp content.xml file to zip
										        			for(var j=0; j<lArray.length; j++){
										        				archive.append(fs.createReadStream(_this.packageFolder +j+'content.xml'), { name: _this.binDir+'/'+lessonsName[j]+'/xml/content.xml'});	
										        			}

										        			//add review content.xml file to zip
										        			if(reviewLines != ''){
										        				archive.append(fs.createReadStream(_this.scormPath + '/review/content.xml'), { name: _this.binDir+'/Review-files/xml/content.xml'});							        				
										        			}
													        
												            fs.remove(imsManifestFilePath, function(err){
																if(err){ 
																	_this.logger.error(err);
																	callback(err, null);
																}
																_this.logger.info('imsmanifest.xml file removed.');
														        archive.finalize(function(err, written) {
														            if (err) {
														                callback(err, null);
														            }

																	//remove temp content.xml files
																	var tempContentFiles = [];
																	for (var i = 0; i < lArray.length; i++) {
																		tempContentFiles.push(_this.packageFolder +i+'content.xml');
																	};

																	_this._removeTempFiles(tempContentFiles, 0, function(err){
																		if(err){
																			callback(err, null);
																		}
															            _this.logger.debug("packageFolder = " + outputFile);
															            //tells the engine that it is done writing the zip file
															            callback(null, outputFile);														

																	});

														        });		
														        											
															});									        

											            }

											        });
											        ///////////////////////////////////////////////								                	
								                }
								            }
								        );	
							        }
							        else{
							        	manifestFile += _this._finalizeManifest(lessonsName, resourceLines, reviewLines, completionLines);
							        	if(_this.scormVersion != "none"){
							        		//this needs to be moved to a function
							        		///////////////////////////////////////////////
									        var scormBasePath = _this.scormPath + '/' + _this.scormVersion + '/';

									        //USSOCOM publishing uses 2004 4th edition SCORM files
									        if(_this.scormVersion === '2004_4th_USSOCOM'){
									        	scormBasePath = _this.scormPath + '/2004_4th/'; 
									        }
									        else if(_this.scormVersion === '2004_3rd_USSOCOM'){
									        	scormBasePath = _this.scormPath + '/2004_3rd/';
									        }
									        
									        var imsManifestFilePath = scormBasePath + 'imsmanifest.xml';

									        fs.writeFile(imsManifestFilePath, manifestFile, function(err) {
									            if(err) {
									                _this.logger.error("Write file error" + err);
									                callback(err, null);
									            }
									            else {
							            	
											        //add SCORM files
											        readdirp({
											                root: scormBasePath,
											                directoryFilter: ['*'],
											                fileFilter: [ '!.DS_Store' ]
											            },
											            function(fileInfo) {},
											            function (err, res) {
											                res.files.forEach(function(file) {
											                    var localFile = file.path.replace(/\\/g,"/")
											                    var inputFile = scormBasePath + localFile;
											                    archive.append(fs.createReadStream(inputFile), { name: localFile });
											                });

											            }
											        );


											        //add imsmanifest.xml file
											        archive.append(fs.createReadStream(imsManifestFilePath), { name: 'imsmanifest.xml'});

								        			//adds temp content.xml file to zip
								        			for(var j=0; j<lArray.length; j++){
								        				archive.append(fs.createReadStream(_this.packageFolder +j+'content.xml'), { name: _this.binDir+'/'+lessonsName[j]+'/xml/content.xml'});	
								        			}

								        			//add review content.xml file to zip
								        			if(reviewLines != ''){
								        				archive.append(fs.createReadStream(_this.scormPath + '/review/content.xml'), { name: _this.binDir+'/Review-files/xml/content.xml'});							        				
								        			}
											        
										            fs.remove(imsManifestFilePath, function(err){
														if(err){ 
															_this.logger.error(err);
															callback(err, null);
														}
														_this.logger.info('imsmanifest.xml file removed.');
												        archive.finalize(function(err, written) {
												            if (err) {
												                callback(err, null);
												            }

															//remove temp content.xml files
															var tempContentFiles = [];
															for (var i = 0; i < lArray.length; i++) {
																tempContentFiles.push(_this.packageFolder +i+'content.xml');
															};

															_this._removeTempFiles(tempContentFiles, 0, function(err){
																if(err){
																	callback(err, null);
																}
													            _this.logger.debug("packageFolder = " + outputFile);
													            //tells the engine that it is done writing the zip file
													            callback(null, outputFile);														

															});

												        });		
												        											
													});									        

									            }

									        });	
									        ///////////////////////////////////////////////						        	 	
							        	}
							        }


						        }
						        else if(_this.scormVersion != "none"){
						        	callback("no manifestFile", null);
						        }                	

							    //do not need to do scorm files if publishing to "none"
			    				if(_this.scormVersion != "none"){	

			    					//code moved above
								}
								else{

				        			//adds temp content.xml file to zip
				        			for(var j=0; j<lArray.length; j++){
				        				archive.append(fs.createReadStream(_this.packageFolder +j+'content.xml'), { name: _this.binDir+'/'+lessonsName[j]+'/xml/content.xml'});	
				        			}
							        
				        			//create index.html file to place at the root of the package
				        			var tempNoneIndex = _this.packageFolder + '/index.html';
							        fs.writeFile(tempNoneIndex, _this._createNoneIndex(lArray, lessonsName), function(err) {
							            if(err) {
							                _this.logger.error("Write file error" + err);
							                callback(err, null);
							            }

				        				archive.append(fs.createReadStream(tempNoneIndex), {name: _this.binDir+'/index.html'});
				        			});

							        archive.finalize(function(err, written) {
							            if (err) {
							                callback(err, null);
							            }

							            fs.remove(tempNoneIndex, function(err){
											if(err){ 
												_this.logger.error(err);
												callback(err, null);
											}
											_this.logger.info('temp index.html file removed.');
											//remove temp content.xml files
											var tempContentFiles = [];
											for (var i = 0; i < lArray.length; i++) {
												tempContentFiles.push(_this.packageFolder +i+'content.xml');
											};

											_this._removeTempFiles(tempContentFiles, 0, function(err){
												if(err){
													callback(err, null);
												}
									            _this.logger.debug("packageFolder = " + outputFile);
									            //tells the engine that it is done writing the zip file
									            callback(null, outputFile);														

											});
										});

							        });
								
								}

			                }
			                else{
				    			_this._recurseLessons(callback, count+1, lArray, manifestFile, resourceLines, lessonsName, archive, outputFile);
			                }

			            });	

			        });            		

		        });        
		            			        
            }
        ); 

	},

	_finalizeManifest: function(ilessonsName, iresourceLines, ireviewLines, icompletionLines){
		var _this = this;
		var _manifestFile = '';
		        //USSOCOM uses flow and choice control mode
        if(_this.scormVersion.indexOf('USSOCOM') != -1){
	        _manifestFile += "          <imsss:sequencing>\n";
			_manifestFile += "		    	<imsss:controlMode choice=\"true\" flow=\"true\"/>\n";
			_manifestFile += "		    </imsss:sequencing>\n"; 						        	
        }

        _manifestFile += "       </organization>\n";
        _manifestFile += "    </organizations>\n";
		_manifestFile += "    <resources>\n";

		//have to add the resources here because the items all have to be added before the org can be closed
		for(var i=0; i<iresourceLines.length; i++){
			_manifestFile += "      <resource identifier=\"RES-"+ilessonsName[i].replace(/\s/g, "")+"-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\""+_this.binDir+"/"+encodeURIComponent(ilessonsName[i])+"/index.html\">\n";
			_manifestFile += iresourceLines[i];
			_manifestFile += '      </resource>\n';
		}

		//add resource for review res
		if(ireviewLines != ''){
			_manifestFile += "      <resource identifier=\"RES-Review-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\""+_this.binDir+"/Review-files/index.html\">\n";
			_manifestFile += ireviewLines;
			_manifestFile += '      </resource>\n';										
		}

		//add resource for completion res
		if(icompletionLines != ''){
			_manifestFile += "      <resource identifier=\"RES-completion-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\""+_this.binDir+"/completion-files/certificate.html\">\n";
			_manifestFile += icompletionLines;
			_manifestFile += '      </resource>\n';									
		}

		//temp add survey SCO to ussocom
		if(_this.scormVersion.indexOf('USSOCOM') != -1){
			_manifestFile += "      <resource identifier=\"RES-survey-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\""+_this.binDir+"/survey/survey.html\">\n";
			_manifestFile += "			<file href=\""+_this.binDir+"/survey/survey.html\"/>\n";
			_manifestFile += '      </resource>\n';				
		}				    
	    _manifestFile += '   </resources>\n';
		
		//Any sequencingCollections go here

		//sequencingCollection for USSOCOM 
		if(_this.scormVersion.indexOf('USSOCOM') != -1){
			_manifestFile += ' 	<imsss:sequencingCollection>\n';
			_manifestFile += ' 		<imsss:sequencing ID = \"scampidl\">\n';
			// Set all content SCOs to not count towards any rollup. Only the post test will count
			_manifestFile += ' 			<imsss:rollupRules rollupObjectiveSatisfied=\"false\" rollupProgressCompletion=\"false\" objectiveMeasureWeight=\"0\"></imsss:rollupRules>\n';
			_manifestFile += ' 			<imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n';
			_manifestFile += ' 		</imsss:sequencing>\n';
			_manifestFile += ' 	</imsss:sequencingCollection>\n';  
		}

    	_manifestFile += '</manifest>';	
    	return _manifestFile;
	},

	_startManifest: function(){
		var _this = this;
        var manifest;

	    manifest = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n';

	    if (_this.scormVersion === '2004_3rd' || _this.scormVersion === '2004_3rd_USSOCOM'){
	        manifest += '<manifest identifier=\"'+ _this.courseName.replace(/\s+/g, '') +'Course\" version=\"1.3\"\n';
	        manifest += "	xmlns = \"http://www.imsglobal.org/xsd/imscp_v1p1\" \n"+
    			"	xmlns:adlcp = \"http://www.adlnet.org/xsd/adlcp_v1p3\" \n"+
    			"	xmlns:adlseq = \"http://www.adlnet.org/xsd/adlseq_v1p3\" \n"+
    			"	xmlns:adlnav = \"http://www.adlnet.org/xsd/adlnav_v1p3\" \n"+
    			"	xmlns:imsss = \"http://www.imsglobal.org/xsd/imsss\" \n"+
    			"	xmlns:xsi = \"http://www.w3.org/2001/XMLSchema-instance\" \n"+
    			"	xsi:schemaLocation = \"http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd\n"+
    			"							http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd\">\n"+
	            "   <metadata>\n"+
	            "       <schema>ADL SCORM</schema>\n"+
	            "       <schemaversion>2004 3rd Edition</schemaversion>\n"+
	            "   </metadata>\n";
	        manifest += "   <organizations default=\""+_this.courseName.replace(/\s+/g, '') +"\">\n"+
	            "       <organization identifier=\""+_this.courseName.replace(/\s+/g, '')+"\" structure=\"hierarchical\" adlseq:objectivesGlobalToSystem=\"false\">\n"+
	            "           <title>"+_this.courseName+"</title>\n";

	    }
	    else if(_this.scormVersion === "2004_4th" || _this.scormVersion === '2004_4th_USSOCOM'){
	        manifest += '<manifest identifier=\"'+ _this.courseName.replace(/\s+/g, '') +'Course\" version=\"1.3\"\n';
	        manifest += "   xmlns=\"http://www.imsglobal.org/xsd/imscp_v1p1\"\n"+
	            "   xmlns:adlcp=\"http://www.adlnet.org/xsd/adlcp_v1p3\"\n"+
	            "   xmlns:adlnav=\"http://www.adlnet.org/xsd/adlnav_v1p3\"\n"+
	            "   xmlns:imsss=\"http://www.imsglobal.org/xsd/imsss\"\n"+
	            "   xmlns:adlseq=\"http://www.adlnet.org/xsd/adlseq_v1p3\"\n"+
	            "   xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n"+
	            "   xsi:schemaLocation=\"http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd\n"+
	            "                        http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd\n"+
	            "                        http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd\n"+
	            "                        http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd\n"+
	            "                        http://www/imsglobal.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd\">\n"+
	            "   <metadata>\n"+
	            "       <schema>ADL SCORM</schema>\n"+
	            "       <schemaversion>2004 4th Edition</schemaversion>\n"+
	            "   </metadata>\n";
	        manifest += "   <organizations default=\""+_this.courseName.replace(/\s+/g, '') +"\">\n"+
	            "       <organization identifier=\""+_this.courseName.replace(/\s+/g, '')+"\" structure=\"hierarchical\" adlseq:objectivesGlobalToSystem=\"false\">\n"+
	            "           <title>"+_this.courseName+"</title>\n";
	    }
	    else{
	    	// Courses currently can not be published to 1.2, probably remove else

	    }	    

	    return manifest;
	},

	_add2004Item: function(lessonName, lessonCount, totalLessons){
		var _this = this;
		var lessonNameTrim = lessonName.replace(/\s+/g, '');

        var item = "           <item identifier=\""+lessonNameTrim+"_id\" identifierref=\"RES-"+lessonNameTrim+"-files\">\n"+
            "               <title>"+lessonName+"</title>\n"+
            "               <adlnav:presentation>\n"+
            "                   <adlnav:navigationInterface>\n"+
            // "                       <adlnav:hideLMSUI>continue</adlnav:hideLMSUI>\n"+
            // "                       <adlnav:hideLMSUI>previous</adlnav:hideLMSUI>\n"+
            //"                       <adlnav:hideLMSUI>exit</adlnav:hideLMSUI>\n"+
            //"                       <adlnav:hideLMSUI>exitAll</adlnav:hideLMSUI>\n"+
            "                       <adlnav:hideLMSUI>abandon</adlnav:hideLMSUI>\n"+
            "                       <adlnav:hideLMSUI>abandonAll</adlnav:hideLMSUI>\n";
        if(_this.scormVersion === '2004_4th_USSOCOM'){
        	item += "                       <adlnav:hideLMSUI>suspendAll</adlnav:hideLMSUI>\n";
        }    
            
        item +=    "                   </adlnav:navigationInterface>\n"+
            "               </adlnav:presentation>\n";
        item += _this._add2004ItemSeq(lessonNameTrim, lessonCount, totalLessons);    
        item += "           </item>\n";

        return item;

	},

	_add2004ItemSeq: function(lessonId, lessonCount, totalLessons){
		var _this = this;
		var seq = "";
		var courseNameTrim = _this.courseName.replace(/\s+/g, ''); 
		// //any objectives stuff goes here - objectivesGenerator

		//seq rules for USSOCOM
		//if(_this.scormVersion === '2004_3rd_USSOCOM' || _this.scormVersion === '2004_4th_USSOCOM'){
		if(_this.scormVersion.indexOf('USSOCOM') != -1){	
			//all of the items except the last one (post test) get IDRef to sequencingCollection "scampidl"
			if(lessonCount + 1 == totalLessons){
				//sequencing elements for the post test
				seq +="		                 <imsss:sequencing>\n"+
				"		                      <imsss:controlMode choiceExit=\"false\" />\n"+
				"		                      <imsss:sequencingRules>\n"+
				"		                        <imsss:preConditionRule>\n"+
				"		                              <imsss:ruleConditions conditionCombination=\"any\">\n"+
				"		                              <imsss:ruleCondition operator=\"not\" condition=\"attempted\"/>\n"+
				"		                            </imsss:ruleConditions>\n"+
				"		                            <imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
				"		                        </imsss:preConditionRule>\n"+
				"		                        <imsss:preConditionRule>\n"+
				"		                              <imsss:ruleConditions conditionCombination=\"any\">\n"+
				"		                              <imsss:ruleCondition condition=\"attemptLimitExceeded\"/>\n"+
				"		                            </imsss:ruleConditions>\n"+
				"		                            <imsss:ruleAction action=\"disabled\"/>\n"+
				"		                        </imsss:preConditionRule>\n"+
				"		                        <imsss:preConditionRule>\n"+
				"		                            <imsss:ruleConditions>\n"+
				"		                                <imsss:ruleCondition condition=\"satisfied\"/>\n"+
				"		                            </imsss:ruleConditions>\n"+
				"		                            <imsss:ruleAction action=\"skip\"/>\n"+
				"		                        </imsss:preConditionRule>\n"+
				"		                          <imsss:postConditionRule>\n"+
				"		                            <imsss:ruleConditions conditionCombination=\"all\">\n"+
				"		                                <imsss:ruleCondition operator=\"not\" condition=\"completed\"/>\n"+
				"		                            </imsss:ruleConditions>\n"+
				"		                            <imsss:ruleAction action=\"retry\"/>\n"+
				"		                        </imsss:postConditionRule>  \n"+                 
				"		                      </imsss:sequencingRules>\n"+
				"		                      <imsss:limitConditions attemptLimit=\"2\"/>   \n"+                   
				"		                      <imsss:rollupRules rollupObjectiveSatisfied=\"true\" rollupProgressCompletion=\"true\" objectiveMeasureWeight=\"1.0\"></imsss:rollupRules>  \n"+                 
				"		                      <imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n"+
				"		  	        	  </imsss:sequencing>\n";				
				// seq += "               <imsss:sequencing>\n"+
				// 	"                	<imsss:controlMode choiceExit=\"false\" />\n"+				
				// 	"        			<imsss:sequencingRules>\n"+
				// 	"	            		<imsss:preConditionRule>\n"+
				// 	"		   	                <imsss:ruleConditions conditionCombination=\"any\">\n"+
				// 	"	                			<imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"satisfied\"/>\n"+
				// 	"	                			<imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
				// 	"			                </imsss:ruleConditions>\n"+
				// 	"	              			<imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
				// 	"			            </imsss:preConditionRule>\n"+
				// 	"		            </imsss:sequencingRules>\n"+
				// 	//handles the score from the post test to be the only activity that counts towards rollup so that the course (these defaults and don't have to be included)					          
				// 	"	          		<imsss:rollupRules rollupObjectiveSatisfied=\"true\" rollupProgressCompletion=\"true\" objectiveMeasureWeight=\"1\"></imsss:rollupRules>\n"+
				// 	"	   	            <imsss:objectives>\n"+
				// 	"			            <imsss:primaryObjective objectiveID=\"" + lessonId + "_satisfied\" />\n"+
				// 	"			            <imsss:objective objectiveID=\"previous_sco_satisfied\">\n"+
				// 	"		                	<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + _this.previousLesson + "_satisfied\"\n"+
				// 	"	                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"false\"/>\n"+
				// 	"	            		</imsss:objective>\n";
			 //        //any objectives stuff goes here - secondaryObjectivesGenerator
			 //        if(_this.objectives_arr.length > 0){
			 //        	seq += _this._secondaryObjectivesGenerator();
			 //        }					
				// 	seq += "	          		</imsss:objectives>\n"+
				// 	"	          		<imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n"+
				// 	"	        	</imsss:sequencing>\n";				
			}
			else{
				seq += "               <imsss:sequencing IDRef = \"scampidl\">\n";
				//first SCO, there is not preivous SCO to track
				if(lessonCount == 0){
					seq += "				<imsss:rollupRules rollupObjectiveSatisfied=\"true\" rollupProgressCompletion=\"true\" objectiveMeasureWeight=\"0\"></imsss:rollupRules> \n"+
					"	   	            <imsss:objectives>\n"+
					"			            <imsss:primaryObjective />\n"+
					"			            <imsss:objective objectiveID=\"" + lessonId + "_satisfied\">\n"+
					"		                	<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + lessonId + "_satisfied\" readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"false\"/>\n"+
					"	            		</imsss:objective>\n"+					
					"	          		</imsss:objectives>\n"+	
					" 					<imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n"+					
					"	        	</imsss:sequencing>\n";										
				}
				else{
					seq +="        			<imsss:sequencingRules>\n"+
					"	                    	<imsss:preConditionRule>\n"+
					"	                          	<imsss:ruleConditions conditionCombination=\"any\">\n"+
					"	                          		<imsss:ruleCondition operator=\"not\" condition=\"attempted\"/>\n"+
					"	                        	</imsss:ruleConditions>\n"+
					"	                        	<imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
					"	                    	</imsss:preConditionRule>\n"+
					"	                  	</imsss:sequencingRules> \n"+
					"						<imsss:rollupRules rollupObjectiveSatisfied=\"true\" rollupProgressCompletion=\"true\" objectiveMeasureWeight=\"0\"></imsss:rollupRules> \n"+
					"	   	            	<imsss:objectives>\n"+
					"			            	<imsss:primaryObjective />\n"+
					"			            	<imsss:objective objectiveID=\"" + lessonId + "_satisfied\">\n"+
					"		                		<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + lessonId + "_satisfied\" readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"false\"/>\n"+
					"	            			</imsss:objective>\n"+					
					"	          			</imsss:objectives>\n"+	
					" 						<imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n"+									
					"		        	</imsss:sequencing>\n";					
					// "	            		<imsss:preConditionRule>\n"+
					// "		   	                <imsss:ruleConditions conditionCombination=\"any\">\n"+
					// "	                			<imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"satisfied\"/>\n"+
					// "	                			<imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
					// "			                </imsss:ruleConditions>\n"+
					// "	              			<imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
					// "			            </imsss:preConditionRule>\n"+
					// "		            </imsss:sequencingRules>\n"+
					// "	   	            <imsss:objectives>\n"+
					// "			            <imsss:primaryObjective objectiveID=\"" + lessonId + "_satisfied\">\n"+	
					// "		                	<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + lessonId + "_satisfied\"\n"+
					// "	                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"true\"/>\n"+
					// "	            		</imsss:primaryObjective>\n"+	
					// "			            <imsss:objective objectiveID=\"previous_sco_satisfied\">\n"+
					// "		                	<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + _this.previousLesson + "_satisfied\"\n"+
					// "	                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"false\"/>\n"+
					// "	            		</imsss:objective>\n"+	
					// "	          		</imsss:objectives>\n"+	
					// "	        	</imsss:sequencing>\n";																		

				}
			}

		}
		//default
		else{
			seq += "               <imsss:sequencing>\n";
	        //any objectives stuff goes here - objectivesGenerator
	        if(_this.objectives_arr.length > 0){
	        	seq += _this._objectivesGenerator();
	        }					
			seq += "	          		<imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n"+
			"	        	  </imsss:sequencing>\n";					
		}
		_this.previousLesson = lessonId;
		return seq;
	},

	_addUSSOCOMFinalTest: function(lessonName){
		var _this = this;
		var seq = "";
		var courseNameTrim = _this.courseName.replace(/\s+/g, '');
		var lessonNameTrim = lessonName.replace(/\s+/g, ''); 
		//seq +="           <item identifier=\""+lessonNameTrim+"Parent\" >\n"+
		//"             <title>"+lessonName+"</title>\n"+
		// seq += "             <item identifier=\""+lessonNameTrim+"Before_id\" identifierref=\"RES-Review-files\">\n"+ //isvisible=\"false\">\n"+
		// "                 <title>"+lessonName+" Before Review</title>\n"+
		// "                 <adlnav:presentation>\n"+
		// "                     <adlnav:navigationInterface>\n"+
		// "                         <adlnav:hideLMSUI>continue</adlnav:hideLMSUI>\n"+
		// "                         <adlnav:hideLMSUI>previous</adlnav:hideLMSUI>\n"+
		// "                         <adlnav:hideLMSUI>abandon</adlnav:hideLMSUI>\n"+
		// "                         <adlnav:hideLMSUI>abandonAll</adlnav:hideLMSUI>\n"+
		// "                         <adlnav:hideLMSUI>suspendAll</adlnav:hideLMSUI>\n"+
		// "                     </adlnav:navigationInterface>\n"+
		// "                 </adlnav:presentation>\n"+
		// "                 <imsss:sequencing IDRef = \"scampidl\">\n"+
		// "                     <imsss:sequencingRules>\n"+
		// "                         <imsss:preConditionRule>\n"+
		// "                             <imsss:ruleConditions conditionCombination=\"any\">\n"+
		// //"                                 <imsss:ruleCondition referencedObjective=\"next_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
		// "                                 <imsss:ruleCondition condition=\"always\"/>\n"+
		// "                             </imsss:ruleConditions>\n"+
		// "                             <imsss:ruleAction action=\"skip\"/>\n"+
		// "                         </imsss:preConditionRule>\n"+
		// "                    	 <imsss:preConditionRule>\n"+
		// "                         	<imsss:ruleConditions conditionCombination=\"any\">\n"+
		// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"satisfied\"/>\n"+
		// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
		// "                         	</imsss:ruleConditions>\n"+
		// "                         	<imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
		// "                     	</imsss:preConditionRule>\n"+		
		// "                     </imsss:sequencingRules>\n"+
		// "                     <imsss:objectives>\n"+
		// "                         <imsss:primaryObjective />\n"+
		// "                         <imsss:objective objectiveID=\"next_sco_satisfied\">\n"+
		// "                             <imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + lessonNameTrim + "_satisfied\"\n"+
		// "                                           readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"false\"/>\n"+
		// "                         </imsss:objective>\n"+//;
		// "                     <imsss:objective objectiveID=\"previous_sco_satisfied\">\n"+
		// "                         <imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + _this.previousLesson + "_satisfied\"\n"+
		// "                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"false\"/>\n"+
		// "                     </imsss:objective>\n";		
  //       //any objectives stuff goes here - secondaryObjectivesGenerator
  //       if(_this.objectives_arr.length > 0){
  //       	seq += _this._secondaryObjectivesGenerator();
  //       }					
		// seq += "	          		 </imsss:objectives>\n"+		
		// "                 </imsss:sequencing>\n"+
		// "             </item>\n"+
		seq +="             <item identifier=\""+lessonNameTrim+"_id\" identifierref=\"RES-"+lessonNameTrim+"-files\">\n"+// isvisible=\"false\">\n"+             
		"                 <title>"+lessonName+"</title>\n"+
		"                 <adlnav:presentation>\n"+
		"                     <adlnav:navigationInterface>\n"+
		"                         <adlnav:hideLMSUI>abandon</adlnav:hideLMSUI>\n"+
		"                         <adlnav:hideLMSUI>abandonAll</adlnav:hideLMSUI>\n"+
		"                     </adlnav:navigationInterface>\n"+
		"                 </adlnav:presentation>\n"+
		"                 <imsss:sequencing>\n"+
		"                     <imsss:controlMode choiceExit=\"false\"/>\n"+
		"					  <imsss:sequencingRules>\n"+
	    "                    	<imsss:preConditionRule>\n"+
	    "                          	<imsss:ruleConditions conditionCombination=\"any\">\n"+
	    "                          		<imsss:ruleCondition operator=\"not\" condition=\"attempted\"/>\n"+
	    "                        	</imsss:ruleConditions>\n"+
	    "                        	<imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
	    "                    	</imsss:preConditionRule>\n";					
		// "                    	 <imsss:preConditionRule>\n"+
		// "                         	<imsss:ruleConditions conditionCombination=\"any\">\n"+
		// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"satisfied\"/>\n"+
		// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
		// "                         	</imsss:ruleConditions>\n"+
		// "                         	<imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
		// "                     	</imsss:preConditionRule>\n"+		
		seq +="                     </imsss:sequencingRules>\n"+		
		"  	          		  <imsss:rollupRules rollupObjectiveSatisfied=\"true\" rollupProgressCompletion=\"true\" objectiveMeasureWeight=\"1\"></imsss:rollupRules>\n"+
		"  	   	              <imsss:objectives>\n"+
		"  			              <imsss:primaryObjective />\n"+
		"                     	  <imsss:objective objectiveID=\"" + lessonNameTrim + "_satisfied\">\n"+
		"							<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + lessonNameTrim + "_satisfied\"\n"+
		"                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"true\"/>\n"+
		"                     	  </imsss:objective>\n";		
        //any objectives stuff goes here - secondaryObjectivesGenerator
        if(_this.objectives_arr.length > 0){
        	seq += _this._secondaryObjectivesGenerator();
        }					
		seq += "	          		 </imsss:objectives>\n"+		
		"  	          		  <imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n"+
		"  	        	  </imsss:sequencing>\n"+
		"             </item>\n"+
		"             <item identifier=\""+lessonNameTrim+"After_id\" identifierref=\"RES-Review-files\">\n"+// isvisible=\"false\">\n"+
		"                 <title>Test Review</title>\n"+
		"                 <adlnav:presentation>\n"+
		"                     <adlnav:navigationInterface>\n"+
		"                         <adlnav:hideLMSUI>abandon</adlnav:hideLMSUI>\n"+
		"                         <adlnav:hideLMSUI>abandonAll</adlnav:hideLMSUI>\n"+
		"                     </adlnav:navigationInterface>\n"+
		"                 </adlnav:presentation>\n"+
		"                 <imsss:sequencing IDRef = \"scampidl\">\n"+
		"					 <imsss:sequencingRules>\n"+
	    "                    	<imsss:preConditionRule>\n"+
	    "                          	<imsss:ruleConditions conditionCombination=\"any\">\n"+
	    "                          		<imsss:ruleCondition operator=\"not\" condition=\"attempted\"/>\n"+
	    "                        	</imsss:ruleConditions>\n"+
	    "                        	<imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
	    "                    	</imsss:preConditionRule>\n";		
		// "                    	 <imsss:preConditionRule>\n"+
		// "                         	<imsss:ruleConditions conditionCombination=\"any\">\n"+
		// //"                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"satisfied\"/>\n"+
		// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
		// "                         	</imsss:ruleConditions>\n"+
		// "                         	<imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
		// "                     	</imsss:preConditionRule>\n"+
		// "                    	 <imsss:preConditionRule>\n"+
		// "                         	<imsss:ruleConditions conditionCombination=\"any\">\n"+
		// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" condition=\"satisfied\"/>\n"+
		// //"                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
		// "                         	</imsss:ruleConditions>\n"+
		// "                         	<imsss:ruleAction action=\"skip\"/>\n"+
		// "                     	</imsss:preConditionRule>\n"+				
		seq +="                     </imsss:sequencingRules>\n"+
		"  	          		  <imsss:rollupRules rollupObjectiveSatisfied=\"true\" rollupProgressCompletion=\"true\" objectiveMeasureWeight=\"0\"></imsss:rollupRules>\n"+				
		"                     <imsss:objectives>\n"+
		"                         <imsss:primaryObjective />\n"+
		"                     	  <imsss:objective objectiveID=\"" + lessonNameTrim + "_satisfied\">\n"+
		"							<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + lessonNameTrim + "_satisfied\"\n"+
		"                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"true\"/>\n"+
		"                     	  </imsss:objective>\n";		
		// "			            <imsss:objective objectiveID=\"previous_sco_satisfied\">\n"+
		// "		                	<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + lessonNameTrim+ "_satisfied\"\n"+
		// "	                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"false\"/>\n"+
		// "	            		</imsss:objective>\n";			
        //any objectives stuff goes here - secondaryObjectivesGenerator
        if(_this.objectives_arr.length > 0){
        	seq += _this._secondaryObjectivesGenerator();
        }					
		seq += "	          		 </imsss:objectives>\n"+
		"  	          		  <imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n"+		
		"                 </imsss:sequencing>\n"+
		"             </item>\n";//+
		// "             <imsss:sequencing>\n"+
		// "                 <imsss:controlMode flow=\"true\"/>\n"+
		// "                 <imsss:sequencingRules>\n"+
		// "                     <imsss:preConditionRule>\n"+
		// "                         <imsss:ruleConditions conditionCombination=\"any\">\n"+
		// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"satisfied\"/>\n"+
		// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
		// "                         </imsss:ruleConditions>\n"+
		// "                         <imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
		// "                     </imsss:preConditionRule>\n"+
		// "                 </imsss:sequencingRules>\n"+
		// "                 <imsss:objectives>\n"+
		// "                     <imsss:primaryObjective/>\n"+
		// "                     <imsss:objective objectiveID=\"previous_sco_satisfied\">\n"+
		// "                         <imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + _this.previousLesson + "_satisfied\"\n"+
		// "                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"false\"/>\n"+
		// "                     </imsss:objective>\n"+
		// "                 </imsss:objectives>\n"+              
		// "             </imsss:sequencing>\n"+             
		// "         </item>\n";
		return seq;
	},

	_addUSSOCOMExtra: function(lessonName){
		var _this = this;
		var lessonNameTrim = lessonName.replace(/\s+/g, '');
		var courseNameTrim = _this.courseName.replace(/\s+/g, '');
        var item = "           <item identifier=\""+lessonNameTrim+"_id\" identifierref=\"RES-"+lessonNameTrim+"-files\" >\n"+
            "               <title>"+lessonName+"</title>\n"+
            "               <adlnav:presentation>\n"+
            "                   <adlnav:navigationInterface>\n"+
            // "                       <adlnav:hideLMSUI>continue</adlnav:hideLMSUI>\n"+
            // "                       <adlnav:hideLMSUI>previous</adlnav:hideLMSUI>\n"+
            //"                       <adlnav:hideLMSUI>exit</adlnav:hideLMSUI>\n"+
            //"                       <adlnav:hideLMSUI>exitAll</adlnav:hideLMSUI>\n"+
            "                       <adlnav:hideLMSUI>abandon</adlnav:hideLMSUI>\n"+
            "                       <adlnav:hideLMSUI>abandonAll</adlnav:hideLMSUI>\n"+
        	"                   </adlnav:navigationInterface>\n"+
            "               </adlnav:presentation>\n"+         
			"				<imsss:sequencing IDRef = \"scampidl\">\n"+
		    "                  <imsss:sequencingRules>\n"+
		    "                    <imsss:preConditionRule>\n"+
		    "                          <imsss:ruleConditions conditionCombination=\"any\">\n"+
		    "                          <imsss:ruleCondition operator=\"not\" condition=\"attempted\"/>\n"+
		    "                        </imsss:ruleConditions>\n"+
		    "                        <imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
		    "                    </imsss:preConditionRule>\n"+
		    "                  </imsss:sequencingRules>	\n"+			
			"		  	   </imsss:sequencing>\n";	
   //      	"		            <imsss:sequencingRules>\n"+
			// "                     <imsss:preConditionRule>\n"+
			// "                         <imsss:ruleConditions conditionCombination=\"any\">\n"+
			// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"satisfied\"/>\n"+
			// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
			// "                         </imsss:ruleConditions>\n"+
			// "                         <imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
			// "                     </imsss:preConditionRule>\n"+        	
   //          "		   	        	<imsss:postConditionRule>\n"+
   //          "	         		    	<imsss:ruleConditions conditionCombination=\"all\">\n"+
			// "								<imsss:ruleCondition operator=\"not\" condition=\"completed\"/>\n"+
   //          "             		    	</imsss:ruleConditions>\n"+
   //          "       	      		   	<imsss:ruleAction action=\"retry\"/>\n"+
   //          "		       	    	</imsss:postConditionRule>\n"+
   //          "     		   		</imsss:sequencingRules>\n"+
			// "                 <imsss:objectives>\n"+
			// "                     <imsss:primaryObjective/>\n"+
			// "                     <imsss:objective objectiveID=\"previous_sco_satisfied\">\n"+
			// "                         <imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + _this.previousLesson + "_satisfied\"\n"+
			// "                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"false\"/>\n"+
			// "                     </imsss:objective>\n"+
			// "                 </imsss:objectives>\n"+             
           	//item += "		  	   </imsss:sequencing>\n"+   
        	item +="           </item>\n";
        return item;
	},

	_addResources: function(res, lesson){
		var _this = this;
		var resourceLine = '';
	    var resources = _this._resourcesGenerator(res, lesson);

	    for (var i = 0; i < resources.length; i++) {
	    	resourceLine += resources[i];
	    };

	    return resourceLine;
	},

	_resourcesGenerator: function(res, lesson){
		var _this = this;
		var resources = [];
	    res.files.forEach(function(file) {
	        var fileName = file.path.split("\\");
	        //does not include files that don't have an "." ext, directories
	        if(fileName[fileName.length-1].indexOf('.') !== -1 && fileName.indexOf('packages') == -1){
	        	var fullPath = lesson+file.path.replace(/\\/g,"/");
	            resources.push("         <file href=\"" +_this.binDir+ "/"+fullPath.replace(/\s+/g, '%20')+"\"/>\n");
	        }
	    });
	    return resources;		
	},

	_removeTempFiles: function(contentFiles, index, callback){
		var _this = this;
		fs.remove(contentFiles[index], function(err){
			if(err){ 
				_this.logger.error(err);
				callback(err);
			}
			_this.logger.info("removed : " + contentFiles[index]);
			if(index+1 != contentFiles.length){
				_this._removeTempFiles(contentFiles, index+1, callback);
			}
			else{
				callback(null);
			}
		});		
	},
	_createNoneIndex: function(lArray, lessonsName){
		var _this = this;

		var index = '<!DOCTYPE html>\n'+
		'<html>\n'+
		'	<head>\n'+
		'		<meta name=\"HandheldFriendly\" content=\"true\" />\n'+
		'		<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n'+
		'		<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n'+
		'		<title>'+_this.courseName +'</title>\n'+
		'	</head>\n'+
		'	<body>\n'+
		'		<h2>'+_this.courseName+'</h2>\n'+
		'		<ul>\n';
		for(var j=0; j<lArray.length; j++){
			index += '<li><a href=\"'+lessonsName[j]+'/index.html\">'+lessonsName[j]+'</a></li>\n';	
		}
		index += '		</ul>\n'+
		'	</body>\n'+
		'</html>';

		return index;

	}	
 

};

module.exports = SCORM;