/**
 * ShipperHQ
 *
 * @category ShipperHQ
 * @package ShipperHQ\AddressAutocomplete
 * @copyright Copyright (c) 2020 Zowta LTD and Zowta LLC (http://www.ShipperHQ.com)
 * @license http://opensource.org/licenses/osl-3.0.php Open Software License (OSL 3.0)
 * @author ShipperHQ Team sales@shipperhq.com
 */

var google_maps_loaded_def = null;

define(['jquery'], function ($) {

    if (!google_maps_loaded_def) {
        google_maps_loaded_def = $.Deferred();

        var apiKey = window.checkoutConfig.shipperhq_autocomplete.api_key;

        if (apiKey !== 'false' && apiKey !== null) {
            // Google's recommended inline bootstrap loader
            (function(g) {
                var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__",
                    m = document, b = window;
                b = b[c] || (b[c] = {});
                var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams,
                u = () => h || (h = new Promise(async (f, n) => {
                    await (a = m.createElement("script"));
                    e.set("libraries", [...r] + "");
                    for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
                    e.set("callback", c + ".maps." + q);
                    a.src = `https://maps.googleapis.com/maps/api/js?` + e;
                    d[q] = f;
                    a.onerror = () => h = n(Error(p + " could not load."));
                    a.nonce = m.querySelector("script[nonce]")?.nonce || "";
                    m.head.append(a);
                }));
                d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
            })({
                key: apiKey,
                v: "weekly"
            });

            // Wait for importLibrary to be available, then load the core maps library
            var attempts = 0;
            var maxAttempts = 200; // 10 seconds with 50ms intervals

            var checkInterval = setInterval(function() {
                attempts++;

                if (window.google && window.google.maps && typeof window.google.maps.importLibrary === 'function') {
                    clearInterval(checkInterval);

                    // Load the core maps library to ensure basic classes are available
                    google.maps.importLibrary("maps").then(function() {
                        google_maps_loaded_def.resolve(google.maps);
                    }).catch(function(error) {
                        google_maps_loaded_def.reject("Failed to load maps library: " + error);
                    });
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    google_maps_loaded_def.reject("Google Maps importLibrary not available after timeout");
                }
            }, 50);
        } else {
            google_maps_loaded_def.reject("Google Maps API key missing");
        }
    }

    return google_maps_loaded_def.promise();
});
