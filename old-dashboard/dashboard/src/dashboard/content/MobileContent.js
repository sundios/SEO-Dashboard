import React, { Component } from 'react';
import Top from '../../topkpi/mobile/top'
import Ctr from '../../charts/mobile/hctr'
import Rank from '../../charts/mobile/hrank'
import Tables1 from '../../tables/mobile/table1'
import Tables2 from '../../tables/mobile/table2'
import MainChart from '../../charts/mobile/hchart'
import {Row, Col} from 'reactstrap';
import {Helmet} from "react-helmet";





class Content extends Component {
  

  render() {
    return (
     <main role="main" className="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4" >
     <Helmet>
                <meta charSet="utf-8" />
                <title>SEO Mobile Dashboard </title>
                <link rel="canonical" href="" />
                <meta name="description" content="Mobile Dashboard for https://www.tuves.com" />
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
            <h1 className="h2">Mobile SEO Dashboard</h1>
            <div className="btn-toolbar mb-2 mb-md-0">
              <div className="btn-group mr-2">
                <button className="btn btn-sm btn-outline-secondary">Share</button>
                <button className="btn btn-sm btn-outline-secondary">Export</button>
              </div>
              <button className="btn btn-sm btn-outline-secondary dropdown-toggle">
                <span data-feather="calendar"></span>
                This week
              </button>
            </div>
          </div>
          <Top/>
          <MainChart/>
          <Row>
            <Col xl="6">
              <Rank/>
            </Col>
            <Col xl="6">
              <Ctr />
            </Col >
         </Row>

         <Row>
            <Col xl="12">
              <Tables1/>
            </Col>
            <Col xl="12">
              <Tables2/>
            </Col >
         </Row>

          
         </main> 
        
    );
  }
}

export default Content;


