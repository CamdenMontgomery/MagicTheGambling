const express = require('express')
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()



//Respond To Get Request At Base URL '/'
app.get('/*',  async ( request, response ) => { //So Adding The Asterisk Does Indeed Make It Accept Any Text That Gets Passed Into The URL
  response.sendFile(path.join(__dirname,  'public', 'index.html'))
})

export default app