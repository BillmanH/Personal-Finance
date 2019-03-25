var ss = SpreadsheetApp.openById("<my Spreadsheet>");
var sheet = ss.getSheetByName("Transactions");
var ChaseMail = GmailApp.getUserLabelByName("Automation/Bank");
var logsheet = ss.getSheetByName("Issue Tracking");

/// Set a variable for each subject line of emails that you want to filter. 
var singleTransaction = "Your Single Transaction Alert from <bank>"
var subjectTarget = "Your Single Transaction Alert from <bank>"

function main() {
  
 // Get all of the messages from your inbox
  var myMailThreads = myMail.getThreads();
  
// cycle through each one and check it for the subject line 
  var transactions = [];
  for (var i = 0 ; i < myMailThreads.length; i++) {
    var messages = GmailApp.getMessagesForThread(myMailThreads[i]); 
      for (var p = 0 ; p < messages.length; p++) {
        var subject = messages[p].getSubject();
        var isImportant = myMailThreads[i].isImportant();   
        
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
          var date = paragraph.slice(dateStartMark + 4,dateStartMark + 14);
          
          // locat the time
          var timeEndMark = paragraph.lastIndexOf("M ");
          var time = paragraph.slice(timeEndMark - 10,timeEndMark + 2);
          
          var month = date.substring(0, date.indexOf("/"));
          var day = date.substring(date.indexOf("/")+1, date.split("/", 2).join("/").length);
          var hour = time.substring(1, time.indexOf(":"));
          
          // send to the sheet 
          //sheet.appendRow([new Date(), MailID, location, date, amount, time,month,day,hour]);
          // send to the DB
          var transaction = {
            'runDate':new Date().toISOString().slice(0, 19).replace('T', ' '),
            'Tmail': MailID,
            'Tloc': location.replace("'", ' '),
            'Tdate': date,
            'Tamount': amount,
            'Ttime': time,
            'Tmonth': month,
            'Tday': day,
            'Thour':hour
          }
          transactions.push(transaction);
          //logger(["type",typeof(transactions)])
          //logger(["transaction",transaction,transactions])
          
        }
      }
    }  //mark messages read
      if (transactions.length > 0){
        postToDB(transactions);
      } 
  }
  //GmailApp.markThreadsUnimportant(ChaseMailThreads);



function logger(someList){
    someList.push(String(new Date()));
    logsheet.appendRow(someList);
    }

function postToDB(transactions){
  var user = '<my Login>';
  var userPwd = '<my password>';
   
  var conn = Jdbc.getConnection("<server login>", user, userPwd);
  
  var stmt = conn.createStatement();

     
    for (i=0;i<transactions.length;i++)
    {
    var sqlString2 = "MERGE [dbo].[Transactions] AS [TARGET] " +
                      "USING  (VALUES ('" + transactions[i]['runDate'] + "','" + 
                                      "'"+ transactions[i]['Tmail'] + "','" + 
                                      "'"+ transactions[i]['Tloc'] + "','"+ 
                                      "'"+ transactions[i]['Tdate'] + "'," + 
                                      "'"+ transactions[i]['Tamount'] + ",'" + 
                                      "'"+ transactions[i]['Ttime'] + "')) AS [SOURCE] "+
                      "([Date of pull],[Unique mail id],[Reciept text],[Date],[Amount],[Time EST])"+
                      "on [Target].[Unique mail id] = [Source].[Unique mail id] "+
                      
                      "WHEN NOT MATCHED "+
                      "THEN INSERT "+
                      "VALUES ("+
                      "'" + transactions[i]['runDate'] + "','" + 
                                      "'"+ transactions[i]['Tmail'] + "','" + 
                                      "'"+ transactions[i]['Tloc'] + "','"+ 
                                      "'"+ transactions[i]['Tdate'] + "'," + 
                                      "'"+ transactions[i]['Tamount'] + ",'" + 
                                      "'"+ transactions[i]['Ttime'] + "');"
    logger(["Transaction Run",sqlString2]);
    var rs = stmt.execute(sqlString2);
  }
   
}

function getIdList(transactions){
	var mailIds = ""
	for (i=0;i<transactions.length;i++){
		mailIds = mailIds + "'" + transactions[i]['Tmail'] + "'"
        if (i!=transactions.length-1) {mailIds = mailIds + ","}
	}
	return mailIds
}
