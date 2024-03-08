const express = require('express')
const app = express()
const cors = require('cors')
var bodyParser = require('body-parser')
require('dotenv').config()
const port = 5000
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin:'*'
}))
app.post('/checkoutCustom',async(req,res)=>{
    const data = req.body.data
    const items = req.body.items
    const total = req.body.total
    const detailUser = req.body.user
    const timeExpired = req.body.expired
    const idOrder = detailUser.first_name+'-'+Math.floor(Math.random()*100)+1
    const midtransClient = require('midtrans-client')
    let snap = new midtransClient.Snap({
        isProduction : false,
        serverKey : process.env.MIDTRANS_SERVER_KEY,
        clientKeyKey : process.env.MIDTRANS_CLIENT_KEY,
    })
    console.log(process.env.MIDTRANS_SERVER_KEY)
    let parameter = {
        ...data,
        "transaction_details": {
            "order_id": idOrder,
            "gross_amount": parseInt(total)
        },
        "item_details": items,
        "customer_details": detailUser,
        "custom_expiry": {
            "order_time": timeExpired.order_time,
            "expiry_duration": timeExpired.duration,
            "unit": timeExpired.unit
          }
        
    }
    try {
        const snapData = await fetch('https://api.sandbox.midtrans.com/v2/charge',{
            method:'POST',
            headers:{
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Basic ${btoa(`${process.env.MIDTRANS_SERVER_KEY}:`)}`
            },
            body:JSON.stringify(parameter)
        })
        const result = await snapData.json()
        console.log(result)
        if(typeof result==='object' && result.status_code==='200' || result.status_code==='201') return res.json(result)
        return res.send('error').status(500)
        
    } catch (error) {
        return res.json({error:error}).status(500)
    }
})
app.get('/checkStat',(req,res)=>{
    const order_id = req?.query?.orderId
    fetch(`https://api.sandbox.midtrans.com/v2/${order_id}/status`,{
        method:'GET',
        headers:{
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Basic ${btoa(`${process.env.MIDTRANS_SERVER_KEY}:`)}`
        }
    }).then(data=> data.json()).then(result=>{
        if(typeof result==='object') return res.json(result)
        return res.send('Error').status(500)
    })
})
app.get('/changeStat',(req,res)=>{
    const order_id = req?.query?.orderId
    const status = req?.query?.status
    console.log(order_id,status)
    fetch(`https://api.sandbox.midtrans.com/v2/${order_id}/${status}`,{
        method:'POST',
        headers:{
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Basic ${btoa(`${process.env.MIDTRANS_SERVER_KEY}:`)}`
        }
    }).then(data=> data.json()).then(result=>{
        if(typeof result==='object') return res.json(result)
        return res.send('Error').status(500)
    })
})

app.post('/checkout', async function (req, res) {
    const items = req.body.items
    const total = req.body.total
    const detailUser = req.body.user
    const timeExpired = req.body.expired
    const idOrder = detailUser.first_name+'-'+Math.floor(Math.random()*100)+1
    const midtransClient = require('midtrans-client')
    // Create Snap API instance
    let snap = new midtransClient.Snap({
            // Set to true if you want Production Environment (accept real transaction).
            isProduction : false,
            serverKey : process.env.MIDTRANS_SERVER_KEY,
            clientKeyKey : process.env.MIDTRANS_CLIENT_KEY,
        })
    let parameter = {
        "transaction_details": {
            "order_id": idOrder,
            "gross_amount": total
        },
        "credit_card":{
            "secure" : true
        },
        "item_details": items,
        "customer_details": detailUser,
        "page_expiry": {
            "duration": timeExpired.duration,
            "unit": timeExpired.unit
        },
        "custom_expiry": {
            "order_time": timeExpired.order_time,
            "expiry_duration": timeExpired.duration,
            "unit": timeExpired.unit
          }
    };
    const snapData = await snap.createTransaction(parameter)
    if(snapData.token) return res.json({...snapData, orderId:idOrder})
    return res.send('Error').status(500)
    // console.log(snapData)
        // .then((transaction)=>{
        //     // transaction token
        //     let transactionToken = transaction.token;
        //     console.log('transactionToken:',transactionToken);
        // })
})

app.listen(port,()=>{
    console.log('listen on ',port)
})