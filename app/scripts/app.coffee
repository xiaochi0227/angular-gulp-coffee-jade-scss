'use strict'

###*
 # @ngdoc overview
 # @name angularApp
 # @description
 # # angularApp
 #
 # Main module of the application.
###
angular
  .module 'angularApp', ['ngRoute']
  .config(['$routeProvider',($routeProvider)->
    $routeProvider
    .when('/',{
      templateUrl: 'views/dashboard.html'
    })
    .when('/login',{
      templateUrl: 'views/login.html',
      controller: 'LoginCtrl'
    })
    .otherwise('/')
  ])
  .factory('angularApi',['angularUtils',(angularUtils)->
    console.log 'angularApi'
    return {

    }
  ])
  .factory('angularService',['angularApi',(angularApi)->
    return {
      get: ()->
        console.log 'angularService'
    }
  ])
  .factory('angularUtils',['$http',($http)->
    console.log 'angularUtils'
    return {
      loadData: (uri,method,params,data)->
        $http({
          withCredentials: true,
          method: method or 'GET',
          url: uri,
          data: data,
          params: params
        })
    }
  ])
