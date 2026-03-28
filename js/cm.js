/*
 * cm_v1.js v1 - Build: #
 * (c) 2021 Convertmax.io
 * https://www.convertmax.io
 */

// MIT Licensed Ajax Library
// https://github.com/fdaciuk/ajax
var CMAjax = (function () {
  "use strict";

  function ajax(options) {
    var methods = ["get", "post", "put", "delete"];
    options = options || {};
    options.baseUrl = options.baseUrl || "";
    if (options.method && options.url) {
      return xhrConnection(
        options.method,
        options.baseUrl + options.url,
        maybeData(options.data),
        options
      );
    }
    return methods.reduce(function (acc, method) {
      acc[method] = function (url, data) {
        return xhrConnection(
          method,
          options.baseUrl + url,
          maybeData(data),
          options
        );
      };
      return acc;
    }, {});
  }

  function maybeData(data) {
    // EDIT - Convert to JSON string
    if (typeof data === "object") {
      return JSON.stringify(data);
    } else {
      return data || null;
    }
  }

  function xhrConnection(type, url, data, options) {
    var returnMethods = ["then", "catch", "always"];
    var promiseMethods = returnMethods.reduce(function (promise, method) {
      promise[method] = function (callback) {
        promise[method] = callback;
        return promise;
      };
      return promise;
    }, {});
    var xhr = new XMLHttpRequest();
    var featuredUrl = getUrlWithData(url, data, type);
    xhr.open(type, featuredUrl, true);
    xhr.withCredentials = options.hasOwnProperty("withCredentials");
    setHeaders(xhr, options.headers);
    xhr.addEventListener("readystatechange", ready(promiseMethods, xhr), false);
    xhr.send(objectToQueryString(data));
    promiseMethods.abort = function () {
      return xhr.abort();
    };
    return promiseMethods;
  }

  function getUrlWithData(url, data, type) {
    if (type.toLowerCase() !== "get" || !data) {
      return url;
    }
    var dataAsQueryString = objectToQueryString(data);
    var queryStringSeparator = url.indexOf("?") > -1 ? "&" : "?";
    return url + queryStringSeparator + dataAsQueryString;
  }

  function setHeaders(xhr, headers) {
    headers = headers || {};
    if (!hasContentType(headers)) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    }
    Object.keys(headers).forEach(function (name) {
      headers[name] && xhr.setRequestHeader(name, headers[name]);
    });
  }

  function hasContentType(headers) {
    return Object.keys(headers).some(function (name) {
      return name.toLowerCase() === "content-type";
    });
  }

  function ready(promiseMethods, xhr) {
    return function handleReady() {
      if (xhr.readyState === xhr.DONE) {
        xhr.removeEventListener("readystatechange", handleReady, false);
        promiseMethods.always.apply(promiseMethods, parseResponse(xhr));

        if (xhr.status >= 200 && xhr.status < 300) {
          promiseMethods.then.apply(promiseMethods, parseResponse(xhr));
        } else {
          promiseMethods.catch.apply(promiseMethods, parseResponse(xhr));
        }
      }
    };
  }

  function parseResponse(xhr) {
    var result;
    try {
      result = JSON.parse(xhr.responseText);
    } catch (e) {
      result = xhr.responseText;
    }
    return [result, xhr];
  }

  function objectToQueryString(data) {
    return isObject(data) ? getQueryString(data) : data;
  }

  function isObject(data) {
    return Object.prototype.toString.call(data) === "[object Object]";
  }

  function getQueryString(object) {
    return Object.keys(object).reduce(function (acc, item) {
      var prefix = !acc ? "" : acc + "&";
      return prefix + encode(item) + "=" + encode(object[item]);
    }, "");
  }

  function encode(value) {
    return encodeURIComponent(value);
  }

  return ajax;
})();

function _now() {
  var time = Date.now();
  var last = _now.last || time;
  return (_now.last = time > last ? time : last + 1);
}

function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;  domain=" + this.client.rootDomain + ";";
}

// IE11 polyfills
if (!Element.prototype.matches)
  Element.prototype.matches =
  Element.prototype.msMatchesSelector ||
  Element.prototype.webkitMatchesSelector;

if (!Element.prototype.closest) {
  Element.prototype.closest = function (s) {
    var el = this;
    if (!document.documentElement.contains(el)) return null;
    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

var Convertmax = (function () {
  "use strict";

  function _toArray(nl) {
    for (var a = [], l = nl.length; l--; a[l] = nl[l]);
    return a;
  }

  function _getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2)
      return parts
        .pop()
        .split(";")
        .shift();
    else return null;
  }

  function _getParams(url) {
    var params = {};
    var parser = document.createElement("a");
    parser.href = url;
    var query = parser.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      params[pair[0]] = decodeURIComponent(pair[1]);
    }
    return params;
  }

  function _random_prefix() {
    return (
      Date.now().toString(36) +
      Math.random()
      .toString(36)
      .substr(2, 5)
    );
  }

  function _unique_visitor_id(prefix) {
    return (prefix || "") + _random_prefix() + _now().toString(36);
  }

  function _unique_session_id(prefix) {
    return (
      (prefix || "") +
      new Date()
      .getTime()
      .toString(36)
      .toUpperCase()
    );
  }

  function _get_expiry_record(value) {
    // gclid
    var expiryPeriod = ConvertmaxClient.client.config.clkExpiry * 24 * 60 * 60 * 1000; // # of day expiry in milliseconds

    var expiryDate = new Date().getTime() + expiryPeriod;
    return {
      value: value,
      expiryDate: expiryDate
    };
  }

  function _chkCPC() {
    var details = {};
    var url_params = _getParams(window.location.href);
    var gclidRecord = null;
    var msclkRecord = null;
    var hasStorage = typeof Storage !== "undefined" && typeof localStorage !== "undefined";

    if (
      url_params &&
      (url_params.hasOwnProperty("gclid") ||
        url_params.hasOwnProperty("msclkid"))
    ) {
      ConvertmaxClient.client.cpc = true;
      Object.keys(url_params).forEach(function (key, index) {
        if (
          key.indexOf("utm_") > -1 ||
          key.indexOf("keyword") > -1 ||
          key.indexOf("term") > -1 ||
          key.indexOf("gclid") > -1
        ) {
          details[key] = url_params[key];
        }
      });

      if (url_params.hasOwnProperty("gclid")) {
        details["cpc"] = "google";
        gclidRecord = _get_expiry_record(url_params["gclid"]);
        if (hasStorage) {
            localStorage.setItem('cm_gclid', JSON.stringify(gclidRecord));
        }
        ConvertmaxClient.client.gclid = url_params["gclid"];
      } else if (url_params.hasOwnProperty("msclkid")) {
        details["cpc"] = "bing";
        msclkRecord = _get_expiry_record(url_params["msclkid"]);
        if (hasStorage) {
            localStorage.setItem('cm_msclk', JSON.stringify(msclkRecord));
        }
        ConvertmaxClient.client.msclk = url_params["msclkid"];
      }

      details["page"] = window.location.href;
      ConvertmaxClient.track("cpc", details);
    }
  }

  function _chkOrganic() {
    var organics = ["bing", "google", "yahoo", "about", "ask", "aol"];

    if (document.referrer && !ConvertmaxClient.client.cpc) {
      var matches = document.referrer.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
      if (matches && matches.length > 2) {
        for (var i = 0; i < organics.length; i++) {
          if (matches[2].indexOf(organics[i]) > -1) {
            ConvertmaxClient.client.organic = true;
            ConvertmaxClient.track("organic", {
              host: organics[i],
              referrer: document.referrer
            });
            break;
          }
        }
      }
    }
  }

  function _chkSocial() {
    var social = ["facebook", "fb.me", "instagram", "linkedin", "lnkd.in", "pinterest", "twitter", "t.co", "youtube", "youtu.be"];

    if (document.referrer && !ConvertmaxClient.client.cpc && !ConvertmaxClient.client.organic) {
      var matches = document.referrer.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
      if (matches && matches.length > 2) {
        for (var i = 0; i < social.length; i++) {
          if (matches[2].indexOf(social[i]) > -1) {
            ConvertmaxClient.client.social = true;
            ConvertmaxClient.track("social", {
              host: social[i],
              referrer: document.referrer
            });
            break;
          }
        }
      }
    }
  }

  function _chkMobile() {
    // Uses is-mobile function isMobile
    var mobileRE = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i
    var tabletRE = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino|android|ipad|playbook|silk/i

    var ua = null;
    if (!ua && typeof navigator !== 'undefined') ua = navigator.userAgent
    if (ua && ua.headers && typeof ua.headers['user-agent'] === 'string') {
      ua = ua.headers['user-agent']
    }
    if (typeof ua !== 'string') return false

    if (tabletRE.test(ua) || mobileRE.test(ua)) {
      ConvertmaxClient.client.mobile = true;
    }
  }

  function _renderRecommendations() {
    var elements = _toArray(document.querySelectorAll('[data-sio-render]'));
    elements.forEach(function (element) {
      var callback_opt = element.getAttribute('data-sio-callback');
      var api_method_opt = element.getAttribute('data-sio-api');
      var count_opt = element.getAttribute('data-sio-count');
      var products_opt = element.getAttribute('data-sio-products');

      var options = {
        'callback': callback_opt,
        'limit': count_opt,
        'items': products_opt || [],
        'element': element
      };

      if (api_method_opt && api_method_opt == 'recommendations/similar') {
        ConvertmaxClient.getSimilarProducts(options);
      }

    });
  }

  function _attachClickHandlers() {
    // Add searcheo class to all underlying links
    var elements = _toArray(document.querySelectorAll(".searcheo"));
    elements.forEach(function (element) {
      var links = element.getElementsByTagName("a");
      for (var i = 0; i < links.length; i++) {
        links[i].classList.add("searcheo");
      }
    });

    document.addEventListener("click", function (e) {
      var evt_type = "click";
      var anchor = e.target.closest("a");
      if (
        anchor &&
        anchor.classList.length > 0 &&
        anchor.classList.contains("searcheo") &&
        anchor.href.length > 0
      ) {
        var cm_type = anchor.getAttribute("data-sio-type");
        var cm_target = anchor.href;
        if (cm_type && cm_type == "add-cart") {
          evt_type = "add_cart";
        }

        ConvertmaxClient.track(evt_type, {
          cm_type: cm_type,
          cm_target: cm_target
        });
      }
    });
  }

  function _process_queued_event() {
    if (this) {
      if (this.length >= 1 && typeof this[0] === "object") {
        var event = this[0];

        if (typeof event[0] === "string") {
          switch (event[0]) {
            case "config":
              ConvertmaxClient._config(event[1]);
              _attachClickHandlers();
              _chkCPC();
              _chkOrganic();
              _chkSocial();
              _chkMobile();
              _chkForms();
              _chkIntegrations();
              ConvertmaxClient._convertmaxReady();
              break;
          }
        }
      }
    }
  }

  function _valid_gclid() {
    var hasStorage =
        typeof Storage !== "undefined" && typeof localStorage !== "undefined";
    var cm_gclid = null;
    if (hasStorage) {
        cm_gclid = JSON.parse(localStorage.getItem('cm_gclid'));
        var isGclidValid = cm_gclid && new Date().getTime() < cm_gclid.expiryDate;
        if (cm_gclid && isGclidValid){
            cm_gclid = cm_gclid["value"]
        }
    }
    return cm_gclid;
  }

  function _valid_msclk() {
    var hasStorage =
        typeof Storage !== "undefined" && typeof localStorage !== "undefined";
    var cm_msclk = null;
    if (hasStorage) {
        cm_msclk = JSON.parse(localStorage.getItem('cm_msclk'));
        var isMsclkValid = cm_msclk && new Date().getTime() < cm_msclk.expiryDate;
        if (cm_msclk && isMsclkValid){
            cm_msclk = cm_msclk["value"]
        }
    }
    return cm_msclk;

  }

  function _chkForms() {
    if (ConvertmaxClient.client.config.chkForms) {
      var elements = _toArray(document.querySelectorAll('input[name="cm_visitor"]'));
      elements.forEach(function (element) {
        element.value = ConvertmaxClient.client.visitor;
      });
      elements = _toArray(document.querySelectorAll('input[name="cm_session"]'));
      elements.forEach(function (element) {
        element.value = ConvertmaxClient.client.session_id;
      });
    }
  }

  function _chkIntegrations() {
    var hasStorage = typeof Storage !== "undefined" && typeof localStorage !== "undefined";
    if (hasStorage) {
      // Clickfunnels
      var cf_uvid = localStorage.getItem('cf_uvid')
      if (cf_uvid !== undefined) {
        ConvertmaxClient.client.cf_uvid = cf_uvid;
      }
    }
  }

  var ConvertmaxClient = {
    client: {
      config: {}
    }
  };

  ConvertmaxClient._config = function (client) {
    this.client.config = client;
    this.client.config.debug = client.debug || false;
    this.client.config.apiKey = client.apiKey || "NO API KEY";
    this.client.config.chkForms = client.chkForms || true;
    this.client.config.clkExpiry = parseInt(client.clkExpiry) || 90;
    this.client.language = navigator.language || navigator.browserLanguage;
    this.client.xReferrer = document.referrer;
    this.client.config.eventURL = client.eventURL || "https://event.convertmax.io";
    this.client.doNotTrack = false;
    this.client.cpc = false;
    this.client.organic = false;
    this.client.social = false;
    this.client.mobile = false;
    this.client.rootDomain = window.location.hostname.split('.').slice(-2).join('.');
    this.client.visitor = client.visitor || "";
    this.client.session_id = client.session_id || "";
    this.client.gclid = _valid_gclid();
    this.client.msclk = _valid_msclk();
    this.client.cf_uvid = null;
    this.client.event_request = CMAjax({
      baseUrl: this.client.config.eventURL,
      headers: {
        "content-type": "application/json",
        "Accept-Language": this.client.language,
        "X-Referer": this.client.xReferrer,
        "x-access-token": this.client.config.apiKey,
        "Authorization": "Bearer " + this.client.config.apiKey
      }
    });

    // Init

    // Process Do Not Track
    var optoutCookie = _getCookie("cm_ignore_event");
    if (
      client.hasOwnProperty("opt_out_tracking_by_default") &&
      client.opt_out_tracking_by_default.toString() === "true"
    ) {
      this.client.doNotTrack = true;
    } else if (optoutCookie) {
      this.client.doNotTrack = true;
    } else if (
      window.doNotTrack ||
      navigator.doNotTrack ||
      navigator.msDoNotTrack || (window.external && "msTrackingProtectionEnabled" in window.external)
    ) {
      // The browser supports Do Not Track!
      if (
        window.doNotTrack == "1" ||
        navigator.doNotTrack == "yes" ||
        navigator.doNotTrack == "1" ||
        navigator.msDoNotTrack == "1"
      ) {
        this.client.doNotTrack = true;
      }
    }

    if (!this.client.visitor) {
      var hasStorage =
        typeof Storage !== "undefined" && typeof localStorage !== "undefined";

      if (hasStorage) {
        var visitor_id = localStorage.getItem("cm_visitor");
        if (!visitor_id) {
          visitor_id = _unique_visitor_id();
          localStorage.setItem("cm_visitor", visitor_id);
          document.cookie =
            "cm_visitor=" +
            visitor_id +
            "; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/; domain=" + this.client.rootDomain + ";";
        } else {
          if (!_getCookie("cm_visitor")) {
            document.cookie =
              "cm_visitor=" +
              visitor_id +
              "; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/; domain=" + this.client.rootDomain + ";";
          }
        }

        // Set session visitor
        this.client.visitor = visitor_id;
      }
    }

    if (!this.client.session_id) {
      var session_id = _getCookie("cm_session");
      if (!session_id) {
        session_id = _unique_session_id(this.client.visitor.slice(0, 3));
        var session_expire = new Date();
        // Add period in minutes
        session_expire.setMinutes(session_expire.getMinutes() + 35);
        document.cookie =
          "cm_session=" +
          session_id +
          "; expires=" +
          session_expire.toUTCString() + '; path=/; domain=' + this.client.rootDomain + ';';
      }

      // Set session id
      this.client.session_id = session_id;
    }
  };

  ConvertmaxClient._emitEvent = function (evt) {
    // Dispatch sustom event
    var event;
    if (typeof (Event) === 'function') {
      event = new Event(evt);
    } else {
      // IE 11
      event = document.createEvent('Event');
      event.initEvent(evt, true, true);
    }

    window.dispatchEvent(event);
  };

  ConvertmaxClient._convertmaxLoaded = function() {
    var event;
    if (typeof (Event) === 'function') {
      event = new Event('convertmaxLoaded');
    } else {
      // IE 11
      event = document.createEvent('Event');
      event.initEvent('convertmaxLoaded', true, true);
    }
    window.dispatchEvent(event);
  };

  ConvertmaxClient._convertmaxReady = function() {
    if(window.Convertmax.loaded === false) {
      this._config({});
    }
    var event;
    if (typeof (Event) === 'function') {
      event = new Event('convertmaxReady');
    } else {
      // IE 11
      event = document.createEvent('Event');
      event.initEvent('convertmaxReady', true, true);
    }
    window.dispatchEvent(event);
  };

  ConvertmaxClient.config = function(config) {
    ConvertmaxClient._config(config);
    _attachClickHandlers();
    _chkCPC();
    _chkOrganic();
    _chkSocial();
    _chkMobile();
    _chkForms();
    _chkIntegrations();
    ConvertmaxClient._convertmaxReady();
  };

  ConvertmaxClient.addClickTracking = function (selector) {
    if (selector) {
      // Add searcheo class to all underlying links
      var elements = _toArray(document.querySelectorAll(selector));
      elements.forEach(function (element) {
        var links = element.getElementsByTagName("a");
        for (var i = 0; i < links.length; i++) {
          links[i].classList.add("searcheo");
        }
      });
    }
  };

  ConvertmaxClient.track = function (evt_type, details) {
    var conversion_evts = ["convert", "cpc", "organic", "search", "social", "custom"];

    // Check do not track
    if (this.client.doNotTrack && conversion_evts.indexOf(evt_type) === -1) {
      if (
        evt_type === "click" &&
        details.hasOwnProperty("cm_type") &&
        details.cm_type == "search"
      ) {} else {
        return true;
      }
    }

    if (evt_type && details) {
      var payload = {
        event_type: evt_type,
        visitor: this.client.visitor,
        session_id: this.client.session_id,
        gclid: this.client.gclid,
        msclk: this.client.msclk,
        data: details
      };

      if (this.client.cf_uvid) {
        payload['cf_uvid'] = this.client.cf_uvid;
      }

      //details = JSON.stringify(details);
      if (
        evt_type === "click" ||
        evt_type === "convert" ||
        evt_type === "cpc" ||
        evt_type === "organic" ||
        evt_type === "social" ||
        evt_type === "search" ||
        evt_type === "page_view" ||
        evt_type === "add_cart" ||
        evt_type === "custom"
      ) {
        this.client.event_request.data = payload;
        this.client.event_request.post("/v1/track/", payload);
      }
    }

    return true;
  };

  // Opt a user out of data collection
  ConvertmaxClient.optoutTracking = function () {
    document.cookie =
      "cm_ignore_event=1; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/;  domain=" + this.client.rootDomain + ";";
    this.client.doNotTrack = true;
  };

  // Opt a user back in to data collection
  ConvertmaxClient.optinTracking = function () {
    document.cookie =
      "cm_ignore_event=0; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;  domain=" + this.client.rootDomain + ";";
    this.client.doNotTrack = false;
  };

  // Check a user's opt-out status
  // Returns true of user is opted out of tracking locally
  ConvertmaxClient.optoutStatus = function () {
    return this.client.doNotTrack;
  };

  // Watch for new events
  if (window.__convertmax_q !== "undefined") {
    var res = Array.prototype["push"].apply(window.__convertmax_q, arguments); // call normal behaviour
    _process_queued_event.apply(window.__convertmax_q, arguments); // finally call the callback supplied
  }

  return ConvertmaxClient;
}());

Convertmax._convertmaxLoaded();
