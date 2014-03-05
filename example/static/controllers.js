var app = angular.module('example', [
  'ngRoute'
])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/static/tmp.html',
        controller: 'MainCtrl'
      })
  });


  app.controller('MainCtrl', function ($scope, $http) {
      $scope.model1 = {
        status: '',
      };
      var model1 = new kicker(
            'Model1',
            function(data){
                $scope.$apply(function(){
                    if (data.is_active){
                        $scope.model1.collection[data.id] = data;
                        // start status update 
                        $scope.model1.status += " 1 instance updated/created;  ";
                        // end status update
                    } else {
                        delete $scope.model1.collection[data.id]
                        // start status update 
                        $scope.model1.status += " 1 instance deleted; ";
                        // end status update
                    }
                });
            }, ['name']
      );
      model1.initial_collection(function(data){
          $scope.$apply(function(){
            $scope.model1.collection = data;            
            // start status update
            var message = 'some instances restored from webstorage; ';
            $scope.model1.status += message
            // end status update
          });
      });

      $scope.model2 = {
        status: '',
      };
      var model2 = new kicker(
            'Model2',
            function(data){
                console.log(data);
                $scope.$apply(function(){
                    if (data.is_active){
                        $scope.model2.collection[data.id] = data;
                        // start status update 
                        $scope.model2.status += " 1 instance updated/created;  ";
                        // end status update
                    } else {
                        delete $scope.model2.collection[data.id]
                        // start status update 
                        $scope.model2.status += " 1 instance deleted; ";
                        // end status update
                    }
                });
            }, ['name']
      );
      model2.initial_collection(function(data){
          $scope.$apply(function(){
            $scope.model2.collection = data;            
            // start status update
            var message = 'some instances restored from webstorage; ';
            $scope.model2.status += message
            // end status update
          });
      });
      //model2.getQuery('name', IDBKeyRange.bound("a", "o", false, true), function(q){console.log(q)}); 
      // indexedDB query - get all 'name' that are strictly "bigger"  that "a" and "less" then "o"
      //model1.flush_database(); // flush_database
      //model1.delete_from_db(3, model1.all(function(_){console.log(_)})); // delete instance by id
      //model2.save_to_server({name: "hello", is_active: true}); // save data to server
      //model1.all(function(_){console.log('all_data', _)}); // get all entities from database
  });
