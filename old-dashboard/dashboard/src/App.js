import React, { Component } from 'react';
import './App.css';
import Dashboard from './dashboard/dashboard'
import { Container, Row, Col } from 'reactstrap';
import {Helmet} from "react-helmet";
import Title from './components/titles'
 


class App extends Component {
  

  render() {
    return (
    	<div>
      <Title title="TuvesHD SEO Dashboard" description=" Dashboard for https://www.tuves.com" />


    		<Dashboard />
    
        </div>
    );
  }
}

export default App;