import React, { Component }from 'react';
import Highcharts from 'highcharts/highstock';
import {
  HighchartsStockChart, Chart, withHighcharts, XAxis, YAxis, Title, Legend,
  AreaSplineSeries, SplineSeries, Navigator, RangeSelector, Tooltip
} from 'react-jsx-highstock';

import Highcharts2 from 'highcharts';
import {
  HighchartsChart,  LineSeries
} from 'react-jsx-highcharts';


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
	    axios.get("http://localhost:3003/all").then(api =>{

	  	 	const data = api.data;
	      // console.log(data)

		    var date =[];
	      	var rank =[];
	      	
	      	for ( var i in data)
	      	{
	      		date.push(data[i].Date)
	      		 rank.push(data[i].Position)
	      		
	      	}



	      	//Transforming date into timestamp
	      	const days =[]

	      	 for (var d in date){
	      		days.push(Math.round(new Date(date[d]).getTime()));
	      	
	       }


	       //concatenating rank + timestamp date into one array 
	      	const cd1 = days.map((ent, i) => [ent, rank[i]]);
	      	
	      	console.log(cd1)



	      	// setting the state to pass in the render part
	      	 this.setState({
	      	 	rank:cd1
	      	 })
	    });
	}

	render() {
		//defining the data variables
		const {rank} = this.state;
		
		
		
		return(
			<div>
				
				<HighchartsStockChart>
					<Chart zoomtype="x" />
					<Title> Ranks </Title>

					<Legend>
						<Legend.Title> Legend </Legend.Title>
					</Legend>
					<Tooltip />

					<XAxis>
           				 <XAxis.Title >Date</XAxis.Title>
          			</XAxis>

          			<YAxis >
			            <YAxis.Title>Avg Ranks</YAxis.Title>
			            
			          
			            <AreaSplineSeries id="Rank" name="Avg Ranks" data={rank} />
			            
          			</YAxis>

          			
	


          			<RangeSelector selected={7}>
					    <RangeSelector.Button count={0} type="day">1d</RangeSelector.Button>
					    <RangeSelector.Button count={7} type="day">7d</RangeSelector.Button>
					    <RangeSelector.Button count={1} type="month">1m</RangeSelector.Button>
					    <RangeSelector.Button type="all">All</RangeSelector.Button>
					    <RangeSelector.Input boxBorderColor="#7cb5ec" />
					 </RangeSelector>

					 <Navigator >
        				<Navigator.Series seriesId="rank" />
      
      				</Navigator>

			

				</HighchartsStockChart>
		
			</div>
			);
	}
}


export default withHighcharts(ch2, Highcharts);