django-kicker
=============

installation
------------
- add 
    <script src="http://cdn.sockjs.org/sockjs-0.3.min.js"> </script>
    <script src="http://cdn.sockjs.org/websocket-multiplex-0.1.js"></script>
    <script src="http://cdnjs.cloudflare.com/ajax/libs/q.js/0.9.2/q.min.js"> </script>
    <script type="text/javascript" src="https://rawgithub.com/marcuswestin/store.js/master/store.min.js"></script>
    to your project
- add link to kicker.js

configuration
------------

- add <script>
        var sockjs = new SockJS('http://127.0.0.1:8013/multiplexer');
        var multiplexer = new WebSocketMultiplex(sockjs);
    </script> change SockJS arg to your own

usage
-----

please, see example
