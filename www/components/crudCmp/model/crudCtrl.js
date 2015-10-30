var app = angular.module('akeraRest');

app.controller('crudCtrl', ['$scope', '$http', '$mdDialog', '$mdToast', function($scope, $http, $mdDialog, $mdToast) {
	$scope.dbs = [];
	$scope.tblFields = {};
	$scope.selectedTbl = null;
	$scope.selectedTab = 0;
	$scope.fieldNames = ['Name', 'Type', 'Label', 'Mandatory', 'Initial', 'Extent', 'Format', 'Help', 'View', 'Decimals', 'Description'];
	$scope.selectedDbs = null;
	$scope.indexes = {};
	var tblFields = [];

	var basepath = '/rest/' + broker;

	function loadDatabases() {
		$http.get(basepath + '/crud/meta').then(function(databases) {
			var dbArr = [];
			for (var key in databases.data) {
				dbArr.push({
					title: databases.data[key],
					tables: []
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
		if (db.tables.length === 0) {
			loadTables(db, node);
		} else {
			node.toggle();
		}
	};

	function loadTables(db, node) {
		$http.get(basepath + '/crud/meta/' + db.title).then(function(tables) {
			var tblArr = [];
			for (var i = 0; i < tables.data.length; i++) {
				tblArr.push({
					title: tables.data[i]
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
				return;
			}
		}
		$http.get(basepath + '/crud/meta/' + $scope.selectedDbs + '/' + tblName).then(function(fields) {
			getTableIdx(tblName, function() {
				var tblFld = {
					title: tblName,
					fields: fields.data
				};
				$scope.selectedTbl = tblName;
				$scope.tblFields = fields.data;
				tblFields.push(tblFld);
			});
		}, function(err) {
			showError(err);
		});
	}

	function getTableIdx(tblName, callback) {
		$http.get(basepath + '/crud/meta/' + $scope.selectedDbs + '/' + tblName + '/indexes').then(function(indexes) {
			for (var key in indexes.data) {
				$scope.indexes[indexes.data[key].name] = {
					primary: indexes.data[key].primary,
					unique: indexes.data[key].unique
				};
			}
			callback();
		}, function(err) {
			showError(err);
		});
	}

	function showError(msg) {
		var err;
		if (msg.data.message) {
			err = msg.data.message;
		} else {
			err = JSON.stringify(msg);
		}
		$mdDialog.show(
			$mdDialog.alert()
			.clickOutsideToClose(true)
			.title('Error')
			.content(err)
			.ariaLabel('Error')
			.ok('Done')
		);
	}
	//Explorer Tab

	//variables
	$scope.explorerOpt = {
		limit: 5,
		page: 0,
		total: null,
		selected: [],
		data: [],
		types: {},
		theaders: []
	};

	$scope.selectRow = function(row) {
		row = $.extend(true,{},row);
		if ($scope.explorerOpt.selected.length === 0) {
			$scope.explorerOpt.selected.push(row);
		} else {
			var exists = false;
			for (var key in $scope.explorerOpt.selected) {
				if (row.rowid === $scope.explorerOpt.selected[key].rowid) {
					$scope.explorerOpt.selected.splice(key, 1);
					exists = true;
				}
			}
			if (!exists) $scope.explorerOpt.selected.push(row);
		}
	};

	$scope.evaluateState = function(row) {
		var ev = false;
		for (var k in $scope.explorerOpt.selected) {
			if ($scope.explorerOpt.selected[k].rowid === row.rowid) {
				ev = true;
			}
		}
		return ev;
	};

	$scope.loadExplorer = function() {
		$scope.explorerOpt.selected = [];
		getTableCount();
		getTableData();
	};

	$scope.onPaginationChange = function() {
		getTableData();
	};

	function getTableTypes(current) {
		$scope.explorerOpt.types = {};
		for (var f in $scope.tblFields) {
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

	function getTableCount() {
		$http.get(basepath + '/crud/' + $scope.selectedDbs + '/' + $scope.selectedTbl + '/count').then(function(count) {
			$scope.explorerOpt.total = count.data.num;
		}, function(err) {
			showError(err);
		});
	}

	function getTableData() {
		var filter = {
			limit: $scope.explorerOpt.limit,
			offset: $scope.explorerOpt.page === 1 ? 0 : $scope.explorerOpt.limit * $scope.explorerOpt.page
		};
		var query = '/?filter=' + JSON.stringify(filter);
		$http.get(basepath + '/crud/' + $scope.selectedDbs + '/' + $scope.selectedTbl + query).then(function(tableData) {
			$scope.explorerOpt.data = tableData.data;
			$scope.explorerOpt.theaders = tableData.data[0];
			getTableTypes();
		}, function(err) {
			showError(err);
		});
	}

	$scope.insertAction = function() {
		var s = $scope.$new();
		s.tblFields = $scope.tblFields;
		s.indexes = $scope.indexes;
		s.selectedDbs = $scope.selectedDbs;
		s.selectedTbl = $scope.selectedTbl;
		$mdDialog.show({
			controller: 'insertCtrl',
			scope: s,
			templateUrl: 'components/crudCmp/view/modals/mInsert.html'
		}).then(function() {
			$scope.loadExplorer();
		}, function() {});
	};

	function getDeleteFilter() {
		var filter = {
			where: {
				or: []
			}
		};
		for (var key in $scope.explorerOpt.selected) {
			var sel = $scope.explorerOpt.selected[key];
			for (var k in sel) {
				var and = {
					'and': []
				};
				if (k !== 'rowid' && k !== '$$hashKey') {
					var obj = {};
					obj[k] = sel[k];
					and.and.push(obj);
				}
				if (and.and.length !== 0)
					filter.where.or.push(and);
			}
		}
		return filter;
	}

	function getUpdateFilter(sel) {
		var filter = {
			where: {
				and: []
			}
		};
		for (var k in sel) {
			if (k !== 'rowid' && k !== '$$hashKey') {
				var obj = {};
				obj[k] = sel[k];
				filter.where.and.push(obj);
			}
		}

		return filter;
	}

	var updCount = 0;
	$scope.updateAction = function() {
		updCount = 0;
		for (var key in $scope.explorerOpt.selected) {
			var filter = getUpdateFilter($scope.explorerOpt.selected[key]);
			var data = {};
			for (var i in $scope.explorerOpt.data) {
				if ($scope.explorerOpt.data[i].rowid === $scope.explorerOpt.selected[key].rowid) {
					for (var k in $scope.explorerOpt.data[i]) {
						if (k !== 'rowid' && k !== '$$hashKey')
							data[k] = $scope.explorerOpt.data[i][k];
					}
				}
			}
			sendUpdateRequest(filter, data);
		}
	};

	function sendUpdateRequest(filter, data){
		$http.post(basepath + '/crud/' + $scope.selectedDbs + '/' + $scope.selectedTbl + '/update?filter=' + JSON.stringify(filter), data)
		.then(function(rsp){
			console.log(rsp);
			updCount+=1;
			updateFinish();
		}, function(err){
			showError(err);
		});
	}

	function updateFinish(){
		if(updCount === $scope.explorerOpt.selected.length){
			showToast('Succesfully updated ' + updCount + ' rows');
			$scope.loadExplorer();
		}
	}

	$scope.deleteAction = function() {
		var confirm = $mdDialog.confirm()
			.title('Delete')
			.content('Are you sure you want to delete these ' + $scope.explorerOpt.selected.length + ' items')
			.ariaLabel('Delete')
			.ok('Yes')
			.cancel('No');
		$mdDialog.show(confirm).then(function() {
			var filter = getDeleteFilter();
			$http.delete(basepath + '/crud/' + $scope.selectedDbs + '/' + $scope.selectedTbl + '/?filter=' + JSON.stringify(filter))
				.then(function(rsp) {
					$scope.loadExplorer();
					if (rsp.data.deleted >= 1) {
						showToast('Succesfully deleted ' + rsp.data.deleted + ' item(s)');
					} else {
						showError({
							Error: 'No items were deleted'
						});
					}
				}, function(err) {
					showError(err);
				});
		}, function() {});
	};

	function showToast(content) {
		$mdToast.show(
			$mdToast.simple()
			.content(content)
			.hideDelay(3000)
		);
	}
}]);