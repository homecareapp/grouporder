/**
 * Created by talat on 06/09/15.
 */
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var async = require('async');
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
// var Partner = require('./Partner');

var http = require('http');
var https = require('https');
var urlParser = require("url");
var secrets = require('../config/secrets');
// var Notification = require('./Notification');

var profile = {
    name: { type: String },
    code: { type: String },
    gender: { type: String, default: '' },
    location: { type: String, default: '' },
    pincode: String,
    landmark: String,
    address1: String,
    address2: String,
    address3: String,
    email: { type: String, default: '' },
    mobilenumber: String,
    dob: Date,
    picture: { type: String },
    specialtest: { type: Boolean },
    specialtestlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }],
    specialneed: { type: Boolean },
    specialneedlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SpecialNeed', required: true }],
    pictureinfo: { type: mongoose.Schema.Types.Mixed },
    city_id: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
    type: { type: String },
    expertise: { type: String },
    rating: Number
};

var availability = {
    day: { type: Boolean }, //07:00AM to 04:30PM
    morningareas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Area' }],

    evening: { type: Boolean }, //04:30PM to 09:30PM
    eveningareas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Area' }],

    sixthirty: { type: Boolean }, //06:30AM to 06:30AM

    sundayleave: { type: Boolean }, //04:30PM to 09:30PM

};

var userinfo = {
    tokens: { type: Array, select: false },
    applogin: { type: Boolean, default: true },
    //partner_id:{type:mongoose.Schema.Types.ObjectId,ref:'Partner'},
    partners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Partner' }],
};

var deviceinfo = [{
    device: String,
    deviceid: String
}];

var workinghour = [{
    day: [],
    from: {
        type: Number
    }, //Saved in minutes from midnight
    to: {
        type: Number
    } //Saved in minutes from midnight
}];

var userSchema = new mongoose.Schema({
    metadata: { type: mongoose.Schema.Types.Mixed },
    username: { type: String, unique: true, lowercase: true },
    password: { type: String, select: false },
    // added by arbaz for testing 
    externalId: String,
    role: String, //[admin,superuser],
    provider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    userinfo: userinfo,
    profile: profile,
    availability: availability,
    deviceinfo: deviceinfo,
    workinghour: workinghour,
    _Deleted: { type: Boolean, default: false }
});

/**Before Save*/
// userSchema.pre('save', function(next) {
//     var user = this;
//     async.waterfall([
//         //if password has changed
//         function(nextfunc) {

//             if (!user.isModified('password')) return nextfunc();
//             console.log(user.password);
//             bcrypt.genSalt(5, function(err, salt) {
//                 if (err) return nextfunc(err);
//                 bcrypt.hash(user.password, salt, null, function(err, hash) {
//                     if (err) return nextfunc(err);
//                     user.password = hash;
//                     nextfunc();
//                 });
//             });
//         },
//         //cannot update _Deleted ( Inactive users)
//         function(nextfunc) {
//             if (!user._Deleted)
//                 return nextfunc();
//             else {
//                 if (user.isModified('_Deleted'))
//                     return nextfunc();
//                 nextfunc(new Error('Deactivated user cannot be updated'))
//             }
//         }
//     ], function(err) {
//         if (err) return next(err);

//         if (!user) return next();
//         if (!user.isNew) return next();
//         if (!user._id) return next();

//         // if (!secrets.notification || !secrets.notification.url) {
//         //     return next();
//         // }
//         // var url = secrets.notification.url;

//         // url += "/api/identity";
//         // console.log(url);

//         // var postData = {}
//         // postData["_id"] = user._id.toString();

//         // var postStringData = JSON.stringify(postData);

//         // var options = {
//         //     hostname: urlParser.parse(url).hostname,
//         //     path: urlParser.parse(url).path,
//         //     port: urlParser.parse(url).port,
//         //     method: 'POST',
//         //     headers: {
//         //         'Content-Type': 'application/json',
//         //         'Content-Length': postStringData.length
//         //     }
//         // };
//         // var body = "";

//         // var protocol = urlParser.parse(url).protocol;
//         // var httpHelper = http;
//         // if (protocol == 'https:')
//         //     httpHelper = https;

//         // var req = httpHelper.request(options, function(res) {
//         //     //console.log('STATUS: ' + res.statusCode);
//         //     //console.log('HEADERS: ' + JSON.stringify(res.headers));
//         //     res.setEncoding('utf8');
//         //     res.on('data', function(chunk) {
//         //         body += chunk;
//         //     });
//         //     res.on('end', function() {
//         //         try {
//         //             var data = JSON.parse(body);
//         //             console.log("Created identity");
//         //         } catch (e) {
//         //             console.log("Created identity - error - " + e);
//         //         };
//         //     });
//         // });
//         // req.on('error', function(e) {
//         //     console.log("ERROR posting data to resonator");
//         // });
//         // // write data to request body
//         // req.write(postStringData);
//         // req.end();

//         return next();
//     })
// });

/*
//Added by Toshan Verma
userSchema.post('save', function(postdoc){
  var data = {};
  data.user = {};
  data.user._id = postdoc._id;
  data.message = "This Is Test Push Notification From Better-Life Solution";
  data.ntype = "push";
  console.log(data);
  Notification(data, function(e, r){
      if(e) {
        console.log("-----------E-------------");
        console.log(e);
      }
      console.log(r);
  });
});
*/

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};


// userSchema.pre('find', function(next) {
//     this.populate('profile.specialneedlist profile.specialtestlist provider_id userinfo.partners availability.eveningareas availability.morningareas profile.city_id');
//     next();
// });


// userSchema.pre('findOne', function(next) {
//     this.populate('profile.specialtestlist profile.specialneedlist provider_id userinfo.partners availability.eveningareas availability.morningareas profile.city_id');
//     next();
// });
userSchema.plugin(mongoosePaginate);



module.exports = mongoose.model('User', userSchema);
