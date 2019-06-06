/**
 * Created by talat on 31/10/16.
 */
var mongoose = require('mongoose'),
    City = require('./City');
    
var addressSchema = new mongoose.Schema({
    _Deleted:{type:Boolean,default:false},    
    title: String,
    address: String,
    address2: String, //complete area
    address3: String,
    pincode: String, //sublocation pincode
    landmark: String,
    state: String,
    streetname: String,
    plotno: String,
    sectorno: String,
    building: String,
    wing: String,
    floor: String,
    flatno: String,
    area:String,
    city_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    },
    partner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Partner'
    },
    sublocation_text: {type:String}, //Google Area
    sublocation_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area'
    }, //sublocation id
    geolocation: {
        type: {
            type: String,
            default: 'point'
        },
        coordinates: [] //IMPORTANT: Always list coordinates in longitude, latitude order. Reference: http://docs.mongodb.org/manual/reference/geojson/
    },        
    source: {type:String,default:'webadmin'}

},{strict:false});

module.exports = mongoose.model('Address',addressSchema);