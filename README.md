# Personal-Finance
These are the files that I use to make my own personal finance appliaction

some of the scripts require keys or paths that you will have to specify. 
Check out the blog :
http://williamjeffreyharding.com/diywebapps/financelogger.html

I've moved a bunch of Python scripts that compile this data in the Quantified Self repo as this is all off-line analysis that isn't invovled with the data collection application. There is a lot of cool stuff there as well. 
Link: https://github.com/BillmanH/Quantified-Self

## transaction_logger.gs
This is the application that gets your transaction emails (GMAIL) and sends them to a google sheet OR to a SQL table. This runs within your GOOGLE APP SCRIPT on your own account.
In this case I'm only using SQLServer so the SQL querystring might change for your application. 
