import React , { Component } from 'react';
import './dashboard.css';
import MobileContent from './content/MobileContent';
import DesktopContent from './content/DesktopContent';
import TabletContent from './content/TabletContent';
import Sidebar from './structure/sidebar';
import Nav from './structure/nav';
import {Row} from 'reactstrap'
import logo from '../logo.svg';

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
      <div className="wrapper">
      <Nav /> 
      <div className="container-fluid">
      <Row>
        <Sidebar />
        <MobileContent />
        <TabletContent />
        <DesktopContent />
      </Row>
    </div>
  </div> 
    );
  }
}

export default dashboard;


