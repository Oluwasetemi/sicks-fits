module.exports = {
  webpack(config) {
    config.devtool = 'eval-source-map';
    return config;
  }
};
