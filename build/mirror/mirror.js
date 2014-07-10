var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../.typescript/node.d.ts" />
var WAMP = require('../.typescript/wamp');
var _ = require('lodash');

var Mirror = (function (_super) {
    __extends(Mirror, _super);
    function Mirror() {
        var _this = this;
        _super.call(this);
        this.type = "Mirror";
        this.name = "";
        this.reflection = {};
        this.regs['mirror.reflect'] = [function (reflection) {
                return _this.reflect(reflection);
            }];
    }
    Mirror.prototype.reflect = function (reflection) {
        if (reflection[0]) {
            var id = reflection[0];
            if (reflection[1] !== null)
                this.reflection[id] = _.merge(this.reflection[id] || {}, reflection[1]);
            else
                delete this.reflection[id];
            this.publish('mirror.reflection', [], this.reflection);
            console.log(reflection);
        }

        return this.reflection;
    };
    return Mirror;
})(WAMP.Node);

new Mirror();
//# sourceMappingURL=mirror.js.map
