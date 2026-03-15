<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       http://example.com
 * @since      1.0.0
 *
 * @package    Plugin_Name
 * @subpackage Plugin_Name/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    Convertmax
 * @subpackage Convertmax/includes
 * @author     Your Name <email@example.com>
 */
class Convertmax {

    /**
     * The loader that's responsible for maintaining and registering all hooks that power
     * the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      Plugin_Name_Loader    $loader    Maintains and registers all hooks for the plugin.
     */
    protected $loader;

    /**
     * The unique identifier of this plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $plugin_name    The string used to uniquely identify this plugin.
     */
    protected $plugin_name;

    /**
     * The current version of the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $version    The current version of the plugin.
     */
    protected $version;

    /**
     * Define the core functionality of the plugin.
     *
     * Set the plugin name and the plugin version that can be used throughout the plugin.
     * Load the dependencies, define the locale, and set the hooks for the admin area and
     * the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function __construct() {
        if ( defined( 'CONVERTMAX_VERSION' ) ) {
            $this->version = CONVERTMAX_VERSION;
        } else {
            $this->version = '1.0.0';
        }
        $this->plugin_name = 'convertmax';

        $this->load_dependencies();
        add_filter( 'plugin_action_links_'.CONVERTMAX_BASE, array($this,'convertmax_settings_link') );
    }

    
    public function convertmax_settings_link( array $links ) {
            $url = get_admin_url() . "admin.php?page=convertmax";
            $settings_link = '<a href="' . $url . '">' . __('Settings', 'convertmax') . '</a>';
            // $links[] = $settings_link;
            array_unshift( $links, $settings_link );
            // array_unshift()
            return $links;
        }

    /**
     * Load the required dependencies for this plugin.
     *
     * Include the following files that make up the plugin:
     *
     * -Functions
     * Create an instance of the loader which will be used to register the hooks
     * with WordPress.
     *
     * @since    1.0.0
     * @access   private
     */
    private function load_dependencies() {
        /**
         * The class responsible for defining internationalization functionality
         * of the plugin.
         */
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'inc/functions.php';
    }

    /**
     * Run the loader to execute all of the hooks with WordPress.
     *
     * @since    1.0.0
     */
    public function run() {
        if ( is_admin() ) {
            add_action( 'admin_menu', array( $this, 'register_menu' ) );
            add_action( 'admin_init', array( $this, 'register_plugin_settings' ) );
            add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
            add_action( 'admin_notices', array( $this, 'consent_api_notice' ) );
        }
        add_action( 'wp_enqueue_scripts', array( $this, 'load_scripts' ) );
    }

    /**
     * Load admin-only styles for the plugin settings screen.
     *
     * @since 1.0.0
     *
     * @param string $hook_suffix The current admin page hook.
     */
    public function enqueue_admin_assets( $hook_suffix ) {
        if ( 'toplevel_page_convertmax' !== $hook_suffix ) {
            return;
        }

        wp_enqueue_style(
            'convertmax-admin',
            plugins_url( '../assets/admin.css', __FILE__ ),
            array(),
            $this->version
        );
    }
    public function register_plugin_settings() {
        //register our settings
        register_setting(
            'convertmax-group',
            'convertmax_public_api_key',
            array( 'sanitize_callback' => 'sanitize_text_field' )
        );
        register_setting(
            'convertmax-group',
            'convertmax_enable_tracking',
            array( 'sanitize_callback' => array( $this, 'sanitize_checkbox' ) )
        );
        register_setting(
            'convertmax-group',
            'convertmax_track_search_query',
            array( 'sanitize_callback' => array( $this, 'sanitize_checkbox' ) )
        );
        register_setting(
            'convertmax-group',
            'convertmax_no_tracking_admin',
            array( 'sanitize_callback' => array( $this, 'sanitize_checkbox' ) )
        );
        register_setting(
            'convertmax-group',
            'convertmax_require_user_consent',
            array( 'sanitize_callback' => array( $this, 'sanitize_checkbox' ) )
        );
        register_setting(
            'convertmax-group-form',
            'convertmax_track_contact_form_7',
            array( 'sanitize_callback' => array( $this, 'sanitize_checkbox' ) )
        );
        register_setting(
            'convertmax-group-form',
            'convertmax_track_wpforms',
            array( 'sanitize_callback' => array( $this, 'sanitize_checkbox' ) )
        );
        register_setting(
            'convertmax-group-form',
            'convertmax_track_formidable',
            array( 'sanitize_callback' => array( $this, 'sanitize_checkbox' ) )
        );
    }

    /**
     * Normalize checkbox-like values to 1/0.
     *
     * @since 1.0.0
     *
     * @param mixed $value Raw option value.
     * @return string
     */
    public function sanitize_checkbox( $value ) {
        return ( ! empty( $value ) && '0' !== (string) $value ) ? '1' : '0';
    }

    public function register_menu() {
        add_menu_page(
            __( 'Convertmax', 'convertmax' ),
            'Convertmax',
            'manage_options',
            'convertmax',
            array( $this, 'menu_page' ),
            'data:image/svg+xml;base64,' . base64_encode('<svg width="20" height="20" viewBox="0 0 138 138" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
                <g transform="matrix(1,0,0,1,4.373,137.883)">
                    <path d="M0,-113.683C-2.771,-108.039 -4.373,-101.743 -4.373,-95.097L-4.373,-42.805C-4.373,-19.392 15,0 38.413,0L90.724,0C110.172,0 126.832,-13.379 131.917,-31.329C132.955,-34.989 133.51,-38.839 133.51,-42.805L133.51,-56.941C107.363,-56.566 99.665,-59.778 99.665,-42.805C99.665,-37.553 95.977,-33.845 90.724,-33.845L38.413,-33.845C33.161,-33.845 29.453,-37.553 29.453,-42.805L29.453,-84.23L0,-113.683Z" style="fill:rgb(4,74,135);fill-rule:nonzero;"/>
                </g>
                <g transform="matrix(1,0,0,1,42.7861,69.075)">
                    <path d="M0,-69.075C-10.658,-69.075 -20.455,-65.033 -27.992,-58.45L-3.959,-34.416C-3.958,-34.417 -3.959,-34.415 -3.959,-34.416L27.802,-2.651L58.274,-33.122C60.124,-31.527 61.248,-29.155 61.248,-26.289C60.011,0 61.854,-2.653 95.153,-2.563L95.093,-26.289C95.09,-27.491 95.04,-28.68 94.942,-29.858C93.094,-51.638 74.521,-69.075 52.309,-69.075L49.32,-69.075L27.804,-47.563L6.292,-69.075L0,-69.075Z" style="fill:rgb(103,199,202);fill-rule:nonzero;"/>
                </g>
            </svg>'),
            66
        );
    }

    public function menu_page() {

        if ( is_file( plugin_dir_path( __FILE__ ) . 'options.php' ) ) {
            include_once plugin_dir_path( __FILE__ ) . 'options.php';
        }
    }

    public function load_scripts() {
        if ( function_exists( 'convertmax_should_track' ) && ! convertmax_should_track() ) {
            return;
        }

        $public_api_key = trim( (string) get_option( 'convertmax_public_api_key' ) );

        if ( '' === $public_api_key ) {
            return;
        }

        wp_enqueue_script(
            'convertmax-sdk',
            plugins_url( '../js/cm.min.js', __FILE__ ),
            array(),
            $this->version,
            true
        );

        wp_add_inline_script(
            'convertmax-sdk',
            "window.__convertmax_q=Array.isArray(window.__convertmax_q)?window.__convertmax_q:[];",
            'before'
        );

        $inline_config = sprintf(
            "window.convertmaxTrackEvent=window.convertmaxTrackEvent||function(name,payload){if(window.Convertmax&&typeof window.Convertmax.track==='function'){window.Convertmax.track(name,payload);return;}if(Array.isArray(window.__convertmax_q)){window.__convertmax_q.push(['track',name,payload]);}};(function(){var configured=false;var config={apiKey:%s,eventURL:'https://event.convertmax.io',debug:false};function init(){if(configured){return;}if(window.Convertmax&&typeof window.Convertmax.config==='function'){window.Convertmax.config(config);configured=true;}}init();window.addEventListener('convertmaxLoaded',init);})();",
            wp_json_encode( $public_api_key )
        );

        wp_add_inline_script( 'convertmax-sdk', $inline_config, 'after' );
    }

    /**
     * Show a notice when consent mode is enabled without a consent API provider.
     *
     * @since 1.0.0
     */
    public function consent_api_notice() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        $screen = get_current_screen();
        if ( ! $screen || 'toplevel_page_convertmax' !== $screen->id ) {
            return;
        }

        $require_consent = get_option( 'convertmax_require_user_consent', '1' );
        $tracking_enabled = '0' !== (string) get_option( 'convertmax_enable_tracking', '1' );
        $public_api_key   = trim( (string) get_option( 'convertmax_public_api_key' ) );

        if ( ! $tracking_enabled || '' === $public_api_key ) {
            return;
        }

        if ( '0' === (string) $require_consent || function_exists( 'wp_has_consent' ) ) {
            return;
        }
        ?>
        <div class="notice notice-warning">
            <p><?php esc_html_e( 'Convertmax consent mode is enabled, but no WordPress consent API provider was detected. Install a consent plugin that provides wp_has_consent() to enable tracking after consent.', 'convertmax' ); ?></p>
        </div>
        <?php
    }

    /**
     * The name of the plugin used to uniquely identify it within the context of
     * WordPress and to define internationalization functionality.
     *
     * @since     1.0.0
     * @return    string    The name of the plugin.
     */
    public function get_plugin_name() {
        return $this->plugin_name;
    }

    /**
     * The reference to the class that orchestrates the hooks with the plugin.
     *
     * @since     1.0.0
     * @return    Plugin_Name_Loader    Orchestrates the hooks of the plugin.
     */
    public function get_loader() {
        return $this->loader;
    }

    /**
     * Retrieve the version number of the plugin.
     *
     * @since     1.0.0
     * @return    string    The version number of the plugin.
     */
    public function get_version() {
        return $this->version;
    }

}
