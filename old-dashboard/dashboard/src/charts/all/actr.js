import React, { Component }from 'react';
import Highcharts from 'highcharts/highstock';
import {
  HighchartsStockChart, Chart, withHighcharts, XAxis, YAxis, Title, Legend,
  AreaSplineSeries, SplineSeries, Navigator, RangeSelector, Tooltip
} from 'react-jsx-highstock';


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
	      	var ctr =[];
	      	var clicks =[];
	      	
	      	for ( var i in data)
	      	{
	      		date.push(data[i].Date)
	      		 ctr.push(data[i].CTR)
	      		 clicks.push(data[i].Clicks)
	      		
	      	}



	      	//Transforming date into timestamp
	      	const days =[]

	      	 for (var d in date){
	      		days.push(Math.round(new Date(date[d]).getTime()));
	      	
	       }


	       //concatenating CTR + timestamp date into one array 
	      	const cd1 = days.map((ent, i) => [ent, ctr[i]]);
	      	const cd2 = days.map((ent, i) => [ent, clicks[i]]);
	      	
	      	console.log(cd1)



	      	// setting the state to pass in the render part
	      	 this.setState({
	      	 	hctr:cd1,
	      	 	clicks:cd2
	      	 })
	    });
	}

	render() {
		//defining the data variables
		const {hctr} = this.state;
		const {clicks} = this.state;
		
		
		
		return(
			<div>
				
				<HighchartsStockChart>
					<Chart zoomtype="xy" />
					<Title> CTR vs Clicks </Title>

					<Legend>
						<Legend.Title> Legend </Legend.Title>
					</Legend>
					<Tooltip />

					<XAxis>
           				 <XAxis.Title >Date</XAxis.Title>
          			</XAxis>

          			<YAxis >
			            <YAxis.Title>CTR vs Clicks</YAxis.Title>

			          
			            <AreaSplineSeries id="CTR" name="CTR" data={hctr} />
			            
          			</YAxis>

          			<YAxis opposite>
    					<YAxis.Title>Clicks </YAxis.Title>
    								            <AreaSplineSeries  id="Clicks" name="Clicks" data={clicks}  />
  					</YAxis>
          			
	


          			<RangeSelector selected={7}>
					    <RangeSelector.Button count={1} type="day">1d</RangeSelector.Button>
					    <RangeSelector.Button count={7} type="day">7d</RangeSelector.Button>
					    <RangeSelector.Button count={1} type="month">1m</RangeSelector.Button>
					    <RangeSelector.Button type="all">All</RangeSelector.Button>
					    <RangeSelector.Input boxBorderColor="#7cb5ec" />
					 </RangeSelector>

					  <Navigator >
        				<Navigator.Series seriesId="ctr" />
      
      				</Navigator>

					 

			

				</HighchartsStockChart>
		
			</div>
			);
	}
}


export default withHighcharts(ch2, Highcharts);