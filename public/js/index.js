let transactions = [];
let myChart; // this to use the chart  // https://www.chartjs.org/docs/3.0.2/getting-started/usage.html

fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    // save db data on global variable
    transactions = data;;
    populateTotal();
    populateTable();
    populateChart();
  });

function populateTotal() {
  // reduce transaction amounts to a single total value 
  // so here the reduce methode will go to the array and get us a total value of the whole array like this: [1,2,3] will give us a total of 6 
  let total = transactions.reduce((total, t) => { // the t is coming from the data array 
    return total + parseInt(t.value);
  }, 0); // we set 0 here and that is the value of our accumulator or total 

  let totalEl = document.querySelector("#total");
  // get the total and add it to the text content
  totalEl.textContent = total;
}

// this function is to create the table that will show the added amount and the person who added it
function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  // this will loop through the transactions data and create a table that will display all the transactions 
  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    // append the tr to the tbody to create the table with the existing transactions 
    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  // this is a node package to create a chart 
  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'bar',
      data: {
        labels, // include a date to the chart 
        datasets: [{
            label: "Total Over Time",
            fill: true,
            backgroundColor: "#6666ff", // color of the label
            data
        }]
    }
  });
}



function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form 
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    // if the input values are available, then just leave the p tag empty
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString() // method returns a string in simplified extended ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1; // here we have *= and that means that we need to 
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();
  
  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
  .then(response => {    
    return response.json();
  })
  .then(data => {
    if (data.errors) {
      errorEl.textContent = "Missing Information";
    }
    else {
      // clear form
      nameEl.value = "";
      amountEl.value = "";
    }
  })
  .catch(err => {
    // fetch failed, so save in indexed db
    saveRecord(transaction);

    // clear form
    nameEl.value = "";
    amountEl.value = "";
  });
}

document.querySelector("#add-btn").onclick = function() {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function() {
  sendTransaction(false);
};
