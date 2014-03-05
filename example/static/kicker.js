function kicker(url, callback, index_fields){
    this.url = url;
    this.callback = callback;
    this.index_fields = index_fields;
    var that = this;

    this.get_updates = function(){
        var xmlhttp = that.getXmlHttp();
        var stored_timestamp = that.get_timestamp(that.url);
        xmlhttp.open('GET', ['kicker', that.url, stored_timestamp, ''].join('/'), true);
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                var changes_list = JSON.parse(xmlhttp.responseText).response;
                for (var i = 0; i < changes_list.length; i++){
                    var obj = JSON.parse(changes_list[i]);
                    if (obj.is_active == false){
                        that.delete_from_db(obj.id, function(){});
                    }
                    else {
                        that.add(obj, function(){});
                    }
                    if (obj.timestamp > stored_timestamp) stored_timestamp = obj.timestamp;
                    that.callback(obj);
                }
                that.set_timestamp(that.url, stored_timestamp);
            }
        };
        xmlhttp.send(null);
    };

    this.flush_database = function(){
        var deferred = Q.defer();
        var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
        var req = window.indexedDB.deleteDatabase('"' + that.url + '"');
        that.set_timestamp(that.url, 0.1);
        req.onsuccess = function () {
            deferred.resolve()
        };
        req.onerror = function () {
            deferred.resolve()
        }
        return deferred.promise;
    }

    this.save_to_server = function(obj){
        // move to prot
        function getCookie(name) {
             var cookieValue = null;
             if (document.cookie && document.cookie != '') {
                 var cookies = document.cookie.split(';');
                 for (var i = 0; i < cookies.length; i++) {
                     var cookie = jQuery.trim(cookies[i]);
                        // Does this cookie string begin with the name we want?
                    if (cookie.substring(0, name.length + 1) == (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
         return cookieValue;
         }
        var xmlhttp = that.getXmlHttp();
        var stored_timestamp = that.get_timestamp(that.url);
        xmlhttp.open('POST', ['kicker', that.url, stored_timestamp, ''].join('/'), true);
        xmlhttp.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        xmlhttp.send(JSON.stringify(obj));
    }

    this.init_connection = function(){
            var deferred = Q.defer();
            var sock_connection = multiplexer.channel(that.url);
            sock_connection.onopen = function(){
                deferred.resolve();
            };

            sock_connection.onclose = function(){
               setTimeout(that.init_connection().then(get_updates), 15000);
            };

            sock_connection.onmessage = function(message){
                console.log(message.data);
                var data = JSON.parse(message.data);
                if (data.is_active == false){
                    that.delete_from_db(data.id, that.callback(data));
                }
                else {
                    that.add(data, that.callback(data));
                }
                that.set_timestamp(that.url, data.timestamp);
            }
            return deferred.promise;
        };

    this.initial_collection = function(callback){
        return this.all(callback)
                    .then(this.init_connection)
                    .then(this.get_updates);
    }

    this.create_indexeddb_connection = function(){
        var that = this;
        var deferred = Q.defer();
        var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
        var request = window.indexedDB.open('"' + this.url + '"');
            
        request.onsuccess = function(event){
            that.database = event.target.result;
            deferred.resolve(that.database);
        };

        request.onupgradeneeded = function(event){
            var objectStore = event.target.result.createObjectStore(that.url, {keyPath: "id"});
            for(var counter = 0; counter < that.index_fields.length; counter++){
                var field = that.index_fields[counter];
                objectStore.createIndex(field, field, {unique: false});
            }
        };
        return deferred.promise;
    };

    this.get_object_store = function(){
        return this.database.transaction(this.url, "readwrite")
            .objectStore(this.url);
    };
    
    this.all = function(callback){
        return this.create_indexeddb_connection().then(function(){
            var deferred = Q.defer();
            var objectStore = that.get_object_store();
            var collection = {};
            objectStore.openCursor().onsuccess = function(event){
                var cursor = event.target.result;
                if (cursor) {
                    collection[cursor.value.id] = cursor.value;
                    cursor.continue();
                } else{
                    deferred.resolve(collection);
                }
            };
            return deferred.promise
        }).then(callback);
    };

    this.getQuery = function(index_name, bound, callback){
        return this.create_indexeddb_connection().then(
            function(){
                var deferred = Q.defer();
                var objectStore = that.get_object_store();
                var index = objectStore.index(index_name);
                var collection = {};
                index.openCursor(bound).onsuccess = function(event){
                    var cursor = event.target.result;
                    if (cursor){
                        collection[cursor.value.id] = cursor.value;
                        cursor.continue();
                    } else {
                        deferred.resolve(collection);
                    }
                }
                return deferred.promise;
            }
        ).then(callback);
    };

    this.add = function(obj, callback){
        return this.create_indexeddb_connection().then(function(){
            var deferred = Q.defer();
            var objectStore = that.get_object_store();
            var request = objectStore.put(obj);
            request.onsuccess = function(event){
                deferred.resolve();
            };
            return deferred.promise;
        }).then(callback);
    };

    this.delete_from_db = function(key, callback){
        return this.create_indexeddb_connection().then(function(){
            var deferred = Q.defer();
            var objectStore = that.get_object_store();
            var request = objectStore.delete(key);
            request.onsuccess = function(event){
                deferred.resolve();
            };
            return deferred.promise;
        }).then(callback);
    };
};


var Prot = function(){
    this.getXmlHttp = function(){
            var xmlhttp;
            try {
                xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (E) {
                    xmlhttp = false;
                }
            }
            if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
                xmlhttp = new XMLHttpRequest();
            }
            return xmlhttp;
    };

    this.get_timestamp = function(url){
        var ts = store.get(url + '_timestamp');
        return (ts === undefined) ? 0.1 : ts;
    };
    
    this.set_timestamp = function(url, value){
            store.set(url + '_timestamp', value);
    };

    this.get_data = function(url){
            var data = store.get(url + '_data');
            return (data === undefined) ? {} : data;
    };

    this.set_data = function(url, value){
            store.set(url + '_data', value);

    };
    }

kicker.prototype = new Prot();
