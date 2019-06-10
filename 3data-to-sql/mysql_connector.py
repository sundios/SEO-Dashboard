import pandas as pd
import os
import pymysql
from sqlalchemy import create_engine

user = 'root'
passw = 'root'
host =  'localhost'  # either localhost or ip e.g. '172.17.0.2' or hostname address 
port = 8889 
database = 'ecom'

mydb = create_engine('mysql+pymysql://' + user + ':' + passw + '@' + host + ':' + str(port) + '/' + database , echo=False)

#exporting mobile
csvFileName = 'mobile.csv'
mobile = pd.read_csv(os.path.join(csvFileName))
mobile.to_sql(name=csvFileName[:-4], con=mydb, if_exists = 'replace', index=False)

#exporting mobile
csvFileName = 'desktop.csv'
desktop = pd.read_csv(os.path.join(csvFileName))
desktop.to_sql(name=csvFileName[:-4], con=mydb, if_exists = 'replace', index=False)

#exporting mobile
csvFileName = 'tablet.csv'
tablet = pd.read_csv(os.path.join(csvFileName))
tablet.to_sql(name=csvFileName[:-4], con=mydb, if_exists = 'replace', index=False)

#exporting Keywords
csvFileName = 'keywords.csv'
tablet = pd.read_csv(os.path.join(csvFileName))
tablet.to_sql(name=csvFileName[:-4], con=mydb, if_exists = 'replace', index=False)

#exporting Urls
csvFileName = 'urls.csv'
tablet = pd.read_csv(os.path.join(csvFileName))
tablet.to_sql(name=csvFileName[:-4], con=mydb, if_exists = 'replace', index=False)






"""
if_exists: {'fail', 'replace', 'append'}, default 'fail'
     fail: If table exists, do nothing.
     replace: If table exists, drop it, recreate it, and insert data.
     append: If table exists, insert data. Create if does not exist.
"""