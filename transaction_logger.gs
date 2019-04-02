var ss = SpreadsheetApp.openById("{spreadsheet id : it's in the URL}");
var sheet = ss.getSheetByName("Transactions");
var ChaseMail = GmailApp.getUserLabelByName("Automation/Bank Unprocessed");
var ChaseOut = GmailApp.getUserLabelByName("Automation/Bank Processed");


var logsheet = ss.getSheetByName("Issue Tracking");

/// Set a variable for each subject line of emails that you want to filter. 
var singleTransaction = "{you bank's email subject line}"
var subjectTarget = "{you bank's email subject line}"



function main() {
  logger(["function started"])
 // Get all of the messages from your inbox
  var ChaseMailThreads = ChaseMail.getThreads();
  
// cycle through each one and check it for the subject line 

  logger(["Found threads",ChaseMailThreads.length])
  for (var i = 0 ; i < ChaseMailThreads.length; i++) {
    var messages = GmailApp.getMessagesForThread(ChaseMailThreads[i]); 
      for (var p = 0 ; p < messages.length; p++) {
        var subject = messages[p].getSubject();
        var isImportant = ChaseMailThreads[i].isImportant();   
        
        var isFrom = messages[p].getFrom() 
        if(isFrom!="{your banks email}"){continue};  //Chase <no-reply@alertsp.chase.com>
          // dicect the body of the email
          var MailID = messages[p].getId();
          var HTMLbody = messages[p].getBody();
          var paragraph = HTMLbody.slice(97,319);
          
          //messages[p].moveToTrash();
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
         
              try{
                postToDB(transaction);
                messages[p].getThread().removeLabel(ChaseMail)
                messages[p].getThread().addLabel(ChaseOut)
                    } catch(e){
                     logger(["error pushing",e,JSON.stringify(transaction)]);
                   }
      }
    }  

  }

function postToDB(transaction){
  var user = '{your secure login creds}';
  var userPwd = '{you secure login creds}';
   
  var conn = Jdbc.getConnection("jdbc:sqlserver://{ Your server }:1433;databaseName=Home", user, userPwd);
  
  var stmt = conn.createStatement();

     

    var sqlString2 = "MERGE [dbo].[Transactions] AS [TARGET] " +
                      "USING  (VALUES ('" + transaction['runDate'] + "'," + 
                                      "'"+ transaction['Tmail'] + "'," + 
                                      "'"+ transaction['Tloc'] + "',"+ 
                                      "'"+ transaction['Tdate'] + "'," + 
                                      ""+ transaction['Tamount'] + "," + 
                                      "'"+ transaction['Ttime'] + "')) AS [SOURCE] "+
                      "([Date of pull],[Unique mail id],[Reciept text],[Date],[Amount],[Time EST])"+
                      "on [Target].[Unique mail id] = [Source].[Unique mail id] "+
                      
                      "WHEN NOT MATCHED "+
                      "THEN INSERT "+
                      "VALUES ("+
                      "'" + transaction['runDate'] + "'," + 
                                      "'"+ transaction['Tmail'] + "'," + 
                                      "'"+ transaction['Tloc'] + "',"+ 
                                      "'"+ transaction['Tdate'] + "'," + 
                                      ""+ transaction['Tamount'] + "," + 
                                      "'"+ transaction['Ttime'] + "');"
    
    try{
    var rs = stmt.execute(sqlString2);
    
    } catch(e){
    logger(["Transaction Run",e,sqlString2]);
    }
}
   
