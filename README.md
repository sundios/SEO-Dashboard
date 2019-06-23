# SEO ETL + React Dashboard

> This is an ETL project that is focused on having a complete SEO dashboard for reportin purposes. This is the first version of the project and only inlcudes data from Google. Im working on including more metrics like Backlink profiles, Dayly rankings for specific keywords, Search volumes and more.

## Task and Goal
The task for this project is to create an ETL pipeline using Google search organic traffic and load the data in a user friendly dashboard. ETL process performs data cleaning during extraction process and load significant data into data ware- house. Our main goal for this project is by having this pipeline we will be able to have the data in one place and make it easier for a businesses stakeholders to access this data, analyze it and discover different business insights.

## Data Background
We will be working with Monthly Google search organic traffic from the domain https://www.tuves.cl. This data will be acquire by using the Google search API. We will use 9 different data sets of search traffic and they are the following:

• Mobile, Desktop and Tablet - Day to day Organic data: These are multiples CSV files that are organized by date and includes Keywords, Clicks, Impressions, CTR, Ranking, Device and Date.
• Mobile, Desktop and Tablet - Monthly Top 10 Keywords: One data set that includes Keyword, Clicks, Impressions, Avg CTR and Avg Ranking for the specific device and time frame.
• Mobile, Desktop and Tablet - Monthly Top 10 URLs: One data set that includes URL, Clicks, Impressions, Avg CTR and Avg Ranking for the specific device and time frame.

## Approach and Methods used
This project is composed by 5 steps.
1. Extraction: Extract the Google search data using the Google search API. Our data will be saved in CSV files.
2. Transform: Transform the day to day data into 3 monthly data sets. A mobile data set, a desktop and a tablet. The Keywords and URLs are ready to go.
3. Load: Load the data to the data warehouse. We will be using a MySQL database.
4. Load Build a REST API that will parse all of our MySQL tables into JSON.
5. Analyze Create a dashboard where we will load our data and analyze it using tables and visualizations.



![alt text](http://www.kburchardt.com/images/dash1.png)

![alt text](http://www.kburchardt.com/images/dash2.png)

![alt text](http://www.kburchardt.com/images/dash3.png)


