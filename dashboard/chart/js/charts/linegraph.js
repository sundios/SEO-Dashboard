$(document).ready(function(){
  $.ajax({
    url : 'http://localhost:3003/mobile',
    type : "GET",
    success : function(data){
      console.log(data);

      var date = [];
      var clicks = [];
      var impressions = [];
      var ctr = [];

      for(var i in data) {
        date.push( data[i].Date);
        clicks.push(data[i].Clicks);
        impressions.push(data[i].Impressions);
        ctr.push(data[i].CTR);
      }

      var chartdata = {
        labels: date,
        datasets: [
          {
            label: "Clicks",
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(59, 89, 152, 0.75)",
            borderColor: "rgba(59, 89, 152, 1)",
            pointHoverBackgroundColor: "rgba(59, 89, 152, 1)",
            pointHoverBorderColor: "rgba(59, 89, 152, 1)",
            data: clicks
          },
          {
            label: "Impressions",
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(29, 202, 255, 0.75)",
            borderColor: "rgba(29, 202, 255, 1)",
            pointHoverBackgroundColor: "rgba(29, 202, 255, 1)",
            pointHoverBorderColor: "rgba(29, 202, 255, 1)",
            data: impressions
          },
        ]
      };

      var ctx = $("#mycanvas");

      var LineGraph = new Chart(ctx, {
        type: 'line',
        data: chartdata
      });
    },
    error : function(data) {

    }
  });
});