/// <reference path="node.d.ts" />
var autobahn = require('autobahn'), when = require('when'), _ = require('lodash'), path = require('path');

var Node = (function () {
    function Node(options) {
        var _this = this;
        this.subs = {};
        this.regs = {};
        this.module = path.basename(module.parent.filename, path.extname(module.parent.filename));
        var connection = this.connection = new autobahn.Connection({
            url: 'ws://127.0.0.1:8080/ws',
            realm: 'realm1'
        });

        connection.onopen = function (session, details) {
            _this.onopen(session, details);
        };
        connection.open();
    }
    Node.prototype.publish = function (topic, args, kwargs, options) {
        var session = this.session;
        return session.publish(topic, args, kwargs);
    };

    Node.prototype.subscribe = function (topic, func, options) {
        var session = this.session;
        return session.subscribe(topic, func, options).then(function (sub) {
            console.log("subscribed to " + sub.topic);
        }, function (err) {
            console.log("failed to subscribe: " + err);
        });
    };
    Node.prototype.register = function (procedure, func, options) {
        var session = this.session;
        return session.register(procedure, func, options).then(function (reg) {
            console.log("registered " + reg.procedure);
        }, function (err) {
            console.log("failed to register: " + err);
        });
    };

    Node.prototype.reflect = function () {
        return {
            id: this.session.id,
            module: this.module,
            name: this.name,
            registrations: _.reduce(this.session.registrations, function (regs, r) {
                regs[r.procedure] = _.pick(r, "id", "procedure", "active");
                return regs;
            }, {}),
            subscriptions: _.reduce(_.flatten(this.session.subscriptions), function (subs, s) {
                subs[s.topic] = _.pick(s, "id", "topic", "active");
                return subs;
            }, {})
        };
    };

    Node.prototype.onopen = function (session, details) {
        var _this = this;
        this.session = session;

        var queue = [];

        for (var procedure in this.regs)
            queue.push(this.register(procedure, this.regs[procedure]));

        for (var topic in this.subs)
            queue.push(this.subscribe(topic, this.subs[topic]));

        queue.push(this.register('mirror.' + session.id, function () {
            return _this.reflect();
        }));
        queue.push(this.subscribe('mirror', function () {
            return _this.reflect();
        }));

        when.all(queue).then(function () {
            session.call('mirror', [session.id]);
        });
    };
    return Node;
})();
exports.Node = Node;
//# sourceMappingURL=wamp.js.map
