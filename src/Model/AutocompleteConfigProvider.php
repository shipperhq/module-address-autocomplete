<?php
/**
 * ShipperHQ
 *
 * @category ShipperHQ
 * @package ShipperHQ\AddressAutocomplete
 * @copyright Copyright (c) 2017 Zowta LTD and Zowta LLC (http://www.ShipperHQ.com)
 * @license http://opensource.org/licenses/osl-3.0.php Open Software License (OSL 3.0)
 * @author ShipperHQ Team sales@shipperhq.com
 */

namespace ShipperHQ\AddressAutocomplete\Model;

use Magento\Checkout\Model\ConfigProviderInterface;
use ShipperHQ\AddressAutocomplete\Helper\Data;

class AutocompleteConfigProvider implements ConfigProviderInterface
{
    /**
     * @var Data
     */
    private $helper;

    /**
     * @param Data $helper
     */
    public function __construct(
        Data $helper
    ) {

        $this->helper = $helper;
    }

    /**
     * {@inheritdoc}
     */
    public function getConfig()
    {
        $config['shipperhq_autocomplete'] = [
            'active'        => $this->helper->getConfigValue('shipping/shipper_autocomplete/active'),
            'api_key'  =>    $this->helper->getConfigValue('shipping/shipper_autocomplete/google_api_key'),
            'use_geolocation'  =>    $this->helper->getConfigValue('shipping/shipper_autocomplete/use_geolocation'),
            'use_long_postcode'  =>    $this->helper->getConfigValue('shipping/shipper_autocomplete/use_long_postcode')
        ];
        return $config;
    }
}
