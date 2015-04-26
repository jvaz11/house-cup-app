'use strict';

/* Controllers */

angular.module('houseCupApp.controllers', ['firebase.utils', 'simpleLogin'])
    .controller('HomeCtrl', ['$scope', 'fbutil', 'user', 'FBURL', function($scope, fbutil, user, FBURL) {
        $scope.syncedValue = fbutil.syncObject('syncedValue');
        $scope.user = user;
        $scope.FBURL = FBURL;
    }])

.controller('HousesController', ['$scope', '$firebase', 'fbutil', 'FBURL', '$window', '$timeout', '$http', function($scope, $firebase, fbutil, FBURL, $window, $timeout, $http) {
    var ref = new Firebase(FBURL + "teams");
    var sync = $firebase(ref);
    $scope.teams = sync.$asObject();
    var notificationRef = new Firebase(FBURL + "notifications");
    var notificationSync = $firebase(notificationRef);
    $scope.notifications = notificationSync.$asObject();
    // $scope.newHouse = {
    //     name: '',
    //     totalPoints: '',
    //     color: ''
    // };
    // Adds a new team and initial total points, if any 
    // $scope.addHouse = function() {
    //     sync.$push($scope.newHouse).then(function(ref) {
    //         ref.key(); // key for the new ly created record
    //         $scope.newHouse = {
    //             name: '',
    //             totalPoints: ''
    //         };
    //     }, function(error) {
    //         console.log("Error: try again", error);
    //     })
    // };

    // Sends points to team and updates data in Firebase (note "team" is passed in the function from the view).
    // Triggered when admin submits form to award points.
    // parseInt() turns the strings in the form into integers and adds it to the team's current total points.

    $scope.newAward = {
        "team": "Ravenclaw",
        "newPoints": 25
    };

    $scope.sendPoints = function(team) {
        var teamid = team.id;
        var totalPoints = team.totalPoints + team.amount;
        $http.patch('https://teamcupapp.firebaseio.com/teams/' + teamid + '.json', {
            totalPoints: totalPoints
        }).
        success(function(data, status, headers, config) {
            console.log(data);
            $scope.onShow(team);
        }).
        error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    }

    $scope.onShow = function(team) {
        $scope.notifications.show = true;
        $scope.notifications.name = team.name;
        $scope.notifications.newcount = parseInt(team.amount);
        $scope.notifications.$save();
        $timeout(function() {
            hideMe();
        }, 5000);
    }

    function hideMe() {
        $scope.notifications.show = false;
        $scope.notifications.$save();
    }

}])
;