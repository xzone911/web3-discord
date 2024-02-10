import {program} from "commander"
import {runFaucet} from "./scripts/faucet"

program
	.command("faucet <project>")
	.description("Run cli for faucet")
	.option("-t,--token <token>", "provide discord token")
	.option("-a,--account <address>", "Provide wallet address")
	.option("-h,--headless", "Not show Chrome", false)
	.action((project, options) => {
		runFaucet(project, options)
	})

program.parse(process.argv)
