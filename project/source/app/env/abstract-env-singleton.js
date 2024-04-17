//###[ ABSTRACT ENV SINGLETONG ]########################################################################################

export class AbstractEnvSingleton {

	#data;

	constructor(className='AbstractEnvSingleton'){
		this.__className__ = className;
	}



	initData(data){
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
			return new Map(JSON.parse(JSON.stringify(this.#data.entries())));
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

}
