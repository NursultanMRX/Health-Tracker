// PM2 Ecosystem Configuration for Health Tracker
// This file configures how PM2 manages your application

module.exports = {
  apps: [{
    name: 'health-tracker',
    script: './server.js',

    // Instances
    instances: 1,
    exec_mode: 'fork', // Use 'cluster' for multiple instances

    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },

    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Auto-restart configuration
    watch: false, // Set to true for development auto-reload
    ignore_watch: ['node_modules', 'logs', 'dist', '*.db', '*.db-shm', '*.db-wal'],
    max_memory_restart: '500M',

    // Restart strategy
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',

    // Process management
    kill_timeout: 5000,
    wait_ready: false,
    listen_timeout: 3000,

    // Advanced features
    exp_backoff_restart_delay: 100,

    // Cron restart (optional - restart daily at 3 AM)
    // cron_restart: '0 3 * * *',
  }]
};
