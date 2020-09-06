//Global Functions
// untag emails parameter, set to `false` when in development
var untag_emails = true

var scriptProperties = PropertiesService.getScriptProperties();
var user = scriptProperties.getProperty('username');
var userPwd = scriptProperties.getProperty('password');
var sheetguid = scriptProperties.getProperty('sheetguid');
var myServer = scriptProperties.getProperty('serverfqdn');

//Gmail 
var ss = SpreadsheetApp.openById(sheetguid);
var logsheet = ss.getSheetByName("Issue Tracking"); //logsheet is optional but useful. 
var ChaseMail = GmailApp.getUserLabelByName("Automation/Bank Unprocessed");
var ChaseOut = GmailApp.getUserLabelByName("Automation/Bank Processed");


/// Set a variable for each subject line of emails that you want to filter. 
var singleTransaction = "Your Single Transaction Alert from Chase"
var subjectTarget = "Your Single Transaction Alert from Chase"

//extra functions go here.
function logger(someList){
    someList.push(String(new Date()));
    logsheet.appendRow(someList);
}

function get_substr(paragraph,regExp, i){
  var answer = paragraph.match(regExp)[i];
  return answer
}

// this is the main function that iterates through all messages
function main() {
//  logger(["function started"])
  // Get all of the messages from your inbox
  var ChaseMailThreads = ChaseMail.getThreads();
  
  // cycle through each one and check it for the subject line 
  logger(["Found threads",ChaseMailThreads.length]);
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
        
        var amount = get_substr(HTMLbody,RegExp(/\(\$USD\) ([0-9]+.[0-9]+) at/), 1)
        var location = get_substr(HTMLbody,RegExp(/at (.*) has been authorized/), 1)
        
        var date = get_substr(HTMLbody,RegExp(/on (.*) at /), 1)
        var time = get_substr(HTMLbody,RegExp(/ at ([0-9]+:[0-9]+ [AP]M) ET/), 1)
              

//        logger([new Date(), MailID, location, date, amount, time]);
      
          // send to the DB
          var transaction = {
            'runDate':new Date().toISOString().slice(0, 19).replace('T', ' '),
            'Tmail': MailID,
            'Tloc': location.replace("'", ' '),
            'Tdate': date,
            'Tamount': amount,
            'Ttime': time
          }
          try{
                postToDB(transaction);
                // only update the taggs if in prod
                if(untag_emails){
                  messages[p].getThread().removeLabel(ChaseMail)
                  messages[p].getThread().addLabel(ChaseOut)
                }
              } catch(e){
                logger(["error pushing",e,JSON.stringify(transaction),HTMLbody]);
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
    
    try{
    var rs = stmt.execute(sqlString);
    //logger(["executed successful",rs,sqlString]);    
    } catch(e){
    logger(["Error executing",e,sqlString]);
    }
}



   
