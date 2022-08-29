import { deployShieldToken } from '../utils/deploySheildToken'
import { expect, assert } from 'chai'
import { ethers } from 'hardhat'
import { UnitParser } from '../utils/UnitParser'
import Chance from 'chance'
import { SafeMath } from '../utils/safeMath'
import { BigNumber } from 'ethers'
const chance = new Chance()

describe('UNIT TEST: Shield Token - deployment', () => {
  it('should return correct name when token is deployed', async () => {
    const [token] = await deployShieldToken()
    const tokenName = await token.name()

    expect(tokenName).to.equal('SHIELD')
  })

  it('should return correct symbol when token is deployed', async () => {
    const [token] = await deployShieldToken()
    const tokenName = await token.symbol()

    expect(tokenName).to.equal('SHIELD')
  })

  it('should throw error if authSigner address is empty address', async () => {
    const [owner] = await ethers.getSigners()
    const TokenContractFactory = await ethers.getContractFactory('Shield')
    return TokenContractFactory.connect(owner)
      .deploy('0x0000000000000000000000000000000000000000')
      .then(() => assert.fail())
      .catch((err: any) => {
        assert.include(err.message, 'Invalid addr')
      })
  })

  it('should set owner as the deployer', async () => {
    const [token, owner] = await deployShieldToken()
    const ownerAddress = await token.owner()

    expect(ownerAddress).to.equal(owner.address)
  })

  it('should set correct authSigner', async () => {
    const [token, owner, authSigner] = await deployShieldToken()
    const authSignerAddress = await token.authSigner()

    expect(authSignerAddress).to.equal(authSigner.address)
  })

  it('should set deploytime as the block.timestamp', async () => {
    const [token, owner] = await deployShieldToken()
    const provider = await ethers.provider
    const latestBlockNumber = await provider.getBlockNumber()
    const lastestBlock = await provider.getBlock(latestBlockNumber)

    const deployTime = await token.deployTime()

    expect(deployTime).to.equal(lastestBlock.timestamp)
  })

  it('should mint reserve amount of token to the deployer', async () => {
    const [token, owner] = await deployShieldToken()

    const ownerBalance = await token.balanceOf(owner.address)
    const reservedTokenAmount = await token.RESERVE()

    expect(ownerBalance).to.equal(reservedTokenAmount)
  })
})
