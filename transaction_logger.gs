var ss = SpreadsheetApp.openById("yoursheedID");
var sheet = ss.getSheetByName("Transactions");
var bankMail = GmailApp.getUserLabelByName("Automation/Bank");

/// Set a variable for each subject line of emails that you want to filter. 
var singleTransaction = "Your Single Transaction Alert from Your Bank"
var subjectTarget = "Your Single Transaction Alert from Your Bank"

function main() {
 // Get all of the messages from your inbox
  var bankMailThreads = bankMail.getThreads();
  
// cycle through each one and check it for the subject line 
 for (var i = 0 ; i < bankMailThreads.length; i++) {
 var messages = GmailApp.getMessagesForThread(bankMailThreads[i]);
   for (var p = 0 ; p < messages.length; p++) {
     var subject = messages[p].getSubject();
     var isImportant = bankMailThreads[i].isImportant();   
     
     if (subject == singleTransaction && isImportant==true) 
     {
       // dicect the body of the email
       var MailID = messages[p].getId();
       var HTMLbody = messages[p].getBody();
       var paragraph = HTMLbody.slice(97,319);
       
       messages[p].moveToTrash();
       //locate the $$ sum
       var usdMark = paragraph.lastIndexOf("($USD)");
       var atMark = paragraph.lastIndexOf(" at ");
       
       // locate the location (using above variable)
       var amount = paragraph.slice(usdMark+7,atMark);
       var locationEndMark = paragraph.lastIndexOf(" has ");
       var location = paragraph.slice(atMark + 4,locationEndMark);
       
       // locate the date
       var dateStartMark = paragraph.lastIndexOf(" on ");      
       var date = paragraph.slice(dateStartMark + 4,dateStartMark + 9);
       
       
       //10/7/2014
       
       // locat the time
       var timeEndMark = paragraph.lastIndexOf("M ");
       var time = paragraph.slice(timeEndMark - 10,timeEndMark + 2);
       
       var month = date.substring(0, date.indexOf("/"));
       var day = date.substring(date.indexOf("/")+1, date.split("/", 2).join("/").length);
       var hour = time.substring(1, time.indexOf(":"));
       
       // send to the sheet 
       sheet.appendRow([new Date(), MailID, location, date, amount, time,month,day,hour]);
       
      
       
      }
     //GmailApp.markMessagesRead(messages);
   }
   
 }
 
  
 GmailApp.markThreadsUnimportant(bankMailThreads);
 //GmailApp.moveToArchive(bankMailThreads);
}





