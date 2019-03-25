const path = require('path');

const web = {
  entry: './src/import.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'skulpt.js'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties']
          }
        }
      }
    ]
  }
};

const node = {
  target: 'node',
  entry: './src/import.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'skulpt.node.js'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties']
          }
        }
      }
    ]
  }
};

module.exports = [web, node];