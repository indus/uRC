/// <reference path="../.typescript/node.d.ts" />
import WAMP = require('../.typescript/wamp');
var _ = require('lodash'),
    when = require('when');

class Mirror extends WAMP.Node {
    name = "";

    map = {};

    reflection() {
        var d = when.defer();
        var queue = _.map(this.map, function (val, id, map) {
            return this.session.call("mirror." + id).then(function (reflection) {
                return reflection;
            }, function () { map[id] = false; delete map[id] })
        }, this)
        when.all(queue).then(function (reflections) {
            d.resolve(_.reduce(_.compact(reflections), function (refs, ref) { refs[ref.module + "_" + ref.id]= ref ;return refs }, {}));
        })
        return d.promise;
    }

    mirror(args, kwargs, obj) {
        if (args) {
            this.map[args[0]] = true;
            console.log("[MIRROR] id:" + args[0])
            return args[0];
        } else {
            return this.map;
        }
    }


    constructor() {
        super();
        this.regs['mirror.reflection'] = () => this.reflection.apply(this, arguments);
        this.regs['mirror'] = () => this.mirror.apply(this, arguments);

    }

    public onopen(session, details) {
        super.onopen(session, details);
    }
}

new Mirror(); 