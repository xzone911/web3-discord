import puppeteer from "puppeteer-extra"
import {Browser, ElementHandle, Page} from "puppeteer"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
// @ts-ignore
import UserDir from "puppeteer-extra-plugin-user-data-dir"
import {Ids, Message, Option} from "./interfaces"
import {Label} from "./utils/language-pack"
import PuppetInterface from "./interfaces/puppet.interface"
import PuppetOptionInterface from "./interfaces/PuppetOption.interface"

export default class Puppet implements PuppetInterface {
	// @ts-ignore
	protected browser: Browser
	// @ts-ignore
	protected page: Page
	protected options: PuppetOptionInterface

	constructor(options: PuppetOptionInterface) {
		puppeteer.use(StealthPlugin())
		puppeteer.use(UserDir())
		this.options = options
	}

	async start(serverId?: string): Promise<void> {
		this.browser = await puppeteer.launch({
			headless: this.options.headless,
			userDataDir: this.options.userDataDir,
			args: this.options.args,
			ignoreDefaultArgs: this.options.ignoreDefaultArgs
		})
		this.page = await this.browser.newPage()
		if (serverId != null) {
			await this.goToServer(serverId)
		} else {
			await this.goToMain()
		}

		await this.login()
		await this.waitExecution(2)
		await this.closeAllPopups()
	}

	async sendCommand(command: string, args?: string | undefined): Promise<void> {
		this.log(`send command[${command}: ${args}]`)
		await this.page.click('[data-slate-editor="true"]')
		await this.page.keyboard.press('/')
		await this.waitExecution()
		await this.page.type('[data-slate-editor="true"]', `${command}`)
		await this.waitExecution(2)
		await this.page.keyboard.press('Enter')
		await this.waitExecution()
		if (args != null) {
			await this.page.type('[data-slate-editor="true"]', `${args}`)
		}
		await this.page.keyboard.press('Enter')
		await this.waitExecution()
	}

	async getLastMsgRaw(): Promise<ElementHandle> {
		await this.page.waitForSelector('ol[data-list-id="chat-messages"] > li:last-of-type')
		const lastMsg = await this.page.$('ol[data-list-id="chat-messages"] > li:last-of-type')
		if (lastMsg == null) {
			throw new Error("No Message")
		}
		return lastMsg
	}

	async getLastMsg(): Promise<Message> {
		await this.page.waitForSelector('ol[data-list-id="chat-messages"] > li:last-of-type')
		const li = await this.page.$('ol[data-list-id="chat-messages"] > li:last-of-type')
		if (li == null) {
			throw new Error("No Message")
		}
		return this.parseMessage(li)
	}

	async getMessage(messageId: string): Promise<Message> {
		const li = await this.page.$(`li[id$="${messageId}"]`)
		if (li == null) {
			throw new Error(`Message ${messageId} not found`)
		}
		return await this.parseMessage(li)
	}

	parseIds(id: string): Ids {
		const ids = id.split("-")
		return {
			channelId: ids[2],
			messageId: ids[3]
		}
	}

	async parseMessage(li: ElementHandle): Promise<Message> {
		const liId = await this.getProperty(li, 'id')
		const {channelId, messageId} = this.parseIds(liId)
		await this.page.waitForSelector(`li[id="${liId}"] div[id="message-content-${messageId}"]`)
		const content = await li.$eval(`div[id="message-content-${messageId}"]`, it => it.textContent)
		const article = await li.$('div[class*="embedDescription"]')
		let articleContent = null
		if (article != null) {
			articleContent = await li.$eval('div[class*="embedDescription"]', it => it.textContent)
		}
		const accessories = await li.$('div[id*="message-accessories"]')
		if (accessories == null) throw new Error("No Message")
		const divs = await accessories.$$('button');
		const actions: any = {};
		for (const div of divs) {
			const textContent = await div.evaluate(el => el.textContent)
			if (textContent == null) throw new Error("No Message")
			if (textContent.startsWith('U') || textContent.startsWith('V')) {
				actions[textContent] = div
			}
		}
		return {
			channelId: channelId,
			messageId: messageId,
			messageContent: content,
			article: articleContent,
			actions: actions
		}
	}

	async getProperty(elem: ElementHandle, property: string): Promise<string> {
		const jsProperty = await elem?.getProperty(property)
		// @ts-ignore
		return await jsProperty?.jsonValue()
	}

	label(label: Label): string {
		return this.options.language.value(label)
	}

	async goToServer(serverId: string): Promise<void> {
		this.log(`server[${serverId}]: go`)
		await this.page.goto(`https://discord/channels/${serverId}`, {waitUntil: 'load'})
		this.log(`server[${serverId}]: navigate`)
		await this.page.waitForSelector(`div[aria-label=${this.label(Label.Servers)}]`, {visible: true})
		await this.waitExecution()
		this.log(`server[${serverId}]: done`)
	}

	async goToChannel(serverId: string, channelId: string): Promise<void> {
		this.log(`channel[${serverId}, ${channelId}]: go`)
		await this.page.goto(`https://discord.com/channels/${serverId}/${channelId}`, {waitUntil: "load"})
		this.log(`channel[${serverId}, ${channelId}]: navigate`)
		await this.page.waitForSelector(`ol[data-list-id="chat-messages"]`, {visible: true})
		await this.waitExecution()
		this.log(`channel[${serverId}, ${channelId}]: done`)
	}

	async sendMessage(message: string): Promise<void> {
		this.log(`send message {${message}`)
		await this.page.click('[data-slate-editor="true"]')
		await this.page.type('[data-slate-editor="true"]', message)
		await this.page.keyboard.press('Enter')
	}


	async goToMain(): Promise<void> {
		this.log(`[Main]: go`)
		await this.page.goto('https://discord.com/app', {waitUntil: 'load'})
		await this.waitExecution()
		this.log(`[Main]: done`)
	}

	async login(): Promise<boolean> {
		// judge login state
		if (await this.isLogin()) {
			return true
		}
		try {
			// insert token to localStorage
			await this.page.evaluate((token) => {
				setInterval(() => {
					const iframe = document.createElement("iframe")
					document.body.appendChild(iframe)
					// @ts-ignore
					const localStorage = iframe.contentWindow.localStorage;
					localStorage.setItem('token', `"${token}"`);
				})
				setTimeout(() => {
					location.reload()
				}, 2500);
			}, this.options.token)
			// await this.page.waitForNavigation({waitUntil: 'load'})
			await this.waitExecution(5)
		} catch (e) {
			this.log("[login]: fail > ", e)
		}
		const isLogin = await this.waitLogin()
		if (isLogin) {
			this.log("[login] successful!")
		} else {
			this.log("[login] failed!")
		}
		return isLogin
	}

	async isLogin(): Promise<boolean> {
		const sidebar = await this.page.$('div[class*="sidebar"]')
		this.log("[login]: is in? ", sidebar != null ? "yes" : "no")
		return sidebar !== null
	}

	async waitLogin(): Promise<boolean> {
		this.log("[login]: wait")
		let tryCount = 0
		let isLogin = await this.isLogin()
		while (!isLogin && tryCount < this.options.waitLogin) {
			isLogin = await this.isLogin()
			tryCount++
			if (isLogin || tryCount >= this.options.waitLogin) {
				break
			}
			await this.waitExecution()
		}
		return isLogin
	}

	async shutdown(): Promise<void> {
		await this.browser.close()
	}

	async closeAllPopups(): Promise<void> {
		const btns = await this.page.$$(`button[aria-label="${this.label(Label.Close)}"]`)
		for (const btn of btns) {
			await btn.click()
			await this.waitExecution()
		}
	}

	private log(message: string, ...args: any[]) {
		const time = new Date().toISOString()
		console.log(message, ...args, time)
	}

	protected async waitExecution(ratio = 1) {
		return await (new Promise(r => setTimeout(r, this.options.waitExecution * ratio)))
	}
}
