//###[ IMPORTS ]########################################################################################################

import {AbstractEnvSingleton}  from 'env/abstract-env-singleton';



//###[ CLASS ]##########################################################################################################

class ContextSingleton extends AbstractEnvSingleton {

	constructor(){
		super('Context');

		super.initData({
			isTouchDevice : ('ontouchstart' in document)
				&& ('ontouchend' in document)
				&& (window.navigator.maxTouchPoints > 0)
			,
			runningInIframe : parent !== window,
			// the pattern lab context attributes need init after document ready by calling
			// detectPatternlab() below explicitly, until then we assume a prod context
			runningInPatternLab : false,
			runningInPatternLabList : false,
			runningInPatternLabTemplateOrPage : false,
			runningInPatternLabDetails : false,
		});
	}



	//###( FUNCTIONALITY )###

	detectPatternlab(){
		this.set(
			'runningInPatternLab',
			(
				!!document.querySelector('html.pl-c-html')
				|| !!window.parent.document.querySelector('html.pl-c-html')
				|| !!document.querySelector('body > script.pl-js-pattern-data')
			),
			true
		);

		this.set(
			'runningInPatternLabList',
			(
				this.get('runningInPatternLab')
				&& !!document.querySelector('.pl-c-pattern-index')
			),
			true
		);

		this.set(
			'runningInPatternLabTemplateOrPage',
			(
				this.get('runningInPatternLab')
				&& !!document.querySelector('body > main')
			),
			true
		);

		this.set(
			'runningInPatternLabDetails',
			(
				this.get('runningInPatternLab')
				&& !this.get('runningInPatternLabList')
				&& !this.get('runningInPatternLabTemplateOrPage')
			),
			true
		);
	}

}

export const Context = new ContextSingleton();
