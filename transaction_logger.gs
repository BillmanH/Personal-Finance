//Global Functions
// untag emails parameter, set to `false` when in development
var untag_emails = false

var scriptProperties = PropertiesService.getScriptProperties();
var user = scriptProperties.getProperty('username');
var userPwd = scriptProperties.getProperty('password');
var sheetguid = scriptProperties.getProperty('sheetguid');
var myServer = scriptProperties.getProperty('serverfqdn');

//Gmail 
var ss = SpreadsheetApp.openById(sheetguid);
var sheet = ss.getSheetByName("Transactions");
var ChaseMail = GmailApp.getUserLabelByName("Automation/Bank Unprocessed");
var ChaseOut = GmailApp.getUserLabelByName("Automation/Bank Processed");
var logsheet = ss.getSheetByName("Issue Tracking");


/// Set a variable for each subject line of emails that you want to filter. 
var singleTransaction = "Your Single Transaction Alert from Chase"
var subjectTarget = "Your Single Transaction Alert from Chase"



function main() {
  //logger(["function started"])
  // Get all of the messages from your inbox
  var ChaseMailThreads = ChaseMail.getThreads();
  
  // cycle through each one and check it for the subject line 
  
  logger(["Found threads",ChaseMailThreads.length])
  for (var i = 0 ; i < ChaseMailThreads.length; i++) {
    var messages = GmailApp.getMessagesForThread(ChaseMailThreads[i]); 
      for (var p = 0 ; p < messages.length; p++) {
        var subject = messages[p].getSubject();
        var isImportant = ChaseMailThreads[i].isImportant();   
        
        var isFrom = messages[p].getFrom() //"Chase <no.reply.alerts@chase.com>"
        if(isFrom!="Chase <no.reply.alerts@chase.com>"){continue};
          // dicect the body of the email
          var MailID = messages[p].getId();
          var HTMLbody = messages[p].getBody();
          var paragraph = HTMLbody.slice(97,319);
          
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
                // only update the taggs if in prod
                if(untag_emails){
                  messages[p].getThread().removeLabel(ChaseMail)
                  messages[p].getThread().addLabel(ChaseOut)
                }
              } catch(e){
                logger(["error pushing",e,JSON.stringify(transaction)]);
              }
      }
    }
}

function postToDB(transaction){
  var conn = Jdbc.getConnection(myServer, user, userPwd);  
  var stmt = conn.createStatement();
  var sqlString = "MERGE [dbo].[Transactions] AS [TARGET] " +
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
    
      var rs = stmt.execute(sqlString);
    try{
    var rs = stmt.execute(sqlString2);
    
    } catch(e){
    logger(["Transaction Run",e,sqlString2]);
    breakymcbreakfast
    }
}
   
