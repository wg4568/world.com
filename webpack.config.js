const path = require("path");
const config = require("./config.json");
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

const smp = new SpeedMeasurePlugin();

module.exports = smp.wrap({
    entry: "./src/client/main.ts",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
                options: {
                    configFile: "tsconfig.webpack.json",
                    transpileOnly: true,
                    experimentalWatchApi: true
                }
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    output: {
        library: "WORLD",
        filename: "bundle.js",
        path: path.resolve(__dirname, "static/js")
    },
    optimization: {
        minimize: !config.debug
    }
});
