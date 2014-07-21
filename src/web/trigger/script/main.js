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
                $rootScope.safeApply();
            });
        }

        connection.open();
    })
    .controller('mainCTRL', function ($scope) {

        $scope.oPubSub = {
            acknowledge: false,
            disclose_me: false,
            exclude_me: false
        }

        $scope.oRpc ={
            disclose_me: false
        }

        $scope.subscribe = function (topic) {
            if (!topic)
                return;

            $scope.topic = null;

            $scope.session.subscribe(topic, $scope.log)
                .then(function (sub) {$scope.safeApply();}, function (err) {console.error('failed to subscribe to topic', err); });
        }

        $scope.unsubscribe = function (subscription) {
            if (!subscription)
                return;
            $scope.session.unsubscribe(subscription)
                .then(function (sub) {$scope.safeApply();},function (err) {console.error('failed to unsubscribe to topic', err);});
        }


        $scope.submit = function () {
            try {
                var json = JSON.parse($scope.args||"{}");
                var submit = $scope.session[{ pubsub: 'publish', rpc: 'call' }[$scope.mode]]($scope.uri, [], json, { pubsub: $scope.oPubSub, rpc: $scope.oRpc }[$scope.mode])
                if (submit)
                    submit.then(function (json) {
                        $scope.history.unshift({ ack: json, timestamp: +new Date(), type: 'ack' });
                        $scope.safeApply();
                    }, function (e) {
                        $scope.history.unshift({ error: e, timestamp: +new Date(), type: 'ack error' });
                        $scope.safeApply();
                    });

                    $scope.history.unshift({ payload: json, options: { pubsub: $scope.oPubSub, rpc: $scope.oRpc }[$scope.mode], timestamp: +new Date(), type: { pubsub: 'publish', rpc: 'call' }[$scope.mode] });
         
            } catch (e) {
                console.error(e);
            }
        }


        $scope.history = [];

        $scope.log = function (args, kwargs, details) {
            $scope.history.unshift({ payload: kwargs, details: details, timestamp: +new Date(), type: "subscription" });
            $scope.safeApply();
        }


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