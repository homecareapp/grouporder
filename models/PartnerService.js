/**
 * Created by talat on 06/09/15.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var secrets = require('../config/secrets');
var http = require('http');
var https = require('https');
var urlParser = require("url");
// var Service = require('./Service'); 

var price = {
    /** [added B2B and B2C purchased price]*/
    // B2Bpurchase:{type:Number, default:0},
    // b2cpurchase:{type:Number, default:0},
    //end
    discountnotapplicable: { type: Boolean, default: false },
    mrp: {
        type: Number,
        default: 0
    },
    selling: {
        type: Number,
        default: 0
    },
    // purchased:{type:Number, default:0}
    b2bpurchase: {
        type: Number,
        default: 0
    },
    b2cpurchase: {
        type: Number,
        default: 0
    }
};

var masterservice = {
    service_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    },
    test_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PartnerService'
    },
    tubes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tube'
    }],
    department_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    } //changes made against feedback to add department against each compoments..
}

var partnerserviceSchema = new mongoose.Schema({

    // @abs [ added new attribute as discussed with talat sir if(postsample == true) add all postsample test true into below array save only id ]
    postservices:Array,
    _Deleted: {
        type: Boolean,
        default: false
    },
    archived: {
        type: Boolean,
        default: false
    }, //for integrator purpose
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider'
    },
    name: {
        type: String
    },
    alias: Array,
    code: {
        type: String
    },
    // masterservice: masterservice,
    partner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Partner'
    },
    // department_id:{type:mongoose.Schema.Types.ObjectId,ref:'Department'},
    category: {
        type: String,
        enum: ['TEST', 'PROFILE', 'PACKAGES']
    },
    // childs: [masterservice],
    price: price,
    customerinstruction: {
        type: String
    },
    customerinstructiontype: {type:String},
    specialinstruction: {
        type: String
    },
    specialinstructions: [{
        type: String
    }],
    // new attribute added
    description: {
        type: String
    }, //change made against feedbak add description attribute 
    B2B: {
        type: Boolean,
        default: false
    }, //change made against feedbak add B2B attribute 
    B2C: {
        type: Boolean,
        default: false
    }, //change mad`e against feedbak add B2C attribute 
    tat: {
        type: String
    }, //new attribute added according to new excel 
    // clientservices: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Service'
    // }], //add attribute for client services
    source: {
        type: String,
        default: 'webadmin'
    },

    //new attribute to excel imports
    specialtest: {
        type: String
    },
    postsample: {
        type: Boolean,
        default: false
    },
    sampletype: {
        type: String
    },
    collectionprocedure: {
        type: String
    },
    sechedule: String,
}, {
    strict: false
});

// partnerserviceSchema.pre('save',function(next){
//     var doc = this;
//     if (doc.isNew) {
//         if (secrets && secrets.mvmApiUrl) {
//             getMVMMasterService(doc, function(e, mvmService){
//                 //if (e) return next(e);

//                 //console.log("mvmService---------");
//                 //console.log(mvmService);

//                 if (!mvmService) return next();
//                 if (!mvmService.length) return next();

//                 var partner_service = {
//                     "name" : doc.name,
//                     "code": doc.code,
//                     "venderservice_id": doc._id, //required
//                     "service_id": mvmService[0].id, //required
//                     "price": doc.price.mrp
//                 };
//                 partner_service.vendername = doc.partner_id.name; //required
//                 if (doc.partner_id && doc.partner_id._id) {
//                     partner_service.vender_id = doc.partner_id._id; //required
//                 }
                
//                 //console.log("partner_service---------");
//                 //console.log(partner_service);

//                 postVenderService(partner_service, function(e, venderObj){
//                     //if (e) return next(e);

//                     return next();
//                 });
//             });
//         }else{
//             return next();
//         };
//     }
//     else
//     {
//         return next();
//     };
// });

// function getMVMMasterService (dataObj, cb) {
//     var url = secrets.mvmApiUrl;
//     url += "/service/getservice?venderservicename=" + dataObj.name;
//     //console.log(url);
    
//     var options = {
//         hostname: urlParser.parse(url).hostname,
//         path: urlParser.parse(url).path,
//         port:urlParser.parse(url).port
//     };
//     var body = "";

//     var protocol = urlParser.parse(url).protocol;
//     var httpHelper = http;
//     if(protocol == 'https:')
//         httpHelper = https;

//     httpHelper.get(options, function(response) {
//         //console.log("Got response: " + response.statusCode);
//         //console.log('STATUS: ' + response.statusCode);
//         //console.log('HEADERS: ' + JSON.stringify(response.headers));
//         //response.setEncoding('utf8');
//         response.on('data', function (chunk) {
//           body += chunk;
//         });
//         response.on('end', function () {
//             try{
//                 console.log(body);
//                 var data = JSON.parse(body);
//                 return cb(null, data);
//             }catch (e){
//                 return cb("Error - "+e);
//             };
//         });
//     }).on('error', function(e) { 
//         return cb(e);
//     });
// };

// function postVenderService (dataObj, cb) {
//     /*
//     var dataObj = {
//     name: 'HBS',
//     code: 'Z556',
//     vender_id: 572cb74ae1eeed771d7712fd,
//     service_id: '574816be639ba9840c874073',
//     price: 1100
//     };*/

//     if (!dataObj) return cb(new Error("Data not found"));

//     var url = secrets.mvmApiUrl;
//     url += "/venderservice/postvenderservice";
//     //console.log(url);

//     var postDataObj = JSON.stringify(dataObj);

//     var options = {
//         hostname: urlParser.parse(url).hostname,
//         path: urlParser.parse(url).path,
//         port:urlParser.parse(url).port,
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Content-Length': postDataObj.length
//         }
//     };
//     var body = "";

//     var protocol = urlParser.parse(url).protocol;
//     var httpHelper = http;
//     if(protocol == 'https:')
//         httpHelper = https;

//     var req = httpHelper.request(options, function(res) {
//         //console.log('STATUS: ' + res.statusCode);
//         //console.log('HEADERS: ' + JSON.stringify(res.headers));
//         res.setEncoding('utf8');
//         res.on('data', function (chunk) {
//             body += chunk;
//         });
//         res.on('end', function() {
//             try{
//                 var data = JSON.parse(body);
//                 return cb();
//             }catch (e){
//                 return cb(e);
//             };
//         });
//     });
//     req.on('error', function(e) { 
//         return cb(e);
//     });
//     // write data to request body
    
//     req.write(postDataObj);
//     req.end();
// };

// //----------

// var populateQuery = [{
//         path: 'masterservice.service_id',
//         select: '_id name specialservice'
//     }, {
//         path: 'masterservice.tubes',
//         select: '_id company type name.color size'
//     }, {
//         path: 'masterservice.department_id',
//         select: '_id name'
//     }, {
//         path: 'childs.test_id',
//         select: '_id name masterservice.tubes postservices masterservice.department_id customerinstruction specialinstruction specialinstructions childs category customerinstructiontype masterservice.service_id sampletype postsample'
//     }, {
//         path: 'childs.service_id',
//         select: '_id name '
//     }, {
//         path: 'childs.tubes',
//         select: 'id company size name.color type'
//     }, {
//         path: 'childs.department_id',
//         select: '_id name'
//     }, {
//         path: 'clientservices'
//     }, {
//         path: 'provider_id',
//         select: '_id name'
//     },
//     {
//         path: 'partner_id',
//         select: '_id info.name info.acronym sharetubes'
//     },
//     {
//         path:"postservices"
//     }

// ];


// partnerserviceSchema.pre('find', function(next) {
//     // this.populate(' childs.test_id childs.service_id childs.tubes  childs.department_id masterservice.service_id masterservice.department_id masterservice.test_id masterservice.tubes partner_id clientservices');
//     this.populate(populateQuery)
//     next();
// });


// partnerserviceSchema.pre('findOne', function(next) {
//     // this.populate('childs.test_id childs.service_id childs.tubes childs.department_id masterservice.service_id masterservice.department_id masterservice.test_id masterservice.tubes partner_id clientservices ');
//     this.populate(populateQuery)
//     next();
// });

partnerserviceSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('PartnerService', partnerserviceSchema);
