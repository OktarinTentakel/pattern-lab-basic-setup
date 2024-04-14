import fs from 'node:fs';
import path from 'node:path';
import {deleteAsync as del} from 'del';
import task from 'tasuku';
import yargs from 'yargs';
import patternlabFactory from '@pattern-lab/core';
import {Roarr as log} from 'roarr';
import outdent from 'outdent';
import browserSync from 'browser-sync';
import compression from 'compression';
import * as esbuildFactory from 'esbuild';
import * as sassFactory from 'sass';
import browserslistToEsbuild from 'browserslist-to-esbuild';

import patternLabConfig from './patternlab-config.json' assert {type : 'json'};



const
	JS_INCLUDE_PATHS = [
		path.resolve(patternLabConfig.paths.source.app),
		path.resolve(patternLabConfig.paths.source.patterns),
	],
	SCSS_INCLUDE_PATHS = [
		path.resolve(patternLabConfig.paths.source.styles),
		path.resolve(patternLabConfig.paths.source.patterns),
	],
	ESBUILD_CONFIG = {
		nodePaths : JS_INCLUDE_PATHS,
		target : browserslistToEsbuild(),
		define : {
			__PROD_BUILD__ : 'false',
		},
		bundle : true,
		minify : true,
		sourcemap  :true,
		entryPoints : [path.resolve(patternLabConfig.paths.source.app, 'index.js')],
		outfile : path.resolve(patternLabConfig.paths.public.root, 'js', 'app.js'),
	},
	SASS_CONFIG = {
		outputStyle : 'compressed',
		loadPaths : SCSS_INCLUDE_PATHS,
		sourceMap : true,
	}
;



const
	argv = yargs(process.argv).argv,
	patternLab = patternlabFactory(patternLabConfig),
	server = browserSync.create(),
	esbuild = await esbuildFactory.context(ESBUILD_CONFIG),
	sass = sassFactory.initCompiler()
;

let patternLabBuildCount = 0;



function reload(){
	server.reload();
}

function reloadJS(){
	server.reload('*.js');
}

function reloadCSS(){
	server.reload('*.css');
}



function removeNonTwigHeadAndFootTemplates(){
	task('removing non-twig meta templates', async({setStatus}) => {
		setStatus('removing');

		const basePath = patternLabConfig.paths.source.meta;
		await del(path.resolve(basePath, '*.hbs'));
		await del(path.resolve(basePath, '*.mustache'));

		setStatus('removed');
	});
}



function buildApp(){
	task('building app', async({setStatus}) => {
		setStatus('building');

		await esbuild.rebuild();

		setStatus('built');
	});
}



function buildStyles(){
	task('building styles', async({setStatus}) => {
		setStatus('building');

		const result = sass.compile(
			path.resolve(patternLabConfig.paths.source.styles, 'index.scss'),
			SASS_CONFIG
		);

		const targetPath = path.resolve(patternLabConfig.paths.public.root, 'css');
		if( !fs.existsSync(targetPath) ){
			fs.mkdirSync(targetPath);
		}
		fs.writeFileSync(
			path.resolve(targetPath, 'app.css'),
			result.css
		);
		fs.writeFileSync(
			path.resolve(targetPath, 'app.css.map'),
			JSON.stringify(result.sourceMap, null, 2)
		);

		setStatus('built');
	});
}



function startPatternLab(){
	task('starting Pattern Lab', async({setStatus}) => {
		setStatus('starting');

		patternLab.events.on('patternlab-build-end', () => {
			patternLabBuildCount++;
			log.info(`Pattern Lab build [${patternLabBuildCount}] finished, reloading browser`);
			reload();
		});

		const built = patternLab
			.build({
				watch : true,
				cleanPublic : patternLabConfig.cleanPublic
			})
		;

		const served = new Promise(resolve => {
			browserSync.init({
				server : {
					baseDir : path.resolve(patternLabConfig.paths.public.root),
					middleware : compression()
				},
				host : '0.0.0.0',
				cors : true,
				open : false,
				ghostMode : false,
				snippetOptions : {
					// not for the pattern lab frame itself
					blacklist : ['/index.html', '/', '/?*']
				},
			}, () => {
				resolve();
			});
		});

		Promise.all([built, served]).then(() => {
			setStatus('started and watching');
		});
	});
}



switch( argv.task ){
	case 'start':
		startPatternLab();
		removeNonTwigHeadAndFootTemplates();
		buildApp();
		buildStyles();
	break;

	default:
		log.error(`unknown task "${argv.task}", make sure to define a task using --task=taskname`);
	break;
}
