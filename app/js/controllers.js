'use strict';

/* Controllers */

angular.module('houseCupApp.controllers', ['firebase.utils', 'simpleLogin'])
    .controller('HomeCtrl', ['$scope', 'fbutil', 'user', 'FBURL', function($scope, fbutil, user, FBURL) {
        $scope.syncedValue = fbutil.syncObject('syncedValue');
        $scope.user = user;
        $scope.FBURL = FBURL;
    }])

.controller('HousesController', ['$scope', '$firebase', 'fbutil', 'FBURL', function($scope, $firebase, fbutil, FBURL) {
    var ref = new Firebase(FBURL + "houses");
    var sync = $firebase(ref);
    $scope.houses = sync.$asObject();
    $scope.newHouse = {
           name: '',
           totalPoints: '',
           color: ''
       };
    // Add a new house
    $scope.addHouse = function() {
        sync.$push($scope.newHouse).then(function(ref) {
            ref.key(); // key for the new ly created record
            $scope.newHouse = {
           name: '',
           totalPoints: ''
       };
        }, function(error) {
            console.log("Error:", error);
        })
    };
    // checks color
      $scope.checkValue1 = function() {
    return $scope.house.color;
  }
$scope.sendPoints = function(house) {
            house.totalPoints = parseInt(house.totalPoints) + parseInt(house.amount);
            house.amount = '';
            $scope.houses.$save(house.$id);
        };
}])

.controller('ChatCtrl', ['$scope', 'messageList', function($scope, messageList) {
    $scope.messages = messageList;
    $scope.addMessage = function(newMessage) {
        if (newMessage) {
            $scope.messages.$add({
                text: newMessage
            });
        }
    };
}])

.controller('LoginCtrl', ['$scope', 'simpleLogin', '$location', function($scope, simpleLogin, $location) {
    $scope.email = null;
    $scope.pass = null;
    $scope.confirm = null;
    $scope.createMode = false;

    $scope.login = function(email, pass) {
        $scope.err = null;
        simpleLogin.login(email, pass)
            .then(function( /* user */ ) {
                $location.path('/account');
            }, function(err) {
                $scope.err = errMessage(err);
            });
    };

    $scope.createAccount = function() {
        $scope.err = null;
        if (assertValidAccountProps()) {
            simpleLogin.createAccount($scope.email, $scope.pass)
                .then(function( /* user */ ) {
                    $location.path('/account');
                }, function(err) {
                    $scope.err = errMessage(err);
                });
        }
    };

    function assertValidAccountProps() {
        if (!$scope.email) {
            $scope.err = 'Please enter an email address';
        } else if (!$scope.pass || !$scope.confirm) {
            $scope.err = 'Please enter a password';
        } else if ($scope.createMode && $scope.pass !== $scope.confirm) {
            $scope.err = 'Passwords do not match';
        }
        return !$scope.err;
    }

    function errMessage(err) {
        return angular.isObject(err) && err.code ? err.code : err + '';
    }
}])

.controller('AccountCtrl', ['$scope', 'simpleLogin', 'fbutil', 'user', '$location',
    function($scope, simpleLogin, fbutil, user, $location) {
        // create a 3-way binding with the user profile object in Firebase
        var profile = fbutil.syncObject(['users', user.uid]);
        profile.$bindTo($scope, 'profile');

        // expose logout function to scope
        $scope.logout = function() {
            profile.$destroy();
            simpleLogin.logout();
            $location.path('/login');
        };

        $scope.changePassword = function(pass, confirm, newPass) {
            resetMessages();
            if (!pass || !confirm || !newPass) {
                $scope.err = 'Please fill in all password fields';
            } else if (newPass !== confirm) {
                $scope.err = 'New pass and confirm do not match';
            } else {
                simpleLogin.changePassword(profile.email, pass, newPass)
                    .then(function() {
                        $scope.msg = 'Password changed';
                    }, function(err) {
                        $scope.err = err;
                    })
            }
        };

        $scope.clear = resetMessages;

        $scope.changeEmail = function(pass, newEmail) {
            resetMessages();
            var oldEmail = profile.email;
            profile.$destroy();
            simpleLogin.changeEmail(pass, oldEmail, newEmail)
                .then(function(user) {
                    profile = fbutil.syncObject(['users', user.uid]);
                    profile.$bindTo($scope, 'profile');
                    $scope.emailmsg = 'Email changed';
                }, function(err) {
                    $scope.emailerr = err;
                });
        };

        function resetMessages() {
            $scope.err = null;
            $scope.msg = null;
            $scope.emailerr = null;
            $scope.emailmsg = null;
        }
    }
]);