/// <reference path="node.d.ts" />
var autobahn = require('autobahn'),
    when = require('when'),
    _ = require('lodash'),
    path = require('path');

export interface WAMP {
    connection: any;
    session: any;
    subs: any;
    regs: any;
    module: String;
    name?: String;
}

export class Node implements WAMP {

    connection: any;
    session: any;
    subs: any = {};
    regs: any = {};
    name: String;
    module: String = path.basename(module.parent.filename, path.extname(module.parent.filename));

    publish(topic: string, args?: any, kwargs?: any, options?: any) {
        var session = this.session;
        return session.publish(topic, args, kwargs)
    }

    subscribe(topic: string, func: Function, options?: any) {
        var session = this.session;
        return session.subscribe(topic, func, options).then(
            function (sub) {
                console.log("subscribed to " + sub.topic);
            },
            function (err) { console.log("failed to subscribe: " + err); })
    }
    register(procedure: string, func: Function, options?: any) {
        var session = this.session;
        return session.register(procedure, func, options).then(
            function (reg) {
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

    public reflect() {
    return {
            id: this.session.id,
            module: this.module,
            name: this.name,
            registrations: _.reduce(this.session.registrations, function (regs, r) { regs[r.procedure] = _.pick(r, "id", "procedure", "active");return regs }, {}),
            subscriptions: _.reduce(_.flatten(this.session.subscriptions), function (subs, s) { subs[s.topic] = _.pick(s, "id", "topic", "active"); return subs }, {}),
        }
    }

    public onopen(session, details) {
        this.session = session;

        var queue = [];

        for (var procedure in this.regs)
            queue.push(this.register(procedure, this.regs[procedure]));

        for (var topic in this.subs)
            queue.push(this.subscribe(topic, this.subs[topic]));

        queue.push(this.register('mirror.' + session.id, () => this.reflect()));
        queue.push(this.subscribe('mirror', () => this.reflect()));


        when.all(queue).then(function () {
            session.call('mirror', [session.id])
        })
    }
}


