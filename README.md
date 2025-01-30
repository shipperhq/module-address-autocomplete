# ShipperHQ Address Auto-Complete

The ShipperHQ Address Auto-Complete extension enhances Magento 2 stores by integrating Google's Address Auto-Complete API. This extension simplifies the checkout process by enabling address lookup functionality, improving user experience, and reducing address entry errors.

You do **not** need a ShipperHQ account to use this extension. More information on ShipperHQ capabilities is available at [ShipperHQ](https://shipperhq.com/magento2).

---

## Features

- **Seamless Address Auto-Complete**: Instantly suggest addresses as customers type.
- **Guest & Logged-In Customer Support**:
    - Auto-complete available for guest checkout shipping addresses.
    - Auto-complete for logged-in users adding a new address to their address book.
    - Supports new shipping address entry at checkout.
- **Google API Integration**: Requires a Google API key with access to the *Google Places API Web Service*.

---

## Requirements

- Magento 2.4.4+
    - Compatibility with earlier editions is possible but not maintained
    - Supports both Magento Opensource (Community) and Magento Commerce (Enterprise)

---

## Installation

Install using Composer by running the following commands:

```bash
composer require shipperhq/module-address-autocomplete
composer update
php bin/magento setup:upgrade
```

We recommend installing the ShipperHQ Logging module for enhanced debugging:

```bash
composer require shipperhq/module-logger
composer update
php bin/magento setup:upgrade
```

---

## Configuration

1. Navigate to `Stores > Configuration > Sales > Shipping Settings`.
2. Open the **ShipperHQ Address Auto-Complete** tab and enable the extension.
3. Enter your **Google API Key**. If you do not have one, register and ensure you have enabled the *Google Places API Web Service* on your [Google account](https://developers.google.com/maps/documentation/places/web-service/get-api-key).
4. Save the configuration.
5. Refresh the Magento cache from `System > Cache Management`.

For further setup details, visit [our configuration guide](http://docs.shipperhq.com/configure-shipperhq-address-autocomplete/).

---

## Limitations

- Address auto-complete is **not supported** on any admin forms.
- Address auto-complete is **not available** for billing addresses.

---

## Support

As a free extension, ShipperHQ Address Auto-Complete is provided as-is without support.

---

## Contribution

Any contribution is highly appreciated. The best way to contribute code is to open a [pull request on GitHub](https://help.github.com/articles/using-pull-requests).

---

## License

See license files.

---

## Copyright

Copyright (c) 2015 Zowta LLC ([ShipperHQ](http://www.ShipperHQ.com))
