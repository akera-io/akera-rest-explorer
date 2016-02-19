var app = angular.module('akeraRest');

app.controller('insertCtrl', [
    '$scope',
    '$mdDialog',
    '$http',
    '$mdToast',
    function($scope, $mdDialog, $http, $mdToast) {

      $scope.dialogOpt = {
        inputDet : [],
        models : {}
      };
      initLabels();

      function initLabels() {
        var tmpArr = [];
        for ( var key in $scope.tblFields) {
          var item = $scope.tblFields[key];
          var obj = {
            name : item.name
          };
          switch (item.type) {
          case ('int64'):
          case ('integer'):
          case ('decimal'):
            obj.type = 'number';
            break;
          case ('logical'):
            obj.type = 'checkbox';
            break;
          case ('date'):
            obj.type = 'date';
            break;
          default:
            obj.type = 'text';
            break;
          }
          tmpArr.push(obj);
        }
        $scope.dialogOpt.inputDet = tmpArr;
      }

      function showError(msg) {
        var err;
        if (msg.data.message)
          err = msg.data.message;
        else
          err = JSON.stringify(msg);
        $mdDialog.show($mdDialog.alert().clickOutsideToClose(true).title(
            'Error').content(err).ariaLabel('Error').ok('Done'));
      }

      $scope.hide = function() {
        $mdDialog.hide();
      };

      $scope.insert = function() {
        for ( var key in $scope.dialogOpt.models) {
          if (!$scope.dialogOpt.models[key])
            return;
        }
        $http
            .post(
                restRoute + $scope.selectedDbs + '/'
                    + $scope.selectedTbl, $scope.dialogOpt.models).then(
                function(iRes) {
                  $mdDialog.hide();
                  $mdToast.show($mdToast.simple().content(
                      'Succesfully inserted one row').hideDelay(3000));
                }, function(err) {
                  showError(err);
                });
      };

      $scope.inputRequires = function(type) {
        if (type === 'checkbox')
          return false;
        return true;
      };
    } ]);
