import React, { Component } from 'react';
import './App.css';
import Chart from './components/Chart';
import axios from 'axios'
import Dashboard from './dashboard/dashboard'
import { Container, Row, Col } from 'reactstrap';
import MainChart from './charts/chartjs'
import Ctr from './charts/ctr'
import Rank from './charts/rank'
import Top from './topkpi/top'
import Tables from './tables/table1'
import {Helmet} from "react-helmet";

class App extends Component {
  

  render() {
    return (
    	<div>
       <Helmet>
                <meta charSet="utf-8" />
                <title>Tuves HD React APP</title>
                <link rel="canonical" href="http://mysite.com/example" />
                <meta name="description" content="Here is a precise description of my awesome webpage." />
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
        
    		<Dashboard />
        </div>
    );
  }
}

export default App;