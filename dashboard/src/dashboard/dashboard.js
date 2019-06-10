import React , { Component } from 'react';
import './dashboard.css';
import Content from './Content';
import Sidebar from './sidebar';
import Nav from './nav';
import {Row} from 'reactstrap'
import logo from '../logo.svg';


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
        <Content/ >
      </Row>
    </div>
  </div> 
    );
  }
}

export default dashboard;


