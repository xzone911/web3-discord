export default interface Message {
	channelId: string,
	messageId: string,
	messageContent: string | null,
	article: string | null,
	actions: any[]
}
