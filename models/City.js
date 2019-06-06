/**
 * Created by talat on 06/09/15.
 */
var mongoose = require("mongoose"),
    mongoosePaginate = require("mongoose-paginate");


var citySchema = new mongoose.Schema({
    _Deleted: {
        type: Boolean,
        default: false
    },
    //added new attribute for provider keep 
    provider_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    name: {
        type: String
    },
    shortname: {
        type: String
    },
    stateId: {
        type: String
    },
    countryId: {
        type: String
    },
    source: {
        type: String,
        default: 'webadmin'
    }
}, {
    strict: false
});
citySchema.index({shortname:1,provider_id:1}, {unique:true})
citySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('City', citySchema);
