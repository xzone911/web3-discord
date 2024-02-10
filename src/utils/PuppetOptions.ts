import LanguagePack, {LanguageFactory} from "./language-pack";
import Language from "../enums/language";
import PuppetOptionInterface from "../interfaces/PuppetOption.interface";

export default function PuppetOptions(token: string,
                                headless = false,
                                args: string[] = [],
                                userDataDir?: string,
                                logs = true,
                                waitLogin = 10,
                                waitElement = 1000,
                                waitExecution = 1000,
                                ignoreDefaultArgs = false,
                                language: Language | LanguagePack = Language.EN): PuppetOptionInterface {
	return {
		token: token,
		userDataDir: userDataDir,
		logs: logs,
		headless: headless,
		waitLogin: waitLogin,
		waitElement: waitElement,
		waitExecution: waitExecution,
		args: args,
		ignoreDefaultArgs: ignoreDefaultArgs,
		language: language instanceof LanguagePack ? language : LanguageFactory.get(language)
	}
}
