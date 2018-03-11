var app = angular.module('akeraRest');

app
    .controller(
        'crudCtrl',
        [
            '$scope',
            '$http',
            '$mdDialog',
            '$mdToast',
            '$mdMedia',
            function($scope, $http, $mdDialog, $mdToast, $mdMedia) {
              $scope.dbs = [];
              $scope.tblFields = {};
              $scope.selectedTbl = null;
              $scope.selectedTab = 0;
              $scope.fieldNames = [ 'Name', 'Type', 'Label', 'Mandatory',
                  'Initial', 'Extent', 'Format', 'Help', 'View', 'Decimals',
                  'Description' ];
              $scope.selectedDbs = null;
              $scope.indexFields = {};
              var tblFields = [];

              $scope.isPKField = function(fieldName) {
                return $scope.indexFields[fieldName]
                    && $scope.indexFields[fieldName].primary === true;
              };

              $scope.isUniqueField = function(fieldName) {
                return $scope.indexFields[fieldName]
                    && !$scope.indexFields[fieldName].primary
                    && $scope.indexFields[fieldName].unique === true;
              };

              function loadDatabases() {
                $http.get(restRoute + 'metadata').then(function(databases) {
                  var dbArr = [];
                  for ( var key in databases.data) {
                    dbArr.push({
                      title : databases.data[key],
                      tables : []
                    });
                  }
                  $scope.dbs = dbArr;
                }, function(err) {
                  showError(err);
                });
              }

              loadDatabases();

              $scope.loadTables = function(node) {
                var db = node.$modelValue;
                $scope.selectedTab = 0;
                
                if (!db.tables || db.tables.length === 0) {
                  loadTables(db, node);
                } else {
                  $scope.selectedDbs = db.title;
                  node.toggle();
                }
              };

              function loadTables(db, node) {
                $http.get(restRoute + 'metadata/' + db.title).then(
                    function(tables) {
                      var tblArr = [];
                      for (var i = 0; i < tables.data.length; i++) {
                        tblArr.push({
                          title : tables.data[i]
                        });
                      }
                      db.tables = tblArr;
                      $scope.selectedDbs = db.title;
                      node.toggle();
                    }, function(err) {
                      showError(err);
                    });
              }

              $scope.loadFields = function(node) {
                var tbl = node.$modelValue;
                $scope.selectedTab = 0;
                loadFields(tbl.title);
              };

              function loadFields(tblName) {
                for (var i = 0; i < tblFields.length; i++) {
                  var tFld = tblFields[i];
                  if (tFld.title === tblName) {
                    $scope.tblFields = tFld.fields;
                    $scope.selectedTbl = tblName;
                    $scope.$parent.isTreeOpen = false;
                    return;
                  }
                }
                $http.get(
                    restRoute + 'metadata/' + $scope.selectedDbs + '/' + tblName)
                    .then(function(fields) {
                      getTableIdx(tblName, function() {
                        fields.data = Object.keys(fields.data).map(function(fieldName) {
                          var field = fields.data[fieldName];
                          field.name = fieldName;
                          
                          return field;
                        });
                        
                        var tblFld = {
                          title : tblName,
                          fields : fields.data
                        };
                        $scope.selectedTbl = tblName;
                        $scope.tblFields = fields.data;
                        tblFields.push(tblFld);
                        $scope.$parent.isTreeOpen = false;
                      });
                    }, function(err) {
                      showError(err);
                    });
              }

              function getTableIdx(tblName, callback) {
                $http
                    .get(
                        restRoute + 'metadata/' + $scope.selectedDbs + '/'
                            + tblName + '/indexes')
                    .then(
                        function(indexes) {
                          for ( var key in indexes.data) {
                            var idx = indexes.data[key];

                            for ( var f in idx.fields) {
                              var fld = idx.fields[f].name;

                              $scope.indexFields[fld] = $scope.indexFields[fld]
                                  || {};

                              $scope.indexFields[fld].primary = $scope.indexFields[fld].primary
                                  || idx.primary;
                              $scope.indexFields[fld].unique = $scope.indexFields[fld].unique
                                  || idx.unique;

                              if (idx.primary && idx.unique)
                                $scope.indexFields[fld].pos = idx.fields[f].fld_pos;

                            }
                          }
                          callback();
                        }, function(err) {
                          showError(err);
                        });
              }

              function showError(msg) {
                var err;
                if (msg.data) {
                  err = 'Message : '
                      + (msg.data.message || msg.data.toString())
                      + '</br> Code : ' + msg.data.code;
                } else {
                  err = JSON.stringify(msg);
                }
                $mdDialog.show($mdDialog.alert().clickOutsideToClose(true)
                    .title('Error').content(err).ariaLabel('Error').ok('Done'));
              }
              // Explorer Tab

              // variables
              $scope.explorerOpt = {
                limit : $mdMedia('(min-width: 960px)') ? 10 : 5,
                page : 1,
                total : 0,
                selected : [],
                data : [],
                types : {},
                header : []
              };

              $scope.rowChanged = function() {
                if ($scope.explorerOpt.selected)
                  $scope.explorerOpt.selected.__changed = true;
              }

              $scope.selectRow = function(row) {
                if (!$scope.explorerOpt.selected
                    || $scope.explorerOpt.selected.rowid !== row.rowid)
                  $scope.explorerOpt.selected = $.extend(true, {}, row);

                if ($scope.explorerOpt.row)
                  delete $scope.explorerOpt.row.__selected;

                row.__selected = true;
                $scope.explorerOpt.row = row;
              };

              $scope.evaluateState = function(row) {
                return $scope.explorerOpt.selected && row
                    && $scope.explorerOpt.selected.rowid === row.rowid;
              };

              $scope.loadExplorer = function() {
                $scope.explorerOpt.page = $scope.explorerOpt.page || 1;
                $scope.explorerOpt.selected = null;
                getTableCount(function() {
                  getTableData();
                });
              };

              $scope.onPaginationChange = function() {
                $scope.explorerOpt.selected = null;
                getTableData();
              };

              function getTableTypes() {
                $scope.explorerOpt.types = {};
                for ( var f in $scope.tblFields) {
                  var fld = $scope.tblFields[f];
                  if (fld.name !== 'rowid') {
                    $scope.explorerOpt.types[fld.name] = typeToHtml(fld.type);
                  }
                }
              }

              function typeToHtml(type) {
                switch (type) {
                case ('int64'):
                case ('integer'):
                case ('decimal'):
                  type = 'number';
                  break;
                case ('logical'):
                  type = 'checkbox';
                  break;
                case ('date'):
                  type = 'date';
                  break;
                default:
                  type = 'text';
                  break;
                }
                return type;
              }

              function getTableCount(callback) {
                $http.get(
                    restRoute + $scope.selectedDbs + '/' + $scope.selectedTbl
                        + '/count').then(function(count) {
                  $scope.explorerOpt.total = count.data.count;
                  callback();
                }, function(err) {
                  showError(err);
                });
              }

              function getTableData() {

                var filter = {
                  limit : $scope.explorerOpt.limit,
                  offset : $scope.explorerOpt.limit
                      * ($scope.explorerOpt.page - 1) + 1
                };
                var query = '/?filter=' + JSON.stringify(filter);
                $http.get(
                    restRoute + $scope.selectedDbs + '/' + $scope.selectedTbl
                        + query).then(function(tableData) {
                  $scope.explorerOpt.data = tableData.data;
                  $scope.explorerOpt.header = tableData.data[0];
                  getTableTypes();
                }, function(err) {
                  if (err.status !== 404)
                    showError(err);
                });
              }

              $scope.insertAction = function() {
                var s = $scope.$new();
                s.tblFields = $scope.tblFields;
                s.selectedDbs = $scope.selectedDbs;
                s.selectedTbl = $scope.selectedTbl;
                $mdDialog.show({
                  controller : 'insertCtrl',
                  scope : s,
                  templateUrl : 'components/crudCmp/view/modals/mInsert.html'
                }).then(function() {
                  $scope.loadExplorer();
                }, function() {
                });
              };

              function getRowidPath() {
                var pk = [];

                for ( var key in $scope.indexFields) {
                  if ($scope.indexFields[key].primary
                      && $scope.indexFields[key].unique)
                    pk[$scope.indexFields[key].pos - 1] = $scope.explorerOpt.selected[key];
                }

                if (pk.length === 0) {
                  pk = [ 'rowid', $scope.explorerOpt.selected.rowid ];
                }

                return pk.join('/');
              }

              function getRowData() {
                var row = {};

                for ( var key in $scope.explorerOpt.selected) {
                  if (key !== 'rowid')
                    row[key] = $scope.explorerOpt.row[key];
                }

                return row;
              }

              $scope.updateAction = function() {
                if ($scope.explorerOpt.selected) {
                  $http.put(
                      restRoute + $scope.selectedDbs + '/' + $scope.selectedTbl
                          + '/' + getRowidPath(), getRowData()).then(
                      function(rsp) {
                        showToast('Succesfully updated.');
                        $scope.loadExplorer();
                      }, function(err) {
                        showError(err);
                      });
                }
              };

              $scope.deleteAction = function() {
                if ($scope.explorerOpt.selected) {
                  var confirm = $mdDialog.confirm().title('Delete').content(
                      'Are you sure you want to delete the record.')
                      .ariaLabel('Delete').ok('Yes').cancel('No');
                  $mdDialog.show(confirm).then(
                      function() {
                        $http['delete'](
                            restRoute + $scope.selectedDbs + '/'
                                + $scope.selectedTbl + '/' + getRowidPath())
                            .then(function(rsp) {
                              showToast('Succesfully deleted.');
                              $scope.loadExplorer();
                            }, function(err) {
                              showError(err);
                            });
                      });
                }
              };

              function showToast(content) {
                $mdToast.show($mdToast.simple().content(content)
                    .hideDelay(3000));
              }
            } ]);
