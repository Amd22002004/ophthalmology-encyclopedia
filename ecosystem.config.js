module.exports = {
  apps: [
    {
      name: "ophthalmology-oftalmologia",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/oftalmologia.pro",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
    },
    {
      name: "ophthalmology-email-worker-oftalmologia",
      script: "node_modules/.bin/tsx",
      args: "scripts/process-email-outbox.ts",
      cwd: "/var/www/oftalmologia.pro",
      env: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--conditions=react-server",
      },
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};
