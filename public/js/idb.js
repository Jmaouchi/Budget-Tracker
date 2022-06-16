// create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'budget' and set it to version 1.
// 1- The name of the IndexedDB database you'd like to create (if it doesn't exist) or connect to (if it does exist). We'll use the name budget.
// 2- The version of the database. By default, we start it at 1. This parameter is used to determine whether the database's structure has changed between connections.
// Think of it as if you were changing the columns of a SQL database.
const request = indexedDB.open('budget', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
// We can't create an object store until the connection to the database is open, emitting an event that the request variable will be able to capture
request.onupgradeneeded = function(event) {
  const db = event.target.result;
    // create an object store (table) called 'new_budget', set it to have an auto incrementing primary key of sorts 
  db.createObjectStore('new_budget', { autoIncrement: true });
};

request.onsuccess = function(event) {
  // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run checkDatabase() function to send all local db data to api
  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function(event) {
  // log error here
  console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new budget and there's no internet connection
// this will be added on the cache method while posting the data to db
function saveRecord(record) {
  const transaction = db.transaction(['new_budget'], 'readwrite');

  const budgetObjectStore = transaction.objectStore('new_budget');

  // add record to your store with add method.
  budgetObjectStore.add(record);
}

// upload the budget data after the user reconnects 
function uploadBudget() {
  // open a transaction on your pending db
  const transaction = db.transaction(['new_budget'], 'readwrite');

  // access your pending object store
  const budgetObjectStore = transaction.objectStore('new_budget');

  // get all records from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(['new_budget'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('new_budget');
          // clear all items in your store
          budgetObjectStore.clear();

          alert('All saved budgets has been submitted!');
        })
        .catch(err => {
          // set reference to redirect back here
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', uploadBudget);
