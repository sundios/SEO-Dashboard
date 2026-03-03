#python script to clean day to day 

# libraries
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import glob

#files top open
files = sorted(glob.glob('_2019*.csv'))


#Use this to test the script part by part
#df = pd.read_csv('_20190102.csv',index_col=False)

#variables where I will store the data
mobile_dataset = []
desktop_dataset= []
tablet_dataset = []
for f in files:
    print(f)
    #open and read the file
    df = pd.read_csv(f,index_col=False)
    
    #Slicing and selecting the columns
    df_clean = df[['Clicks','Impressions','CTR','Position','Date','Device']]

    #Filtering by Mobile, Desktop and table
    m = df_clean.loc[df_clean['Device'] == 'mobile']
    t = df_clean.loc[df_clean['Device'] == 'tablet']
    d = df_clean.loc[df_clean['Device'] == 'desktop']
    
    #Reseting index so everything starts from index 0
    m.reset_index(drop=True, inplace=True)
    t.reset_index(drop=True, inplace=True)
    d.reset_index(drop=True, inplace=True)
    
    #Mobile
    #Selecting dates and device, only 1 row to
    m_date_device= pd.DataFrame(m, columns = ['Date','Device'], index=[0])
    
    #Selecting all rows of Clicks and impressions and adding them
    mobile_sum = m[['Clicks','Impressions']]
    m_sum = mobile_sum.agg(['sum'])
    
    #Selecting all rows of CTR and Position and getting mean
    mobile_mean = m[['CTR','Position']]
    m_mean = mobile_mean.agg(['mean'])
    
    #Getting everything into 1 row
    m_sum.reset_index(drop=True, inplace=True)
    m_mean.reset_index(drop=True, inplace=True)
    
    #creating a list with all the variables
    frames = [m_sum,m_mean,m_date_device]
    #concatenating everything 
    mobile = pd.concat(frames, axis=1, sort=False)
    #appending mobile to the variable we created outside the for loop 
    mobile_dataset.append(mobile)
    
    #Desktop
    #Selecting dates and device, only 1 row
    d_date_device= pd.DataFrame(d, columns = ['Date','Device'], index=[0])
    #adding Clicks and impressions on mobile
    desktop_sum = d[['Clicks','Impressions']]
    d_sum = desktop_sum.agg(['sum'])
    
    #getting mean of CTR and position
    desktop_mean = d[['CTR','Position']]
    d_mean = desktop_mean.agg(['mean'])
    
    #Getting 1 row
    d_sum.reset_index(drop=True, inplace=True)
    d_mean.reset_index(drop=True, inplace=True)
    
    frames = [d_sum,d_mean,d_date_device]
    desktop = pd.concat(frames, axis=1, sort=False)
    desktop_dataset.append(desktop)
    
    #tablet
    t_date_device= pd.DataFrame(t, columns = ['Date','Device'], index=[0])
    #adding Clicks and impressions on mobile
    tablet_sum = t[['Clicks','Impressions']]
    t_sum = tablet_sum.agg(['sum'])
    
    #getting mean of CTR and position
    tablet_mean = t[['CTR','Position']]
    t_mean = tablet_mean.agg(['mean'])
    
    #Getting 1 row
    t_sum.reset_index(drop=True, inplace=True)
    t_mean.reset_index(drop=True, inplace=True)
    
    frames = [t_sum,t_mean,t_date_device]
    tablet = pd.concat(frames, axis=1, sort=False)
    tablet_dataset.append(tablet)

#creating the Dataframe
mobile = pd.concat(mobile_dataset)
desktop = pd.concat(desktop_dataset)
tablet = pd.concat(tablet_dataset)

#reseting index so it counts and we have an id for mysql
mobile.reset_index(drop=True, inplace=True) 
desktop.reset_index(drop=True, inplace=True) 
tablet.reset_index(drop=True, inplace=True) 

#exporting to CSV

mobile.to_csv(r'mobile.csv', index_label= 'id')
desktop.to_csv(r'desktop.csv',index_label= 'id')
tablet.to_csv(r'tablet.csv', index_label= 'id')



#plotting

mobile.plot(x='Date' )
mobile.plot(x='Date',y='Clicks' )
mobile.plot(x='Date',y='Impressions' )
mobile.plot(x='Date',y='CTR' )
mobile.plot(x='Date',y='Position')



# multiple line plot
plt.plot( 'Date', 'Clicks', data=mobile, color='blue', linewidth=4)
plt.plot( 'Date', 'Impressions', data=mobile, marker='', color='orange', linewidth=4)
plt.legend()



    

    
    
    

    
