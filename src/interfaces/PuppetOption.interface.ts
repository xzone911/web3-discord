import LanguagePack from "../utils/language-pack"

export default interface PuppetOptionInterface {
	token: string
	waitLogin: number
	waitExecution: number
	headless?: boolean
	logs?: boolean
	userDataDir?: string
	waitElement?: number
	args?: string[]
	ignoreDefaultArgs?: boolean
	language: LanguagePack
}
