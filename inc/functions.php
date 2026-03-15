<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_filter('wpcf7_form_hidden_fields', 'convertmax_add_form_title');
function convertmax_add_form_title($hidden){
 $form = wpcf7_get_current_contact_form();
 $post = get_post($form->id());
 $hidden['cf7_title'] = $post->post_title; //form title slug.
 return $hidden;
}

add_action( 'admin_init', 'convertmax_add_privacy_policy_content' );
function convertmax_add_privacy_policy_content() {
    if ( ! function_exists( 'wp_add_privacy_policy_content' ) ) {
        return;
    }

    $policy_text = '<p>' . __( 'Convertmax can send analytics and conversion event data to Convertmax services when tracking is enabled. Data may include page metadata, search terms, form interaction metadata, and ecommerce conversion details based on plugin settings.', 'convertmax' ) . '</p>';
    $policy_text .= '<p>' . __( 'You should describe this data usage in your privacy policy and obtain consent where required.', 'convertmax' ) . '</p>';

    wp_add_privacy_policy_content( 'Convertmax', wp_kses_post( wpautop( $policy_text ) ) );
}

/**
 * Attach inline tracking code to the Convertmax SDK handle.
 *
 * @param string $script Inline JavaScript.
 * @return void
 */
function convertmax_add_inline_tracking_script( $script ) {
    if ( empty( $script ) || ! wp_script_is( 'convertmax-sdk', 'enqueued' ) ) {
        return;
    }

    wp_add_inline_script( 'convertmax-sdk', $script, 'after' );
}

/**
 * Determine whether tracking should run on the current request.
 *
 * @return bool
 */
function convertmax_should_track() {
    $is_tracking_enabled = '0' !== (string) get_option( 'convertmax_enable_tracking', '1' );
    $public_api_key      = trim( (string) get_option( 'convertmax_public_api_key' ) );
    $require_consent     = get_option( 'convertmax_require_user_consent', '1' );
    $skip_admin_tracking = (bool) get_option( 'convertmax_no_tracking_admin' );

    if ( ! $is_tracking_enabled || '' === $public_api_key ) {
        return false;
    }

    if ( $skip_admin_tracking && is_user_logged_in() && current_user_can( 'manage_options' ) ) {
        return false;
    }

    if ( '0' !== (string) $require_consent ) {
        if ( ! function_exists( 'wp_has_consent' ) ) {
            return false;
        }
        if ( ! wp_has_consent( 'statistics' ) ) {
            return false;
        }
    }

    return true;
}

function convertmax_wpforms_display_submit_before( $form_data ) {

    // echo "<pre>";
    //      print_r($form_data['settings']['form_title']);
    // echo "</pre>";

    if( isset($form_data['settings']['form_title']) ){
        ?>
            <input type="hidden" name="wpforms[title]" value="<?php echo esc_html($form_data['settings']['form_title']) ?>" />
        <?php
    }

    // _e( '<div class="track-click"> <a href="https://www.youtube.com/watch?v=eiQ3viAGung" data-rel=”lightbox”>Click here for a special video announcement!</a>.</div>', 'plugin-domain' );

}
add_action( 'wpforms_display_submit_before', 'convertmax_wpforms_display_submit_before', 10, 1 );

add_action( 'wp_footer', 'convertmax_custom' );

function convertmax_custom() {
    if ( ! convertmax_should_track() ) {
        return;
    }

    $script = '';
    $convertmax_track_contact_form_7 = esc_attr( get_option( 'convertmax_track_contact_form_7' ) );
    if ( $convertmax_track_contact_form_7 ) {
        $script .= <<<'JS'
document.addEventListener('wpcf7submit', function(event) {
    var cf7formid = '(not set)';
    if (event && event.detail && event.detail.contactFormId) {
        cf7formid = event.detail.contactFormId;
    }

    var cf7forminputs = [];
    if (event && event.detail && event.detail.inputs) {
        cf7forminputs = event.detail.inputs;
    }

    if (event && event.detail && event.detail.status && event.detail.status !== 'validation_failed') {
        window.convertmaxTrackEvent('custom', {
            cf7formid: cf7formid,
            cf7forminputs: cf7forminputs
        });
    }
});

JS;
    }

    $convertmax_track_wpforms = esc_attr( get_option( 'convertmax_track_wpforms' ) );
    if ( $convertmax_track_wpforms ) {
        $script .= <<<'JS'
jQuery('.wpforms-form').on('wpformsAjaxSubmitSuccess', function(event) {
    var formId = jQuery(event.target).data('formid');
    var formData = jQuery(event.target).serializeArray();

    window.convertmaxTrackEvent('custom', {
        wpformid: formId,
        wpforminputs: formData
    });
});

JS;
    }

    $convertmax_track_formidable = esc_attr( get_option( 'convertmax_track_formidable' ) );
    if ( $convertmax_track_formidable ) {
        $script .= <<<'JS'
jQuery(document).ready(function($) {
    $(document).on('frmFormComplete', function(event) {
        var formId = jQuery(event.target).data('formid');
        var formData = jQuery(event.target).serializeArray();

        window.convertmaxTrackEvent('custom', {
            wpformid: formId,
            wpforminputs: formData
        });
    });
});

JS;
    }

    convertmax_add_inline_tracking_script( $script );
}
add_action( 'wp_footer', 'convertmax_product_page' );

function convertmax_product_page() {
    if ( ! convertmax_should_track() ) {
        return;
    }

    global $product, $post;
    if ( $product ) {
        $product_id = $product->get_id();
        $payload = array(
            'page_id'    => (int) $post->ID,
            'post_type'  => $post->post_type,
            'post_title' => $post->post_title,
            'guid'       => $post->guid,
            'product'    => (int) $product_id,
        );
        $script = 'window.convertmaxTrackEvent("page_view", Object.assign(' . wp_json_encode( $payload ) . ', { uri: window.location.pathname }));';
        convertmax_add_inline_tracking_script( $script );
    } elseif ( $post ) {
        $payload = array(
            'page_id'    => (int) $post->ID,
            'post_type'  => $post->post_type,
            'post_title' => $post->post_title,
            'guid'       => $post->guid,
        );
        $script = 'window.convertmaxTrackEvent("page_view", Object.assign(' . wp_json_encode( $payload ) . ', { uri: window.location.pathname }));';
        convertmax_add_inline_tracking_script( $script );
    }
}

add_action( "woocommerce_add_to_cart", function ( $cart_item_key, $product_id, $quantity, $variation_id, $variation, $cart_item_data ) {
    $GLOBALS['convertmax_add_to_cart_id']  = $product_id;
    $GLOBALS['convertmax_add_to_cart_qty'] = $quantity;
}, 10, 6 );

add_action( 'wp_footer', 'convertmax_adding_to_cart' );
function convertmax_adding_to_cart() {
    if ( ! convertmax_should_track() ) {
        return;
    }

    global $convertmax_add_to_cart_id, $convertmax_add_to_cart_qty;
    $id       = $convertmax_add_to_cart_id;
    $quantity = $convertmax_add_to_cart_qty;
    if ( !empty( $convertmax_add_to_cart_id ) ) {
        $script = 'window.convertmaxTrackEvent("add_cart", ' . wp_json_encode(
            array(
                'id'       => (int) $id,
                'quantity' => (int) $quantity,
            )
        ) . ');';
        convertmax_add_inline_tracking_script( $script );
} //End Condition
}

add_action( 'wp_footer', 'convertmax_search' );
function convertmax_search() {
    if ( ! convertmax_should_track() ) {
        return;
    }

    global $wp_query;
    $post_type = get_query_var( 'post_type' );
    $s         = sanitize_text_field( get_query_var( 's' ) );

    if ( !empty( $s ) ) {

        $track_search_query = esc_attr( get_option( 'convertmax_track_search_query' ) );
        if ( $track_search_query ) {
            $input_value = $s;
            $hit_count   = $wp_query->found_posts;
            $script = 'window.convertmaxTrackEvent("search", ' . wp_json_encode(
                array(
                    'query' => $input_value,
                    'hits'  => (int) $hit_count,
                )
            ) . ');';
            convertmax_add_inline_tracking_script( $script );
} // Condition for options settings
    } // Condition for Query
}

// add_action( 'woocommerce_payment_complete', 'convertmax_payment_completed', 10, 1 );
add_action( 'woocommerce_thankyou', 'convertmax_payment_completed', 10, 1 );
/**
 * @param $order_id
 */
function convertmax_payment_completed( $order_id ) {
    if ( ! convertmax_should_track() ) {
        return;
    }

    $convertmax_counted = get_post_meta( $order_id, "_convertmax_count", true );
    if ( $convertmax_counted ) {
        return;
    }

    $order                                    = wc_get_order( $order_id );
    //print_r($order);
    $GLOBALS["convertmax_order_id"]             = $order_id;
    $GLOBALS["convertmax_order_subtotal"]       = $order->get_subtotal();
    $GLOBALS["convertmax_order_customer_id"]    = $order->get_customer_id();
    $GLOBALS["convertmax_order_customer_email"] = $order->get_billing_email();
    $items                                    = $order->get_items();
    $product_ids                              = [];
    $products                              = [];
    $GLOBALS["convertmax_order_info"] = array(
        "order_id"=>$order->get_id(),
        "customer_id"=>$order->get_user_id(),
        "coupons"=>$order->get_coupon_codes()        
    );
    $order_data = $order->get_data();
    $GLOBALS["convertmax_order_data"] = $order_data;

    foreach ( $items as $item ) {
        $product = $item->get_product();
        $sku = $product->get_sku();
        $product_id           = $item->get_product_id();
        $product_variation_id = $item->get_variation_id();
        $itemPrice = $item->get_total();
        $itemQuantity = $item->get_quantity();
        $itemTotal = $item->get_total() * $item->get_quantity();

        if ( $product_variation_id ) {
            $product_ids[] = $product_variation_id;
        } else {
            $product_ids[] = $product_id;
        }

        $products[] = array(
            "sku"=>$sku,
            "price"=>$itemPrice,
            "qty"=>$itemQuantity,
            "itemTotal"=>$itemTotal
        );
    }
    $GLOBALS["convertmax_order_product_ids"] = $product_ids;
    $GLOBALS["convertmax_order_products"] = $products;

    update_post_meta( $order_id, "_convertmax_count", 1 );
}

add_action( 'wp_footer', 'convertmax_convert' );
function convertmax_convert() {
    if ( ! convertmax_should_track() ) {
        return;
    }

    global $convertmax_order_id, $convertmax_order_subtotal, $convertmax_order_customer_id, $convertmax_order_customer_email, $convertmax_order_product_ids, $convertmax_order_products, $convertmax_order_info, $convertmax_order_data;

    if ( !empty( $convertmax_order_id ) ) {    
        $script = 'window.convertmaxTrackEvent("convert", ' . wp_json_encode(
            array(
                'id'             => (string) $convertmax_order_id,
                'revenue'        => (string) $convertmax_order_subtotal,
                'customer'       => (string) $convertmax_order_customer_id,
                'email'          => (string) $convertmax_order_customer_email,
                'products'       => $convertmax_order_product_ids,
                'productDetails' => $convertmax_order_products,
                'orderInfo'      => $convertmax_order_info,
                'orderData'      => $convertmax_order_data,
            )
        ) . ');';
        convertmax_add_inline_tracking_script( $script );
    }
}
