#These are the packages that I used:
import pandas as pd
import numpy as np
import json

#Step one getting the data:
#specify my working directory:
path = "C:\Users\BillsComputer\Finance\{}"
#I put it in this way so that I could just add CSV files as they come in. 
myfiles = ["transactions2014.csv",
			"transactions2015.csv"]
frames = [pd.read_csv(path.format(x)) for x in myfiles]
df = pd.concat(frames)

#giving a category to the Uncategorized:
df = df.fillna('Uncategorized')

#dumping a bunch of categories that are too small and would cloud up the display:
keep_cats = ['Arts&Crafts', 'Coffee', 'Eating at Home', 'Eating out', 'Education', 'Gaming', 'Grocery',
       'Lunch', 'Moving', 'Music', 'Out for drinks', 'Out of town',
       'Technology', 'Transportation', 'Uncategorized']
df['filters'] = df['Category'].apply(lambda x: x in keep_cats)
df = df[df['filters']].reset_index(drop=True)
	   
#Converting the months from number to text:
months = ['January','February','March','April','May','June','July','August','September','October','November','December']
df['monthsT'] = df['Month'].apply(lambda x: months[x-1])


#basic layout of dict for D3.js
'''
flare_dict = {
 "name": "flare",
 "children": [
  ]}
'''
 
#step two: Build a dictionary
#These functions could have been combined into a single function with arguments, but hey.
def get_months():
	myList = []
	for month in months:
		monthlyTotal = df[df.monthsT==month]['Amount'].sum()
		myList.append({"name":month,"size":monthlyTotal,"children":[]})
	return myList
	
def get_categories(month):
	myList = []
	subset = df[df['monthsT']==month]
	for cat in keep_cats:
		catTotal = subset[subset.Category==cat]['Amount'].sum()
		if catTotal>0:
			myList.append({"name":cat,"size":catTotal,"children":[]})
	return myList
	
def get_leaves(month,cat):
	myList = []
	subset = df[(df['monthsT']==month) & (df['Category']==cat)]
	for recipt in np.unique(subset['Reciept text']):
		catTotal = subset[subset['Reciept text']==recipt]['Amount'].sum()
		if catTotal>0:
			myList.append({"name":recipt,"size":catTotal,"children":[]})
	return myList
	
#now I start puting things together
flare_dict = {"name": "flare",
	"children": get_months()
	}
	
for a in flare_dict['children']:
	a['children'] = get_categories(a['name'])
	for b in a['children']:
		b['children'] = get_leaves(a['name'],b['name'])

#save a copy in Json. Bam! I'm done. 
with open(path.format('finance_data.json'), 'w') as fp:
    json.dump(flare_dict, fp)
