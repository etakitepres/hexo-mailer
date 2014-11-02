var fs = require('fs');
var ejs = require('ejs');
var FeedSub = require('feedsub');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('cWoBJ-rflPj5Cv6ABU-n6Q');
var csvFile = fs.readFileSync("friend_list.csv", "utf8"); // Reads CSV file
var emailTemplate = fs.readFileSync('email_template.ejs', 'utf8');
var customizedTemplate;
var latestPosts = [];
var firstName, lastName, emailAddress;
 

function csvParse(myCSVfile) {
	var myCSVarray = myCSVfile.split("\n"); // Splits CSV file into an array of strings (one for each person) 
	var valueNames = myCSVarray.shift().split(","); // Removes first string in CSV array - for later use in creating value names in objects
	var myFinalResult = [];

	myCSVarray.forEach(function(contact) { // Performs on remaining elements in CSV array
		var myContact = contact.split(","); // Turns a contact string into an array ["John", "Smith", etc..]
		var myContactObject = {};

		for(var count = 0; count < myContact.length; count++) {
			myContactObject[valueNames[count]] = myContact[count]; // Creates new property in object
		}
		myFinalResult.push(myContactObject);
	});

	return myFinalResult;
}

var blogContent = new FeedSub('http://katiepeters.github.io/atom.xml', {
        emitOnStart: true
});
 
function millisecsToDays(milliSecs) {
	var seconds = milliSecs / 1000;
	var minutes = seconds / 60;
	var hours = minutes / 60;
	var days = hours / 24;

	return days;
} 
 
blogContent.read(function(err,blogPosts){

	blogPosts.forEach(function(post){
		// Check if current date - post date <= 20 (bc no posts within past 7 days)
		var currentDate = new Date();
		var postDate = new Date(post.published);

		if (millisecsToDays(currentDate.getTime() - postDate.getTime()) <= 20) {
			latestPosts.push(post);
		}
	});

	friendList = csvParse(csvFile);

	friendList.forEach(function(row){
				
	    firstName = row["firstName"];
	    lastName = row["lastName"];
	    emailAddress = row["emailAddress"];
	    monthsSinceContact = row["monthsSinceContact"];
		customizedTemplate = ejs.render(emailTemplate, 
			{ firstName: firstName,  
				monthsSinceContact: monthsSinceContact, 
				latestPosts: latestPosts
		});	
	});
	sendEmail((firstName + " " + lastName), emailAddress, "Katie Peters", "katiejoypeters@gmail.com", "Made this email in code!", customizedTemplate);
});


function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
	var message = {
	  "html": message_html,
	  "subject": subject,
	  "from_email": from_email,
	  "from_name": from_name,
	  "to": [{
	          "email": to_email,
	          "name": to_name
	      }],
	  "important": false,
	  "track_opens": true,    
	  "auto_html": false,
	  "preserve_recipients": true,
	  "merge": false,
	  "tags": [
	      "Fullstack_Hexomailer_Workshop"
	  ]    
	};
	var async = false;
	var ip_pool = "Main Pool";
	mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
	  // console.log(message);
	  // console.log(result);   
	}, function(e) {
	  // Mandrill returns the error as an object with name and message keys
	  console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	  // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
	}  
	);
}




