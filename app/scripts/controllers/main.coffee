'use strict'

###*
 # @ngdoc function
 # @name angularApp.controller:MainCtrl
 # @description
 # # MainCtrl
 # Controller of the angularApp
###
angular.module 'angularApp'
  .controller 'RootCtrl', ->
    console.log 'RootCtrl bagdadag'
    return
  .controller 'LoginCtrl',['$scope','angularService',($scope,angularService)->
    console.log 'LoginCtrl'
    angularService.get()
    return
  ]
