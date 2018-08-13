import { observable, action } from 'mobx';

interface IValidatorRule {
    rule: (value: string) => boolean;
    message: (value: string) => string | string;
}

export class Validator {
    constructor(public rules: IValidatorRule[] = []) {}

    check(value: string) {
        let error = null;

        this.rules.some(({ rule, message }) => {
            if (rule(value)) return true;
            error = typeof message === 'function' ? message(value) : message;
            return false;
        });

        return error;
    }
}

export default class Field {
    @observable
    value: string = '';

    @observable
    error: string | null = null;

    validator?: Validator;
    transformer?: (value: string) => string;

    constructor(validator?: Validator) {
        this.validator = validator;
    }

    @action.bound
    handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        let value = e.target.value;
        if (this.validator) this.error = this.validator.check(e.target.value);
        if (this.transformer) value = this.transformer(e.target.value);
        this.value = value;
    }
}

const bannedSymbols = ['\\', '@', '"', "'", ' '];
const getBannedSymbol = (value: string) =>
    value
        .split('')
        .reduce(
            (chars: string, currChar: string) =>
                (chars +=
                    bannedSymbols.includes(currChar) && !chars.includes(currChar) ? currChar : ''),
            '',
        );

const rules = [
    {
        rule: (v: string) => !bannedSymbols.some(s => v.includes(s)),
        message: (v: string) =>
            `Character '${getBannedSymbol(v)
                .split('')
                .join(',')}' is not allowed`,
    },
];

export class LoginField extends Field {
    validator = new Validator(rules);

    transformer = (value: string) => value += '@virgilfirebase.com';
}
