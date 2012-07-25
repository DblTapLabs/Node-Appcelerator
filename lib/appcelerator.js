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
  * UrlReq - Wraps the http.request function making it nice for unit testing APIs.
  * 
  * @param  {string}   reqUrl   The required url in any form
  * @param  {object}   options  An options object (this is optional)
  * @param  {Function} cb       This is passed the 'res' object from your request
  * 
  */
_parent.urlReq = function(reqUrl, options, cb){
    if(typeof options === "function"){ cb = options; options = {}; }// incase no options passed in

    // parse url to chunks
      //reqUrl = url.parse(reqUrl);

      // http.request settings
      var settings = {
          host: reqUrl.host,
          port: reqUrl.port || 80,
          path: reqUrl.path,
          headers: options.headers || {},
          method: options.method || 'GET'
      };

      if (_parent.session_cookie.length > 0){
        settings.headers['Cookie'] = _parent.session_cookie;
      }

      // if there are params:
      if(options.params){
          options.params = JSON.stringify(options.params);
          settings.headers['Content-Type'] = 'application/json';
          settings.headers['Content-Length'] = options.params.length;
      }
      console.log(settings.headers);

      // MAKE THE REQUEST
      var req = http.request(settings);

      // if there are params: write them to the request
      if(options.params){ req.write(options.params) };


      // when the response comes back
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
  }


  _parent.init = function(key, email, password)
  {
    _parent.key = key;
    _parent.email = email;
    _parent.password = password;
  };

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

  _parent.login = function(secure, callback)
  {

    if (_parent.loggedIn === false)
    {

      var data = {
        'login': _parent.email,
        'password': _parent.password
      };

      _parent.loggedIn = false;

      var url = _parent.buildUrl('users/login.json', secure);

      _parent.urlReq(url, {
          method: 'POST',
          params:data
      }, function(body, res){

          if(res.statusCode === 200 || res.statusCode === 201){
            _parent.loggedIn = true;

            //parse and save the session id cookie
            var cookies = res.headers['set-cookie'][0].split(';');
            for (var k in cookies){
              if (cookies[k].indexOf('_session_id') !== -1)
                _parent.session_cookie = cookies[k];
            }

            return callback();
          }
          else {
            console.log('login error: '+ res.statusCode);
            console.log(res);
          }

      });

    }
    else
    {
      return callback();
    }
   
  };

  _parent.buildUrl = function(endpoint, secure)
  {

    var url = {};

    if (typeof secure === 'undefined')
      secure = true;

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