module.exports = {
  apps: [
    {
      name: 'hmti-backend',
      cwd: '/var/www/hmti/hmti-backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      max_memory_restart: '700M',
      time: true,
    },
  ],
};
