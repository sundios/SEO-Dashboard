import React , { Component } from 'react';
import './dashboard.css';
import AllContent from './content/AllContent'
import MobileContent from './content/MobileContent';
import DesktopContent from './content/DesktopContent';
import TabletContent from './content/TabletContent';
import Sidebar from './structure/sidebar';
import Nav from './structure/nav';
import {Row} from 'reactstrap'
import logo from '../logo.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMobile, faDesktop ,faTablet ,faGlobe } from '@fortawesome/free-solid-svg-icons'
import { BrowserRouter as Router, Route, Link } from "react-router-dom";



//Dashboard where we can include the component we want to show.
// For example: <MobileContent/> will display mobile data.

 class dashboard extends Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      isOpen: false
    };
  }
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  render() {
    return (
      <Router>
      <div className="wrapper">
      <Nav /> 
      <div className="container-fluid">
      <Row>
        <Sidebar />
        <Route exact path="/" component={Home} />
        <Route path="/mobile" component={Mobile} />
        <Route path="/desktop" component={Desktop} />
        <Route path="/tablet" component={Tablet} />
        <Route path="/ranks" component={Rank} />
      </Row>
    </div>
  </div> 

  
   
    

  </Router>
    );
  }
}


function Home() {
  return(<AllContent /> 
    );  
}

function Mobile() {
  return(<MobileContent />
    );
}

function Desktop() {
  return(<DesktopContent />
    );  
}


function Tablet() {
  return(<TabletContent />
    );
}  

function Rank() {
  return(<h1> Rankings goes here... still need to figure out how to create them here </h1>
    );
}
  

export default dashboard;


