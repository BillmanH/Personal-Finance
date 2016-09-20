var ss = SpreadsheetApp.openById("<MY SPREADSHEET ID>"); //IT's in the URL of the Google Sheet
var sheet = ss.getSheetByName("Transactions");
var MyMail = GmailApp.getUserLabelByName("Automation/Bank");
var logsheet = ss.getSheetByName("Issue Tracking");

/// Set a variable for each subject line of emails that you want to filter. 
var singleTransaction = "Your Single Transaction Alert from Chase"
var subjectTarget = "Your Transaction Alert from Bank"

function main() {
 // Get all of the messages from your inbox
  var MyMailThreads = MyMail.getThreads();
  
// cycle through each one and check it for the subject line 
  for (var i = 0 ; i < MyMailThreads.length; i++) {
    var messages = GmailApp.getMessagesForThread(MyMailThreads[i]);
    var transactions = [];
    for (var p = 0 ; p < messages.length; p++) {
      var subject = messages[p].getSubject();
      var isImportant = MyMailThreads[i].isImportant();   
      
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
        
        // Ucnomment this to send to the sheet, I'm migrating to DB so I won't use it anymore.
        //sheet.appendRow([new Date(), MailID, location, date, amount, time,month,day,hour]);
        // send to the DB
        var transaction = {
          'runDate':new Date().toISOString().slice(0, 19).replace('T', ' '),
          'Tmail': MailID,
          'Tloc': location,
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
      if (transactions.length > 0){
        postToDB(transactions);
        //GmailApp.markMessagesRead(messages);
      }
    }  //mark messages read
    
  } 
  GmailApp.markThreadsUnimportant(MyMailThreads);
  //GmailApp.moveToArchive(MyMailThreads);
}

function logger(someList){  // I use this logger function to 
    someList.push(String(new Date()));
    logsheet.appendRow(someList);
    }

function postToDB(transactions){
  var user = '<MyUser>';        //I created a user specifically for this app. Granting permissions to write only to this table.
  var userPwd = '<MyPassword>';
   
  var conn = Jdbc.getConnection("jdbc:sqlserver://<MY DB URL>:1433;databaseName=Home", user, userPwd);
  
  var stmt = conn.createStatement();
  
  // Ended up not using getIdList, but I might use it later to create an INSERT IGNORE function.
  //var mailIds = getIdList(transactions)  
  var sqlString = 
	"INSERT INTO [dbo].[Transaction2]" +
	"([Date of pull],[Unique mail id],[Reciept text],[Date],[Amount],[Time EST])" +
	"VALUES";
     
	logger(["about to post",transactions.length])   
	for (i=0;i<transactions.length;i++){
		logger(["adding to values",transactions[i]])
		sqlString = sqlString + 
			"('" +
			transactions[i]['runDate'] + "','" + 
			transactions[i]['Tmail'] + "','" + 
			transactions[i]['Tloc'] + "','"+ 
			transactions[i]['Tdate'] + "'," + 
			transactions[i]['Tamount'] + ",'" + 
			transactions[i]['Ttime'] + "')"
			if (i!=transactions.length-1) {sqlString = sqlString + ","}
            };
            


   logger([sqlString]);
 
   var rs = stmt.execute(sqlString);
   logger([rs])
  
	// there is no "INSERT IGNORE INTO function so this was the best I could do. 
	// I created a second function to deduplicate the dataset to make sure that there are no duplicate emails.
	// I'm not happy about it and will need to fix it at some time. 
   var dedupString  = "WITH CTE AS(SELECT [Unique mail id],RN = ROW_NUMBER()OVER(PARTITION BY [Unique mail id] ORDER BY [Unique mail id])FROM dbo.Transaction2)DELETE FROM CTE WHERE RN > 1"
   var rs = stmt.execute(dedupString);
   logger([rs])
       
  //Date of pull	Unique mail id	Reciept text	Date	Amount	Time EST	Month	Day	Hour	Category
  //1/1/2016 11:22	151fea35bbd26316	QFC #5887	1/1/2016	44.38	2:21:30 PM	1	1	2	Grocery
   
}

function getIdList(transactions){
	var mailIds = ""
	for (i=0;i<transactions.length;i++){
		mailIds = mailIds + "'" + transactions[i]['Tmail'] + "'"
        if (i!=transactions.length-1) {mailIds = mailIds + ","}
	}
	return mailIds
}

