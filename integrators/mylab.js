var apicall = require('./apicall');
var test = require('./mylab/test');
var center = require('./mylab/center');
var async = require('async');
var Client = require('../models/Client');
var Order = require('../models/Order');
var HooksLog = require('../models/HooksLog');
function parseJSON(stringdata, cb) {
    try {
        var o = JSON.parse(stringdata);
        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns 'null', and typeof null === "object", 
        // so we must check for that, too.
        if (o && typeof o === "object" && o !== null) {
            return cb(null, o);
        }
        return cb(new Error('JSON format incorrect'))
    } catch (e) {
        console.log(e);
        return cb(new Error('JSON format incorrect'));
    }
}

module.exports = {
	TEST:function(provider_id,url,cb){
		console.log('Inside mylab')
		console.log('Provider id '+ provider_id);
		console.log('URL '+ url);
		async.waterfall([
			function(nextfunc){
				apicall.GET(url,nextfunc)
			},
			function(data,nextfunc){
				parseJSON(data,nextfunc)
			},
			function(data,nextfunc){
				test.processTest(provider_id,data,nextfunc)
			}
			],function(err,result){
				return cb(err,result)
		})
	},
	TESTRATES:function(provider_id,url,cb){
		console.log('Inside mylab')
		console.log('Provider id '+provider_id);
		console.log('URL '+ url);
		async.waterfall([
			function(nextfunc){
				apicall.GET(url,nextfunc)
			},
			function(data,nextfunc){
				parseJSON(data,nextfunc)
			},
			function(data,nextfunc){
				test.processTestRates(provider_id,data,nextfunc)
			}
			],function(err,result){
				return cb(err,result)
		})
	},
	CENTERS:function(provider_id,url,cb){
		console.log('Inside mylab')
		async.waterfall([
			function(nextfunc){
				apicall.GET(url,nextfunc)
			},
			function(data,nextfunc){
				parseJSON(data,nextfunc)
			},
			function(data,nextfunc){
				center.processCenter(provider_id,data,nextfunc)
			}
			],function(err,result){
				return cb(err,result)
		})
	},
	DOCTORS:function(){

	},
	ORDER:function(provider_id,data,url,cb){
		var log = new HooksLog({data:data});
		var queryParams = ['?'];
		
		async.waterfall([
			function(nextfunc){
				if(!data._id)
					return nextfunc('Order id not available')
				log.provider_id = data.provider_id;
				Order
					.findOne({_id:data._id})
					.populate('client_id partner_id services.service_id createdby')
					.exec(function(err,orderObj){
						nextfunc(err,orderObj);
					})
			},
			function(o,nextfunc){
				if(!o) return nextfunc('Order not found');
				data = o;
				return nextfunc();
			},
			function(nextfunc){
				if(!data.details)
					data.details = {};
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][Patientid]]=')
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][PatientName]]='+data.client_id.demography.fullname)
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][PatientDate]]='+data.createdatetime)
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][DoctorId]]=')
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][CollectionCenterId]]='+ (data.partner_id.code || '') )
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][Gender]]='+ data.client_id.demography.gender)
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][Age]]='+ data.client_id.demography.age)
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][MobileNo]]='+ data.client_id.demography.mobilenumber)
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][AddressLine1]]='+ data.address)
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][AddressLine2]]=')
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][City]]='+ (data.city || '') )
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][State]]='+ (data.state || '') )
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][Email]]='+ (data.client_id.demography.email || '') )
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][Remark]]='+ data.comments.join(',') )
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][PaymentMode]]='+ (data.details.paymentmode || '') )
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][TotalAmount]]='+data.amount)
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][EmeregencyCharges]]='+ (data.details.emergencycharges || 0) )
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][Discount]]='+ (data.details.discount || 0) )
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][BillAmount]]='+ data.amount)
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][AmountPaid]]='+ (data.details.amountpaid || 0) )
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][sysUser]]='+ data.createdby.username)
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][Type]]='+ (data.details.type || 'A') )
				queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][TempId]]='+data._id)
				
				data.services.forEach(function(s,i){
					queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][PatientRegistrationLineItem]['+i+'][TestId]]]='+s.service_id.code)
					queryParams.push('PatientRegistrationDataList[PatientRegistrationData[0][PatientRegistrationLineItem]['+i+'][Rate]]]='+s.service_id.price.mrp)
				})
				var newUrl = url+queryParams.join('&');
				return nextfunc(null,newUrl)
			},
			function(newUrl,nextfunc){
				log.url = newUrl;
				apicall.GET(newUrl,nextfunc)
			}
			],function(err,result){
				log.result = result || err;
				log.save(function(err){
					if(err){
						console.log('Error saving log');
						console.log(err);
					}
				});
				cb(err,result);
		})
	},
	GETORDERS:function(){

	},
	PAYMENT:function(){

	}
}