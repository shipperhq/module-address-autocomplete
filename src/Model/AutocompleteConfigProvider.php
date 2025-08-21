<?php
/**
 *
 * ShipperHQ Address AutoComplete Module
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * ShipperHQ
 *
 * @category  ShipperHQ
 * @package   ShipperHQ\AddressAutocomplete
 * @copyright Copyright (c) 2017 Zowta LLC (http://www.ShipperHQ.com)
 * @license   http://opensource.org/licenses/osl-3.0.php Open Software License (OSL 3.0)
 * @author    ShipperHQ Team sales@shipperhq.com
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
