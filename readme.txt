=== Convertmax ===
Contributors: cbconvertmax
Tags: analytics, tracking, lead generation, forms
Requires at least: 5.8
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Track page activity and form events in your WordPress site with Convertmax.

== Description ==

Convertmax connects your site to Convertmax so you can capture user activity and conversion events.

Features:

* Add your Convertmax public API key from WordPress admin.
* Keep tracking disabled until explicitly enabled by a site admin.
* Require visitor consent before tracking (via `wp_has_consent( 'statistics' )`).
* Track on-site search events.
* Optionally disable tracking for logged-in administrators.
* Track supported form submissions for Contact Form 7, WPForms, and Formidable Forms.

After activation, go to **Convertmax > General Options** to configure your API key and tracking preferences.

Source code:

* [GitHub repository](https://github.com/convertmax/convertmax_wordpress)
* Unminified JavaScript source is included in this plugin at `js/cm.js`
* Minified production build is included at `js/cm.min.js`

== Installation ==

1. Upload the `convertmax` plugin folder to `/wp-content/plugins/`.
2. Activate **Convertmax** from the Plugins screen.
3. Open **Convertmax** in the WordPress admin menu.
4. Enter your Convertmax public API key and save settings.

== Development Notes ==

The distributed SDK files included with this plugin are:

* `js/cm.js` - human-readable source
* `js/cm.min.js` - minified production build

== Frequently Asked Questions ==

= Where do I find my API key? =

Get your public API key from your Convertmax account dashboard.

= Does this plugin track administrators? =

Only if you leave the admin tracking option enabled. You can disable admin tracking in General Options.

= Which forms are supported? =

This version supports Contact Form 7, WPForms, and Formidable Forms event tracking toggles.

= How does consent work? =

If **Require Visitor Consent** is enabled, Convertmax only tracks when a consent provider exposes `wp_has_consent( 'statistics' )` and the visitor has granted consent.

== Privacy ==

This plugin is intended to send analytics/conversion events to Convertmax after configuration.

When tracking is enabled and consent requirements are met, the plugin may send:

* Page metadata (page ID, title, URL path, post type).
* Search query text and result counts (if enabled).
* Form submission-related metadata for supported forms (if enabled).
* Commerce event data for WooCommerce actions (add-to-cart and completed purchase events), including order/product details.

Site owners are responsible for:

* Obtaining any required user consent.
* Maintaining a compliant privacy policy.
* Configuring tracking features according to local legal requirements.

== Changelog ==

= 1.0.0 =
* Initial public release.
* Settings page with general and form tracking options.

== Upgrade Notice ==

= 1.0.0 =
Initial release.
