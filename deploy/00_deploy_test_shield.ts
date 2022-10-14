import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const res = await deploy('TestShield', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  })

  console.log(
    `TestShield has been deployed to ${network.name} at ${res.address} with ${res.gasEstimates} gas`,
  )
}
export default func
func.tags = ["dev"]
