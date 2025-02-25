/*!
 * cognizen-utils
 *
 * ©Concurrent Technologies Corporation 2018
 */
var os = require('os');

var Utils = {
    subNodes: [],
    invalidFilenameChars: '\\/:"*?<>|(){}&`.',

    rmCommand: function() {
        return Utils.isWindows() ? 'DEL /Q' : 'rm -f';
    },

    chainCommands: function() {
        return Utils.isWindows() ? ' & ' : ' && ';
    },

    isWindows: function() {
        return !!os.platform().match(/^win/);
    },

    hasInvalidFilenameChars: function(filename) {
        var replaced = this.replaceInvalidFilenameChars(filename);
        return replaced !== filename;
    },

    defaultValue: function(value, fallback) {
        return (!value ? fallback : value);
    },

    generalError: function(err) {
        if (err) {
            console.log(err);
            console.log(err.stack);
        }
    },

    shutdown: function(err) {
        if (err) {
            console.log(err);
            console.log(err.stack);
        }

        process.exit(0);
    },

    timestamp: function() {
        var now = new Date();
        var parts = [
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()
        ];
        return parts.join('');
    },

    saveAll: function(mongooseObjects, success, error) {
        var count = 0;
        mongooseObjects.forEach(function(doc){
            doc.save(function(err){
                if (err) {
                    error(err);
                }
                else {
                    count++;
                    if( count == mongooseObjects.length ){
                        success();
                    }
                }
            });
        });
    },

    removeAll: function(mongooseObjects, callback) {
        var count = 0;
        mongooseObjects.forEach(function(doc){
            doc.remove(function(err){
                if (err) {
                    callback(err);
                }
                else {
                    count++;
                    if( count == mongooseObjects.length ){
                        callback(null);
                    }
                }
            });
        });
    },

    printPermissions: function(user) {

        if (!user.permissions) {
            console.log('NO Permissions for ' + user.username);
        }
        else {
            var out = ['Permissions for ' + user.username];

            user.permissions.forEach(function(permission) {
                out.push(' - ' + permission.contentId + ': ' + permission.permission);
            });

            console.log(out.join('\n'));
        }
    },

    replaceInvalidFilenameChars: function(filename, replacement) {
        if (!replacement) replacement = '';

        return filename.replace(/[\\/:"*?<>|(){}&.`]+/g, replacement);
    },

};

module.exports = Utils;