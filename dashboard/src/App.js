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


class App extends Component {
  

  render() {
    return (
        
        <Dashboard />
        
    );
  }
}

export default App;