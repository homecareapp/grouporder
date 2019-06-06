var mongoose = require('mongoose');
var async = require('async');
var mongoosePaginate = require('mongoose-paginate');
var Provider = require('./Provider');
var Client = require('./Client');
var PartnerService = require('./PartnerService');
var Partner = require('./Partner');
var Area = require('./Area');
// var messagequeue = require('../controllers/messagequeue');
var moment = require('moment');
// var pushnotification = require('../controllers/pushnotification');
var ObjectID = mongoose.Schema.Types.ObjectId;

// var schedulenotification = {
//     ispatientremindersend: {
//         type: Boolean,
//         default: false
//     },
//     isvisitdetailstopatientsend: {
//         type: Boolean,
//         default: false
//     },
//     isserviceremindersend: {
//         type: Boolean,
//         default: false
//     }
// };

var attachments = [{
    name: String,
    url: String,
    description: String
}]

// var signature = [{
//     name: String,
//     url: String,
//     description: String
// }];

var paymentdetails = {
    amount: { type: Number }, //total amount
    paidamount: { type: Number }, //paid amount
    paid: { type: Boolean, default: false }, //true incase of already paid
    paymentmode: { type: String },
    visitingcharges: { type: Number },
    discount: { type: Number },
    orderDiscount: [{ type: mongoose.Schema.Types.Mixed }],
    promocode: { type: String },
    transactionData: { type: mongoose.Schema.Types.Mixed },
    reportdeliverymode: { type: mongoose.Schema.Types.Mixed }
};

var orderSchema = new mongoose.Schema({
    _Deleted: {
        type: Boolean,
        default: false
    },
    //end()

    servicedeliveryaddress: {
        _id:String,
        address2: String,
        landmark: String,
        area_id: { name: String,_id: String},
        sublocation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' }
    },

    droppointaddress: { type: mongoose.Schema.Types.Mixed }, //Drop point object from partner 
    specialneed: [{ type: mongoose.Schema.Types.Mixed }], //Special need from specialneed master
    specialneedflag: { type: Boolean }, //Special need flag from specialneed master
    logistic: {
        delivertype: { type: String }, //DeliverToLab;HandoverToLogistics
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, //logistic user id
        username: { type: String }, //logistic user name (dynamic)
        pickuptime: { type: Number },
        pickuppoint: { type: String }, //address of pickup point
        customerplace: { type: Boolean },
        remark:{ type: String }
    },

    parentorder_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider'
    },
    partner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Partner'
    },
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    type: {
        type: String
    },
    assignby: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    attachments: attachments,
    fromdate: Date,
    todate: Date,

    fromtime: Number,
    totime: Number,

    createdatetime: {
        type: Date,
        default: Date.now
    },
    createdby: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    //mp attribute
    refferedby: String,
    status: {
        type: String,
        default: 'Open'
    }, //Completed, Open, Postponed, Cancelled, Received
    statuscomment: String, // ToDo: Need to understand what is the pupose of this field

    services: [{
        service_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PartnerService'
        },
        price: Number
    }],

    tubes: { type: mongoose.Schema.Types.Mixed }, //tubes against the order.
    externalId: String, //external ID,
    orderGroupId: String, // Grouping of Order 
    paymentdetails: paymentdetails, //all payment details.
    comments: Array, //REMARKS while creating
    visitcomments: [], //visit comment at the time of completion of the order
    ordertype: {type:String}, //Fasting or PP or Random
    // details:mongoose.Schema.Types.Mixed, //Have patient_ID, staffID, Date, Status
    statuslog: [{
        type: { type: String, default: 'point' },
        statustimestamp: { type: Date },
        comment: { type: String },
        status: { type: String },
        statusby: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        coordinates: [] //IMPORTANT: Always list coordinates in longitude, latitude order. Reference: http://docs.mongodb.org/manual/reference/geojson/
    }],

    log: [
        // oldbranch_id : { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        // newbranch_id : { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        {
            oldstatus: String,
            newstatus: String,
            olddate: Date,
            newdate: Date,
            oldtime: Number,
            newtime: Number,
            updatedby: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            oldassignto: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            newassignto: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            updateddatetime: Date,
            comments: String,
            old: { type: mongoose.Schema.Types.Mixed },
            new: { type: mongoose.Schema.Types.Mixed },
            action: String //schedulechange,statuschange,staffchange, servicechange, branchchnage, remarkchange
        }
    ],
    // schedulenotification: schedulenotification,

    source: {
        type: String,
        default: 'Web'
    }
}, {strict: false});

orderSchema.plugin(mongoosePaginate);
var orderModel = mongoose.model('Order', orderSchema);

var populateQuery = [{
    path: 'client_id',
}, {
    path: 'call_id',
    select: '_id name externalId'
}, {
    path: 'area_id',
    select: '_id name pincodes city_id'
}, {
    path: 'servicedeliveryaddress.area_id',
    select: '_id name pincodes'
}, {
    path: 'servicedeliveryaddress.city_id',
    select: '_id name'
}, {
    path: 'servicedeliveryaddress.sublocation_id',
    select: '_id name'
}, {
    path: 'provider_id',
    select: '_id name'
}, {
    path: 'partner_id',
    select: '_id info.name info.acronym externalId info.code workinghour droppoints areas discounts paymentoptions reportdeliverymode'
}, {
    path: 'services.service_id',
    select: 'name _id code price sampletype description discountnotapplicable '
}, {
    path: 'assignby',
    select: '_id profile.name profile.mobilenumber'
}, {
    path: 'assignto',
    select: '_id profile.name profile.mobilenumber'
}, {
    path: 'createdby',
    select: '_id profile.name profile.mobilenumber'
}, {
    path: 'log.updatedby',
    select: '_id profile.name'
}, {
    path: 'log.newassignto',
    select: '_id profile.name'
}, {
    path: 'log.oldassignto',
    select: '_id profile.name'
}, {
    path: 'statuslog.statusby',
    select: '_id profile.name'
}];

// orderSchema.post("save", function(doc) {
//     // async.waterfall([
//     //     function(nextfunc) {
//     //         Provider.findOne({
//     //             _id: doc.provider_id
//     //         }, function(err, providerObj) {
//     //             return nextfunc(err, providerObj)
//     //         })
//     //         // console.log("postsave" + doc);
//     //     },
//     //     function(providerObj, nextfunc) {
//     //         if (!providerObj.hooks.order.active || !providerObj.hooks.order.url)
//     //             return nextfunc()
//     //         messagequeue.sendMessage({
//     //             qname: "webhooks_order",
//     //             message: JSON.stringify({
//     //                 _id: doc._id
//     //             })
//     //         }, function(err, resp) {
//     //             console.log('order sent to queue ' + resp)
//     //             nextfunc(err)
//     //         })
//     //     }
//     // ], function(err, result) {
//     //     if (err) console.log("error into order post data");
//     // })
// });

// orderSchema.pre('save',function(next){
//     var order = this;
//     if(!order._id)
//     {
//         return next();
//     }
//     orderModel.findById(order._id, function(error, preSaveObj) {
//         if (error) return next(new Error("Error in findind order"));
//         //console.log(preSaveObj)
//         /* notification while changing phlebo*/
//         if(!preSaveObj) return next();
//         var oldAssignTo = (preSaveObj.assignto)?preSaveObj.assignto._id:undefined;
//         var newAssignedTo = undefined;
        

//         if(order.assignto) {
//             newAssignedTo = order.assignto;
//             if(order.assignto._id) newAssignedTo = order.assignto._id;
//         }

        
        
//         if(oldAssignTo != newAssignedTo)
//         {
//             //console.log(preSaveObj.assignto  +""+ order.assignto)
//             /* Added by paresh for notification*/
//             if(newAssignedTo)
//             {
//                 var date = moment(order.fromdate).tz("Asia/Calcutta");
//                 date = date.format('ddd DD/MM/YY hh:mm A');
//                 var name = preSaveObj.client_id.demography.fullname;
//                 var address = "tetdst address";
//                 var pn = {};
//                 pn.type = 'Phlebo assigned'
//                 pn.touser = newAssignedTo;
//                 pn.title = "New order";
//                 pn.message = name + '\n\r' + date;
//                 pushnotification.send(pn, function(err, result) {
//                     //if (error) return next(new Error("Error oocured on server side , please assign phlebo again"));
//                 })
//             }

//             if(oldAssignTo)
//             {
//                 var date = moment(preSaveObj.fromdate).tz("Asia/Calcutta");
//                 date = date.format('ddd DD/MM/YY hh:mm A');
//                 var name = preSaveObj.client_id.demography.fullname;
//                 var address = "tetdst address";
//                 var pn1 = {};
//                 pn1.type = 'Phlebo unassigned';
//                 pn1.touser = oldAssignTo;
//                 pn1.title = "Order unassigned";
//                 pn1.message = name + '\n\r' + date;
//                 pushnotification.send(pn1, function(err, result) {
//                     //if (error) return next(new Error("Error oocured on server side , please assign phlebo again"));
//                 })
//             }
//             /* end notification*/
//         }
//         /*notification while changing phlebo*/
//         return next();
//     }).select("-signature -prescriptions").populate(populateQuery)
    
// })


// orderSchema.pre("find", function(next) {
//     this.populate("client_id call_id servicerequest_id parentorder_id area_id provider_id partner_id services.service_id assignby assignto log.updatedby log.newassignto log.oldassignto");
//     next();
// });

// orderSchema.pre("findOne", function(next) {
//     this.populate("client_id call_id servicerequest_id parentorder_id area_id provider_id partner_id services.service_id assignby assignto log.updatedby log.newassignto log.oldassignto");
//     next();
// });


module.exports = orderModel;
