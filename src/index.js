const express = require('express')
const app = express()
const port = process.env.PORT
const User = require('./models/users')
const Task = require('./models/task')
const userRouter = require('./router/user')
const taskRouter = require('./router/task')
require('./db/mongoose')

app.use(express.json())  // parse json automatuc into a object
app.use(userRouter)
app.use(taskRouter)

app.listen(port ,()=>{
    console.log('Server is up and running on port : '+ port);
})



