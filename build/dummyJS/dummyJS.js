var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../.typescript/node.d.ts" />
var WAMP = require('../.typescript/wamp');

var dummyJS = (function (_super) {
    __extends(dummyJS, _super);
    function dummyJS() {
        var _this = this;
        _super.call(this);
        this.type = "dummyJS";
        this.name = "";
        this.subs['mirror.reflection'] = this.onreflection;
        this.regs['dummyJS.rpc'] = this.rpc;
        this.subs['dummy.sub'] = this.sub;
        this.subs['dummy.pub'] = this.roundtrip;

        setInterval(function () {
            _this.publish('dummy.pub', [Date.now()]);
        }, 1000);
    }
    dummyJS.prototype.onreflection = function (args, kwarks, details) {
        console.log("REFLECTION", args, kwarks, details);
    };

    dummyJS.prototype.rpc = function (args, kwarks, details) {
        console.log("RPC", args, kwarks, details);
        return [args, kwarks, details];
    };

    dummyJS.prototype.sub = function (args, kwarks, details) {
        console.log("SUB", args, kwarks, details);
    };

    dummyJS.prototype.roundtrip = function (args, kwarks, details) {
        console.log(args[0] + ": " + (Date.now() - args[0]) + 'ms latency');
    };
    return dummyJS;
})(WAMP.Node);

new dummyJS();
//# sourceMappingURL=dummyJS.js.map
