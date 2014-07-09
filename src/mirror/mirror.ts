/// <reference path="../.typescript/node.d.ts" />
import WAMP = require('../.typescript/wamp');
var _ = require('lodash');

class Mirror extends WAMP.Node {
    type = "Mirror";
    name = "";

    reflection = {};

    reflect(reflection) {
        if (reflection[0]) {
            var id = reflection[0];
            this.reflection[id] = _.merge(this.reflection[id] || {}, reflection[1]);
            this.publish('mirror.reflection', [], this.reflection);
        }

        return this.reflection;
    }

    constructor() {
        super();
        this.regs['mirror.reflect'] = [(reflection) => this.reflect(reflection)];
    }
}

new Mirror(); 