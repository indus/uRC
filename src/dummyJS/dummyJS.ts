/// <reference path="../.typescript/node.d.ts" />
import WAMP = require('../.typescript/wamp');

class dummyJS extends WAMP.Node {
    type: String = "dummyJS";
    name: String = "";

    onreflection(args: any, kwarks: any, details:any) {
        console.log("REFLECTION", args, kwarks, details);
    }

    rpc(args: any, kwarks: any, details: any) {
        console.log("RPC", args, kwarks, details);
        return [args, kwarks, details]
    }

    sub(args: any, kwarks: any, details: any) {
        console.log("SUB", args, kwarks, details);
    }

    roundtrip(args: any, kwarks: any, details: any) {
        console.log(args[0] + ": " + (Date.now() - args[0]) +'ms latency');
    }

    constructor() {
        super();
        this.subs['mirror.reflection'] = this.onreflection;
        this.regs['dummyJS.rpc'] = this.rpc;
        this.subs['dummy.sub'] = this.sub;
        this.subs['dummy.pub'] = this.roundtrip;
        
        setInterval(() => { this.publish('dummy.pub', [Date.now()]) }, 1000)
    }
}

new dummyJS();


