/* eslint-env node, mocha */
/* eslint-disable no-sync */
'use strict';
const fs = require('fs');
const path = require('path');
const rreaddir = require('recursive-readdir');
const {strictEqual, deepStrictEqual} = require('assert');
const webpack = require('webpack');
const rimraf = require('rimraf');
const AssetsPlugin = require('..');
const outputFolder = path.join(__dirname, 'output');


function test_text_files({outputPath, publicPath, expectedFiles, expectedContents}, done){
	const config = {
		target: 'web',
		context: __dirname,
		entry: './fixtures/entry.js',
		output: {
			filename: 'bundle.js',
			path: outputPath,
			publicPath
		},
		plugins: [
			new AssetsPlugin({
				'fixtures/file1.txt': 'file1.txt',
				'fixtures/file2.txt': 'file2-renamed.txt',
				'fixtures/file3.txt': 'subfolder/file3.txt',
				'fixtures/extras/file4.txt': 'file4.txt'
			})
		],
		performance: {
			hints: false
		}
	};

	let throws = false;
	try {
		webpack(config, buildError => {
			strictEqual(buildError, null, 'No build error');
			rreaddir(outputFolder, (readdirError, actualFiles) => {
				deepStrictEqual(
					actualFiles.sort(),
					expectedFiles.map(filename => path.join(outputFolder, filename)).sort(),
					'Generated all expected files, and only those files'
				);

				for (const filename in expectedContents){
					strictEqual(
						expectedContents[filename],
						fs.readFileSync(path.join(outputFolder, filename), 'utf8'),
						`${filename} has contains the expected text`
					);
				}

				done();
			});
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, false, `Webpack doesn't throw an Error`);
}


function test_binary_files(done){
	const config = {
		target: 'web',
		context: __dirname,
		entry: './fixtures/entry.js',
		output: {
			filename: 'bundle.js',
			path: outputFolder,
			publicPath: ''
		},
		plugins: [
			new AssetsPlugin({
				'fixtures/file5.png': 'file5.png'
			})
		],
		performance: {
			hints: false
		}
	};

	let throws = false;
	try {
		webpack(config, buildError => {
			strictEqual(buildError, null, 'No build error');
			rreaddir(outputFolder, (readdirError, actualFiles) => {
				const expectedFiles = ['bundle.js', 'file5.png'];
				deepStrictEqual(
					actualFiles.sort(),
					expectedFiles.map(filename => path.join(outputFolder, filename)).sort(),
					'Generated all expected files, and only those files'
				);

				const actualContents = fs.readFileSync(path.join(outputFolder, 'file5.png'));
				const expectedContents = fs.readFileSync(path.join(__dirname, 'fixtures/file5.png'));
				strictEqual(
					expectedContents.equals(actualContents),
					true,
					`file5.png has contains the expected contents`
				);

				done();
			});
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, false, `Webpack doesn't throw an Error`);
}


function eraseOutput(done){
	rimraf(outputFolder, () => {
		done();
	});
}


describe('@wildpeaks/webpack-assets-plugin', /* @this */ function(){
	this.slow(3000);
	this.timeout(4000);
	beforeEach(eraseOutput);
	after(eraseOutput);

	it('Text files', test_text_files.bind(this, {
		outputPath: outputFolder,
		publicPath: '',
		expectedFiles: [
			'bundle.js',
			'file1.txt',
			'file2-renamed.txt',
			'subfolder/file3.txt',
			'file4.txt'
		],
		expectedContents: {
			'file1.txt': 'FILE 1',
			'file2-renamed.txt': 'FILE 2',
			'subfolder/file3.txt': 'FILE 3',
			'file4.txt': 'FILE 4'
		}
	}));

	it('Binary files', test_binary_files);

	it('output.publicPath', test_text_files.bind(this, {
		outputPath: outputFolder,
		publicPath: 'mypubpath',
		expectedFiles: [
			'bundle.js',
			'file1.txt',
			'file2-renamed.txt',
			'subfolder/file3.txt',
			'file4.txt'
		],
		expectedContents: {
			'file1.txt': 'FILE 1',
			'file2-renamed.txt': 'FILE 2',
			'subfolder/file3.txt': 'FILE 3',
			'file4.txt': 'FILE 4'
		}
	}));

	it('output.path', test_text_files.bind(this, {
		outputPath: path.join(outputFolder, 'myoutpath'),
		publicPath: '',
		expectedFiles: [
			'myoutpath/bundle.js',
			'myoutpath/file1.txt',
			'myoutpath/file2-renamed.txt',
			'myoutpath/subfolder/file3.txt',
			'myoutpath/file4.txt'
		],
		expectedContents: {
			'myoutpath/file1.txt': 'FILE 1',
			'myoutpath/file2-renamed.txt': 'FILE 2',
			'myoutpath/subfolder/file3.txt': 'FILE 3',
			'myoutpath/file4.txt': 'FILE 4'
		}
	}));
});
