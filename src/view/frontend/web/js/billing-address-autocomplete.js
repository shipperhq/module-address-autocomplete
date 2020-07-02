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

            if (self.moduleEnabled !== '1' && self.googleMapError) {
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
                    self.autocomplete.addListener('place_changed', self.fillInAddress.bind(self));

                });
                $('#' + domID).focus(self.geolocate.bind(this));

                self.isAutocompleteInitialized(true);
            }, 1000);
        },

        fillInAddress: function () {
            var place = this.autocomplete.getPlace();

            var street = [];
            var region  = '';
            var streetNumber = '';
            var city = '';
            var postcode = '';
            var postcodeSuffix = '';

            for (var i = 0; i < place.address_components.length; i++) {
                var addressType = place.address_components[i].types[0];
                if (this.componentForm[addressType]) {
                    var value = place.address_components[i][this.componentForm[addressType]];
                    if (addressType == 'subpremise') {
                        streetNumber = value + '/';
                    } else if (addressType == 'street_number') {
                        streetNumber = streetNumber + value;
                    } else if (addressType == 'route') {
                        street[1] = value;
                    } else if (addressType == 'administrative_area_level_1') {
                        region = value;
                    } else if (addressType == 'sublocality_level_1') {
                        city = value;
                    } else if (addressType == 'postal_town') {
                        city = value;
                    } else if (addressType == 'locality' && city == '') {
                        //ignore if we are using one of other city values already
                        city = value;
                    } else if (addressType == 'postal_code') {
                        postcode = value;
                        var thisDomID = uiRegistry.get(this.formComponent + '.postcode').uids
                        if ($('#'+thisDomID)) {
                            $('#'+thisDomID).val(postcode + postcodeSuffix);
                            $('#'+thisDomID).trigger('change');
                        }
                    } else if (addressType == 'postal_code_suffix' && window.checkoutConfig.shipperhq_autocomplete.use_long_postcode) {
                        postcodeSuffix = '-' + value;
                        var thisDomID = uiRegistry.get(this.formComponent + '.postcode').uid
                        if ($('#'+thisDomID)) {
                            $('#'+thisDomID).val(postcode + postcodeSuffix);
                            $('#'+thisDomID).trigger('change');
                        }
                    } else {
                        var elementId = this.lookupElement[addressType];
                        var thisDomID = uiRegistry.get(this.formComponent + '.' + elementId).uid;
                        if ($('#'+thisDomID)) {
                            $('#'+thisDomID).val(value);
                            $('#'+thisDomID).trigger('change');
                        }
                    }
                }
            }
            if (street.length > 0) {
                street[0] = streetNumber;
                var domID = uiRegistry.get(this.formComponent + '.street').elems()[0].uid;
                var streetString = street.join(' ');
                if ($('#'+domID)) {
                    $('#'+domID).val(streetString);
                    $('#'+domID).trigger('change');
                }
            }
            var cityDomID = uiRegistry.get(this.formComponent + '.city').uid;
            if ($('#'+cityDomID)) {
                $('#'+cityDomID).val(city);
                $('#'+cityDomID).trigger('change');
            }
            if (region != '') {
                if (uiRegistry.get(this.formComponent + '.region_id')) {
                    var regionDomId = uiRegistry.get(this.formComponent + '.region_id').uid;
                    if ($('#'+regionDomId)) {
                        //search for and select region using text
                        $('#'+regionDomId +' option')
                            .filter(function () {
                                return $.trim($(this).text()) == region;
                            })
                            .attr('selected',true);
                        $('#'+regionDomId).trigger('change');
                    }
                }
                if (uiRegistry.get(this.formComponent + '.region_id_input')) {
                    var regionDomId = uiRegistry.get(this.formComponent + '.region_id_input').uid;
                    if ($('#'+regionDomId)) {
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
