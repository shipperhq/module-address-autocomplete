/*
 * Shipper HQ
 *
 * @category ShipperHQ
 * @package ShipperHQ_AddressAutocomplete
 * @copyright Copyright (c) 2020 Zowta LTD and Zowta LLC (http://www.ShipperHQ.com)
 * @license http://opensource.org/licenses/osl-3.0.php Open Software License (OSL 3.0)
 * @author ShipperHQ Team sales@shipperhq.com
 */

//credit: https://gist.github.com/MattSurabian/7868115
var google_maps_loaded_def = null;

define(['jquery'],function ($) {

    if (!google_maps_loaded_def) {
        google_maps_loaded_def = $.Deferred();
        window.google_maps_loaded = function () {
            google_maps_loaded_def.resolve(google.maps);
        }
        var apiKey =  window.checkoutConfig.shipperhq_autocomplete.api_key;
        if (apiKey != 'false' && apiKey !== null) {
            var url = 'https://maps.googleapis.com/maps/api/js?key=' + apiKey + '&libraries=places&callback=google_maps_loaded';
            require([url], function () {}, function (err) {
                google_maps_loaded_def.reject();
            });
        }
    }
    return google_maps_loaded_def.promise();

});
