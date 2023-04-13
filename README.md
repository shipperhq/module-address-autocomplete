# ShipperHQ Address Auto-Complete
Add address lookup to your Magento 2 site using the simple tool, harnessing Google's Address Auto-Complete API.

You do not need a ShipperHQ account to use this extension. For more information on ShipperHQ capabilities are available at [ShipperHQ](https://shipperhq.com/magento2)

Facts
-----
- [extension on GitHub](https://github.com/shipperhq/module-address-autocomplete)

Description
-----------
ShipperHQ Address Auto-Complete will install a simple extension in Magento 2. No ShipperHQ account is necessary and it's free to use.

The extension features address auto-complete for:

1. Guest checkout support for entering shipping address
2. Logged in customer entering a new address in their address book
3. Logged in customer entering a new shipping address at checkout

You will need a Google API key that has been enabled with “Google Places API Web Service” access

Compatibility
-------------
This module supports and is tested against the following Magento versions:

* 2.4.5-p1
* 2.4.5
* 2.4.4-p2
* 2.4.4-p1
* 2.4.4
* 2.4.3-p3
* 2.4.3-p2
* 2.4.3
* 2.4.2
* 2.4.1
* 2.4.0

per the [official Magento 2 requirements](https://experienceleague.adobe.com/docs/commerce-operations/installation-guide/system-requirements.html)

Supports both Magento Opensource (Community) and Magento Commerce (Enterprise)

Compatibility with earlier editions is possible but not maintained.

Installation Instructions
-------------------------
Install using composer by adding to your composer file using commands:

1. `composer require shipperhq/module-address-autocomplete`
2. `composer update`
3. `bin/magento setup:upgrade`

We recommend you also install our logging module

1. `composer require shipperhq/module-logger`
2. `composer update`
3. `bin/magento setup:upgrade`

Further information is available from [our help documentation](http://docs.shipperhq.com/installing-the-shipperhq-address-autocomplete-extension/)

Configuration Instructions
-------------------------

1. Once installed, go to Stores > Configuration > Sales > Shipping Settings
2. Open ShipperHQ Address Autocomplete tab and enable the extension
3. Enter your Google API key  – if you do not have a key, please register and ensure you have enabled the Google Places API services on your [Google account](https://developers.google.com/maps/documentation/places/web-service/get-api-key)
4. Save the configuration
5. Refresh the cache in Magento from System > Cache Management

Further information is available from [our help documentation](http://docs.shipperhq.com/configure-shipperhq-address-autocomplete/)

Limitations
-------

1. No support for address autocomplete on any admin forms
2. No support for address autocomplete on the billing address

Support
-------
If you have any issues with this extension, open an issue on [GitHub](https://github.com/shipperhq/module-address-autocomplete/issues).
Alternatively you can contact us via email at support@shipperhq.com or via our website https://shipperhq.com/contact

Contribution
------------
Any contribution is highly appreciated. The best way to contribute code is to open a [pull request on GitHub](https://help.github.com/articles/using-pull-requests).

License
-------
See license files

Copyright
---------
Copyright (c) 2015 Zowta LLC (http://www.ShipperHQ.com)
