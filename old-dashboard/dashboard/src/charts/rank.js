import React, { Component } from 'react';
import Chart from '../components/Chartbar';
import axios from 'axios'
import { Container, Row, Col } from 'reactstrap';

// This file is only for example. 
//Is not being used. 
//Click the specific folder to see the file  that the graph is using.



class App extends Component {
  constructor(){
    super();
    this.state = {
      chartData:{}
    }
  }

  componentDidMount(){
    this.getChartData();
  }

  getChartData(){
    axios.get("http://localhost:3003/mobile").then(api =>{
      const data = api.data;

      var date =[];
      var rank = []
     
     

      //getting the data to empty arrays
      for (var i in data)
      {
      date.push(data[i].Date)
      rank.push(data[i].Position)


      }

      
      
       //Check if my api is working
      // console.log(data)
      // console.log(rank)

      this.setState({
          chartData:{
            labels: date,
            datasets:[
              {
                label:'Ranks',
                 fill: true,
          borderColor: "#1f8ef1",
          borderWidth: 2,
          borderDash: [],
          borderDashOffset: 0.0,
          pointBackgroundColor: "#1f8ef1",
          pointBorderColor: "rgba(255,255,255,0)",
          pointHoverBackgroundColor: "#1f8ef1",
          pointBorderWidth: 20,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 15,
          pointRadius: 4,
                data:rank,
                backgroundColor:[
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
                  'rgba(90,100,248,0.2)',
               ]
              },
            ]
          }
      });
    });  
  }

  render() {
    return (
    
      
          <Col>
              {Object.keys(this.state.chartData).length &&
               <Chart chartData={this.state.chartData} location="Rank" legendPosition="bottom"/>
             }

             </Col>
    );
  }
}

export default App;