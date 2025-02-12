define([
    'jquery',
    'ko',
    'uiComponent',
    'ShipperHQ_AddressAutocomplete/js/google_maps_loader',
    'Magento_Checkout/js/checkout-data',
    'Magento_Customer/js/model/customer',
    'uiRegistry'
], function (
    $,
    ko,
    Component,
    GoogleMapsLoader,
    checkoutData,
    customer,
    uiRegistry
) {
    'use strict';

    return Component.extend({
        defaults: {
            imports: {
                isAddressFormVisible: '${$.parentName}:isAddressFormVisible',
                isAddressSameAsShipping: '${$.parentName}:isAddressSameAsShipping'
            }
        },

        componentForm: {
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
        },

        lookupElement: {
            street_number: 'street_1',
            route: 'street_2',
            locality: 'city',
            administrative_area_level_1: 'region',
            country: 'country_id',
            postal_code: 'postcode'
        },

        isAddressFormVisible: ko.observable(false),
        isAddressSameAsShipping: ko.observable(false),
        isGoogleMapsLoaderLoaded: ko.observable(false),
        autocompleteReadyToInit: ko.observable(false),
        isAutocompleteInitialized: ko.observable(false),

        initialize: function () {
            this._super();
            this.moduleEnabled = window.checkoutConfig.shipperhq_autocomplete.active;
            this.autocompleteBillingAddress = window.checkoutConfig.shipperhq_autocomplete.billing_autocomplete;
            this.googleMapError = false;

            this.formComponent = this.paymentCode === 'shared'
                ? 'checkout.steps.billing-step.payment.afterMethods.billing-address-form.form-fields'
                : 'checkout.steps.billing-step.payment.payments-list.' + this.paymentCode + '-form.form-fields';

            var self = this;

            window.gm_authFailure = function () {
                self.googleMapError = true;
            };

            GoogleMapsLoader.done(function () {
                self.isGoogleMapsLoaderLoaded(true);
            }).fail(function () {
                console.error("ERROR: Google maps library failed to load");
            });

            this.isGoogleMapsLoaderLoaded.subscribe(function (newValue) {
                if (customer.isLoggedIn()) {
                    self.autocompleteReadyToInit(newValue && self.isAddressFormVisible());
                } else {
                    self.autocompleteReadyToInit(newValue && !self.isAddressSameAsShipping());
                }
            });

            if (customer.isLoggedIn()) {
                this.isAddressFormVisible.subscribe(function (newValue) {
                    self.autocompleteReadyToInit(newValue && self.isGoogleMapsLoaderLoaded());
                });
            } else {
                this.isAddressSameAsShipping.subscribe(function (newValue) {
                    self.autocompleteReadyToInit(!newValue && self.isGoogleMapsLoaderLoaded());
                });
            }

            this.autocompleteReadyToInit.subscribe(function (newValue) {
                if (!newValue || self.isAutocompleteInitialized()) {
                    return;
                }

                self.initAutocomplete();
            });

        },

        initAutocomplete: function () {
            var self = this;
            var geocoder = new google.maps.Geocoder();

            if ((self.moduleEnabled !== '1' && self.googleMapError) || self.autocompleteBillingAddress !== '1') {
                return;
            }

            setTimeout(function () {
                var domID = uiRegistry.get(self.formComponent + '.street').elems()[0].uid;
                var street = $('#' + domID);

                //SHQ18-260
                var observer = new MutationObserver(function () {
                    observer.disconnect();
                    $("#" + domID).attr("autocomplete", "new-password");
                });

                street.each(function () {
                    var element = this;

                    observer.observe(element, {
                        attributes: true,
                        attributeFilter: ['autocomplete']
                    });

                    self.autocomplete = new google.maps.places.Autocomplete(
                        /** @type {!HTMLInputElement} */(this),
                        {types: ['geocode']}
                    );
                    self.autocomplete.addListener('place_changed', self.fillInAddress.bind(self, self.formComponent));

                });
                $('#' + domID).focus(self.geolocate.bind(this));

                self.isAutocompleteInitialized(true);
            }, 5000);
        },

        fillInAddress: function (formFieldPrefix) {
            var place = this.autocomplete.getPlace();

            var street = [];
            var region  = '';
            var streetNumber = '';
            var city = '';
            var postcode = '';
            var postcodeSuffix = '';
            var subpremise    = ''; // This is apartment/unit/flat number etc
            var countryId      = '';

            // MNB-574 Some European countries place the house number after the street name rather than before.
            var numberAfterStreetCountries = ['AT', 'BE', 'DK', 'DE', 'GR', 'IS', 'IT', 'NL', 'NO', 'PT', 'ES', 'SE', 'CH'];
            var numberAfterStreet          = false;

            for (var i = 0; i < place.address_components.length; i++) {
                var addressType = place.address_components[i].types[0];
                if (this.componentForm[addressType]) {
                    var value = place.address_components[i][this.componentForm[addressType]];
                    if (addressType == 'subpremise') {
                        subpremise = value;
                    } else if (addressType == 'street_number') {
                        streetNumber = value;
                    } else if (addressType == 'route') {
                        street[1] = value;
                    } else if (addressType == 'administrative_area_level_1') {
                        region = value;
                    } else if (addressType == 'sublocality_level_1') {
                        city = value;
                    } else if (addressType == 'postal_town') {
                        city = value;
                    } else if (addressType == 'locality' && (city === '' || value === 'Montréal')) {
                        //ignore if we are using one of other city values already
                        // MNB-2364 Google returns sublocality_level_1 for Montreal. Always want to use Montreal
                        city = value;
                    } else if (addressType == 'postal_code') {
                        postcode = value;
                        var thisDomID = uiRegistry.get(formFieldPrefix + '.postcode').uid
                        if ($('#'+thisDomID).length) {
                            $('#'+thisDomID).val(postcode + postcodeSuffix);
                            $('#'+thisDomID).trigger('change');
                        }
                    } else if (addressType == 'postal_code_suffix' && window.checkoutConfig.shipperhq_autocomplete.use_long_postcode === '1') {
                        postcodeSuffix = '-' + value;
                        var thisDomID = uiRegistry.get(formFieldPrefix + '.postcode').uid
                        if ($('#'+thisDomID).length) {
                            $('#'+thisDomID).val(postcode + postcodeSuffix);
                            $('#'+thisDomID).trigger('change');
                        }
                    } else {
                        var elementId = this.lookupElement[addressType];
                        if (elementId !== undefined) {
                            var thisDomID = uiRegistry.get(formFieldPrefix + '.' + elementId).uid;
                            if ($('#' + thisDomID).length) {
                                $('#' + thisDomID).val(value);
                                $('#' + thisDomID).trigger('change');
                            }

                            if (elementId === 'country_id') {
                                countryId = value;
                                numberAfterStreet = numberAfterStreetCountries.includes(countryId);
                            }
                        }
                    }
                }
            }

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

                var domID        = uiRegistry.get(formFieldPrefix + '.street').elems()[0].uid;
                var streetString = street.join(' ');

                if (countryId === 'US' && subpremise !== '') {
                    streetString += ', ' + subpremise
                }

                if ($('#' + domID).length) {
                    $('#' + domID).val(streetString);
                    $('#' + domID).trigger('change');
                }
            }

            var cityDomID = uiRegistry.get(formFieldPrefix + '.city').uid;
            if ($('#'+cityDomID).length) {
                $('#'+cityDomID).val(city);
                $('#'+cityDomID).trigger('change');
            }
            if (region != '') {
                // MNB-1966 AutoComplete does not fill in Quebec field when an accent mark is returned from Google.
                if (region === 'Québec') {
                    region = 'Quebec'
                }

                if (uiRegistry.get(formFieldPrefix + '.region_id')) {
                    var regionDomId = uiRegistry.get(formFieldPrefix + '.region_id').uid;
                    if ($('#'+regionDomId).length) {
                        //search for and select region using text
                        $('#'+regionDomId +' option')
                            .filter(function () {
                                return $.trim($(this).text()) == region;
                            })
                            .attr('selected',true);
                        $('#'+regionDomId).trigger('change');
                    }
                }
                if (uiRegistry.get(formFieldPrefix + '.region_id_input')) {
                    var regionDomId = uiRegistry.get(formFieldPrefix + '.region_id_input').uid;
                    if ($('#'+regionDomId).length) {
                        $('#'+regionDomId).val(region);
                        $('#'+regionDomId).trigger('change');
                    }
                }
            }
        },

        geolocate: function () {
            var self = this;

            if (navigator.geolocation && window.checkoutConfig.shipperhq_autocomplete.use_geolocation === '1') {
                navigator.geolocation.getCurrentPosition(function (position) {
                    var geolocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    var circle = new google.maps.Circle({
                        center: geolocation,
                        radius: position.coords.accuracy
                    });
                    self.autocomplete.setBounds(circle.getBounds());
                });
            }
        }
    });
});
