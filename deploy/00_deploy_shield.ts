import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre as any
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const res = await deploy('Shield', {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  })

  console.log(
    `Shield has been deployed to ${network.name} at ${res.address} with ${res.gasEstimates} gas`,
  )
}
export default func
func.tags = ['production']
