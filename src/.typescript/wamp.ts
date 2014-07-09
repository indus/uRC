/// <reference path="node.d.ts" />
var autobahn = require('autobahn');
var when = require('when');
var _ = require('lodash');

export interface WAMP {
    connection: any;
    session: any;
    subs: any;
    regs: any;
    type: String;
    name?: String;
}

export class Node implements WAMP {

    connection: any;
    session: any;
    subs: any = {};
    regs: any = {};
    type: String = "";

    publish(topic: string, args?: any, kwargs?: any, options?: any) {
        var session = this.session;
        return session.publish(topic, args, kwargs)
    }

    subscribe(topic: string, func: Function, options?: any) {
        var session = this.session;
        return session.subscribe(topic, func, options).then(
            function (sub) {
                var reflection = { subscriptions: {} };
                reflection.subscriptions[sub.topic] = _.pick(sub, 'id', 'active');
                session.call('mirror.reflect', [session.id, reflection])
                console.log("subscribed to " + sub.topic);
            },
            function (err) { console.log("failed to subscribe: " + err); })
    }
    register(procedure: string, func: Function, options?: any) {
        var session = this.session;
        return session.register(procedure, this.regs[procedure][0]).then(
            function (reg) {
                var reflection = { registrations: {} };
                reflection.registrations[reg.procedure] = _.pick(reg, 'id', 'active');
                session.call('mirror.reflect', [session.id, reflection])
                console.log("registered " + reg.procedure);
            },
            function (err) { console.log("failed to register: " + err); })
    }


    constructor(options?: any) {

        var connection = this.connection = new autobahn.Connection({
            url: 'ws://127.0.0.1:8080/ws',
            realm: 'realm1'
        });

        connection.onopen = (session, details) => { this.onopen(session, details) };
        connection.open()
    }

    public onopen(session, details) {
        this.session = session;

        var queue = [];

        for (var procedure in this.regs)
            queue.push(this.register(procedure, this.regs[procedure][0]));

        for (var topic in this.subs)
            queue.push(this.subscribe(topic, this.subs[topic][0]));



        session.call('mirror.reflect', [session.id, { type: this.type, name: this.name }])

        when.all(queue).then(function () {
            session.call('mirror.reflect').then(function (reflection) {
            })
        })
    }
}
