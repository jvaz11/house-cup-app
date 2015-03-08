'use strict';

/* Controllers */

angular.module('houseCupApp.controllers', ['firebase.utils', 'simpleLogin'])
    .controller('HomeCtrl', ['$scope', 'fbutil', 'user', 'FBURL', function($scope, fbutil, user, FBURL) {
        $scope.syncedValue = fbutil.syncObject('syncedValue');
        $scope.user = user;
        $scope.FBURL = FBURL;
    }])

.controller('HousesController', ['$scope', '$firebase', 'fbutil', 'FBURL', '$window', '$timeout', '$http', function($scope, $firebase, fbutil, FBURL, $window, $timeout, $http) {
    var ref = new Firebase(FBURL + "houses");
    var sync = $firebase(ref);
    $scope.houses = sync.$asObject();
    var notificationRef = new Firebase(FBURL + "notifications");
    var notificationSync = $firebase(notificationRef);
    $scope.notifications = notificationSync.$asObject();
    $scope.newHouse = {
        name: '',
        totalPoints: '',
        color: ''
    };

    // Adds a new house and initial total points, if any 
    $scope.addHouse = function() {
        sync.$push($scope.newHouse).then(function(ref) {
            ref.key(); // key for the new ly created record
            $scope.newHouse = {
                name: '',
                totalPoints: ''
            };
        }, function(error) {
            console.log("Error: try again", error);
        })
    };

    // Sends points to house and updates data in Firebase (note "house" is passed in the function from the view).
    // Triggered when admin submits form to award points.
    // parseInt() turns the strings in the form into integers and adds it to the house's current total points.

    $scope.newAward = {
        "house": "Ravenclaw",
        "newPoints": 25
    };

    $scope.sendPoints = function(house) {
        var houseid = house.id;
        var totalPoints = house.totalPoints + house.amount;
        $http.patch('https://housecupapp.firebaseio.com/houses/' + houseid + '.json', {
            totalPoints: totalPoints
        }).
        success(function(data, status, headers, config) {
            console.log(data);
            $scope.onShow(house);
        }).
        error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    }

    $scope.onShow = function(house) {
        $scope.notifications.show = true;
        $scope.notifications.name = house.name;
        $scope.notifications.newcount = parseInt(house.amount);
        $scope.notifications.$save();
        $timeout(function() {
            hideMe();
        }, 5000);
    }

    function hideMe() {
        $scope.notifications.show = false;
        $scope.notifications.$save();
    }


    // Applies the house color to the background-color of the score. Don't need to use this yet (02/16/15)
    $scope.checkValue1 = function() {
        return $scope.house.color;
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