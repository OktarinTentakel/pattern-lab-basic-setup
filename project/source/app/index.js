/*
 * ~APP~
 */

//###[ IMPORTS ]########################################################################################################

import {Config} from 'env/config.js';
import {Context} from 'env/context';
import {PROJECT_NAME} from 'env/defines';

import {init as initMoleculeFormField} from 'molecules/forms/form-field';



//###[ PATTERN INITIALIZATION ]#########################################################################################

function initPatterns(app){
	initMoleculeFormField(app);
}



//###[ CLASS ]##########################################################################################################

class App {

	#eHtml;

	constructor(){
		Context.detectPatternlab();

		this.#eHtml = document.querySelector('html');


		// ready/loaded

		const fSetLoaded = () => {
			this.#eHtml.classList.add('is__loaded');
		};

		this.#eHtml.classList.add('is__ready');
		if( document.readyState === 'complete' ){
			fSetLoaded();
		} else {
			window.addEventListener('load', fSetLoaded, {once: true});
		}


		// touch

		const fSetTouch = () => {
			this.#eHtml.classList.add('has__touch');
		};

		if( Context.get('isTouchDevice') ){
			fSetTouch();
		}
		window.addEventListener('touchstart', fSetTouch, {once: true});


		// running in iframe

		if( Context.get('runningInIframe') ){
			this.#eHtml.classList.add('is__in-iframe');
		}


		// running in pattern lab

		if( Context.get('runningInPatternLab') ){
			this.#eHtml.classList.add('is__in-pattern-lab');
		}

		if( Context.get('runningInPatternLabList') ){
			this.#eHtml.classList.add('is__in-pattern-lab-list');
		}

		if( Context.get('runningInPatternLabDetails') ){
			this.#eHtml.classList.add('is__in-pattern-lab-details');
		}

		if( Context.get('runningInPatternLabTemplateOrPage') ){
			this.#eHtml.classList.add('is__in-pattern-lab-template-or-page');
		}

		if( !Config.get('debug') && !Config.get('explicitlyAllowConsoleLogging') ){
			// Deactivate console logging in production
			//setLogLevel('warn');
		} else {
		}
			console.info(`###( ${PROJECT_NAME} started )###`);
			console.info('###> Environment:', __ENVIRONMENT__);
			console.info('###> Config:');
			console.info(`${JSON.stringify(
				Array.from(Config.get().entries()).reduce(
					(obj, entry) => {
						obj[entry[0]] = entry[1];
						return obj;
					},
					{}
				)
			, null, 4)}`);
			console.info('###> Context:');
			console.info(`${JSON.stringify(
				Array.from(Context.get().entries()).reduce(
					(obj, entry) => {
						obj[entry[0]] = entry[1];
						return obj;
					},
					{}
				)
			, null, 4)}`);

		this.#initPatterns();
	}



	#initPatterns(){
		const scaffolded = new Promise(resolve => {
			if( __ENVIRONMENT__ === 'prod' ){
				resolve();
			} else {
				import('pattern-lab/pattern-scaffolding').then(() => { resolve(); });
			}
		});

		scaffolded
			.then(() => {
				initPatterns(this);
			})
			.catch(error => {
				console.error(error);
			})
		;
	}

}

new App();
