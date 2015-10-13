#These are the packages that I used:
import pandas as pd
import numpy as np
from sklearn.lda import LDA
import datetime

#Step one getting the data:
#specify my working directory:
path = "C:\localmachine\Bill\{}"
#I put it in this way so that I could just add CSV files as they come in. 
myfiles = ["transactions2014.csv",
			"transactions2015.csv"]
frames = [pd.read_csv(path.format(x)) for x in myfiles]
df = pd.concat(frames)

#Some quick cleaning:
keep_cats = ['Arts&Crafts', 'Coffee', 'Eating at Home', 'Eating out', 'Education', 'Gaming', 'Grocery',
       'Lunch', 'Moving', 'Music', 'Out for drinks', 'Out of town',
       'Technology', 'Transportation', 'Uncategorized']
df['filters'] = df['Category'].apply(lambda x: x in keep_cats)
df = df[df['filters']]
df = df.dropna().reset_index(drop=True)

#adding a day of the week:
def get_day_of_week(x):
	try:
		mydate = datetime.datetime.strptime(x, '%m/%d/%Y')
	except:
		#I was inconsistent with my datestrings
		#Why didn't I just use ISO format!
		mydate = datetime.datetime.strptime(x, '%m/%d/%y')
	return mydate.strftime('%A')
	
df['dayOfWeek'] = df['Date of pull'].apply(lambda x: get_day_of_week(x))

#then I'm using the "distance from saturday as a proxy for catagorical value"
def dist_from_sat(x):
	myvalues = {'Friday' :1,
				'Monday':2,
				'Saturday':0, 
				'Sunday':1, 
				'Thursday':2,
				'Tuesday':3,
				'Wednesday':3}
	return myvalues[x]
df['distFromSat'] = df['dayOfWeek'].apply(lambda x: dist_from_sat(x))
	
	
#transform my data for the model:
X = df.loc[:,['distFromSat','Hour','Amount']].values
y = df.loc[:,'Category'].values

#now I can run my model:
clf = LDA()
clf.fit(X, y)

#now see if my model has any validity:
df['predictions'] = clf.predict(X)
accuracy_of_model = len(df[df['predictions'] == df['Category']])/(len(df)*1.)
accuracy_of_random_guess = 1./len(np.unique(y))

print(accuracy_of_model-accuracy_of_random_guess)
#0.212 over random isn't so bad :)
