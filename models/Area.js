/**
 * Created by talat on 06/09/15.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var City = require('./City');

var areaSchema = new mongoose.Schema({
    _Deleted:{type:Boolean,default:false},
    metadata:{type:mongoose.Schema.Types.Mixed},
    //added new attribute for provider keep 
    provider_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Provider'},
    city_id:{type:mongoose.Schema.Types.ObjectId,ref:'City',required:true},
    name:{type:String, required:true},
    description:{type:String},
    pincodes:[{type:String}],
    type:{type:String, required:true}, //MA-MajorArea, SL-SubLocation
    otherArea:{type:Boolean, default:false},
    coordinates:{
    	lat:{type:Number},
    	long:{type:Number}
    }, //Incase of SubLocation Define Lat,Long
    parent_areas:[{area_id:{type:mongoose.Schema.Types.ObjectId,ref:'Area'}}], //Incase of SubLocation define Parent Area_id
    source: {type:String,default:'webadmin'}

},{strict:false});


areaSchema.plugin(mongoosePaginate);

areaSchema.pre('find',function(next){
  this.populate('city_id parent_areas.area_id');
  next();
});

areaSchema.pre('findOne',function(next){
  this.populate('city_id parent_areas.area_id');
  next();
});

module.exports = mongoose.model('Area',areaSchema);
