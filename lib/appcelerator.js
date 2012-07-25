/**
 * Appcelerator Javascript SDK for Node.js
 *
 * @author    Ben Edmunds <http://benedmunds.com>
 * @author    DblTap Labs <http://dbltaplabs.com>
 * @copyright 2012 DblTap Labs
 * @license   MIT License http://www.opensource.org/licenses/mit-license.php
 * @version   Release: 1.0
 * @link      https://github.com/dbltaplabs/Node-Appcelerator
 */

module.exports = function(key, email, password){
  
  var _parent = this;
  var querystring = require('querystring');
  var request = require('request');
  var fs = require('fs');
  var http = require('http');
  var url = require('url');

  _parent.session_cookie = '';
  _parent.session_id = '';
  _parent.key = key;
  _parent.email = email;
  _parent.password = password;
  _parent.baseUrl = 'api.cloud.appcelerator.com';
  _parent.loggedIn = false;
  _parent.errors = '';


   /**
    * UrlReq - Wraps the http.request function
    *
    * This has been pieced together from different sources over time,
    * if you find some of your code here let me know and I'll be glad
    * to include an attribution.
    *
    * @param  {string}   reqUrl   The required url in any form
    * @param  {object}   options  An options object (this is optional)
    * @param  {Function} cb       This is passed the 'res' object from your request
    *
    */
  _parent.urlReq = function(reqUrl, options, cb){

    // if no options passed in
    if(typeof options === "function")
      cb = options; options = {};

    // http.request settings
    var settings = {
        host: reqUrl.host,
        port: reqUrl.port || 80,
        path: reqUrl.path,
        headers: options.headers || {},
        method: options.method || 'GET'
    };

    // set session cookie
    if (_parent.session_cookie.length > 0){
      settings.headers['Cookie'] = _parent.session_cookie;
    }

    // if there are params
    if(options.params){
        options.params = JSON.stringify(options.params);
        settings.headers['Content-Type'] = 'application/json';
        settings.headers['Content-Length'] = options.params.length;
    }

    // lets do this
    var req = http.request(settings);

    // if there are params, write them to the request
    if(options.params)
      req.write(options.params);


    // when the response comes back process and run the callback
    req.on('response', function(res){
        res.body = '';
        res.setEncoding('utf-8');

        // concat chunks
        res.on('data', function(chunk){ res.body += chunk });

        // when the response has finished
        res.on('end', function(){
            
            // fire callback
            cb(res.body, res);
        });
    });

    // end the request
    req.end();

  };

  /**
    * Init - Initialize the module
    *
    * @param  {string}   key        Appcelerator app key
    * @param  {string}   email      Appcelerator user email address
    * @param  {string}   password   Appcelerator user password
    *
    */
  _parent.init = function(key, email, password)
  {
    _parent.key = key;
    _parent.email = email;
    _parent.password = password;
  };


  /**
    * SendRequest - Send a request to the Appcelerator API
    *
    * @param  {string}     url      API endpoint url
    * @param  {string}     method   Method (GET|POST|PUT|DELETE)
    * @param  {object}     data     Data to pass to the API
    * @param  {bool}       secure   Boolean to determine if HTTP or HTTPS (true|false)
    * @param  {function}   callback
    *
    */
  _parent.sendRequest = function(url, method, data, secure, callback)
  {
    _parent.login(secure, function(){

      if (typeof secure === 'undefined')
        secure = true;

      url = _parent.buildUrl(url, secure);

      //append the data to the path if using get
      if (method === 'GET')
      {
        var i = 0;

        for (var k in data){
          
          url.path = url.path + '&' + k + '=' + data[k];

          i++;
        }

        data = null;
      }

      _parent.urlReq(url, {
          method: method,
          params:data
      }, function(body, res){

        return callback(res);

      });

    });

  };

  /**
    * Login - Login a user to Appcelerator and save the session cookie
    *
    * @param  {bool}       secure   Boolean to determine if HTTP or HTTPS (true|false)
    * @param  {function}   callback
    *
    */
  _parent.login = function(secure, callback)
  {

    // make sure we are not logged in already
    if (_parent.loggedIn === false)
    {

      //send the login details
      var data = {
        'login': _parent.email,
        'password': _parent.password
      };

      _parent.loggedIn = false;

      //get the url object for logging in
      var url = _parent.buildUrl('users/login.json', secure);

      //send the request
      _parent.urlReq(url, {
          method: 'POST',
          params:data
      }, function(body, res){

          // did it work?
          if(res.statusCode === 200 || res.statusCode === 201){
            _parent.loggedIn = true;

            // parse and save the session id cookie
            var cookies = res.headers['set-cookie'][0].split(';');
            for (var k in cookies){
              if (cookies[k].indexOf('_session_id') !== -1)
                _parent.session_cookie = cookies[k];
            }

            // woot
            return callback();
          }
          else {
            // fail
            console.log('login error: '+ res.statusCode);
            console.log(res);
          }

      });

    }
    else
    {
      //already logged in
      return callback();
    }
   
  };


  /**
    * BuildURL - Create a URL object
    *
    * @param  {string}   endpoint   API Endpoint
    * @param  {bool}     secure     Boolean to determine if HTTP or HTTPS (true|false)
    *
    */
  _parent.buildUrl = function(endpoint, secure)
  {

    var url = {};

    //secure by default
    if (typeof secure === 'undefined')
      secure = true;

    //construct the url object
    url.secure = secure;
    url.port = (secure === true) ? 443 : 80;
    url.prefix = (secure === true) ? 'https://' : 'http://';
    url.host = _parent.baseUrl;
    url.path = '/v1/' + endpoint + '?key=' + _parent.key;
    url.full_path = '/v1/' + endpoint + '?key=' + _parent.key;
    url.full = url.prefix + url.host + url.path;

    return url;

  };


  return this;
};