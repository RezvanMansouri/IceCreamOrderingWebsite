var express = require('express');
var path = require('path');

var bodyParser  = require('body-parser');
const {check, validationResult} = require('express-validator');

var mongoose =require('mongoose');
mongoose.connect('mongodb://localhost:27017/mywebsite',
{useNewUrlParser: true, useUnifiedTopology: true },
 () => console.log("connected to mongo")
 );
const receipt = mongoose.model('receipt', {
    fname : String,
    email : String,
    phone : String,
    address: String,
    city: String,
    postcode: String,
    province: String,
    delivarytime : String,
    subtotal : Number,
    subtotalTax : Number,
    taxRate : Number,
    total : Number
   
});

var myApp = express();

// parse application/x-www-form-urlencoded
myApp.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
myApp.use(bodyParser.json())


myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname+'/public'));
myApp.set('view engine', 'ejs');



myApp.get('/',function(req, res){
    res.render('shopform',{fname: '',email: '', phone: '',address: '',city: '',postcode: ''});
});


myApp.post('/',[
    check('fname', 'Must have a name').not().isEmpty(),
    check('email', 'Must have email in a correct format').isEmail(),
    check('phone', 'phone number must be in the correct format').matches(/^([\d]{10})?$/),
    check('address', 'Must have an Address').not().isEmpty(),
    check('city', 'Must have a city').not().isEmpty(),
    check('postcode', 'Must have a Postal Code in the correct format').matches(/^([A-Z][\d][A-Z]\s[\d][A-Z][\d])?$/),
    check('vanilla', 'Ice Cream quantity must a number').isNumeric(),
    check('choclate', 'Ice Cream quantity must a number').isNumeric(),
    check('coffee', 'Ice Cream quantity must a number').matches(/^\d*$/),   
],   
function(req, res){
    const errors = validationResult(req); 
    var fname = req.body.fname;
    var email = req.body.email;
    var phone = req.body.phone;
    var address = req.body.address;
    var city = req.body.city;
    var postcode = req.body.postcode;
    var province = req.body.province;               
    var delivarytime = req.body.delivarytime;
    var vanilla = parseInt(req.body.vanilla) || 0;
    var choclate = parseInt(req.body.choclate) || 0;
    var coffee = parseInt(req.body.coffee) || 0;
    var quantityerror;
    var icecreamFlag = false;
    
        if(vanilla == 0 && choclate == 0 && coffee == 0)
        {
            icecreamFlag =true;
            quantityerror ="Choose the quantity for the icecream\n";
        }
        else if((vanilla * 10 + choclate * 20 + coffee * 30) < 30 )
        {
            icecreamFlag =true;
            quantityerror ="Minimum of $30.00 must be purchased";
        }
    
    if (!errors.isEmpty() || icecreamFlag){
        res.render('shopform', {
            quantityerror : quantityerror,
            errors:errors.array(),
            fname: fname,
            email: email,
            phone: phone,
            address: address,
            city: city,
            postcode: postcode,
            province: province,          
        })
    }
    else {  
        var index; 
        var provinceTaxArr = new Array("Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
        "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon");
        var taxRateArr = new Array(0.05, 0.12, 0.12, 0.15, 0.15, 0.05, 0.15, 0.05, 0.13, 0.15, 0.15, 0.11, 0.5);
        for (let i = 0; i < provinceTaxArr.length; i++){
            if (province == provinceTaxArr[i])
            index = i;}

        var delivaryRate = 0;     
        if(delivarytime == "4 DAYS")
                    delivaryRate = 10;
                    if(delivarytime == "3 DAYS")
                    delivaryRate = 20;
                    if(delivarytime == "2 DAYS")
                    delivaryRate = 30;
                    if(delivarytime == "1 DAY")
                    delivaryRate = 40; 
        
        var vanillaCount = vanilla * 10;
        var choclateCount =  choclate * 20;
        var coffeeCount = coffee * 30;
        var shippingCharge = 20;
        var subtotal= vanillaCount + choclateCount + coffeeCount + shippingCharge; 
        var taxRate = taxRateArr[index];
        var subtotalTax = subtotal * taxRateArr[index];
        var total = delivaryRate + subtotalTax + subtotal;
       
        var myNewreceipt = new receipt (
            { fname: fname, email: email, phone: phone,
                address: address, city: city, postcode: postcode,
                province: province, 
                delivarytime : delivarytime,subtotal : subtotal,
                subtotalTax : subtotalTax,
                taxRate : taxRate,
                total : total});
                myNewreceipt.save().then( () =>
                {
                    console.log('new contact saved')
                   
                } );

        res.render('receipt', {
            fname: fname,
            email: email,
            phone: phone,
            address: address,
            city: city,
            postcode: postcode,
            province : province,
            vanilla : vanilla,
            choclate : choclate ,
            coffee : coffee ,
            delivarytime : delivarytime,
            vanillaCount : vanillaCount, 
            choclateCount : choclateCount,
            coffeeCount : coffeeCount,
            shippingCharge : shippingCharge,
            delivaryRate : delivaryRate,
            subtotal : subtotal,
            subtotalTax : subtotalTax,
            taxRate : taxRate,
            total : total
        });
    }
});
myApp.get('/allreceipts', (req,res) => {
    receipt.find({}, (err,docs) => {
        res.render('allreceipts', {allreceipts : docs})
    });
});


myApp.listen(8080);
console.log('Server started at 8080 for mywebsite...');