//###[ IMPORTS ]########################################################################################################

import {PROJECT_PREFIX} from 'env/defines';
import {AbstractEnvSingleton}  from 'env/abstract-env-singleton';



//###[ CLASS ]##########################################################################################################

class ConfigSingleton extends AbstractEnvSingleton {

	constructor(){
		super('Config');

		super.initData(
			{
				debug : false,
				explicitlyAllowConsoleLogging : false,
				staticBase : '/',
			},
			globalThis[`__${PROJECT_PREFIX.toUpperCase()}__CONFIG`]
		);
	}

}

export const Config = new ConfigSingleton();
