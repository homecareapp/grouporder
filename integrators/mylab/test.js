var async = require('async');
var Service = require('../../models/Service');

exports.processTest = function(provider_id, data, cb) {
    async.waterfall([
        function(nextfunc) {
            //mark all items as archived;
            Service.update({
                provider_id: provider_id
            }, {
                $set: {
                    archived: true
                }
            }, {
                multi: true
            }, function(err) {
                return nextfunc(err)
            })
        },
        //filter the test and profiles
        function(nextfunc) {
        	var items = [];
            try {
                items = JSON.parse(data.GetTestsResult);
            } catch (err) {
                return nextfunc(err);
            }
            return nextfunc(null, items);
        },
        function(tests, nextfunc) {
            //insert to database against the provider
            async.waterfall([
                //insert-update all the tests
                function(nextfunc2) {
                    async.each(tests,
                        function(test, next) {
                            if (!test) return next;
                            Service.update({
                                    code: test.TestId,
                                    provider_id: provider_id
                                }, {
                                    $set: {
                                        name: test.TestName,
                                        archived: false
                                    }
                                }, {
                                    upsert: true
                                },
                                next)
                        },
                        function(err) {
                            return nextfunc2(err);
                        })
                }
            ], function(err) {
                return nextfunc(err)
            })
        },
        function(nextfunc) {
            //remov archived items
            Service.remove({
                provider_id: provider_id,
                archived: true
            }, function(err) {
                return nextfunc(err)
            })
        }
    ], function(e) {
        if (e) return cb(e);
        return cb();
    })
}

exports.processTestRates = function(provider_id, data, cb) {

}
