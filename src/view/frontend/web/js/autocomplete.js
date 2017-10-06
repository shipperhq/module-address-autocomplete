define([
    'jquery',
    'uiComponent',
    'ShipperHQ_AddressAutocomplete/js/google_maps_loader',
    'Magento_Checkout/js/checkout-data' ,
    'uiRegistry'
], function (
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


    GoogleMapsLoader.done(function () {
        var enabled = window.checkoutConfig.shipperhq_autocomplete.active;

        var geocoder = new google.maps.Geocoder();
        setTimeout(function () {
            if (enabled == '1') {
                console.log('skdfjlsdkfjl');
                var domID = uiRegistry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.street').elems()[0].uid;
                var street = $('#'+domID + ', [name="street[0]"]');
                street.each(function () {
                    var element = this;
                    autocomplete = new google.maps.places.Autocomplete(
                        /** @type {!HTMLInputElement} */(this),
                        {types: ['geocode']}
                    );
                    autocomplete.addListener('place_changed', fillInAddress);

                });
                $('#'+domID).focus(geolocate);
            }
        }, 5000);

    }).fail(function () {
        console.error("ERROR: Google maps library failed to load");
    });

    var fillInAddress = function () {
        var place = this.getPlace();
        // debugger;
        var street = [];
        var region  = '';
        var streetNumber = '';
        var city = '';

        for (var i = 0; i < place.address_components.length; i++) {
            var addressType = place.address_components[i].types[0];
            if (componentForm[addressType]) {
                var value = place.address_components[i][componentForm[addressType]];
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
                } else {
                    debugger;
                    var elementId = lookupElement[addressType],
                    $element = $('[name="' + elementId + '"]:visible');
                    
                    if ($element.length > 0) {
                        $element.val(value).change();
                    }
                }
            }
        }
        if (street.length > 0) {
            street[0] = streetNumber;
            var streetString = street.join(' ');
            $element = $('[name="street[0]"]:visible');
            
            if ($element.length > 0) {
                $element.val(streetString).change();
            }
        }
        $element = $('[name="city"]:visible');
        
        if ($element.length > 0) {
            $element.val(city).change();
        }
        
        if (region != '') {
            $element = $('[name="region_id"]:visible');
            
            if ($element.length > 0) {
                $element.find('option')
                    .filter(function () {
                        return $.trim($(this).text()) == region;
                    })
                    .attr('selected', true).change();
            }


            $element = $('[name="region_id_input"]:visible');
            
            if ($element.length > 0) {
                $element.val(region).change();
            }
        }
    }

    geolocate = function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
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
