const fs = require('fs');
const path = require('path');
const cntrPath = '/run/secrets';

class Secrets {
    constructor() {
        if (Secrets.instance){
            return Secrets.instance;
        }
        this._secrets = {};
        this._loadSecrets();

        Secrets.instance = this;
    }

    _loadSecrets() {
        
        /*const secretsPath = fs.existsSync(cntrPath)
            ? '/run/secrets'
            : path.join(__dirname, '..', 'secrets');*/

        const secretsPath = this._getSecretsPath();

        //console.log('secretsPath ', secretsPath);
        
        if (!fs.existsSync(secretsPath)) {
            console.warn(`Secrets directory (${secretsPath}) not found.`);
            return;
        }

        const files = fs.readdirSync(secretsPath);
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(secretsPath, file), 'utf8').trim();
                this._secrets[file] = content;
            } catch (err) {
                console.error(`Error while reading ${file}:`, err);
            }
        }
    }

    _getSecretsPath() {
        if (fs.existsSync('/run/secrets')) {
          return '/run/secrets';
        }
        return path.join(__dirname, '../../', 'secrets');
    }

    get(key) {
        return this._secrets[key];
    }

    /*set(key, value) {
        const secretsPath = this._getSecretsPath();
        const filePath = path.join(secretsPath, key);

        try {
            fs.writeFileSync(filePath, value, 'utf8');
            this._secrets[key] = value;
            console.log(`Secret ${key} stored in ${filePath}`);
        } catch (err) {
            console.error(`Error while storing secret ${key}:`, err);
        }
    }*/

    getAll() {
        return { ...this._secrets };
    }
}

module.exports = new Secrets();