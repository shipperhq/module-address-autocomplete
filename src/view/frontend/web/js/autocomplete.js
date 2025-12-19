/**
 * ShipperHQ
 *
 * @category ShipperHQ
 * @package ShipperHQ\AddressAutocomplete
 * @copyright Copyright (c) 2020 Zowta LTD and Zowta LLC (http://www.ShipperHQ.com)
 * @license http://opensource.org/licenses/osl-3.0.php Open Software License (OSL 3.0)
 * @author ShipperHQ Team sales@shipperhq.com
 */

define(
    [
    'jquery',
    'uiComponent',
    'ShipperHQ_AddressAutocomplete/js/google_maps_loader',
    'Magento_Checkout/js/checkout-data' ,
    'uiRegistry'
    ],
    function (
        $,
        Component,
        GoogleMapsLoader,
        checkoutData,
        uiRegistry
    ) {
        var componentForm = {
            subpremise: 'short_name',
            street_number: 'short_name',
            route: 'long_name',
            locality: 'long_name',
            administrative_area_level_1: 'long_name',
            country: 'short_name',
            postal_code: 'short_name',
            postal_code_suffix: 'short_name',
            postal_town: 'short_name',
            sublocality_level_1: 'short_name'
        };

        var lookupElement = {
            street_number: 'street_1',
            route: 'street_2',
            locality: 'city',
            administrative_area_level_1: 'region',
            country: 'country_id',
            postal_code: 'postcode'
        };

        var googleMapError    = false;
        var placeAutocomplete = null;
        window.gm_authFailure = function () {
            $('input[name^="street"]').prop('disabled', false).prop('placeholder', '').removeAttr("style");

            // Cleanup any Google widget we injected
            try {
                if (placeAutocomplete && placeAutocomplete.remove) {
                    placeAutocomplete.remove();
                } else {
                    $('gmp-place-autocomplete.shipperhq-place-autocomplete').remove();
                }
            } catch (e) {}

            // Legacy cleanup (no-op for the new widget)
            if (google.maps && google.maps.event && $('input[name^="street"]').length) {
                google.maps.event.clearInstanceListeners($('input[name^="street"]')[0]);
            }
            $(".pac-container").remove();
            googleMapError = true;
        };

        // MNB-574 Some European countries place the house number after the street name rather than before.
        var numberAfterStreetCountries = ['AT', 'BE', 'DK', 'DE', 'GR', 'IS', 'IT', 'NL', 'NO', 'PT', 'ES', 'SE', 'CH'];
        var numberAfterStreet          = false;

        GoogleMapsLoader.done(
            function () {
                var enabled = window.checkoutConfig.shipperhq_autocomplete.active;

                function initializeWhenReady() {
                    if (googleMapError || enabled !== '1') {
                        return;
                    }

                    var streetComponent = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.street');

                    if (!streetComponent || !streetComponent.elems || !streetComponent.elems()[0]) {
                        // Street field not ready yet, check again in 100ms
                        setTimeout(initializeWhenReady, 100);
                        return;
                    }

                    var domID = streetComponent.elems()[0].uid;
                    var street = $('#' + domID);

                    if (!street.length) {
                        // DOM element not ready yet, check again in 100ms
                        setTimeout(initializeWhenReady, 100);
                        return;
                    }

                    // Street field is ready, initialize autocomplete
                    initAutocomplete(domID, street);
                }

                function initAutocomplete(domID, street) {

                                // SHQ18-260 Disable browser autofill to avoid conflicts
                                var observer = new MutationObserver(
                                    function () {
                                        observer.disconnect();
                                        $("#" + domID).attr("autocomplete", "new-password");
                                    }
                                );

                                street.each(
                                    function () {
                                        var self = this;

                                        observer.observe(
                                            self,
                                            {
                                                attributes: true,
                                                attributeFilter: ['autocomplete']
                                            }
                                        );

                                        google.maps.importLibrary('places').then(function () {
                                            // Only inject once per checkout render.
                                            if (!placeAutocomplete || !document.body.contains(placeAutocomplete)) {
                                                placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({});
                                                placeAutocomplete.classList.add('shipperhq-place-autocomplete');
                                                placeAutocomplete.style.width = '100%';

                                                // Insert the widget above the street address line 1 field.
                                                var $street = $(self);
                                                var $field = $street.closest('.field');
                                                var $wrapper = $('<div class="field shipperhq-place-autocomplete-field"><div class="control"></div></div>');
                                                $wrapper.find('.control')[0].appendChild(placeAutocomplete);

                                                if ($field.length) {
                                                    $wrapper.insertBefore($field);
                                                } else {
                                                    $wrapper.insertBefore($street);
                                                }

                                                // Bias results to the user's location when focused.
                                                placeAutocomplete.addEventListener('focus', geolocate);

                                                // Handle user selection on the autocomplete widget.
                                                placeAutocomplete.addEventListener('gmp-select', async function (event) {
                                                    try {
                                                        var place = event.placePrediction.toPlace();
                                                        await place.fetchFields({ fields: ['addressComponents'] });
                                                        fillInAddress(place);
                                                    } catch (e) {
                                                        console.error('ERROR: Failed to fetch place details', e);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                );
                                $('#' + domID).focus(geolocate);
                }

                // Start checking for street field availability
                initializeWhenReady();
            }
        ).fail(
            function () {
                console.error("ERROR: Google maps library failed to load");
            }
        );

        var fillInAddress = function (place) {
            // In the new Places widget flow, place is a google.maps.places.Place.
            // Fall back to the legacy Autocomplete flow if needed.
            place = place || (autocomplete && autocomplete.getPlace ? autocomplete.getPlace() : null);
            if (!place) { return; }

            // Normalize address components between legacy (address_components) and new (addressComponents) APIs.
            if (!place.address_components && place.addressComponents) {
                place.address_components = [];
                for (var aci = 0; aci < place.addressComponents.length; aci++) {
                    var comp = place.addressComponents[aci];
                    if (!comp || !comp.types) { continue; }
                    for (var ti = 0; ti < comp.types.length; ti++) {
                        place.address_components.push({
                            types: [comp.types[ti]],
                            short_name: comp.shortText,
                            long_name: comp.longText
                        });
                    }
                }
            }

            if (!place.address_components) { return; }

            var street         = [];
            var region         = '';
            var streetNumber   = '';
            var city           = '';
            var postcode       = '';
            var postcodeSuffix = '';
            var subpremise    = ''; // This is apartment/unit/flat number etc
            var countryId      = '';

            for (var i = 0; i < place.address_components.length; i++) {
                var addressType = place.address_components[i].types[0];
                if (componentForm[addressType]) {
                    var value = place.address_components[i][componentForm[addressType]];
                    if (addressType === 'subpremise') {
                        subpremise = value;
                    } else if (addressType === 'street_number') {
                        streetNumber = value;
                    } else if (addressType === 'route') {
                        street[1] = value;
                    } else if (addressType === 'administrative_area_level_1') {
                        region = value;
                    } else if (addressType === 'sublocality_level_1') {
                        city = value;
                    } else if (addressType === 'postal_town') {
                        city = value;
                    } else if (addressType === 'locality' && (city === '' || value === 'Montréal')) {
                        // Ignore if we are using one of other city values already.
                        // MNB-2364 Google returns sublocality_level_1 for Montreal. Always want to use Montreal
                        city = value;
                    } else if (addressType === 'postal_code') {
                        postcode      = value;
                        var thisDomID = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.postcode').uid
                        if ($('#' + thisDomID).length) {
                            $('#' + thisDomID).val(postcode + postcodeSuffix);
                            $('#' + thisDomID).trigger('change');
                        }
                    } else if (addressType === 'postal_code_suffix' && window.checkoutConfig.shipperhq_autocomplete.use_long_postcode === '1') {
                        postcodeSuffix = '-' + value;
                        var thisDomID  = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.postcode').uid
                        if ($('#' + thisDomID).length) {
                            $('#' + thisDomID).val(postcode + postcodeSuffix);
                            $('#' + thisDomID).trigger('change');
                        }
                    } else {
                        var elementId = lookupElement[addressType];
                        if (elementId !== undefined) {
                            var thisDomID = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.' + elementId).uid;
                            if ($('#' + thisDomID).length) {
                                $('#' + thisDomID).val(value);
                                $('#' + thisDomID).trigger('change');
                            }

                            if (elementId === 'country_id') {
                                countryId = value;
                                numberAfterStreet = numberAfterStreetCountries.includes(countryId);
                            }
                        }
                    }//end if
                }//end if
            }//end for

            // SHQ23-326 US Address Format is street address, unit or apartment number
            if (subpremise.length > 0 && countryId !== 'US') {
                streetNumber = subpremise + '/' + streetNumber;
            }

            if (street.length > 0) {
                if (numberAfterStreet) {
                    street[0] = street[1];
                    street[1] = streetNumber;
                } else {
                    street[0] = streetNumber;
                }

                var domID        = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.street').elems()[0].uid;
                var streetString = street.join(' ');

                if (countryId === 'US' && subpremise !== '') {
                    streetString += ', ' + subpremise
                }

                if ($('#' + domID).length) {
                    $('#' + domID).val(streetString);
                    $('#' + domID).trigger('change');
                }
            }

            var cityDomID = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.city').uid;
            if ($('#' + cityDomID).length) {
                $('#' + cityDomID).val(city);
                $('#' + cityDomID).trigger('change');
            }

            if (region !== '') {
                // MNB-1966 AutoComplete does not fill in Quebec field when an accent mark is returned from Google.
                if (region === 'Québec') {
                    region = 'Quebec'
                }

                if (uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.region_id')) {
                    var regionDomId = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.region_id').uid;
                    if ($('#' + regionDomId).length) {
                        // Search for and select region using text.
                        $('#' + regionDomId + ' option')
                            .filter(
                                function () {
                                    return $.trim($(this).text()) == region;
                                }
                            )
                            .attr('selected',true);
                        $('#' + regionDomId).trigger('change');
                    }
                }

                if (uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.region_id_input')) {
                    var regionDomId = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.region_id_input').uid;
                    if ($('#' + regionDomId).length) {
                        $('#' + regionDomId).val(region);
                        $('#' + regionDomId).trigger('change');
                    }
                }
            }//end if
        }

        geolocate = function () {
            if (navigator.geolocation && window.checkoutConfig.shipperhq_autocomplete.use_geolocation === '1') {
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        var geolocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        if (placeAutocomplete) {
                            // PlaceAutocompleteElement uses locationBias/locationRestriction instead of setBounds().
                            placeAutocomplete.locationBias = {
                                center: geolocation,
                                radius: position.coords.accuracy
                            };
                        } else if (autocomplete && autocomplete.setBounds) {
                            // Legacy fallback.
                            var circle = new google.maps.Circle({
                                center: geolocation,
                                radius: position.coords.accuracy
                            });
                            autocomplete.setBounds(circle.getBounds());
                        }
                    }
                );
            }
        }
        return Component;
    }
);
