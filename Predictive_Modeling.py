#These are the packages that I used:
import pandas as pd
import numpy as np
from sklearn.lda import LDA
import sklearn as sk
from datetime import datetime
from collections import Counter

#Step one getting the data:
#specify my working directory:
path = "C:\localmachine\Bill\{}"
#I put it in this way so that I could just add CSV files as they come in. 
myfiles = ["transactions2014.csv",
			"transactions2015_1.csv",
			"transactions2015_2.csv"]
frames = [pd.read_csv(path.format(x)) for x in myfiles]
df = pd.concat(frames)

#Some quick cleaning:
keep_cats = ['Arts&Crafts', 'Coffee', 'Eating at Home', 'Eating out', 'Education', 'Gaming', 'Grocery',
       'Lunch', 'Moving', 'Music', 'Out for drinks', 'Out of town',
       'Technology', 'Transportation', 'Uncategorized']
df['filters'] = df['Category'].apply(lambda x: x in keep_cats)
df = df[df['filters']]
df = df.dropna().reset_index(drop=True)

#pesky date_time issues:
#fix that pesky date issue that I didn't fix before:
df['isDate'] = df.Date.apply(lambda x: '/' in str(x))
df.loc[df['isDate']==False,'Date'] = df.loc[df['isDate']==False,'Date of pull']
df.head()

def fixYear(x):
	try:
		y = datetime.strptime(x, '%m/%d/%Y')
	except:
		y = datetime.strptime(x, '%m/%d/%y')
	return y
df['dataObje'] = df['Date'].apply(lambda X: fixYear(X))


#adding a day of the week:
df['dayOfWeek'] = df['dataObje'].apply(lambda x: x.strftime('%A'))

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
X_train, X_test, y_train, y_test = sk.cross_validation.train_test_split(X, y, test_size=0.3, random_state=42)

clf = LDA()
clf.fit(X_train, y_train)

#now see if my model has any validity:
Y_results = clf.predict(X_test)
#I want to see how the model is able to gues against data that the model has not yet seen:
correct_guesses = Y_results[Y_results == y_test]
correct_guesses_score = len(correct_guesses)/float(len(Y_results))

#to score against: Here is the results of just guessing 'Out for drinks' every time.
drinks_guesses = guess_drinks[np.repeat('Out for drinks',len(y_test)) == y_test]
drinks_guesses_score = len(correct_guesses)/float(len(Y_results))

drinks_guesses_score-float(correct_guesses_score)

#apply that model back into the dataset:
df['predictions'] = clf.predict(X)
accuracy_of_model = len(df[df['predictions'] == df['Category']])/(len(df)*1.)
accuracy_of_random_guess = 1./len(np.unique(y))

print(accuracy_of_model-accuracy_of_random_guess)
