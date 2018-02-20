import { Frontend } from './service/frontend'
import { DeviceCommissioning } from './service/device-commissioning'
import { DeviceSimulation } from './service/device-simulation'
import { Accessories } from './service/accessories'

async function startAll() {
  // start all supporting services
  await Promise.all([
    new Accessories().start(),
    new DeviceCommissioning().start(),
    new DeviceSimulation().start()])

  // start Frontend
  await new Frontend().start()
}

startAll().catch(e => console.log(`[Index] Start failed: ${e}`))
