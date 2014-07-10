/// <reference path="node.d.ts" />
var autobahn = require('autobahn');
var when = require('when');
var _ = require('lodash');

var Node = (function () {
    function Node(options) {
        var _this = this;
        this.subs = {};
        this.regs = {};
        this.type = "";
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
            var reflection = { subscriptions: {} };
            reflection.subscriptions[sub.topic] = _.pick(sub, 'id', 'active');
            session.call('mirror.reflect', [session.id, reflection]);
            console.log("subscribed to " + sub.topic);
        }, function (err) {
            console.log("failed to subscribe: " + err);
        });
    };
    Node.prototype.register = function (procedure, func, options) {
        var session = this.session;
        return session.register(procedure, this.regs[procedure][0]).then(function (reg) {
            var reflection = { registrations: {} };
            reflection.registrations[reg.procedure] = _.pick(reg, 'id', 'active');
            session.call('mirror.reflect', [session.id, reflection]);
            console.log("registered " + reg.procedure);
        }, function (err) {
            console.log("failed to register: " + err);
        });
    };

    Node.prototype.onopen = function (session, details) {
        var _this = this;
        this.session = session;

        process.on('exit', function () {
            _this.exitHandler({ cleanup: true });
        });
        process.on('SIGINT', function () {
            _this.exitHandler({ exit: true });
        });
        process.on('uncaughtException', function () {
            _this.exitHandler({ exit: true });
        });

        var queue = [];

        for (var procedure in this.regs)
            queue.push(this.register(procedure, this.regs[procedure][0]));

        for (var topic in this.subs)
            queue.push(this.subscribe(topic, this.subs[topic][0]));

        session.call('mirror.reflect', [session.id, { type: this.type, name: this.name }]);

        when.all(queue).then(function () {
            session.call('mirror.reflect').then(function (reflection) {
            });
        });
    };

    Node.prototype.exitHandler = function (options, err) {
        console.log(this);
        this.session.call('mirror.reflect', [this.session.id, null]);
        this.session.leave();
        /*
        if (options.cleanup) console.log('clean');
        if (err) console.log(err.stack);
        if (options.exit) process.exit();*/
    };
    return Node;
})();
exports.Node = Node;
//# sourceMappingURL=wamp.js.map
