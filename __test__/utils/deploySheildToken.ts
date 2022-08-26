import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
// @ts-ignore
import { ethers } from 'hardhat'
import { Shield } from '../../types/contracts/Shield'

export const deployShieldToken = async ({
  owner,
  authSigner,
}: {
  owner?: SignerWithAddress
  authSigner?: SignerWithAddress
} = {}) => {
  const [defaultOwner] = await ethers.getSigners()
  const TokenContractFactory = await ethers.getContractFactory('Shield')
  const targetOwner = owner ?? defaultOwner
  const token = await TokenContractFactory.connect(targetOwner).deploy(
    authSigner?.address ?? targetOwner.address,
  )
  return [token, targetOwner, authSigner ?? targetOwner] as [
    Shield,
    SignerWithAddress,
    SignerWithAddress,
  ]
}
