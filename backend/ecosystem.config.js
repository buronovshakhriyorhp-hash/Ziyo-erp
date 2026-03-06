module.exports = {
    apps: [
        {
            name: 'ziyo-erp-backend',
            script: './dist/server.js',
            instances: 'max', // Use all available CPU cores for maximum concurrency
            exec_mode: 'cluster', // Enables clustering mode
            watch: false, // Do not watch in production to save CPU
            max_memory_restart: '1G', // Gracefully restart if memory exceeds 1GB
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            log_date_format: 'YYYY-MM-DD HH:mm Z',
            error_file: 'logs/err.log',
            out_file: 'logs/out.log',
            merge_logs: true,
        },
    ],
};
