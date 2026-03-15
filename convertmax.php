<?php
/**
 *
 * @wordpress-plugin
 * Plugin Name:       Convertmax
 * Plugin URI:        https://convertmax.io
 * Description:       Tracks users as they navigate your WordPress site and form interactions for Convertmax.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            cbconvertmax
 * Author URI:        https://github.com/convertmax
 * License:           GPL-2.0+
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       convertmax
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
	die;
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define('CONVERTMAX_VERSION', '1.0.0');
define('CONVERTMAX_BASE', plugin_basename(__FILE__));

/**
 * Set default plugin options on first activation.
 *
 * @since 1.0.0
 */
function convertmax_activate()
{
	add_option('convertmax_enable_tracking', '1');
	add_option('convertmax_require_user_consent', '1');
}
register_activation_hook(__FILE__, 'convertmax_activate');


/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path(__FILE__) . 'inc/class-convertmax.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function convertmax_run()
{

	$plugin = new Convertmax();
	$plugin->run();

}
convertmax_run();
