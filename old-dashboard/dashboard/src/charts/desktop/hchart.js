import React, { Component }from 'react';
import Highcharts from 'highcharts/highstock';
import {
  HighchartsStockChart, Chart, withHighcharts, XAxis, YAxis, Title, Legend,
  AreaSplineSeries, SplineSeries, Navigator, RangeSelector, Tooltip, FlagsSeries, PlotBand
} from 'react-jsx-highstock';
import './charts.css'

import axios from 'axios'


class ch2 extends Component {
	constructor(){
	    super();
	    this.state = {
	    	
	     
	    }
	}



  componentDidMount(){
    this.getChartData();
  }

  getChartData(){
	    axios.get("http://localhost:3003/desktop").then(api =>{

	  	 	const data = api.data;
	      // console.log(data)

		    var date =[];
	      	var clicks = []
	      	var impressions =[]
	      	
	      	for ( var i in data)
	      	{
	      		date.push(data[i].Date)
	      		clicks.push(data[i].Clicks)
	      		impressions.push(data[i].Impressions)
	      	}

	      	//Transforming date into timestamp
	      	const days =[]

	      	 for (var d in date){
	      		days.push(Math.round(new Date(date[d]).getTime()));
	      	
	       }

	       //concatenating clicks + timestamp date into one array 
	       //concatenating impressions + timestamp into one array
	      	const cd = days.map((ent, i) => [ent, clicks[i]]);
	      	const id = days.map((ent, i) => [ent, impressions[i]]);
	      	// console.log(cd)

	      	//dummy data for back links ideally we need API call from majestic
	      	const backlinks = [4,3	,
6	,
2	,
12	,
0	,
11	,
0	,
21	,
1	,
3	,
33	,
0	,
13	,
1	,
12	,
44	,
2	,
2	,
17	,
0	,
0	,
200	,
0	,
11	,
46	,
10	,
1	,
0	,
2	,
111	,
]

//concatenating backlins + timestamp

const cd1 = days.map((ent, i) => [ent, backlinks[i]]);



	      	// setting the state to pass in the render part
	      	 this.setState({

	      	 	impressions:id,
	      	 	clicks: cd,
	      	 	bl :cd1
	      	 })
	    });
	}

	render() {
		//defining the data variables
		const {impressions} = this.state;
		const {clicks} = this.state;
		const {bl} = this.state;
		
		
		return(
			<div>
				
				<HighchartsStockChart>
					<Chart zoomtype="x" />
					<Title> www.Tuves.cl Desktop Traffic </Title>

					<Legend>
						<Legend.Title> Legend </Legend.Title>
					</Legend>
					<Tooltip />

					<XAxis>
           				 <XAxis.Title >Date</XAxis.Title>
          			</XAxis>

          			<YAxis >
			            <YAxis.Title>Clicks & Impressions</YAxis.Title>
			            
			            <AreaSplineSeries  id="Clicks" name="Clicks" data={clicks}  />
			            <AreaSplineSeries id="Impressions" name="Impressions" data={impressions} />
			            
          			</YAxis>

          			<YAxis opposite>
    					<YAxis.Title>BackLinks </YAxis.Title>
    					<AreaSplineSeries id="Backlinks" name="Backlinks" data={bl} />
  					</YAxis>
	


          			<RangeSelector selected={7}>
					    <RangeSelector.Button count={0} type="day">1d</RangeSelector.Button>
					    <RangeSelector.Button count={7} type="day">7d</RangeSelector.Button>
					    <RangeSelector.Button count={1} type="month">1m</RangeSelector.Button>
					    <RangeSelector.Button type="all">All</RangeSelector.Button>
					    <RangeSelector.Input boxBorderColor="#7cb5ec" />
					 </RangeSelector>

					 <Navigator >
        				<Navigator.Series seriesId="Clicks" />
        				<Navigator.Series seriesId="Impressions" />
        				<Navigator.Series seriesId="Backlinks" />

      				</Navigator>

			

				</HighchartsStockChart>
		
			</div>
			);
	}
}


export default withHighcharts(ch2, Highcharts);