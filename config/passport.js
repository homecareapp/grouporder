var _ = require('lodash');
var passport = require('passport');
var jwt = require('jsonwebtoken');
var LocalStrategy = require('passport-local').Strategy;
var JwtBearerStrategy = require('passport-http-jwt-bearer').Strategy;
var OAuthStrategy = require('passport-oauth').OAuthStrategy;
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var async = require('async');
var secrets = require('./secrets');
var User = require('../models/User');
var RolesMaster = require('../models/Role');
var Provider = require('../models/Provider');

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});


/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({
    usernameField: 'username'
}, function(username, password, done) {
    var projections = {};
    projections['username'] = 1;
    projections['password'] = 1;
    projections['profile'] = 1;
    projections['role'] = 1;
    projections['userinfo'] = 1;
    projections['provider_id'] = 1;

    // console.log(projections);
    var search = {};
    search['username'] = username;
    search['_Deleted'] = false;

    User.findOne(search, projections, function(err, user) {
        
        if (!user)
            return done(null, false, { message: 'Username ' + username + ' not found' });

        async.waterfall([
            //check if provider is active
            function(nextfunc) {
                if (!user.provider_id) return nextfunc();
                Provider.findOne({_id:user.provider_id},function(err,providerObj){
                  if(err) return nextfunc(err);
                  if(!providerObj) return nextfunc(new Error('Provider not found'));
                  if(providerObj._Deleted) return nextfunc(new Error('Login Failed. Route 66'));
                  return nextfunc();
                })
            },
            //check password
            function(nextfunc) {

                user.comparePassword(password, function(err, isMatch) {
                    if (isMatch) return nextfunc();
                    return nextfunc(new Error('Invalid username or password.'));
                });
            }
        ], function(err) {
            if (err) return done(err);
            return done(null, user);
        })
    });
}));


passport.use(new JwtBearerStrategy(secrets.tokenSecret, function(token, done) {
    var username = token.username;
    var password = token.password;

    var search = {
        username: username,
        password: password
    }

    async.waterfall([
        //get User
        function(nextfunc) {

            User.findOne(search, function(err, user) {

                if (err) return nextfunc(err);
                if (!user) return nextfunc(new Error('Invalid username or password.'));
                if (user._Deleted) return nextfunc(new Error('Invalid username or password.'));
                return nextfunc(null, user);
            });
        },
        //check provider if active
        function(user, nextfunc) {
            if (!user.provider_id) return nextfunc(null, user);
            Provider.findOne({_id:user.provider_id},function(err,providerObj){
              if(err) return nextfunc(err);
              if(!providerObj) return nextfunc(new Error('Provider not found'));
              if(providerObj._Deleted) return nextfunc(new Error('Login Failed. Route 66'));
              nextfunc(null,user);
            })
        }
    ], function(err, user) {
        if (err) return done(err);
        return done(null, user, token);
    })
}));

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */
/**


 /**
 * Login Required middleware.
 */
/*
 exports.isAuthenticated = function(req, res, next) {
 if (req.isAuthenticated()) return next();
 res.redirect('/login');
 };*/

exports.isAuthenticated = function(req, res, next) {
    passport.authenticate('jwt-bearer', function(err, user, info) {

        if (err) return res.status(401).json(err);
        if (!user) return res.status(401).json({
            error: 'user not found/missing authorization header'
        });
        res.locals.user = user;
        req.user = user;
        if (!user.provider_id && info.provider_id) {
            req.user.provider_id = info.provider_id;
        }
        return next();
    })(req, res, next);
};

exports.isAuthenticatedApi = function(req, res, next) {
    var key = req.query.apikey;
    if (!key)
        return res.status(401).json({
            error: 'Not authorized'
        });

    //match it with secrets.apiKey
    if(key === secrets.apiKey){
        req.user={};
        //req.user.provider_id = result._id; //TODO
        return next();
    }else{
        return res.status(401).json({
            error: 'Not authorized'
        });
    }
};
/**
 * Authorization Required middleware.
 */
exports.isAuthorized = function(req, res, next) {
    //for eg: host.com/account/profile
    //action will be profile.

    var action = "";

    var paramfound = false;
    if (req.params) {
        action = req.path.split('/').slice(-1)[0];

        _.forEach(req.params, function(n, key) {
            if (n == action)
                paramfound = true;
        });

        if (!paramfound) {

            action = req.path.split('/').slice(-1)[0];

        } else {

            action = req.path.split('/').slice(-2)[0];


        }
    } else {

        action = req.path.split('/').slice(-1)[0];


    }
    // console.log(action);
    var userRole = req.user.role;


    if (!userRole) return res.status(401).send('User not authorized.Role missing');

    req.user.access = {
        read: false,
        write: false,
        update: false,
        delete: false
    };



    //get privileges for each role that user belong to.
    RolesMaster.find().lean().exec(function(err, rolesmaster) {

        if (err) return res.status(500).send(err);

        if (!rolesmaster) return res.status(500).send('Roles master not configured');

        var role = _.findWhere(rolesmaster, {
            name: userRole
        });


        if (!role) {
            err = 'User role -' + userRole + ' not found';
        } else {

            if (userRole == "superuser") {
                req.user.access.read = true;
                req.user.access.write = true;
                req.user.access.update = true;
                req.user.access.delete = true;
            }

            if (userRole == "mobileuser") { //TODO to be removed
                req.user.access.read = true;
                req.user.access.write = true;
                req.user.access.update = true;
                req.user.access.delete = true;
            }
            // console.log(role);
            var privileges = role.privileges;

            var privilege = _.findWhere(privileges, {
                name: action
            });
            // console.log(privilege);

            if (privilege) {
                if (_.find(privilege.access, function(el) {
                        return el == "read"
                    })) req.user.access.read = true;
                if (_.find(privilege.access, function(el) {
                        return el == "write"
                    })) req.user.access.write = true;
                if (_.find(privilege.access, function(el) {
                        return el == "update"
                    })) req.user.access.update = true;
                if (_.find(privilege.access, function(el) {
                        return el == "delete"
                    })) req.user.access.delete = true;
            }
        }

        if (err) return res.status(403).send(err);

        if (!req.user.access.read && !req.user.access.write && !req.user.access.update && !req.user.access.delete)
            return res.status(403).send("You are not allowed to perform this action");
        else if (req.method == 'GET' && !req.user.access.read) {
            return res.status(403).send("You are not allowed to perform this action");
        } else if (req.method == 'POST' && !req.user.access.write) {
            return res.status(403).send("You are not allowed to perform this action");
        } else if (req.method == 'PUT' && !req.user.access.update) {
            return res.status(403).send("You are not allowed to perform this action");
        } else if (req.method == 'DELETE' && !req.user.access.delete) {
            return res.status(403).send("You are not allowed to perform this action");
        } else
            return next();
    });
};
