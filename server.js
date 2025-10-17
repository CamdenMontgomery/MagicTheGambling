const express = require('express')
const { readFile, createWriteStream } = require('fs')
const app = express()

const pureImage = require('pureimage')

//Need to 'serve' the static files (The JS, Images, & CSS)
app.use(express.static('./public'))


//Respond To Get Request At Base URL '/'
app.get('/*',  async ( request, response ) => { //So Adding The Asterisk Does Indeed Make It Accept Any Text That Gets Passed Into The URL
  response.sendFile('./src/pages/index.html', { root: __dirname })
})

// listen for requests
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});