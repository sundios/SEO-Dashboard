import React, { Component } from 'react';




class Navigation extends Component {
  

  render() {
    return (
      <nav className="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0">
     	 <a className="navbar-brand col-sm-3 col-md-2 mr-0" href="#">
       <img className="logo" src="https://www.tuves.cl/wp-content/themes/tuves/images/web-chile_logo-tuves.png" alt="tuveslogo"/>
       </a>
      		<ul className="navbar-nav px-3">
        		<li className="nav-item text-nowrap">
         <a className="nav-link" href="#">Sign out</a>
        </li>
      </ul>
      </nav>
    );
  }
}

export default Navigation;