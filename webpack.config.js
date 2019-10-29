'use strict';

const path = require('path');
const webpack = require('webpack');
const config = [];

const generate = name => {
  const options = {
    context: path.resolve(__dirname, 'lib'),
    entry: './elebase.js',
    module: {
      loaders: [
        {
          exclude: /(node_modules|dist)/,
          loader: 'babel-loader',
          test: /\.js?$/
        }
      ]
    },
    node: {
      process: false
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: name + '.js',
      library: 'elebase',
      libraryTarget: 'umd'
    },
    plugins: [
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      })
    ]
  };
  if (name.indexOf('min') > -1) {
    options.plugins.push(
      new webpack.optimize.UglifyJsPlugin({
        compressor: {
          screw_ie8: true,
          warnings: false
        }
      })
    );
  }
  if (name.indexOf('node') > -1) {
    options.target = 'node';
    options.output.libraryTarget = 'commonjs2';
  }
  return options;
};

const filenames = ['elebase', 'elebase.min', 'elebase.node', 'elebase.node.min'];
filenames.forEach(name => config.push(generate(name)));

module.exports = config;
