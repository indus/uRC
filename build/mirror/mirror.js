var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../.typescript/node.d.ts" />
var WAMP = require('../.typescript/wamp');
var _ = require('lodash'), when = require('when');

var Mirror = (function (_super) {
    __extends(Mirror, _super);
    function Mirror() {
        var _this = this;
        _super.call(this);
        this.name = "";
        this.map = {};
        this.regs['mirror.reflection'] = function () {
            return _this.reflection.apply(_this, arguments);
        };
        this.regs['mirror'] = function () {
            return _this.mirror.apply(_this, arguments);
        };
    }
    Mirror.prototype.reflection = function () {
        var d = when.defer();
        var queue = _.map(this.map, function (val, id, map) {
            return this.session.call("mirror." + id).then(function (reflection) {
                return reflection;
            }, function () {
                map[id] = false;
                delete map[id];
            });
        }, this);
        when.all(queue).then(function (reflections) {
            d.resolve(_.reduce(_.compact(reflections), function (refs, ref) {
                refs[ref.module + "_" + ref.id] = ref;
                return refs;
            }, {}));
        });
        return d.promise;
    };

    Mirror.prototype.mirror = function (args, kwargs, obj) {
        if (args) {
            this.map[args[0]] = true;
            console.log("[MIRROR] id:" + args[0]);
            return args[0];
        } else {
            return this.map;
        }
    };

    Mirror.prototype.onopen = function (session, details) {
        _super.prototype.onopen.call(this, session, details);
    };
    return Mirror;
})(WAMP.Node);

new Mirror();
//# sourceMappingURL=mirror.js.map
