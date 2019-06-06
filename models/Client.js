var async = require('async');
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var clientDemography = {
    salutation: String,
    fullname: { type: String, uppercase: true, trim: true },
    /** remove by talat sir */
    firstname: { type: String, uppercase: true, trim: true },
    lastname: { type: String, uppercase: true, trim: true },
    // added new attribute as said by talat sir from mly bugs list
    middlename:{ type: String, uppercase: true, trim: true },
    // end
    assumeddob: {
        type: Boolean,
        default: false
    },
    dob: Date,
    age: String,
    agetype: String, //month year values change to enum 
    bloodgroup: String,
    height: Number,
    weight: Number,
    unittyep: String, //cms inches values enum
    landlinenumber: String,
    mobilenumber: String,
    //new set colllection on  alternative number
    altnumber: Array,
    gender: String,
    email: String,
    deceased: {
        type: Boolean,
        default: false
    },
    deceasedcomment: {
        type: String
    },
    deceaseddate: Date,
    addresses: [ {_id:{type: mongoose.Schema.Types.ObjectId,ref: 'Address'}}],
    languagesknown: Array,
    maritalstatus: String
};


var clientSchema = new mongoose.Schema({
    _Deleted: {
        type: Boolean,
        default: false
    },
    // externalId refers to UHID for holyfamily
    externalId:String,
    clientcode: String, 
    referredby: String,
    referredbyname: String,
    demography: clientDemography,
    specialneeds: [{ type: mongoose.Schema.Types.Mixed }],
    registrationdate: {
        type: Date,
        default: Date.now()
    },
    type: {
        type: String,
        default: 'nonmember'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider'
    },
    partner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Partner'
    },
});


clientSchema.pre("find", function(next) {
    this.populate("user_id demography.addresses._id");
    next();
});

clientSchema.pre("findOne", function(next) {
    this.populate("user_id demography.addresses._id");
    next();
});

clientSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Client', clientSchema);