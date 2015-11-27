var crypto = require("crypto");
var models = require("./models/index");

var util = {
    //Simple shorthand for model.save to allow error and success be passed as functions.
    //This will also find the real db model if the one given is something liek a session var.
    saveModel: function (model, error, success, modelName) {
        if (model.save) {
            model.save(function (err, model) {
                if (err) {
                    console.log(err);
                    error(err);
                } else {
                    success(model);
                }
            });
        } else {
            //Support for multiple models
            if (!modelName)
                modelName = "User";
            var Model;
            if (modelName == "User") {
                Model = models.User;
            }

            Model.findOne({
                _id: model._id
            }, function (err, found) {

                Object.keys(model).forEach(function (key) {
                    if (key.charAt(0) == '_')
                        return;
                    var val = model[key];

                    found[key] = val;

                });

                found.save(function (err, model) {
                    if (err) {
                        console.log(err);
                        error(err);
                    } else {
                        success(model);
                    }
                });
            });
        }

    },



    // Checks if there is at least one user matching params. If there is calls gtz (greaterThanZero).
    // Otherwise calls zero. If an error occurs calls error with the error as a parameter.
    moreThanZero: function (params, error, zero, gtz) {
        models.User.count(params, function (err, count) {
            if (err) {
                console.error(err);
                error(err);
            } else if (count > 0) {
                gtz();
            } else {
                zero();
            }
        });
    },

    //Calculates MD5 Hash of the given string. Returns in (lowercase) hex format
    md5hash: function (str) {
        var md5 = crypto.createHash('md5');
        return md5.update(str).digest('hex');
    },

    verifyUser: function (usr, success, failure) {

    }

}

module.exports = util;
