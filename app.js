const express = require("express");
const search = require("./search");
const allContent = require("./contents");
const app = express();

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/:search', (req, res) => {
  var key = '', result = [];
  try {
    key = decodeURIComponent(req.params.search)
    result = search(key);
  } catch(e) {
    console.log("error:",e)
  }
  res.status(200).send({
    data: result
  })
});


const PORT = 5555;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});