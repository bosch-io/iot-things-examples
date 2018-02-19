import { Frontend } from './service/frontend'
import { DeviceCommissioning } from './service/device-commissioning'
import { DeviceSimulation } from './service/device-simulation'
import { Accessories } from './service/accessories'

// async function sleep(milliseconds): Promise<void> {
//   return new Promise<void>(resolve => setTimeout(resolve, milliseconds))
// }

async function startAll() {
  await new Accessories().start()
  await new DeviceCommissioning().start()
  await new DeviceSimulation().start()

  await new Frontend().start()
}

startAll().catch(console.log)
