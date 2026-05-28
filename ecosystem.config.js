module.exports = {
  apps: [
    {
      name: "ophthalmology",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/vysotsky.pro",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
