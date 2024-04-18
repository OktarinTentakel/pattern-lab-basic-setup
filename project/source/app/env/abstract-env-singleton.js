//###[ ABSTRACT CLASS ]#################################################################################################

export class AbstractEnvSingleton {

	#data;

	constructor(className='AbstractEnvSingleton'){
		this.__className__ = className;
	}



	initData(data, overrides=null){
		const __methodName__ = 'initData';

		this.#assertDataType(data, __methodName__);
		if( !!overrides ){
			this.#assertDataType(overrides, __methodName__);
			data = this.#mergeData(data, overrides);
		}

		if( !this.#data ){
			this.#data = new Map(Object.entries(data));
		}
	}



	//###( ACCESS )###

	set(key, value, force=false){
		if( this.#data.has(key) && !force ){
			console.error(`${this.__className__} | cannot set existing key without force flag`);
		} else {
			this.#data.set(key, value);
		}
	}



	get(key, defaultVal=null){
		if( !!key ){
			defaultVal = defaultVal ?? null;
			return this.#data.get(key) ?? defaultVal;
		} else {
			return new Map(JSON.parse(JSON.stringify(Array.from(this.#data.entries()))));
		}
	}



	has(key){
		return this.#data.has(key);
	}



	remove(key){
		if( this.has(key) ){
			this.#data.delete(key);
		}
	}



	//###( HELPERS )###

	#isPlainObject(data){
		return (typeof data === 'object')
			&& (data.constructor === Object)
			&& (Object.prototype.toString.call(data) === '[object Object]')
		;
	}



	#assertDataType(data, __methodName__){
		if( !this.#isPlainObject(data) ){
			throw new Error(`${this.__className__}.${__methodName__} | data "${data}" must be a plain object`);
		}
	}


	#mergeData(data, ...overrides){
		const base = {};

		[data].concat(Array.from(overrides)).forEach(extension => {
			for( const prop in extension ){
				if( extension.hasOwnProperty(prop) ){
					if(
						base.hasOwnProperty(prop)
						&& (this.#isPlainObject(base[prop]) && this.#isPlainObject(extension[prop]))
						&& (Object.keys(extension[prop]).length > 0)
					){
						base[prop] = this.#mergeData(base[prop], extension[prop]);
					} else {
						base[prop] = extension[prop];
					}
				}
			}
		});

		return base;
	}

}
