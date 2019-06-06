/**
 * Created by talat on 06/09/15.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var async = require('async');

var apicall = require('../integrators/apicall');
// var IntegratorConfig = require('./IntegratorConfig');

var webhooksconfig = {
    active: {
        type: Boolean,
        default: false
    },
    url: {
        type: String,
        default: ''
    }
}

var providerSchema = new mongoose.Schema({
    _Deleted: {
        type: Boolean,
        default: false
    },

    // [ not present ]
    routes: [{
        url: {
            type: String
        },
        name: {
            type: String
        },
        views: {
            menuContent: {
                controller: {
                    type: String
                },
                templateUrl: {
                    type: String
                }
            }
        }
    }],
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    logo_small: {
        type: String
    },
    logo_big: {
        type: String
    },
    apiConfig: [{
        endpoint: String, //worequest 
        functionname: String, //getList
        parser: String, //mly/weekoff.js
        active: Boolean //
    }],
    validity: {
        type: Date
    },
    plan: {
        users: {
            type: Number,
            default: 0
        },
        sms: {
            type: Number,
            default: 0
        },
    },
    config: {
        pushnotifications: {},
        smsnotifications: {},
        emailnotifications: {},
        payment_gateways: {
            payumoney: {
                active: {
                    type: Boolean,
                    default: false
                },
                merchant_id: {
                    type: String,
                    default: '4931253'
                },
                merchant_key: {
                    type: String,
                    default: 'pLphGR'
                },
                salt: {
                    type: String,
                    default: 'STXZfsUZ'
                },
                base_url: {
                    type: String,
                    default: 'https://test.payu.in'
                }, // "https://test.payu.in"; //$PAYU_BASE_URL = "https://secure.payu.in";
                surl: {
                    type: String,
                    default: 'http://okas.bls.net.in/mapi/success_payumoney'
                },
                furl: {
                    type: String,
                    default: 'http://okas.bls.net.in/mapi/failure_payumoney'
                },
                curl: {
                    type: String,
                    default: 'http://okas.bls.net.in/mapi/cancelled_payumoney'
                }
            },
            hdfc: {
                active: {
                    type: Boolean,
                    default: false
                }
            }
        },
        order: {
            mobile: {
                discountallowed: {
                    type: Boolean,
                    default: false
                }, //allow discount on web
                defaultlineitems: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Item'
                }],
                uploadprescription: {
                    type: Boolean,
                    default: false
                }
            },
            web: {
                discountallowed: {
                    type: Boolean,
                    default: false
                },
            }
        }
    },
    hooks: {
        order: webhooksconfig,
        payment: webhooksconfig
    }
}, {
    strict: false
});

// providerSchema.statics.processHook = function(hook, data, cb) {
//     var Provider = this.model('Provider');
//     var hooknotactive = "HOOKINACTIVE";
//     async.waterfall([
//         function(nextfunc) {
//             if (!data.provider_id)
//                 return nextfunc(new Error('provider_id not found in data'));
//             nextfunc();
//         },
//         function(nextfunc) {
//             Provider.findOne({
//                 _id: data.provider_id
//             }, nextfunc)
//         },
//         function(providerObj, nextfunc) {
//             if (!providerObj)
//                 return nextfunc(new Error('Provider not found in data; provider_id ' + data.provider_id));
//             if (!providerObj.hooks[hook].active || !providerObj.hooks[hook].url)
//                 return nextfunc(hooknotactive);
//             var url = providerObj.hooks[hook].url;

//             switch (hook) {
//                 case 'order':
//                     IntegratorConfig.findOne({
//                         provider_id: providerObj._id
//                     }, function(e, ic) {
//                         if (e) return nextfunc(e);
//                         var parser = ic.parser;
//                         var handler = require('../integrators/' + parser);
//                         handler['ORDER'](providerObj._id, data, url, nextfunc);
//                     })
//                     break;
//                 default:
//                     nextfunc()
//                     break;
//             }
//         }
//     ], function(err, result) {
//         return cb(err);
//     })
// }
providerSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Provider', providerSchema);
