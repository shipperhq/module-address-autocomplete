define([
    'jquery',
    'uiComponent',
    'ShipperHQ_AddressAutocomplete/js/google_maps_loader',
    'Magento_Checkout/js/checkout-data' ,
    'uiRegistry'
], function(
    $, Component, GoogleMapsLoader, checkoutData, uiRegistry
){

    var componentForm = {
        street_number: 'short_name',
        route: 'long_name',
        locality: 'long_name',
        administrative_area_level_1: 'long_name',
        country: 'short_name',
        postal_code: 'short_name'
    };

    var lookupElement = {
        street_number: 'street_1',
        route: 'street_2',
        locality: 'city',
        administrative_area_level_1: 'region',
        country: 'country_id',
        postal_code: 'postcode'
    };


    GoogleMapsLoader.done(function(){
        var enabled = window.checkoutConfig.shipperhq_autocomplete.active;

        var geocoder = new google.maps.Geocoder();
        setTimeout(function () {
            if(enabled == '1') {
                var domID = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.street').elems()[0].uid;

                var street = $('#'+domID);
                street.each(function() {
                    var element = this;
                    autocomplete = new google.maps.places.Autocomplete(
                        /** @type {!HTMLInputElement} */(this),
                        {types: ['geocode']});
                    autocomplete.addListener('place_changed', fillInAddress);

                });
                $('#'+domID).focus(geolocate);
            }
        }, 5000);

    }).fail(function(){
        console.error("ERROR: Google maps library failed to load");
    });

    var fillInAddress = function() {
        var place = autocomplete.getPlace();

        var street = [];
        var region  = '';

        for (var i = 0; i < place.address_components.length; i++) {
            var addressType = place.address_components[i].types[0];
            if (componentForm[addressType]) {
                var value = place.address_components[i][componentForm[addressType]];
                if(addressType == 'street_number') {
                    street[0] = value;
                }
                else if(addressType == 'route') {
                    street[1] = value;
                }
                else if (addressType == 'administrative_area_level_1') {
                    region = value;
                }
                else {
                    var elementId = lookupElement[addressType];
                    var thisDomID = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.'+ elementId).uid;
                    if($('#'+thisDomID)) {
                        $('#'+thisDomID).val(value);
                        $('#'+thisDomID).trigger('change');
                    }
                }
            }
        }
        if(street.length > 0) {
            var domID = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.street').elems()[0].uid;
            var streetString = street.join(' ');
            if($('#'+domID)) {
                $('#'+domID).val(streetString);
                $('#'+domID).trigger('change');

            }
        }

        if(region != '') {
            if(uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.region_id')) {
                var regionDomId = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.region_id').uid;
                if($('#'+regionDomId)) {
                    //search for and select region using text
                    $('#'+regionDomId +' option')
                        .filter(function() {return $.trim( $(this).text() ) == region; })
                        .attr('selected',true);
                    $('#'+regionDomId).trigger('change');
                }
            }
            if(uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.region_id_input')) {
                var regionDomId = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.region_id_input').uid;
                if($('#'+regionDomId)) {
                    $('#'+regionDomId).val(region);
                    $('#'+regionDomId).trigger('change');
                }
            }
        }
    }

    geolocate = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var geolocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                var circle = new google.maps.Circle({
                    center: geolocation,
                    radius: position.coords.accuracy
                });
                autocomplete.setBounds(circle.getBounds());
            });
        }
    }
    return Component;

});
