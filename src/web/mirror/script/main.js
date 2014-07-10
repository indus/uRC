angular
    .module('urcMirror', [])
    .run(function ($rootScope) {
        var wsuri = "ws://127.0.0.1:8080/ws";
        var connection = new autobahn.Connection({
            url: wsuri,
            realm: "realm1"
        });
        connection.onopen = function (session, details) {
            $rootScope.session = session;
            $rootScope.connection = connection;
            $rootScope.$broadcast('connected');
            session.call('mirror.reflect', [$rootScope.session.id, { type: "Mirror_web", name: "" }]);
        }
        connection.onclose = function (session, details) {
            console.log("close");
        }

        window.onbeforeunload = function (e) {
            $rootScope.session.call('mirror.reflect', [$rootScope.session.id, null]);
        };

        connection.open();
    })
    .controller('mainCTRL', function ($scope) {

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
        })




        /*
        session.register('com.example.mul3', mul2).then(
            function (reg) {
                console.log('procedure registered');
            },
            function (err) {
                console.log('failed to register procedure', err);
            });


        session.subscribe('mirror.reflection', function (args, kwargs) { console.log(kwargs); }).then(
           function (sub) {
               console.log('subscribed to topic');
           },
           function (err) {
               console.log('failed to subscribe to topic', err);
           }
        );*/
    });