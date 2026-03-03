import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMobile, faDesktop ,faTablet ,faGlobe } from '@fortawesome/free-solid-svg-icons'
import { Link } from "react-router-dom";




class Sidebar extends Component {
  


  render() {
    return (
       <nav className="col-md-2 d-none d-md-block bg-light sidebar">
         
         <div className="sidebar-sticky">
            <ul className="nav flex-column">
            <li className="nav-item">
                <Link className="nav-link" to="/">
                  <span data-feather="home"></span>
                  <FontAwesomeIcon icon={faGlobe} /> Home (All Data) <span className="sr-only">(current)</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/mobile">
                  <span data-feather="home"></span>
                  <FontAwesomeIcon icon={faMobile} /> Mobile <span className="sr-only">(current)</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/desktop">
                  <span data-feather="file"></span>
                 <FontAwesomeIcon icon={faDesktop} /> Desktop
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/tablet">
                  <span data-feather="shopping-cart"></span>
                  <FontAwesomeIcon icon={faTablet} /> Tablet
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/ranks">
                  <span data-feather="layers"></span>
                  <FontAwesomeIcon icon={faDesktop} /> Rankings
                </Link>
              </li>
            </ul>
          </div>
        </nav>
    );
  }
}

export default Sidebar;

