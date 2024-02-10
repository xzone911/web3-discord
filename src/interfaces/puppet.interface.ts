import Message from "./message.interface"
import {ElementHandle, NodeFor} from "puppeteer"

export default interface PuppetInterface {
	start(serverId?: string): Promise<void>
	shutdown(): Promise<void>
	goToMain(): Promise<void>
	goToChannel(serverId: string, channelId: string): Promise<void>
	goToServer(serverId: string): Promise<void>
	sendMessage(message: string): Promise<void>
	sendCommand(command: string, args?: string): Promise<void>
	getLastMsgRaw(): Promise<ElementHandle>
	getLastMsg(): Promise<Message>
	getMessage(messageId: string): Promise<Message>
	parseMessage(li: ElementHandle): Promise<Message>
	login(): Promise<boolean>
	isLogin(): Promise<boolean>
}
