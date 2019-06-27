import React, { Component } from 'react';
import './App.css';
import Dashboard from './dashboard/dashboard'
import { Container, Row, Col } from 'reactstrap';
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