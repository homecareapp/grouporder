/**
 * Created by talat on 06/09/15.
 */
var mongoose = require('mongoose');

var privilegeSchema = new mongoose.Schema({
    name : { type: String },
    access : Array
});

var roleSchema = new mongoose.Schema({
	metadata:{type:mongoose.Schema.Types.Mixed},
  provider_id: { type : mongoose.Schema.Types.ObjectId, ref:'Provider' }, 
    name: { type: String, unique: true, lowercase: true },
    label: { type: String },
    description: { type: String },
    privileges: [privilegeSchema],
    active: {type: Boolean,default:true },
    menus: [
        {
            menu_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu' },
            access : Array
        }
    ],
    source: {type:String,default:'webadmin'}
});


// roleSchema.pre('find',function(next){
//   this.populate('menus.menu_id');
//   next();
// });

// roleSchema.pre('findOne',function(next){
//   this.populate('menus.menu_id');
//   next();
// });

module.exports = mongoose.model('Role', roleSchema);