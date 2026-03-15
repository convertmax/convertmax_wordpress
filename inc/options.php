<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$convertmax_tab = filter_input( INPUT_GET, 'tab', FILTER_SANITIZE_FULL_SPECIAL_CHARS );

if ( is_string( $convertmax_tab ) && '' !== $convertmax_tab ) {
    $convertmax_active_tab = sanitize_text_field( wp_unslash( $convertmax_tab ) );
} else {
    $convertmax_active_tab = 'general_options';
}
?>

<div class="wrap convertmax-admin">
    <div class="convertmax-admin__header">
        <div class="convertmax-admin__brand">
            <img
                src="<?php echo esc_url( plugin_dir_url( dirname( __FILE__ ) ) . 'assets/cm_icon.svg' ); ?>"
                class="convertmax-admin__logo"
                alt="<?php esc_attr_e( 'Convertmax logo', 'convertmax' ); ?>"
            />
            <div class="convertmax-admin__brand-copy">
                <h1><?php esc_html_e( 'Convertmax Settings', 'convertmax' ); ?></h1>
                <p><?php esc_html_e( 'Configure tracking and form integrations for Convertmax.', 'convertmax' ); ?></p>
            </div>
        </div>
        <p class="convertmax-admin__support">
            <?php esc_html_e( 'Contact Support:', 'convertmax' ); ?>
            <a href="mailto:help@convertmax.io?subject=Convertmax%20Plugin">help@convertmax.io</a>
        </p>
    </div>

    <h2 class="nav-tab-wrapper convertmax-tabs">
        <a href="?page=convertmax&tab=general_options" class="nav-tab <?php echo ( 'general_options' === $convertmax_active_tab ) ? 'nav-tab-active' : ''; ?>">
            <?php esc_html_e( 'General Options', 'convertmax' ); ?>
        </a>
        <a href="?page=convertmax&tab=form_options" class="nav-tab <?php echo ( 'form_options' === $convertmax_active_tab ) ? 'nav-tab-active' : ''; ?>">
            <?php esc_html_e( 'Form Options', 'convertmax' ); ?>
        </a>
    </h2>

    <form method="post" action="options.php" class="convertmax-admin__form">
        <div class="convertmax-card">
            <?php if ( 'general_options' === $convertmax_active_tab ) : ?>
                <?php settings_fields( 'convertmax-group' ); ?>
                <?php do_settings_sections( 'convertmax-group' ); ?>

                <table class="form-table" role="presentation">
                    <tbody>
                        <tr>
                            <th scope="row">
                                <label for="convertmax_public_api_key"><?php esc_html_e( 'Public API Key', 'convertmax' ); ?></label>
                            </th>
                            <td>
                                <input
                                    type="text"
                                    id="convertmax_public_api_key"
                                    name="convertmax_public_api_key"
                                    class="regular-text"
                                    value="<?php echo esc_attr( get_option( 'convertmax_public_api_key' ) ); ?>"
                                />
                                <p class="description"><?php esc_html_e( 'Enter your Convertmax public key to enable tracking.', 'convertmax' ); ?></p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><?php esc_html_e( 'Enable Tracking', 'convertmax' ); ?></th>
                            <td>
                                <label for="convertmax_enable_tracking">
                                    <input type="hidden" name="convertmax_enable_tracking" value="0" />
                                    <input
                                        type="checkbox"
                                        id="convertmax_enable_tracking"
                                        name="convertmax_enable_tracking"
                                        value="1"
                                        <?php checked( '1', (string) get_option( 'convertmax_enable_tracking', '1' ), true ); ?>
                                    />
                                    <?php esc_html_e( 'Allow Convertmax event tracking on this site.', 'convertmax' ); ?>
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><?php esc_html_e( 'Require Visitor Consent', 'convertmax' ); ?></th>
                            <td>
                                <label for="convertmax_require_user_consent">
                                    <input type="hidden" name="convertmax_require_user_consent" value="0" />
                                    <input
                                        type="checkbox"
                                        id="convertmax_require_user_consent"
                                        name="convertmax_require_user_consent"
                                        value="1"
                                        <?php checked( '0' !== (string) get_option( 'convertmax_require_user_consent', '1' ) ); ?>
                                    />
                                    <?php esc_html_e( 'Only track when visitor consent for statistics is available via wp_has_consent().', 'convertmax' ); ?>
                                </label>
                                <p class="description"><?php esc_html_e( 'Recommended for privacy compliance. If no consent plugin is active, tracking remains disabled while this option is enabled.', 'convertmax' ); ?></p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><?php esc_html_e( 'Track Search Query Events', 'convertmax' ); ?></th>
                            <td>
                                <label for="convertmax_track_search_query">
                                    <input
                                        type="checkbox"
                                        id="convertmax_track_search_query"
                                        name="convertmax_track_search_query"
                                        value="1"
                                        <?php checked( 1, get_option( 'convertmax_track_search_query' ), true ); ?>
                                    />
                                    <?php esc_html_e( 'Enable event tracking for on-site searches.', 'convertmax' ); ?>
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><?php esc_html_e( 'Disable Tracking for Admin Users', 'convertmax' ); ?></th>
                            <td>
                                <label for="convertmax_no_tracking_admin">
                                    <input
                                        type="checkbox"
                                        id="convertmax_no_tracking_admin"
                                        name="convertmax_no_tracking_admin"
                                        value="1"
                                        <?php checked( 1, get_option( 'convertmax_no_tracking_admin' ), true ); ?>
                                    />
                                    <?php esc_html_e( 'Do not track visits while signed in as an administrator.', 'convertmax' ); ?>
                                </label>
                            </td>
                        </tr>
                    </tbody>
                </table>
            <?php endif; ?>

            <?php if ( 'form_options' === $convertmax_active_tab ) : ?>
                <?php settings_fields( 'convertmax-group-form' ); ?>
                <?php do_settings_sections( 'convertmax-group-form' ); ?>

                <table class="form-table" role="presentation">
                    <tbody>
                        <tr>
                            <th scope="row"><?php esc_html_e( 'Contact Form 7', 'convertmax' ); ?></th>
                            <td>
                                <label for="convertmax_track_contact_form_7">
                                    <input
                                        type="checkbox"
                                        id="convertmax_track_contact_form_7"
                                        name="convertmax_track_contact_form_7"
                                        value="1"
                                        <?php checked( 1, get_option( 'convertmax_track_contact_form_7' ), true ); ?>
                                    />
                                    <?php esc_html_e( 'Track Convertmax events for Contact Form 7 submissions.', 'convertmax' ); ?>
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><?php esc_html_e( 'WPForms', 'convertmax' ); ?></th>
                            <td>
                                <label for="convertmax_track_wpforms">
                                    <input
                                        type="checkbox"
                                        id="convertmax_track_wpforms"
                                        name="convertmax_track_wpforms"
                                        value="1"
                                        <?php checked( 1, get_option( 'convertmax_track_wpforms' ), true ); ?>
                                    />
                                    <?php esc_html_e( 'Track Convertmax events for WPForms submissions.', 'convertmax' ); ?>
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><?php esc_html_e( 'Formidable Forms', 'convertmax' ); ?></th>
                            <td>
                                <label for="convertmax_track_formidable">
                                    <input
                                        type="checkbox"
                                        id="convertmax_track_formidable"
                                        name="convertmax_track_formidable"
                                        value="1"
                                        <?php checked( 1, get_option( 'convertmax_track_formidable' ), true ); ?>
                                    />
                                    <?php esc_html_e( 'Track Convertmax events for Formidable forms submissions.', 'convertmax' ); ?>
                                </label>
                            </td>
                        </tr>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <?php submit_button( __( 'Save Settings', 'convertmax' ) ); ?>
    </form>
</div>
