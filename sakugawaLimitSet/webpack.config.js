const webpack = require('webpack');
const path = require('path');

const src  = path.resolve(__dirname, 'src');
const dist = path.resolve(__dirname, 'docs');

module.exports = () => ({
    entry: [`${src}/index.js`],

    output: {
        path: dist,
        filename: 'bundle.js',
    },
    mode: 'development',

    module: {
        rules: [
            {
                test: /\.vue$/,
                use: [
                    {
                        loader: 'vue-loader',
                    }
                ]
            },
            {
                test: /\.(glsl|vert|frag)$/,
                exclude: /\.(njk|nunjucks)\.(glsl|vert|frag)$/,
                use: [
                    {
                        loader: 'shader-loader',
                    }
                ]
            },
            {
                test: /\.js$/,
                exclude: /node_modules(?!(\/|\\)keen-ui)/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [['@babel/preset-env', { modules: false }]]
                        }
                    }
                ]
            },
            {
                test: /\.png$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'url-loader',
                    }
                ]
            }
        ]},

    devtool: (process.env.NODE_ENV === 'production') ? false : 'inline-source-map',

    resolve: {
        extensions: ['.js'],
    },

    devServer: {
        contentBase: 'docs',
        port: 8080,
    },

    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ],
});
