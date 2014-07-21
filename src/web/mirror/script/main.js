angular
    .module('urcMirror', [])
    .run(function ($rootScope) {
        $rootScope.safeApply = function (fn) {
            var phase = this.$root.$$phase;
            if (phase == '$apply' || phase == '$digest') {
                if (fn && (typeof (fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };


        var wsuri = "ws://127.0.0.1:8080/ws";
        var connection = new autobahn.Connection({
            url: wsuri,
            realm: "realm1"
        });
        connection.onopen = function (session, details) {
            $rootScope.session = session;
            $rootScope.connection = connection;
            $rootScope.$broadcast('connected');

            session.register('mirror.' + session.id, function () {
                return {
                    id: session.id,
                    module: "web",
                    name: document.title,
                    registrations: _.reduce(session.registrations, function (regs, r) { regs[r.procedure] = _.pick(r, "id", "procedure", "active"); return regs }, {}),
                    subscriptions: _.reduce(_.flatten(session.subscriptions), function (subs, s) { subs[s.topic] = _.pick(s, "id", "topic", "active"); return subs }, {}),
                }
            }).then(function () {

                session.call('mirror', [session.id]).then(function () {
                    session.call('mirror.reflection', []).then(function (reflections) {
                        console.log(reflections);
                        $rootScope.reflections = reflections;
                        $rootScope.safeApply();
                    })

                })
            });
        }

        connection.open();
    })
    .controller('mainCTRL', function ($scope) {

    });