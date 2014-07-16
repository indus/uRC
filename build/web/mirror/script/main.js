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


        //$scope.json = JSON.stringify({ test: "test" });



        $scope.publish = function (topic, args, kwargs) {
            try {
                console.log(topic, args, kwargs);
                args = args? JSON.parse(args):undefined;
                kwargs = kwargs ? JSON.parse(kwargs) : undefined;
                
                $scope.session.publish(topic, args, kwargs, { exclude_me: false });
            } catch (e) {
                console.error(e);
            }
        }


        function mul2(args) {
            var x = args[0];
            var y = args[1];
            console.log("mul2() called with " + x + " and " + y);
            return x * y;
        }

        $scope.$on('connected', function () {
            console.log('event received');
            $scope.session.subscribe('mirror.reflection', function (args, kwargs) { console.log(kwargs); })
                .then(
                function (sub) {
                    console.log('subscribed to topic');
                },
                function (err) {
                    console.log('failed to subscribe to topic', err);
                });


            $scope.session.subscribe('test', function (args, kwargs) { console.log("test2", args, kwargs); })
                .then(
                function (sub) {
                    console.log('subscribed to topic');
                },
                function (err) {
                    console.log('failed to subscribe to topic', err);
                });
        })

    }).directive('validateJson', function () {
        return {
            require: 'ngModel',
            link: function (scope, ele, attrs, ctrl) {
                ctrl.$parsers.unshift(function (value) {
                    var valid = false;
                    if (value) {
                        try {
                            var o = JSON.parse(value);
                            switch (attrs.validateJson) {
                                case 'object':
                                    valid = _.isPlainObject(o);
                                    ctrl.$setValidity('jsonobject', valid);
                                    break;
                                case 'array':
                                    valid = _.isArray(o);
                                    ctrl.$setValidity('jsonarray', valid);
                                    break;
                                default:
                                    valid = !!o;
                            }
                        } catch (e) { }
                    } else {
                        valid = true;
                    }

                    ctrl.$setValidity('json', valid);
                    return valid ? value : undefined;
                });
            }
        }
    });