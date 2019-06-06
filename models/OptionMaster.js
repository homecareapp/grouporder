var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var optionMasterSchema = new mongoose.Schema({
    _Deleted:{type:Boolean,default:false},
    provider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    code: {type: String},
    name: {type: String},
    displayname: {type: String},
    description: {type: String},
    isEditable:{type:Boolean,default:false},
    isParent : {type:Boolean, default:false},
    priority : Number,
    isOption : {type:Boolean, default:true},
    parent_id : {type:mongoose.Schema.Types.ObjectId,ref:'OptionMaster'},
    source: {type:String,default:'webadmin'}
},{strict:false});



optionMasterSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('OptionMaster',optionMasterSchema);