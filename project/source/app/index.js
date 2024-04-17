//###[ IMPORTS ]########################################################################################################

import {Context} from 'env/context';

import {init as initMoleculeField} from 'molecules/forms/field';



//###[ PATTERN INITIALIZATION ]#########################################################################################

function initPatterns(app){
	initMoleculeField(app);
}



//###[ APP ]############################################################################################################

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

		// Deactivate console logging in production
		//if( !Config.get('debug') && !Config.get('explicitlyAllowConsoleLogging') ){
			//setLogLevel('warn');
		//}

		//log('###( App started )###');
		//log('###> Context:', Context.get());
		//log('###> Config:', Config.get());

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
