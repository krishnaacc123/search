const express = require("express");
const search = require("./search");
const app = express();

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/:search', (req, res) => {
  var result = search(req.params.search);
  res.status(200).send({
    data: result
  })
});


const PORT = 5555;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});