var ldapbinding = require("./build/default/ldap_binding");

exports.Connection = function() {
    var callbacks = {};
    var binding = new ldapbinding.Connection();
    var me = this;
    this.queries = 0;

    binding.addListener("search", function(msgid, result) {
        if (typeof(callbacks[msgid]) != "undefined") {
            callbacks[msgid](result);
            delete callbacks[msgid];
        }
    });

    binding.addListener("bind", function(msgid, success) {
        if (typeof(callbacks[msgid]) != "undefined") {
            callbacks[msgid](success);
            delete callbacks[msgid];
        }
    });

    binding.addListener("unknown", function() {
        console.log("Unknown response detected");
    });

    this.Search = function(base, filter, attrs, callback) {
        this.queries++;
        var msgid = binding.search(base, filter, attrs);
        callbacks[msgid] = callback;
    }

    this.Open = function(uri) {
        this.startupTime = new Date();
        binding.open(uri);
    }

    this.Close = function() {
        binding.close();
    }

    this.Authenticate = function(username, password, callback) {
        var msgid = binding.authenticate(username, password);
        callbacks[msgid] = callback;
    }

    this.Close = function(a) {
        binding.close(a);
    }

    this.SearchAuthenticate = function(base, filter, password, CB) {
        this.Search(base, filter, "", function(res) {
            // TODO: see if there's only one result, and exit if not
            if (res.length != 1) {
                CB(0);
            } else {
                // we have the result. Use the DN to auth.
                me.Authenticate(res[0].dn, password, function(success, dn) {
                    CB(success, res[0].dn);
                });
            }
        });
    }
}