/****************
# Connect InDesign to the web
* HTTPS supported 
* Works form CS4 to CC 2018 (ExtendScript based library)
* Based on VBScript/ServerXMLHTTP (Win) AppleScript/curl (Mac) relies on app.doScript()

## Getting started
See examples/connect.jsx

* @Version: 1.2
* @Date: 2019-02-20
* @Author: Gregor Fellenz, http://www.publishingx.de
* Acknowledgments: 
** Library design pattern from Marc Aturet https://forums.adobe.com/thread/1111415
*/

$.global.hasOwnProperty('restix') || (function (HOST, SELF) {
	HOST[SELF] = SELF;

	/****************
	* PRIVATE
	*/
	var INNER = {};
	INNER.version = "2019-02-20-1.2";


	/** Returns if the operating system is windows 
	* @return {String} true | false
	*/
	INNER.isWindows = function () {
		return ($.os.indexOf("Windows") > -1);
	}

	/** Check the request information object and construct a full URL
	* @param {request} Request information object
	* @returns{request} Request information object or throws an error
	*/
	INNER.checkRequest = function (request) {
		if (request.url == undefined || request.url == "") throw Error("No property [url] found/set");
		if (request.url.toString().slice(-1) == "/") request.url = request.url.toString().slice(0, -1);

		if (request.command == undefined) request.command = "";
		if (request.command.toString()[0] == "/") request.command = request.command.toString().substr(1);

		if (request.port == undefined) request.port = "";
		if (isNaN(request.port)) throw Error("[port] is Not a Number");

		// Add port
		if (request.port != "") {
			request.fullURL = request.url + ":" + request.port;
		}
		else {
			request.fullURL = request.url;
		}

		// Add command 
		if (request.command != "") {
			request.fullURL = request.fullURL + "/" + request.command;
		}


		if (request.method == undefined || request.method == "") request.method = "GET";
		if (!(request.method == "GET" || request.method == "POST" || request.method == "PUT" || request.method == "PATCH" || request.method == "DELETE")) throw Error("Method " + request.method + " is not supported");  // Missing HEAD 

		if (request.method == "POST" && (request.binaryFilePath == undefined || request.binaryFilePath == "")) request.binaryFilePath = false;

		if (request.headers == undefined) request.headers = [];
		if (!(request.headers instanceof Array)) throw Error("Provide [headers] as Array of {name:'',value''} objects");
		if (request.body == undefined || request.body == "") request.body = false;

		if (request.body && request.binaryFilePath) throw Error("You must not provide [body] and [binaryFilePath]");

		request.unsafe = false;

		if (request.proxy == undefined) request.proxy = false;

		return request;
	}

	/** The main connection function. Need to be slashed
	* @return {response} Response result object 
	*/
	INNER.processRequest = function (request, outFile) {
		var response = {
			error: false,
			errorMsg: "",
			body: "",
			httpStatus: 900
		};

		var scriptCommands = [];
		var systemCmd = "";
		var result = "";

		if (INNER.isWindows()) {
			// Since Win10 Update Feb 2019 msxml3 does not work anymore...
			scriptCommands.push('Dim xHttp : Set xHttp = CreateObject("MSXML2.ServerXMLHTTP.6.0")');
			// Konstanten für ADODB.Stream
			scriptCommands.push('Const adTypeBinary = 1');
			scriptCommands.push('Const adSaveCreateOverWrite = 2');
			scriptCommands.push('Const adModeReadWrite = 3');

			scriptCommands.push('Dim res');
			scriptCommands.push('On Error Resume Next');
			scriptCommands.push('xHttp.Open "' + request.method + '", "' + request.fullURL + '", False');

			if (request.proxy != false) {
				// xHttp.SetProxy 1
				scriptCommands.push('xHttp.setProxy 2, "' + request.proxy + '"');
			}

			for (var i = 0; i < request.headers.length; i++) {
				scriptCommands.push('xHttp.setRequestHeader "' + request.headers[i].name + '","' + request.headers[i].value + '"');
			}
			if (request.unsafe) {
				//~ ' 2 stands for SXH_OPTION_IGNORE_SERVER_SSL_CERT_ERROR_FLAGS
				//~ ' 13056 means ignore all server side cert error
				scriptCommands.push('xHttp.setOption 2, 13056');
			}

			if (request.body) {
				scriptCommands.push('xHttp.Send "' + request.body.replace(/"/g, '""').replace(/\n|\r/g, '') + '"');
			}
			else if (request.method == "POST" && request.binaryFilePath) {
				// http://www.vbforums.com/showthread.php?418570-RESOLVED-HTTP-POST-a-zip-file
				scriptCommands.push('    Dim sFile');
				scriptCommands.push('    sFile = "' + request.binaryFilePath + '"');


				scriptCommands.push('    Set objStream = CreateObject("ADODB.Stream")');
				scriptCommands.push('    objStream.Type = adTypeBinary');
				scriptCommands.push('    objStream.Mode = adModeReadWrite');
				scriptCommands.push('    objStream.Open');
				scriptCommands.push('    objStream.LoadFromFile(sFile)');

				scriptCommands.push('    xHttp.SetRequestHeader "Content-Length", objStream.Size');
				scriptCommands.push('    xHttp.Send objStream.Read(objStream.Size)');
				scriptCommands.push('    Set objStream= Nothing');
			}
			else {
				scriptCommands.push('xHttp.Send');
			}
			
			scriptCommands.push('If err.Number = 0 Then');

			if (outFile) {
				scriptCommands.push('    Set objStream = CreateObject("ADODB.Stream")');
				scriptCommands.push('    objStream.Type = adTypeBinary');
				scriptCommands.push('    objStream.Mode = adModeReadWrite');
				scriptCommands.push('    objStream.Open');
				scriptCommands.push('    objStream.Write xHttp.responseBody');
				scriptCommands.push('    objStream.SaveToFile "' + outFile.fsName + '" , adSaveCreateOverWrite');
				scriptCommands.push('    objStream.Close');
				scriptCommands.push('    Set objStream= Nothing');
				/*	
					 ADODB.Stream let's you also save text data and let's you specify charset (codepage) for text-to-binary data conversion (against of Scripting.TextStream object). 
					Const adTypeText = 2
					Const adSaveCreateOverWrite = 2
				  
					'Create Stream object
					Dim BinaryStream
					Set BinaryStream = CreateObject("ADODB.Stream")
				  
					'Specify stream type - we want To save text/string data.
					BinaryStream.Type = adTypeText
				  
					'Specify charset For the source text (unicode) data.
					If Len(CharSet) > 0 Then
						BinaryStream.CharSet = CharSet
					End If
				  
					'Open the stream And write binary data To the object
					BinaryStream.Open
					BinaryStream.WriteText Text
				  
					'Save binary data To disk
					BinaryStream.SaveToFile FileName, adSaveCreateOverWrite
				End Function
					*/
				scriptCommands.push('	res = "outFile" & vbCr & "------http_code" &  xHttp.status');
			}
			else {
				// ' give respones
				scriptCommands.push('	res = xHttp.responseText  &  vbCr & "------http_code" &  xHttp.status');
			}

			scriptCommands.push('Else');
			scriptCommands.push('	res =  "xHttpError "  & Err.Description &  " " & Err.Number');
			scriptCommands.push('End If');

			scriptCommands.push('Set xHttp = Nothing');
			scriptCommands.push('returnValue = res');

			scriptCommands = scriptCommands.join("\r\n");

			try {
				result = app.doScript(scriptCommands, ScriptLanguage.VISUAL_BASIC);
			}
			catch (e) {
				result = "doScriptError: " + e.message;
			}

		}
		else { // Mac
			// -L follow redirects 
			var curlString = 'curl --silent --show-error -g -L ';
			for (var i = 0; i < request.headers.length; i++) {
				curlString += (' -H \'' + request.headers[i].name + ': ' + request.headers[i].value + '\'');
			}
			if (request.unsafe) {
				// Es gab einen Fall wo am Mac mit -k es nicht funktioniert hat curl: (35) Server aborted the SSL handshake
				curlString += ' -k ';
			}

			if (request.proxy != false) {
				curlString += ' --proxy ' + request.proxy
			}

			curlString += ' -X ' + request.method;
			if (request.body) {
				curlString += ' -d \'' + request.body.replace(/"/g, '\\"').replace(/\n|\r/g, '') + '\'';
			}
			else if (request.method == "POST" && request.binaryFilePath) {
				curlString += ' --data-binary \'@' + request.binaryFilePath + '\'';
			}

			if (outFile) {
				curlString += ' -w \'outFile\n------http_code%{http_code}\'';
				curlString += ' -o \'' + outFile.fsName + '\''
			}
			else {
				curlString += ' -w \'\n------http_code%{http_code}\'';
			}
			curlString += ' \'' + request.fullURL + '\'';
			//~ 			$.writeln(curlString);
			try {
				result = app.doScript('do shell script "' + curlString + '"', ScriptLanguage.APPLESCRIPT_LANGUAGE);
			}
			catch (e) {
				result = "doScriptError: " + e.message;
			}
		}

		// Fill response 
		if (typeof result == 'undefined') {
			throw Error("No result value. Probably System Script could not run?");
		}
		if (result.match(/^xHttpError|^curl: \(\d+\)|^doScriptError:/)) {
			response.error = true;
			response.errorMsg = result;
		}
		else {
			var resArray = result.split("\r------http_code");
			if (resArray.length == 2) {
				response.httpStatus = resArray[1] * 1;
				response.body = resArray[0];
			}
			else {
				throw Error("Wrong result value: [" + result + "]");
			}
		}

		return response;
	}


	/****************
    * API 
    */
	/** Process an HTTP Request 
	* @param {request} Request object with connection Information
	* @return {response} Response object {error:error, errorMsg:errorMsg, body:body, httpStatus:httpStatus}
	*/
	SELF.fetch = function (request) {
		request = INNER.checkRequest(request);
		return INNER.processRequest(request, false);
	}

	/** Process an HTTP Request and writes the result to a give File
	* @param {request} Request Object with connection Information
	* @param {outFile} File to write to
	* @return {response} Response object {error:error, errorMsg:errorMsg, body:body, httpStatus:httpStatus}
	*/
	SELF.fetchFile = function (request, outFile) {
		if (outFile == undefined) throw Error("No file provided");
		if (outFile instanceof String) outFile = File(outFile);

		request = INNER.checkRequest(request);
		var response = INNER.processRequest(request, outFile);
		if (!outFile.exists) {
			response.error = true;
			response.errorMsg = "File was not created\n" + response.errorMsg;
		}
		return response;
	}



})($.global, { toString: function () { return 'restix'; } });


// Example Request
//  var request = {
//  	url:"String",
//  	command:"String", // defaults to ""
//  	port:443, // defaults to ""
//  	method:"GET|POST", // defaults to GET
//  	headers:[{name:"String", value:"String"}], // defaults to []
//  	body:"" // defaults to ""
// }

// var request = {
//  	url:"https://www.publishingx.de"
// }

// var response = restix.fetch(request);
// $.writeln(response.toSource());

//~ if (response.error) {
//~ 	$.writeln("Response Error: " + response.error);
//~ 	$.writeln("Response errorMsg: " + response.errorMsg);
//~ }
//~ $.writeln("Response HTTP Status: " + response.httpStatus);
//~ $.writeln("Response Body: " + response.body);