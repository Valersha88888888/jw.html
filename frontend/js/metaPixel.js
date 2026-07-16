"use strict";

(function initializeMetaPixel(windowObject, documentObject) {
    const META_PIXEL_ID = "1354332740116302";

    if (windowObject.fbq) {
        return;
    }

    const fbq = function () {
        fbq.callMethod
            ? fbq.callMethod.apply(fbq, arguments)
            : fbq.queue.push(arguments);
    };

    windowObject.fbq = fbq;
    windowObject._fbq = fbq;

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];

    const script = documentObject.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";

    const firstScript = documentObject.getElementsByTagName("script")[0];

    if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
    } else {
        documentObject.head.appendChild(script);
    }

    fbq("init", META_PIXEL_ID);
    fbq("track", "PageView");
})(window, document);