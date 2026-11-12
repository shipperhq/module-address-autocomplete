<?php

namespace ShipperHQ\AddressAutocomplete\Plugin;

use Magento\Checkout\Block\Checkout\LayoutProcessor;
use Magento\Checkout\Helper\Data as CheckoutHelper;

class AddCheckoutBillingAddressAutocomplete
{
    /**
     * @var CheckoutHelper
     */
    private $checkoutHelper;

    /**
     * @param CheckoutHelper $checkoutHelper
     */
    public function __construct(
        CheckoutHelper $checkoutHelper
    ) {
        $this->checkoutHelper = $checkoutHelper;
    }

    /**
     * Adds the billing address autocomplete component to the billing address forms in checkout
     *
     * @see LayoutProcessor::process()
     * @param LayoutProcessor $subject
     * @param array $jsLayout
     * @return array
     * @SuppressWarnings(PHPMD.UnusedLocalVariable)
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    public function afterProcess(LayoutProcessor $subject, $jsLayout)
    {
        if (!isset(
            $jsLayout['components']['checkout']['children']['steps']['children']['billing-step']['children']
            ['payment']['children']
        )) {
            return $jsLayout;
        }

        if ($this->checkoutHelper->isDisplayBillingOnPaymentMethodAvailable()) {
            $configuration = &$jsLayout['components']['checkout']['children']['steps']['children']['billing-step']
            ['children']['payment']['children']['payments-list']['children'];

            foreach ($configuration as $paymentFormCode => $formConfiguration) {
                if (strpos($paymentFormCode, '-form') !== false) {
                    $paymentCode = str_replace('-form', '', $paymentFormCode);
                    $configuration[$paymentFormCode]['children']
                    [$paymentCode . '-billing-address-autocomplete'] = $this->getBillingAddressAutocompleteComponent(
                        $paymentCode
                    );
                }
            }
        } else {
            $jsLayout['components']['checkout']['children']['steps']['children']['billing-step']
            ['children']['payment']['children']['afterMethods']['children']['billing-address-form']['children']
            ['shared-billing-address-autocomplete'] = $this->getBillingAddressAutocompleteComponent(
                'shared'
            );
        }

        return $jsLayout;
    }

    /**
     * Returns that component configuration to be used in the checkout
     *
     * @param string $paymentCode
     * @return array
     */
    private function getBillingAddressAutocompleteComponent($paymentCode)
    {
        return [
            'component' => 'ShipperHQ_AddressAutocomplete/js/billing-address-autocomplete',
            'config' => [
                'paymentCode' => $paymentCode
            ]
        ];
    }
}