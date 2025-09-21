const express = require('express')
const app = express()
const cors = require('cors')
app.use(cors())
app.use(express.json())

app.get('/',(req,res)=>{
    res.status(200).send({message:'hello eee'})
})

app.listen(3000,()=>{
console.log('listening...')
})