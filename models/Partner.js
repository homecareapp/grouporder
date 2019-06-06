/**
 * Created by talat on 06/09/15.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var OptionMaster = require('./OptionMaster');

var info = {
    name: String,
    acronym: String,
    code: String,
    address: String,
    city_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    },
    coordinates: {
        lat: {
            type: Number
        },
        long: {
            type: Number
        }
    },
    type: {
        type: String
    },
};

var visitcharges = [{
    day: [],
    from: {
        type: Number
    }, //Saved in minutes from midnight
    to: {
        type: Number
    }, //Saved in minutes from midnight
    charge: {
        type: Number
    },
    // @abs new attribute added in  
    postcharge: {
        type: Number
    },
    person: {
        type: Number
    },
    premiumpercent: {
        type: Number
    },
    premiumpercentontest: {
        type: Number
    },
    WHid:{
        type: String
    }
}];

/*var paymentoptions = [{
    name: { type: String },
    code: { type: String },
    paid: { type: Boolean }

}]*/

var paymentoptions = [{ type: mongoose.Schema.Types.ObjectId, ref: 'OptionMaster'}];

var areas = [{
    area_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area'
    },
    slots: [{
        monday: {
            type: Number,
            default: 0
        }, //Monday slot
        tuesday: {
            type: Number,
            default: 0
        }, //tuesday slot
        wednesday: {
            type: Number,
            default: 0
        }, //wednesday slot
        thursday: {
            type: Number,
            default: 0
        }, //thursday slot
        friday: {
            type: Number,
            default: 0
        }, //friday slot
        saturday: {
            type: Number,
            default: 0
        }, //saturday slot
        sunday: {
            type: Number,
            default: 0
        }, //sunday slot
        time: {
            type: Number
        }, //Saved in minutes from midnight
        duration: {
            type: Number
        } //suration in minutes 
    }]
}];

var workinghour = [{
    _id: String,
    day: [],
    from: {
        type: Number
    }, //Saved in minutes from midnight
    to: {
        type: Number
    }, //Saved in minutes from midnight
    fullday: {type: Boolean, default: false}
}];

var droppoints = [{
    address: String,
    coordinates: {
        lat: {
            type: Number
        },
        long: {
            type: Number
        }
    }
}];

var reportdeliverymode = [{
    mode: {
        type: String
    },
    charge: {
        type: Number
    },
    reportdocumenttype: {
        type: String
    }
}];

var discounts = [{
    name: {type:String},
    discount: {type:Number, default:0},
    discountrs: {type:Number, default:0},
    discounttype: {type:String},
    active: {type:Boolean},
    discountapplicable: {
        type: String,
        enum: ['TEST', 'VISIT', 'BOTH']
    }
}];

var partnerSchema = new mongoose.Schema({
    // @abs [new attribute added for payment details records]
    paymentoptions: paymentoptions,
    //end
    _Deleted: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    archived: {
        type: Boolean,
        default: false
    }, //for integrator purpose
    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider'
    },
    code: {
        type: String
    },

    sharetubes: {
        type: Boolean,
        default: false
    },

    externalId: {
        type: String

    },
    info: info, //provider info such as name,address,headoffice locaton etc
    visitcharges: visitcharges, //contains visit charges
    areas: areas, //contains area and day wise slots
    workinghour: workinghour, //contains over-all working hours
    reportdeliverymode: reportdeliverymode,

    //add new attribute for autoscheduling
    autoscheduling: Boolean,
    default: false,
    autoschedulingtime: Number,
    //end
    discounts:discounts,
    droppoints: droppoints,
    source: {
        type: String,
        default: 'webadmin'
    }
}, {
    strict: false
});


var populateQuery = [
    { path: 'provider_id', select: '_id name' }, 
    { path: 'areas.area_id' }, 
    { path: 'info.city_id'}, 
    { path: 'droppoints' },
    { path: 'paymentoptions' }
];


partnerSchema.pre('findOne', function(next) {
    this.populate(populateQuery);
    next();
});

partnerSchema.pre('find', function(next) {
    this.populate(populateQuery);
    next();
});

// partnerSchema.pre('findOne', function(next) {
//     this.populate('info.city_id');
//     next();
// });

// partnerSchema.pre('find', function(next) {
//     this.populate('info.city_id');
//     next();
// });

partnerSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Partner', partnerSchema);
