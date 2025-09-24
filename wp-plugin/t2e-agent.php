<?php
/**
 * Plugin Name: Voice AI Browser Agent - WordPress Integration
 * Plugin URI: https://github.com/your-repo/voice-ai-browser-agent
 * Description: Secure REST API endpoints for Voice AI Browser Agent automation
 * Version: 1.0.0
 * Author: Voice AI Browser Agent Team
 * License: MIT
 * Text Domain: t2e-agent
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Main plugin class
 */
class T2E_Agent {
    
    private $version = '1.0.0';
    private $api_namespace = 't2e-agent/v1';
    
    /**
     * Initialize the plugin
     */
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('rest_api_init', array($this, 'register_api_routes'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_filter('rest_authentication_errors', array($this, 'authenticate_request'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        load_plugin_textdomain('t2e-agent', false, dirname(plugin_basename(__FILE__)) . '/languages');
        
        // Add CORS headers for API requests
        add_action('rest_api_init', function() {
            remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
            add_filter('rest_pre_serve_request', array($this, 'add_cors_headers'));
        }, 15);
    }
    
    /**
     * Add CORS headers for cross-origin requests
     */
    public function add_cors_headers($value) {
        $origin = get_http_origin();
        
        if ($origin) {
            header('Access-Control-Allow-Origin: ' . $origin);
        }
        
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Authorization, X-WP-Nonce, Content-Disposition, Content-MD5, Content-Type');
        
        return $value;
    }
    
    /**
     * Register REST API routes
     */
    public function register_api_routes() {
        
        // Bulk create posts
        register_rest_route($this->api_namespace, '/posts/bulk', array(
            'methods' => 'POST',
            'callback' => array($this, 'bulk_create_posts'),
            'permission_callback' => array($this, 'check_permissions'),
            'args' => array(
                'posts' => array(
                    'required' => true,
                    'type' => 'array',
                    'description' => 'Array of post objects to create'
                )
            )
        ));
        
        // Enhanced post creation with AI metadata
        register_rest_route($this->api_namespace, '/posts/create', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_post_enhanced'),
            'permission_callback' => array($this, 'check_permissions'),
            'args' => array(
                'title' => array(
                    'required' => true,
                    'type' => 'string'
                ),
                'content' => array(
                    'required' => true,
                    'type' => 'string'
                ),
                'status' => array(
                    'default' => 'draft',
                    'enum' => array('draft', 'publish', 'private')
                ),
                'ai_generated' => array(
                    'default' => false,
                    'type' => 'boolean'
                ),
                'source_url' => array(
                    'type' => 'string'
                ),
                'automation_id' => array(
                    'type' => 'string'
                )
            )
        ));
        
        // Template management
        register_rest_route($this->api_namespace, '/templates', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_templates'),
            'permission_callback' => array($this, 'check_permissions')
        ));
        
        register_rest_route($this->api_namespace, '/templates', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_template'),
            'permission_callback' => array($this, 'check_permissions'),
            'args' => array(
                'name' => array(
                    'required' => true,
                    'type' => 'string'
                ),
                'content' => array(
                    'required' => true,
                    'type' => 'string'
                ),
                'variables' => array(
                    'type' => 'object'
                )
            )
        ));
        
        // Media upload with metadata
        register_rest_route($this->api_namespace, '/media/upload', array(
            'methods' => 'POST',
            'callback' => array($this, 'upload_media_enhanced'),
            'permission_callback' => array($this, 'check_permissions')
        ));
        
        // Site health check
        register_rest_route($this->api_namespace, '/health', array(
            'methods' => 'GET',
            'callback' => array($this, 'health_check'),
            'permission_callback' => '__return_true'
        ));
        
        // Automation log
        register_rest_route($this->api_namespace, '/logs', array(
            'methods' => 'POST',
            'callback' => array($this, 'log_automation_action'),
            'permission_callback' => array($this, 'check_permissions'),
            'args' => array(
                'action' => array(
                    'required' => true,
                    'type' => 'string'
                ),
                'details' => array(
                    'type' => 'object'
                )
            )
        ));
    }
    
    /**
     * Check API permissions
     */
    public function check_permissions() {
        // Allow application password authentication
        if (is_user_logged_in()) {
            return current_user_can('edit_posts');
        }
        
        // Check for application password in authorization header
        $auth_header = $this->get_auth_header();
        if ($auth_header && $this->validate_application_password($auth_header)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get authorization header
     */
    private function get_auth_header() {
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                return $headers['Authorization'];
            }
        }
        return false;
    }
    
    /**
     * Validate application password
     */
    private function validate_application_password($auth_header) {
        if (strpos($auth_header, 'Basic ') !== 0) {
            return false;
        }
        
        $credentials = base64_decode(substr($auth_header, 6));
        if (!$credentials) {
            return false;
        }
        
        list($username, $password) = explode(':', $credentials, 2);
        
        $user = get_user_by('login', $username);
        if (!$user) {
            $user = get_user_by('email', $username);
        }
        
        if (!$user) {
            return false;
        }
        
        // Check if it's an application password
        if (class_exists('WP_Application_Passwords')) {
            return WP_Application_Passwords::authenticate($user, $username, $password) !== false;
        }
        
        return false;
    }
    
    /**
     * Bulk create posts
     */
    public function bulk_create_posts($request) {
        $posts = $request->get_param('posts');
        $results = array();
        $errors = array();
        
        if (!is_array($posts)) {
            return new WP_Error('invalid_posts', 'Posts parameter must be an array', array('status' => 400));
        }
        
        foreach ($posts as $index => $post_data) {
            try {
                $post_args = array(
                    'post_title' => sanitize_text_field($post_data['title'] ?? ''),
                    'post_content' => wp_kses_post($post_data['content'] ?? ''),
                    'post_status' => sanitize_text_field($post_data['status'] ?? 'draft'),
                    'post_type' => 'post',
                    'meta_input' => array(
                        '_t2e_ai_generated' => !empty($post_data['ai_generated']),
                        '_t2e_source_url' => esc_url_raw($post_data['source_url'] ?? ''),
                        '_t2e_automation_id' => sanitize_text_field($post_data['automation_id'] ?? ''),
                        '_t2e_created_at' => current_time('mysql')
                    )
                );
                
                // Handle categories
                if (!empty($post_data['categories'])) {
                    $post_args['post_category'] = array_map('intval', (array)$post_data['categories']);
                }
                
                // Handle tags
                if (!empty($post_data['tags'])) {
                    $post_args['tags_input'] = is_array($post_data['tags']) ? $post_data['tags'] : explode(',', $post_data['tags']);
                }
                
                $post_id = wp_insert_post($post_args, true);
                
                if (is_wp_error($post_id)) {
                    $errors[] = array(
                        'index' => $index,
                        'title' => $post_data['title'] ?? 'Unknown',
                        'error' => $post_id->get_error_message()
                    );
                } else {
                    $results[] = array(
                        'id' => $post_id,
                        'title' => $post_data['title'] ?? '',
                        'url' => get_permalink($post_id),
                        'edit_url' => get_edit_post_link($post_id)
                    );
                }
                
                // Add small delay to prevent overwhelming the server
                if (count($posts) > 5) {
                    usleep(100000); // 0.1 second
                }
                
            } catch (Exception $e) {
                $errors[] = array(
                    'index' => $index,
                    'title' => $post_data['title'] ?? 'Unknown',
                    'error' => $e->getMessage()
                );
            }
        }
        
        return rest_ensure_response(array(
            'success' => empty($errors),
            'created' => $results,
            'errors' => $errors,
            'total_requested' => count($posts),
            'total_created' => count($results),
            'total_errors' => count($errors)
        ));
    }
    
    /**
     * Create post with enhanced metadata
     */
    public function create_post_enhanced($request) {
        $post_args = array(
            'post_title' => sanitize_text_field($request->get_param('title')),
            'post_content' => wp_kses_post($request->get_param('content')),
            'post_status' => sanitize_text_field($request->get_param('status')),
            'post_type' => 'post',
            'meta_input' => array(
                '_t2e_ai_generated' => $request->get_param('ai_generated'),
                '_t2e_source_url' => esc_url_raw($request->get_param('source_url')),
                '_t2e_automation_id' => sanitize_text_field($request->get_param('automation_id')),
                '_t2e_created_at' => current_time('mysql')
            )
        );
        
        $post_id = wp_insert_post($post_args, true);
        
        if (is_wp_error($post_id)) {
            return $post_id;
        }
        
        return rest_ensure_response(array(
            'id' => $post_id,
            'title' => get_the_title($post_id),
            'url' => get_permalink($post_id),
            'edit_url' => get_edit_post_link($post_id),
            'status' => get_post_status($post_id)
        ));
    }
    
    /**
     * Get templates
     */
    public function get_templates() {
        $templates = get_posts(array(
            'post_type' => 't2e_template',
            'posts_per_page' => -1,
            'post_status' => 'publish'
        ));
        
        $result = array();
        foreach ($templates as $template) {
            $result[] = array(
                'id' => $template->ID,
                'name' => $template->post_title,
                'content' => $template->post_content,
                'variables' => get_post_meta($template->ID, '_t2e_template_variables', true),
                'created_at' => $template->post_date
            );
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Create template
     */
    public function create_template($request) {
        $template_args = array(
            'post_title' => sanitize_text_field($request->get_param('name')),
            'post_content' => wp_kses_post($request->get_param('content')),
            'post_type' => 't2e_template',
            'post_status' => 'publish'
        );
        
        $template_id = wp_insert_post($template_args, true);
        
        if (is_wp_error($template_id)) {
            return $template_id;
        }
        
        // Save template variables
        $variables = $request->get_param('variables');
        if ($variables) {
            update_post_meta($template_id, '_t2e_template_variables', $variables);
        }
        
        return rest_ensure_response(array(
            'id' => $template_id,
            'name' => get_the_title($template_id),
            'created_at' => get_post_time('c', true, $template_id)
        ));
    }
    
    /**
     * Enhanced media upload
     */
    public function upload_media_enhanced($request) {
        if (empty($_FILES['file'])) {
            return new WP_Error('no_file', 'No file provided', array('status' => 400));
        }
        
        $file = $_FILES['file'];
        
        // Handle the upload
        $upload = wp_handle_upload($file, array('test_form' => false));
        
        if (isset($upload['error'])) {
            return new WP_Error('upload_error', $upload['error'], array('status' => 400));
        }
        
        // Create attachment
        $attachment = array(
            'post_mime_type' => $upload['type'],
            'post_title' => sanitize_file_name(pathinfo($upload['file'], PATHINFO_FILENAME)),
            'post_content' => '',
            'post_status' => 'inherit'
        );
        
        $attachment_id = wp_insert_attachment($attachment, $upload['file']);
        
        if (is_wp_error($attachment_id)) {
            return $attachment_id;
        }
        
        // Generate metadata
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        $metadata = wp_generate_attachment_metadata($attachment_id, $upload['file']);
        wp_update_attachment_metadata($attachment_id, $metadata);
        
        // Add automation metadata
        update_post_meta($attachment_id, '_t2e_uploaded_by_agent', true);
        update_post_meta($attachment_id, '_t2e_upload_time', current_time('mysql'));
        
        return rest_ensure_response(array(
            'id' => $attachment_id,
            'url' => wp_get_attachment_url($attachment_id),
            'filename' => basename($upload['file']),
            'type' => $upload['type'],
            'size' => filesize($upload['file'])
        ));
    }
    
    /**
     * Health check endpoint
     */
    public function health_check() {
        return rest_ensure_response(array(
            'status' => 'ok',
            'plugin_version' => $this->version,
            'wordpress_version' => get_bloginfo('version'),
            'rest_api_available' => true,
            'application_passwords_available' => class_exists('WP_Application_Passwords'),
            'timestamp' => current_time('c')
        ));
    }
    
    /**
     * Log automation action
     */
    public function log_automation_action($request) {
        $action = sanitize_text_field($request->get_param('action'));
        $details = $request->get_param('details');
        
        // Store in custom table or as option
        $log_entry = array(
            'action' => $action,
            'details' => $details,
            'timestamp' => current_time('mysql'),
            'user_id' => get_current_user_id(),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        );
        
        $logs = get_option('t2e_automation_logs', array());
        array_unshift($logs, $log_entry);
        
        // Keep only last 1000 entries
        $logs = array_slice($logs, 0, 1000);
        
        update_option('t2e_automation_logs', $logs);
        
        return rest_ensure_response(array('logged' => true));
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Register custom post type for templates
        $this->register_post_types();
        
        // Create upload directories
        $upload_dir = wp_upload_dir();
        $t2e_dir = $upload_dir['basedir'] . '/t2e-agent';
        if (!file_exists($t2e_dir)) {
            wp_mkdir_p($t2e_dir);
        }
        
        // Set default options
        add_option('t2e_agent_version', $this->version);
        add_option('t2e_automation_logs', array());
        
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        flush_rewrite_rules();
    }
    
    /**
     * Register custom post types
     */
    private function register_post_types() {
        register_post_type('t2e_template', array(
            'labels' => array(
                'name' => 'AI Templates',
                'singular_name' => 'AI Template'
            ),
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => 'tools.php',
            'capability_type' => 'post',
            'supports' => array('title', 'editor')
        ));
    }
    
    /**
     * Enqueue scripts
     */
    public function enqueue_scripts() {
        // Only load on admin pages if needed
        if (is_admin()) {
            wp_enqueue_style('t2e-agent-admin', plugin_dir_url(__FILE__) . 'assets/admin.css', array(), $this->version);
        }
    }
    
    /**
     * Handle authentication errors
     */
    public function authenticate_request($result) {
        if (!empty($result)) {
            return $result;
        }
        
        // Allow application password authentication for our endpoints
        if (strpos($_SERVER['REQUEST_URI'], $this->api_namespace) !== false) {
            return null; // Let our check_permissions handle it
        }
        
        return $result;
    }
}

// Initialize the plugin
new T2E_Agent();

/**
 * Helper functions for template usage
 */

/**
 * Get T2E agent logs
 */
function t2e_get_logs($limit = 100) {
    $logs = get_option('t2e_automation_logs', array());
    return array_slice($logs, 0, $limit);
}

/**
 * Check if post was created by T2E agent
 */
function t2e_is_agent_post($post_id) {
    return get_post_meta($post_id, '_t2e_ai_generated', true) || get_post_meta($post_id, '_t2e_automation_id', true);
}

/**
 * Get T2E agent post metadata
 */
function t2e_get_post_metadata($post_id) {
    return array(
        'ai_generated' => get_post_meta($post_id, '_t2e_ai_generated', true),
        'source_url' => get_post_meta($post_id, '_t2e_source_url', true),
        'automation_id' => get_post_meta($post_id, '_t2e_automation_id', true),
        'created_at' => get_post_meta($post_id, '_t2e_created_at', true)
    );
}
