import Puppet from "../puppet"
import {sayFaucetLog} from "../utils/promots"
import {readFile} from "fs/promises"
import {program} from "commander"
import PuppetOptions from "../utils/PuppetOptions";

interface FaucetOptions {
	token: string,
	account: string,
	headless?: boolean
}

export const runFaucet = async (project: string, options: FaucetOptions) => {
	sayFaucetLog()
	if (!options.token) throw new Error("Discord token not set!")
	if (!options.account) throw new Error("Faucet target address not set!")
	const str = await readFile("./faucets.json", "utf-8")
	const faucets = JSON.parse(str) as Record<string, {
		serverId: string,
		channelId: string,
		type: string,
		cycle: number,
		arg1: string
	}>
	const faucetInfo = faucets[project]
	if (!faucetInfo) {
		throw new Error(`Faucet attempt failed: 'project' ${project} is not found in faucets.json.`)
	}
	const {serverId, channelId, type, cycle, arg1} = faucetInfo
	const {token, account, headless} = options
	const puppet = new Puppet(PuppetOptions(token, headless))
	await puppet.start()
	await puppet.goToChannel(serverId, channelId)
	if (type === 'msg') {
		puppet.sendMessage(arg1 + ' ' + account)
		setInterval(() => {
			puppet.sendMessage(arg1 + ' ' + account)
		}, cycle * 1000)
	} else {
		puppet.sendCommand(arg1, account)
		setInterval(() => {
			puppet.sendCommand(arg1, account)
		}, cycle * 1000)
	}
}
