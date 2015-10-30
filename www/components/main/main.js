var app = angular.module('akeraRest',['ui.router','ui.tree','ngMaterial','md.data.table','kendo.directives']);
app.config(function($stateProvider, $locationProvider){
	$stateProvider
		.state('crud',{
			url:'/',
			templateUrl:'components/crudCmp/view/crud.html',
			controller:'crudCtrl'
		});
});
app.controller('mainCtrl', function($scope, $state){
	$state.go('crud');
});