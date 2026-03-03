import React, { Component } from 'react';
import axios from 'axios';
import {Table} from 'reactstrap'

class table extends Component {
    state = {
    data : []
  }

  componentDidMount() {
    axios.get("http://localhost:3003/Keywords-tablet")
      .then(response => {
        this.setState({
          todos: response.data
        });
      })
  }

  render() {
    const { todos = [] } = this.state;
    console.log(todos)
    return (
      <div className="App">
      <h3>Top 10 Driving Search Queries </h3>
      <header className="App-header">
          <Table>
            <thead>
              <tr>
                <th>Keywords</th>
                <th>Clicks</th>
                <th>Impressions</th>
                <th>CTR</th>
                <th>Ranking</th>
              </tr>
            </thead>
            <tbody>
            {todos.length ? 
              todos.map(todo => (
                <tr >
                  <td>{todo.Keyword}</td>
                  <td>{todo.Clicks}</td>
                  <td>{todo.Impressions}</td>
                  <td>{todo.CTR}</td>
                  <td>{todo.Position}</td>
                </tr>
              ))
              : 
              (<tr>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>)
            }
            </tbody>
          </Table>
        </header>
        
      </div>
    );
  }
}

export default table;