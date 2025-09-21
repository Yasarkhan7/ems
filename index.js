const express = require('express')
const app = express()
const cors = require('cors')
app.use(cors())
app.use(express.json())

app.get('/',(req,res)=>{
    res.status(200).send({message:'hello'})
})

app.listen(process.env.PORT ||8080,()=>{
console.log('listening...')
})