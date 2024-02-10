import Language from "../enums/language"
import * as EN from "../i18n/en.json"
import * as ZH from "../i18n/zh.json"

export enum Label {
	Close = "close",
	Servers = "servers",
	Channels = "channels"
}

export default class LanguagePack {
	language: string
	values: Record<Label, string>

	public constructor(language: string, values: Record<Label, string>) {
		this.language = language
		this.values = values
	}

	value(key: Label): string {
		if (this.values[key] == null) {
			throw new Error("Label not found")
		} else {
			return this.values[key]
		}
	}
}

const parseI18n = (language: Language): Record<Label, string> => {
	switch (language) {
		case Language.EN:
			return EN
		case Language.ZH:
			return ZH
	}
}


class LanguageFactory {
	static get = (language: Language) => {
		switch (language) {
			case Language.EN:
				return new LanguagePack(Language.EN, parseI18n(Language.EN))
			case Language.ZH:
				return new LanguagePack(Language.ZH, parseI18n(Language.ZH))
			default:
				throw new Error("Language not found")
		}
	}
}

export {
	LanguageFactory
}
