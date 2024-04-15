//###[ IMPORTS ]########################################################################################################

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
import Watcher from 'watcher';

import patternLabConfig from './patternlab-config.json' assert {type : 'json'};



//###[ CLI ]############################################################################################################

const argv = yargs(process.argv).argv;



//###[ CONSTANTS ]######################################################################################################

const
	ENVIRONMENT = (!!argv.environment && (argv.environment.trim() !== ''))
		? `${argv.environment.trim()}`
		: 'dev'
	,
	JS_INCLUDE_PATHS = [
		path.resolve(patternLabConfig.paths.includes.app),
		path.resolve(patternLabConfig.paths.source.patterns),
	],
	SCSS_INCLUDE_PATHS = [
		path.resolve(patternLabConfig.paths.includes.styles),
		path.resolve(patternLabConfig.paths.source.patterns),
	],
	ESBUILD_CONFIG = {
		nodePaths : JS_INCLUDE_PATHS,
		target : browserslistToEsbuild(),
		define : {
			__ENVIRONMENT__ : `'${ENVIRONMENT}'`
		},
		bundle : true,
		minify : true,
		sourcemap  : true,
		entryPoints : [path.resolve(patternLabConfig.paths.includes.app, 'index.js')],
		outfile : path.resolve(patternLabConfig.paths.public.root, 'js', 'app.js'),
	},
	SASS_CONFIG = {
		style : 'compressed',
		loadPaths : SCSS_INCLUDE_PATHS,
		sourceMap : true,
	},
	WATCHER_CONFIG = {
		ignoreInitial : true,
		recursive : true,
	},
	WATCHER_EVENTS = ['add', 'change', 'unlink'],
	BROWSER_SYNC_CONFIG = {
		server : {
			baseDir : path.resolve(patternLabConfig.paths.public.root),
			middleware : compression()
		},
		host : '0.0.0.0',
		port : 443,
		https : true,
		cors : true,
		open : false,
		ghostMode : false,
		snippetOptions : {
			// not for the pattern lab frame itself
			blacklist : ['/index.html', '/', '/?*']
		},
	}
;



//###[ PROVIDERS ]######################################################################################################

const
	patternLab = patternlabFactory(patternLabConfig),
	server = browserSync.create(),
	esbuild = await esbuildFactory.context(ESBUILD_CONFIG),
	sass = sassFactory.initCompiler()
;

let
	patternLabBuildCount = 0,
	appWatcher,
	stylesWatcher
;



//###[ TASK DEFINITIONS ]###############################################################################################

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

		const
			entrySource = fs.readFileSync(path.resolve(patternLabConfig.paths.includes.styles, 'index.scss'), 'utf8'),
			result = sass.compileString(
				`$__ENVIRONMENT__: ${ENVIRONMENT};\n`
				+ entrySource,
				SASS_CONFIG
			)
		;

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
			server.reload();
		});

		const built = patternLab
			.build({
				watch : true,
				cleanPublic : patternLabConfig.cleanPublic
			})
		;

		const served = new Promise(resolve => {
			server.init(BROWSER_SYNC_CONFIG, () => {
				resolve();
			});
		});

		Promise.all([built, served]).then(() => {
			setStatus('started and watching');
		});
	});
}



function watchPatternLab(){
	// is automatically handled by patternLab.build({watch : true}) above
}



function watchApp(){
	task('watching app files', async({setStatus}) => {
		setStatus('watching');

		appWatcher = new Watcher (
			JS_INCLUDE_PATHS,
			WATCHER_CONFIG,
			(e, targetPath) => {
				if(
					WATCHER_EVENTS.includes(e)
					&& /\.(js)$/.test(targetPath)
				){
					setStatus(`${e}@${path.basename(targetPath)}`);
					buildApp();
					server.reload('*.js');
				}
			}
		);
	});
}



function watchStyles(){
	task('watching style files', async({setStatus}) => {
		setStatus('watching');
		stylesWatcher = new Watcher(
			SCSS_INCLUDE_PATHS,
			WATCHER_CONFIG,
			(e, targetPath) => {
				if(
					WATCHER_EVENTS.includes(e)
					&& /\.(scss)$/.test(targetPath)
				){
					setStatus(`${e}@${path.basename(targetPath)}`);
					buildStyles();
					server.reload('*.css');
				}
			}
		);
	});
}



function watch(){
	watchPatternLab();
	watchApp();
	watchStyles();
}



//###[ TASKS ]##########################################################################################################

switch( argv.task ){
	case 'start':
		startPatternLab();
		removeNonTwigHeadAndFootTemplates();
		buildApp();
		buildStyles();
		watch();
	break;

	default:
		log.error(`unknown task "${argv.task}", make sure to define a task using --task=taskname`);
	break;
}
