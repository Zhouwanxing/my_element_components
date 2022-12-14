const path = require('path')
const utils = require('./utils')
const config = require('../config')
const vueLoaderConfig = require('./vue-loader.conf')
const webpack=require('webpack');
const HappyPack = require('happypack');
const os = require('os');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });
const isProduction = (process.env.NODE_ENV === 'production');

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

module.exports = {
  mode : 'development',
  entry: {
    // app: './src/main.js'
    app: ["babel-polyfill", "./src/main.js"]
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js',
    libraryTarget: 'umd',
    publicPath: process.env.NODE_ENV === 'production'
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': resolve('src'),
      'jquery': 'jquery',
      'components': resolve('src/components'),
      'assets': resolve('src/assets'),
    }
  },
  // externals: {
  //   'vue': 'Vue',
  //   'lodash': '_',
  //   'babel-polyfill': 'window',
  //   '../../../lib/go.js': 'window',
  //   'emojione': 'Emojione',
  //   'echarts': 'echarts',
  //   'echarts/map/json/china-cities.json': 'Citys',
  // },
  module: {
    rules: [
      // {
      //   test: /\.(js|vue)$/,
      //   loader: 'eslint-loader',
      //   enforce: 'pre',
      //   include: [resolve('src'), resolve('test')],
      //   options: {
      //     formatter: require('eslint-friendly-formatter')
      //   }
      // },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig
      },
      // {
      //   test: /\.js$/,
      //   loader: 'babel-loader',
      //   include: [resolve('src'), resolve('test')]
      // },
      {
        test: /\.js$/,
        //??????.js ?????????????????????id???happyBabel ???HappyPack ???????????????
        loader: 'happypack/loader?id=happyBabel',
        //??????node_modules ??????????????????
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('img/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('media/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(less|css)$/,
        use: isProduction ? ['vue-style-loader', 'css-loader', 'less-loader'] : ['vue-style-loader']// ??????!  ??????
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      _: "lodash",
      STORE: "store",
      uuid: "uuid"
    }),
    new HappyPack({
      //???id????????? happypack?????????????????????
      id: 'happyBabel',
      //????????????  ?????????loader ???????????????
      loaders: [{
        loader: 'babel-loader?cacheDirectory=true',
      }],
      //???????????????
      threadPool: happyThreadPool,
      //?????? HappyPack ????????????
      verbose: true,
    }),
  ],
  performance: {
    hints: false
  }
}
