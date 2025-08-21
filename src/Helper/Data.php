<?php
/**
 *
 * ShipperHQ
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
 * ShipperHQ Shipping
 *
 * @category  ShipperHQ
 * @package   ShipperHQ\AddressAutocomplete
 * @copyright Copyright (c) 2021 Zowta LLC (http://www.ShipperHQ.com)
 * @license   http://opensource.org/licenses/osl-3.0.php Open Software License (OSL 3.0)
 * @author    ShipperHQ Team sales@shipperhq.com
 */

namespace ShipperHQ\AddressAutocomplete\Helper;

use Magento\Store\Model\ScopeInterface;

/**
 * Shipping data helper
 */
class Data extends \Magento\Framework\App\Helper\AbstractHelper
{
    private $storeId;

    public function __construct(\Magento\Framework\App\Helper\Context $context)
    {
        parent::__construct($context);
    }


    /**
     * Gets a config flag
     *
     * @param $configField
     * @return mixed
     */
    public function getConfigFlag($configField)
    {
        return $this->scopeConfig->isSetFlag($configField, ScopeInterface::SCOPE_STORE);
    }

    /**
     * Get Config Value
     *
     * @param $configField
     * @param null $store
     * @return mixed
     */
    public function getConfigValue($configField, $store = null)
    {
        return $this->scopeConfig->getValue(
            $configField,
            ScopeInterface::SCOPE_STORE,
            $store
        );
    }

}
