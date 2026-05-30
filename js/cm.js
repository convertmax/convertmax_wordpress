/*!
 * cm_v2.js - Modern browser client for Convertmax
 * Built from the current @convertmax/js browser behavior with a legacy-friendly global API.
 */
(function initConvertmaxBrowser(window, document) {
  "use strict";

  if (!window || !document) {
    return;
  }

  var VERSION = "2.0.0";
  var DEFAULT_HOST = "https://event.convertmax.io";
  var DEFAULT_ENDPOINT_PATH = "/v1/track/";
  var DEFAULT_ANONYMOUS_ID_STORAGE_KEY = "convertmax_anonymous_id";
  var DEFAULT_VISITOR_STORAGE_KEY = "cm_visitor";
  var DEFAULT_SESSION_COOKIE_KEY = "cm_session";
  var OPT_OUT_STORAGE_KEY = "cm_ignore_event";
  var DEFAULT_SESSION_TIMEOUT_MINUTES = 35;
  var CLICK_TRACK_CLASS = "searcheo";
  var ORGANIC_HOSTS = ["bing", "google", "yahoo", "about", "ask", "aol"];
  var SOCIAL_HOSTS = [
    "facebook",
    "fb.me",
    "instagram",
    "linkedin",
    "lnkd.in",
    "pinterest",
    "twitter",
    "t.co",
    "youtube",
    "youtu.be"
  ];
  var SEARCH_QUERY_KEYS = ["q", "p", "query", "k", "keyword", "term", "text"];
  var ATTRIBUTION_PARAM_CONFIG = {
    gclid: {
      storageKey: "cm_gclid",
      envelopeKey: "gclid",
      platform: "google"
    },
    msclkid: {
      storageKey: "cm_msclk",
      envelopeKey: "msclk",
      platform: "bing"
    },
    ttclid: {
      storageKey: "cm_ttclid",
      envelopeKey: "ttclid",
      platform: "tiktok"
    },
    fbclid: {
      storageKey: "cm_fbclid",
      envelopeKey: "fbclid",
      platform: "facebook"
    },
    scclid: {
      storageKey: "cm_scclid",
      envelopeKey: "scclid",
      platform: "snapchat"
    },
    epik: {
      storageKey: "cm_epik",
      envelopeKey: "epik",
      platform: "pinterest"
    },
    twclid: {
      storageKey: "cm_twclid",
      envelopeKey: "twclid",
      platform: "twitter"
    },
    li_fat_id: {
      storageKey: "cm_li_fat_id",
      envelopeKey: "li_fat_id",
      platform: "linkedin"
    },
    tag: {
      storageKey: "cm_tag",
      envelopeKey: "tag",
      platform: "taboola"
    },
    yclid: {
      storageKey: "cm_yclid",
      envelopeKey: "yclid",
      platform: "yandex"
    },
    rdt_cid: {
      storageKey: "cm_rdt_cid",
      envelopeKey: "rdt_cid",
      platform: "reddit"
    },
    qaid: {
      storageKey: "cm_qaid",
      envelopeKey: "qaid",
      platform: "quora"
    }
  };

  function dispatchBrowserEvent(name) {
    if (typeof window.dispatchEvent !== "function") {
      return;
    }

    try {
      window.dispatchEvent(new Event(name));
    } catch (error) {
      if (typeof document.createEvent === "function") {
        var fallbackEvent = document.createEvent("Event");
        fallbackEvent.initEvent(name, true, true);
        window.dispatchEvent(fallbackEvent);
      }
    }
  }

  function getFetchImplementation(options) {
    return options.fetch || window.fetch;
  }

  function normalizeHost(host) {
    return String(host || DEFAULT_HOST).replace(/\/+$/, "");
  }

  function normalizeEndpoint(eventURL, host) {
    if (eventURL) {
      return /\/v1\/track\/?$/.test(eventURL)
        ? eventURL.replace(/\/?$/, "/")
        : normalizeHost(eventURL) + DEFAULT_ENDPOINT_PATH;
    }

    return normalizeHost(host || DEFAULT_HOST) + DEFAULT_ENDPOINT_PATH;
  }

  function createAnonymousId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return "cm_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function createSessionId(visitorPrefix) {
    var prefix = String(visitorPrefix || "cm").slice(0, 3) || "cm";
    return prefix + "_" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
  }

  function getBrowserStorageValue(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function setBrowserStorageValue(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {}
  }

  function removeBrowserStorageValue(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {}
  }

  function getRootDomain(hostname) {
    if (!hostname || hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return undefined;
    }

    var parts = hostname.split(".").filter(Boolean);
    if (parts.length < 2) {
      return undefined;
    }

    return parts.slice(-2).join(".");
  }

  function getCookieValue(name) {
    if (typeof document.cookie !== "string") {
      return null;
    }

    var prefix = name + "=";
    var parts = document.cookie.split(";");
    for (var index = 0; index < parts.length; index += 1) {
      var value = parts[index].trim();
      if (value.indexOf(prefix) === 0) {
        return decodeURIComponent(value.slice(prefix.length));
      }
    }

    return null;
  }

  function setCookieValue(name, value, expiresAt) {
    var segments = [name + "=" + encodeURIComponent(value), "path=/"];

    if (expiresAt) {
      segments.push("expires=" + new Date(expiresAt).toUTCString());
    }

    var rootDomain = getRootDomain(window.location.hostname);
    if (rootDomain) {
      segments.push("domain=" + rootDomain);
    }

    document.cookie = segments.join("; ");
  }

  function clearCookieValue(name) {
    var segments = [name + "=", "path=/", "expires=Thu, 01 Jan 1970 00:00:01 GMT"];
    var rootDomain = getRootDomain(window.location.hostname);
    if (rootDomain) {
      segments.push("domain=" + rootDomain);
    }

    document.cookie = segments.join("; ");
  }

  function getBrowserContext() {
    return {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title || undefined,
      referrer: document.referrer || undefined,
      userAgent: window.navigator.userAgent,
      language: window.navigator.language,
      screenWidth: window.screen && window.screen.width,
      screenHeight: window.screen && window.screen.height
    };
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function detectMobileUserAgent(userAgent) {
    return /android|iphone|ipad|ipod|iemobile|blackberry|opera mini|mobile/i.test(
      userAgent || ""
    );
  }

  function getQueryParams() {
    try {
      return new URLSearchParams(window.location.search);
    } catch (error) {
      return null;
    }
  }

  function getReferrerUrl() {
    if (!document.referrer) {
      return null;
    }

    try {
      return new URL(document.referrer);
    } catch (error) {
      return null;
    }
  }

  function getReferrerHost(referrerUrl) {
    return referrerUrl ? referrerUrl.hostname.replace(/^www[0-9]?\./, "") : undefined;
  }

  function findMatchingHost(host, candidates) {
    if (!host) {
      return undefined;
    }

    for (var index = 0; index < candidates.length; index += 1) {
      if (host.indexOf(candidates[index]) > -1) {
        return candidates[index];
      }
    }

    return undefined;
  }

  function cloneObject(input) {
    return Object.assign({}, input || {});
  }

  function syncAnchorsWithin(root) {
    if (!root || typeof root.querySelectorAll !== "function") {
      return;
    }

    var links = root.querySelectorAll("a");
    for (var index = 0; index < links.length; index += 1) {
      links[index].classList.add(CLICK_TRACK_CLASS);
    }
  }

  function createBrowserClient(initialOptions) {
    var options = cloneObject(initialOptions);
    var initialized = false;
    var autoPageListenersAttached = false;
    var exitFlushAttached = false;
    var clickTrackingAttached = false;
    var identifiedUserId;
    var groupedId;
    var anonymousId =
      getBrowserStorageValue(DEFAULT_VISITOR_STORAGE_KEY) || createAnonymousId();
    var sessionId;
    var lastAutoPageKey;
    var doNotTrack = Boolean(options.optOutTrackingByDefault);
    var mobile = false;
    var cfUvid;
    var attributionState = {};
    var lastReferrerSignature;
    var publicState = {
      config: {},
      debug: false,
      apiKey: undefined,
      eventURL: DEFAULT_HOST,
      visitor: anonymousId,
      session_id: undefined,
      anonymousId: anonymousId,
      doNotTrack: doNotTrack,
      mobile: false,
      gclid: undefined,
      msclk: undefined,
      cf_uvid: undefined
    };

    function updatePublicState() {
      publicState.config = cloneObject(options);
      publicState.debug = Boolean(options.debug);
      publicState.apiKey = options.apiKey || options.writeKey || undefined;
      publicState.eventURL = options.eventURL || options.host || DEFAULT_HOST;
      publicState.visitor = anonymousId;
      publicState.session_id = sessionId;
      publicState.anonymousId = anonymousId;
      publicState.doNotTrack = doNotTrack;
      publicState.mobile = mobile;
      publicState.gclid = attributionState.gclid;
      publicState.msclk = attributionState.msclk;
      publicState.cf_uvid = cfUvid;
    }

    function syncVisitorState() {
      var storageKey =
        options.anonymousIdStorageKey || DEFAULT_ANONYMOUS_ID_STORAGE_KEY;

      setBrowserStorageValue(storageKey, anonymousId);
      setBrowserStorageValue(DEFAULT_VISITOR_STORAGE_KEY, anonymousId);
      setCookieValue(DEFAULT_VISITOR_STORAGE_KEY, anonymousId, 253402300799000);
    }

    function getOrCreateSessionId() {
      var cookieSession = getCookieValue(DEFAULT_SESSION_COOKIE_KEY);
      var nextSessionId = cookieSession || createSessionId(anonymousId.slice(0, 3));
      var timeoutMinutes =
        options.sessionTimeoutMinutes || DEFAULT_SESSION_TIMEOUT_MINUTES;

      setCookieValue(
        DEFAULT_SESSION_COOKIE_KEY,
        nextSessionId,
        Date.now() + timeoutMinutes * 60 * 1000
      );

      return nextSessionId;
    }

    function getAutoPageProperties() {
      return {
        page: window.location.href,
        path: window.location.pathname,
        search: window.location.search || undefined,
        title: document.title || undefined
      };
    }

    function getAutoPageKey() {
      return window.location.pathname + window.location.search;
    }

    async function sendEnvelope(envelope, transportOptions) {
      var fetchImpl = getFetchImplementation(transportOptions);
      if (!fetchImpl) {
        throw new Error("Convertmax requires window.fetch in the browser runtime.");
      }

      var endpoint = normalizeEndpoint(
        transportOptions.eventURL,
        transportOptions.host
      );
      var maxRetries = transportOptions.maxRetries || 0;
      var retryDelayMs = transportOptions.retryDelayMs || 250;
      var attempt = 0;
      var lastError;

      while (attempt <= maxRetries) {
        try {
          var response = await fetchImpl(endpoint, {
            method: "POST",
            headers: Object.assign(
              { "content-type": "application/json" },
              transportOptions.apiKey || transportOptions.writeKey
                ? {
                    authorization:
                      "Bearer " +
                      (transportOptions.apiKey || transportOptions.writeKey)
                  }
                : {}
            ),
            body: JSON.stringify(envelope),
            keepalive: true
          });

          if (!response.ok) {
            throw new Error(
              "Convertmax request failed with status " + response.status
            );
          }

          return;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt === maxRetries) {
            break;
          }

          attempt += 1;
          await delay(retryDelayMs * attempt);
        }
      }

      throw lastError || new Error("Convertmax request failed");
    }

    function createBaseEnvelope() {
      return Object.assign(
        {
          anonymousId: anonymousId,
          sessionId: sessionId,
          context: Object.assign(
            {},
            getBrowserContext(),
            mobile ? { deviceType: "mobile" } : {},
            cfUvid ? { cfUvid: cfUvid } : {}
          ),
          timestamp: new Date().toISOString()
        },
        attributionState,
        cfUvid ? { cf_uvid: cfUvid } : {}
      );
    }

    async function dispatch(envelope) {
      if (options.disabled || doNotTrack) {
        return;
      }

      if (!initialized) {
        await init();
      }

      if (options.debug && window.console && typeof window.console.debug === "function") {
        window.console.debug("[convertmax]", envelope);
      }

      await sendEnvelope(envelope, options);
    }

    async function emitAutoPageView() {
      var nextKey = getAutoPageKey();
      if (!nextKey || nextKey === lastAutoPageKey) {
        return;
      }

      lastAutoPageKey = nextKey;
      await dispatch(
        Object.assign(
          {
            type: "track",
            event: "page_view",
            properties: getAutoPageProperties(),
            userId: identifiedUserId
          },
          createBaseEnvelope()
        )
      );
    }

    function attachAutoPageListeners() {
      if (autoPageListenersAttached || !window.history) {
        return;
      }

      autoPageListenersAttached = true;

      var onRouteChange = function () {
        void emitAutoPageView();
      };

      var originalPushState = window.history.pushState.bind(window.history);
      var originalReplaceState = window.history.replaceState.bind(window.history);

      window.history.pushState = function () {
        originalPushState.apply(window.history, arguments);
        onRouteChange();
      };

      window.history.replaceState = function () {
        originalReplaceState.apply(window.history, arguments);
        onRouteChange();
      };

      window.addEventListener("popstate", onRouteChange);
    }

    function getStoredAttributionValue(key) {
      var raw = getBrowserStorageValue(ATTRIBUTION_PARAM_CONFIG[key].storageKey);
      if (!raw) {
        return null;
      }

      try {
        var parsed = JSON.parse(raw);
        if (!parsed.value || !parsed.expiryDate || Date.now() >= parsed.expiryDate) {
          removeBrowserStorageValue(ATTRIBUTION_PARAM_CONFIG[key].storageKey);
          return null;
        }

        return parsed.value;
      } catch (error) {
        removeBrowserStorageValue(ATTRIBUTION_PARAM_CONFIG[key].storageKey);
        return null;
      }
    }

    function storeAttributionValue(key, value) {
      var clkExpiryDays = options.clkExpiryDays || 90;
      setBrowserStorageValue(
        ATTRIBUTION_PARAM_CONFIG[key].storageKey,
        JSON.stringify({
          value: value,
          expiryDate: Date.now() + clkExpiryDays * 24 * 60 * 60 * 1000
        })
      );
    }

    function refreshAttributionState(params) {
      var nextState = {};
      Object.keys(ATTRIBUTION_PARAM_CONFIG).forEach(function (key) {
        var config = ATTRIBUTION_PARAM_CONFIG[key];
        var value = (params && params.get(key)) || getStoredAttributionValue(key);
        if (value) {
          nextState[config.envelopeKey] = value;
        }
      });
      attributionState = nextState;
    }

    async function detectAttribution() {
      var params = getQueryParams();
      if (!params) {
        return;
      }

      var detectedKeys = [];
      Object.keys(ATTRIBUTION_PARAM_CONFIG).forEach(function (key) {
        var value = params.get(key);
        if (!value) {
          return;
        }

        storeAttributionValue(key, value);
        detectedKeys.push(key);
      });

      refreshAttributionState(params);
      updatePublicState();

      if (!detectedKeys.length) {
        return;
      }

      var firstDetectedKey = detectedKeys[0];
      var properties = {
        source: "api",
        page: window.location.href,
        cpc: ATTRIBUTION_PARAM_CONFIG[firstDetectedKey].platform
      };

      params.forEach(function (value, key) {
        if (
          key.indexOf("utm_") === 0 ||
          key.indexOf("keyword") > -1 ||
          key.indexOf("term") > -1 ||
          Object.prototype.hasOwnProperty.call(ATTRIBUTION_PARAM_CONFIG, key)
        ) {
          properties[key] = value;
        }
      });

      detectedKeys.forEach(function (key) {
        properties[key] = params.get(key);
      });

      await dispatch(
        Object.assign(
          {
            type: "track",
            event: "cpc",
            properties: properties,
            userId: identifiedUserId
          },
          createBaseEnvelope()
        )
      );
    }

    async function detectReferrerTraffic() {
      var referrerUrl = getReferrerUrl();
      var referrer = referrerUrl && referrerUrl.toString();
      if (!referrer) {
        return;
      }

      var signature = window.location.href + "|" + referrer;
      if (signature === lastReferrerSignature) {
        return;
      }

      var hasPaidAttribution = Object.keys(attributionState).length > 0;
      var host = getReferrerHost(referrerUrl);
      var organicHost =
        options.autoOrganic === false ? undefined : findMatchingHost(host, ORGANIC_HOSTS);

      if (organicHost && !hasPaidAttribution) {
        lastReferrerSignature = signature;

        await dispatch(
          Object.assign(
            {
              type: "track",
              event: "organic",
              properties: Object.assign({}, getAutoPageProperties(), {
                host: organicHost,
                referrer: referrer
              }),
              userId: identifiedUserId
            },
            createBaseEnvelope()
          )
        );

        if (options.autoSearch !== false && referrerUrl) {
          var query = null;
          for (var index = 0; index < SEARCH_QUERY_KEYS.length; index += 1) {
            query = referrerUrl.searchParams.get(SEARCH_QUERY_KEYS[index]);
            if (query) {
              break;
            }
          }

          if (query) {
            await dispatch(
              Object.assign(
                {
                  type: "track",
                  event: "search",
                  properties: Object.assign({}, getAutoPageProperties(), {
                    engine: organicHost,
                    query: query,
                    referrer: referrer
                  }),
                  userId: identifiedUserId
                },
                createBaseEnvelope()
              )
            );
          }
        }

        return;
      }

      var socialHost =
        options.autoSocial === false ? undefined : findMatchingHost(host, SOCIAL_HOSTS);
      if (socialHost && !hasPaidAttribution) {
        lastReferrerSignature = signature;

        await dispatch(
          Object.assign(
            {
              type: "track",
              event: "social",
              properties: Object.assign({}, getAutoPageProperties(), {
                host: socialHost,
                referrer: referrer
              }),
              userId: identifiedUserId
            },
            createBaseEnvelope()
          )
        );
      }
    }

    function populateFormHelpers() {
      var visitorInputs = document.querySelectorAll('input[name="cm_visitor"]');
      var sessionInputs = document.querySelectorAll('input[name="cm_session"]');

      for (var index = 0; index < visitorInputs.length; index += 1) {
        visitorInputs[index].value = anonymousId;
      }

      for (var sessionIndex = 0; sessionIndex < sessionInputs.length; sessionIndex += 1) {
        sessionInputs[sessionIndex].value = sessionId || "";
      }
    }

    function captureIntegrations() {
      cfUvid = getBrowserStorageValue("cf_uvid") || undefined;
      updatePublicState();
    }

    function detectMobile() {
      mobile = detectMobileUserAgent(window.navigator.userAgent);
      updatePublicState();
    }

    function hydrateDoNotTrack() {
      var browserDoNotTrack =
        window.doNotTrack === "1" ||
        window.navigator.doNotTrack === "1" ||
        window.navigator.doNotTrack === "yes" ||
        window.navigator.msDoNotTrack === "1";

      if (
        browserDoNotTrack ||
        getBrowserStorageValue(OPT_OUT_STORAGE_KEY) === "1" ||
        getCookieValue(OPT_OUT_STORAGE_KEY) === "1"
      ) {
        doNotTrack = true;
      }

      updatePublicState();
    }

    function attachExitFlush() {
      if (exitFlushAttached) {
        return;
      }

      exitFlushAttached = true;

      window.addEventListener(
        "pagehide",
        function () {
          if (options.disabled) {
            return;
          }

          void sendEnvelope(
            Object.assign(
              {
                type: "page",
                name: "page_exit",
                properties: {
                  event_type: "background_flush",
                  page: window.location.href
                },
                userId: identifiedUserId
              },
              createBaseEnvelope()
            ),
            options
          );
        },
        { once: true }
      );
    }

    function attachClickTracking() {
      if (clickTrackingAttached) {
        return;
      }

      clickTrackingAttached = true;
      var seedElements = document.querySelectorAll("." + CLICK_TRACK_CLASS);
      for (var index = 0; index < seedElements.length; index += 1) {
        syncAnchorsWithin(seedElements[index]);
      }

      document.addEventListener("click", function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== "function") {
          return;
        }

        var anchor = target.closest("a");
        if (!anchor || !anchor.classList || !anchor.classList.contains(CLICK_TRACK_CLASS)) {
          return;
        }

        var cmType = anchor.getAttribute("data-sio-type");
        var eventType = cmType === "add-cart" ? "add_cart" : "click";

        void api.track(eventType, {
          cm_type: cmType || undefined,
          cm_target: anchor.href
        });
      });
    }

    async function applyBrowserLifecycle() {
      hydrateDoNotTrack();
      syncVisitorState();
      sessionId = getOrCreateSessionId();
      updatePublicState();

      attachClickTracking();

      if (options.autoPage) {
        attachAutoPageListeners();
        await emitAutoPageView();
      }

      if (options.autoCpc !== false) {
        await detectAttribution();
      } else {
        refreshAttributionState(getQueryParams());
        updatePublicState();
      }

      await detectReferrerTraffic();

      if (options.autoMobile !== false) {
        detectMobile();
      }

      if (options.chkForms !== false) {
        populateFormHelpers();
      }

      if (options.captureCfUvid === true) {
        captureIntegrations();
      }

      attachExitFlush();
      dispatchBrowserEvent("convertmaxReady");
      api.ready = true;
      if (window.Convertmax) {
        window.Convertmax.ready = true;
      }
    }

    async function init() {
      if (initialized) {
        return;
      }

      initialized = true;
      await applyBrowserLifecycle();
    }

    var api = {
      client: publicState,
      async init() {
        await init();
      },
      async config(nextOptions) {
        var mergedOptions = Object.assign({}, options, nextOptions || {});
        if (!mergedOptions.host && mergedOptions.eventURL) {
          mergedOptions.host = mergedOptions.eventURL;
        }
        if (!mergedOptions.host) {
          mergedOptions.host = DEFAULT_HOST;
        }

        options = mergedOptions;
        initialized = true;
        await applyBrowserLifecycle();
      },
      async track(event, properties) {
        await dispatch(
          Object.assign(
            {
              type: "track",
              event: event,
              properties: properties || {},
              userId: identifiedUserId
            },
            createBaseEnvelope()
          )
        );
      },
      async identify(userId, traits) {
        identifiedUserId = userId || identifiedUserId;
        await dispatch(
          Object.assign(
            {
              type: "identify",
              userId: identifiedUserId,
              traits: traits || {}
            },
            createBaseEnvelope()
          )
        );
      },
      async page(name, properties) {
        await dispatch(
          Object.assign(
            {
              type: "page",
              name: name,
              properties: groupedId
                ? Object.assign({}, properties || {}, { groupId: groupedId })
                : properties || {},
              userId: identifiedUserId
            },
            createBaseEnvelope()
          )
        );
      },
      async group(groupId, traits) {
        groupedId = groupId;
        await dispatch(
          Object.assign(
            {
              type: "group",
              groupId: groupId,
              traits: traits || {},
              userId: identifiedUserId
            },
            createBaseEnvelope()
          )
        );
      },
      async alias(userId) {
        var previousId = identifiedUserId;
        identifiedUserId = userId;
        await dispatch(
          Object.assign(
            {
              type: "alias",
              userId: userId,
              previousId: previousId
            },
            createBaseEnvelope()
          )
        );
      },
      addClickTracking(selector) {
        if (!selector) {
          return;
        }

        var elements = document.querySelectorAll(selector);
        for (var index = 0; index < elements.length; index += 1) {
          var element = elements[index];
          if (element.tagName === "A") {
            element.classList.add(CLICK_TRACK_CLASS);
          } else {
            syncAnchorsWithin(element);
          }
        }
      },
      optoutTracking() {
        doNotTrack = true;
        setBrowserStorageValue(OPT_OUT_STORAGE_KEY, "1");
        setCookieValue(OPT_OUT_STORAGE_KEY, "1", 253402300799000);
        updatePublicState();
      },
      optinTracking() {
        doNotTrack = false;
        removeBrowserStorageValue(OPT_OUT_STORAGE_KEY);
        clearCookieValue(OPT_OUT_STORAGE_KEY);
        updatePublicState();
      },
      optoutStatus() {
        return doNotTrack;
      },
      reset() {
        identifiedUserId = undefined;
        groupedId = undefined;
        anonymousId = createAnonymousId();
        sessionId = getOrCreateSessionId();
        attributionState = {};
        syncVisitorState();
        updatePublicState();
      }
    };

    updatePublicState();
    return api;
  }

  var client = createBrowserClient({ host: DEFAULT_HOST });
  var queuedEntries = Array.isArray(window.__convertmax_q) ? window.__convertmax_q : [];
  window.__convertmax_q = queuedEntries;

  function toArray(entry) {
    if (Array.isArray(entry)) {
      return entry;
    }

    try {
      return Array.prototype.slice.call(entry);
    } catch (error) {
      return [entry];
    }
  }

  function invokeCommand(entry) {
    var args = toArray(entry);
    var action = args[0];

    if (typeof action !== "string") {
      return undefined;
    }

    switch (action) {
      case "config":
        return client.config(args[1] || {});
      case "init":
        return client.init();
      case "track":
        return client.track(args[1], args[2] || {});
      case "identify":
        return client.identify(args[1], args[2] || {});
      case "page":
        return client.page(args[1], args[2] || {});
      case "group":
        return client.group(args[1], args[2] || {});
      case "alias":
        return client.alias(args[1]);
      case "addClickTracking":
        return client.addClickTracking(args[1]);
      case "optoutTracking":
        return client.optoutTracking();
      case "optinTracking":
        return client.optinTracking();
      case "reset":
        return client.reset();
      default:
        return undefined;
    }
  }

  function Convertmax() {
    return invokeCommand(arguments);
  }

  Convertmax.client = client.client;
  Convertmax.loaded = true;
  Convertmax.ready = false;
  Convertmax.version = VERSION;
  Convertmax.init = function () {
    return client.init();
  };
  Convertmax.config = function (config) {
    return client.config(config);
  };
  Convertmax.track = function (event, properties) {
    return client.track(event, properties);
  };
  Convertmax.identify = function (userId, traits) {
    return client.identify(userId, traits);
  };
  Convertmax.page = function (name, properties) {
    return client.page(name, properties);
  };
  Convertmax.group = function (groupId, traits) {
    return client.group(groupId, traits);
  };
  Convertmax.alias = function (userId) {
    return client.alias(userId);
  };
  Convertmax.addClickTracking = function (selector) {
    return client.addClickTracking(selector);
  };
  Convertmax.optoutTracking = function () {
    return client.optoutTracking();
  };
  Convertmax.optinTracking = function () {
    return client.optinTracking();
  };
  Convertmax.optoutStatus = function () {
    return client.optoutStatus();
  };
  Convertmax.reset = function () {
    return client.reset();
  };

  window.Convertmax = Convertmax;

  var queuePush = Array.prototype.push.bind(queuedEntries);
  queuedEntries.push = function () {
    var length = queuePush.apply(queuedEntries, arguments);
    for (var index = 0; index < arguments.length; index += 1) {
      invokeCommand(arguments[index]);
    }
    return length;
  };

  dispatchBrowserEvent("convertmaxLoaded");

  queuedEntries.slice().forEach(function (entry) {
    invokeCommand(entry);
  });
})(window, document);
