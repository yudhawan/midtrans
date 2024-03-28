const express = require('express')
const app = express()
const cors = require('cors')
const { v4: uuidv4 } = require('uuid');
var bodyParser = require('body-parser')
require('dotenv').config()
const port = 5000
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin:'*'
}))

app.get('/',(req,res)=> res.send('hello') )
app.post('/checkoutCustom',async(req,res)=>{
    const data = req.body.data
    const type = req.body.type
    const items = req.body.items
    const total = req.body.total
    const detailUser = req.body.user
    const timeExpired = req.body.expired
    const idOrder = detailUser.first_name+'-'+uuidv4()

    const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Basic ${btoa(`${type==='xendit'?process.env.XENDIT_API_KEY:process.env.MIDTRANS_SERVER_KEY}:`)}`
    }

    const url = type==='xendit'?'https://api.xendit.co/ewallets/charges':'https://api.sandbox.midtrans.com/v2/charge'
    
    let parameter = type==='xendit'?{
        ...data,
        "reference_id": idOrder,
        "currency": "IDR",
        "checkout_method": "ONE_TIME_PAYMENT",
        "channel_properties": {
            "mobile_number":"+62851618101223",
            "success_redirect_url": "https://redirect.me/payment"
            },
        "metadata": {
            "branch_area": "PLUIT",
            "branch_city": "JAKARTA"
            }
    }:{
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
        const snapData = await fetch(url,{
            method:'POST',
            headers:headers,
            body:JSON.stringify(parameter)
        })
        const result = await snapData.json()
        if(typeof result==='object' && result.status_code==='200' || result.status_code==='201' || result.id) return res.json(result)
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
})

app.listen(port,()=>{
    console.log('listen on ',port)
})