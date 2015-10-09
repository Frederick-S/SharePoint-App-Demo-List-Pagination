/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var contextHelper = __webpack_require__(1);
	var queryString = __webpack_require__(2);
	var each = __webpack_require__(4);

	var hostWebUrl = queryString.parse(location.search).SPHostUrl;
	var contextWrapper = contextHelper(hostWebUrl, true);
	var web = contextWrapper.web;
	var clientContext = contextWrapper.clientContext;

	function getLists(web, clientContext) {
	    var deferred = $.Deferred();
	    var lists = web.get_lists();

	    clientContext.load(lists);
	    clientContext.executeQueryAsync(function () {
	        var listTitleCollection = [];

	        each(lists, function (list) {
	            if (!list.get_hidden()) {
	                listTitleCollection.push(list.get_title());
	            }
	        });

	        populateDropdownList($('#lists'), listTitleCollection);

	        deferred.resolve();
	    }, function (sender, args) {
	        deferred.reject(args.get_message());
	    });

	    return deferred.promise();
	}

	function getViews(listTitle, web, clientContext) {
	    var list = web.get_lists().getByTitle(listTitle);
	    var views = list.get_views();
	    var deferred = $.Deferred();

	    clientContext.load(views);
	    clientContext.executeQueryAsync(function () {
	        var viewTitleCollection = [];

	        each(views, function (view) {
	            viewTitleCollection.push(view.get_title());
	        });

	        populateDropdownList($('#views'), viewTitleCollection);

	        deferred.resolve();
	    }, function (sender, args) {
	        deferred.reject(args.get_message());
	    });

	    return deferred.promise();
	}

	function populateDropdownList($element, values) {
	    var html = '';

	    for (var i = 0, length = values.length; i < length; i++) {
	        html += '<option value=\'' + values[i] + '\'>' + values[i] + '</option>';
	    }

	    $element.html(html);
	}

	function onError(message) {
	    alert(message);
	}

	$(document).ready(function () {
	    $('#lists').change(function () {
	        getViews($(this).val(), web, clientContext);
	    });

	    getLists(web, clientContext).then(function () {
	        $('#lists').change();
	    });
	});


/***/ },
/* 1 */
/***/ function(module, exports) {

	function contextHelper(webUrl, crossSite) {
	    var web = null;
	    var site = null;
	    var clientContext = null;
	    var appContextSite = null;

	    if (!webUrl) {
	        clientContext = SP.ClientContext.get_current();
	        web = clientContext.get_web();
	        site = clientContext.get_site();
	    } else if (crossSite) {
	        clientContext = SP.ClientContext.get_current();
	        appContextSite = new SP.AppContextSite(clientContext, webUrl);
	        web = appContextSite.get_web();
	        site = appContextSite.get_site();
	    } else {
	        clientContext = new SP.ClientContext(webUrl);
	        web = clientContext.get_web();
	        site = clientContext.get_site();
	    }

	    return {
	        web: web,
	        site: site,
	        clientContext: clientContext,
	        appContextSite: appContextSite
	    };
	}

	module.exports = contextHelper;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var strictUriEncode = __webpack_require__(3);

	exports.extract = function (str) {
		return str.split('?')[1] || '';
	};

	exports.parse = function (str) {
		if (typeof str !== 'string') {
			return {};
		}

		str = str.trim().replace(/^(\?|#|&)/, '');

		if (!str) {
			return {};
		}

		return str.split('&').reduce(function (ret, param) {
			var parts = param.replace(/\+/g, ' ').split('=');
			// Firefox (pre 40) decodes `%3D` to `=`
			// https://github.com/sindresorhus/query-string/pull/37
			var key = parts.shift();
			var val = parts.length > 0 ? parts.join('=') : undefined;

			key = decodeURIComponent(key);

			// missing `=` should be `null`:
			// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
			val = val === undefined ? null : decodeURIComponent(val);

			if (!ret.hasOwnProperty(key)) {
				ret[key] = val;
			} else if (Array.isArray(ret[key])) {
				ret[key].push(val);
			} else {
				ret[key] = [ret[key], val];
			}

			return ret;
		}, {});
	};

	exports.stringify = function (obj) {
		return obj ? Object.keys(obj).sort().map(function (key) {
			var val = obj[key];

			if (Array.isArray(val)) {
				return val.sort().map(function (val2) {
					return strictUriEncode(key) + '=' + strictUriEncode(val2);
				}).join('&');
			}

			return strictUriEncode(key) + '=' + strictUriEncode(val);
		}).filter(function (x) {
			return x.length > 0;
		}).join('&') : '';
	};


/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	module.exports = function (str) {
		return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
			return '%' + c.charCodeAt(0).toString(16);
		});
	};


/***/ },
/* 4 */
/***/ function(module, exports) {

	var spEach = function (collection, iteratee, context) {
	    if (typeof collection.getEnumerator === 'function') {
	        var index = 0;
	        var current = null;
	        var enumerator = collection.getEnumerator();

	        while (enumerator.moveNext()) {
	            current = enumerator.get_current();

	            iteratee.call(context, current, index, collection);

	            index++;
	        }
	    }
	};

	module.exports = spEach;


/***/ }
/******/ ]);