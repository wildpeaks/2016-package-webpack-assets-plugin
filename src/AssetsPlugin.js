/* eslint-env node */
'use strict';
const fs = require('fs');
const path = require('path');
const async = require('async');


function AssetsPlugin(options){
	this.options = options;
}

AssetsPlugin.prototype.apply = function(compiler){
	const options = this.options;
	compiler.plugin('emit', (compilation, done) => {
		async.each(
			Object.keys(options),
			(asset, next) => {
				const filepath = path.join(compiler.context, asset);
				fs.readFile(filepath, (error, buffer) => {
					if (!error){
						const target = options[asset];
						compilation.fileDependencies.push(filepath);
						compilation.assets[target] = {
							source(){
								return buffer;
							},
							size(){
								return buffer.length;
							}
						};
					}
					next();
				});
			},
			done
		);
	});
};

module.exports = AssetsPlugin;
