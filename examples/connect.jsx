//@include lib/json2.js
//@include ../restix.jsx

//~ // Example Request
//~ var request = {
//~ 	url:"String",
//~ 	command:"String", // defaults to ""
//~ 	port:443, // defaults to ""
//~ 	method:"GET|POST", // defaults to GET
//~ 	headers:[{name:"String", value:"String"}], // defaults to []
//~ 	body:"" // defaults to ""
//~ }

//~ var response = restix.fetch(request);

//~ if (response.error) {
//~ 	$.writeln("Response Error: " + response.error);
//~ 	$.writeln("Response errorMsg: " + response.errorMsg);
//~ }
//~ $.writeln("Response HTTP Status: " + response.httpStatus);
//~ $.writeln("Response Body: " + response.body);



// Tests with https://github.com/typicode/jsonplaceholder

var testCase = "// Showing a resource";
request = {
	url:"https://jsonplaceholder.typicode.com",
	command:"posts/1", 
	unsafe:true
}
var response = restix.fetch(request);
logResponse (response, testCase) ;

var testCase = "// Creating a resource";
request = {
	url:"https://jsonplaceholder.typicode.com",
	command:"posts", 
	method:"POST",
	
	body: JSON.stringify({
      title: 'foo',
      body: 'bar',
      userId: 1
    }),

    headers: [{name:"Content-type", value:"application/json; charset=UTF-8"}]
}
var response = restix.fetch(request);
logResponse (response, testCase) ;


var testCase = "// Updating a resource PUT";
request = {
	url:"https://jsonplaceholder.typicode.com",
	command:"posts/1", 
	method:"PUT",
	
	body: JSON.stringify({
 	id: 1,
      title: 'foox',
      body: 'barx',
      userId: 1
    }),

    headers: [{name:"Content-type", value:"application/json; charset=UTF-8"}]
}
var response = restix.fetch(request);
logResponse (response, testCase) ;


var testCase = "// Updating a resource PATCH";
request = {
	url:"https://jsonplaceholder.typicode.com",
	command:"posts/1", 
	method:"PATCH",
	
    body: JSON.stringify({
      title: 'foo'
    }),

    headers: [{name:"Content-type", value:"application/json; charset=UTF-8"} ]

}
var response = restix.fetch(request);
logResponse (response, testCase) ;


var testCase = "// Deleting a resource";
request = {
	url:"https://jsonplaceholder.typicode.com",
	command:"posts/1", 
	method:"DELETE",
}
var response = restix.fetch(request);
logResponse (response, testCase) ;

var testCase = "// Filtering resources";
request = {
	url:"https://jsonplaceholder.typicode.com",
	command:"posts?userId=1&id=7"
}
var response = restix.fetch(request);
logResponse (response, testCase) ;

var testCase = "// Fetch a file";
var outFile = File(Folder.desktop + "/" + "restix_output_logo.png");
if (outFile.exists) outFile.remove();
request = {
	url:"https://www.publishingx.de/",
	command:"wp-content/uploads/2012/01/logo.png", 
}
var response = restix.fetchFile(request, outFile);
logResponse (response, testCase) ;
if (outFile.exists) {
	outFile.execute();
	$.writeln("Image downloaded");
}
else {
	$.writeln("Something went wrong");
}



function logResponse (response, testCase) {
	$.writeln(testCase + "  ----");
	if (response.error) {
		$.writeln("Response Error: " + response.error);
		$.writeln("Response errorMsg: " + response.errorMsg);
	}
	$.writeln("Response HTTP Status: " + response.httpStatus);
	$.writeln("Response Body: " + response.body);
}